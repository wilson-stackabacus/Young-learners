/**
 * Request → user resolution.
 *
 *   1. A valid Firebase ID token (Authorization: Bearer …) → that user,
 *      created in the DB on first sight (keyed by the Firebase uid).
 *   2. Otherwise the shared demo user — the dev fallback used until Firebase
 *      is configured, so the app keeps working with no auth set up.
 *
 * Firebase is initialized lazily from env vars; if they're absent, the
 * firebase-admin SDK is never even imported.
 */

import { prisma } from "./db";
import { getOrCreateDemoUser } from "./session";
import type { Auth } from "firebase-admin/auth";

let adminAuth: Auth | null = null;
let initTried = false;

async function getAdminAuth(): Promise<Auth | null> {
  if (initTried) return adminAuth;
  initTried = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null; // not configured

  const { getApps, initializeApp, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  adminAuth = getAuth(app);
  return adminAuth;
}

export async function resolveUser(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (token) {
    const auth = await getAdminAuth();
    if (auth) {
      try {
        const decoded = await auth.verifyIdToken(token);
        return prisma.user.upsert({
          where: { username: decoded.uid },
          update: {},
          create: {
            username: decoded.uid,
            displayName: decoded.name ?? decoded.email ?? "Learner",
          },
        });
      } catch {
        // invalid / expired token → fall through to the demo user
      }
    }
  }
  return getOrCreateDemoUser();
}
