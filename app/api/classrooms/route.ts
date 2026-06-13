import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateDemoUser();

  if (user.role === "teacher") {
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: user.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                totalXp: true,
                level: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json({ classrooms });
  } else {
    // Student: find joined classrooms
    const memberships = await prisma.classroomMember.findMany({
      where: { userId: user.id },
      include: {
        classroom: {
          include: {
            teacher: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    const classrooms = memberships.map((m) => ({
      id: m.classroom.id,
      name: m.classroom.name,
      code: m.classroom.code,
      teacherName: m.classroom.teacher.displayName,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({ classrooms });
  }
}

interface ClassroomBody {
  action?: "create" | "join";
  name?: string; // for create
  code?: string; // for join
}

export async function POST(req: Request) {
  const user = await getOrCreateDemoUser();
  let body: ClassroomBody;
  try {
    body = (await req.json()) as ClassroomBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { action, name, code } = body;

  if (action === "create") {
    // Only teachers (or we can promote demo user to teacher if requested)
    if (user.role !== "teacher") {
      // For demo ease, let's allow anyone to create if they request it, or enforce role.
      // Let's check if the user is a teacher. If not, we can auto-promote them to teacher for this classroom dashboard demonstration or reject.
      // Let's actually promote them to teacher if they click create, so the user can easily test the teacher dashboard!
      // This is a great developer-friendly design!
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "teacher" },
      });
      user.role = "teacher";
    }

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "missing_name" }, { status: 400 });
    }

    // Generate a unique 6-character code
    let codeStr = "";
    let codeUnique = false;
    while (!codeUnique) {
      codeStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await prisma.classroom.findUnique({ where: { code: codeStr } });
      if (!existing) codeUnique = true;
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        code: codeStr,
        teacherId: user.id,
      },
    });

    return NextResponse.json({ success: true, classroom });
  } else if (action === "join") {
    if (!code || code.trim() === "") {
      return NextResponse.json({ error: "missing_code" }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();
    const classroom = await prisma.classroom.findUnique({
      where: { code: upperCode },
    });

    if (!classroom) {
      return NextResponse.json({ error: "classroom_not_found" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.classroomMember.findUnique({
      where: {
        classroomId_userId: {
          classroomId: classroom.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ success: true, alreadyJoined: true, classroom });
    }

    // Join
    const membership = await prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, classroom, membership });
  } else {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }
}
