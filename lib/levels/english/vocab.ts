/**
 * Vocabulary bank for the English section. Each entry powers definition,
 * synonym, and antonym questions. Grouped into two difficulty bands.
 */

export type Band = "easy" | "hard";

export interface VocabEntry {
  word: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  band: Band;
}

export const VOCAB: VocabEntry[] = [
  // ── easy ──
  { word: "happy", definition: "feeling joy or pleasure", synonyms: ["glad", "cheerful", "joyful"], antonyms: ["sad", "unhappy"], band: "easy" },
  { word: "big", definition: "large in size", synonyms: ["large", "huge"], antonyms: ["small", "tiny"], band: "easy" },
  { word: "fast", definition: "moving quickly", synonyms: ["quick", "speedy"], antonyms: ["slow"], band: "easy" },
  { word: "cold", definition: "having a low temperature", synonyms: ["chilly", "freezing"], antonyms: ["hot", "warm"], band: "easy" },
  { word: "begin", definition: "to start something", synonyms: ["start", "commence"], antonyms: ["end", "finish"], band: "easy" },
  { word: "quiet", definition: "making little or no noise", synonyms: ["silent", "hushed"], antonyms: ["loud", "noisy"], band: "easy" },
  { word: "brave", definition: "showing courage", synonyms: ["bold", "courageous"], antonyms: ["afraid", "cowardly"], band: "easy" },
  { word: "easy", definition: "not hard to do", synonyms: ["simple"], antonyms: ["hard", "difficult"], band: "easy" },
  { word: "tidy", definition: "neat and in order", synonyms: ["neat", "orderly"], antonyms: ["messy"], band: "easy" },
  { word: "kind", definition: "caring and friendly", synonyms: ["nice", "caring"], antonyms: ["cruel", "mean"], band: "easy" },

  // ── hard ──
  { word: "abundant", definition: "existing in large amounts", synonyms: ["plentiful", "ample"], antonyms: ["scarce", "sparse"], band: "hard" },
  { word: "reluctant", definition: "unwilling and hesitant", synonyms: ["hesitant", "unwilling"], antonyms: ["eager", "willing"], band: "hard" },
  { word: "diligent", definition: "showing careful, steady effort", synonyms: ["hardworking", "industrious"], antonyms: ["lazy", "careless"], band: "hard" },
  { word: "tranquil", definition: "calm and peaceful", synonyms: ["calm", "serene"], antonyms: ["agitated", "turbulent"], band: "hard" },
  { word: "candid", definition: "honest and straightforward", synonyms: ["frank", "honest"], antonyms: ["evasive", "secretive"], band: "hard" },
  { word: "frugal", definition: "careful and sparing with money", synonyms: ["thrifty", "economical"], antonyms: ["wasteful", "extravagant"], band: "hard" },
  { word: "novice", definition: "a person new to something", synonyms: ["beginner", "newcomer"], antonyms: ["expert", "veteran"], band: "hard" },
  { word: "vivid", definition: "bright, clear, and intense", synonyms: ["bright", "striking"], antonyms: ["dull", "faded"], band: "hard" },
  { word: "obstinate", definition: "stubborn; unwilling to change", synonyms: ["stubborn", "headstrong"], antonyms: ["flexible", "compliant"], band: "hard" },
  { word: "scarce", definition: "hard to find; in short supply", synonyms: ["rare", "sparse"], antonyms: ["plentiful", "abundant"], band: "hard" },
];

export function bandWords(band: Band): VocabEntry[] {
  return VOCAB.filter((v) => v.band === band);
}
