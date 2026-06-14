/**
 * The level catalog — the static structure of every ladder.
 *
 * Two subjects share the same engine:
 *   - math:    stages 1..247   (23 skills → 45 tiers → 5 stages + 22 bosses)
 *   - english: stages 1001..   (6 vocab skills, same tier/blend/boss pattern)
 *
 * English stages are offset by 1000 so a stage id alone tells you the subject,
 * which keeps the API (`/api/levels/{stage}/…`) unambiguous.
 */

import type { Subject, WorldId } from "@/shared/contract";
import { ENGLISH_UNITS, type LessonUnit } from "./levels/english/units";
import { READING_SKILL_NAMES } from "./levels/reading/generators";
import { SCIENCE_SKILL_NAMES } from "./levels/science/generators";

export const SKILL_NAMES: string[] = [
  "Addition", "Subtraction", "Add & subtract", "Multiplication", "Subtract & multiply",
  "Division", "Multiply & divide", "All four mixed", "Order of operations",
  "Negatives (+/−)", "Negatives (×/÷)", "Fractions (+/−)", "Fractions (×/÷)",
  "Decimals & percents", "Exponents & roots", "One-step equations", "Two-step equations",
  "Combine like terms & distribute", "Multi-step equations", "Linear equations (with fractions)",
  "Systems of equations", "Factoring", "Quadratics (rational roots)",
];

export const STAGES_PER_TIER = 5;
export const ENGLISH_OFFSET = 1000;
export const READING_OFFSET = 2000;
export const SCIENCE_OFFSET = 3000;

export type LevelKind = "pure" | "blend" | "boss";

export interface CatalogLevel {
  stage: number;
  subject: Subject;
  tier: number;
  stageInTier: number; // 1..5 for practice, 0 for a boss
  kind: LevelKind;
  skills: number[];
  skillNames: string[];
  world: WorldId;
  difficulty: number;
  isBoss: boolean;
  testsLevel?: number;
  grade?: string;    // K-8 grade level (unit-based subjects)
  standard?: string; // CA standard code (unit-based subjects)
}

interface WorldDef {
  id: WorldId;
  name: string;
  skillRange: [number, number];
}

const MATH_WORLDS: WorldDef[] = [
  { id: "arithmetic", name: "Arithmetic", skillRange: [1, 9] },
  { id: "integers", name: "Integers & rationals", skillRange: [10, 15] },
  { id: "pre-algebra", name: "Pre-algebra", skillRange: [16, 19] },
  { id: "algebra-1", name: "Algebra 1", skillRange: [20, 23] },
];

// Non-math subjects reuse the math world ids for theming/colors, with own names.
// English is a flat K-8 unit ladder grouped into grade-band worlds.
const ENGLISH_WORLDS: WorldDef[] = [
  { id: "arithmetic", name: "Grades K–2", skillRange: [1, 99] },
  { id: "integers", name: "Grades 3–5", skillRange: [1, 99] },
  { id: "pre-algebra", name: "Grades 6–8", skillRange: [1, 99] },
];
const READING_WORLDS: WorldDef[] = [
  { id: "pre-algebra", name: "Beginner reading", skillRange: [1, 3] },
  { id: "algebra-1", name: "Advanced reading", skillRange: [4, 6] },
];
const SCIENCE_WORLDS: WorldDef[] = [
  { id: "integers", name: "Science explorer", skillRange: [1, 3] },
  { id: "algebra-1", name: "Science master", skillRange: [4, 6] },
];

function worldForMathSkill(skill: number): WorldId {
  if (skill <= 9) return "arithmetic";
  if (skill <= 15) return "integers";
  if (skill <= 19) return "pre-algebra";
  return "algebra-1";
}
function gradeBandWorld(grade: string): WorldId {
  const g = grade === "K" ? 0 : parseInt(grade, 10) || 0;
  if (g <= 2) return "arithmetic";   // Grades K–2
  if (g <= 5) return "integers";     // Grades 3–5
  return "pre-algebra";              // Grades 6–8
}
function worldForReadingSkill(skill: number): WorldId {
  return skill <= 3 ? "pre-algebra" : "algebra-1";
}
function worldForScienceSkill(skill: number): WorldId {
  return skill <= 3 ? "integers" : "algebra-1";
}

export function worldForSkill(skill: number): WorldId {
  return worldForMathSkill(skill);
}

