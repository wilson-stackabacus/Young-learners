"use client";

interface Props {
  current: number;
  longest: number;
  freezes: number;
}

export default function StreakBadge({ current, longest, freezes }: Props) {
  return (
    <div className="card flex items-center gap-3 py-2 px-3">
      <div className="text-2xl leading-none">🔥</div>
      <div className="text-sm leading-tight">
        <div className="font-semibold">{current} day streak</div>
        <div className="text-muted text-xs">Best: {longest} • Freezes: {freezes}</div>
      </div>
    </div>
  );
}
