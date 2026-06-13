/**
 * Badge engine.
 *
 * Badges are defined declaratively as a `rule` JSON. The engine takes a snapshot
 * of the user's state and evaluates which badges newly qualify.
 *
 * Supported rule types:
 *   - "total_problems_solved"       { min: number }
 *   - "total_xp"                    { min: number }
 *   - "streak_days"                 { min: number }
 *   - "level_reached"               { min: number }
 *   - "topic_mastery"               { topicSlug: string, min: number }
 *   - "perfect_set"                 { count: number } // n correct in a row
 *   - "first_attempt"               {}                 // any first attempt
 *   - "all_topics_unlocked"         {}                 // all topics reach unlock rating
 *   - "first_correct_in_topic"      { topicSlug: string }
 *
 * The engine returns ids of newly-earned badges. It does NOT mark them
 * awarded in the DB — that's the caller's job.
 */

import { Prisma } from "@prisma/client";

export interface BadgeRule {
  type:
    | "total_problems_solved"
    | "total_xp"
    | "streak_days"
    | "level_reached"
    | "topic_mastery"
    | "perfect_set"
    | "first_attempt"
    | "all_topics_unlocked"
    | "first_correct_in_topic";
  [k: string]: unknown;
}

export interface UserSnapshot {
  user: {
    id: string;
    totalXp: number;
    level: number;
    currentStreak: number;
    longestStreak: number;
  };
  solvedCount: number;
  topicRatings: Record<string, number>; // topicId -> rating
  topicSlugs: Record<string, string>; // topicId -> slug
  bestPerfectStreak: number; // longest correct-in-a-row run ever
  hasAnyAttempt: boolean;
  topicsWithCorrect: Set<string>;
  topicUnlockRating: number;
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
    case "level_reached":
      return s.user.level >= (rule.min as number);
    case "topic_mastery": {
      const slug = rule.topicSlug as string;
      const min = rule.min as number;
      const topicId = Object.entries(s.topicSlugs).find(([, v]) => v === slug)?.[0];
      if (!topicId) return false;
      return (s.topicRatings[topicId] ?? 0) >= min;
    }
    case "perfect_set":
      return s.bestPerfectStreak >= (rule.count as number);
    case "first_attempt":
      return s.hasAnyAttempt;
    case "all_topics_unlocked": {
      return Object.values(s.topicRatings).every((r) => r >= s.topicUnlockRating);
    }
    case "first_correct_in_topic": {
      const slug = rule.topicSlug as string;
      const topicId = Object.entries(s.topicSlugs).find(([, v]) => v === slug)?.[0];
      if (!topicId) return false;
      return s.topicsWithCorrect.has(topicId);
    }
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
      earned.push({
        badgeId: def.id,
        slug: def.slug,
        name: def.name,
        tier: def.tier,
      });
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

// Re-export Prisma JSON type alias for the snapshot.
export type { Prisma };
