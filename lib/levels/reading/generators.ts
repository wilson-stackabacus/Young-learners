/**
 * Reading generators — rhyming, sentence completion (cloze), and main idea.
 * All multiple-choice (same GeneratedProblem shape as every other subject),
 * drawn from small content banks, banded easy/hard.
 */

import type { GeneratedProblem } from "../generators";

type RNG = () => number;
type Band = "easy" | "hard";
const pick = <T>(a: T[], rng: RNG): T => a[Math.floor(rng() * a.length)];
function shuffle<T>(a: T[], rng: RNG): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function mc(correct: string, distractors: string[], rng: RNG) {
  const items = [{ label: correct, ok: true }, ...distractors.slice(0, 3).map((d) => ({ label: d, ok: false }))];
  const sh = shuffle(items, rng);
  const choices = sh.map((it, i) => ({ id: String.fromCharCode(97 + i), label: it.label }));
  const answer = choices[sh.findIndex((it) => it.ok)].id;
  return { choices, answer };
}

interface RhymeItem { band: Band; word: string; rhyme: string; distractors: string[] }
interface ClozeItem { band: Band; sentence: string; answer: string; distractors: string[] }
interface IdeaItem { band: Band; passage: string; answer: string; distractors: string[] }

const RHYMES: RhymeItem[] = [
  { band: "easy", word: "cat", rhyme: "hat", distractors: ["dog", "sun", "cup"] },
  { band: "easy", word: "tree", rhyme: "bee", distractors: ["leaf", "rock", "milk"] },
  { band: "easy", word: "star", rhyme: "car", distractors: ["moon", "sky", "book"] },
  { band: "easy", word: "cake", rhyme: "lake", distractors: ["plate", "sweet", "food"] },
  { band: "easy", word: "frog", rhyme: "log", distractors: ["pond", "jump", "green"] },
  { band: "hard", word: "bright", rhyme: "night", distractors: ["shine", "dark", "day"] },
  { band: "hard", word: "found", rhyme: "sound", distractors: ["lost", "seek", "near"] },
  { band: "hard", word: "chair", rhyme: "bear", distractors: ["table", "sit", "wood"] },
  { band: "hard", word: "snail", rhyme: "trail", distractors: ["slow", "shell", "slug"] },
  { band: "hard", word: "cloud", rhyme: "loud", distractors: ["rain", "soft", "sky"] },
];

const CLOZE: ClozeItem[] = [
  { band: "easy", sentence: "The sun is very ___ in the sky.", answer: "bright", distractors: ["cold", "quiet", "heavy"] },
  { band: "easy", sentence: "We ___ to the park to play.", answer: "went", distractors: ["sang", "ate", "slept"] },
  { band: "easy", sentence: "The puppy wagged its ___ happily.", answer: "tail", distractors: ["book", "cup", "shoe"] },
  { band: "easy", sentence: "I drink ___ when I am thirsty.", answer: "water", distractors: ["sand", "paper", "grass"] },
  { band: "easy", sentence: "Birds can ___ high in the sky.", answer: "fly", distractors: ["swim", "dig", "read"] },
  { band: "hard", sentence: "The scientist made an important ___ in the lab.", answer: "discovery", distractors: ["sandwich", "umbrella", "mountain"] },
  { band: "hard", sentence: "Because it rained, the game was ___ until tomorrow.", answer: "postponed", distractors: ["delicious", "purple", "frozen"] },
  { band: "hard", sentence: "Her ___ explanation helped everyone understand.", answer: "clear", distractors: ["loud", "wet", "ancient"] },
  { band: "hard", sentence: "The hikers were ___ after the long climb.", answer: "exhausted", distractors: ["invisible", "gigantic", "silent"] },
  { band: "hard", sentence: "He whispered in a ___ voice so no one would hear.", answer: "quiet", distractors: ["bright", "square", "sweet"] },
];

