"use client";

import { useMemo } from "react";

export interface TopicRow {
  id: string;
  slug: string;
  name: string;
  baseRating: number;
  rating: number;
  solved: number;
  attempts: number;
  unlocked: boolean;
  prereqSlugs: string[];
}

interface Props {
  topics: TopicRow[];
  topicNames: Record<string, string>;
  topicSlugs: Record<string, string>;
}

const UNLOCK = 1100;

function progressPct(rating: number, base: number): number {
  // Map [base, base+300] to [0, 1] and clamp.
  return Math.max(0, Math.min(1, (rating - base) / 300));
}

export default function TopicMap({ topics, topicNames, topicSlugs }: Props) {
  // Topo sort by unlocked status then order
  const sorted = useMemo(() => {
    return [...topics].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      return a.rating - b.rating;
    });
  }, [topics]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted">SKILL MAP</h2>
        <span className="text-xs text-muted">unlocks at {UNLOCK}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {sorted.map((t) => {
          const pct = progressPct(t.rating, t.baseRating);
          const prereqNames = t.prereqSlugs
            .map((id) => topicNames[id] ?? topicSlugs[id] ?? id)
            .filter(Boolean);
          return (
            <li
              key={t.id}
              className={`rounded-lg border px-3 py-2 ${
                t.unlocked ? "border-white/10 bg-panel2" : "border-white/5 bg-panel2/40 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {t.unlocked ? "●" : "○"} {t.name}
                </span>
                <span className="text-xs text-muted">
                  {t.rating} • {t.solved}/{t.attempts || 0}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className={`h-full ${t.unlocked ? "bg-accent2" : "bg-muted"}`}
                  style={{ width: `${(pct * 100).toFixed(0)}%` }}
                />
              </div>
              {prereqNames.length > 0 && (
                <p className="mt-1 text-[11px] text-muted">
                  Requires: {prereqNames.join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
