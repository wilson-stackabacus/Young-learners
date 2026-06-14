import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import { submitAnswer, EngineError } from "@/lib/levelEngine";
import type { AnswerRequest } from "@/shared/contract";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { stage: string } }) {
  const u = await resolveUser(req);
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

  const responseMs = typeof body.responseMs === "number" && body.responseMs >= 0 ? Math.round(body.responseMs) : null;
  const hintsUsed = typeof body.hintsUsed === "number" && body.hintsUsed >= 0 ? Math.round(body.hintsUsed) : null;

  try {
    return NextResponse.json(await submitAnswer(u.id, stage, body.token, body.answer, responseMs, hintsUsed));
  } catch (e) {
    if (e instanceof EngineError) {
      return NextResponse.json({ error: { code: e.code, message: e.code } }, { status: e.status });
    }
    console.error("submit_answer_failed", e);
    return NextResponse.json({ error: { code: "internal", message: "internal" } }, { status: 500 });
  }
}
