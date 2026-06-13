import { NextResponse } from "next/server";
import { getOrCreateDemoUser } from "@/lib/session";
import { getMap } from "@/lib/levelEngine";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getOrCreateDemoUser();
  return NextResponse.json(await getMap(u.id));
}
