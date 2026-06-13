/**
 * Procedural problem generators — one per skill (1..23).
 *
 * Each generator takes a difficulty (the level's difficulty, ~1..23) and an RNG,
 * and returns a self-contained problem: prompt, LaTeX, the canonical answer,
 * two tiered hints, a worked solution, and the common wrong answers worth
 * diagnosing. The answer/solution stay server-side (see lib/levelEngine).
 */

import type { ProblemInputType } from "@/shared/contract";

export interface CommonMistake {
  value: string; // canonical wrong answer to match against
  hint: string;
}

export interface GeneratedProblem {
  prompt: string;
  latex: string;
  inputType: ProblemInputType;
  answer: string; // canonical answer string
  choices?: { id: string; label: string }[];
  hints: [string, string];
  solution: string;
  commonMistakes: CommonMistake[];
}

type RNG = () => number;

const ri = (min: number, max: number, rng: RNG): number =>
  Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(arr: T[], rng: RNG): T => arr[Math.floor(rng() * arr.length)];

function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function reduce(n: number, d: number): [number, number] {
  const s = d < 0 ? -1 : 1;
  n *= s;
  d *= s;
  const g = gcd(n, d);
  return [n / g, d / g];
}
function fracStr(n: number, d: number): string {
  const [a, b] = reduce(n, d);
  return b === 1 ? String(a) : `${a}/${b}`;
}
/** " + 3" or " − 3" for building expressions like "x + 3". */
function term(n: number): string {
  return n >= 0 ? `+ ${n}` : `− ${Math.abs(n)}`;
}

/** Build a shuffled multiple-choice set, returning choices + the correct id. */
function makeChoices(correct: string, distractors: string[], rng: RNG) {
  const uniq = Array.from(new Set(distractors.filter((d) => d !== correct))).slice(0, 3);
  const tagged = shuffle(
    [{ label: correct, ok: true }, ...uniq.map((d) => ({ label: d, ok: false }))],
    rng,
  );
  const choices = tagged.map((c, i) => ({ id: String.fromCharCode(97 + i), label: c.label }));
  const answer = choices[tagged.findIndex((c) => c.ok)].id;
  return { choices, answer };
}

/** Operand ceiling that grows with difficulty. */
const hi = (d: number, base = 9, step = 2) => base + Math.floor(d) * step;

type Gen = (d: number, rng: RNG) => GeneratedProblem;