function buildLadder(
  subject: Subject,
  skillCount: number,
  skillNameFn: (s: number) => string,
  worldFn: (s: number) => WorldId,
  offset: number,
): CatalogLevel[] {
  const levels: CatalogLevel[] = [];
  let stage = offset;
  const tiers = skillCount * 2 - 1;
  for (let tier = 1; tier <= tiers; tier++) {
    const isPure = tier % 2 === 1;
    const low = Math.ceil(tier / 2);
    const skills = isPure ? [low] : [low, low + 1];
    const world = worldFn(low);
    const difficulty = (tier + 1) / 2;
    for (let s = 1; s <= STAGES_PER_TIER; s++) {
      stage++;
      levels.push({
        stage, subject, tier, stageInTier: s, kind: isPure ? "pure" : "blend",
        skills, skillNames: skills.map(skillNameFn), world, difficulty, isBoss: false,
      });
    }
    if (!isPure) {
      stage++;
      levels.push({
        stage, subject, tier, stageInTier: 0, kind: "boss",
        skills, skillNames: skills.map(skillNameFn), world,
        difficulty: difficulty + 0.25, isBoss: true, testsLevel: low,
      });
    }
  }
  return levels;
}

// Flat unit ladder: one stage per CA-standard unit (K-8), for unit-based subjects.
function buildUnitLadder(subject: Subject, units: LessonUnit[], offset: number): CatalogLevel[] {
  return units.map((u, i) => ({
    stage: offset + i + 1,
    subject, tier: i + 1, stageInTier: 1, kind: "pure" as LevelKind,
    skills: [i + 1], skillNames: [u.title],
    world: gradeBandWorld(u.grade), difficulty: i + 1, isBoss: false,
    grade: u.grade, standard: u.standard,
  }));
}

const mathSkillName = (s: number) => SKILL_NAMES[s - 1] ?? `Skill ${s}`;
const readingSkillName = (s: number) => READING_SKILL_NAMES[s - 1] ?? `Skill ${s}`;
const scienceSkillName = (s: number) => SCIENCE_SKILL_NAMES[s - 1] ?? `Skill ${s}`;

let CATALOG: CatalogLevel[] | null = null;
let BY_STAGE: Map<number, CatalogLevel> | null = null;

export function buildCatalog(): CatalogLevel[] {
  if (CATALOG) return CATALOG;
  CATALOG = [
    ...buildLadder("math", SKILL_NAMES.length, mathSkillName, worldForMathSkill, 0),
    ...buildUnitLadder("english", ENGLISH_UNITS, ENGLISH_OFFSET),
    ...buildLadder("reading", READING_SKILL_NAMES.length, readingSkillName, worldForReadingSkill, READING_OFFSET),
    ...buildLadder("science", SCIENCE_SKILL_NAMES.length, scienceSkillName, worldForScienceSkill, SCIENCE_OFFSET),
  ];
  BY_STAGE = new Map(CATALOG.map((l) => [l.stage, l]));
  return CATALOG;
}

export function subjectOfStage(stage: number): Subject {
  if (stage > SCIENCE_OFFSET) return "science";
  if (stage > READING_OFFSET) return "reading";
  if (stage > ENGLISH_OFFSET) return "english";
  return "math";
}

export function levelForStage(stage: number): CatalogLevel | undefined {
  buildCatalog();
  return BY_STAGE!.get(stage);
}

export function catalogForSubject(subject: Subject): CatalogLevel[] {
  return buildCatalog().filter((l) => l.subject === subject);
}

export function firstStageOf(subject: Subject): number {
  return catalogForSubject(subject)[0].stage;
}
export function lastStageOf(subject: Subject): number {
  const c = catalogForSubject(subject);
  return c[c.length - 1].stage;
}

// Math total, kept for reference.
export const TOTAL_STAGES = catalogForSubject("math").length; // 247

const WORLD_DEFS_BY_SUBJECT: Record<Subject, WorldDef[]> = {
  math: MATH_WORLDS,
  english: ENGLISH_WORLDS,
  reading: READING_WORLDS,
  science: SCIENCE_WORLDS,
};

export function worldMeta(subject: Subject = "math") {
  const defs = WORLD_DEFS_BY_SUBJECT[subject] ?? MATH_WORLDS;
  const catalog = catalogForSubject(subject);
  return defs.map((w) => {
    const inWorld = catalog.filter((l) => l.world === w.id).map((l) => l.stage);
    return {
      id: w.id,
      name: w.name,
      skillRange: w.skillRange,
      stageRange: [Math.min(...inWorld), Math.max(...inWorld)] as [number, number],
    };
  });
}
