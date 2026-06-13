"use client";

export interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: string;
  owned: boolean;
}

interface Props {
  badges: BadgeRow[];
}

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-slate-400 to-slate-200",
  gold: "from-yellow-500 to-yellow-300",
  platinum: "from-cyan-300 to-violet-300",
};

export default function BadgeCase({ badges }: Props) {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold tracking-wide text-muted">BADGES</h2>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {badges.map((b) => {
          const tier = TIER_COLORS[b.tier] ?? TIER_COLORS.bronze;
          return (
            <li
              key={b.id}
              className={`relative aspect-square rounded-lg border border-white/5 p-1 ${
                b.owned ? "bg-panel2" : "bg-panel2/30 opacity-50"
              }`}
              title={`${b.name} (${b.tier}) — ${b.description}`}
            >
              <div
                className={`flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br ${tier} text-2xl font-black text-black/70`}
              >
                {b.name.charAt(0)}
              </div>
              <p className="mt-1 truncate text-center text-[10px] text-muted">{b.name}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
