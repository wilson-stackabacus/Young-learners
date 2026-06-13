/**
 * Attempt orchestration — the heart of the app.
 *
 * Given a user and a problem with a submitted answer, this module:
 *   1. Verifies the answer against the problem's payload.
 *   2. Computes Elo updates for mastery and problem rating.
 *   3. Awards XP, updates streak.
 *   4. Evaluates badges.
 *   5. Returns a full result for the API to send back to the client.
 *
 * Persistence is done via the Prisma client passed in; we wrap everything in
 * a single transaction so a mid-flight failure leaves the DB consistent.
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { updateMastery, updateProblemRating } from "./adaptive/elo";
import { TopicGraph, type MasteryRow, UNLOCK } from "./adaptive/topicGraph";
import { selectProblem, type ProblemCandidate } from "./adaptive/selection";
import { awardXp, levelForTotalXp, type XpAward } from "./gamification/xp";
import { updateStreak, type StreakUpdate } from "./gamification/streak";
import {
  evaluateBadges,
  parseBadgeRule,
  type BadgeDefinition,
  type NewBadge,
  type UserSnapshot,
} from "./gamification/badges";

// ─── Problem payload parsing ─────────────────────────────────────────────────

export type ProblemKind = "numeric" | "multiple_choice" | "short";

export interface ProblemPayloadNumeric {
  type: "numeric";
  answer: number;
  tolerance?: number; // absolute tolerance
  hints?: string[];
  solution?: string;
}

export interface ProblemPayloadChoice {
  type: "multiple_choice";
  choices: string[];
  answerIndex: number;
  hints?: string[];
  solution?: string;
}

export interface ProblemPayloadShort {
  type: "short";
  acceptable: string[]; // accepted (lowercased, trimmed) answers
  hints?: string[];
  solution?: string;
}

export type ProblemPayload = ProblemPayloadNumeric | ProblemPayloadChoice | ProblemPayloadShort;

export function parseProblemPayload(raw: string): ProblemPayload {
  const obj = JSON.parse(raw) as ProblemPayload;
  return obj;
}

export interface AnswerCheck {
  correct: boolean;
  /** For numeric: how far the answer was from correct (0 if exact). */
  distance?: number;
}

/** Check a submitted answer string against a problem's payload. */
export function checkAnswer(payload: ProblemPayload, submitted: string): AnswerCheck {
  switch (payload.type) {
    case "numeric": {
      const got = Number(submitted);
      if (!Number.isFinite(got)) return { correct: false };
      const tol = payload.tolerance ?? 0;
      if (Math.abs(got - payload.answer) <= tol) return { correct: true, distance: 0 };
      return { correct: false, distance: Math.abs(got - payload.answer) };
    }
    case "multiple_choice": {
      const idx = Number(submitted);
      return { correct: idx === payload.answerIndex };
    }
    case "short": {
      const norm = submitted.trim().toLowerCase();
      return { correct: payload.acceptable.some((a) => a.toLowerCase() === norm) };
    }
  }
}

// ─── Selection ───────────────────────────────────────────────────────────────

export interface NextProblemResult {
  problem: {
    id: string;
    prompt: string;
    kind: string;
    difficulty: number;
    topicId: string;
    topicName: string;
    topicSlug: string;
    payload: ProblemPayload;
  };
  /** Diagnostic info for the client UI. */
  targetMastery: number;
  userMastery: number;
  masteryGap: number;
}

