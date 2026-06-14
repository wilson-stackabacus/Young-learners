import { buildCatalog } from "../lib/levelCatalog";
// Use the shared client so the seed targets Turso when TURSO_DATABASE_URL is set,
// and the local SQLite file otherwise.
import { prisma } from "../lib/db";

// Real, static configuration only — NO placeholder users, classrooms, or
// progress. The leaderboard and progress views fill in from genuine play.
const BADGES = [
  { slug: "first-steps", name: "First Steps", description: "Answer your first problem.", tier: "bronze", rule: { type: "first_attempt" } },
  { slug: "getting-going", name: "Getting Going", description: "Solve 10 problems.", tier: "bronze", rule: { type: "total_problems_solved", min: 10 } },
  { slug: "century", name: "Century", description: "Solve 100 problems.", tier: "silver", rule: { type: "total_problems_solved", min: 100 } },
  { slug: "climbing", name: "Climbing", description: "Clear 5 levels.", tier: "bronze", rule: { type: "levels_cleared", min: 5 } },
  { slug: "stage-50", name: "Trailblazer", description: "Reach stage 50.", tier: "silver", rule: { type: "stage_reached", min: 50 } },
  { slug: "on-fire", name: "On Fire", description: "Get 10 correct in a row.", tier: "silver", rule: { type: "perfect_set", count: 10 } },
  { slug: "week-streak", name: "Week Warrior", description: "Reach a 7-day streak.", tier: "silver", rule: { type: "streak_days", min: 7 } },
  { slug: "month-streak", name: "Unstoppable", description: "Reach a 30-day streak.", tier: "gold", rule: { type: "streak_days", min: 30 } },
];

const QUESTS = [
  { slug: "solve-3-problems", title: "Daily Practice", description: "Solve 3 problems correctly today.", type: "problems_solved", targetValue: 3, xpReward: 50 },
  { slug: "earn-100-xp", title: "XP Grinder", description: "Earn 100 total XP today.", type: "xp_earned", targetValue: 100, xpReward: 100 },
  { slug: "clear-1-level", title: "Level Up!", description: "Reach a progress of 100% to clear any level.", type: "clear_level", targetValue: 100, xpReward: 150 },
  { slug: "perfect-streak-5", title: "Sharp Shooter", description: "Get a correct-answer streak of 5 problems in a row.", type: "correct_streak", targetValue: 5, xpReward: 200 },
];

async function main() {
  console.log("🌱 Seeding levels, badges, and quests (no placeholder data)...");

  // Wipe data in FK-safe order.
  await prisma.userQuest.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.classroomMember.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.pendingProblem.deleteMany();
  await prisma.levelProgress.deleteMany();
  await prisma.subjectProgress.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.level.deleteMany();
  await prisma.user.deleteMany();

  console.log("Wiped old data.");

  // 1. Seed the level ladder (the real catalog).
  const catalog = buildCatalog();
  await prisma.level.createMany({
    data: catalog.map((l) => ({
      stage: l.stage,
      subject: l.subject,
      tier: l.tier,
      stageInTier: l.stageInTier,
      kind: l.kind,
      skills: JSON.stringify(l.skills),
      world: l.world,
      difficulty: l.difficulty,
      isBoss: l.isBoss,
      testsLevel: l.testsLevel ?? null,
    })),
  });
  console.log(`Seeded ${catalog.length} levels.`);

  // 2. Seed badge definitions.
  for (const b of BADGES) {
    await prisma.badge.create({
      data: { slug: b.slug, name: b.name, description: b.description, tier: b.tier, rule: JSON.stringify(b.rule) },
    });
  }
  console.log(`Seeded ${BADGES.length} badges.`);

  // 3. Seed quest definitions.
  for (const q of QUESTS) {
    await prisma.quest.create({ data: q });
  }
  console.log(`Seeded ${QUESTS.length} quests.`);

  console.log("✅ Seed completed — no placeholder accounts or progress.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
