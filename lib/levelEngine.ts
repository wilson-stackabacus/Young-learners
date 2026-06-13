/**
 * Level engine — the backend brain (4 subjects: math, english, reading, science).
 *
 *   - getMap(userId, subject):     all stages for that subject + per-user state
 *   - getProblem(userId, stage):   generate a problem (answer kept server-side)
 *   - submitAnswer(...):           check, run progression or a boss battle, persist
 *
 * Subject is derived from the stage id (math 1.., english 1001.., reading 2001..,
 * science 3001..). Per-subject XP / streak / stage live in SubjectProgress (the
 * source of truth); User keeps aggregate totals for the legacy global views.
 */

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  levelForStage,
  worldMeta,
  catalogForSubject,
  firstStageOf,
  lastStageOf,
  subjectOfStage,
  type CatalogLevel,
} from "./levelCatalog";
import { generateForLevel } from "./levels/generators";
import { generateEnglishForLevel } from "./levels/english/generators";
import { generateReadingForLevel } from "./levels/reading/generators";
import { generateScienceForLevel } from "./levels/science/generators";
import {
  PROGRESSION,
  BOSS,
  accuracyFromRecent,
  pushRecent,
  gainForCorrect,
  starsForAccuracy,
  difficultyBucket,
} from "./progression";
import { checkAnswer } from "./answer";
import { aiHint } from "./ai/geminiHint";
import { awardXp } from "./gamification/xp";
import { updateStreak } from "./gamification/streak";
import {
  evaluateBadges,
  parseBadgeRule,
  type BadgeDefinition,
  type NewBadge,
} from "./gamification/badges";
import type {
  AnswerResponse,
  BossState,
  LevelInfo,
  LevelState,
  LevelStatus,
  MapResponse,
  Problem,
  ProblemInputType,
  ProblemResponse,
  Stats,
  Subject,
  UserSummary,
} from "@/shared/contract";

export class EngineError extends Error {
  constructor(public code: string, public status = 400) {
    super(code);
  }
}

type DB = Prisma.TransactionClient;
type UserRow = Prisma.UserGetPayload<{}>;
type SubjectRow = Prisma.SubjectProgressGetPayload<{}>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get-or-create the per-subject progress row (source of truth for XP/streak/stage). */
async function getSubjectProgress(db: DB, userId: string, subject: Subject): Promise<SubjectRow> {
  return db.subjectProgress.upsert({
    where: { userId_subject: { userId, subject } },
    update: {},
    create: { userId, subject, currentStage: firstStageOf(subject) },
  });
}

function toLevelInfo(l: CatalogLevel): LevelInfo {
  return {
    stage: l.stage,
    subject: l.subject,
    tier: l.tier,
    stageInTier: l.stageInTier,
    kind: l.kind,
    skills: l.skills,
    skillNames: l.skillNames,
    world: l.world,
    difficulty: l.difficulty,
    isBoss: l.isBoss,
    ...(l.testsLevel !== undefined ? { testsLevel: l.testsLevel } : {}),
  };
}

function toSummary(user: UserRow, sp: SubjectRow): UserSummary {
  return {
    id: user.id,
    displayName: user.displayName,
    totalXp: sp.totalXp,
    currentStage: sp.currentStage,
    streakDays: sp.currentStreak,
  };
}

function deriveStatus(stage: number, userStage: number): LevelStatus {
  if (stage < userStage) return "cleared";
  if (stage === userStage) return "current";
  return "locked";
}

function bossStateOf(bossHp: number, hearts: number, defeated = false, failed = false): BossState {
  return { hp: bossHp, maxHp: BOSS.HP, hearts, maxHearts: BOSS.HEARTS, defeated, failed };
}

function generateFor(cat: CatalogLevel) {
  switch (cat.subject) {
    case "english": return generateEnglishForLevel(cat.skills, cat.difficulty);
    case "reading": return generateReadingForLevel(cat.skills, cat.difficulty);
    case "science": return generateScienceForLevel(cat.skills, cat.difficulty);
    default: return generateForLevel(cat.skills, cat.difficulty);
  }
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export async function getMap(userId: string, subject: Subject = "math"): Promise<MapResponse> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sp = await getSubjectProgress(prisma, userId, subject);
  const rows = await prisma.levelProgress.findMany({ where: { userId } });
  const byStage = new Map(rows.map((r) => [r.stage, r]));

  const levels: LevelState[] = catalogForSubject(subject).map((l) => {
    const r = byStage.get(l.stage);
    const status: LevelStatus = r ? (r.status as LevelStatus) : deriveStatus(l.stage, sp.currentStage);
    return { ...toLevelInfo(l), status, progress: r?.progress ?? 0, stars: r?.stars ?? 0 };
  });

  return { user: toSummary(user, sp), worlds: worldMeta(subject), levels, subject };
}

