/**
 * Seed: the 225-level ladder (from lib/levelCatalog), the badge set, and a
 * demo user starting at stage 1.
 */
import { PrismaClient } from "@prisma/client";
import { buildCatalog } from "../lib/levelCatalog";

const prisma = new PrismaClient();

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

async function main() {
  console.log("🌱 Seeding…");

  // Wipe in FK-safe order.
  await prisma.userBadge.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.pendingProblem.deleteMany();
  await prisma.levelProgress.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.level.deleteMany();
  await prisma.user.deleteMany();

  // 225 levels.
  const catalog = buildCatalog();
  await prisma.level.createMany({
    data: catalog.map((l) => ({
      stage: l.stage,
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

  // Badges.
  for (const b of BADGES) {
    await prisma.badge.create({
      data: { slug: b.slug, name: b.name, description: b.description, tier: b.tier, rule: JSON.stringify(b.rule) },
    });
  }

  // Demo user at stage 1.
  await prisma.user.create({ data: { username: "demo", displayName: "Demo Learner", currentStage: 1 } });

  console.log(`✅ Seeded ${catalog.length} levels, ${BADGES.length} badges, 1 demo user.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
