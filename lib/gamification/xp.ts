/**
 * XP & level curve.
 *
 * XP needed to advance from level L to L+1 follows an exponential curve:
 *   xpForLevel(L) = round(BASE * pow(GROWTH, L - 1))
 *
 * With BASE=100, GROWTH=1.35, total XP to reach level 25 is roughly 35,000,
 * which feels right for a multi-month journey.
 *
 * Each attempt grants:
 *   base XP by problem difficulty (1..5 -> 10, 16, 24, 34, 46)
 *   multiplied by speed factor (0.5..1.2)
 *   multiplied by hint penalty (0.7 if hint used)
 *   multiplied by streak bonus (1 + 0.02 * min(streak, 30))
 */

export const XP_CURVE = {
  base: 100,
  growth: 1.35,
  /** XP awarded for a correct attempt at difficulty d (1..5). */
  baseAward: [10, 16, 24, 34, 46] as const,
  /** Streak bonus scales linearly up to 30 days. */
  streakCap: 30,
  streakStep: 0.02,
  /** Speed multiplier mapping: <1.5s -> 0.5, ideal -> 1.2, >60s -> 0.7. */
  hintPenalty: 0.7,
} as const;

export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += Math.round(XP_CURVE.base * Math.pow(XP_CURVE.growth, l - 1));
  }
  return total;
}

export function levelForTotalXp(totalXp: number): { level: number; xpInLevel: number; xpToNext: number } {
  let level = 1;
  let remaining = totalXp;
  // Walk levels until we can't afford the next.
  // Safety bound: levels beyond 200 are unreachable; cap.
  for (let l = 1; l < 200; l++) {
    const need = Math.round(XP_CURVE.base * Math.pow(XP_CURVE.growth, l - 1));
    if (remaining < need) {
      return { level, xpInLevel: remaining, xpToNext: need };
    }
    remaining -= need;
    level += 1;
  }
  return { level: 200, xpInLevel: 0, xpToNext: 0 };
}

export function speedFactor(timeMs: number): number {
  if (timeMs < 1500) return 0.5;
  if (timeMs < 4000) return 0.9;
  if (timeMs < 12_000) return 1.2;
  if (timeMs < 30_000) return 1.0;
  if (timeMs < 60_000) return 0.85;
  return 0.7;
}

export function streakBonus(streakDays: number): number {
  return 1 + XP_CURVE.streakStep * Math.min(streakDays, XP_CURVE.streakCap);
}

export interface XpAward {
  base: number;
  speed: number;
  hint: number;
  streak: number;
  total: number;
}

export function awardXp(args: {
  difficulty: number;
  timeMs: number;
  usedHint: boolean;
  streakDays: number;
  correct: boolean;
}): XpAward {
  if (!args.correct) {
    return { base: 0, speed: 1, hint: 1, streak: 1, total: 0 };
  }
  const idx = Math.max(0, Math.min(XP_CURVE.baseAward.length - 1, args.difficulty - 1));
  const base = XP_CURVE.baseAward[idx];
  const speed = speedFactor(args.timeMs);
  const hint = args.usedHint ? XP_CURVE.hintPenalty : 1;
  const streak = streakBonus(args.streakDays);
  const total = Math.max(1, Math.round(base * speed * hint * streak));
  return { base, speed, hint, streak, total };
}
