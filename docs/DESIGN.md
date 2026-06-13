# Questline — System Design

This is the spec for how Questline actually behaves. No application code lives here yet — this document defines the rules the code will implement.

The short version:

> A linear, mastery-gated **level ladder**. Each level drills one skill, problems are **procedurally generated**, you advance by filling a **progress bar**, and a wrong answer triggers a **two-hint → solution** diagnostic flow.

---

## 1. Content model — generators, not a question bank

For arithmetic through Algebra 1, problems are **generated**, not stored. Each level is one generator function plus a list of *common mistakes*. A generator produces a fresh problem, its exact answer (known by construction), tiered hints, and the answer patterns that signal specific misconceptions.

```ts
// Level 5 — "Subtract & multiply"
function generate() {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const c = randInt(1, 20);
  return {
    prompt:  `${a} × ${b} − ${c}`,
    answer:  a * b - c,
    hints: [
      "Handle the multiplication before the subtraction.",   // Hint 1: conceptual
      `First work out ${a} × ${b}, then subtract ${c}.`,      // Hint 2: procedural
    ],
    commonMistakes: [
      // subtracted first: a × (b − c)
      { value: a * (b - c), hint: "Looks like you subtracted first — do × before −." },
    ],
  };
}
```

Why generators:
- **Infinite, non-repeating** problems at exactly the right skill.
- **The answer is always known**, so there is no answer key to author or maintain.
- **Wrong answers are predictable** — the generator knows how the problem was built, so it can recognize *which* mistake a learner made and respond to it (see §3).

The full list of levels and their skills lives in [CURRICULUM.md](CURRICULUM.md).

---

## 2. Progression — the progress bar

Each level has a **progress bar** from `0` to `100`. The learner advances to the next level when it reaches `100`.

Movement blends two signals, exactly as decided:
- **Rolling accuracy** over the last ~10 attempts is the *main* driver (accurate learners climb fast).
- **Volume** is a guaranteed floor — every correct answer always adds *something*, so a less-accurate learner who keeps practicing still climbs, just slower.

```
windowSize    = min(attemptsThisLevel, 10)
recentCorrect = correct answers within the last `windowSize` attempts
accuracy      = recentCorrect / windowSize          // 0.0 – 1.0

on CORRECT:
    gain = BASE_GAIN + ACCURACY_BONUS * accuracy     // 6 + 8·acc  →  ranges 6 … 14
    progress = min(100, progress + gain)

on INCORRECT (after the hint sequence in §3):
    progress = max(0, progress - WRONG_PENALTY)      // 4

advance when progress >= 100
```

- `BASE_GAIN` (6) is the **volume guarantee** — the "it goes up even if accuracy is lower" piece.
- `ACCURACY_BONUS · accuracy` (0–8) is the **accuracy weighting** — the "mostly based on correct in the last 10" piece.
- `WRONG_PENALTY` (4) is **less than** `BASE_GAIN`, so a determined learner always trends upward.

### Pacing this produces

| Rolling accuracy | Net progress / 10 problems | ≈ problems to clear a level |
|------------------|----------------------------|-----------------------------|
| 100% (10 / 10)   | +140                       | ~8                          |
| 70% (7 / 10)     | +69                        | ~15                         |
| 50% (5 / 10)     | +30                        | ~33                         |
| 40% (4 / 10)     | +13                        | ~78                         |
| ≤ ~35%           | ≤ 0 (bar stalls)           | never — keep practicing     |

So accuracy sets the *pace*; volume still gets you there. Below ~35% the bar naturally stalls — the system's way of saying "not ready yet," which is a good trigger to suggest dropping back a level.

All five constants are tunables — see §5.

---

## 3. Feedback — the two-hint flow

A wrong answer is never just "❌." It opens a short diagnostic ladder:

```
Wrong attempt #1  →  show Hint 1 (conceptual nudge)         →  retry same problem
Wrong attempt #2  →  show Hint 2 (specific / diagnostic)    →  retry same problem
Wrong attempt #3  →  reveal the full worked solution        →  move on to a new problem
```

Rules:
- **Diagnostic injection.** If the learner's wrong answer matches a `commonMistake.value` for that problem, show *that* mistake's targeted hint in place of the generic hint. This is what turns "wrong" into "here's probably what happened."
- **Scoring (§2):**
  - Solved on any attempt → counts as **correct** for the progress bar.
  - Never solved (needed the solution) → counts as **one incorrect**.
- **Optional tunable:** award reduced gain for a *hinted* correct answer (e.g. `gain × 0.5`). Off by default — a correct answer is a correct answer.

---

## 4. Data model

Generators live in code; per-learner state lives in the database.

- **User** — profile, current level, total XP, current streak.
- **Level** — `id`, `order`, `name`, `tier`. (The generator itself is code, keyed by `id`.)
- **LevelProgress** — `userId × levelId`, `progress` (0–100), `recentResults` (rolling window of the last 10 correct/incorrect), `totalCorrect`, `totalAttempts`, `completedAt`.
- **Attempt** — `userId`, `levelId`, `prompt`, `givenAnswer`, `correct`, `hintsUsed`, `solvedAfterHint`, `timestamp`.
- **Badge / Achievement** — definition + per-user unlocks.

The gamification layer (XP, streaks, badges) from the [README](../README.md) sits on top of this and reacts to `Attempt` events.

---

## 5. Tunable knobs

Centralize these so the difficulty curve can be tuned without touching logic:

| Constant            | Default | Controls                                            |
|---------------------|---------|-----------------------------------------------------|
| `WINDOW`            | 10      | How many recent attempts define "rolling accuracy"  |
| `BASE_GAIN`         | 6       | Guaranteed progress per correct answer (volume)     |
| `ACCURACY_BONUS`    | 8       | Extra progress scaled by accuracy                   |
| `WRONG_PENALTY`     | 4       | Progress lost per incorrect answer                  |
| `ADVANCE_AT`        | 100     | Progress needed to clear a level                    |
| `HINTS_BEFORE_SOLUTION` | 2   | Hints shown before revealing the worked solution    |
| `HINTED_CORRECT_MULT`   | 1.0 | Gain multiplier when solved after a hint            |