// ─── Problem generation ──────────────────────────────────────────────────────

async function createPending(db: DB, userId: string, stage: number, isBoss: boolean): Promise<Problem> {
  const cat = levelForStage(stage);
  if (!cat) throw new EngineError("bad_stage", 404);
  const g = generateFor(cat);
  const token = "pb_" + randomUUID();

  await db.pendingProblem.deleteMany({ where: { userId } });
  await db.pendingProblem.create({
    data: {
      token, userId, stage,
      prompt: g.prompt, latex: g.latex, inputType: g.inputType,
      choices: g.choices ? JSON.stringify(g.choices) : null,
      answer: g.answer, hints: JSON.stringify(g.hints), solution: g.solution,
      commonMistakes: JSON.stringify(g.commonMistakes), isBoss,
    },
  });

  return {
    token, stage, prompt: g.prompt, latex: g.latex, inputType: g.inputType,
    ...(g.choices ? { choices: g.choices } : {}),
  };
}

export async function getProblem(userId: string, stage: number): Promise<ProblemResponse> {
  const subject = subjectOfStage(stage);
  if (stage < firstStageOf(subject) || stage > lastStageOf(subject)) throw new EngineError("bad_stage", 404);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sp = await getSubjectProgress(prisma, userId, subject);
  if (stage > sp.currentStage) throw new EngineError("locked", 403);

  const cat = levelForStage(stage)!;

  if (cat.isBoss) {
    const prog = await prisma.levelProgress.upsert({
      where: { userId_stage: { userId, stage } },
      update: {},
      create: { userId, stage, status: deriveStatus(stage, sp.currentStage), bossHp: BOSS.HP, hearts: BOSS.HEARTS },
    });
    let bossHp = prog.bossHp;
    let hearts = prog.hearts;
    if (bossHp === null || hearts === null) {
      bossHp = BOSS.HP;
      hearts = BOSS.HEARTS;
      await prisma.levelProgress.update({ where: { id: prog.id }, data: { bossHp, hearts } });
    }
    const problem = await createPending(prisma, userId, stage, true);
    const stats: Stats = { totalXp: sp.totalXp, accuracy: 0, progress: 0, stars: prog.stars, streakDays: sp.currentStreak };
    return { level: toLevelInfo(cat), problem, stats, boss: bossStateOf(bossHp, hearts) };
  }

  const prog = await prisma.levelProgress.upsert({
    where: { userId_stage: { userId, stage } },
    update: {},
    create: { userId, stage, status: deriveStatus(stage, sp.currentStage) },
  });
  const problem = await createPending(prisma, userId, stage, false);
  const accuracy = accuracyFromRecent(JSON.parse(prog.recentResults) as boolean[]);
  const stats: Stats = {
    totalXp: sp.totalXp, accuracy, progress: prog.progress, stars: prog.stars, streakDays: sp.currentStreak,
  };
  return { level: toLevelInfo(cat), problem, stats };
}

// ─── Answer submission ───────────────────────────────────────────────────────