export async function pickNextProblem(
  prisma: PrismaClient,
  userId: string,
  subject: string = "math",
  rng: () => number = Math.random,
): Promise<NextProblemResult | null> {
  const [topics, masteries, recentAttempts] = await Promise.all([
    prisma.topic.findMany({
      where: { subject },
      include: { prerequisites: { select: { id: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    prisma.mastery.findMany({ where: { userId } }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { problemId: true, correct: true, createdAt: true, problem: { select: { topicId: true } } },
    }),
  ]);

  const graph = new TopicGraph(
    topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      baseRating: t.baseRating,
      order: t.order,
      prereqs: t.prerequisites.map((p) => p.id),
    })),
  );
  const masteryRows: MasteryRow[] = masteries.map((m) => ({
    topicId: m.topicId,
    rating: m.rating,
    solved: m.solved,
    attempts: m.attempts,
  }));
  const unlocked = graph.unlocked(masteryRows);
  if (unlocked.size === 0) return null;

  // Filter topics to unlocked ones and gather all their problems.
  const unlockedTopics = topics.filter((t) => unlocked.has(t.id));
  const problems = await prisma.problem.findMany({
    where: { topicId: { in: unlockedTopics.map((t) => t.id) } },
  });
  if (problems.length === 0) return null;

  // Build per-user attempt stats keyed by problem id.
  const lastByProblem = new Map<string, Date>();
  const solvesByProblem = new Map<string, number>();
  const attemptsByProblem = new Map<string, number>();
  for (const a of recentAttempts) {
    if (!lastByProblem.has(a.problemId)) lastByProblem.set(a.problemId, a.createdAt);
    if (a.correct) solvesByProblem.set(a.problemId, (solvesByProblem.get(a.problemId) ?? 0) + 1);
    attemptsByProblem.set(a.problemId, (attemptsByProblem.get(a.problemId) ?? 0) + 1);
  }

  const masteryByTopic = new Map(masteryRows.map((m) => [m.topicId, m.rating]));
  const topicBaseById = new Map(topics.map((t) => [t.id, t.baseRating]));

  // Try selection with progressively broader windows.
  const windows = [
    { minGap: 0, maxGap: 200 },
    { minGap: 0, maxGap: 350 },
    { minGap: 0, maxGap: 600 },
    { minGap: 0, maxGap: 1000 },
  ];

  for (const w of windows) {
    const candidates: ProblemCandidate[] = problems
      .filter((p) => {
        const userMastery = masteryByTopic.get(p.topicId) ?? topicBaseById.get(p.topicId) ?? 1000;
        const gap = Math.abs(userMastery - p.rating);
        return gap >= (w.minGap ?? 0) && gap <= (w.maxGap ?? 600);
      })
      .map((p) => ({
        id: p.id,
        topicId: p.topicId,
        rating: p.rating,
        lastAttemptedAt: lastByProblem.get(p.id) ?? null,
        solvesByUser: solvesByProblem.get(p.id) ?? 0,
        attemptsByUser: attemptsByProblem.get(p.id) ?? 0,
      }));
    if (candidates.length === 0) continue;

    const pick = selectProblem(candidates, masteryRows, topicBaseById, { ...w, rng });
    if (!pick) continue;

    const problem = problems.find((p) => p.id === pick.id)!;
    const topic = topics.find((t) => t.id === problem.topicId)!;
    const userMastery = masteryByTopic.get(topic.id) ?? topic.baseRating;
    return {
      problem: {
        id: problem.id,
        prompt: problem.prompt,
        kind: problem.kind,
        difficulty: problem.difficulty,
        topicId: problem.topicId,
        topicName: topic.name,
        topicSlug: topic.slug,
        payload: parseProblemPayload(problem.payload),
      },
      targetMastery: problem.rating,
      userMastery,
      masteryGap: Math.abs(userMastery - problem.rating),
    };
  }

  // Final fallback: pick a random unlocked problem.
  const fallback = problems[Math.floor(rng() * problems.length)];
  const topic = topics.find((t) => t.id === fallback.topicId)!;
  return {
    problem: {
      id: fallback.id,
      prompt: fallback.prompt,
      kind: fallback.kind,
      difficulty: fallback.difficulty,
      topicId: fallback.topicId,
      topicName: topic.name,
      topicSlug: topic.slug,
      payload: parseProblemPayload(fallback.payload),
    },
    targetMastery: fallback.rating,
    userMastery: masteryByTopic.get(topic.id) ?? topic.baseRating,
    masteryGap: Math.abs((masteryByTopic.get(topic.id) ?? topic.baseRating) - fallback.rating),
  };
}

// ─── Attempt submission ──────────────────────────────────────────────────────

export interface AttemptInput {
  userId: string;
  problemId: string;
  answer: string;
  timeMs: number;
  usedHint: boolean;
}

export interface AttemptResult {
  correct: boolean;
  xpAwarded: number;
  xpBreakdown: XpAward;
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  problemRatingBefore: number;
  problemRatingAfter: number;
  newLevel: number;
  leveledUp: boolean;
  streak: { current: number; longest: number; usedFreeze: boolean; broke: boolean };
  newBadges: NewBadge[];
  newlyUnlocked: { id: string; name: string; slug: string }[];
  newlyCompletedQuests: { id: string; title: string; xpReward: number }[];
}

export async function submitAttempt(
  prisma: PrismaClient,
  input: AttemptInput,
): Promise<AttemptResult> {
  return prisma.$transaction(async (tx) => {
    const [user, problem, topic] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: input.userId } }),
      tx.problem.findUniqueOrThrow({
        where: { id: input.problemId },
        include: { topic: { include: { prerequisites: true } } },
      }),
      // topic pulled via problem.topic above
      Promise.resolve(null),
    ]);
    const problemTopic = problem.topic;
    void topic;

    const payload = parseProblemPayload(problem.payload);
    const check = checkAnswer(payload, input.answer);

    // Load or create mastery for this topic.
    let mastery = await tx.mastery.findUnique({
      where: { userId_topicId: { userId: user.id, topicId: problem.topicId } },
    });
    if (!mastery) {
      mastery = await tx.mastery.create({
        data: { userId: user.id, topicId: problem.topicId, rating: problemTopic.baseRating },
      });
    }

    // Compute Elo updates.
    const outcome = check.correct ? 1 : 0;
    const masteryUpd = updateMastery(mastery.rating, problem.rating, outcome, input.timeMs, input.usedHint);
    const problemUpd = updateProblemRating(problem.rating, mastery.rating, outcome);

    // Award XP and streak.
    const xp = awardXp({
      difficulty: problem.difficulty,
      timeMs: input.timeMs,
      usedHint: input.usedHint,
      streakDays: user.currentStreak,
      correct: check.correct,
    });
    const newTotalXp = user.totalXp + xp.total;
    const lvl = levelForTotalXp(newTotalXp);
    const leveledUp = lvl.level > user.level;

    const streakUpd = updateStreak({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDay: user.lastActiveDay,
      freezesAvailable: user.freezesAvailable,
    });

    // Persist.
    await tx.attempt.create({
      data: {
        userId: user.id,
        problemId: problem.id,
        correct: check.correct,
        timeMs: input.timeMs,
        usedHint: input.usedHint,
        xpAwarded: xp.total,
        ratingBefore: masteryUpd.ratingBefore,
        ratingAfter: masteryUpd.ratingAfter,
      },
    });
    await tx.mastery.update({
      where: { id: mastery.id },
      data: {
        rating: masteryUpd.ratingAfter,
        solved: check.correct ? mastery.solved + 1 : mastery.solved,
        attempts: mastery.attempts + 1,
      },
    });
    await tx.problem.update({
      where: { id: problem.id },
      data: { rating: problemUpd.ratingAfter },
    });
    await tx.user.update({
      where: { id: user.id },
      data: {
        totalXp: newTotalXp,
        level: lvl.level,
        currentStreak: streakUpd.currentStreak,
        longestStreak: streakUpd.longestStreak,
        lastActiveDay: streakUpd.lastActiveDay,
        freezesAvailable: streakUpd.freezesAvailable,
      },
    });

    // Compute newly-unlocked topics.
    const allTopics = await tx.topic.findMany({
      include: { prerequisites: { select: { id: true } } },
    });
    const allMasteries = await tx.mastery.findMany({ where: { userId: user.id } });
    const graph = new TopicGraph(
      allTopics.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        baseRating: t.baseRating,
        order: t.order,
        prereqs: t.prerequisites.map((p) => p.id),
      })),
    );
    const updatedMasteries = allMasteries.map((m) =>
      m.topicId === problem.topicId
        ? { ...m, rating: masteryUpd.ratingAfter }
        : { ...m },
    );
    const before = graph.unlocked(allMasteries);
    const after = graph.unlocked(updatedMasteries);
    const newlyUnlocked = [...after]
      .filter((id) => !before.has(id))
      .map((id) => {
        const t = allTopics.find((x) => x.id === id)!;
        return { id: t.id, name: t.name, slug: t.slug };
      });

    // Evaluate badges.
    const newBadges = await evaluateAndAwardBadges(tx, user.id, allTopics, updatedMasteries, newTotalXp, lvl.level, streakUpd);

    // Evaluate quests.
    const { newlyCompletedQuests, finalTotalXp, finalLevel } = await evaluateAndAwardQuests(
      tx,
      user.id,
      check.correct,
      xp.total,
      problem.topicId,
      mastery.rating,
      masteryUpd.ratingAfter,
      newTotalXp,
      lvl.level
    );

    const finalLeveledUp = finalLevel > user.level;

    return {
      correct: check.correct,
      xpAwarded: xp.total,
      xpBreakdown: xp,
      ratingBefore: masteryUpd.ratingBefore,
      ratingAfter: masteryUpd.ratingAfter,
      ratingDelta: masteryUpd.delta,
      problemRatingBefore: problemUpd.ratingBefore,
      problemRatingAfter: problemUpd.ratingAfter,
      newLevel: finalLevel,
      leveledUp: finalLeveledUp,
      streak: {
        current: streakUpd.currentStreak,
        longest: streakUpd.longestStreak,
        usedFreeze: streakUpd.usedFreeze,
        broke: streakUpd.broke,
      },
      newBadges,
      newlyUnlocked,
      newlyCompletedQuests,
    };
  });
}

