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

function normalizePrivateKey(value: string | undefined): string | null {
  if (!value) return null;
  return value
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");
}

async function getAdminAuth(): Promise<Auth | null> {
  if (initTried) return adminAuth;
  initTried = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
    : process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson && (!projectId || !clientEmail || !privateKey)) {
    return null; // not configured; keep demo-user fallback working.
  }

  const { getApps, initializeApp, cert, applicationDefault } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const credential = serviceAccountJson
    ? cert(JSON.parse(serviceAccountJson))
    : privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault();
  const app = getApps()[0] ?? initializeApp({ credential });
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
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Firebase token verification failed", error);
        }
        // invalid / expired token → fall through to the demo user
      }
    }
  }
  return getOrCreateDemoUser();
}
