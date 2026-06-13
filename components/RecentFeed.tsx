"use client";

export interface RecentRow {
  id: string;
  correct: boolean;
  timeMs: number;
  xpAwarded: number;
  createdAt: string;
  problemPrompt: string;
  topicName: string;
  ratingAfter: number;
}

interface Props {
  rows: RecentRow[];
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function RecentFeed({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="card">
        <h2 className="text-sm font-semibold tracking-wide text-muted">RECENT</h2>
        <p className="mt-2 text-sm text-muted">No attempts yet. Solve a problem to start your streak.</p>
      </div>
    );
  }
  return (
    <div className="card">
      <h2 className="text-sm font-semibold tracking-wide text-muted">RECENT</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <span className={r.correct ? "text-good" : "text-bad"}>{r.correct ? "✓" : "✗"}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate">{r.problemPrompt}</p>
              <p className="text-xs text-muted">
                {r.topicName} • +{r.xpAwarded} XP • mastery {r.ratingAfter} • {relTime(r.createdAt)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
