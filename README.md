# Questline 🎯

A gamified, adaptive learning platform — in the spirit of [AoPS Alcumus](https://artofproblemsolving.com/alcumus). Learners work through problems that adjust in difficulty to their performance, earning XP, levels, streaks, and badges as they master topics.

> **Status:** Environment scaffold only. This repository currently contains the project setup (git, README, `.gitignore`). The application itself has not been built yet — see the [Roadmap](#roadmap) for what comes next.

---

## Vision

Alcumus works because it does three things well:

1. **Adapts** — it tracks mastery per topic and serves problems that are neither too easy nor too hard.
2. **Rewards** — progress is visible and constant (XP, ratings, topic completion bars).
3. **Focuses** — one problem at a time, with full solutions and immediate feedback.

Questline aims to reproduce that loop for any subject, not just math.

---

## Core Features (planned)

### Learning engine
- **Adaptive difficulty** — per-topic mastery scores drive problem selection (e.g. an Elo-style rating per user × topic).
- **Topic tree / skill map** — prerequisites unlock as foundations are mastered.
- **Problem types** — multiple choice, numeric entry, short answer, with hints and step-by-step solutions.
- **Immediate feedback** — correct/incorrect, full solution, and "explain why."

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
| Framework        | **Next.js (App Router) + TypeScript**   | Full-stack, SSR, API routes in one place       |
| UI               | **React + Tailwind CSS**                | Fast iteration, consistent design system       |
| State / data     | **TanStack Query** + **Zustand**        | Server cache + light client state              |
| Database         | **PostgreSQL** + **Prisma ORM**         | Relational data (users, attempts, topics)      |
| Auth             | **Auth.js (NextAuth)**                  | Social + email login out of the box            |
| Background jobs  | **Inngest** or a queue + worker         | Streak resets, leaderboard recompute           |
| Testing          | **Vitest** + **Playwright**             | Unit + end-to-end                              |
| Hosting          | **Vercel** + managed Postgres (Neon/Supabase) | Low-ops deploys                          |

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

A target layout once development begins (for reference — not yet created):

```
questline/
├── app/                  # Next.js routes (App Router)
│   ├── (auth)/           # Login, signup
│   ├── (learn)/          # Problem-solving UI, dashboards
│   └── api/              # Route handlers
├── components/           # Reusable UI (problem card, XP bar, badge)
├── lib/                  # Adaptive engine, scoring, gamification logic
│   ├── adaptive/         # Difficulty selection, mastery model
│   └── gamification/     # XP, streaks, badges, quests
├── prisma/               # schema.prisma, migrations, seed data
├── content/              # Problem banks, topic tree definitions
├── public/               # Static assets
└── tests/                # Unit + e2e
```

---

## Data Model (sketch)

The minimum entities to make the adaptive loop work:

- **User** — profile, level, total XP, current streak.
- **Topic** — name, prerequisites, position in the skill tree.
- **Problem** — topic, difficulty rating, statement, choices/answer, solution, hints.
- **Attempt** — user × problem, correct?, time taken, timestamp.
- **Mastery** — user × topic rating (updated after each attempt).
- **Badge / Achievement** — definition + user unlocks.

---

## Roadmap

- [ ] Choose and scaffold the application stack
- [ ] Define the data model and run first migration
- [ ] Build the single-problem solving loop (serve → answer → feedback)
- [ ] Implement the adaptive difficulty engine
- [ ] Add XP, levels, and streaks
- [ ] Add badges, achievements, and quests
- [ ] Build learner dashboard (mastery heatmap)
- [ ] Add classrooms / teacher views
- [ ] Add leaderboards
- [ ] Author an initial problem bank for one subject

---

## Contributing

This is an early-stage personal project. Branch from `main`, keep commits focused, and open a PR when ready.

## License

No license chosen yet. Add one (e.g. MIT) before making the repo public.
