"use client";

import { useEffect } from "react";

export interface Feedback {
  kind: "success" | "failure" | "error";
  title: string;
  body: string;
  xpBreakdown?: { base: number; speed: number; hint: number; streak: number; total: number };
}

interface Props {
  feedback: Feedback;
  onDismiss: () => void;
}

export default function FeedbackToast({ feedback, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [feedback, onDismiss]);

  const tone =
    feedback.kind === "success"
      ? "border-good/40 bg-good/10"
      : feedback.kind === "failure"
      ? "border-bad/40 bg-bad/10"
      : "border-amber-500/40 bg-amber-500/10";

  return (
    <div className={`rounded-xl border p-4 text-sm ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{feedback.title}</p>
          <p className="text-muted">{feedback.body}</p>
          {feedback.xpBreakdown && feedback.xpBreakdown.total > 0 && (
            <p className="mt-1 text-xs text-muted">
              XP = {feedback.xpBreakdown.base} base × {feedback.xpBreakdown.speed.toFixed(2)} speed ×{" "}
              {feedback.xpBreakdown.hint.toFixed(2)} hint × {feedback.xpBreakdown.streak.toFixed(2)} streak ={" "}
              <span className="text-text">{feedback.xpBreakdown.total}</span>
            </p>
          )}
        </div>
        <button onClick={onDismiss} className="text-muted hover:text-text" aria-label="dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}
