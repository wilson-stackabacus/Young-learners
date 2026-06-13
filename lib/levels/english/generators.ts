/**
 * English (vocabulary) generators — definition, synonym, antonym.
 *
 * All produce the SAME GeneratedProblem shape as the math generators, using
 * inputType "multiple-choice" (which the existing UI already renders). Wrong
 * answers that are the trap (an antonym in a synonym question, or vice-versa)
 * get a targeted diagnostic hint.
 */

import type { GeneratedProblem } from "../generators";
import { bandWords, type Band, type VocabEntry } from "./vocab";

type RNG = () => number;
const pick = <T>(arr: T[], rng: RNG): T => arr[Math.floor(rng() * arr.length)];
function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MCItem {
  label: string;
  ok: boolean;
  trap?: boolean;
}
function buildMC(items: MCItem[], rng: RNG) {
  const shuffled = shuffle(items, rng);
  const choices = shuffled.map((it, i) => ({ id: String.fromCharCode(97 + i), label: it.label }));
  const answer = choices[shuffled.findIndex((it) => it.ok)].id;
  const trapIdx = shuffled.findIndex((it) => it.trap);
  const trapId = trapIdx >= 0 ? choices[trapIdx].id : undefined;
  return { choices, answer, trapId };
}

function pickEntry(band: Band, rng: RNG, filter?: (v: VocabEntry) => boolean): VocabEntry {
  const pool = bandWords(band).filter(filter ?? (() => true));
  return pick(pool.length ? pool : bandWords(band), rng);
}

// ── Definition: pick the meaning of a word ──
export function genDefinition(band: Band, rng: RNG): GeneratedProblem {
  const entry = pickEntry(band, rng);
  const others = shuffle(bandWords(band).filter((v) => v.word !== entry.word), rng).slice(0, 3);
  const { choices, answer } = buildMC(
    [{ label: entry.definition, ok: true }, ...others.map((o) => ({ label: o.definition, ok: false }))],
    rng,
  );
  return {
    prompt: `What does "${entry.word}" mean?`,
    latex: "",
    inputType: "multiple-choice",
    answer,
    choices,
    hints: [
      `Think about how you'd use "${entry.word}" in a sentence.`,
      `"${entry.word}" is close in meaning to "${entry.synonyms[0] ?? entry.word}".`,
    ],
    solution: `"${entry.word}" means: ${entry.definition}.`,
    commonMistakes: [],
  };
}

// ── Synonym: pick the word with the SAME meaning ──
export function genSynonym(band: Band, rng: RNG): GeneratedProblem {
  const entry = pickEntry(band, rng, (v) => v.synonyms.length > 0);
  const correct = pick(entry.synonyms, rng);
  const antonym = entry.antonyms[0];
  const unrelated = shuffle(
    bandWords(band)
      .filter((v) => v.word !== entry.word && !entry.synonyms.includes(v.word) && !entry.antonyms.includes(v.word))
      .map((v) => v.word),
    rng,
  );
  const items: MCItem[] = [{ label: correct, ok: true }];
  if (antonym) items.push({ label: antonym, ok: false, trap: true });
  for (const w of unrelated) {
    if (items.length >= 4) break;
    items.push({ label: w, ok: false });
  }
  const { choices, answer, trapId } = buildMC(items.slice(0, 4), rng);
  return {
    prompt: `Which word means the SAME as "${entry.word}"?`,
    latex: "",
    inputType: "multiple-choice",
    answer,
    choices,
    hints: [
      `A synonym has the same meaning as "${entry.word}".`,
      `Could the word replace "${entry.word}" without changing the sentence?`,
    ],
    solution: `"${correct}" means the same as "${entry.word}".`,
    commonMistakes: trapId
      ? [{ value: trapId, hint: `That's the OPPOSITE of "${entry.word}" — a synonym has the same meaning.` }]
      : [],
  };
}

// ── Antonym: pick the word with the OPPOSITE meaning ──
export function genAntonym(band: Band, rng: RNG): GeneratedProblem {
  const entry = pickEntry(band, rng, (v) => v.antonyms.length > 0);
  const correct = pick(entry.antonyms, rng);
  const synonym = entry.synonyms[0];
  const unrelated = shuffle(
    bandWords(band)
      .filter((v) => v.word !== entry.word && !entry.antonyms.includes(v.word) && !entry.synonyms.includes(v.word))
      .map((v) => v.word),
    rng,
  );
  const items: MCItem[] = [{ label: correct, ok: true }];
  if (synonym) items.push({ label: synonym, ok: false, trap: true });
  for (const w of unrelated) {
    if (items.length >= 4) break;
    items.push({ label: w, ok: false });
  }
  const { choices, answer, trapId } = buildMC(items.slice(0, 4), rng);
  return {
    prompt: `Which word means the OPPOSITE of "${entry.word}"?`,
    latex: "",
    inputType: "multiple-choice",
    answer,
    choices,
    hints: [
      `An antonym means the opposite of "${entry.word}".`,
      `Picture "${entry.word}", then its reverse.`,
    ],
    solution: `"${correct}" is the opposite of "${entry.word}".`,
    commonMistakes: trapId
      ? [{ value: trapId, hint: `That's a SYNONYM (same meaning) — you need the opposite.` }]
      : [],
  };
}

// English skill ids → (question type, difficulty band).
//   1 Definitions · 2 Synonyms · 3 Antonyms   (easy band)
//   4 Definitions · 5 Synonyms · 6 Antonyms   (hard band)
const ENGLISH_SKILLS: Record<number, { type: "def" | "syn" | "ant"; band: Band }> = {
  1: { type: "def", band: "easy" },
  2: { type: "syn", band: "easy" },
  3: { type: "ant", band: "easy" },
  4: { type: "def", band: "hard" },
  5: { type: "syn", band: "hard" },
  6: { type: "ant", band: "hard" },
};

export const ENGLISH_SKILL_NAMES = [
  "Word meanings I",
  "Synonyms I",
  "Antonyms I",
  "Word meanings II",
  "Synonyms II",
  "Antonyms II",
];

export function generateEnglishSkill(skill: number, _difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  const s = ENGLISH_SKILLS[skill] ?? ENGLISH_SKILLS[1];
  if (s.type === "def") return genDefinition(s.band, rng);
  if (s.type === "syn") return genSynonym(s.band, rng);
  return genAntonym(s.band, rng);
}

export function generateEnglishForLevel(skills: number[], difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  const skill = skills.length === 1 ? skills[0] : pick(skills, rng);
  return generateEnglishSkill(skill, difficulty, rng);
}
