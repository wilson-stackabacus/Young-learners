import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import { getMap } from "@/lib/levelEngine";
import type { Subject } from "@/shared/contract";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = ["math", "english", "reading", "science"];

export async function GET(req: Request) {
  const u = await resolveUser(req);
  const param = new URL(req.url).searchParams.get("subject") as Subject | null;
  const subject: Subject = param && SUBJECTS.includes(param) ? param : "math";
  return NextResponse.json(await getMap(u.id, subject));
}
