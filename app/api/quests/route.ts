import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateDemoUser();
  const quests = await prisma.quest.findMany({ where: { isActive: true } });

  // Calculate user progress for today's quests
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [attemptsToday, userMasteries] = await Promise.all([
    prisma.attempt.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mastery.findMany({
      where: { userId: user.id },
    }),
  ]);

  const solvedCount = attemptsToday.filter((a) => a.correct).length;
  const xpEarned = attemptsToday.reduce((sum, a) => sum + a.xpAwarded, 0);

  // Correct streak today
  let currentStreakToday = 0;
  let maxStreakToday = 0;
  for (const a of attemptsToday) {
    if (a.correct) {
      currentStreakToday++;
      if (currentStreakToday > maxStreakToday) {
        maxStreakToday = currentStreakToday;
      }
    } else {
      currentStreakToday = 0;
    }
  }

  const maxRating = userMasteries.length > 0 ? Math.max(...userMasteries.map((m) => m.rating)) : 1000;

  const questStatuses = quests.map((q) => {
    let progress = 0;
    if (q.type === "problems_solved") {
      progress = solvedCount;
    } else if (q.type === "xp_earned") {
      progress = xpEarned;
    } else if (q.type === "correct_streak") {
      progress = maxStreakToday;
    } else if (q.type === "master_1_topic") {
      // Return 1 if reached 1100, 0 otherwise, or actual max rating scale
      progress = maxRating >= q.targetValue ? q.targetValue : maxRating;
    }

    const completed = progress >= q.targetValue;

    return {
      id: q.id,
      slug: q.slug,
      title: q.title,
      description: q.description,
      type: q.type,
      targetValue: q.targetValue,
      xpReward: q.xpReward,
      progress: Math.min(progress, q.targetValue),
      completed,
    };
  });

  return NextResponse.json({ quests: questStatuses });
}
