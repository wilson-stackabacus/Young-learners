"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import XpBar from "@/components/XpBar";
import StreakBadge from "@/components/StreakBadge";
import ProblemCard, { type ProblemView } from "@/components/ProblemCard";
import TopicMap from "@/components/TopicMap";
import BadgeCase from "@/components/BadgeCase";
import RecentFeed, { type RecentRow } from "@/components/RecentFeed";
import FeedbackToast, { type Feedback } from "@/components/FeedbackToast";

export interface UserState {
  id: string;
  username: string;
  displayName: string;
  role: string;
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
  subject: string;
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

interface Props {
  user: UserState & { role: string };
  topics: TopicRow[];
  topicNames: Record<string, string>;
  topicSlugs: Record<string, string>;
  badges: BadgeRow[];
  recent: RecentRow[];
}

interface QuestStatus {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  targetValue: number;
  xpReward: number;
  progress: number;
  completed: boolean;
}

interface LeaderboardUser {
  id: string;
  username: string;
  displayName: string;
  totalXp: number;
  level: number;
  currentStreak: number;
}

interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherName?: string;
  joinedAt?: string;
}

interface ClassroomDetails {
  classroom: {
    id: string;
    name: string;
    code: string;
    teacherName: string;
    isTeacher: boolean;
  };
  students: {
    id: string;
    displayName: string;
    username: string;
    totalXp: number;
    level: number;
    currentStreak: number;
    joinedAt: string;
    mastery: Record<string, number>;
  }[];
  topics: {
    id: string;
    name: string;
    slug: string;
    subject: string;
    baseRating: number;
  }[];
}

