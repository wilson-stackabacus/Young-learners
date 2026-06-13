import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateDemoUser();

  // Find all student users ordered by totalXp descending
  const leaders = await prisma.user.findMany({
    where: {
      role: "student",
    },
    orderBy: {
      totalXp: "desc",
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      totalXp: true,
      currentStreak: true,
    },
  });

  // Find current user's rank
  const rank = leaders.findIndex((l) => l.id === user.id) + 1;

  return NextResponse.json({
    leaderboard: leaders,
    currentUserRank: rank > 0 ? rank : null,
  });
}
