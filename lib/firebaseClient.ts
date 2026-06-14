"use client";

/**
 * Firebase client auth — browser side. Lazily initialized from the public
 * NEXT_PUBLIC_FIREBASE_* env vars. If they're absent, isFirebaseConfigured()
 * is false and the UI stays in guest/demo mode.
 *
 * On sign-in the UI grabs the ID token and sends it as `Authorization: Bearer`
 * to the API, which verifies it with firebase-admin (see lib/auth.ts).
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
  signOut,
  onAuthStateChanged,
  type AuthError,
  type Auth,
  type User,
} from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

let cachedAuth: Auth | null = null;
function auth(): Auth {
  if (!isFirebaseConfigured()) throw new Error("firebase-not-configured");
  if (cachedAuth) return cachedAuth;
  const app: FirebaseApp = getApps()[0] ?? initializeApp(config);
  cachedAuth = getAuth(app);
  return cachedAuth;
}

/**
 * One unified flow: try to sign in; if the account doesn't exist, create it.
 * On account creation we stamp the Firebase profile's displayName with `name`
 * so the greeting ("Hey, ___") and the leaderboard show a real name.
 */
export async function emailSignIn(email: string, password: string, name?: string): Promise<void> {
  const a = auth();
  await setPersistence(a, browserLocalPersistence);
  try {
    await signInWithEmailAndPassword(a, email, password);
  } catch (error) {
    const code = (error as AuthError).code;
    if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
      try {
        const cred = await createUserWithEmailAndPassword(a, email, password);
        const display = name?.trim();
        if (display && cred.user) await updateProfile(cred.user, { displayName: display });
      } catch (createError) {
        if ((createError as AuthError).code === "auth/email-already-in-use") throw error;
        throw createError;
      }
      return;
    }
    throw error;
  }
}

export async function googleSignIn(): Promise<void> {
  const a = auth();
  await setPersistence(a, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    // Popup is the reliable primary path. Redirect sign-in breaks under modern
    // third-party-cookie restrictions (and silently navigates away), so it's
    // only a fallback for when the popup is actually blocked/unsupported.
    await signInWithPopup(a, provider);
  } catch (error) {
    const code = (error as AuthError).code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return; // user dismissed the popup — not a failure
    }
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-environment") {
      await signInWithRedirect(a, provider);
      return;
    }
    throw error;
  }
}

export async function logout(): Promise<void> {
  if (isFirebaseConfigured()) await signOut(auth());
}

/** Subscribe to auth changes; calls back with the ID token (or null). */
export function watchAuth(cb: (user: { name: string; token: string } | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    cb(null);
    return () => {};
  }
  const a = auth();
  // Finalize a returning redirect sign-in (and surface any error) before we
  // start listening; onAuthStateChanged then delivers the signed-in user.
  getRedirectResult(a).catch(() => {});
  return onAuthStateChanged(a, async (u: User | null) => {
    if (!u) return cb(null);
    const token = await u.getIdToken();
    cb({ name: u.displayName ?? u.email ?? "Learner", token });
  });
}
