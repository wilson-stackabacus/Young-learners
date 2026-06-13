/**
 * Seed: 12 math topics in a 4-level prerequisite tree, ~40 problems at varying
 * difficulty, and 8 badges covering the gamification system.
 *
 * Topics form a layered graph:
 *   L0:  arithmetic
 *   L1:  fractions   <— arithmetic
 *        integers    <— arithmetic
 *   L2:  algebra     <— fractions, integers
 *        geometry    <— arithmetic
 *   L3:  quadratics  <— algebra
 *        trig        <— algebra, geometry
 *        statistics  <— fractions, integers
 *   L4:  calculus    <— trig, quadratics
 *        probability <— statistics
 *        combinatorics <— integers
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTopic = {
  slug: string;
  name: string;
  baseRating: number;
  order: number;
  prereqs: string[];
  problems: Array<{
    prompt: string;
    difficulty: number;
    kind: "numeric" | "multiple_choice" | "short";
    payload: object;
  }>;
};

const TOPICS: SeedTopic[] = [
  {
    slug: "arithmetic",
    name: "Arithmetic",
    baseRating: 800,
    order: 0,
    prereqs: [],
    problems: [
      { prompt: "What is 7 + 5?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 12, hints: ["Count up from 7."], solution: "7 + 5 = 12." } },
      { prompt: "What is 14 - 9?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Count back from 14."], solution: "14 - 9 = 5." } },
      { prompt: "What is 6 × 7?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 42, hints: ["Six sevens."], solution: "6 × 7 = 42." } },
      { prompt: "What is 81 ÷ 9?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 9, hints: ["9 times what equals 81?"], solution: "81 ÷ 9 = 9." } },
      { prompt: "What is 13 × 11?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 143, hints: ["13 × 10 + 13."], solution: "13 × 11 = 143." } },
      { prompt: "What is 144 ÷ 12?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 12, hints: ["12 × 12 = 144."], solution: "144 ÷ 12 = 12." } },
    ],
  },
  {
    slug: "integers",
    name: "Integers",
    baseRating: 900,
    order: 1,
    prereqs: ["arithmetic"],
    problems: [
      { prompt: "What is -5 + 3?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: -2, hints: ["Move 3 to the right on a number line."], solution: "-5 + 3 = -2." } },
      { prompt: "What is -4 × -6?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 24, hints: ["Negative times negative is positive."], solution: "-4 × -6 = 24." } },
      { prompt: "What is the absolute value of -17?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 17, hints: ["Distance from zero."], solution: "|-17| = 17." } },
      { prompt: "Order from least to greatest: -3, 1, -7, 0", difficulty: 3, kind: "short", payload: { type: "short", acceptable: ["-7, -3, 0, 1", "-7,-3,0,1"], hints: ["List negatives first."], solution: "-7, -3, 0, 1." } },
    ],
  },
  {
    slug: "fractions",
    name: "Fractions",
    baseRating: 1000,
    order: 2,
    prereqs: ["arithmetic"],
    problems: [
      { prompt: "Simplify 6/8.", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["3/4"], hints: ["Divide both by 2."], solution: "6/8 = 3/4." } },
      { prompt: "What is 1/2 + 1/3?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["5/6"], hints: ["Common denominator is 6."], solution: "1/2 + 1/3 = 3/6 + 2/6 = 5/6." } },
      { prompt: "What is 2/3 × 3/4? (as a fraction, e.g. 6/7)", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1/2", "6/12"], hints: ["Multiply tops, multiply bottoms."], solution: "2/3 × 3/4 = 6/12 = 1/2." } },
      { prompt: "What is 5/6 ÷ 1/3?", difficulty: 3, kind: "short", payload: { type: "short", acceptable: ["5/2", "2.5", "2 1/2"], hints: ["Multiply by the reciprocal."], solution: "5/6 ÷ 1/3 = 5/6 × 3/1 = 15/6 = 5/2." } },
    ],
  },
  {
    slug: "geometry",
    name: "Geometry",
    baseRating: 1050,
    order: 3,
    prereqs: ["arithmetic"],
    problems: [
      { prompt: "How many sides does a hexagon have?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Hex means six."], solution: "A hexagon has 6 sides." } },
      { prompt: "Area of a rectangle with length 7 and width 4?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 28, hints: ["length × width"], solution: "7 × 4 = 28." } },
      { prompt: "Perimeter of a square with side 9?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 36, hints: ["4 times the side."], solution: "4 × 9 = 36." } },
      { prompt: "Volume of a cube with edge 3? (units^3)", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 27, hints: ["Edge cubed."], solution: "3^3 = 27." } },
    ],
  },
  {
    slug: "algebra",
    name: "Algebra",
    baseRating: 1100,
    order: 4,
    prereqs: ["fractions", "integers"],
    problems: [
      { prompt: "Solve for x: x + 7 = 12", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Subtract 7 from both sides."], solution: "x = 5." } },
      { prompt: "Solve for x: 3x = 21", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Divide both sides by 3."], solution: "x = 7." } },
      { prompt: "Solve for x: 2x + 5 = 17", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Subtract 5 first, then divide."], solution: "2x = 12, x = 6." } },
      { prompt: "If f(x) = 2x - 3, what is f(5)?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Substitute and compute."], solution: "2(5) - 3 = 7." } },
      { prompt: "Solve: (x - 2)(x + 3) = 0. Sum of solutions?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: -1, hints: ["Roots are 2 and -3."], solution: "Sum = 2 + (-3) = -1." } },
    ],
  },
  {
    slug: "quadratics",
    name: "Quadratics",
    baseRating: 1300,
    order: 5,
    prereqs: ["algebra"],
    problems: [
      { prompt: "Solve x^2 = 49. Positive root?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Square root both sides."], solution: "x = 7." } },
      { prompt: "Factor: x^2 - 5x + 6", difficulty: 2, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["(x-2)(x-3)", "(x-1)(x-6)", "(x+2)(x+3)", "(x-6)(x+1)"], answerIndex: 0, hints: ["Find two numbers that multiply to 6 and add to -5."], solution: "(x-2)(x-3) = x^2 - 5x + 6." } },
      { prompt: "Solve x^2 - 4x + 3 = 0. Sum of distinct roots?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 4, hints: ["Roots are 1 and 3."], solution: "Sum = 1 + 3 = 4." } },
      { prompt: "Vertex y-value of y = x^2 - 6x + 5?", difficulty: 4, kind: "numeric", payload: { type: "numeric", answer: -4, hints: ["Vertex x = -b/(2a) = 3. y = 9 - 18 + 5 = -4."], solution: "y = -4." } },
    ],
  },
  {
    slug: "trig",
    name: "Trigonometry",
    baseRating: 1400,
    order: 6,
    prereqs: ["algebra", "geometry"],
    problems: [
      { prompt: "sin(0°) = ?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 0, tolerance: 0.0001, hints: ["Imagine the unit circle at 0."], solution: "sin 0 = 0." } },
      { prompt: "cos(60°) = ?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["1/2", "0.5"], hints: ["30-60-90 triangle ratios."], solution: "cos 60° = 1/2." } },
      { prompt: "tan(45°) = ?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 1, tolerance: 0.0001, hints: ["45-45-90 is isoceles."], solution: "tan 45° = 1." } },
      { prompt: "sin(30°) + cos(60°) = ?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1", "1.0"], hints: ["Both equal 1/2."], solution: "1/2 + 1/2 = 1." } },
    ],
  },
  {
    slug: "statistics",
    name: "Statistics",
    baseRating: 1250,
    order: 7,
    prereqs: ["fractions", "integers"],
    problems: [
      { prompt: "Mean of 2, 4, 6, 8?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Sum and divide by count."], solution: "(2+4+6+8)/4 = 5." } },
      { prompt: "Median of 1, 3, 7, 9, 12?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Middle value."], solution: "7." } },
      { prompt: "Range of -3, 0, 4, 11?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 14, hints: ["Max minus min."], solution: "11 - (-3) = 14." } },
    ],
  },
  {
    slug: "combinatorics",
    name: "Combinatorics",
    baseRating: 1500,
    order: 8,
    prereqs: ["integers"],
    problems: [
      { prompt: "How many ways to arrange 3 distinct books?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["3! = 3·2·1."], solution: "3! = 6." } },
      { prompt: "C(5,2) = ?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 10, hints: ["5!/(2!·3!)."], solution: "5!/(2!·3!) = 120/12 = 10." } },
    ],
  },
  {
    slug: "probability",
    name: "Probability",
    baseRating: 1450,
    order: 9,
    prereqs: ["statistics"],
    problems: [
      { prompt: "P(rolling 6 on a fair die)? (as a fraction)", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["1/6"], hints: ["1 favorable of 6 outcomes."], solution: "1/6." } },
      { prompt: "P(two heads in two fair coin flips)? (as a fraction)", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1/4"], hints: ["1 of 4 outcomes."], solution: "1/4." } },
    ],
  },
  {
    slug: "calculus",
    name: "Calculus",
    baseRating: 1700,
    order: 10,
    prereqs: ["trig", "quadratics"],
    problems: [
      { prompt: "Derivative of x^2?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["2x", "2x^1"], hints: ["Power rule."], solution: "d/dx(x^2) = 2x." } },
      { prompt: "Derivative of sin(x)?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["cos(x)", "cosx", "cos"], hints: ["Memorize the trig derivatives."], solution: "d/dx sin x = cos x." } },
      { prompt: "Integral of 2x dx = ?  (plus C)", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["x^2 + c", "x^2+c", "x^2"], hints: ["Reverse the power rule."], solution: "x^2 + C." } },
    ],
  },
];

const BADGES = [
  { slug: "first-steps", name: "First Steps", description: "Solve your first problem.", tier: "bronze", rule: { type: "total_problems_solved", min: 1 } },
  { slug: "getting-going", name: "Getting Going", description: "Solve 10 problems.", tier: "bronze", rule: { type: "total_problems_solved", min: 10 } },
  { slug: "century", name: "Century", description: "Solve 100 problems.", tier: "silver", rule: { type: "total_problems_solved", min: 100 } },
  { slug: "week-streak", name: "Week Warrior", description: "Reach a 7-day streak.", tier: "silver", rule: { type: "streak_days", min: 7 } },
  { slug: "month-streak", name: "Unstoppable", description: "Reach a 30-day streak.", tier: "gold", rule: { type: "streak_days", min: 30 } },
  { slug: "level-5", name: "Apprentice", description: "Reach level 5.", tier: "bronze", rule: { type: "level_reached", min: 5 } },
  { slug: "level-10", name: "Adept", description: "Reach level 10.", tier: "silver", rule: { type: "level_reached", min: 10 } },
  { slug: "polymath", name: "Polymath", description: "Reach unlock rating in every topic.", tier: "platinum", rule: { type: "all_topics_unlocked" } },
];

async function main() {
  console.log("🌱 Seeding…");
  // Wipe in dependency order
  await prisma.userBadge.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.mastery.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.$executeRawUnsafe('DELETE FROM "_TopicPrereqs";');
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  // Topics first.
  const topicIdBySlug = new Map<string, string>();
  for (const t of TOPICS) {
    const row = await prisma.topic.create({
      data: { slug: t.slug, name: t.name, baseRating: t.baseRating, order: t.order },
    });
    topicIdBySlug.set(t.slug, row.id);
  }
  // Prerequisites.
  for (const t of TOPICS) {
    const prereqIds = t.prereqs.map((s) => topicIdBySlug.get(s)!).filter(Boolean);
    if (prereqIds.length > 0) {
      await prisma.topic.update({
        where: { id: topicIdBySlug.get(t.slug)! },
        data: { prerequisites: { connect: prereqIds.map((id) => ({ id })) } },
      });
    }
  }
  // Problems.
  for (const t of TOPICS) {
    const topicId = topicIdBySlug.get(t.slug)!;
    for (const p of t.problems) {
      // Start problem rating near the topic's base rating ± a small spread
      // so the same topic has problems at varying difficulties.
      const spread = (p.difficulty - 3) * 60;
      const rating = Math.max(600, Math.min(2400, t.baseRating + spread + 50));
      await prisma.problem.create({
        data: {
          topicId,
          rating,
          difficulty: p.difficulty,
          prompt: p.prompt,
          kind: p.kind,
          payload: JSON.stringify(p.payload),
        },
      });
    }
  }
  // Badges.
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
  console.log(`✅ Seeded ${TOPICS.length} topics, ${TOPICS.reduce((a, t) => a + t.problems.length, 0)} problems, ${BADGES.length} badges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
