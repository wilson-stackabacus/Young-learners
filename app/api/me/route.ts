import { NextResponse } from "next/server";
import { getOrCreateDemoUser } from "@/lib/session";
import type { MeResponse } from "@/shared/contract";

export const dynamic = "force-dynamic";

export async function GET() {
  const u = await getOrCreateDemoUser();
  const body: MeResponse = {
    id: u.id,
    displayName: u.displayName,
    totalXp: u.totalXp,
    currentStage: u.currentStage,
    streakDays: u.currentStreak,
  };
  return NextResponse.json(body);
}
