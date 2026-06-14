# Young Learners 4 (Questline) — Full Project Context

> A single, self-contained reference for the whole project. Paste this into a fresh
> agent/session to restore context. The **code is the source of truth**; this
> describes how it all fits together as of the latest commit.

---

## 1. What it is

A gamified, adaptive **K-8 learning web app** in the spirit of AoPS Alcumus. A learner
climbs a **ladder of skill levels**; each level serves auto-generated problems; a
**progress bar** fills as they answer correctly; wrong answers give **tiered hints**;
periodic **boss battles** gate progress. **Four subjects** share one engine: **Math,
English (vocabulary), Reading, and Science**.

Design principle: a **thin client** + a backend that owns **all** logic. The UI renders
API responses and sends back `{ token, answer }`. The correct answer is **never** sent
to the browser.

> **Active build:** the K-8 feature expansion is **complete** — Phases A–D all shipped:
> **A** 4 subjects + per-subject XP/streak + `isGuest`. **B** auth redirect/fallback +
> guest mode + per-subject guest-excluded leaderboards. **C** placement test + answer
> response-time analytics. **D** dragon-battle screen + real-time XP/streak counters +
> celebration toasts. Plus: title "Young Learners 4", a first-visit intro dialog, and
> browser caching of map/me/leaderboard. (See §13.)

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.18 (App Router) + React 18 + TypeScript |
| Backend | Next.js API routes (serverless, `dynamic = "force-dynamic"`) |
| ORM / DB | Prisma 5.22 + SQLite, hosted on **Turso (libSQL)**; local dev `file:./dev.db` |
| DB driver | `@prisma/adapter-libsql` + `@libsql/client/web` (HTTP-only, serverless-safe); `previewFeatures = ["driverAdapters"]` |
| Auth | **Firebase Auth** — `firebase` (browser, local persistence) + `firebase-admin` (server, service-account JSON or 3 fields); demo-user fallback |
| AI hints | **Google Gemini** REST (`gemini-2.0-flash`), optional |
| Styling | Tailwind + dark glassmorphism `app/globals.css` (Plus Jakarta Sans, `#06070a` bg, purple `#7c5cff` / cyan `#22d3ee`) |
| Hosting | **Vercel** |

---

## 3. Repository & deployment

- **GitHub:** `https://github.com/wilson-stackabacus/Young-learners` (branch `main`). Shared with a collaborator (`wilson-stackabacus`) who owns the quests/leaderboard/classroom routes and firebase-auth hardening.
- The **git repo root is the Next.js app** (locally `/Users/ryanpark/AI_project_2026june/questline`).
- **Build:** `"build": "prisma generate && next build"` + `"postinstall": "prisma generate"` (Vercel clean-install needs the client generated).
- `.env`, `.env*`, `.vercel`, `README.md` are **gitignored**. This context doc lives at `docs/PROJECT-CONTEXT.md`.

---

## 4. The learning model (core engine)

A linear **level ladder per subject**. For a subject with `N` skills: tiers = `2N − 1`
(`N` pure + `N−1` blend), 5 practice stages per tier, plus a **boss** after each blend
tier. `difficulty = (tier + 1) / 2`.

### Progression (practice stages) — `lib/progression.ts`
```
PROGRESSION = { WINDOW: 10, BASE_GAIN: 6, ACCURACY_BONUS: 8, WRONG_PENALTY: 4, ADVANCE_AT: 100, HINTS_BEFORE_SOLUTION: 2 }
accuracy  = correct within the last 10 attempts on the stage
correct → progress += round(6 + 8*accuracy);  wrong → progress -= 4;  reach 100 → clear & advance
stars at clear: acc ≥ 0.9 → 3, ≥ 0.7 → 2, else 1
```

### Two-hint flow (practice)
`wrong → Hint 1 → retry → Hint 2 → retry → reveal solution`. Hint source order:
**rule-based common-mistake → Gemini AI (if key set) → templated**. The hint branch runs
**outside** the DB transaction.

### Boss battles — `BOSS = { HP: 5, HEARTS: 3, XP_BONUS: 50 }`
No hints. Correct = boss −1 HP; wrong = lose a heart + show solution. HP 0 → defeated
(+50 XP, advance). Hearts 0 → fight resets.

### XP / streaks / stars / badges — `lib/gamification/*`
Per-subject XP/streak (see §6). Badges are declarative `rule` JSON, evaluated **after**
the transaction (Turso latency).

