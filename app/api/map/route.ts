import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import { getMap } from "@/lib/levelEngine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await resolveUser(req);
  const subject = new URL(req.url).searchParams.get("subject") === "english" ? "english" : "math";
  return NextResponse.json(await getMap(u.id, subject));
}
