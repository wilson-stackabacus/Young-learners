import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Create a fresh guest account (zeroed stats, isGuest=true). The client stores
// the returned id and sends it back as the X-Guest-Id header. Guests are
// excluded from leaderboards and can be garbage-collected later.
export async function POST() {
  const user = await prisma.user.create({
    data: {
      username: "guest_" + randomUUID(),
      displayName: "Guest",
      role: "student",
      isGuest: true,
    },
  });
  return NextResponse.json({ id: user.id, displayName: user.displayName, isGuest: true });
}
