/**
 * Level engine — the backend brain.
 *
 * Produces the contract-shaped outputs (docs/API.md, shared/contract.ts):
 *   - getMap:     all stages with this user's state
 *   - getProblem: generate a problem (answer kept server-side) + level + stats
 *   - submitAnswer: check, run progression (or a boss battle), persist, respond
 *
 * Two stage kinds behave differently on submit:
 *   - practice (pure/blend): progress-bar model + two-hint flow
 *   - boss: a no-hints gauntlet — correct hits damage the boss, wrong answers
 *     cost a heart; clear the boss (HP 0) to unlock the next whole level.
 */

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import {
  buildCatalog,
  levelForStage,
  worldMeta,
  TOTAL_STAGES,
  type CatalogLevel,
} from "./levelCatalog";
import { generateForLevel } from "./levels/generators";
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
  UserSummary,
} from "@/shared/contract";

export class EngineError extends Error {
  constructor(public code: string, public status = 400) {
    super(code);
  }
}

type DB = Prisma.TransactionClient;

// ─── Mappers ─────────────────────────────────────────────────────────────────

function toLevelInfo(l: CatalogLevel): LevelInfo {
  return {
    stage: l.stage,
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

function toSummary(user: {
  id: string;
  displayName: string;
  totalXp: number;
  currentStage: number;
  currentStreak: number;
}): UserSummary {
  return {
    id: user.id,
    displayName: user.displayName,
    totalXp: user.totalXp,
    currentStage: user.currentStage,
    streakDays: user.currentStreak,
  };
}

function deriveStatus(stage: number, currentStage: number): LevelStatus {
  if (stage < currentStage) return "cleared";
  if (stage === currentStage) return "current";
  return "locked";
}

function bossStateOf(bossHp: number, hearts: number, defeated = false, failed = false): BossState {
  return { hp: bossHp, maxHp: BOSS.HP, hearts, maxHearts: BOSS.HEARTS, defeated, failed };
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export async function getMap(userId: string): Promise<MapResponse> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const rows = await prisma.levelProgress.findMany({ where: { userId } });
  const byStage = new Map(rows.map((r) => [r.stage, r]));

  const levels: LevelState[] = buildCatalog().map((l) => {
    const r = byStage.get(l.stage);
    const status: LevelStatus = r ? (r.status as LevelStatus) : deriveStatus(l.stage, user.currentStage);
    return { ...toLevelInfo(l), status, progress: r?.progress ?? 0, stars: r?.stars ?? 0 };
  });

  return { user: toSummary(user), worlds: worldMeta(), levels };
}

// ─── Problem generation ──────────────────────────────────────────────────────

/** Generate a problem, store the answer server-side, return the client view. */
async function createPending(db: DB, userId: string, stage: number, isBoss: boolean): Promise<Problem> {
  const cat = levelForStage(stage);
  if (!cat) throw new EngineError("bad_stage", 404);
  const g = generateForLevel(cat.skills, cat.difficulty);
  const token = "pb_" + randomUUID();

  await db.pendingProblem.deleteMany({ where: { userId } });
  await db.pendingProblem.create({
    data: {
      token,
      userId,
      stage,
      prompt: g.prompt,
      latex: g.latex,
      inputType: g.inputType,
      choices: g.choices ? JSON.stringify(g.choices) : null,
      answer: g.answer,
      hints: JSON.stringify(g.hints),
      solution: g.solution,
      commonMistakes: JSON.stringify(g.commonMistakes),
      isBoss,
    },
  });

  return {
    token,
    stage,
    prompt: g.prompt,
    latex: g.latex,
    inputType: g.inputType,
    ...(g.choices ? { choices: g.choices } : {}),
  };
}

export async function getProblem(userId: string, stage: number): Promise<ProblemResponse> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (stage < 1 || stage > TOTAL_STAGES) throw new EngineError("bad_stage", 404);
  if (stage > user.currentStage) throw new EngineError("locked", 403);

  const cat = levelForStage(stage)!;

  if (cat.isBoss) {
    // Start (or continue) the boss battle.
    const prog = await prisma.levelProgress.upsert({
      where: { userId_stage: { userId, stage } },
      update: {},
      create: {
        userId,
        stage,
        status: deriveStatus(stage, user.currentStage),
        bossHp: BOSS.HP,
        hearts: BOSS.HEARTS,
      },
    });
    let bossHp = prog.bossHp;
    let hearts = prog.hearts;
    if (bossHp === null || hearts === null) {
      bossHp = BOSS.HP;
      hearts = BOSS.HEARTS;
      await prisma.levelProgress.update({ where: { id: prog.id }, data: { bossHp, hearts } });
    }
    const problem = await createPending(prisma, userId, stage, true);
    const stats: Stats = { totalXp: user.totalXp, accuracy: 0, progress: 0, stars: prog.stars, streakDays: user.currentStreak };
    return { level: toLevelInfo(cat), problem, stats, boss: bossStateOf(bossHp, hearts) };
  }

  const prog = await prisma.levelProgress.upsert({
    where: { userId_stage: { userId, stage } },
    update: {},
    create: { userId, stage, status: deriveStatus(stage, user.currentStage) },
  });
  const problem = await createPending(prisma, userId, stage, false);
  const accuracy = accuracyFromRecent(JSON.parse(prog.recentResults) as boolean[]);
  const stats: Stats = {
    totalXp: user.totalXp,
    accuracy,
    progress: prog.progress,
    stars: prog.stars,
    streakDays: user.currentStreak,
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
  return prisma.$transaction(async (tx) => {
    const pending = await tx.pendingProblem.findUnique({ where: { token } });
    if (!pending || pending.userId !== userId || pending.stage !== stage) {
      throw new EngineError("invalid_token", 409);
    }
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const cat = levelForStage(stage)!;

    let prog = await tx.levelProgress.findUnique({ where: { userId_stage: { userId, stage } } });
    if (!prog) {
      prog = await tx.levelProgress.create({
        data: {
          userId,
          stage,
          status: deriveStatus(stage, user.currentStage),
          ...(cat.isBoss ? { bossHp: BOSS.HP, hearts: BOSS.HEARTS } : {}),
        },
      });
    }

    return cat.isBoss
      ? handleBossAnswer(tx, { user, cat, prog, pending, answer })
      : handlePracticeAnswer(tx, { user, cat, prog, pending, answer });
  });
}

type AnswerCtx = {
  user: Prisma.UserGetPayload<{}>;
  cat: CatalogLevel;
  prog: Prisma.LevelProgressGetPayload<{}>;
  pending: Prisma.PendingProblemGetPayload<{}>;
  answer: string;
};

// ── Practice stages: progress bar + two-hint flow ──
async function handlePracticeAnswer(tx: DB, ctx: AnswerCtx): Promise<AnswerResponse> {
  const { user, cat, prog, pending, answer } = ctx;
  const stage = cat.stage;
  const hints = JSON.parse(pending.hints) as string[];
  const commonMistakes = JSON.parse(pending.commonMistakes);
  const check = checkAnswer(pending.inputType as ProblemInputType, pending.answer, answer, commonMistakes);

  // Wrong, hints remain → return a hint, keep the problem.
  if (!check.correct && pending.attemptsUsed + 1 <= PROGRESSION.HINTS_BEFORE_SOLUTION) {
    const usedNow = pending.attemptsUsed + 1;
    await tx.pendingProblem.update({ where: { token: pending.token }, data: { attemptsUsed: usedNow } });
    const hint = check.mistake?.hint ?? hints[usedNow - 1] ?? hints[hints.length - 1];
    const accuracy = accuracyFromRecent(JSON.parse(prog.recentResults) as boolean[]);
    return {
      correct: false,
      state: "hint",
      hint,
      attemptsRemaining: PROGRESSION.HINTS_BEFORE_SOLUTION - usedNow,
      stats: {
        totalXp: user.totalXp,
        accuracy,
        progress: prog.progress,
        stars: prog.stars,
        streakDays: user.currentStreak,
        xpGained: 0,
        progressDelta: 0,
      },
    };
  }

  const outcomeCorrect = check.correct;
  const solvedAfterHint = outcomeCorrect && pending.attemptsUsed > 0;
  const recent = pushRecent(JSON.parse(prog.recentResults) as boolean[], outcomeCorrect);
  const accuracy = accuracyFromRecent(recent);
  const progressDelta = outcomeCorrect ? gainForCorrect(accuracy) : -PROGRESSION.WRONG_PENALTY;
  const newProgress = Math.max(0, Math.min(PROGRESSION.ADVANCE_AT, prog.progress + progressDelta));

  const xp = awardXp({
    difficulty: difficultyBucket(cat.difficulty),
    timeMs: 8000,
    usedHint: pending.attemptsUsed > 0,
    streakDays: user.currentStreak,
    correct: outcomeCorrect,
  });
  const streak = updateStreak({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveDay: user.lastActiveDay,
    freezesAvailable: user.freezesAvailable,
  });

  const cleared = newProgress >= PROGRESSION.ADVANCE_AT;
  let status: LevelStatus = (prog.status as LevelStatus) === "locked" ? "current" : (prog.status as LevelStatus);
  let stars = prog.stars;
  let clearedAt = prog.clearedAt;
  let newCurrentStage = user.currentStage;
  let advanced: { toStage: number } | undefined;

  if (cleared) {
    status = "cleared";
    stars = Math.max(prog.stars, starsForAccuracy(accuracy));
    clearedAt = prog.clearedAt ?? new Date();
    if (stage === user.currentStage && stage < TOTAL_STAGES) {
      newCurrentStage = stage + 1;
      advanced = { toStage: newCurrentStage };
    }
  }

  const newTotalXp = user.totalXp + xp.total;
  await persistResolution(tx, {
    userId: user.id, stage, pending, answer, correct: outcomeCorrect,
    hintsUsed: pending.attemptsUsed, solvedAfterHint, isBoss: false, xpAwarded: xp.total,
    progData: { progress: newProgress, status, stars, totalCorrect: prog.totalCorrect + (outcomeCorrect ? 1 : 0), totalAttempts: prog.totalAttempts + 1, recentResults: JSON.stringify(recent), clearedAt },
    progId: prog.id, advanced, newCurrentStage, newTotalXp, streak,
  });

  const nextStage = advanced ? newCurrentStage : stage;
  const nextProblem = await createPending(tx, user.id, nextStage, levelForStage(nextStage)?.isBoss ?? false);
  const stats = advanced
    ? { totalXp: newTotalXp, accuracy: 0, progress: 0, stars: 0, streakDays: streak.currentStreak, xpGained: xp.total, progressDelta }
    : { totalXp: newTotalXp, accuracy, progress: newProgress, stars, streakDays: streak.currentStreak, xpGained: xp.total, progressDelta };

  return {
    correct: outcomeCorrect,
    state: outcomeCorrect ? "solved" : "revealed",
    solution: pending.solution,
    attemptsRemaining: outcomeCorrect ? PROGRESSION.HINTS_BEFORE_SOLUTION - pending.attemptsUsed : 0,
    stats,
    advanced,
    nextProblem,
  };
}

// ── Boss stages: HP + hearts gauntlet, no hints ──
async function handleBossAnswer(tx: DB, ctx: AnswerCtx): Promise<AnswerResponse> {
  const { user, cat, prog, pending, answer } = ctx;
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
    xpGained = awardXp({
      difficulty: difficultyBucket(cat.difficulty),
      timeMs: 8000,
      usedHint: false,
      streakDays: user.currentStreak,
      correct: true,
    }).total;
  } else {
    hearts = Math.max(0, hearts - 1);
    failed = hearts <= 0;
  }

  const streak = updateStreak({
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActiveDay: user.lastActiveDay,
    freezesAvailable: user.freezesAvailable,
  });

  let status: LevelStatus = (prog.status as LevelStatus) === "locked" ? "current" : (prog.status as LevelStatus);
  let stars = prog.stars;
  let clearedAt = prog.clearedAt;
  let newCurrentStage = user.currentStage;
  let advanced: { toStage: number } | undefined;

  if (defeated) {
    status = "cleared";
    stars = 3;
    clearedAt = prog.clearedAt ?? new Date();
    xpGained += BOSS.XP_BONUS;
    if (stage === user.currentStage && stage < TOTAL_STAGES) {
      newCurrentStage = stage + 1;
      advanced = { toStage: newCurrentStage };
    }
  }
  if (failed) {
    // The fight resets — restore boss HP and hearts.
    bossHp = BOSS.HP;
    hearts = BOSS.HEARTS;
  }

  const newTotalXp = user.totalXp + xpGained;
  await persistResolution(tx, {
    userId: user.id, stage, pending, answer, correct: check.correct,
    hintsUsed: 0, solvedAfterHint: false, isBoss: true, xpAwarded: xpGained,
    progData: { status, stars, bossHp, hearts, totalCorrect: prog.totalCorrect + (check.correct ? 1 : 0), totalAttempts: prog.totalAttempts + 1, clearedAt },
    progId: prog.id, advanced, newCurrentStage, newTotalXp, streak,
  });

  const nextStage = defeated ? newCurrentStage : stage;
  const nextProblem = await createPending(tx, user.id, nextStage, levelForStage(nextStage)?.isBoss ?? false);

  return {
    correct: check.correct,
    state: check.correct ? "solved" : "revealed",
    ...(check.correct ? {} : { solution: pending.solution }),
    attemptsRemaining: hearts,
    stats: {
      totalXp: newTotalXp,
      accuracy: 0,
      progress: 0,
      stars,
      streakDays: streak.currentStreak,
      xpGained,
      progressDelta: 0,
    },
    advanced,
    nextProblem,
    boss: bossStateOf(defeated ? 0 : bossHp, hearts, defeated, failed),
  };
}

// ── Shared persistence for a resolved answer ──
async function persistResolution(
  tx: DB,
  p: {
    userId: string;
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
    newCurrentStage: number;
    newTotalXp: number;
    streak: { currentStreak: number; longestStreak: number; lastActiveDay: string; freezesAvailable: number };
  },
): Promise<void> {
  await tx.attempt.create({
    data: {
      userId: p.userId,
      stage: p.stage,
      prompt: p.pending.prompt,
      givenAnswer: p.answer,
      correct: p.correct,
      hintsUsed: p.hintsUsed,
      solvedAfterHint: p.solvedAfterHint,
      isBoss: p.isBoss,
      xpAwarded: p.xpAwarded,
    },
  });
  await tx.levelProgress.update({ where: { id: p.progId }, data: p.progData });
  if (p.advanced) {
    await tx.levelProgress.upsert({
      where: { userId_stage: { userId: p.userId, stage: p.advanced.toStage } },
      update: { status: "current" },
      create: {
        userId: p.userId,
        stage: p.advanced.toStage,
        status: "current",
        ...(levelForStage(p.advanced.toStage)?.isBoss ? { bossHp: BOSS.HP, hearts: BOSS.HEARTS } : {}),
      },
    });
  }
  await tx.user.update({
    where: { id: p.userId },
    data: {
      totalXp: p.newTotalXp,
      currentStage: p.newCurrentStage,
      currentStreak: p.streak.currentStreak,
      longestStreak: p.streak.longestStreak,
      lastActiveDay: p.streak.lastActiveDay,
      freezesAvailable: p.streak.freezesAvailable,
    },
  });
  await tx.pendingProblem.delete({ where: { token: p.pending.token } });
  await evaluateAndAwardBadges(tx, p.userId);
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
    if (a.correct) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
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