const GENERATORS: Record<number, Gen> = {
  // 1 — Addition
  1: (d, rng) => {
    const a = ri(1, hi(d), rng), b = ri(1, hi(d), rng);
    return {
      prompt: `${a} + ${b}`, latex: `${a} + ${b}`, inputType: "numeric",
      answer: String(a + b),
      hints: ["Combine the two amounts into one total.", `Start at ${a} and count up ${b}.`],
      solution: `${a} + ${b} = ${a + b}.`, commonMistakes: [],
    };
  },

  // 2 — Subtraction
  2: (d, rng) => {
    const a = ri(2, hi(d) + 4, rng), b = ri(1, a, rng);
    return {
      prompt: `${a} − ${b}`, latex: `${a} - ${b}`, inputType: "numeric",
      answer: String(a - b),
      hints: ["Take the second number away from the first.", `Count back ${b} from ${a}.`],
      solution: `${a} − ${b} = ${a - b}.`, commonMistakes: [],
    };
  },

  // 3 — Add & subtract
  3: (d, rng) => {
    const a = ri(2, hi(d), rng), b = ri(2, hi(d), rng), c = ri(1, a + b - 1, rng);
    return {
      prompt: `${a} + ${b} − ${c}`, latex: `${a} + ${b} - ${c}`, inputType: "numeric",
      answer: String(a + b - c),
      hints: ["Work left to right, one step at a time.", `First ${a} + ${b} = ${a + b}, then subtract ${c}.`],
      solution: `${a} + ${b} − ${c} = ${a + b - c}.`, commonMistakes: [],
    };
  },

  // 4 — Multiplication
  4: (d, rng) => {
    const a = ri(2, hi(d, 9, 1), rng), b = ri(2, 9, rng);
    return {
      prompt: `${a} × ${b}`, latex: `${a} \\times ${b}`, inputType: "numeric",
      answer: String(a * b),
      hints: [`Think of ${a} groups of ${b}.`, `${a} × ${b} is ${b} added ${a} times.`],
      solution: `${a} × ${b} = ${a * b}.`, commonMistakes: [],
    };
  },

  // 5 — Subtract & multiply  (× before −)
  5: (d, rng) => {
    const a = ri(2, 9, rng), b = ri(2, 9, rng), c = ri(1, a * b - 1, rng);
    return {
      prompt: `${a} × ${b} − ${c}`, latex: `${a} \\times ${b} - ${c}`, inputType: "numeric",
      answer: String(a * b - c),
      hints: ["Multiplication comes before subtraction.", `First ${a} × ${b} = ${a * b}, then subtract ${c}.`],
      solution: `${a} × ${b} = ${a * b}, then ${a * b} − ${c} = ${a * b - c}.`,
      commonMistakes: [{ value: String(a * (b - c)), hint: "Looks like you subtracted first — do × before −." }],
    };
  },

  // 6 — Division (exact)
  6: (d, rng) => {
    const b = ri(2, hi(d, 9, 1), rng), q = ri(2, 9, rng), a = b * q;
    return {
      prompt: `${a} ÷ ${b}`, latex: `${a} \\div ${b}`, inputType: "numeric",
      answer: String(q),
      hints: [`How many ${b}s fit into ${a}?`, `${b} × ? = ${a}.`],
      solution: `${a} ÷ ${b} = ${q}.`, commonMistakes: [],
    };
  },

  // 7 — Multiply & divide (exact, left to right)
  7: (_d, rng) => {
    const c = ri(2, 6, rng), m = ri(2, 9, rng), b = ri(2, 9, rng), a = c * m;
    return {
      prompt: `${a} × ${b} ÷ ${c}`, latex: `${a} \\times ${b} \\div ${c}`, inputType: "numeric",
      answer: String(m * b),
      hints: ["Go left to right for × and ÷.", `${a} × ${b} = ${a * b}, then ÷ ${c}.`],
      solution: `${a} × ${b} = ${a * b}, then ${a * b} ÷ ${c} = ${m * b}.`, commonMistakes: [],
    };
  },

  // 8 — All four mixed (× before + and −)
  8: (_d, rng) => {
    const a = ri(2, 20, rng), b = ri(2, 9, rng), c = ri(2, 9, rng), e = ri(1, 20, rng);
    const ans = a + b * c - e;
    return {
      prompt: `${a} + ${b} × ${c} − ${e}`, latex: `${a} + ${b} \\times ${c} - ${e}`, inputType: "numeric",
      answer: String(ans),
      hints: ["Do × and ÷ before + and −.", `${b} × ${c} = ${b * c}, then ${a} + ${b * c} − ${e}.`],
      solution: `${b} × ${c} = ${b * c}; ${a} + ${b * c} − ${e} = ${ans}.`,
      commonMistakes: [{ value: String((a + b) * c - e), hint: "Looks like you went left to right — multiply before adding." }],
    };
  },

  // 9 — Order of operations
  9: (_d, rng) => {
    const a = ri(2, 15, rng), b = ri(2, 9, rng), c = ri(2, 9, rng);
    if (rng() < 0.5) {
      return {
        prompt: `${a} + ${b} × ${c}`, latex: `${a} + ${b} \\times ${c}`, inputType: "numeric",
        answer: String(a + b * c),
        hints: ["Multiply before you add.", `${b} × ${c} = ${b * c}, then add ${a}.`],
        solution: `${b} × ${c} = ${b * c}; ${a} + ${b * c} = ${a + b * c}.`,
        commonMistakes: [{ value: String((a + b) * c), hint: "You added first — × comes before +." }],
      };
    }
    const s = ri(2, 6, rng);
    return {
      prompt: `${a} + ${s}^2`, latex: `${a} + ${s}^{2}`, inputType: "numeric",
      answer: String(a + s * s),
      hints: ["Exponents come before addition.", `${s}² = ${s * s}, then add ${a}.`],
      solution: `${s}² = ${s * s}; ${a} + ${s * s} = ${a + s * s}.`,
      commonMistakes: [{ value: String((a + s) * (a + s)), hint: "Square first, then add — don't add before squaring." }],
    };
  },

  // 10 — Negatives (+/−)
  10: (d, rng) => {
    const a = ri(2, hi(d, 9, 1), rng), b = ri(a + 1, a + hi(d, 9, 1), rng);
    return {
      prompt: `${a} − ${b}`, latex: `${a} - ${b}`, inputType: "numeric",
      answer: String(a - b),
      hints: ["Subtracting a bigger number drops you below zero.", `${a} − ${b} goes ${b - a} below zero.`],
      solution: `${a} − ${b} = ${a - b}.`,
      commonMistakes: [{ value: String(b - a), hint: "Check the sign — the answer is negative here." }],
    };
  },

  // 11 — Negatives (×/÷)
  11: (_d, rng) => {
    const a = ri(2, 9, rng), b = ri(2, 9, rng);
    const negBoth = rng() < 0.5;
    if (negBoth) {
      return {
        prompt: `−${a} × −${b}`, latex: `-${a} \\times -${b}`, inputType: "numeric",
        answer: String(a * b),
        hints: ["A negative times a negative is positive.", `${a} × ${b} = ${a * b}, sign is +.`],
        solution: `(−${a}) × (−${b}) = ${a * b}.`,
        commonMistakes: [{ value: String(-(a * b)), hint: "Two negatives make a positive." }],
      };
    }
    return {
      prompt: `−${a} × ${b}`, latex: `-${a} \\times ${b}`, inputType: "numeric",
      answer: String(-(a * b)),
      hints: ["A negative times a positive is negative.", `${a} × ${b} = ${a * b}, sign is −.`],
      solution: `(−${a}) × ${b} = −${a * b}.`,
      commonMistakes: [{ value: String(a * b), hint: "Mind the sign — negative × positive is negative." }],
    };
  },

  // 12 — Fractions (+/−)
  12: (_d, rng) => {
    const b = ri(2, 6, rng), dd = ri(2, 6, rng), a = ri(1, b - 1, rng), c = ri(1, dd - 1, rng);
    const n = a * dd + c * b, den = b * dd;
    return {
      prompt: `${a}/${b} + ${c}/${dd}`, latex: `\\frac{${a}}{${b}} + \\frac{${c}}{${dd}}`, inputType: "fraction",
      answer: fracStr(n, den),
      hints: ["You need a common denominator first.", `Use ${den}: ${a}/${b} = ${a * dd}/${den}, ${c}/${dd} = ${c * b}/${den}.`],
      solution: `${a}/${b} + ${c}/${dd} = ${a * dd}/${den} + ${c * b}/${den} = ${fracStr(n, den)}.`,
      commonMistakes: [{ value: fracStr(a + c, b + dd), hint: "You can't add the bottoms — find a common denominator." }],
    };
  },

  // 13 — Fractions (×/÷)
  13: (_d, rng) => {
    const a = ri(1, 5, rng), b = ri(2, 6, rng), c = ri(1, 5, rng), dd = ri(2, 6, rng);
    if (rng() < 0.5) {
      return {
        prompt: `${a}/${b} × ${c}/${dd}`, latex: `\\frac{${a}}{${b}} \\times \\frac{${c}}{${dd}}`, inputType: "fraction",
        answer: fracStr(a * c, b * dd),
        hints: ["Multiply the tops, multiply the bottoms.", `(${a}×${c}) / (${b}×${dd}).`],
        solution: `${a}/${b} × ${c}/${dd} = ${a * c}/${b * dd} = ${fracStr(a * c, b * dd)}.`,
        commonMistakes: [],
      };
    }
    return {
      prompt: `${a}/${b} ÷ ${c}/${dd}`, latex: `\\frac{${a}}{${b}} \\div \\frac{${c}}{${dd}}`, inputType: "fraction",
      answer: fracStr(a * dd, b * c),
      hints: ["To divide, multiply by the reciprocal.", `${a}/${b} × ${dd}/${c}.`],
      solution: `${a}/${b} ÷ ${c}/${dd} = ${a}/${b} × ${dd}/${c} = ${fracStr(a * dd, b * c)}.`,
      commonMistakes: [{ value: fracStr(a * c, b * dd), hint: "Flip the second fraction before multiplying." }],
    };
  },

  // 14 — Decimals & percents
  14: (_d, rng) => {
    const p = pick([5, 10, 20, 25, 50, 75], rng);
    const n = ri(1, 12, rng) * (100 / gcd(p, 100));
    const ans = (p / 100) * n;
    return {
      prompt: `${p}% of ${n}`, latex: `${p}\\% \\text{ of } ${n}`, inputType: "numeric",
      answer: String(ans),
      hints: [`${p}% means ${p} per 100.`, `Compute ${p / 100} × ${n}.`],
      solution: `${p}% of ${n} = ${p / 100} × ${n} = ${ans}.`, commonMistakes: [],
    };
  },

  // 15 — Exponents & roots
  15: (_d, rng) => {
    if (rng() < 0.5) {
      const a = ri(2, 5, rng), b = ri(2, 3, rng);
      return {
        prompt: `${a}^${b}`, latex: `${a}^{${b}}`, inputType: "numeric",
        answer: String(Math.pow(a, b)),
        hints: ["An exponent means repeated multiplication.", `${a}^${b} = ${Array(b).fill(a).join(" × ")}.`],
        solution: `${a}^${b} = ${Math.pow(a, b)}.`,
        commonMistakes: [{ value: String(a * b), hint: "Exponent isn't multiply — it's repeated multiplication." }],
      };
    }
    const k = ri(2, 12, rng);
    return {
      prompt: `√${k * k}`, latex: `\\sqrt{${k * k}}`, inputType: "numeric",
      answer: String(k),
      hints: ["What number times itself gives this?", `${k} × ${k} = ${k * k}.`],
      solution: `√${k * k} = ${k}.`, commonMistakes: [],
    };
  },

  // 16 — One-step equations
  16: (d, rng) => {
    const x = ri(1, hi(d, 9, 1), rng), a = ri(2, hi(d, 9, 1), rng);
    const form = ri(0, 2, rng);
    if (form === 0) {
      return {
        prompt: `x + ${a} = ${x + a}.  Find x.`, latex: `x + ${a} = ${x + a}`, inputType: "numeric",
        answer: String(x),
        hints: ["Undo the addition.", `Subtract ${a} from both sides.`],
        solution: `x = ${x + a} − ${a} = ${x}.`, commonMistakes: [],
      };
    }
    if (form === 1) {
      return {
        prompt: `x − ${a} = ${x - a}.  Find x.`, latex: `x - ${a} = ${x - a}`, inputType: "numeric",
        answer: String(x),
        hints: ["Undo the subtraction.", `Add ${a} to both sides.`],
        solution: `x = ${x - a} + ${a} = ${x}.`, commonMistakes: [],
      };
    }
    return {
      prompt: `${a}x = ${a * x}.  Find x.`, latex: `${a}x = ${a * x}`, inputType: "numeric",
      answer: String(x),
      hints: ["Undo the multiplication.", `Divide both sides by ${a}.`],
      solution: `x = ${a * x} ÷ ${a} = ${x}.`, commonMistakes: [],
    };
  },

  // 17 — Two-step equations
  17: (_d, rng) => {
    const x = ri(1, 9, rng), a = ri(2, 6, rng), b = ri(1, 12, rng), c = a * x + b;
    return {
      prompt: `${a}x + ${b} = ${c}.  Find x.`, latex: `${a}x + ${b} = ${c}`, inputType: "numeric",
      answer: String(x),
      hints: ["Undo the +, then the ×.", `Subtract ${b} first: ${a}x = ${c - b}. Then ÷ ${a}.`],
      solution: `${a}x = ${c} − ${b} = ${c - b}; x = ${c - b} ÷ ${a} = ${x}.`,
      commonMistakes: [{ value: String(Math.round((c / a - b) * 100) / 100), hint: "Subtract before you divide — undo the +b first." }],
    };
  },

  // 18 — Combine like terms & distribute  (multiple choice)
  18: (_d, rng) => {
    const a = ri(2, 5, rng), b = ri(1, 6, rng), c = ri(1, 5, rng);
    const correct = `${a + c}x + ${a * b}`;
    const { choices, answer } = makeChoices(
      correct,
      [`${a + c}x + ${b}`, `${a}x + ${a * b}`, `${a + c}x + ${a + b}`, `${a * c}x + ${a * b}`],
      rng,
    );
    return {
      prompt: `Simplify: ${a}(x + ${b}) + ${c}x`, latex: `${a}(x + ${b}) + ${c}x`, inputType: "multiple-choice",
      answer, choices,
      hints: ["Distribute the " + a + " into the bracket first.", `${a}·x + ${a}·${b} + ${c}x, then combine the x terms.`],
      solution: `${a}(x + ${b}) + ${c}x = ${a}x + ${a * b} + ${c}x = ${correct}.`,
      commonMistakes: [],
    };
  },

  // 19 — Multi-step equations (variable both sides)
  19: (_d, rng) => {
    const x = ri(1, 9, rng);
    let a = ri(3, 7, rng), c = ri(1, a - 1, rng); // a > c so coefficient stays positive
    const b = ri(1, 9, rng);
    const d = a * x + b - c * x;
    return {
      prompt: `${a}x + ${b} = ${c}x + ${d}.  Find x.`, latex: `${a}x + ${b} = ${c}x + ${d}`, inputType: "numeric",
      answer: String(x),
      hints: ["Get the x terms on one side.", `Subtract ${c}x from both sides: ${a - c}x + ${b} = ${d}.`],
      solution: `${a - c}x = ${d} − ${b} = ${d - b}; x = ${x}.`, commonMistakes: [],
    };
  },

  // 20 — Linear equations with fractions
  20: (_d, rng) => {
    const a = ri(2, 5, rng), x = ri(1, 9, rng) * a, b = ri(1, 9, rng), c = x / a + b;
    return {
      prompt: `x/${a} + ${b} = ${c}.  Find x.`, latex: `\\frac{x}{${a}} + ${b} = ${c}`, inputType: "numeric",
      answer: String(x),
      hints: ["Clear the fraction first.", `Subtract ${b}, then multiply both sides by ${a}.`],
      solution: `x/${a} = ${c - b}; x = ${a} × ${c - b} = ${x}.`,
      commonMistakes: [{ value: String(c - b), hint: "Don't forget to multiply by " + a + " to clear the denominator." }],
    };
  },

  // 21 — Systems of equations (find x)
  21: (_d, rng) => {
    const x = ri(1, 9, rng), y = ri(1, 9, rng);
    const s = x + y, diff = x - y;
    return {
      prompt: `x + y = ${s},  x − y = ${diff}.  Find x.`, latex: `x + y = ${s}, \\quad x - y = ${diff}`, inputType: "numeric",
      answer: String(x),
      hints: ["Add the two equations to eliminate y.", `(x+y)+(x−y) = 2x = ${s + diff}.`],
      solution: `2x = ${s} + ${diff} = ${s + diff}; x = ${x}.`, commonMistakes: [],
    };
  },

  // 22 — Factoring (multiple choice)
  22: (_d, rng) => {
    const r = ri(1, 6, rng) * (rng() < 0.5 ? 1 : -1);
    const t = ri(1, 6, rng) * (rng() < 0.5 ? 1 : -1);
    const p = r + t, q = r * t;
    const correct = `(x ${term(r)})(x ${term(t)})`;
    const { choices, answer } = makeChoices(
      correct,
      [`(x ${term(-r)})(x ${term(-t)})`, `(x ${term(r)})(x ${term(-t)})`, `(x ${term(r + 1)})(x ${term(t - 1)})`],
      rng,
    );
    return {
      prompt: `Factor:  x² ${term(p)}x ${term(q)}`, latex: `x^{2} ${term(p)}x ${term(q)}`, inputType: "multiple-choice",
      answer, choices,
      hints: ["Find two numbers that multiply to the constant and add to the middle.", `Need product ${q} and sum ${p}.`],
      solution: `x² ${term(p)}x ${term(q)} = ${correct}.`, commonMistakes: [],
    };
  },

  // 23 — Quadratics with rational roots (smaller root)
  23: (_d, rng) => {
    const r = ri(1, 6, rng) * (rng() < 0.5 ? 1 : -1);
    const t = ri(1, 6, rng) * (rng() < 0.5 ? 1 : -1);
    const p = r + t, q = r * t;
    const roots = [-r, -t].sort((m, n) => m - n);
    return {
      prompt: `x² ${term(p)}x ${term(q)} = 0.  Smaller root?`, latex: `x^{2} ${term(p)}x ${term(q)} = 0`, inputType: "numeric",
      answer: String(roots[0]),
      hints: ["Factor, then set each factor to zero.", `(x ${term(r)})(x ${term(t)}) = 0, so x = ${-r} or x = ${-t}.`],
      solution: `Roots are ${-r} and ${-t}; the smaller is ${roots[0]}.`,
      commonMistakes: [{ value: String(Math.min(Math.abs(r), Math.abs(t))), hint: "Watch the signs — a factor (x + k) gives the root x = −k." }],
    };
  },
};

/** Generate a problem for a specific skill at a given difficulty. */
export function generateForSkill(skill: number, difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  const gen = GENERATORS[skill] ?? GENERATORS[1];
  return gen(difficulty, rng);
}

/** Pick a skill for a level (random among a blend's two skills) and generate. */
export function generateForLevel(skills: number[], difficulty: number, rng: RNG = Math.random): GeneratedProblem {
  const skill = skills.length === 1 ? skills[0] : pick(skills, rng);
  return generateForSkill(skill, difficulty, rng);
}