async function evaluateAndAwardBadges(
  tx: Prisma.TransactionClient,
  userId: string,
  topics: { id: string; slug: string }[],
  masteries: { topicId: string; rating: number }[],
  totalXp: number,
  level: number,
  streak: StreakUpdate,
): Promise<NewBadge[]> {
  const [user, allBadges, owned, attempts] = await Promise.all([
    tx.user.findUniqueOrThrow({ where: { id: userId } }),
    tx.badge.findMany(),
    tx.userBadge.findMany({ where: { userId } }),
    tx.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { correct: true, problem: { select: { topicId: true } } },
    }),
  ]);

  const topicRatings: Record<string, number> = {};
  for (const m of masteries) topicRatings[m.topicId] = m.rating;
  const topicSlugs: Record<string, string> = {};
  for (const t of topics) topicSlugs[t.id] = t.slug;
  const ownedSet = new Set(owned.map((o) => o.badgeId));

  // Compute longest correct-in-a-row streak ever.
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
  // Include the just-submitted attempt's outcome by checking the last attempt.
  // The current attempt was just inserted; the loop above is on attempts ordered
  // ascending, so the most recent is last.
  if (attempts.length > 0 && attempts[attempts.length - 1].correct) {
    best = Math.max(best, run);
  }

  const topicsWithCorrect = new Set<string>(
    attempts.filter((a) => a.correct).map((a) => a.problem.topicId),
  );

  const snapshot: UserSnapshot = {
    user: {
      id: user.id,
      totalXp,
      level,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
    },
    solvedCount: attempts.filter((a) => a.correct).length,
    topicRatings,
    topicSlugs,
    bestPerfectStreak: best,
    hasAnyAttempt: attempts.length > 0,
    topicsWithCorrect,
    topicUnlockRating: UNLOCK.rating,
  };

  const defs: BadgeDefinition[] = allBadges.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    tier: b.tier,
    rule: parseBadgeRule(b.rule),
  }));

  const earned = evaluateBadges(defs, snapshot, ownedSet);
  if (earned.length === 0) return [];

  await tx.userBadge.createMany({
    data: earned.map((b) => ({ userId, badgeId: b.badgeId })),
  });
  return earned;
}

