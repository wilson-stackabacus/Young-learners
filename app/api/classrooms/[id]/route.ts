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
              level: true,
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

  // Pull all topics for mapping
  const topics = await prisma.topic.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  // Pull all masteries for members of this classroom
  const memberIds = classroom.members.map((m) => m.userId);
  const masteries = await prisma.mastery.findMany({
    where: {
      userId: { in: memberIds },
    },
  });

  // Organize masteries into user-to-topic rating mapping
  const masteryMatrix: Record<string, Record<string, number>> = {};
  for (const m of memberIds) {
    masteryMatrix[m] = {};
    for (const t of topics) {
      // default is the topic base rating
      masteryMatrix[m][t.id] = t.baseRating;
    }
  }

  for (const m of masteries) {
    if (masteryMatrix[m.userId]) {
      masteryMatrix[m.userId][m.topicId] = m.rating;
    }
  }

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
      level: m.user.level,
      currentStreak: m.user.currentStreak,
      joinedAt: m.joinedAt,
      mastery: masteryMatrix[m.user.id],
    })),
    topics: topics.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      subject: t.subject,
      baseRating: t.baseRating,
    })),
  });
}
