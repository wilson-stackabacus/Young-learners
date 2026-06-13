import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import { getProblem, EngineError } from "@/lib/levelEngine";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { stage: string } }) {
  const u = await resolveUser(req);
  const stage = Number(params.stage);
  try {
    return NextResponse.json(await getProblem(u.id, stage));
  } catch (e) {
    if (e instanceof EngineError) {
      return NextResponse.json({ error: { code: e.code, message: e.code } }, { status: e.status });
    }
    console.error("get_problem_failed", e);
    return NextResponse.json({ error: { code: "internal", message: "internal" } }, { status: 500 });
  }
}
