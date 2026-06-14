import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import { placementProbe, placementSubmit, placementSkip, EngineError } from "@/lib/levelEngine";
import type { Subject } from "@/shared/contract";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = ["math", "english", "reading", "science"];
const asSubject = (v: unknown): Subject => (typeof v === "string" && SUBJECTS.includes(v as Subject) ? (v as Subject) : "math");

// GET /api/placement?subject=math&level=1  → the next probe question.
export async function GET(req: Request) {
  const u = await resolveUser(req);
  const url = new URL(req.url);
  const subject = asSubject(url.searchParams.get("subject"));
  const level = Number(url.searchParams.get("level")) || 1;
  return NextResponse.json(await placementProbe(u.id, subject, level));
}

// POST /api/placement  → answer a probe ({subject,level,token,answer}) or skip ({subject,action:"skip"}).
export async function POST(req: Request) {
  const u = await resolveUser(req);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = asSubject(body.subject);

  if (body.action === "skip") {
    await placementSkip(u.id, subject);
    return NextResponse.json({ skipped: true });
  }
  if (typeof body.token !== "string" || typeof body.answer !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  try {
    return NextResponse.json(await placementSubmit(u.id, subject, Number(body.level) || 1, body.token, body.answer));
  } catch (e) {
    if (e instanceof EngineError) return NextResponse.json({ error: e.code }, { status: e.status });
    console.error("placement_submit_failed", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
