/**
 * The level catalog — the static structure of the ladder.
 *
 * 23 skills → 45 difficulty tiers (23 "pure" + 22 "blend") → 5 stages each.
 * After every blend tier, a BOSS stage gates the next whole level: a no-hints
 * gauntlet testing the level just completed (e.g. after Lv1½, a boss tests Lv1
 * before Lv2 unlocks). 225 practice stages + 22 bosses = 247 total.
 *
 * Tier t (1..45):  pure when t is odd (skill (t+1)/2); blend when t is even
 * (skills t/2 and t/2+1).  difficulty = (t+1)/2.
 */

import type { WorldId } from "@/shared/contract";

export const SKILL_NAMES: string[] = [
  "Addition", // 1
  "Subtraction", // 2
  "Add & subtract", // 3
  "Multiplication", // 4
  "Subtract & multiply", // 5
  "Division", // 6
  "Multiply & divide", // 7
  "All four mixed", // 8
  "Order of operations", // 9
  "Negatives (+/−)", // 10
  "Negatives (×/÷)", // 11
  "Fractions (+/−)", // 12
  "Fractions (×/÷)", // 13
  "Decimals & percents", // 14
  "Exponents & roots", // 15
  "One-step equations", // 16
  "Two-step equations", // 17
  "Combine like terms & distribute", // 18
  "Multi-step equations", // 19
  "Linear equations (with fractions)", // 20
  "Systems of equations", // 21
  "Factoring", // 22
  "Quadratics (rational roots)", // 23
];

export const TOTAL_SKILLS = SKILL_NAMES.length; // 23
export const TOTAL_TIERS = TOTAL_SKILLS * 2 - 1; // 45
export const STAGES_PER_TIER = 5;

export interface WorldDef {
  id: WorldId;
  name: string;
  skillRange: [number, number];
}

const WORLD_DEFS: WorldDef[] = [
  { id: "arithmetic", name: "Arithmetic", skillRange: [1, 9] },
  { id: "integers", name: "Integers & rationals", skillRange: [10, 15] },
  { id: "pre-algebra", name: "Pre-algebra", skillRange: [16, 19] },
  { id: "algebra-1", name: "Algebra 1", skillRange: [20, 23] },
];

export function worldForSkill(skill: number): WorldId {
  if (skill <= 9) return "arithmetic";
  if (skill <= 15) return "integers";
  if (skill <= 19) return "pre-algebra";
  return "algebra-1";
}

export function skillName(skill: number): string {
  return SKILL_NAMES[skill - 1] ?? `Skill ${skill}`;
}

export type LevelKind = "pure" | "blend" | "boss";

export interface CatalogLevel {
  stage: number; // 1..247
  tier: number; // 1..45
  stageInTier: number; // 1..5 for practice, 0 for a boss
  kind: LevelKind;
  skills: number[]; // [4] pure, [4,5] blend/boss
  skillNames: string[];
  world: WorldId;
  difficulty: number;
  isBoss: boolean;
  testsLevel?: number; // boss only: the whole-level number it gates
}

let CATALOG: CatalogLevel[] | null = null;

/** Build (and cache) the full catalog: practice stages + boss gates. */
export function buildCatalog(): CatalogLevel[] {
  if (CATALOG) return CATALOG;
  const levels: CatalogLevel[] = [];
  let stage = 0;
  for (let tier = 1; tier <= TOTAL_TIERS; tier++) {
    const isPure = tier % 2 === 1;
    const low = Math.ceil(tier / 2); // pure skill, or lower skill of a blend
    const skills = isPure ? [low] : [low, low + 1];
    const world = worldForSkill(low);
    const difficulty = (tier + 1) / 2;

    for (let s = 1; s <= STAGES_PER_TIER; s++) {
      stage++;
      levels.push({
        stage,
        tier,
        stageInTier: s,
        kind: isPure ? "pure" : "blend",
        skills,
        skillNames: skills.map(skillName),
        world,
        difficulty,
        isBoss: false,
      });
    }

    // After each blend tier, a boss gates the next whole level.
    if (!isPure) {
      stage++;
      levels.push({
        stage,
        tier,
        stageInTier: 0,
        kind: "boss",
        skills, // [low, low+1] — everything practiced in this tier group
        skillNames: skills.map(skillName),
        world,
        difficulty: difficulty + 0.25,
        isBoss: true,
        testsLevel: low, // the completed whole level, e.g. Lv1 before Lv2
      });
    }
  }
  CATALOG = levels;
  return levels;
}

export const TOTAL_STAGES = buildCatalog().length; // 247

export function levelForStage(stage: number): CatalogLevel | undefined {
  return buildCatalog()[stage - 1];
}

/** World metadata with computed inclusive stage ranges. */
export function worldMeta(): {
  id: WorldId;
  name: string;
  skillRange: [number, number];
  stageRange: [number, number];
}[] {
  const catalog = buildCatalog();
  return WORLD_DEFS.map((w) => {
    const inWorld = catalog.filter((l) => l.world === w.id).map((l) => l.stage);
    return {
      id: w.id,
      name: w.name,
      skillRange: w.skillRange,
      stageRange: [Math.min(...inWorld), Math.max(...inWorld)] as [number, number],
    };
  });
}