async function evaluateAndAwardQuests(
  tx: Prisma.TransactionClient,
  userId: string,
  currentAttemptCorrect: boolean,
  currentAttemptXp: number,
  topicId: string,
  masteryBefore: number,
  masteryAfter: number,
  xpEarnedSoFar: number,
  levelSoFar: number
): Promise<{ newlyCompletedQuests: { id: string; title: string; xpReward: number }[]; finalTotalXp: number; finalLevel: number }> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [quests, attemptsToday, allMasteries] = await Promise.all([
    tx.quest.findMany({ where: { isActive: true } }),
    tx.attempt.findMany({
      where: { userId, createdAt: { gte: todayStart } },
      orderBy: { createdAt: "asc" }
    }),
    tx.mastery.findMany({ where: { userId } })
  ]);

  const solvedCountAfter = attemptsToday.filter((a) => a.correct).length;
  const xpEarnedAfter = attemptsToday.reduce((sum, a) => sum + a.xpAwarded, 0);

  let runAfter = 0;
  let bestStreakAfter = 0;
  for (const a of attemptsToday) {
    if (a.correct) {
      runAfter++;
      bestStreakAfter = Math.max(bestStreakAfter, runAfter);
    } else {
      runAfter = 0;
    }
  }

  const maxRatingAfter = allMasteries.length > 0 ? Math.max(...allMasteries.map((m) => m.rating)) : 1000;

  // Now reconstruct state BEFORE this attempt
  const solvedCountBefore = solvedCountAfter - (currentAttemptCorrect ? 1 : 0);
  const xpEarnedBefore = xpEarnedAfter - currentAttemptXp;

  const attemptsBefore = attemptsToday.slice(0, -1);
  let runBefore = 0;
  let bestStreakBefore = 0;
  for (const a of attemptsBefore) {
    if (a.correct) {
      runBefore++;
      bestStreakBefore = Math.max(bestStreakBefore, runBefore);
    } else {
      runBefore = 0;
    }
  }

  // Find max rating before this attempt
  const masteriesBefore = allMasteries.map((m) =>
    m.topicId === topicId ? { ...m, rating: masteryBefore } : m
  );
  const maxRatingBefore = masteriesBefore.length > 0 ? Math.max(...masteriesBefore.map((m) => m.rating)) : 1000;

  const newlyCompleted = [];
  for (const q of quests) {
    let completedBefore = false;
    let completedAfter = false;

    if (q.type === "problems_solved") {
      completedBefore = solvedCountBefore >= q.targetValue;
      completedAfter = solvedCountAfter >= q.targetValue;
    } else if (q.type === "xp_earned") {
      completedBefore = xpEarnedBefore >= q.targetValue;
      completedAfter = xpEarnedAfter >= q.targetValue;
    } else if (q.type === "correct_streak") {
      completedBefore = bestStreakBefore >= q.targetValue;
      completedAfter = bestStreakAfter >= q.targetValue;
    } else if (q.type === "master_1_topic") {
      completedBefore = maxRatingBefore >= q.targetValue;
      completedAfter = maxRatingAfter >= q.targetValue;
    }

    if (completedAfter && !completedBefore) {
      newlyCompleted.push({
        id: q.id,
        title: q.title,
        xpReward: q.xpReward,
      });
    }
  }

  let finalTotalXp = xpEarnedSoFar;
  let finalLevel = levelSoFar;

  if (newlyCompleted.length > 0) {
    const totalQuestXp = newlyCompleted.reduce((sum, q) => sum + q.xpReward, 0);
    finalTotalXp += totalQuestXp;
    const { levelForTotalXp } = require("./gamification/xp");
    finalLevel = levelForTotalXp(finalTotalXp).level;

    await tx.user.update({
      where: { id: userId },
      data: {
        totalXp: finalTotalXp,
        level: finalLevel,
      },
    });
  }

  return {
    newlyCompletedQuests: newlyCompleted,
    finalTotalXp,
    finalLevel,
  };
}
