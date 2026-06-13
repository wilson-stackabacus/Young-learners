"use client";

import { useEffect, useState } from "react";

export interface ProblemView {
  id: string;
  prompt: string;
  kind: string;
  difficulty: number;
  topicId: string;
  topicName: string;
  topicSlug: string;
  payload: {
    type?: "numeric" | "multiple_choice" | "short";
    choices?: string[];
    hints?: string[];
    tolerance?: number;
  };
}

interface Props {
  problem: ProblemView;
  targetMastery: number | null;
  userMastery: number | null;
  submitting: boolean;
  onSubmit: (answer: string, timeMs: number, usedHint: boolean) => void | Promise<void>;
}

function formatGap(target: number | null, user: number | null): string {
  if (target == null || user == null) return "";
  const diff = target - user;
  const sign = diff >= 0 ? "+" : "";
  return `target ${target} • you ${user} (${sign}${diff})`;
}

export default function ProblemCard({ problem, targetMastery, userMastery, submitting, onSubmit }: Props) {
  const [answer, setAnswer] = useState("");
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [hintIndex, setHintIndex] = useState(0);
  const [usedHint, setUsedHint] = useState(false);

  useEffect(() => {
    setAnswer("");
    setStartedAt(Date.now());
    setHintIndex(0);
    setUsedHint(false);
  }, [problem.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const timeMs = Date.now() - startedAt;
    onSubmit(answer, timeMs, usedHint);
  };

  const handleChoice = (i: number) => {
    if (submitting) return;
    setAnswer(String(i));
    const timeMs = Math.max(250, Date.now() - startedAt);
    onSubmit(String(i), timeMs, usedHint);
  };

  const hints = problem.payload.hints ?? [];
  const difficultyStars = "★".repeat(problem.difficulty) + "☆".repeat(5 - problem.difficulty);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{problem.topicName}</span>
          <span className="chip" title="Difficulty">d{problem.difficulty} {difficultyStars}</span>
          <span className="chip" title="Target vs your mastery">
            {formatGap(targetMastery, userMastery)}
          </span>
        </div>
        <span className="text-xs text-muted">Problem {problem.id.slice(0, 6)}</span>
      </div>

      <p className="text-lg leading-snug">{problem.prompt}</p>

      {problem.payload.type === "multiple_choice" && problem.payload.choices ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {problem.payload.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChoice(i)}
              className="btn-secondary justify-start text-left"
            >
              <span className="mr-2 text-muted">{String.fromCharCode(65 + i)}.</span> {c}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            autoFocus
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Your answer"
            inputMode={problem.payload.type === "numeric" ? "decimal" : "text"}
            className="w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-base outline-none focus:border-accent"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hints.length > 0 && hintIndex < hints.length && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setHintIndex((i) => Math.min(hints.length, i + 1));
                    setUsedHint(true);
                  }}
                >
                  Hint ({hintIndex + 1}/{hints.length})
                </button>
              )}
              <span className="kbd">Enter</span>
            </div>
            <button type="submit" className="btn-primary" disabled={submitting || !answer}>
              {submitting ? "Checking…" : "Submit"}
            </button>
          </div>
        </form>
      )}

      {hintIndex > 0 && (
        <ul className="space-y-1 rounded-lg border border-white/5 bg-panel2 p-3 text-sm">
          {hints.slice(0, hintIndex).map((h, i) => (
            <li key={i} className="text-muted">💡 {h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
