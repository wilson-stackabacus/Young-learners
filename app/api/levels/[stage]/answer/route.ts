import { NextResponse } from "next/server";
import { getOrCreateDemoUser } from "@/lib/session";
import { submitAnswer, EngineError } from "@/lib/levelEngine";
import type { AnswerRequest } from "@/shared/contract";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { stage: string } }) {
  const u = await getOrCreateDemoUser();
  const stage = Number(params.stage);

  let body: AnswerRequest;
  try {
    body = (await req.json()) as AnswerRequest;
  } catch {
    return NextResponse.json({ error: { code: "invalid_json", message: "invalid json" } }, { status: 400 });
  }
  if (!body?.token || typeof body.answer !== "string") {
    return NextResponse.json({ error: { code: "missing_fields", message: "missing fields" } }, { status: 400 });
  }

  try {
    return NextResponse.json(await submitAnswer(u.id, stage, body.token, body.answer));
  } catch (e) {
    if (e instanceof EngineError) {
      return NextResponse.json({ error: { code: e.code, message: e.code } }, { status: e.status });
    }
    console.error("submit_answer_failed", e);
    return NextResponse.json({ error: { code: "internal", message: "internal" } }, { status: 500 });
  }
}
