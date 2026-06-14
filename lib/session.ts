import { cookies } from "next/headers";
import { prisma } from "./db";

const COOKIE = "questline.uid";

/**
 * Read the current user. If no cookie, resolve to the demo user without
 * setting the cookie — only route handlers may set cookies.
 */
export async function getCurrentUser() {
  const jar = cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return user;
  }
  return prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    // The shared/anonymous fallback is a guest so it never appears on a
    // leaderboard — only real signed-in players are ranked.
    create: { username: "demo", displayName: "Guest", isGuest: true },
  });
}

/**
 * Route-handler variant: ensures the cookie is set after resolving the user.
 */
export async function getOrCreateDemoUser() {
  const jar = cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing) {
    const user = await prisma.user.findUnique({ where: { id: existing } });
    if (user) return user;
  }
  const user = await prisma.user.upsert({
    where: { username: "demo" },
    update: {},
    create: { username: "demo", displayName: "Guest", isGuest: true },
  });
  jar.set(COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  return user;
}
