import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getOrCreateDemoUser();
  const classroomId = params.id;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      teacher: {
        select: {
          displayName: true,
          id: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
              totalXp: true,
              currentStreak: true,
              lastActiveDay: true,
            },
          },
        },
      },
    },
  });

  if (!classroom) {
    return NextResponse.json({ error: "classroom_not_found" }, { status: 404 });
  }

  // Security: only allow the teacher of this classroom OR enrolled members of the classroom
  const isTeacher = classroom.teacherId === user.id;
  const isMember = classroom.members.some((m) => m.userId === user.id);

  if (!isTeacher && !isMember) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }

  // Pull first 5 levels for heatmap mapping (to keep it compact and clean)
  const levels = await prisma.level.findMany({
    where: { stage: { lte: 5 } },
    orderBy: { stage: "asc" },
  });

  // Pull level progress for members of this classroom
  const memberIds = classroom.members.map((m) => m.userId);
  const progressRows = await prisma.levelProgress.findMany({
    where: {
      userId: { in: memberIds },
      stage: { lte: 5 },
    },
  });

  // Organize progress into user-to-stage progress mapping (default is 0)
  const progressMatrix: Record<string, Record<string, number>> = {};
  for (const m of memberIds) {
    progressMatrix[m] = {};
    for (const l of levels) {
      progressMatrix[m][String(l.stage)] = 0;
    }
  }

  for (const p of progressRows) {
    if (progressMatrix[p.userId]) {
      progressMatrix[p.userId][String(p.stage)] = p.progress;
    }
  }

  const calculateLevel = (totalXp: number) => {
    return Math.floor(Math.sqrt(totalXp / 25)) + 1;
  };

  return NextResponse.json({
    classroom: {
      id: classroom.id,
      name: classroom.name,
      code: classroom.code,
      teacherName: classroom.teacher.displayName,
      isTeacher,
    },
    students: classroom.members.map((m) => ({
      id: m.user.id,
      displayName: m.user.displayName,
      username: m.user.username,
      totalXp: m.user.totalXp,
      level: calculateLevel(m.user.totalXp),
      currentStreak: m.user.currentStreak,
      joinedAt: m.joinedAt,
      mastery: progressMatrix[m.user.id],
    })),
    topics: levels.map((l) => ({
      id: String(l.stage),
      name: `Stage ${l.stage}`,
      slug: l.world,
      subject: l.world,
      baseRating: 0,
    })),
  });
}
