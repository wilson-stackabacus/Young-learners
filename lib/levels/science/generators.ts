/**
 * Science generators — fact recall, multiple-choice, banded easy/hard.
 * Same GeneratedProblem shape as every other subject.
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

interface SciItem { band: Band; question: string; answer: string; distractors: string[] }

const SCIENCE: SciItem[] = [
  { band: "easy", question: "Which planet is closest to the Sun?", answer: "Mercury", distractors: ["Earth", "Mars", "Jupiter"] },
  { band: "easy", question: "What do plants need to make their food?", answer: "Sunlight", distractors: ["Darkness", "Plastic", "Sand"] },
  { band: "easy", question: "Which animal lays eggs and can fly?", answer: "Bird", distractors: ["Dog", "Cat", "Frog"] },
  { band: "easy", question: "What do we call frozen water?", answer: "Ice", distractors: ["Steam", "Sand", "Smoke"] },
  { band: "easy", question: "How many legs does an insect have?", answer: "6", distractors: ["4", "8", "2"] },
  { band: "easy", question: "What part of a plant takes in water from the soil?", answer: "Roots", distractors: ["Flower", "Leaf", "Seed"] },
  { band: "easy", question: "Which season is usually the coldest?", answer: "Winter", distractors: ["Summer", "Spring", "Fall"] },
  { band: "easy", question: "What gives us light and heat during the day?", answer: "The Sun", distractors: ["The Moon", "A cloud", "A star far away"] },
  { band: "hard", question: "What gas do plants release that animals breathe?", answer: "Oxygen", distractors: ["Carbon dioxide", "Helium", "Hydrogen"] },
  { band: "hard", question: "What are the three common states of matter?", answer: "Solid, liquid, gas", distractors: ["Hot, cold, warm", "Big, small, medium", "Red, green, blue"] },
  { band: "hard", question: "Which organ pumps blood through your body?", answer: "Heart", distractors: ["Lungs", "Brain", "Stomach"] },
  { band: "hard", question: "What causes day and night on Earth?", answer: "Earth spinning on its axis", distractors: ["The Sun orbiting Earth", "Clouds covering the Sun", "The Moon's light"] },
  { band: "hard", question: "What do we call animals that eat only plants?", answer: "Herbivores", distractors: ["Carnivores", "Omnivores", "Predators"] },
  { band: "hard", question: "Water turning into vapor is called what?", answer: "Evaporation", distractors: ["Condensation", "Freezing", "Melting"] },
  { band: "hard", question: "Which force pulls objects toward the Earth?", answer: "Gravity", distractors: ["Magnetism", "Friction", "Electricity"] },
  { band: "hard", question: "What is at the center of our solar system?", answer: "The Sun", distractors: ["Earth", "The Moon", "Jupiter"] },
];

export const SCIENCE_SKILL_NAMES = [
  "Science explorer I", "Science explorer II", "Science explorer III",
  "Science master I", "Science master II", "Science master III",
];
const bandForSkill = (skill: number): Band => (skill <= 3 ? "easy" : "hard");

function genScience(b: Band, rng: RNG): GeneratedProblem {
  const it = pick(SCIENCE.filter((x) => x.band === b), rng);
  const { choices, answer } = mc(it.answer, it.distractors, rng);
  return {
    prompt: it.question, latex: "", inputType: "multiple-choice", answer, choices,
    hints: ["Think about what you already know about this topic.", "Cross out the choices that clearly don't fit."],
    solution: `${it.answer}.`, commonMistakes: [],
  };
}

export function generateScienceSkill(skill: number, _d: number, rng: RNG = Math.random): GeneratedProblem {
  return genScience(bandForSkill(skill), rng);
}
export function generateScienceForLevel(skills: number[], difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  const skill = skills.length === 1 ? skills[0] : pick(skills, rng);
  return generateScienceSkill(skill, difficulty, rng);
}
