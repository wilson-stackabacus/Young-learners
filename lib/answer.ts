/**
 * Answer checking — runs server-side only.
 *
 * Compares a user's submitted string against the canonical answer for each
 * input type, and matches against known common mistakes for diagnostic hints.
 */

import type { ProblemInputType } from "@/shared/contract";
import type { CommonMistake } from "./levels/generators";

/** Parse a string as a fraction or number → numeric value, or null. */
function toValue(s: string): number | null {
  const t = s.trim().replace(/\s+/g, "").replace(/−/g, "-");
  if (t === "") return null;
  const frac = t.match(/^(-?\d+)\/(-?\d+)$/);
  if (frac) {
    const d = Number(frac[2]);
    if (d === 0) return null;
    return Number(frac[1]) / d;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Normalize a multiple-choice selection (a choice id like "a", or its label). */
function normChoice(s: string): string {
  return s.trim().toLowerCase();
}

export interface CheckResult {
  correct: boolean;
  /** the matched common mistake, if the wrong answer is a recognized one */
  mistake?: CommonMistake;
}

export function checkAnswer(
  inputType: ProblemInputType,
  expected: string,
  submitted: string,
  commonMistakes: CommonMistake[] = [],
): CheckResult {
  if (inputType === "multiple-choice") {
    const correct = normChoice(submitted) === normChoice(expected);
    return { correct };
  }

  // numeric / fraction / expression → compare by value with a small tolerance.
  const got = toValue(submitted);
  const want = toValue(expected);
  if (got === null || want === null) {
    return { correct: false, mistake: matchMistake(submitted, commonMistakes) };
  }
  const correct = Math.abs(got - want) <= 1e-6;
  if (correct) return { correct: true };
  return { correct: false, mistake: matchMistake(submitted, commonMistakes, got) };
}

/** Find a common mistake matching the submission (by value when possible). */
function matchMistake(
  submitted: string,
  commonMistakes: CommonMistake[],
  gotValue?: number,
): CommonMistake | undefined {
  for (const m of commonMistakes) {
    if (m.value.trim() === submitted.trim()) return m;
    if (gotValue !== undefined) {
      const mv = toValue(m.value);
      if (mv !== null && Math.abs(mv - gotValue) <= 1e-6) return m;
    }
  }
  return undefined;
}
