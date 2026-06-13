"use client";

import { useMemo } from "react";
import { xpForLevel, levelForTotalXp } from "@/lib/gamification/xp";

interface Props {
  totalXp: number;
  level: number;
}

export default function XpBar({ totalXp, level }: Props) {
  const { levelStart, nextLevelStart, pct } = useMemo(() => {
    const levelStart = xpForLevel(level);
    const nextLevelStart = xpForLevel(level + 1);
    const denom = Math.max(1, nextLevelStart - levelStart);
    const lvl = levelForTotalXp(totalXp);
    const pct = Math.max(0, Math.min(1, lvl.xpInLevel / denom));
    return { levelStart, nextLevelStart, pct };
  }, [totalXp, level]);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Level {level}</span>
        <span className="text-muted">
          {totalXp.toLocaleString()} / {nextLevelStart.toLocaleString()} XP
        </span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-panel2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
          style={{ width: `${(pct * 100).toFixed(1)}%` }}
        />
      </div>
    </div>
  );
}
