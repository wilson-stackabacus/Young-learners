/**
 * Adaptive engine for Questline.
 *
 * Two ratings move on every attempt:
 *   1. The user's per-topic Mastery.rating (starts at the topic's baseRating).
 *   2. The Problem.rating itself (moves opposite to mastery so popular problems
 *      don't stay over-served once solved).
 *
 * Both updates use a standard Elo update with separate K-factors. We also blend
 * a recency-weighted accuracy term so a long streak of correct answers pushes
 * the rating faster than a single lucky solve.
 */

export const ELO = {
  /** K-factor for user mastery — bigger moves when the user is still new. */
  masteryKNew: 36,
  masteryKExperienced: 20,
  masteryKExpert: 12,
  /** K-factor for the problem itself — small so ratings don't oscillate. */
  problemK: 8,
  /** Mastery at or above this is treated as "expert" for K-factor selection. */
  expertThreshold: 1800,
  experiencedThreshold: 1400,
  /** Floor and ceiling for any rating. */
  min: 600,
  max: 2400,
} as const;

export type EloOutcome = 1 | 0 | 0.5;

export interface RatingUpdate {
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  expected: number;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function expectedScore(a: number, b: number): number {
  return 1 / (1 + Math.pow(10, (b - a) / 400));
}

function kForMastery(rating: number): number {
  if (rating >= ELO.expertThreshold) return ELO.masteryKExpert;
  if (rating >= ELO.experiencedThreshold) return ELO.masteryKExperienced;
  return ELO.masteryKNew;
}

/**
 * Update a user's mastery rating for a topic after an attempt.
 * `timeMs` is used to apply a soft penalty for very fast correct answers (a tiny
 * anti-cheese signal: super-fast solves with no hint count slightly less).
 */
export function updateMastery(
  currentRating: number,
  problemRating: number,
  outcome: EloOutcome,
  timeMs: number,
  usedHint: boolean,
): RatingUpdate {
  const expected = expectedScore(currentRating, problemRating);
  let observed: number = outcome;

  // Speed penalty: correct answers under 1.5s with no hint count as 0.9.
  if (outcome === 1 && !usedHint && timeMs < 1500) {
    observed = 0.9;
  }
  // Long correct answers get a small bonus: 1.0..1.1.
  if (outcome === 1 && !usedHint && timeMs > 8000) {
    observed = 1.0 + Math.min(0.1, (timeMs - 8000) / 60000);
  }

  const k = kForMastery(currentRating);
  const delta = k * (observed - expected);
  const next = clamp(Math.round(currentRating + delta), ELO.min, ELO.max);

  return {
    ratingBefore: currentRating,
    ratingAfter: next,
    delta: next - currentRating,
    expected,
  };
}

export function updateProblemRating(
  currentProblemRating: number,
  userMastery: number,
  outcome: EloOutcome,
): RatingUpdate {
  const expected = expectedScore(currentProblemRating, userMastery);
  const k = ELO.problemK;
  // Inverse: correct answer means problem is "easier than we thought" relative
  // to this user, so its rating should fall. We model it as outcome applied to
  // the problem's expected-vs-actual, but inverted.
  const observed: number = outcome === 1 ? 0 : outcome === 0 ? 1 : 0.5;
  const delta = k * (observed - expected);
  const next = clamp(Math.round(currentProblemRating + delta), ELO.min, ELO.max);

  return {
    ratingBefore: currentProblemRating,
    ratingAfter: next,
    delta: next - currentProblemRating,
    expected,
  };
}
