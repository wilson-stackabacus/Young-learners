/**
 * AI hint fallback — Google Gemini.
 *
 * Called by the engine ONLY when a wrong answer doesn't match a known
 * common-mistake pattern. Returns a short, answer-free hint, or null if no API
 * key is set or the call fails — in which case the engine falls back to the
 * templated hint. Runs server-side only; the API key never reaches the client.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export interface AiHintArgs {
  prompt: string; // the problem statement
  correctAnswer: string; // stays server-side — used to steer the hint
  givenAnswer: string; // the student's wrong answer
  skillNames: string[]; // the skill(s) being practiced
}

export async function aiHint(args: AiHintArgs): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const instruction =
    `You are a kind, encouraging math tutor.\n` +
    `Problem: ${args.prompt}\n` +
    `Skill(s) practiced: ${args.skillNames.join(", ")}\n` +
    `The correct answer is ${args.correctAnswer}.\n` +
    `The student answered ${args.givenAnswer}, which is wrong.\n` +
    `Give ONE short hint (max 20 words) that points at the likely mistake and nudges ` +
    `them toward the right idea. Do NOT reveal or state the correct answer. ` +
    `No preamble — just the hint.`;

  try {
    const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instruction }] }],
        generationConfig: { maxOutputTokens: 64, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text ? text.replace(/\s+/g, " ") : null;
  } catch {
    return null; // timeout / network / parse error → fall back to templated hint
  }
}
