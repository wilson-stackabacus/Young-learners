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
import { ENGLISH_SKILL_NAMES } from "./levels/english/generators";

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

// English reuses the math world ids for theming/colors, with its own names.
const ENGLISH_WORLDS: WorldDef[] = [
  { id: "arithmetic", name: "Beginner words", skillRange: [1, 3] },
  { id: "integers", name: "Advanced words", skillRange: [4, 6] },
];

function worldForMathSkill(skill: number): WorldId {
  if (skill <= 9) return "arithmetic";
  if (skill <= 15) return "integers";
  if (skill <= 19) return "pre-algebra";
  return "algebra-1";
}
function worldForEnglishSkill(skill: number): WorldId {
  return skill <= 3 ? "arithmetic" : "integers";
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

const mathSkillName = (s: number) => SKILL_NAMES[s - 1] ?? `Skill ${s}`;
const englishSkillName = (s: number) => ENGLISH_SKILL_NAMES[s - 1] ?? `Skill ${s}`;

let CATALOG: CatalogLevel[] | null = null;
let BY_STAGE: Map<number, CatalogLevel> | null = null;

export function buildCatalog(): CatalogLevel[] {
  if (CATALOG) return CATALOG;
  CATALOG = [
    ...buildLadder("math", SKILL_NAMES.length, mathSkillName, worldForMathSkill, 0),
    ...buildLadder("english", ENGLISH_SKILL_NAMES.length, englishSkillName, worldForEnglishSkill, ENGLISH_OFFSET),
  ];
  BY_STAGE = new Map(CATALOG.map((l) => [l.stage, l]));
  return CATALOG;
}

export function subjectOfStage(stage: number): Subject {
  return stage > ENGLISH_OFFSET ? "english" : "math";
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

export function worldMeta(subject: Subject = "math") {
  const defs = subject === "english" ? ENGLISH_WORLDS : MATH_WORLDS;
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