---

## 5. Subjects & stage numbering

Stage ids are **offset per subject**, so a stage id alone identifies the subject and
keeps `/api/levels/{stage}/...` unambiguous (`subjectOfStage(stage)`).

| Subject | Skills | Stages | Worlds (theming reuses math world ids) | Content |
|---|---|---|---|---|
| **math** | 23 (`SKILL_NAMES`) | **1..247** (225 + 22 boss) | Arithmetic / Integers / Pre-algebra / Algebra 1 | numeric/fraction/MC generators |
| **english** | 6 | **1001..1060** | Beginner / Advanced words | vocab MC: definition, synonym, antonym |
| **reading** | 6 | **2001..2060** | Beginner / Advanced reading | MC: rhyming, sentence completion (cloze), main idea |
| **science** | 6 | **3001..3060** | Science explorer / master | fact-recall MC |

- Offsets: `ENGLISH_OFFSET=1000`, `READING_OFFSET=2000`, `SCIENCE_OFFSET=3000` in `lib/levelCatalog.ts`.
- English/Reading/Science generators live in `lib/levels/{english,reading,science}/`; each has a small content bank + MC generators producing the standard `GeneratedProblem` shape. Math generators are in `lib/levels/generators.ts`.
- UI: display a stage as `displayStage(stage)` (subtracts the subject offset → 1-based).

---

## 6. Data model (Prisma — `prisma/schema.prisma`)

- **User**: `id`, `username` (= Firebase uid or `"demo"`), `displayName`, `role`, **`isGuest`** (excluded from leaderboards, purged on logout), `createdAt`. Plus **aggregate** `totalXp` / `currentStreak` / `longestStreak` / `lastActiveDay` (kept for the legacy global leaderboard + header) and legacy `currentStage`/`englishStage` pointers, and `freezesAvailable` (global).
- **SubjectProgress** *(the per-subject source of truth)*: `userId × subject`, `currentStage`, `totalXp`, `currentStreak`, `longestStreak`, `lastActiveDay`, `placementDone`. Unique `[userId, subject]`. **Subject leaderboards rank by `SubjectProgress.totalXp` then streak.**
- **Level** (static, seeded): `stage` (PK), `subject`, `tier`, `stageInTier`, `kind` (pure/blend/boss), `skills` (JSON), `world`, `difficulty`, `isBoss`, `testsLevel?`.
- **LevelProgress** (per user×stage): `status`, `progress` (0–100), `stars`, `totalCorrect`, `totalAttempts`, `recentResults` (JSON rolling 10), `clearedAt?`, `bossHp?`, `hearts?`. Unique `[userId, stage]`.
- **PendingProblem** (holds the answer): `token` (PK), `userId`, `stage`, `prompt`, `latex`, `inputType`, `choices?`, **`answer`** (secret), `hints`, `solution`, `commonMistakes`, `attemptsUsed`, `isBoss`, `createdAt`.
- **Attempt**: `userId`, `stage`, `prompt`, `givenAnswer?`, `correct`, `hintsUsed`, `solvedAfterHint`, `isBoss`, `xpAwarded`, **`responseMs?`** (client-measured time from problem-shown to submit), `createdAt`.
- **Badge** / **UserBadge**; **Quest** / **UserQuest** / **Classroom** / **ClassroomMember** (collaborator-owned).

---

## 7. API contract

Routes call `resolveUser(req)` (Firebase Bearer token → user, else demo). Types in `shared/contract.ts`.

