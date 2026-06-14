import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Create a fresh guest account (zeroed stats, isGuest=true). The client stores
// the returned id and sends it back as the X-Guest-Id header. Guests are
// excluded from leaderboards and can be garbage-collected later.
// An optional { displayName } personalizes the in-app greeting.
export async function POST(req: Request) {
  let displayName = "Guest";
  try {
    const body = (await req.json()) as { displayName?: unknown };
    if (typeof body?.displayName === "string" && body.displayName.trim()) {
      displayName = body.displayName.trim().slice(0, 40);
    }
  } catch {
    // no body / invalid json → keep default "Guest"
  }

  const user = await prisma.user.create({
    data: {
      username: "guest_" + randomUUID(),
      displayName,
      role: "student",
      isGuest: true,
    },
  });
  return NextResponse.json({ id: user.id, displayName: user.displayName, isGuest: true });
}
