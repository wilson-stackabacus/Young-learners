/**
 * Problem selection.
 *
 * Given a user's masteries and a pool of candidate problems, pick one to show.
 *
 * We combine three signals into a single weight:
 *   - Mastery gap: |userMastery - problemRating|. A gap of 0..150 is ideal.
 *   - Topic preference: how much the user needs work in this topic (lower
 *     mastery -> higher weight).
 *   - Recency: penalize problems solved very recently to encourage variety.
 *
 * Sampling is weighted (roulette) with a small epsilon so we never get stuck
 * on the same problem.
 */

import type { MasteryRow } from "./topicGraph";

export interface ProblemCandidate {
  id: string;
  topicId: string;
  rating: number;
  /** ISO datetime of last attempt by this user, if any. */
  lastAttemptedAt: Date | null;
  /** Number of times the user has solved this problem. */
  solvesByUser: number;
  /** Times attempted by user. */
  attemptsByUser: number;
}

export interface SelectionOptions {
  /** Lower bound of the acceptable mastery gap. Default 0. */
  minGap?: number;
  /** Upper bound of the acceptable mastery gap. Default 200. */
  maxGap?: number;
  /** Time, in hours, within which a problem is considered "recent" and penalized. Default 24. */
  recencyHours?: number;
  /** Penalty multiplier applied per solve already by this user. Default 0.5. */
  repeatPenalty?: number;
  /** Weight of topic-mastery preference (0..1). Default 0.5. */
  topicWeight?: number;
  /** Random exploration rate (0..1). Default 0.1. */
  epsilon?: number;
  /** RNG for tests. */
  rng?: () => number;
}

const DEFAULTS: Required<SelectionOptions> = {
  minGap: 0,
  maxGap: 200,
  recencyHours: 24,
  repeatPenalty: 0.5,
  topicWeight: 0.5,
  epsilon: 0.1,
  rng: Math.random,
};

export function masteryGap(userMastery: number, problemRating: number): number {
  return Math.abs(userMastery - problemRating);
}

export function topicPreference(mastery: number, topicBase: number): number {
  // Map [600, 2000] to [1, 0] linearly — lower mastery => stronger preference.
  const span = 2000 - 600;
  const norm = (mastery - 600) / span;
  return Math.max(0, Math.min(1, 1 - norm)) + (topicBase > 1200 ? 0.1 : 0);
}

/**
 * Compute a per-problem weight and pick one. Returns null if no candidates
 * are acceptable (e.g. all outside the gap window — caller can broaden the
 * window and retry).
 */
export function selectProblem(
  candidates: ProblemCandidate[],
  masteries: MasteryRow[],
  topicBaseById: Map<string, number>,
  opts: SelectionOptions = {},
): ProblemCandidate | null {
  const o = { ...DEFAULTS, ...opts };
  if (candidates.length === 0) return null;

  const masteryByTopic = new Map(masteries.map((m) => [m.topicId, m.rating]));
  const now = Date.now();
  const recencyMs = o.recencyHours * 3600_000;

  // Compute raw weights.
  const weights: number[] = candidates.map((c) => {
    const userMastery = masteryByTopic.get(c.topicId) ?? topicBaseById.get(c.topicId) ?? 1000;
    const gap = masteryGap(userMastery, c.rating);

    // Gap fit: 1 at gap=0, 0 at gap>=maxGap, smooth bell.
    const gapFit = Math.max(0, 1 - gap / o.maxGap);

    // Topic preference
    const topicBase = topicBaseById.get(c.topicId) ?? 1000;
    const topicPref = topicPreference(userMastery, topicBase);

    // Recency penalty
    let recency = 1;
    if (c.lastAttemptedAt) {
      const dt = now - c.lastAttemptedAt.getTime();
      if (dt < recencyMs) {
        recency = dt / recencyMs; // linear ramp from 0..1 as time passes
      }
    }

    // Repeat penalty
    const repeat = Math.pow(1 - o.repeatPenalty, c.solvesByUser);

    // Combine
    const score = (1 - o.topicWeight) * gapFit + o.topicWeight * topicPref;
    return Math.max(1e-6, score * (0.2 + 0.8 * recency) * repeat);
  });

  // Epsilon-greedy: with probability epsilon, pick uniformly at random.
  if (o.rng() < o.epsilon) {
    const i = Math.floor(o.rng() * candidates.length);
    return candidates[i];
  }

  // Roulette.
  const total = weights.reduce((a, b) => a + b, 0);
  let r = o.rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