- `GET /api/me` → `UserSummary { id, displayName, totalXp, currentStage, streakDays }`
- `GET /api/map?subject=math|english|reading|science` → `MapResponse { user, worlds, levels: LevelState[], subject, placementDone }` *(all 4 subjects accepted; user XP/stage/streak are the **subject's**)*
- `GET /api/levels/{stage}/problem` → `ProblemResponse { level, problem (no answer), stats, boss? }`
- `POST /api/levels/{stage}/answer` `{ token, answer, responseMs? }` → `AnswerResponse { correct, state: "hint"|"solved"|"revealed", hint?, solution?, attemptsRemaining, stats: Stats & { xpGained, progressDelta }, advanced?, nextProblem?, boss? }`
- `POST /api/guest` → `{ id, displayName, isGuest }` — creates a zeroed `isGuest` row; client stores the id and sends it back as the **`X-Guest-Id`** header (resolved in `auth.ts` before the demo fallback).
- `GET /api/leaderboard?subject=…` → `{ subject, leaderboard, currentUserRank, isGuest }` — per-subject, ranked by `SubjectProgress.totalXp` then streak, **all guests excluded**.
- `GET /api/placement?subject=…&level=N` → `PlacementProbe { subject, level, maxLevel, problem }`; `POST /api/placement` `{subject, level, token, answer}` → `PlacementResult { correct, done, nextLevel?, placedStage?, placedLevel?, clearedStages?, xpAwarded? }`, or `{subject, action:"skip"}` to skip.
- `GET /api/quests`, `GET /api/classrooms`, `GET /api/classrooms/[id]` — collaborator routes.

`Subject = "math"|"english"|"reading"|"science"`; `ProblemInputType = "numeric"|"fraction"|"expression"|"multiple-choice"` (English/Reading/Science use `multiple-choice`).

---

## 8. Backend modules (`lib/`)

- **`levelCatalog.ts`** — builds all 4 ladders; `catalogForSubject`, `levelForStage`, `subjectOfStage`, `firstStageOf`/`lastStageOf`, `worldMeta(subject)`.
- **`levels/generators.ts`** (math) + **`levels/{english,reading,science}/generators.ts`** — each exports `generate{Subject}ForLevel(skills, difficulty, rng)` → `GeneratedProblem`.
- **`levelEngine.ts`** — `getMap`, `getProblem`, `submitAnswer`. **Per-subject via `SubjectProgress`** (get-or-created per user×subject). Resolved/boss answers run in `$transaction({ timeout: 20000 })`; badges after; `generateFor(cat)` dispatches by `cat.subject`.
- **`progression.ts`**, **`answer.ts`** (numeric/fraction by value, MC by id, common-mistake match).
- **`db.ts`** — `@libsql/client/web` + adapter when `TURSO_DATABASE_URL` set, else local file. Singleton.
- **`auth.ts`** — `resolveUser(req)`: verifies Firebase ID token via `firebase-admin` (lazy; from `FIREBASE_SERVICE_ACCOUNT_JSON`/`_BASE64` or `FIREBASE_PROJECT_ID`+`CLIENT_EMAIL`+`PRIVATE_KEY`), upserts user by uid; else demo. `normalizePrivateKey` strips quotes + restores `\n`.
- **`session.ts`** — `getOrCreateDemoUser()`.
- **`ai/geminiHint.ts`** — Gemini REST, 4s timeout, fails safe to null.
- **`firebaseClient.ts`** — browser auth: `watchAuth`, `emailSignIn`, `googleSignIn` (popup; **Phase B adds redirect-primary**), `logout`, `isFirebaseConfigured`. Uses `browserLocalPersistence` so sessions auto-restore on reload.

---

## 9. The UI (`app/`)

- **`page.tsx`** → renders **`app-client.tsx`** (the live UI). The older `home-client.tsx` (collaborator classroom/quests tabs) is **unused**.
- **`app-client.tsx`** — dark glass SPA (title **"Young Learners 4"**, no emoji). Top bar: brand, **4-subject toggle** (all linked to their ladders), animated **count-up** XP/streak chips, and an identity control that is 3-state — logged-in (`name · Log out`), **guest** (`👤 Guest` badge + Sign up), or `Log in`. Three menus — **Game**, **Progress** (stat cards), **Leaderboard** (per-subject; ranked users see "you're #N", guests see a sign-up CTA).
  - **First visit:** an **intro dialog** (welcome + how-it-works) → leads into the **login dialog** (email/Google via `firebaseClient`, or "Continue as guest" → `POST /api/guest`). `yl_has_visited` (localStorage) gates it.
  - **Game loop:** world map + play view (numeric/fraction/MC, progress bar, two-hint flow). Boss stages render as a **dragon battle** (`DragonBattle`): reacting dragon, animated HP bar + hearts, victory animation + **confetti** on defeat. Solving pops **celebration toasts** (+XP, level cleared, dragon defeated).
  - **Placement test:** when a subject's `placementDone` is false, the map shows a "take placement / skip" banner. `PlacementView` runs one probe per level (ascending), then a result screen ("starting at Level N, cleared X levels, +Y XP").
  - **Caching/perf:** `map` / `me` / `leaderboard` are cached in `sessionStorage` **namespaced per identity** (`cacheKey`); switching subjects/tabs paints instantly with **no refetch**, forced fresh only after solving. Sends the Firebase ID token as `Authorization: Bearer`, or the guest id as `X-Guest-Id`.

---

## 10. Environment variables

`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (**required**). Optional: `GEMINI_API_KEY`
(+`GEMINI_MODEL`); Firebase backend — `FIREBASE_PROJECT_ID`/`CLIENT_EMAIL`/`PRIVATE_KEY`
**or** `FIREBASE_SERVICE_ACCOUNT_JSON`/`_BASE64`; Firebase frontend — the four
`NEXT_PUBLIC_FIREBASE_*` (public by design). Blank Firebase → guest/demo mode. Template
in `.env.example`. Push to Vercel via `vercel env add <NAME> production` → `vercel --prod`.

---

## 11. Key decisions / gotchas

1. **Per-subject offsets (+1000/+2000/+3000)** → subject derivable from stage; per-subject progress in `SubjectProgress`.
2. **`@libsql/client/web`** (HTTP, no native bindings) for Vercel serverless.
3. **Turso 5s interactive-transaction limit** → bumped to 20s + badges-after-commit + hint AI outside the tx.
4. **Firebase split** — public web config (`NEXT_PUBLIC_*`, safe) vs server-only service-account key (the real secret).
5. **Non-math subjects reuse math world ids** so the UI's color theming works unchanged.
6. **Thin client** — all logic server-side.

---

## 13. Current status & build plan

**Phases A–D — ALL DONE** (committed; A & B pushed; C & D + intro/caching/title local-verified and pushed):
- **A** — 4 subjects (math 247, english/reading/science 60 each) + generators/content; `SubjectProgress` (per-subject XP/streak/stage); `isGuest`. Engine refactored, seed updated.
- **B** — Google sign-in `signInWithRedirect` (primary) + popup fallback + `getRedirectResult` persistence; guest mode (`POST /api/guest`, `X-Guest-Id`, guest badge, zeroed stats); per-subject **guest-excluded** leaderboards with friendly rank copy.
- **C** — answer **response-time analytics** (`Attempt.responseMs`, measured client-side); **placement test** (`/api/placement`, one probe/level ascending, auto-clears below the placement point to 3★ + XP, sets `placementDone`).
- **D** — **dragon-battle** boss re-skin (reacting dragon, HP bar, victory + confetti), **count-up** XP/streak counters, **celebration toasts**.
- Also: title → **"Young Learners 4"**, first-visit **intro dialog**, **map route accepts all 4 subjects** (reading/science were falling back to math), **browser caching** of map/me/leaderboard.

### Deploy readiness
- Turso schema is **up to date**: `Attempt.responseMs` was applied (`ALTER TABLE "Attempt" ADD COLUMN "responseMs" INTEGER`, 2026-06-14), and `SubjectProgress`, `isGuest`, `placementDone` already existed. No pending migrations — Phase C/D are safe to deploy.

### ⚠️ Security
Secrets were pasted in chat during setup (Turso token, Gemini key, Firebase web config). The web config is fine to expose; **rotate the Turso token + Gemini key**, and never commit the service-account private key (keep it in the gitignored `.env`).

---

## 14. Run / verify locally

```bash
npm install
DATABASE_URL="file:./dev.db" npx prisma db push     # or set TURSO_* in .env to use Turso
DATABASE_URL="file:./dev.db" npm run db:seed
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run build        # prisma generate && next build
```
The seed routes through `lib/db`, so with `TURSO_*` set it seeds **Turso**. To run/seed
against the **local file** instead (recommended for verification — no prod writes),
**blank `TURSO_DATABASE_URL`** so `lib/db` falls back to `DATABASE_URL`:
```bash
DATABASE_URL="file:./dev.db" TURSO_DATABASE_URL="" npx prisma db push
DATABASE_URL="file:./dev.db" TURSO_DATABASE_URL="" npx tsx prisma/seed.ts
TURSO_DATABASE_URL="" npx next dev -p 3300        # serves the local file
```
Turso schema changes are applied by hand-written SQL via `@libsql/client` (it doesn't
speak the Prisma CLI's migrate) — see §13 for the pending `Attempt.responseMs` ALTER.
