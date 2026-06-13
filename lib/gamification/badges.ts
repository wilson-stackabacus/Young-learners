/**
 * Badge engine.
 *
 * Badges are defined declaratively as a `rule` JSON. The engine takes a snapshot
 * of the user's state and evaluates which badges newly qualify.
 *
 * Supported rule types:
 *   - "total_problems_solved"  { min }   correct answers all-time
 *   - "total_xp"               { min }
 *   - "streak_days"            { min }
 *   - "stage_reached"          { min }   currentStage >= min
 *   - "levels_cleared"         { min }   number of cleared stages
 *   - "perfect_set"            { count } correct-in-a-row run
 *   - "first_attempt"          {}
 *
 * The engine returns ids of newly-earned badges. It does NOT mark them
 * awarded in the DB — that's the caller's job.
 */

export interface BadgeRule {
  type:
    | "total_problems_solved"
    | "total_xp"
    | "streak_days"
    | "stage_reached"
    | "levels_cleared"
    | "perfect_set"
    | "first_attempt";
  [k: string]: unknown;
}

export interface UserSnapshot {
  user: {
    id: string;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
  };
  currentStage: number;
  solvedCount: number;
  clearedStages: number;
  bestPerfectStreak: number;
  hasAnyAttempt: boolean;
}

export interface BadgeDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: string;
  rule: BadgeRule;
}

export interface NewBadge {
  badgeId: string;
  slug: string;
  name: string;
  tier: string;
}

function evaluate(rule: BadgeRule, s: UserSnapshot): boolean {
  switch (rule.type) {
    case "total_problems_solved":
      return s.solvedCount >= (rule.min as number);
    case "total_xp":
      return s.user.totalXp >= (rule.min as number);
    case "streak_days":
      return Math.max(s.user.currentStreak, s.user.longestStreak) >= (rule.min as number);
    case "stage_reached":
      return s.currentStage >= (rule.min as number);
    case "levels_cleared":
      return s.clearedStages >= (rule.min as number);
    case "perfect_set":
      return s.bestPerfectStreak >= (rule.count as number);
    case "first_attempt":
      return s.hasAnyAttempt;
    default:
      return false;
  }
}

export function evaluateBadges(
  defs: BadgeDefinition[],
  snapshot: UserSnapshot,
  alreadyOwned: Set<string>,
): NewBadge[] {
  const earned: NewBadge[] = [];
  for (const def of defs) {
    if (alreadyOwned.has(def.id)) continue;
    if (evaluate(def.rule, snapshot)) {
      earned.push({ badgeId: def.id, slug: def.slug, name: def.name, tier: def.tier });
    }
  }
  return earned;
}

export function parseBadgeRule(raw: string): BadgeRule {
  return JSON.parse(raw) as BadgeRule;
}

export function serializeBadgeRule(rule: BadgeRule): string {
  return JSON.stringify(rule);
}
