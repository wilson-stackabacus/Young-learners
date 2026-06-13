import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/session";
import { pickNextProblem } from "@/lib/attempt";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getOrCreateDemoUser();
  const url = new URL(req.url);
  const subject = url.searchParams.get("subject") || "math";
  const next = await pickNextProblem(prisma, user.id, subject);
  if (!next) {
    return NextResponse.json(
      { error: "no_problems_available" },
      { status: 404 },
    );
  }
  // Strip the answer/solution from the payload before sending.
  const safePayload = stripAnswers(next.problem.payload);
  return NextResponse.json({
    problem: {
      id: next.problem.id,
      prompt: next.problem.prompt,
      kind: next.problem.kind,
      difficulty: next.problem.difficulty,
      topicId: next.problem.topicId,
      topicName: next.problem.topicName,
      topicSlug: next.problem.topicSlug,
      payload: safePayload,
    },
    targetMastery: next.targetMastery,
    userMastery: next.userMastery,
    masteryGap: next.masteryGap,
  });
}

function stripAnswers(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const p = payload as Record<string, unknown>;
  if ("answer" in p) delete p.answer;
  if ("answerIndex" in p) delete p.answerIndex;
  if ("acceptable" in p) delete p.acceptable;
  if ("solution" in p) delete p.solution;
  return p;
}
