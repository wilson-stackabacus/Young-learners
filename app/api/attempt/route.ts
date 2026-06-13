import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";
import { submitAttempt } from "@/lib/attempt";

export const dynamic = "force-dynamic";

interface SubmitBody {
  problemId?: string;
  answer?: string;
  timeMs?: number;
  usedHint?: boolean;
}

export async function POST(req: Request) {
  const user = await getOrCreateDemoUser();
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const problemId = body.problemId;
  const answer = body.answer;
  if (!problemId || typeof answer !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const timeMs = Math.max(0, Math.min(600_000, Number(body.timeMs) || 0));
  const usedHint = Boolean(body.usedHint);

  try {
    const result = await submitAttempt(prisma, {
      userId: user.id,
      problemId,
      answer,
      timeMs,
      usedHint,
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("submit_attempt_failed", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
