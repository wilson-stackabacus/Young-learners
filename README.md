Young LearnersYoung Learners is an adaptive, gamified educational platform built specifically for K-8 students. Inspired by continuous mastery frameworks like AoPS Alcumus, the system dynamically scales problem difficulty based on real-time performance metrics.The application features a modern, clean visual theme anchored by light reds, light blues, and light greens. It prioritizes deliberate UX design, tactile interactive states, and micro-interactions that scale gracefully from early childhood up to middle school concepts without relying on cartoonish derivatives.Core Architecture🧠 Adaptive Learning Engine & CoachingDynamic Problem Matching: An underlying scoring engine pairs users with content at their precise skill threshold, optimizing for confidence and progression.Prerequisite Skill Paths: Interconnected curricular trees where advanced modules remain locked until prerequisite structural milestones are mastered.Gemini-Powered Error Analysis: When a user submits an incorrect answer, an integrated coaching module provides a contextual breakdown analyzing the student's logic, offering targeted conceptual hints without revealing the solution.⚔️ Challenge Modes & RetentionBoss Battles: High-stakes topic gates featuring limited health pools (hearts) and countdown timers designed to rigorously validate module mastery.Visual Milestones: Earned experience points (XP) fill visual tracking bars, triggering localized particle celebrations upon tier completion.Habit Formation: Forgiving daily streak tracking equipped with automated streak-freeze mechanics to foster consistent learning routines.⚙️ Personalization & AdministrationLive Theme Engine: Users can update layout accent values and navigation tones in real time directly from their customization dashboard.Dynamic Profile Hubs: Dedicated user areas showcasing character levels, active companion mechanics, and progression metrics.Parent & Teacher Matrix: Explicit administrative hooks allowing educators to pull heatmaps, track learning velocity, and manage class cohorts.Technical StackLayerTechnologyPurposeFrameworkNext.js 14 (App Router) + TypeScriptFull-stack application structure, type-safe API routing, and SSR performance.Styling & MotionReact + Tailwind CSSHigh-performance layouts using physical micro-scaling transitions.State ManagementTanStack Query + ZustandClient-side UI global state paired with automated server-state caching.Database & ORMPostgreSQL + PrismaRelational schemas tracking profiles, attempts, and curriculum structure.AuthenticationAuth.js (NextAuth)Multi-tenant authentication pipeline prepared for Firebase/OAuth hooks.Background ProcessingInngest / Redis WorkersHandles asynchronous calculations for daily streak resets and leaderboard decay.Project StructurePlaintextyoung-learners/
├── app/                  # Next.js pages, layouts, and system actions
│   ├── (auth)/           # Low-friction onboarding and authentication views
│   ├── (learn)/          # Workspace, problem engine, and learner dashboards
│   └── api/              # Internal API endpoints and webhook handlers
├── components/           # Reusable UI elements (tactile input grids, progress tracking)
├── lib/                  # Application core logic
│   ├── adaptive/         # Difficulty algorithms and Gemini feedback pipelines
│   └── gamification/     # XP allocation, level tiers, and streak safety checks
├── prisma/               # Database migrations, configurations, and baseline seeds
├── content/              # K-8 static problem modules and relational skill maps
├── public/               # Optimized SVGs, audio queues, and system assets
└── tests/                # Automated unit verification and Playwright end-to-end suites
Getting StartedPrerequisitesNode.js (v18.x or higher)PostgreSQL database instanceInstallationClone the repository and initialize the foundation stack:Bash# Clone the project repository
git clone https://github.com/your-username/young-learners.git
cd young-learners

# Scaffold the application framework
npx create-next-app@latest . --typescript --tailwind --app --eslint

# Add the database layer and ORM dependencies
npm install @prisma/client
npm install -D prisma
npx prisma init
Environment ConfigurationDuplicate the sample configuration file:Bashcp .env.example .env
Open .env and map your DATABASE_URL with your local or cloud PostgreSQL connection string.Push the schema maps and run the local development server:Bashnpx prisma db push
npm run dev
The workspace will be running locally at http://localhost:3000.Development Roadmap[ ] Initialize base application shell and environment pipelines.[ ] Implement Prisma schema migrations to map profiles, sessions, and metrics.[ ] Build the central core Problem Card component with responsive choice structures.[ ] Connect the Gemini API simulator for intelligent error correction text.[ ] Code the state triggers for the interactive Boss Battle challenge overlay.[ ] Integrate real-time color customizer controls tracking to local system state.[ ] Wire up the complete backend schema control room to expose API mock endpoints.[ ] Structure the minimalist gateway for Google and Email authentication hooks.[ ] Optimize touch targets and media queries for standard K-8 tablets.[ ] Seed content directories with baseline mathematical and reading comprehension sets.LicenseDistributed under the MIT License. See LICENSE for more information.