export default function HomeClient({
  user: initialUser,
  topics: initialTopics,
  topicNames,
  topicSlugs,
  badges: initialBadges,
  recent: initialRecent,
}: Props) {
  const [user, setUser] = useState<UserState>(initialUser);
  const [topics, setTopics] = useState<TopicRow[]>(initialTopics);
  const [badges, setBadges] = useState<BadgeRow[]>(initialBadges);
  const [recent, setRecent] = useState<RecentRow[]>(initialRecent);
  const [problem, setProblem] = useState<ProblemView | null>(null);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [targetMastery, setTargetMastery] = useState<number | null>(null);
  const [userMastery, setUserMastery] = useState<number | null>(null);

  // Expanded UI States
  const [activeTab, setActiveTab] = useState<"learn" | "quests" | "leaderboard" | "classroom">("learn");
  const [activeSubject, setActiveSubject] = useState<"math" | "computer_science">("math");

  // Quest states
  const [quests, setQuests] = useState<QuestStatus[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // Classroom states
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDetails | null>(null);
  const [loadingClassroomDetails, setLoadingClassroomDetails] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [newClassNameInput, setNewClassNameInput] = useState("");
  const [classroomFeedback, setClassroomFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load next problem based on subject
  const loadProblem = useCallback(async () => {
    setLoadingProblem(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/next-problem?subject=${activeSubject}`, { cache: "no-store" });
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
    } catch {
      setProblem(null);
    } finally {
      setLoadingProblem(false);
    }
  }, [activeSubject]);

  useEffect(() => {
    void loadProblem();
  }, [activeSubject, loadProblem]);

  // Load quests
  const loadQuests = useCallback(async () => {
    setLoadingQuests(true);
    try {
      const res = await fetch("/api/quests");
      if (res.ok) {
        const data = (await res.json()) as { quests: QuestStatus[] };
        setQuests(data.quests);
      }
    } catch {
      console.error("Failed to load quests");
    } finally {
      setLoadingQuests(false);
    }
  }, []);

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = (await res.json()) as { leaderboard: LeaderboardUser[]; currentUserRank: number };
        setLeaderboard(data.leaderboard);
        setUserRank(data.currentUserRank);
      }
    } catch {
      console.error("Failed to load leaderboard");
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  // Load classrooms list
  const loadClassrooms = useCallback(async () => {
    setLoadingClassrooms(true);
    try {
      const res = await fetch("/api/classrooms");
      if (res.ok) {
        const data = (await res.json()) as { classrooms: Classroom[] };
        setClassrooms(data.classrooms);
      }
    } catch {
      console.error("Failed to load classrooms");
    } finally {
      setLoadingClassrooms(false);
    }
  }, []);

  // Fetch data on tab change
  useEffect(() => {
    if (activeTab === "quests") {
      void loadQuests();
    } else if (activeTab === "leaderboard") {
      void loadLeaderboard();
    } else if (activeTab === "classroom") {
      void loadClassrooms();
      setSelectedClassroom(null);
    }
  }, [activeTab, loadQuests, loadLeaderboard, loadClassrooms]);

  // Load specific classroom details
  const viewClassroomDetails = async (id: string) => {
    setLoadingClassroomDetails(true);
    try {
      const res = await fetch(`/api/classrooms/${id}`);
      if (res.ok) {
        const data = (await res.json()) as ClassroomDetails;
        setSelectedClassroom(data);
      }
    } catch {
      console.error("Failed to load classroom details");
    } finally {
      setLoadingClassroomDetails(false);
    }
  };

  // Join Classroom
  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    setClassroomFeedback(null);
    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "join", code: joinCodeInput.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; classroom?: Classroom };
      if (res.ok && data.success) {
        setClassroomFeedback({ type: "success", message: `Successfully joined: ${data.classroom?.name}` });
        setJoinCodeInput("");
        void loadClassrooms();
      } else {
        setClassroomFeedback({ type: "error", message: data.error || "Failed to join classroom" });
      }
    } catch {
      setClassroomFeedback({ type: "error", message: "Failed to connect to the server." });
    }
  };

  // Create Classroom (Teacher Only)
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassNameInput.trim()) return;
    setClassroomFeedback(null);
    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "create", name: newClassNameInput.trim() }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string; classroom?: Classroom };
      if (res.ok && data.success) {
        setClassroomFeedback({ type: "success", message: `Classroom created: ${data.classroom?.name} (Code: ${data.classroom?.code})` });
        setNewClassNameInput("");
        // Ensure user state reflects potential role promotion
        setUser((u) => ({ ...u, role: "teacher" }));
        void loadClassrooms();
      } else {
        setClassroomFeedback({ type: "error", message: data.error || "Failed to create classroom" });
      }
    } catch {
      setClassroomFeedback({ type: "error", message: "Failed to connect to the server." });
    }
  };

  // Toggle user role between Student and Teacher for demonstration
  const handleToggleRole = async () => {
    const nextRole = user.role === "student" ? "teacher" : "student";
    // We can simulate role update via an API call or simply toggle it locally.
    // Let's create an action in database via a classroom POST create which auto-promotes,
    // or just toggle it directly if they make classrooms. Let's do a direct update.
    // Let's call /api/classrooms with a dummy payload or let's create a local role switch.
    // Let's do a direct state switch, and when they load classrooms, they will get what is configured.
    // Wait, to make it permanent, we should update the database. We can write a quick role switch endpoint,
    // or just do a classroom create that promotes. Let's update state, and let them create a class to become teacher officially.
    if (nextRole === "teacher") {
      setUser((u) => ({ ...u, role: "teacher" }));
    } else {
      setUser((u) => ({ ...u, role: "student" }));
    }
    setSelectedClassroom(null);
    setClassroomFeedback(null);
    // Trigger reloading classrooms under the new role context
    setTimeout(() => void loadClassrooms(), 100);
  };

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
          newlyCompletedQuests: { id: string; title: string; xpReward: number }[];
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

        setRecent((rows) =>
          [
            {
              id: Math.random().toString(),
              correct: data.correct,
              timeMs,
              xpAwarded: data.xpAwarded,
              createdAt: new Date().toISOString(),
              problemPrompt: problem.prompt,
              topicName: topicNames[problem.topicId] ?? "",
              ratingAfter: data.ratingAfter,
            },
            ...rows,
          ].slice(0, 10),
        );

        // Build celebratory toast body
        let feedbackBody = data.correct
          ? `+${data.xpAwarded} XP${data.leveledUp ? ` — Level ${data.newLevel}!` : ""}`
          : `Mastery ${data.ratingBefore} → ${data.ratingAfter} (${data.ratingDelta >= 0 ? "+" : ""}${data.ratingDelta}). Try a hint or skip.`;

        if (data.newBadges.length) {
          feedbackBody += `  •  New badge: ${data.newBadges.map((b) => b.name).join(", ")}`;
        }
        if (data.newlyUnlocked.length) {
          feedbackBody += `  •  Unlocked: ${data.newlyUnlocked.map((t) => t.name).join(", ")}`;
        }
        if (data.newlyCompletedQuests && data.newlyCompletedQuests.length > 0) {
          feedbackBody += `  🎉 Quest Completed: ${data.newlyCompletedQuests.map((q) => q.title).join(", ")} (+${data.newlyCompletedQuests.reduce((sum, q) => sum + q.xpReward, 0)} XP)`;
        }

        setFeedback({
          kind: data.correct ? "success" : "failure",
          title: data.correct ? "Correct!" : "Not quite",
          body: feedbackBody,
          xpBreakdown: data.xpBreakdown,
        });

        // Trigger loading the next problem
        setProblem(null);
      } finally {
        setSubmitting(false);
      }
    },
    [problem, topicNames],
  );

  const headline = useMemo(() => {
    return `${user.displayName} — Level ${user.level} (${user.role.toUpperCase()})`;
  }, [user.displayName, user.level, user.role]);

  // Filter topics for the active subject
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => t.subject === activeSubject);
  }, [topics, activeSubject]);

  // Heatmap helper for cell colors based on ELO rating
  const getHeatmapColor = (rating: number) => {
    if (rating < 900) return "bg-red-500/20 text-red-400 border border-red-500/20";
    if (rating < 1000) return "bg-orange-500/20 text-orange-400 border border-orange-500/20";
    if (rating < 1100) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20";
    if (rating < 1350) return "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30";
    return "bg-cyan-500/40 text-cyan-200 border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]";
  };

  return (
    <main className="space-y-6">
      {/* HEADER SECTION */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent2 via-accent to-purple-400 bg-clip-text text-transparent">
            Questline
          </h1>
          <p className="text-sm text-muted mt-1 font-medium">{headline}</p>
        </div>
        <div className="flex items-center gap-3">
          <StreakBadge current={user.currentStreak} longest={user.longestStreak} freezes={user.freezesAvailable} />
        </div>
      </header>

      {/* XP BAR CARD */}
      <section className="card">
        <XpBar totalXp={user.totalXp} level={user.level} />
      </section>

      {/* NAVIGATION TABS */}
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("learn")}
          className={activeTab === "learn" ? "btn-tab-active" : "btn-tab-inactive"}
        >
          🎮 Learn
        </button>
        <button
          onClick={() => setActiveTab("quests")}
          className={activeTab === "quests" ? "btn-tab-active" : "btn-tab-inactive"}
        >
          🎯 Quests
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={activeTab === "leaderboard" ? "btn-tab-active" : "btn-tab-inactive"}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => setActiveTab("classroom")}
          className={activeTab === "classroom" ? "btn-tab-active" : "btn-tab-inactive"}
        >
          🏫 Classroom
        </button>
      </nav>

      {/* TAB CONTENT SECTIONS */}
      {activeTab === "learn" && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* PROBLEM SIDE */}
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
              <div className="card flex flex-col items-center justify-center py-16 text-center space-y-4">
                <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                <div>
                  <p className="text-base font-semibold text-text">Serving up a fresh challenge…</p>
                  <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                    Selecting a topic and difficulty matching your current mastery.
                  </p>
                </div>
                <button className="btn-secondary mt-2" onClick={() => void loadProblem()}>
                  ⚡ Skip / Next
                </button>
              </div>
            )}
            {feedback && <FeedbackToast feedback={feedback} onDismiss={() => setFeedback(null)} />}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-4">
            {/* SUBJECT SELECTOR */}
            <div className="card p-4">
              <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">ACTIVE SUBJECT</h2>
              <div className="grid grid-cols-2 gap-2 mt-3 bg-black/45 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveSubject("math")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    activeSubject === "math" ? "bg-accent text-white shadow-sm" : "text-muted hover:text-text"
                  }`}
                >
                  📐 Mathematics
                </button>
                <button
                  onClick={() => setActiveSubject("computer_science")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    activeSubject === "computer_science" ? "bg-accent2 text-black shadow-sm" : "text-muted hover:text-text"
                  }`}
                >
                  💻 Comp Sci
                </button>
              </div>
            </div>

            <TopicMap topics={filteredTopics} topicNames={topicNames} topicSlugs={topicSlugs} />
            <BadgeCase badges={badges} />
            <RecentFeed rows={recent} />
          </aside>
        </section>
      )}

      {activeTab === "quests" && (
        <section className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-bold tracking-tight text-text">Daily & Weekly Challenges</h2>
            <p className="text-sm text-muted mt-1">Complete tasks to earn bonus XP and level up faster.</p>

            {loadingQuests ? (
              <div className="py-12 text-center text-muted">Loading active quests…</div>
            ) : quests.length === 0 ? (
              <div className="py-12 text-center text-muted">No active quests found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {quests.map((q) => (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      q.completed
                        ? "bg-good/10 border-good/30"
                        : "bg-white/5 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`chip text-[10px] font-bold uppercase tracking-wider ${
                            q.completed ? "bg-good/20 text-good border-good/20" : "bg-accent/20 text-accent border-accent/20"
                          }`}
                        >
                          {q.type === "problems_solved" || q.type === "xp_earned" ? "Daily" : "Weekly"}
                        </span>
                        <h3 className="font-bold text-base mt-2 text-text">{q.title}</h3>
                        <p className="text-xs text-muted mt-1 leading-normal">{q.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-accent text-sm bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
                          +{q.xpReward} XP
                        </span>
                      </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="mt-5">
                      <div className="flex justify-between text-xs font-semibold text-muted mb-1.5">
                        <span>Progress</span>
                        <span>
                          {q.progress} / {q.targetValue}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            q.completed ? "bg-good" : "bg-accent"
                          }`}
                          style={{ width: `${(q.progress / q.targetValue) * 100}%` }}
                        />
                      </div>
                    </div>

                    {q.completed && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-good font-bold">
                        <span>✓ Completed</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "leaderboard" && (
        <section className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-bold tracking-tight text-text">Global Leaderboard</h2>
            <p className="text-sm text-muted mt-1">Compete against other learners and claim the top spots.</p>

            {loadingLeaderboard ? (
              <div className="py-12 text-center text-muted">Loading ranking table…</div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center text-muted">No students registered on the leaderboard.</div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-black/25">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-xs font-bold text-muted uppercase">
                      <th className="p-4 w-16 text-center">Rank</th>
                      <th className="p-4">Learner</th>
                      <th className="p-4 text-center">Level</th>
                      <th className="p-4 text-center">Streak</th>
                      <th className="p-4 text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {leaderboard.map((item, index) => {
                      const isSelf = item.id === user.id;
                      const rank = index + 1;
                      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelf
                              ? "bg-accent/15 border-y border-accent/30 font-semibold"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <td className="p-4 text-center font-bold text-base">{medal}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="text-text">{item.displayName}</span>
                              <span className="text-xs text-muted">@{item.username}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent border border-accent/20 px-1.5 py-0.5 rounded-md">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">{item.level}</td>
                          <td className="p-4 text-center">🔥 {item.currentStreak}d</td>
                          <td className="p-4 text-right font-extrabold text-text">
                            {item.totalXp.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === "classroom" && (
        <section className="space-y-6">
          {/* TOP CONTROLS: Switch role and Join/Create forms */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold tracking-tight text-text">Classroom Dashboard</h2>
                  <button onClick={() => void handleToggleRole()} className="btn-secondary py-1.5 px-3 text-xs font-bold">
                    🔄 Switch to {user.role === "student" ? "Teacher" : "Student"} View
                  </button>
                </div>
                <p className="text-sm text-muted mt-1 leading-normal">
                  {user.role === "student"
                    ? "Join a class to share your learning progress, XP, and badges with your teacher."
                    : "Create classrooms, invite students, and analyze their mastery heatmaps to see where they excel or struggle."}
                </p>
              </div>

              {classroomFeedback && (
                <div
                  className={`mt-4 p-3 rounded-xl border text-xs ${
                    classroomFeedback.type === "success" ? "bg-good/10 border-good/25 text-good" : "bg-bad/10 border-bad/25 text-bad"
                  }`}
                >
                  {classroomFeedback.message}
                </div>
              )}
            </div>

            <div className="card">
              {user.role === "student" ? (
                <form onSubmit={handleJoinClassroom} className="space-y-3">
                  <h3 className="font-bold text-sm text-text">Join a Classroom</h3>
                  <p className="text-xs text-muted">Enter the 6-character code provided by your teacher.</p>
                  <input
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    placeholder="e.g. CAMP26"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-center text-sm font-bold uppercase tracking-wider outline-none focus:border-accent"
                  />
                  <button type="submit" className="w-full btn-primary py-2 text-xs">
                    🤝 Join Classroom
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateClassroom} className="space-y-3">
                  <h3 className="font-bold text-sm text-text">Create New Classroom</h3>
                  <p className="text-xs text-muted">Establish a class group and generate a student invitation code.</p>
                  <input
                    value={newClassNameInput}
                    onChange={(e) => setNewClassNameInput(e.target.value)}
                    placeholder="e.g. Intro to Algebra"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <button type="submit" className="w-full btn-primary py-2 text-xs">
                    ➕ Create Classroom
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* MAIN CLASSROOM LIST & DETAILS SCREEN */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* CLASSES LIST */}
            <div className="lg:col-span-1 card p-4 space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase">YOUR CLASSROOMS</h3>
              {loadingClassrooms ? (
                <div className="py-6 text-center text-xs text-muted">Loading classes…</div>
              ) : classrooms.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  {user.role === "student" ? "You haven't joined any classes." : "You haven't created any classes."}
                </div>
              ) : (
                <ul className="space-y-2">
                  {classrooms.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => void viewClassroomDetails(c.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-sm font-medium ${
                          selectedClassroom?.classroom.id === c.id
                            ? "bg-accent/15 border-accent/40 text-accent font-semibold shadow-sm shadow-accent/5"
                            : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        <p className="truncate text-text font-bold">{c.name}</p>
                        <div className="flex items-center justify-between text-[11px] text-muted mt-1.5">
                          <span>Code: {c.code}</span>
                          {user.role === "student" && <span>Tchr: {c.teacherName}</span>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DETAILS CONTAINER */}
            <div className="lg:col-span-3 card">
              {loadingClassroomDetails ? (
                <div className="py-24 text-center text-muted flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Fetching student reports & heatmap…</span>
                </div>
              ) : selectedClassroom ? (
                <div className="space-y-6">
                  {/* Class Meta Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-3">
                    <div>
                      <h3 className="text-xl font-black text-text">{selectedClassroom.classroom.name}</h3>
                      <p className="text-xs text-muted mt-1">
                        Teacher: {selectedClassroom.classroom.teacherName} • Code:{" "}
                        <span className="font-bold text-accent">{selectedClassroom.classroom.code}</span>
                      </p>
                    </div>
                    <span className="chip self-start sm:self-center font-bold px-3 py-1 bg-white/5 text-text">
                      👥 {selectedClassroom.students.length} Student{selectedClassroom.students.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Student Leaderboard/List for Class */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold text-muted">Classmates Rank</h4>
                    <div className="overflow-hidden rounded-xl border border-white/5 bg-black/15 text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/5 font-semibold text-muted text-[10px] uppercase border-b border-white/5">
                            <th className="p-3 w-12 text-center">Rank</th>
                            <th className="p-3">Student</th>
                            <th className="p-3 text-center">Level</th>
                            <th className="p-3 text-center">Streak</th>
                            <th className="p-3 text-right">XP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {selectedClassroom.students
                            .sort((a, b) => b.totalXp - a.totalXp)
                            .map((student, i) => (
                              <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 text-center font-bold">{i + 1}</td>
                                <td className="p-3">
                                  <span className="font-bold text-text">{student.displayName}</span>{" "}
                                  <span className="text-[10px] text-muted">@{student.username}</span>
                                </td>
                                <td className="p-3 text-center">{student.level}</td>
                                <td className="p-3 text-center">🔥 {student.currentStreak}d</td>
                                <td className="p-3 text-right font-bold text-text">
                                  {student.totalXp.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Classroom Heatmap Grid (Teacher Dashboard Extraordinaire) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-muted">Mastery Skill Heatmap</h4>
                      <div className="flex gap-2 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-red-500/20 border border-red-500/20"></span> &lt;900
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-yellow-500/20 border border-yellow-500/20"></span> 900-1100
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-emerald-500/30 border border-emerald-500/30"></span> 1100-1350
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-cyan-500/40 border border-cyan-400/40"></span> 1350+
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/15 p-4">
                      {selectedClassroom.students.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted">No students enrolled yet.</div>
                      ) : (
                        <div className="min-w-[700px] space-y-2 text-xs">
                          {/* Grid Columns Header */}
                          <div className="grid grid-cols-6 gap-2 border-b border-white/5 pb-2 font-bold text-muted text-[10px] uppercase">
                            <span className="col-span-2">Student</span>
                            <span className="text-center truncate">{selectedClassroom.topics[0]?.name || "L1"}</span>
                            <span className="text-center truncate">{selectedClassroom.topics[1]?.name || "L2"}</span>
                            <span className="text-center truncate">{selectedClassroom.topics[2]?.name || "L3"}</span>
                            <span className="text-center truncate">{selectedClassroom.topics[3]?.name || "L4"}</span>
                          </div>

                          {/* Student Rows */}
                          {selectedClassroom.students.map((student) => (
                            <div key={student.id} className="grid grid-cols-6 gap-2 items-center hover:bg-white/5 p-1 rounded-lg transition-colors">
                              <span className="col-span-2 font-bold text-text truncate">{student.displayName}</span>
                              {selectedClassroom.topics.slice(0, 4).map((topic) => {
                                const rating = student.mastery[topic.id] ?? topic.baseRating;
                                return (
                                  <div
                                    key={topic.id}
                                    className={`heatmap-cell flex items-center justify-center p-2 font-extrabold text-[10px] text-center rounded-lg ${getHeatmapColor(
                                      rating,
                                    )}`}
                                    title={`${topic.name}: ${rating}`}
                                  >
                                    {rating}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-muted flex flex-col items-center justify-center space-y-2">
                  <div className="text-4xl">📚</div>
                  <h4 className="font-bold text-base text-text">Classroom Report View</h4>
                  <p className="text-xs text-muted max-w-xs leading-normal">
                    Select a classroom from the left-hand sidebar to inspect enrolled student analytics, XP leaderboard,
                    and skill mastery heatmaps.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
