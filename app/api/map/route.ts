import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import { getMap } from "@/lib/levelEngine";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await resolveUser(req);
  return NextResponse.json(await getMap(u.id));
}