export async function submitAnswer(
  userId: string,
  stage: number,
  token: string,
  answer: string,
): Promise<AnswerResponse> {
  const pending = await prisma.pendingProblem.findUnique({ where: { token } });
  if (!pending || pending.userId !== userId || pending.stage !== stage) {
    throw new EngineError("invalid_token", 409);
  }
  const cat = levelForStage(stage)!;
  const subject = cat.subject;

  // Practice + wrong + hints remain → return a hint (outside any transaction).
  if (!cat.isBoss) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const sp = await getSubjectProgress(prisma, userId, subject);
    const prog =
      (await prisma.levelProgress.findUnique({ where: { userId_stage: { userId, stage } } })) ??
      (await prisma.levelProgress.create({ data: { userId, stage, status: deriveStatus(stage, sp.currentStage) } }));
    const commonMistakes = JSON.parse(pending.commonMistakes);
    const check = checkAnswer(pending.inputType as ProblemInputType, pending.answer, answer, commonMistakes);

    if (!check.correct && pending.attemptsUsed + 1 <= PROGRESSION.HINTS_BEFORE_SOLUTION) {
      const usedNow = pending.attemptsUsed + 1;
      const hints = JSON.parse(pending.hints) as string[];
      let hint = check.mistake?.hint;
      if (!hint) {
        const ai = await aiHint({ prompt: pending.prompt, correctAnswer: pending.answer, givenAnswer: answer, skillNames: cat.skillNames });
        hint = ai ?? hints[usedNow - 1] ?? hints[hints.length - 1];
      }
      await prisma.pendingProblem.update({ where: { token }, data: { attemptsUsed: usedNow } });
      return {
        correct: false, state: "hint", hint,
        attemptsRemaining: PROGRESSION.HINTS_BEFORE_SOLUTION - usedNow,
        stats: {
          totalXp: sp.totalXp, accuracy: accuracyFromRecent(JSON.parse(prog.recentResults) as boolean[]),
          progress: prog.progress, stars: prog.stars, streakDays: sp.currentStreak, xpGained: 0, progressDelta: 0,
        },
      };
    }
  }

  // Resolved answer (solve / reveal) or any boss answer → atomic transaction.
  const result = await prisma.$transaction(
    async (tx) => {
      const pendingTx = await tx.pendingProblem.findUnique({ where: { token } });
      if (!pendingTx || pendingTx.userId !== userId || pendingTx.stage !== stage) {
        throw new EngineError("invalid_token", 409);
      }
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const sp = await getSubjectProgress(tx, userId, subject);
      let prog = await tx.levelProgress.findUnique({ where: { userId_stage: { userId, stage } } });
      if (!prog) {
        prog = await tx.levelProgress.create({
          data: {
            userId, stage, status: deriveStatus(stage, sp.currentStage),
            ...(cat.isBoss ? { bossHp: BOSS.HP, hearts: BOSS.HEARTS } : {}),
          },
        });
      }
      const ctx: AnswerCtx = { user, cat, subject, sp, prog, pending: pendingTx, answer };
      return cat.isBoss ? handleBossAnswer(tx, ctx) : handlePracticeAnswer(tx, ctx);
    },
    { timeout: 20000, maxWait: 10000 },
  );

  await evaluateAndAwardBadges(prisma, userId).catch(() => {});
  return result;
}

type AnswerCtx = {
  user: UserRow;
  cat: CatalogLevel;
  subject: Subject;
  sp: SubjectRow;
  prog: Prisma.LevelProgressGetPayload<{}>;
  pending: Prisma.PendingProblemGetPayload<{}>;
  answer: string;
};

// ── Practice stages: progress bar + two-hint flow ──
async function handlePracticeAnswer(tx: DB, ctx: AnswerCtx): Promise<AnswerResponse> {
  const { user, cat, subject, sp, prog, pending, answer } = ctx;
  const stage = cat.stage;
  const commonMistakes = JSON.parse(pending.commonMistakes);
  const check = checkAnswer(pending.inputType as ProblemInputType, pending.answer, answer, commonMistakes);

  const outcomeCorrect = check.correct;
  const solvedAfterHint = outcomeCorrect && pending.attemptsUsed > 0;
  const recent = pushRecent(JSON.parse(prog.recentResults) as boolean[], outcomeCorrect);
  const accuracy = accuracyFromRecent(recent);
  const progressDelta = outcomeCorrect ? gainForCorrect(accuracy) : -PROGRESSION.WRONG_PENALTY;
  const newProgress = Math.max(0, Math.min(PROGRESSION.ADVANCE_AT, prog.progress + progressDelta));

  const xp = awardXp({ difficulty: difficultyBucket(cat.difficulty), timeMs: 8000, usedHint: pending.attemptsUsed > 0, streakDays: sp.currentStreak, correct: outcomeCorrect });
  const streak = updateStreak({ currentStreak: sp.currentStreak, longestStreak: sp.longestStreak, lastActiveDay: sp.lastActiveDay, freezesAvailable: user.freezesAvailable });

  const cleared = newProgress >= PROGRESSION.ADVANCE_AT;
  let status: LevelStatus = (prog.status as LevelStatus) === "locked" ? "current" : (prog.status as LevelStatus);
  let stars = prog.stars;
  let clearedAt = prog.clearedAt;
  let newStage = sp.currentStage;
  let advanced: { toStage: number } | undefined;

  if (cleared) {
    status = "cleared";
    stars = Math.max(prog.stars, starsForAccuracy(accuracy));
    clearedAt = prog.clearedAt ?? new Date();
    if (stage === sp.currentStage && stage < lastStageOf(subject)) {
      newStage = stage + 1;
      advanced = { toStage: newStage };
    }
  }

  await persistResolution(tx, {
    userId: user.id, subject, stage, pending, answer, correct: outcomeCorrect,
    hintsUsed: pending.attemptsUsed, solvedAfterHint, isBoss: false, xpAwarded: xp.total,
    progData: { progress: newProgress, status, stars, totalCorrect: prog.totalCorrect + (outcomeCorrect ? 1 : 0), totalAttempts: prog.totalAttempts + 1, recentResults: JSON.stringify(recent), clearedAt },
    progId: prog.id, advanced, spId: sp.id, newStage, newSubjectXp: sp.totalXp + xp.total,
    newUserTotalXp: user.totalXp + xp.total, userLongest: Math.max(user.longestStreak, streak.longestStreak), streak,
  });

  const nextStage = advanced ? newStage : stage;
  const nextProblem = await createPending(tx, user.id, nextStage, levelForStage(nextStage)?.isBoss ?? false);
  const stats = advanced
    ? { totalXp: sp.totalXp + xp.total, accuracy: 0, progress: 0, stars: 0, streakDays: streak.currentStreak, xpGained: xp.total, progressDelta }
    : { totalXp: sp.totalXp + xp.total, accuracy, progress: newProgress, stars, streakDays: streak.currentStreak, xpGained: xp.total, progressDelta };

  return {
    correct: outcomeCorrect, state: outcomeCorrect ? "solved" : "revealed",
    solution: pending.solution,
    attemptsRemaining: outcomeCorrect ? PROGRESSION.HINTS_BEFORE_SOLUTION - pending.attemptsUsed : 0,
    stats, advanced, nextProblem,
  };
}

