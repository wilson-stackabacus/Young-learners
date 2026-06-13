import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";
import { UNLOCK } from "@/lib/adaptive/topicGraph";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateDemoUser();
  const [topics, masteries, badges, owned, recent] = await Promise.all([
    prisma.topic.findMany({
      include: { prerequisites: { select: { id: true } } },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    prisma.mastery.findMany({ where: { userId: user.id } }),
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId: user.id } }),
    prisma.attempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { problem: { include: { topic: true } } },
    }),
  ]);

  const masteryMap = new Map(masteries.map((m) => [m.topicId, m]));
  const ownedSet = new Set(owned.map((o) => o.badgeId));

  const topicRows = topics.map((t) => {
    const m = masteryMap.get(t.id);
    const rating = m?.rating ?? t.baseRating;
    const unlocked = m ? rating >= UNLOCK.rating : t.prerequisites.length === 0; // t.prerequisites now exists via include
    return {
      id: t.id,
      slug: t.slug,
      name: t.name,
      baseRating: t.baseRating,
      rating,
      solved: m?.solved ?? 0,
      attempts: m?.attempts ?? 0,
      unlocked,
    };
  });

  const badgeRows = badges.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    tier: b.tier,
    owned: ownedSet.has(b.id),
  }));

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      totalXp: user.totalXp,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      freezesAvailable: user.freezesAvailable,
    },
    topics: topicRows,
    badges: badgeRows,
    recentAttempts: recent.map((a) => ({
      id: a.id,
      correct: a.correct,
      timeMs: a.timeMs,
      xpAwarded: a.xpAwarded,
      createdAt: a.createdAt.toISOString(),
      problemPrompt: a.problem.prompt,
      topicName: a.problem.topic.name,
      ratingAfter: a.ratingAfter,
    })),
  });
}
