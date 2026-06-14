# Firebase Auth setup

The app runs in **guest/demo mode** with no Firebase configured. To turn on real
Google + email login, create a Firebase project and paste 8 values into your env.
Everything in the code is already wired — no code changes needed.

## 1. Create the project + web app

1. Go to <https://console.firebase.google.com> → **Add project** (name it e.g. `young-learners`).
2. In the project, click the **Web** icon (`</>`) to register a web app. Copy the
   `firebaseConfig` object it shows you — you need `apiKey`, `authDomain`,
   `projectId`, and `appId`.
3. Left sidebar → **Build → Authentication → Get started**. Enable:
   - **Email/Password**
   - **Google**

## 2. Authorize your domains

Authentication → **Settings → Authorized domains** → add:
- `localhost` (already there)
- your production domain (e.g. `young-learners.vercel.app`)

Google sign-in **fails silently** if the domain isn't authorized — this is the
single most common "it doesn't work" cause.

## 3. Get the Admin service account (backend token verification)

Project settings (gear) → **Service accounts → Generate new private key**.
This downloads a JSON file. You'll use three fields from it: `project_id`,
`client_email`, `private_key`.

## 4. Fill in your env

Put these in `.env.local` (local dev) and in your Vercel project's
**Environment Variables** (production). The `NEXT_PUBLIC_*` ones are the browser
config from step 1; the rest are the service account from step 3.

```bash
# Browser SDK (public — from firebaseConfig)
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="young-learners.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="young-learners"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234567890:web:abcdef"

# Admin SDK (secret — from the service-account JSON)
FIREBASE_PROJECT_ID="young-learners"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxx@young-learners.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Notes:
- Keep the `\n` escapes in `FIREBASE_PRIVATE_KEY` exactly as they appear in the JSON.
  `lib/auth.ts` un-escapes them at runtime.
- On Vercel you can instead paste the whole JSON into `FIREBASE_SERVICE_ACCOUNT_JSON`
  (or base64 it into `FIREBASE_SERVICE_ACCOUNT_BASE64`) — `lib/auth.ts` accepts either.

## 5. Restart and test

```bash
npm run dev
```

Open the app → the login dialog now enables the email and Google buttons. Sign up
with a name + email; the name flows straight into the greeting and the leaderboard.

## How the pieces connect

- **`lib/firebaseClient.ts`** — browser sign-in. On email *signup* it stamps the
  Firebase profile `displayName` with the name you typed (so the greeting + ranks
  show a real name). Google uses redirect with a popup fallback.
- **`lib/auth.ts`** — every API request is resolved to a user: a valid Firebase ID
  token → that user (created on first sight, keyed by Firebase uid); else a guest
  (via `X-Guest-Id`); else the shared demo user. If the admin env vars are absent,
  firebase-admin is never imported and the demo fallback keeps the app working.
