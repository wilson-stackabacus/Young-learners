# Young Learners 🎯

An adaptive, gamified educational ecosystem built for K-8 students.

Young Learners is inspired by continuous mastery frameworks like AoPS Alcumus. The system dynamically adjusts problem difficulty based on real-time student performance, helping learners build confidence while progressing through structured skill paths.

The application uses a professional but approachable visual style built around light reds, light blues, and light greens. It focuses on clear layout design, tactile interactions, and micro-interactions that work for both early elementary students and middle school learners.

---

## Core Architecture

### 🧠 Adaptive Learning Engine

**Dynamic Problem Matching**
An underlying scoring engine pairs users with content at their current skill threshold, optimizing for confidence, growth, and long-term progression.

**Prerequisite Skill Paths**
Interconnected curriculum trees ensure that advanced modules remain locked until foundational milestones are mastered.

**Gemini-Powered Coaching**
When a student submits an incorrect answer, the coaching module analyzes their reasoning and provides targeted conceptual hints without revealing the solution.

---

## Challenge Modes & Retention

### ⚔️ Boss Battles

High-stakes topic gates with limited health pools, hearts, and countdown timers. These challenges validate whether a student has truly mastered a module.

### Visual Milestones

Earned experience points fill progress bars and trigger localized particle celebrations when students complete important tiers.

### Habit Formation

Daily streak tracking includes forgiving streak-freeze mechanics to encourage consistent learning without overly punishing missed days.

---

## Personalization & Admin Tools

### ⚙️ Live Theme Engine

Students can update layout accents and navigation tones in real time from their customization dashboard.

### Dynamic Profile Hubs

User profile areas display character levels, companion mechanics, progression metrics, and active learning status.

### Parent & Teacher Matrix

Administrative tools allow educators and parents to view heatmaps, track learning velocity, and manage class cohorts.

---

## Technical Stack

| Layer            | Technology                         | Purpose                                                                                        |
| ---------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| Framework        | Next.js 14 App Router + TypeScript | Full-stack application structure, type-safe API routing, and server-side rendering performance |
| Styling & Motion | React + Tailwind CSS               | High-performance layouts with responsive styling and micro-interactions                        |
| State Management | TanStack Query + Zustand           | Client-side global state and server-state caching                                              |
| Database & ORM   | PostgreSQL + Prisma                | Relational schemas for profiles, attempts, progress, and curriculum structure                  |
| Authentication   | Auth.js / NextAuth                 | Multi-tenant authentication prepared for Firebase and OAuth hooks                              |
| Background Jobs  | Inngest / Redis Workers            | Asynchronous calculations for streak resets, leaderboard decay, and scheduled updates          |

---

## Project Structure

```plaintext
young-learners/
├── app/                  # Next.js pages, layouts, and system actions
│   ├── (auth)/           # Onboarding and authentication views
│   ├── (learn)/          # Workspace, problem engine, and learner dashboards
│   └── api/              # Internal API endpoints and webhook handlers
├── components/           # Reusable UI components
├── lib/                  # Application core logic
│   ├── adaptive/         # Difficulty algorithms and Gemini feedback pipelines
│   └── gamification/     # XP allocation, level tiers, and streak safety checks
├── prisma/               # Database migrations, configuration, and seed data
├── content/              # K-8 static problem modules and skill maps
├── public/               # SVGs, audio files, and system assets
└── tests/                # Unit tests and Playwright end-to-end tests
```

---

## Getting Started

### Prerequisites

Before running the project, make sure you have:

* Node.js `v18.x` or higher
* A PostgreSQL database instance
* npm or another Node package manager

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/young-learners.git
cd young-learners
```

Scaffold the application framework:

```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint
```

Install Prisma and the database dependencies:

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

---

## Environment Configuration

Duplicate the sample environment file:

```bash
cp .env.example .env
```

Open `.env` and add your PostgreSQL connection string:

```env
DATABASE_URL="your-postgresql-connection-string"
```

Push the schema to the database:

```bash
npx prisma db push
```

Start the local development server:

```bash
npm run dev
```

The workspace will run locally at:

```plaintext
http://localhost:3000
```

---

## Development Roadmap

* [ ] Initialize the base application shell and environment pipelines.
* [ ] Implement Prisma schemas for profiles, sessions, attempts, and metrics.
* [ ] Build the central Problem Card component with responsive answer layouts.
* [ ] Connect the Gemini API simulator for intelligent error correction feedback.
* [ ] Create the interactive Boss Battle challenge overlay.
* [ ] Add real-time color customization controls using local system state.
* [ ] Build the backend schema control room with mock API endpoints.
* [ ] Structure the authentication gateway for Google and email login.
* [ ] Optimize touch targets and media queries for K-8 tablet devices.
* [ ] Seed content directories with baseline math and reading comprehension modules.

---

## License

This project is currently under active development. Add license details before public release.
