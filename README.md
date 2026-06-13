# Questline 🎯

A gamified, level-based learning platform — in the spirit of [AoPS Alcumus](https://artofproblemsolving.com/alcumus). Learners climb a ladder of skill levels (from basic arithmetic up to Algebra 1), advancing as they demonstrate mastery. A wrong answer never just says "incorrect" — it gives a hint about what likely went wrong.

> **Status:** Environment scaffold + design spec + a UI prototype. This repository contains the project setup, the design documents, the API contract, and a clickable world-map prototype — but **not** the production app yet. Start here:
> - [`docs/DESIGN.md`](docs/DESIGN.md) — how it works (progress bar, hints, generators)
> - [`docs/CURRICULUM.md`](docs/CURRICULUM.md) — the 225-level ladder
> - [`docs/API.md`](docs/API.md) + [`shared/contract.ts`](shared/contract.ts) — the backend ↔ frontend data contract
> - [`prototype/level-map.html`](prototype/level-map.html) — the Angry-Birds-style world map (open in a browser)

---

## Vision

Alcumus works because it does three things well:

1. **Gates on mastery** — you move forward by proving you can do the current skill, not by clicking "next."
2. **Rewards** — progress is visible and constant (a filling progress bar, XP, streaks, badges).
3. **Focuses** — one problem at a time, with hints and full solutions on demand.

Questline reproduces that loop as a **linear level ladder**: each level drills one skill, problems are generated on the fly, and you advance when a progress bar fills.

---

## Core Features (planned)

### Learning engine
- **Level ladder** — a linear sequence of skills, from `Addition` to `Quadratics (rational roots)`. See [`docs/CURRICULUM.md`](docs/CURRICULUM.md).
- **Procedural generators** — each level generates fresh problems on the fly (no static question bank), so the answer is always known and practice never runs out.
- **Progress-bar advancement** — a 0–100 bar per level, driven mostly by rolling accuracy but always nudged up by volume. Fill it to advance. See [`docs/DESIGN.md`](docs/DESIGN.md).
- **Diagnostic feedback** — a wrong answer triggers Hint 1 → retry → Hint 2 → retry → full worked solution, with hints targeted to the specific mistake when recognized.

### Gamification
- **XP & levels** — earn experience for solving; level up to unlock content/cosmetics.
- **Streaks** — daily activity streaks with freezes.
- **Badges & achievements** — milestones (first 100 problems, topic mastery, perfect set, etc.).
- **Leaderboards** — opt-in, by class/cohort/global, with anti-cheese safeguards.
- **Quests** — daily/weekly challenges for bonus rewards.

### Progress & social
- **Dashboards** — mastery heatmap, accuracy over time, time-on-task.
- **Classrooms** — teacher assigns topics, sees per-student progress.
- **Profiles** — public stats, badge case, current level.

---

## Suggested Tech Stack

Nothing here is locked in — it's a sensible default for a project of this shape. Swap freely.

| Layer            | Choice                                  | Why                                            |
|------------------|-----------------------------------------|------------------------------------------------|
| Frontend         | **Next.js (App Router) + TypeScript**   | World-map & problem UI, hosted on Vercel       |
| UI               | **React + Tailwind CSS** + **KaTeX**    | Fast iteration; KaTeX renders math             |
| State / data     | **TanStack Query** + **Zustand**        | Server cache + light client state              |
| Backend          | **Next.js API routes** (serverless)     | Generates problems, checks answers, owns logic |
| Database         | **SQLite via libSQL / Turso** + **Prisma** | Vercel-friendly hosted SQLite; same SQL local |
| Auth             | **Auth.js (NextAuth)**                  | Social + email login out of the box            |
| Testing          | **Vitest** + **Playwright**             | Unit + end-to-end                              |
| Hosting          | **Vercel** + **Turso**                  | Low-ops serverless deploys                      |

---

## Getting Started

> The app is not scaffolded yet. Once you choose a stack, initialize it inside this repo. For the suggested stack:

```bash
# From the repo root
npx create-next-app@latest . --typescript --tailwind --app --eslint

# Add data layer
npm install @prisma/client && npm install -D prisma
npx prisma init

# Copy and fill environment variables
cp .env.example .env
```

Then run the dev server:

```bash
npm run dev
```

---

## Proposed Project Structure

What exists today is marked ✓; the rest is the target layout once development begins.

```
questline/
├── docs/                 # ✓ DESIGN.md, CURRICULUM.md, API.md
├── shared/               # ✓ contract.ts — backend ↔ frontend types
├── prototype/            # ✓ level-map.html — clickable world-map prototype
├── app/                  # Next.js routes (App Router)
│   ├── (auth)/           # Login, signup
│   ├── (learn)/          # Problem-solving UI, dashboards
│   └── api/              # Route handlers (the backend) — see docs/API.md
├── components/           # Reusable UI (problem card, progress bar, badge)
├── lib/                  # Core logic
│   ├── levels/           # One generator per level + its common mistakes
│   ├── progression/      # Progress-bar engine, advancement rules
│   └── gamification/     # XP, streaks, badges, quests
├── prisma/               # schema.prisma, migrations, seed data
├── public/               # Static assets
└── tests/                # Unit + e2e
```

---

## Data Model (sketch)

The minimum entities to make the level loop work (full version in [`docs/DESIGN.md`](docs/DESIGN.md)):

- **User** — profile, current level, total XP, current streak.
- **Level** — id, order, name, tier. (The problem *generator* is code, keyed by id.)
- **LevelProgress** — user × level, progress (0–100), rolling window of the last 10 results, totals.
- **Attempt** — user × level, prompt, given answer, correct?, hints used, solved-after-hint, timestamp.
- **Badge / Achievement** — definition + user unlocks.

---

## Roadmap

- [x] Define the system design and level ladder ([`docs/`](docs/))
- [ ] Choose and scaffold the application stack
- [ ] Define the data model and run first migration
- [ ] Write the first few level generators (arithmetic) + their common mistakes
- [ ] Build the single-problem loop (generate → answer → hint → solution)
- [ ] Implement the progress-bar advancement engine
- [ ] Add XP, levels, and streaks
- [ ] Add badges, achievements, and quests
- [ ] Build the learner dashboard
- [ ] Extend generators up through Algebra 1
- [ ] Add classrooms / teacher views and leaderboards

---

## Contributing

This is an early-stage personal project. Branch from `main`, keep commits focused, and open a PR when ready.

## License

No license chosen yet. Add one (e.g. MIT) before making the repo public.
