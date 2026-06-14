import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveUser } from "@/lib/auth";
import type { Subject } from "@/shared/contract";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = ["math", "english", "reading", "science"];

/**
 * Per-subject leaderboard, ranked by that subject's XP (then streak), with
 * ALL guest accounts excluded. `?subject=math|english|reading|science`.
 */
export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("subject") as Subject | null;
  const subject: Subject = param && SUBJECTS.includes(param) ? param : "math";
  const me = await resolveUser(req);

  const rows = await prisma.subjectProgress.findMany({
    where: { subject, user: { isGuest: false, role: "student" } },
    orderBy: [{ totalXp: "desc" }, { currentStreak: "desc" }],
    take: 50,
    include: { user: { select: { id: true, username: true, displayName: true } } },
  });

  const leaderboard = rows.map((r, i) => ({
    rank: i + 1,
    id: r.user.id,
    username: r.user.username,
    displayName: r.user.displayName,
    totalXp: r.totalXp,
    currentStreak: r.currentStreak,
    currentStage: r.currentStage,
  }));

  const idx = leaderboard.findIndex((e) => e.id === me.id);
  return NextResponse.json({
    subject,
    leaderboard,
    currentUserRank: me.isGuest || idx < 0 ? null : idx + 1,
    isGuest: me.isGuest,
  });
}
