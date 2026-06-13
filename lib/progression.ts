/**
 * Progression engine — the progress bar.
 *
 * Movement blends two signals (see docs/DESIGN.md §2):
 *   - rolling accuracy over the last WINDOW attempts is the main driver
 *   - every correct answer always adds at least BASE_GAIN (the volume floor)
 *
 * gain  = BASE_GAIN + ACCURACY_BONUS * accuracy   (on a solve)
 * loss  = WRONG_PENALTY                            (on a fail)
 * advance when progress reaches ADVANCE_AT.
 */

export const PROGRESSION = {
  WINDOW: 10,
  BASE_GAIN: 6,
  ACCURACY_BONUS: 8,
  WRONG_PENALTY: 4,
  ADVANCE_AT: 100,
  HINTS_BEFORE_SOLUTION: 2,
} as const;

/** Boss battles (gauntlet gating each new whole level). */
export const BOSS = {
  HP: 5, // correct answers needed to defeat the boss
  HEARTS: 3, // wrong answers tolerated before the fight resets
  XP_BONUS: 50, // bonus XP for defeating a boss
} as const;

/** Accuracy (0..1) from the rolling window of recent results. */
export function accuracyFromRecent(recent: boolean[]): number {
  if (recent.length === 0) return 0;
  const correct = recent.filter(Boolean).length;
  return correct / recent.length;
}

/** Push a new result onto the rolling window, keeping at most WINDOW entries. */
export function pushRecent(recent: boolean[], correct: boolean): boolean[] {
  return [...recent, correct].slice(-PROGRESSION.WINDOW);
}

/** Progress points added for a correct answer at the given accuracy. */
export function gainForCorrect(accuracy: number): number {
  return Math.round(PROGRESSION.BASE_GAIN + PROGRESSION.ACCURACY_BONUS * accuracy);
}

/** Stars (1..3) awarded when a stage is cleared, based on accuracy. */
export function starsForAccuracy(accuracy: number): number {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  return 1;
}

/** A 1..5 difficulty bucket from a level's difficulty (1..23), for XP scaling. */
export function difficultyBucket(difficulty: number): number {
  return Math.min(5, Math.max(1, Math.ceil(difficulty / 4.6)));
}
