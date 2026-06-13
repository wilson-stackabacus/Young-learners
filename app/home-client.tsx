"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import XpBar from "@/components/XpBar";
import StreakBadge from "@/components/StreakBadge";
import ProblemCard, { type ProblemView } from "@/components/ProblemCard";
import TopicMap from "@/components/TopicMap";
import BadgeCase from "@/components/BadgeCase";
import RecentFeed from "@/components/RecentFeed";
import FeedbackToast, { type Feedback } from "@/components/FeedbackToast";

export interface UserState {
  id: string;
  username: string;
  displayName: string;
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
}

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

export interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: string;
  owned: boolean;
}

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
  user: UserState;
  topics: TopicRow[];
  topicNames: Record<string, string>;
  topicSlugs: Record<string, string>;
  badges: BadgeRow[];
  recent: RecentRow[];
}

export default function HomeClient({ user: initialUser, topics: initialTopics, topicNames, topicSlugs, badges: initialBadges, recent: initialRecent }: Props) {
  const [user, setUser] = useState(initialUser);
  const [topics, setTopics] = useState(initialTopics);
  const [badges, setBadges] = useState(initialBadges);
  const [recent, setRecent] = useState(initialRecent);
  const [problem, setProblem] = useState<ProblemView | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [targetMastery, setTargetMastery] = useState<number | null>(null);
  const [userMastery, setUserMastery] = useState<number | null>(null);

  const loadProblem = useCallback(async () => {
    setLoadingProblem(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/next-problem", { cache: "no-store" });
      if (!res.ok) {
        setProblem(null);
        return;
      }
      const data = (await res.json()) as {
        problem: ProblemView;
        targetMastery: number;
        userMastery: number;
      };
      setProblem(data.problem);
      setTargetMastery(data.targetMastery);
      setUserMastery(data.userMastery);
    } finally {
      setLoadingProblem(false);
    }
  }, []);

  useEffect(() => {
    if (!problem && !loadingProblem) {
      void loadProblem();
    }
  }, [problem, loadingProblem, loadProblem]);

  const onSubmit = useCallback(
    async (answer: string, timeMs: number, usedHint: boolean) => {
      if (!problem) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/attempt", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ problemId: problem.id, answer, timeMs, usedHint }),
        });
        if (!res.ok) {
          setFeedback({ kind: "error", title: "Submission failed", body: "Please try again." });
          return;
        }
        const data = (await res.json()) as {
          correct: boolean;
          xpAwarded: number;
          xpBreakdown: { base: number; speed: number; hint: number; streak: number; total: number };
          ratingBefore: number;
          ratingAfter: number;
          ratingDelta: number;
          newLevel: number;
          leveledUp: boolean;
          streak: { current: number; longest: number; usedFreeze: boolean; broke: boolean };
          newBadges: { badgeId: string; slug: string; name: string; tier: string }[];
          newlyUnlocked: { id: string; name: string; slug: string }[];
        };
        setUser((u) => ({
          ...u,
          totalXp: u.totalXp + data.xpAwarded,
          level: data.newLevel,
          currentStreak: data.streak.current,
          longestStreak: data.streak.longest,
        }));
        setTopics((rows) =>
          rows.map((r) =>
            r.id === problem.topicId
              ? {
                  ...r,
                  rating: data.ratingAfter,
                  solved: r.solved + (data.correct ? 1 : 0),
                  attempts: r.attempts + 1,
                  unlocked: r.unlocked || data.ratingAfter >= 1100,
                }
              : r,
          ),
        );
        if (data.newBadges.length) {
          const newIds = new Set(data.newBadges.map((b) => b.badgeId));
          setBadges((bs) => bs.map((b) => (newIds.has(b.id) ? { ...b, owned: true } : b)));
        }
        setRecent((rows) => [
          {
            id: data.correct ? "ok" : "x",
            correct: data.correct,
            timeMs,
            xpAwarded: data.xpAwarded,
            createdAt: new Date().toISOString(),
            problemPrompt: problem.prompt,
            topicName: topicNames[problem.topicId] ?? "",
            ratingAfter: data.ratingAfter,
          },
          ...rows,
        ].slice(0, 10));
        setFeedback({
          kind: data.correct ? "success" : "failure",
          title: data.correct ? "Correct!" : "Not quite",
          body: data.correct
            ? `+${data.xpAwarded} XP${data.leveledUp ? ` — Level ${data.newLevel}!` : ""}${
                data.newBadges.length ? `  •  New badge: ${data.newBadges.map((b) => b.name).join(", ")}` : ""
              }${data.newlyUnlocked.length ? `  •  Unlocked: ${data.newlyUnlocked.map((t) => t.name).join(", ")}` : ""}`
            : `Mastery ${data.ratingBefore} → ${data.ratingAfter} (${data.ratingDelta >= 0 ? "+" : ""}${data.ratingDelta}). Try a hint or skip.`,
          xpBreakdown: data.xpBreakdown,
        });
        // Auto-load next problem after a brief pause.
        setProblem(null);
      } finally {
        setSubmitting(false);
      }
    },
    [problem, topicNames],
  );

  const headline = useMemo(
    () => `${user.displayName} — Level ${user.level}`,
    [user.displayName, user.level],
  );

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questline</h1>
          <p className="text-sm text-muted">{headline}</p>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge current={user.currentStreak} longest={user.longestStreak} freezes={user.freezesAvailable} />
        </div>
      </header>

      <section className="card">
        <XpBar totalXp={user.totalXp} level={user.level} />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {problem ? (
            <ProblemCard
              problem={problem}
              targetMastery={targetMastery}
              userMastery={userMastery}
              onSubmit={onSubmit}
              submitting={submitting}
            />
          ) : (
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Loading next problem…</p>
                  <p className="text-xs text-muted/70">Selecting a topic that matches your current mastery.</p>
                </div>
                <button className="btn-secondary" onClick={() => loadProblem()}>
                  Skip / Next
                </button>
              </div>
            </div>
          )}
          {feedback && <FeedbackToast feedback={feedback} onDismiss={() => setFeedback(null)} />}
        </div>

        <aside className="space-y-4">
          <TopicMap
            topics={topics}
            topicNames={topicNames}
            topicSlugs={topicSlugs}
          />
          <BadgeCase badges={badges} />
          <RecentFeed rows={recent} />
        </aside>
      </section>
    </main>
  );
}
