import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth";
import type { MeResponse } from "@/shared/contract";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = await resolveUser(req);
  const body: MeResponse = {
    id: u.id,
    displayName: u.displayName,
    totalXp: u.totalXp,
    currentStage: u.currentStage,
    streakDays: u.currentStreak,
  };
  return NextResponse.json(body);
}