// ── Boss stages: HP + hearts gauntlet, no hints ──
async function handleBossAnswer(tx: DB, ctx: AnswerCtx): Promise<AnswerResponse> {
  const { user, cat, subject, sp, prog, pending, answer } = ctx;
  const stage = cat.stage;
  const check = checkAnswer(pending.inputType as ProblemInputType, pending.answer, answer);

  let bossHp = prog.bossHp ?? BOSS.HP;
  let hearts = prog.hearts ?? BOSS.HEARTS;
  let defeated = false;
  let failed = false;
  let xpGained = 0;

  if (check.correct) {
    bossHp = Math.max(0, bossHp - 1);
    defeated = bossHp <= 0;
    xpGained = awardXp({ difficulty: difficultyBucket(cat.difficulty), timeMs: 8000, usedHint: false, streakDays: sp.currentStreak, correct: true }).total;
  } else {
    hearts = Math.max(0, hearts - 1);
    failed = hearts <= 0;
  }

  const streak = updateStreak({ currentStreak: sp.currentStreak, longestStreak: sp.longestStreak, lastActiveDay: sp.lastActiveDay, freezesAvailable: user.freezesAvailable });

  let status: LevelStatus = (prog.status as LevelStatus) === "locked" ? "current" : (prog.status as LevelStatus);
  let stars = prog.stars;
  let clearedAt = prog.clearedAt;
  let newStage = sp.currentStage;
  let advanced: { toStage: number } | undefined;

  if (defeated) {
    status = "cleared";
    stars = 3;
    clearedAt = prog.clearedAt ?? new Date();
    xpGained += BOSS.XP_BONUS;
    if (stage === sp.currentStage && stage < lastStageOf(subject)) {
      newStage = stage + 1;
      advanced = { toStage: newStage };
    }
  }
  if (failed) {
    bossHp = BOSS.HP;
    hearts = BOSS.HEARTS;
  }

  await persistResolution(tx, {
    userId: user.id, subject, stage, pending, answer, correct: check.correct,
    hintsUsed: 0, solvedAfterHint: false, isBoss: true, xpAwarded: xpGained,
    progData: { status, stars, bossHp, hearts, totalCorrect: prog.totalCorrect + (check.correct ? 1 : 0), totalAttempts: prog.totalAttempts + 1, clearedAt },
    progId: prog.id, advanced, spId: sp.id, newStage, newSubjectXp: sp.totalXp + xpGained,
    newUserTotalXp: user.totalXp + xpGained, userLongest: Math.max(user.longestStreak, streak.longestStreak), streak,
  });

  const nextStage = defeated ? newStage : stage;
  const nextProblem = await createPending(tx, user.id, nextStage, levelForStage(nextStage)?.isBoss ?? false);

  return {
    correct: check.correct, state: check.correct ? "solved" : "revealed",
    ...(check.correct ? {} : { solution: pending.solution }),
    attemptsRemaining: hearts,
    stats: { totalXp: sp.totalXp + xpGained, accuracy: 0, progress: 0, stars, streakDays: streak.currentStreak, xpGained, progressDelta: 0 },
    advanced, nextProblem, boss: bossStateOf(defeated ? 0 : bossHp, hearts, defeated, failed),
  };
}

