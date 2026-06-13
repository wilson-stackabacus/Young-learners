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

const QUESTS = [
  { slug: "solve-3-problems", title: "Daily Practice", description: "Solve 3 problems correctly today.", type: "problems_solved", targetValue: 3, xpReward: 50 },
  { slug: "earn-100-xp", title: "XP Grinder", description: "Earn 100 total XP today.", type: "xp_earned", targetValue: 100, xpReward: 100 },
  { slug: "clear-1-level", title: "Level Up!", description: "Reach a progress of 100% to clear any level.", type: "clear_level", targetValue: 100, xpReward: 150 },
  { slug: "perfect-streak-5", title: "Sharp Shooter", description: "Get a correct-answer streak of 5 problems in a row.", type: "correct_streak", targetValue: 5, xpReward: 200 }
];

async function main() {
  console.log("🌱 Seeding merged database with level ladder and classrooms...");

  // Wipe data in FK-safe order.
  await prisma.userQuest.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.classroomMember.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.pendingProblem.deleteMany();
  await prisma.levelProgress.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.level.deleteMany();
  await prisma.user.deleteMany();

  console.log("Wiped old seed data.");

  // 1. Seed levels
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
  console.log(`Seeded ${catalog.length} levels.`);

  // 2. Seed badges
  for (const b of BADGES) {
    await prisma.badge.create({
      data: {
        slug: b.slug,
        name: b.name,
        description: b.description,
        tier: b.tier,
        rule: JSON.stringify(b.rule),
      },
    });
  }
  console.log(`Seeded ${BADGES.length} badges.`);

  // 3. Seed quests
  for (const q of QUESTS) {
    await prisma.quest.create({
      data: q,
    });
  }
  console.log(`Seeded ${QUESTS.length} quests.`);

  // 4. Create Users
  // Standard demo user
  const demo = await prisma.user.create({
    data: {
      username: "demo",
      displayName: "Demo Learner",
      role: "student",
      totalXp: 120,
      currentStage: 3,
      currentStreak: 2,
      longestStreak: 5,
      lastActiveDay: new Date().toISOString().slice(0, 10),
    },
  });

  // Teacher user
  const teacher = await prisma.user.create({
    data: {
      username: "teacher_jane",
      displayName: "Ms. Jane",
      role: "teacher",
    },
  });

  // Mock student users to populate the leaderboard & classrooms
  const mockStudents = [
    { username: "alice", displayName: "Alice Green", totalXp: 1250, currentStage: 15, streak: 8 },
    { username: "bob", displayName: "Bob Smith", totalXp: 450, currentStage: 7, streak: 1 },
    { username: "charlie", displayName: "Charlie Brown", totalXp: 2100, currentStage: 25, streak: 12 },
    { username: "diana", displayName: "Diana Prince", totalXp: 3400, currentStage: 42, streak: 21 },
  ];

  const studentRows = [];
  for (const s of mockStudents) {
    const studentRow = await prisma.user.create({
      data: {
        username: s.username,
        displayName: s.displayName,
        role: "student",
        totalXp: s.totalXp,
        currentStage: s.currentStage,
        currentStreak: s.streak,
        longestStreak: s.streak + 3,
        lastActiveDay: new Date().toISOString().slice(0, 10),
      },
    });
    studentRows.push(studentRow);
  }
  console.log("Created demo, teacher, and classmate student accounts.");

  // 5. Create Classroom and enroll students
  const classroom = await prisma.classroom.create({
    data: {
      name: "Ms. Jane's Coding Camp",
      code: "CAMP26",
      teacherId: teacher.id,
    },
  });

  // Enroll demo and mock students
  const membersToEnroll = [demo, ...studentRows];
  for (const m of membersToEnroll) {
    await prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        userId: m.id,
      },
    });
  }
  console.log(`Created classroom '${classroom.name}' with code '${classroom.code}' and enrolled all students.`);

  // 6. Create level progress records for members to generate a realistic heatmap
  // We will seed progress for the first 5 levels for each enrolled student.
  for (const s of membersToEnroll) {
    for (let stage = 1; stage <= 5; stage++) {
      // Completed level progress is cleared, current progress is between 0-90, locked is locked.
      let status = "locked";
      let progress = 0;
      let stars = 0;

      if (stage < s.currentStage) {
        status = "cleared";
        progress = 100;
        stars = Math.floor(Math.random() * 3) + 1; // 1 to 3 stars
      } else if (stage === s.currentStage) {
        status = "current";
        progress = Math.floor(Math.random() * 90); // 0 to 90
        stars = 0;
      }

      await prisma.levelProgress.create({
        data: {
          userId: s.id,
          stage,
          status,
          progress,
          stars,
          totalCorrect: status === "cleared" ? 8 : 2,
          totalAttempts: status === "cleared" ? 10 : 3,
          recentResults: status === "cleared" ? JSON.stringify([true, true, false, true, true, true, true, true, false, true]) : JSON.stringify([true, false, true]),
        },
      });

      // Also create a few mock attempts
      if (status === "cleared" || status === "current") {
        await prisma.attempt.create({
          data: {
            userId: s.id,
            stage,
            prompt: `Sample Problem for Level ${stage}`,
            givenAnswer: "42",
            correct: true,
            hintsUsed: 0,
            solvedAfterHint: false,
            xpAwarded: 10,
          },
        });
      }
    }
  }
  console.log("Seeded mock level progress and attempts for students.");

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
