/**
 * English generators — serve questions from the flat, CA-standards-aligned unit
 * bank (see ./units.ts). Each level (stage) maps to one unit via its skill id;
 * we pick one of the unit's questions and shuffle the choices.
 */

import type { GeneratedProblem } from "../generators";
import { ENGLISH_UNITS } from "./units";

type RNG = () => number;

function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Skill names = unit titles (kept exported for any legacy callers).
export const ENGLISH_SKILL_NAMES = ENGLISH_UNITS.map((u) => u.title);

/** Generate a problem for a unit (0-based index into ENGLISH_UNITS). */
export function generateEnglishUnit(unitIndex: number, rng: RNG = Math.random): GeneratedProblem {
  const unit = ENGLISH_UNITS[unitIndex] ?? ENGLISH_UNITS[0];
  const uq = unit.questions[Math.floor(rng() * unit.questions.length)];
  const order = shuffle(uq.choices.map((label, i) => ({ label, i })), rng);
  const choices = order.map((x, i) => ({ id: String.fromCharCode(97 + i), label: x.label }));
  const answer = choices[order.findIndex((x) => x.i === uq.answer)].id;
  return {
    prompt: uq.q,
    latex: "",
    inputType: "multiple-choice",
    answer,
    choices,
    hints: [
      "Read the whole question and rule out choices that clearly don't fit.",
      "Think about what the word or sentence really means.",
    ],
    solution: uq.explain,
    commonMistakes: [],
  };
}

// The catalog encodes the unit number (1-based) as the level's single skill id.
export function generateEnglishForLevel(skills: number[], _difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  return generateEnglishUnit((skills[0] ?? 1) - 1, rng);
}
