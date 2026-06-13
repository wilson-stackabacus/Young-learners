/**
 * Streak engine.
 *
 * A streak is the number of consecutive days the user has had at least one
 * qualifying attempt (correct or not — a wrong answer still counts as activity,
 * otherwise a hard problem would break streaks unfairly).
 *
 * Rules:
 *   - Same day (UTC) as lastActiveDay: no change.
 *   - Exactly next day: increment streak.
 *   - Gap of 1+ days: consume a freeze if available, else reset to 1.
 *   - Future date (clock skew): ignore.
 *
 * Streak freezes are not auto-refilled in this build (README marks weekly
 * refill as out of scope).
 */

export interface StreakInput {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string | null; // YYYY-MM-DD
  freezesAvailable: number;
}

export interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string;
  freezesAvailable: number;
  usedFreeze: boolean;
  broke: boolean;
}

function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

export function updateStreak(input: StreakInput, now: Date = new Date()): StreakUpdate {
  const today = todayUtc(now);

  if (!input.lastActiveDay) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(input.longestStreak, 1),
      lastActiveDay: today,
      freezesAvailable: input.freezesAvailable,
      usedFreeze: false,
      broke: false,
    };
  }

  const diff = daysBetween(input.lastActiveDay, today);
  if (diff <= 0) {
    // Same day or clock skew — no change.
    return {
      currentStreak: input.currentStreak || 1,
      longestStreak: input.longestStreak,
      lastActiveDay: input.lastActiveDay,
      freezesAvailable: input.freezesAvailable,
      usedFreeze: false,
      broke: false,
    };
  }
  if (diff === 1) {
    const next = input.currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(input.longestStreak, next),
      lastActiveDay: today,
      freezesAvailable: input.freezesAvailable,
      usedFreeze: false,
      broke: false,
    };
  }
  // diff >= 2: missed at least one full day.
  if (input.freezesAvailable > 0) {
    const next = input.currentStreak + 1; // freeze preserves the streak
    return {
      currentStreak: next,
      longestStreak: Math.max(input.longestStreak, next),
      lastActiveDay: today,
      freezesAvailable: input.freezesAvailable - 1,
      usedFreeze: true,
      broke: false,
    };
  }
  return {
    currentStreak: 1,
    longestStreak: input.longestStreak,
    lastActiveDay: today,
    freezesAvailable: input.freezesAvailable,
    usedFreeze: false,
    broke: true,
  };
}
