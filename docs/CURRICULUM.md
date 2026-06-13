# Questline — Curriculum

The level ladder, from first addition facts up to factorable quadratics. Each level is **one generator** plus a list of common mistakes (see [DESIGN.md](DESIGN.md)). The "Common mistake" column shows the kind of slip the generator should detect and respond to with a targeted hint.

Difficulty climbs *within* a level too (number ranges widen as the progress bar fills), then the next level introduces a new skill.

---

## Tier 1 — Arithmetic

| # | Level | Example | Common mistake → hint |
|---|-------|---------|------------------------|
| 1 | Addition | `8 + 7 = 15` | Miscount by one → "Recount carefully." |
| 2 | Subtraction | `15 − 6 = 9` | Reversed to `6 − 15` → "Subtract the smaller from the larger here." |
| 3 | Add & subtract | `9 + 6 − 4 = 11` | Slipped left-to-right → "Work through one step at a time." |
| 4 | Multiplication | `7 × 8 = 56` | Adjacent table fact (`54`) → "Double-check that times-table fact." |
| 5 | Subtract & multiply | `6 × 4 − 5 = 19` | Subtracted first (`6 × (4−5)`) → "Do × before −." |
| 6 | Division | `56 ÷ 8 = 7` | Wrong related fact → "Which number times 8 makes 56?" |
| 7 | Multiply & divide | `6 × 4 ÷ 3 = 8` | Wrong order → "Go left to right for × and ÷." |
| 8 | All four mixed | `3 + 6 × 2 − 4 = 11` | Ignored precedence → "× and ÷ come before + and −." |
| 9 | Order of operations | `2 + 3 × 4 = 14` | Added first (`20`) → "Multiply before you add." |

## Tier 2 — Integers & rationals

| # | Level | Example | Common mistake → hint |
|---|-------|---------|------------------------|
| 10 | Negatives (+ / −) | `3 − 7 = −4` | Dropped the sign (`4`) → "Going below zero gives a negative." |
| 11 | Negatives (× / ÷) | `−6 × 4 = −24` | Sign rule slip → "A negative times a positive is negative." |
| 12 | Fractions (+ / −) | `1/2 + 1/3 = 5/6` | Added denominators (`2/5`) → "Find a common denominator first." |
| 13 | Fractions (× / ÷) | `2/3 ÷ 4/5 = 5/6` | Didn't invert → "To divide, multiply by the reciprocal." |
| 14 | Decimals & percents | `25% of 80 = 20` | Misplaced decimal → "25% means × 0.25." |
| 15 | Exponents & roots | `2^5 = 32`, `√144 = 12` | `2^5 = 10` (base × exp) → "Exponent means repeated multiplication." |

## Tier 3 — Pre-algebra

| # | Level | Example | Common mistake → hint |
|---|-------|---------|------------------------|
| 16 | One-step equations | `x + 7 = 12 → x = 5` | Wrong inverse op → "Undo `+7` by subtracting 7 from both sides." |
| 17 | Two-step equations | `3x + 4 = 19 → x = 5` | Divided before subtracting → "Undo the `+4` first, then the `×3`." |
| 18 | Combine like terms & distribute | `2(x + 3) + x = 3x + 6` | Didn't distribute fully → "Multiply the 2 into *both* terms." |
| 19 | Multi-step equations | `5x − 3 = 2x + 9 → x = 4` | Sign error moving terms → "Subtracting `2x` from both sides flips its sign." |

## Tier 4 — Algebra 1

| # | Level | Example | Common mistake → hint |
|---|-------|---------|------------------------|
| 20 | Linear equations (with fractions) | `x/2 + 3 = 7 → x = 8` | Didn't clear the denominator → "Multiply every term by 2 first." |
| 21 | Systems of equations | `x + y = 5, x − y = 1 → (3, 2)` | Substitution sign slip → "Watch the sign when you substitute." |
| 22 | Factoring | `x² + 5x + 6 = (x+2)(x+3)` | Wrong factor pair → "Find two numbers that multiply to 6 and add to 5." |
| 23 | Quadratics (rational roots) | `x² + 5x + 6 = 0 → x = −2, −3` | Found only one root / wrong signs → "A quadratic has two solutions; set each factor to 0." |

---

## Notes

- **Number ranges** widen as a level's progress bar fills, so early problems in a level are gentle and later ones stretch.
- **Branching later:** the ladder is linear for v1. A skill *tree* (e.g. a geometry track branching off after Tier 2) is a natural future extension.
- Generators are the unit of work — adding a level means adding one generator + its common mistakes, with no schema changes.