const IDEAS: IdeaItem[] = [
  { band: "easy", passage: "Dogs are loyal pets. They love to play fetch and protect their families.", answer: "Dogs make good pets", distractors: ["Cats are lazy", "Fish live in water", "Birds build nests"] },
  { band: "easy", passage: "Bees fly from flower to flower. They collect nectar and help plants grow.", answer: "Bees help flowers grow", distractors: ["Bees are scary", "Flowers are red", "Honey is sweet"] },
  { band: "easy", passage: "In autumn the leaves turn red and orange. Then they fall to the ground.", answer: "Leaves change in autumn", distractors: ["Summer is hot", "Trees are tall", "Snow is cold"] },
  { band: "easy", passage: "Maria planted seeds and watered them each day. Soon green sprouts appeared.", answer: "Maria grew plants from seeds", distractors: ["Maria likes water", "Green is a color", "Gardens are big"] },
  { band: "hard", passage: "Sea turtles swim thousands of miles across the ocean. They return to the same beach where they were born to lay their eggs.", answer: "Sea turtles return home to nest", distractors: ["The ocean is salty", "Turtles are slow", "Beaches have sand"] },
  { band: "hard", passage: "Volcanoes form when melted rock rises from deep inside Earth. When it erupts and cools, it can build new land over time.", answer: "Volcanoes can build new land", distractors: ["Rocks are heavy", "Earth is round", "Lava is hot"] },
  { band: "hard", passage: "Libraries lend books for free. They also offer quiet places to study and computers for anyone to use.", answer: "Libraries offer many free resources", distractors: ["Books are expensive", "Reading is hard", "Computers are new"] },
  { band: "hard", passage: "The inventor failed many times before her design finally worked. She never gave up, and her persistence paid off.", answer: "Persistence leads to success", distractors: ["Inventing is easy", "She was famous", "Machines are loud"] },
];

function genRhyme(b: Band, rng: RNG): GeneratedProblem {
  const it = pick(RHYMES.filter((x) => x.band === b), rng);
  const { choices, answer } = mc(it.rhyme, it.distractors, rng);
  return {
    prompt: `Which word rhymes with "${it.word}"?`, latex: "", inputType: "multiple-choice", answer, choices,
    hints: [`Say "${it.word}" out loud and listen to the ending sound.`, `Which choice ends with the same sound as "${it.word}"?`],
    solution: `"${it.rhyme}" rhymes with "${it.word}".`, commonMistakes: [],
  };
}
function genCloze(b: Band, rng: RNG): GeneratedProblem {
  const it = pick(CLOZE.filter((x) => x.band === b), rng);
  const { choices, answer } = mc(it.answer, it.distractors, rng);
  return {
    prompt: it.sentence, latex: "", inputType: "multiple-choice", answer, choices,
    hints: ["Read the whole sentence and think about what makes sense.", "Which word fits the meaning of the sentence?"],
    solution: `"${it.answer}" best completes the sentence.`, commonMistakes: [],
  };
}
function genIdea(b: Band, rng: RNG): GeneratedProblem {
  const it = pick(IDEAS.filter((x) => x.band === b), rng);
  const { choices, answer } = mc(it.answer, it.distractors, rng);
  return {
    prompt: `${it.passage}  —  What is this mostly about?`, latex: "", inputType: "multiple-choice", answer, choices,
    hints: ["The main idea is what ALL the sentences are about.", "Pick the choice that covers the whole passage, not just one detail."],
    solution: `The passage is mainly about: ${it.answer}.`, commonMistakes: [],
  };
}

export const READING_SKILL_NAMES = [
  "Rhyming I", "Sentence completion I", "Reading sense I",
  "Rhyming II", "Sentence completion II", "Reading sense II",
];
const READING_SKILLS: Record<number, { type: "rhyme" | "cloze" | "idea"; band: Band }> = {
  1: { type: "rhyme", band: "easy" }, 2: { type: "cloze", band: "easy" }, 3: { type: "idea", band: "easy" },
  4: { type: "rhyme", band: "hard" }, 5: { type: "cloze", band: "hard" }, 6: { type: "idea", band: "hard" },
};
export function generateReadingSkill(skill: number, _d: number, rng: RNG = Math.random): GeneratedProblem {
  const s = READING_SKILLS[skill] ?? READING_SKILLS[1];
  if (s.type === "rhyme") return genRhyme(s.band, rng);
  if (s.type === "cloze") return genCloze(s.band, rng);
  return genIdea(s.band, rng);
}
export function generateReadingForLevel(skills: number[], difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  const skill = skills.length === 1 ? skills[0] : pick(skills, rng);
  return generateReadingSkill(skill, difficulty, rng);
}