// ── Shared persistence for a resolved answer ──
async function persistResolution(
  tx: DB,
  p: {
    userId: string;
    subject: Subject;
    stage: number;
    pending: Prisma.PendingProblemGetPayload<{}>;
    answer: string;
    correct: boolean;
    hintsUsed: number;
    solvedAfterHint: boolean;
    isBoss: boolean;
    xpAwarded: number;
    progData: Prisma.LevelProgressUpdateInput;
    progId: string;
    advanced?: { toStage: number };
    spId: string;
    newStage: number;
    newSubjectXp: number;
    newUserTotalXp: number;
    userLongest: number;
    streak: { currentStreak: number; longestStreak: number; lastActiveDay: string; freezesAvailable: number };
  },
): Promise<void> {
  await tx.attempt.create({
    data: {
      userId: p.userId, stage: p.stage, prompt: p.pending.prompt, givenAnswer: p.answer,
      correct: p.correct, hintsUsed: p.hintsUsed, solvedAfterHint: p.solvedAfterHint, isBoss: p.isBoss, xpAwarded: p.xpAwarded,
    },
  });
  await tx.levelProgress.update({ where: { id: p.progId }, data: p.progData });
  if (p.advanced) {
    await tx.levelProgress.upsert({
      where: { userId_stage: { userId: p.userId, stage: p.advanced.toStage } },
      update: { status: "current" },
      create: {
        userId: p.userId, stage: p.advanced.toStage, status: "current",
        ...(levelForStage(p.advanced.toStage)?.isBoss ? { bossHp: BOSS.HP, hearts: BOSS.HEARTS } : {}),
      },
    });
  }
  // Per-subject truth.
  await tx.subjectProgress.update({
    where: { id: p.spId },
    data: {
      currentStage: p.newStage, totalXp: p.newSubjectXp,
      currentStreak: p.streak.currentStreak, longestStreak: p.streak.longestStreak, lastActiveDay: p.streak.lastActiveDay,
    },
  });
  // User aggregate (global leaderboard / header backward-compat). Keep the math
  // pointer in sync for the legacy currentStage field.
  await tx.user.update({
    where: { id: p.userId },
    data: {
      totalXp: p.newUserTotalXp,
      currentStreak: p.streak.currentStreak, longestStreak: p.userLongest,
      lastActiveDay: p.streak.lastActiveDay, freezesAvailable: p.streak.freezesAvailable,
      ...(p.subject === "math" ? { currentStage: p.newStage } : {}),
    },
  });
  await tx.pendingProblem.delete({ where: { token: p.pending.token } });
}

// ─── Badges ──────────────────────────────────────────────────────────────────

async function evaluateAndAwardBadges(tx: DB, userId: string): Promise<NewBadge[]> {
  const [user, allBadges, owned, attempts, clearedCount] = await Promise.all([
    tx.user.findUniqueOrThrow({ where: { id: userId } }),
    tx.badge.findMany(),
    tx.userBadge.findMany({ where: { userId } }),
    tx.attempt.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { correct: true } }),
    tx.levelProgress.count({ where: { userId, status: "cleared" } }),
  ]);

  let run = 0;
  let best = 0;
  for (const a of attempts) {
    if (a.correct) { run += 1; best = Math.max(best, run); } else { run = 0; }
  }

  const snapshot = {
    user: { id: user.id, totalXp: user.totalXp, currentStreak: user.currentStreak, longestStreak: user.longestStreak },
    currentStage: user.currentStage,
    solvedCount: attempts.filter((a) => a.correct).length,
    clearedStages: clearedCount,
    bestPerfectStreak: best,
    hasAnyAttempt: attempts.length > 0,
  };

  const defs: BadgeDefinition[] = allBadges.map((b) => ({
    id: b.id, slug: b.slug, name: b.name, description: b.description, tier: b.tier, rule: parseBadgeRule(b.rule),
  }));

  const earned = evaluateBadges(defs, snapshot, new Set(owned.map((o) => o.badgeId)));
  if (earned.length === 0) return [];
  await tx.userBadge.createMany({ data: earned.map((b) => ({ userId, badgeId: b.badgeId })) });
  return earned;
}
