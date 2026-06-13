# Questline — Backend ↔ Frontend API Contract

This document + [`shared/contract.ts`](../shared/contract.ts) define the **outputs** the backend produces so the frontend can consume them directly. `contract.ts` holds the TypeScript types; this file describes the endpoints, the database, and shows JSON examples.

---

## Architecture

| Piece | Where | Responsibility |
|-------|-------|----------------|
| **Frontend** | Vercel (Next.js) | World-map UI + problem UI. Handles login (Auth.js). Holds **no** problem logic. |
| **Backend** | Vercel serverless API routes (`/api/*`) | The brains: reads/writes the DB, generates problems, checks answers, computes XP / accuracy / progress. |
| **Database** | SQLite via **libSQL / Turso** | `users`, `levels`, `level_progress`, `attempts`. |

Two rules that shape everything below:

> **The frontend never connects to the database.** It sends the signed-in user's token to the backend; the backend authorizes the request and runs every query. (A browser holding DB credentials is unsafe.)

> **The correct answer never reaches the browser.** The backend keeps it (keyed by the problem `token`) and checks submissions server-side, so answers can't be read from the network tab.

### A note on SQLite + Vercel

A plain `.sqlite` file does **not** persist on Vercel — serverless functions have an ephemeral, read-only filesystem. Use **[Turso](https://turso.tech) / libSQL**: hosted SQLite with the same SQL, reachable over HTTP from serverless functions. Local development can still use a file (`file:./questline.db`). Prisma and Drizzle both support libSQL, so the ORM choice is unchanged.

---

## Data flow

1. **Sign in & load the map** — frontend calls `GET /api/map` with the auth token → backend reads the user + saved progress → returns all 225 levels with state, plus XP & streak. The world map renders from this.
2. **Play a level** — frontend calls `GET /api/levels/{stage}/problem` → backend reads progress, **generates** a problem (storing the answer server-side), and returns *level + XP + accuracy + question*. The user answers → `POST /api/levels/{stage}/answer` → backend checks it, runs the two-hint flow + progress formula ([`DESIGN.md`](DESIGN.md)), writes an attempt + updated progress, and returns *result + hint/solution + new stats*. Repeat until the bar hits 100 and the next stage unlocks.

---

## Database schema (SQLite / libSQL)

```sql
-- Account. `id` comes from the auth provider (e.g. Auth.js).
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  total_xp      INTEGER NOT NULL DEFAULT 0,
  current_stage INTEGER NOT NULL DEFAULT 1,   -- 1..225
  streak_days   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The 225 stages. Fully derivable from the 45-tier formula, but storing it
-- keeps queries simple. Seed once.
CREATE TABLE levels (
  stage         INTEGER PRIMARY KEY,          -- 1..225
  tier          INTEGER NOT NULL,             -- 1..45
  stage_in_tier INTEGER NOT NULL,             -- 1..5
  kind          TEXT NOT NULL,                -- 'pure' | 'blend'
  skills        TEXT NOT NULL,                -- JSON, e.g. '[4,5]'
  world         TEXT NOT NULL,                -- 'arithmetic' | 'integers' | ...
  difficulty    REAL NOT NULL                 -- 4 or 4.5
);

-- Per-user progress on each stage. The heart of the adaptive loop.
CREATE TABLE level_progress (
  user_id        TEXT NOT NULL,
  stage          INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'locked',  -- 'locked' | 'current' | 'cleared'
  progress       INTEGER NOT NULL DEFAULT 0,      -- 0..100 progress bar
  stars          INTEGER NOT NULL DEFAULT 0,      -- 0..3
  total_correct  INTEGER NOT NULL DEFAULT 0,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  recent_results TEXT NOT NULL DEFAULT '[]',      -- JSON: rolling window of last 10 booleans
  cleared_at     TEXT,
  PRIMARY KEY (user_id, stage),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- One row per submitted answer. Drives accuracy + analytics.
CREATE TABLE attempts (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           TEXT NOT NULL,
  stage             INTEGER NOT NULL,
  prompt            TEXT NOT NULL,
  given_answer      TEXT,
  correct           INTEGER NOT NULL,             -- 0 | 1
  hints_used        INTEGER NOT NULL DEFAULT 0,
  solved_after_hint INTEGER NOT NULL DEFAULT 0,   -- 0 | 1
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

The active (unanswered) generated problem is held server-side keyed by its `token` — either a row in a small `pending_problems` table or a signed/HMAC token that encodes the problem + answer. Either way, the answer stays on the server.

---

## Endpoints

All responses are JSON. Auth token travels in the `Authorization` header. Types in [`shared/contract.ts`](../shared/contract.ts).

### `GET /api/me` → `MeResponse`
Account summary for the header.
```json
{ "id": "u_8f3", "displayName": "Ryan", "totalXp": 1240, "currentStage": 39, "streakDays": 5 }
```

### `GET /api/map` → `MapResponse`
Everything the world map needs. Feeds [`prototype/level-map.html`](../prototype/level-map.html).
```json
{
  "user": { "id": "u_8f3", "displayName": "Ryan", "totalXp": 1240, "currentStage": 39, "streakDays": 5 },
  "worlds": [
    { "id": "arithmetic",  "name": "Arithmetic",           "skillRange": [1, 9],   "stageRange": [1, 90] },
    { "id": "integers",    "name": "Integers & rationals", "skillRange": [10, 15], "stageRange": [91, 150] },
    { "id": "pre-algebra", "name": "Pre-algebra",          "skillRange": [16, 19], "stageRange": [151, 190] },
    { "id": "algebra-1",   "name": "Algebra 1",            "skillRange": [20, 23], "stageRange": [191, 225] }
  ],
  "levels": [
    { "stage": 38, "tier": 8, "stageInTier": 3, "kind": "blend", "skills": [4, 5], "skillNames": ["Multiplication", "Subtract & multiply"], "world": "arithmetic", "difficulty": 4.5, "status": "cleared", "progress": 100, "stars": 3 },
    { "stage": 39, "tier": 8, "stageInTier": 4, "kind": "blend", "skills": [4, 5], "skillNames": ["Multiplication", "Subtract & multiply"], "world": "arithmetic", "difficulty": 4.5, "status": "current", "progress": 40, "stars": 0 }
    // … 225 entries total
  ]
}
```

### `GET /api/levels/{stage}/problem` → `ProblemResponse`
"Level + XP + accuracy + question." The backend generates the problem and stores its answer server-side; the response omits the answer.
```json
{
  "level": { "stage": 39, "tier": 8, "stageInTier": 4, "kind": "blend", "skills": [4, 5], "skillNames": ["Multiplication", "Subtract & multiply"], "world": "arithmetic", "difficulty": 4.5 },
  "problem": { "token": "pb_a1b2c3", "stage": 39, "prompt": "7 × 6 − 9", "latex": "7 \\times 6 - 9", "inputType": "numeric" },
  "stats": { "totalXp": 1240, "accuracy": 0.7, "progress": 40, "stars": 0, "streakDays": 5 }
}
```

### `POST /api/levels/{stage}/answer` → `AnswerResponse`
Body is an `AnswerRequest`: `{ "token": "pb_a1b2c3", "answer": "-21" }`. The three possible outcomes:

**Wrong, hints remain (`hint`)** — progress is untouched until the problem resolves:
```json
{
  "correct": false,
  "state": "hint",
  "hint": "Looks like you subtracted first — do × before −.",
  "attemptsRemaining": 1,
  "stats": { "totalXp": 1240, "accuracy": 0.7, "progress": 40, "stars": 0, "streakDays": 5, "xpGained": 0, "progressDelta": 0 }
}
```

**Correct (`solved`)** — XP and the bar go up; a fresh problem is included:
```json
{
  "correct": true,
  "state": "solved",
  "attemptsRemaining": 1,
  "stats": { "totalXp": 1252, "accuracy": 0.75, "progress": 52, "stars": 0, "streakDays": 5, "xpGained": 12, "progressDelta": 12 },
  "nextProblem": { "token": "pb_d4e5f6", "stage": 39, "prompt": "9 × 4 − 7", "latex": "9 \\times 4 - 7", "inputType": "numeric" }
}
```

**Out of hints (`revealed`)** — solution shown, small penalty applied:
```json
{
  "correct": false,
  "state": "revealed",
  "solution": "7 × 6 = 42, then 42 − 9 = 33.",
  "attemptsRemaining": 0,
  "stats": { "totalXp": 1240, "accuracy": 0.64, "progress": 36, "stars": 0, "streakDays": 5, "xpGained": 0, "progressDelta": -4 },
  "nextProblem": { "token": "pb_g7h8i9", "stage": 39, "prompt": "8 × 5 − 6", "latex": "8 \\times 5 - 6", "inputType": "numeric" }
}
```

When an answer fills the bar to 100, the response also carries `"advanced": { "toStage": 40 }` and the next problem belongs to the unlocked stage.

---

## How XP / accuracy / progress are computed

The backend owns all of these (see [`DESIGN.md`](DESIGN.md) for the full model). Defaults:

- **accuracy** = correct answers ÷ attempts within the last 10 on this stage.
- **progress** (per resolved problem): `+ (6 + 8 × accuracy)` on a solve, `− 4` on a fail. Reaching 100 clears the stage.
- **XP**: e.g. `10 × difficulty` per solve, with a bonus for solving without hints.
- **stars**: derived from accuracy at the moment the stage is cleared (e.g. ≥90% → 3★, ≥70% → 2★, else 1★).

All constants are tunable and live in one place (see `DESIGN.md` §5).

---

## Wiring the prototype to this contract

[`prototype/level-map.html`](../prototype/level-map.html) currently builds the 225 nodes client-side from the formula with mock progress. To go live, replace that with a `fetch('/api/map')` and render from `MapResponse.levels` — the fields line up exactly (`stage`, `world`, `status`, `stars`, `skills`, `difficulty`).
