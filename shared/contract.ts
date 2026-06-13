/**
 * Questline — shared API contract
 *
 * The single source of truth for the data the BACKEND sends to the FRONTEND
 * (and the small payloads the frontend sends back). Both sides import these
 * types so the "outputs" stay in sync. No logic lives here — types only.
 *
 * See docs/API.md for the endpoints and JSON examples that use these types.
 */

/* ----------------------------------------------------------------------------
 * Levels & worlds  (the 225-level ladder)
 * ------------------------------------------------------------------------- */

export type WorldId = 'arithmetic' | 'integers' | 'pre-algebra' | 'algebra-1';

export interface WorldMeta {
  id: WorldId;
  name: string;
  /** inclusive skill range [first, last] within 1..23 this world covers */
  skillRange: [number, number];
  /** inclusive stage range [first, last] within 1..225 */
  stageRange: [number, number];
}

export type LevelKind = 'pure' | 'blend';

/** Static definition of one of the 225 stages. */
export interface LevelInfo {
  stage: number;          // 1..225  — global level id
  tier: number;           // 1..45   — difficulty step
  stageInTier: number;    // 1..5
  kind: LevelKind;        // 'pure' = one skill, 'blend' = two adjacent skills
  skills: number[];       // [4] for pure, [4, 5] for a blend  (skill ids 1..23)
  skillNames: string[];   // human labels, aligned index-for-index with `skills`
  world: WorldId;
  difficulty: number;     // 4 for pure Lv4, 4.5 for the Lv4½ blend
}

export type LevelStatus = 'locked' | 'current' | 'cleared';

/** A level plus THIS user's progress on it — one entry per node on the map. */
export interface LevelState extends LevelInfo {
  status: LevelStatus;
  progress: number;       // 0..100  — the progress bar
  stars: number;          // 0..3
}

/* ----------------------------------------------------------------------------
 * Account
 * ------------------------------------------------------------------------- */

/** Account summary the frontend shows in the header. */
export interface UserSummary {
  id: string;
  displayName: string | null;
  totalXp: number;
  currentStage: number;   // 1..225
  streakDays: number;
}

/* ----------------------------------------------------------------------------
 * Responses
 * ------------------------------------------------------------------------- */

/** GET /api/me */
export type MeResponse = UserSummary;

/** GET /api/map — everything the world map needs in one payload. */
export interface MapResponse {
  user: UserSummary;
  worlds: WorldMeta[];
  levels: LevelState[];   // length 225
}

export type ProblemInputType =
  | 'numeric'          // e.g. -4, 56
  | 'fraction'         // e.g. 5/6
  | 'expression'       // e.g. (x+2)(x+3) — needs symbolic checking server-side
  | 'multiple-choice';

/** A generated problem as the FRONTEND sees it. NOTE: the answer is never included. */
export interface Problem {
  token: string;          // opaque handle; submit this back with the answer
  stage: number;
  prompt: string;         // plain-text statement
  latex?: string;         // optional LaTeX for KaTeX rendering
  inputType: ProblemInputType;
  choices?: { id: string; label: string }[];  // only for 'multiple-choice'
}

/** Live stats bundled with every problem and every answer. */
export interface Stats {
  totalXp: number;
  accuracy: number;       // 0..1 — rolling over the last 10 attempts on this stage
  progress: number;       // 0..100 — progress bar for the current stage
  stars: number;          // 0..3 — earned so far on this stage
  streakDays: number;
}

/** GET /api/levels/{stage}/problem — "level + XP + accuracy + question". */
export interface ProblemResponse {
  level: LevelInfo;
  problem: Problem;
  stats: Stats;
}

/* ----------------------------------------------------------------------------
 * Answering
 * ------------------------------------------------------------------------- */

/** POST /api/levels/{stage}/answer — request body. */
export interface AnswerRequest {
  token: string;          // from the Problem the user is answering
  answer: string;         // the user's input as a string; the backend parses it
}

export type AnswerState =
  | 'hint'        // wrong — a hint is returned; retry the SAME problem
  | 'solved'      // correct
  | 'revealed';   // out of hints — full solution returned; move on

/** POST /api/levels/{stage}/answer — response. */
export interface AnswerResponse {
  correct: boolean;
  state: AnswerState;
  hint?: string;              // present when state === 'hint'
  solution?: string;         // present when state === 'revealed' (and after solving)
  attemptsRemaining: number; // hints left before the solution is shown
  stats: Stats & {
    xpGained: number;        // XP added by this answer
    progressDelta: number;   // change to the progress bar (+ on solve, − on fail)
  };
  /** present only when this answer filled the bar to 100 and unlocked the next stage */
  advanced?: { toStage: number };
  /** the next problem, when state is 'solved' or 'revealed' */
  nextProblem?: Problem;
}

/* ----------------------------------------------------------------------------
 * Errors
 * ------------------------------------------------------------------------- */

export interface ApiError {
  error: { code: string; message: string };
}
