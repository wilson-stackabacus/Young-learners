# Young Learners 

Young Learners is an adaptive, gamified learning platform built for K-8 students. The system dynamically scales problem difficulty based on real-time student performance, helping learners build math, reading, science, and grammar skills at their own pace.

---

## Core Features

- Adaptive Difficulty Engine: The system adjusts problem complexity based on a rolling window of recent attempts.
- Multi-Subject Curriculum: Supports Math, English, Reading, and Science, with independent XP tracking and progression states.
- Diagnostic Hints: A two-hint flow gives conceptual guidance when a student makes a mistake. Predictable common misconceptions trigger specific, targeted hints instead of generic ones.
- Boss Gates: Gated topics that require students to clear a no-hint challenge with limited hearts to unlock the next levels.
- Gamification & Habit Loop: Tracks daily streaks (with streak-freeze protection), awards XP per challenge, and unlocks performance-based badges.
- Classrooms & Cohorts: Basic administration dashboards allowing teachers or parents to monitor student progress and performance metrics.

---

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript | Full-stack architecture, type-safe API routing, and server rendering |
| Styling | React + Tailwind CSS | Responsive styling and micro-interactions |
| Database & ORM | SQLite / libSQL + Prisma | Relational schemas for progress tracking, local SQLite file development, and remote Turso production |
| Authentication | Auth.js / NextAuth | Student, guest, and teacher authentication |

---

## Project Structure

```plaintext
├── app/                  # Next.js pages, layouts, and API routes
│   ├── (auth)/           # Onboarding and auth pages
│   ├── (learn)/          # Dashboard, map view, and problem layouts
│   └── api/              # Backend endpoints for progress tracking and answers
├── components/           # Reusable UI components (XP bars, badges, toasts)
├── lib/                  # Application core logic
│   ├── adaptive/         # Difficulty matching and hint generation
│   └── gamification/     # XP rules, streak resets, and badge checks
├── prisma/               # Database schemas and seed data
└── shared/               # Type contracts for API request/response payloads
```

---

## Getting Started

### Prerequisites

- Node.js (v18.x or higher)
- npm

### Installation & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Initialize the SQLite database & seed data:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. Run the local development server:
   ```bash
   npm run dev
   ```
   Open https://younglearners.vercel.app/ in your browser to view the application.
