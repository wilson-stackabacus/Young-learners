"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import XpBar from "@/components/XpBar";
import StreakBadge from "@/components/StreakBadge";
import type { LevelState, MapResponse, Problem, Stats, WorldId, WorldMeta, BossState, ProblemResponse, AnswerResponse } from "@/shared/contract";

export interface UserState {
  id: string;
  username: string;
  displayName: string;
  role: string;
  totalXp: number;
  level: number; // calculated from XP
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
}

export interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  tier: string;
  owned: boolean;
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
    mastery: Record<string, number>; // stage -> progress
  }[];
  topics: {
    id: string;
    name: string;
    slug: string;
    subject: string;
    baseRating: number;
  }[];
}

const WORLD_COLOR: Record<WorldId, string> = {
  arithmetic: "from-cyan-500 to-blue-500",
  integers: "from-purple-500 to-indigo-500",
  "pre-algebra": "from-amber-500 to-orange-500",
  "algebra-1": "from-rose-500 to-pink-500",
};

const WORLD_ICON: Record<WorldId, string> = {
  arithmetic: "📐",
  integers: "➖",
  "pre-algebra": "✖️",
  "algebra-1": "🔥",
};

const NODE_THEME = {
  locked: { bg: "bg-white/5 border-white/10 text-muted", color: "text-muted" },
  current: { bg: "bg-accent border-accent/50 text-white shadow-[0_0_15px_rgba(124,92,255,0.4)] animate-pulse", color: "text-white" },
  cleared: { bg: "bg-accent2 border-accent2/50 text-black shadow-[0_0_10px_rgba(34,211,238,0.2)]", color: "text-accent2" },
};

export default function HomeClient() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<"learn" | "quests" | "leaderboard" | "classroom">("learn");

  // User summary & Map state
  const [mapData, setMapData] = useState<MapResponse | null>(null);
  const [loadingMap, setLoadingMap] = useState(true);

  // Active play level state
  const [view, setView] = useState<"map" | "play">("map");
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelState | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bossState, setBossState] = useState<BossState | null>(null);
  const [loadingPlay, setLoadingPlay] = useState(false);

  // Answering states
  const [inputAnswer, setInputAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    state: "hint" | "solved" | "revealed";
    hint?: string;
    solution?: string;
  } | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [progressDelta, setProgressDelta] = useState<number | null>(null);

  // Expanded Features states
  const [quests, setQuests] = useState<QuestStatus[]>([]);
  const [loadingQuests, setLoadingQuests] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomDetails | null>(null);
  const [loadingClassroomDetails, setLoadingClassroomDetails] = useState(false);

  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [newClassNameInput, setNewClassNameInput] = useState("");
  const [classroomFeedback, setClassroomFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Mock roles locally for testing student/teacher views easily
  const [localRole, setLocalRole] = useState<string>("student");

  // Fetch me & map data on mount
  const loadMap = useCallback(async () => {
    setLoadingMap(true);
    try {
      const res = await fetch("/api/map", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as MapResponse;
        setMapData(data);
      }
    } catch (e) {
      console.error("Failed to load map data", e);
    } finally {
      setLoadingMap(false);
    }
  }, []);

  useEffect(() => {
    void loadMap();
  }, [loadMap]);

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

  // Sync tab data
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

  // Open a level to play
  const openLevel = async (stage: number) => {
    setLoadingPlay(true);
    setFeedback(null);
    setInputAnswer("");
    setXpGained(null);
    setProgressDelta(null);
    try {
      const res = await fetch(`/api/levels/${stage}/problem`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as ProblemResponse;
        setLevelInfo(data.level as LevelState);
        setProblem(data.problem);
        setStats(data.stats);
        setBossState(data.boss || null);
        setAttemptsRemaining(data.boss ? 1 : 2); // default hints remaining
        setActiveStage(stage);
        setView("play");
      }
    } catch (e) {
      console.error("Failed to load problem", e);
    } finally {
      setLoadingPlay(false);
    }
  };

  const backToMap = () => {
    setView("map");
    setActiveStage(null);
    setLevelInfo(null);
    setProblem(null);
    setStats(null);
    setBossState(null);
    setFeedback(null);
    void loadMap(); // reload map to reflect progress
  };

  // Submit Answer
  const handleAnswerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!problem || !inputAnswer.trim() || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/levels/${problem.stage}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: problem.token, answer: inputAnswer.trim() }),
      });
      if (res.ok) {
        const data = (await res.json()) as AnswerResponse;
        setFeedback({
          correct: data.correct,
          state: data.state,
          hint: data.hint,
          solution: data.solution,
        });
        setStats(data.stats);
        setBossState(data.boss || null);
        setAttemptsRemaining(data.attemptsRemaining);
        setXpGained(data.stats.xpGained);
        setProgressDelta(data.stats.progressDelta);

        // Update overall user XP in main map header state if loaded
        if (mapData) {
          setMapData({
            ...mapData,
            user: {
              ...mapData.user,
              totalXp: data.stats.totalXp,
              streakDays: data.stats.streakDays,
            },
          });
        }

        // If solved or revealed, clear input
        if (data.state === "solved" || data.state === "revealed") {
          setInputAnswer("");
        }
      }
    } catch (err) {
      console.error("Submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Move to next problem
  const handleNextProblem = async () => {
    if (!activeStage) return;
    setFeedback(null);
    setInputAnswer("");
    setXpGained(null);
    setProgressDelta(null);
    setLoadingPlay(true);
    try {
      const res = await fetch(`/api/levels/${activeStage}/problem`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as ProblemResponse;
        setLevelInfo(data.level as LevelState);
        setProblem(data.problem);
        setStats(data.stats);
        setBossState(data.boss || null);
        setAttemptsRemaining(data.boss ? 1 : 2);
      }
    } catch (e) {
      console.error("Failed to load next problem", e);
    } finally {
      setLoadingPlay(false);
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

  // Create Classroom
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
        setLocalRole("teacher");
        void loadClassrooms();
      } else {
        setClassroomFeedback({ type: "error", message: data.error || "Failed to create classroom" });
      }
    } catch {
      setClassroomFeedback({ type: "error", message: "Failed to connect to the server." });
    }
  };

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

  // Toggle local role for testing
  const handleToggleRole = () => {
    const nextRole = localRole === "student" ? "teacher" : "student";
    setLocalRole(nextRole);
    setSelectedClassroom(null);
    setClassroomFeedback(null);
    // Reload classrooms list
    setTimeout(() => void loadClassrooms(), 50);
  };

  // Render Medal or Rank
  const renderRankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `${rank}`;
  };

  // Map ELO or levels progress color for Classroom Heatmap cells
  const getProgressColor = (progress: number) => {
    if (progress === 0) return "bg-white/5 text-muted border border-white/5";
    if (progress < 40) return "bg-orange-500/20 text-orange-400 border border-orange-500/20";
    if (progress < 80) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20";
    if (progress < 100) return "bg-emerald-500/30 text-emerald-300 border border-emerald-500/30";
    return "bg-cyan-500/40 text-cyan-200 border border-cyan-400/40 shadow-[0_0_8px_rgba(34,211,238,0.2)]";
  };

  // Calculate dynamic level from total XP
  const calculateLevel = (totalXp: number) => {
    // simple XP formula matching seed stats
    return Math.floor(Math.sqrt(totalXp / 25)) + 1;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SUMMARY BAR */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-accent2 via-accent to-purple-400 bg-clip-text text-transparent">
            Questline
          </h1>
          {mapData && (
            <p className="text-sm text-muted mt-1 font-medium">
              {mapData.user.displayName || "Demo Learner"} — Level {calculateLevel(mapData.user.totalXp)}
            </p>
          )}
        </div>
        {mapData && (
          <div className="flex items-center gap-3">
            <StreakBadge
              current={mapData.user.streakDays}
              longest={mapData.user.streakDays + 3}
              freezes={2}
            />
          </div>
        )}
      </header>

      {/* XP BAR CARD */}
      {mapData && (
        <section className="card">
          <XpBar totalXp={mapData.user.totalXp} level={calculateLevel(mapData.user.totalXp)} />
        </section>
      )}

      {/* NAVIGATION TABS */}
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab("learn")}
          className={activeTab === "learn" ? "btn-tab-active" : "btn-tab-inactive"}
        >
          🎮 Learn Map
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

      {/* LEARN TAB */}
      {activeTab === "learn" && (
        <section className="space-y-6">
          {loadingMap ? (
            <div className="py-24 text-center text-muted flex flex-col items-center justify-center space-y-3">
              <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              <span>Loading your learning ladder…</span>
            </div>
          ) : view === "play" && levelInfo && problem ? (
            /* PLAY MODE */
            <div className="card max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <button onClick={backToMap} className="btn-secondary py-1.5 px-3 text-xs">
                  ← Back to map
                </button>
                <span className="text-xs text-muted">Stage {levelInfo.stage}</span>
              </div>

              {/* Title Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`chip bg-gradient-to-r ${WORLD_COLOR[levelInfo.world]} text-white font-extrabold uppercase border-none`}>
                  {levelInfo.world}
                </span>
                <h2 className="text-xl font-bold text-text">
                  {levelInfo.skillNames.join(" + ")}
                </h2>
              </div>

              {/* Progress Bar (Practice Mode only) */}
              {stats && !levelInfo.isBoss && (
                <div className="space-y-1 bg-black/35 p-3.5 rounded-2xl border border-white/5">
                  <div className="flex justify-between text-xs font-semibold text-muted">
                    <span>Stage Progress</span>
                    <span>
                      {stats.progress}% · Accuracy {Math.round(stats.accuracy * 100)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent to-accent2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Boss Mode indicators */}
              {levelInfo.isBoss && bossState && (
                <div className="flex justify-between gap-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-bold text-rose-300">
                  <span>👿 BOSS GATE BATTLE</span>
                  <span>❤️ Hearts: {bossState.hearts} · HP: {bossState.hp}</span>
                </div>
              )}

              {/* Problem Prompt Display */}
              <div className="py-10 text-center">
                <p className="text-3xl font-extrabold tracking-wide text-text bg-gradient-to-r from-white via-text to-white/70 bg-clip-text text-transparent">
                  {problem.prompt}
                </p>
              </div>

              {/* Answer Inputs */}
              {problem.inputType === "multiple-choice" && problem.choices ? (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {problem.choices.map((c) => (
                    <button
                      key={c.id}
                      disabled={submitting || (!!feedback && feedback.state !== "hint")}
                      onClick={() => {
                        setInputAnswer(c.id);
                        void handleAnswerSubmit();
                      }}
                      className="btn-secondary py-3.5 justify-start text-left font-bold"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleAnswerSubmit} className="flex gap-2">
                  <input
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    placeholder={problem.inputType === "fraction" ? "e.g. 5/6" : "Your answer"}
                    disabled={submitting || (!!feedback && feedback.state !== "hint")}
                    className="flex-1 rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-base outline-none focus:border-accent font-medium"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={submitting || !inputAnswer}
                    className="btn-primary px-6"
                  >
                    {submitting ? "Checking…" : "Submit"}
                  </button>
                </form>
              )}

              {/* Hints Remaining */}
              {!feedback && (
                <p className="text-xs text-muted mt-1">
                  💡 {attemptsRemaining} hint{attemptsRemaining === 1 ? "" : "s"} before the worked solution.
                </p>
              )}

              {/* Feedback responses */}
              {feedback && (
                <div className="space-y-4">
                  {feedback.state === "hint" && (
                    <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/10 text-sm text-amber-200">
                      💡 <b>Hint:</b> {feedback.hint}
                    </div>
                  )}

                  {feedback.state === "solved" && (
                    <div className="p-4 rounded-xl border border-good/25 bg-good/10 text-sm text-good">
                      <div className="font-extrabold text-base">✅ Correct! {xpGained && `+${xpGained} XP`}</div>
                      {progressDelta && progressDelta !== 0 && (
                        <div className="text-xs text-muted mt-1">
                          Progress {progressDelta > 0 ? "+" : ""}{progressDelta}%
                        </div>
                      )}
                      <button onClick={handleNextProblem} className="btn-primary mt-3 text-xs">
                        Next Problem →
                      </button>
                    </div>
                  )}

                  {feedback.state === "revealed" && (
                    <div className="p-4 rounded-xl border border-bad/25 bg-bad/10 text-sm text-rose-300">
                      <div className="font-bold">Out of hints! Worked Solution:</div>
                      <div className="font-semibold text-text mt-2 bg-black/35 p-3 rounded-lg border border-white/5">
                        {feedback.solution}
                      </div>
                      <button onClick={handleNextProblem} className="btn-primary mt-3 text-xs">
                        Next Problem →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* MAP MODE */
            <div className="space-y-4">
              <div className="card">
                <h3 className="text-lg font-bold text-text">Practice Ladder</h3>
                <p className="text-xs text-muted">
                  Tap your current green 🟢 level node or any cleared 🟡 level nodes to practice. Scroll horizontally.
                </p>
                <div className="mt-4 overflow-x-auto overflow-y-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-accent/5 to-accent2/5 p-4">
                  <div className="flex items-center gap-4 h-48 py-2 min-w-max">
                    {mapData?.levels.map((l, idx) => {
                      const theme = NODE_THEME[l.status] || NODE_THEME.locked;
                      const offsetTop = 40 + Math.sin(idx * 0.55) * 32;
                      const clickable = l.status !== "locked";

                      return (
                        <div key={l.stage} className="relative w-16 h-36 flex-shrink-0">
                          <button
                            onClick={() => clickable && void openLevel(l.stage)}
                            disabled={!clickable}
                            style={{ top: `${offsetTop}px` }}
                            className={`absolute left-2 h-12 w-12 rounded-full border-2 flex items-center justify-center text-xs font-extrabold transition-all duration-200 active:scale-90 ${
                              clickable ? "cursor-pointer" : "cursor-default opacity-50"
                            } ${theme.bg}`}
                            title={`Stage ${l.stage}: ${l.skillNames.join(" + ")}`}
                          >
                            {l.status === "locked" ? "🔒" : l.stage}
                          </button>
                          {l.status === "cleared" && (
                            <div
                              style={{ top: `${offsetTop + 52}px` }}
                              className="absolute left-0 w-16 text-center text-[9px] text-yellow-400 font-bold"
                            >
                              {"★".repeat(l.stars)}{"☆".repeat(3 - l.stars)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* QUESTS TAB */}
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

      {/* LEADERBOARD TAB */}
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
                      const isSelf = mapData?.user && item.id === mapData.user.id;
                      const rank = index + 1;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isSelf
                              ? "bg-accent/15 border-y border-accent/30 font-semibold"
                              : "hover:bg-white/5"
                          }`}
                        >
                          <td className="p-4 text-center font-bold text-base">{renderRankMedal(rank)}</td>
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

      {/* CLASSROOM TAB */}
      {activeTab === "classroom" && (
        <section className="space-y-6">
          {/* Controls Panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold tracking-tight text-text">Classroom Hub</h2>
                  <button onClick={handleToggleRole} className="btn-secondary py-1.5 px-3 text-xs font-bold">
                    🔄 Switch to {localRole === "student" ? "Teacher" : "Student"} View
                  </button>
                </div>
                <p className="text-sm text-muted mt-2 leading-normal">
                  {localRole === "student"
                    ? "Link with your classmates! Enter a teacher's classroom code to join."
                    : "Create classrooms and monitor student progress bars to view classroom Heatmaps."}
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
              {localRole === "student" ? (
                <form onSubmit={handleJoinClassroom} className="space-y-3">
                  <h3 className="font-bold text-sm text-text">Join a Classroom</h3>
                  <p className="text-xs text-muted">Enter the 6-character code (e.g. CAMP26).</p>
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
                  <h3 className="font-bold text-sm text-text">Create Classroom</h3>
                  <p className="text-xs text-muted">Generate a code to invite students.</p>
                  <input
                    value={newClassNameInput}
                    onChange={(e) => setNewClassNameInput(e.target.value)}
                    placeholder="e.g. Ms. Jane's Algebra"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                  <button type="submit" className="w-full btn-primary py-2 text-xs">
                    ➕ Create Classroom
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Classroom list & stats reports */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 card p-4 space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-muted uppercase">YOUR CLASSROOMS</h3>
              {loadingClassrooms ? (
                <div className="py-6 text-center text-xs text-muted">Loading classrooms…</div>
              ) : classrooms.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">No classrooms found.</div>
              ) : (
                <ul className="space-y-2">
                  {classrooms.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => void viewClassroomDetails(c.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all text-sm font-medium ${
                          selectedClassroom?.classroom.id === c.id
                            ? "bg-accent/15 border-accent/40 text-accent font-semibold shadow-sm"
                            : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
                      >
                        <p className="truncate text-text font-bold">{c.name}</p>
                        <div className="flex items-center justify-between text-[11px] text-muted mt-1.5">
                          <span>Code: {c.code}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="lg:col-span-3 card">
              {loadingClassroomDetails ? (
                <div className="py-24 text-center text-muted flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <span>Fetching reports & heatmap…</span>
                </div>
              ) : selectedClassroom ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-3">
                    <div>
                      <h3 className="text-xl font-black text-text">{selectedClassroom.classroom.name}</h3>
                      <p className="text-xs text-muted mt-1">
                        Teacher: {selectedClassroom.classroom.teacherName} · Code:{" "}
                        <span className="font-bold text-accent">{selectedClassroom.classroom.code}</span>
                      </p>
                    </div>
                    <span className="chip px-3 py-1 bg-white/5 text-text">
                      👥 {selectedClassroom.students.length} Student{selectedClassroom.students.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {/* Student rankings for classroom */}
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

                  {/* Level Progress Heatmap for Classroom (showing stages 1 to 5) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-muted">Ladder Stages Progress Heatmap</h4>
                      <div className="flex gap-2 text-[10px] font-bold">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-white/5 border border-white/5"></span> locked
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-orange-500/20 border border-orange-500/20"></span> &lt;40%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-yellow-500/20 border border-yellow-500/20"></span> 40-80%
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-cyan-500/40 border border-cyan-400/40"></span> cleared
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/15 p-4">
                      {selectedClassroom.students.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted">No students enrolled yet.</div>
                      ) : (
                        <div className="min-w-[600px] space-y-2 text-xs">
                          {/* Column Headers */}
                          <div className="grid grid-cols-7 gap-2 border-b border-white/5 pb-2 font-bold text-muted text-[10px] uppercase">
                            <span className="col-span-2">Student</span>
                            <span className="text-center">Stage 1</span>
                            <span className="text-center">Stage 2</span>
                            <span className="text-center">Stage 3</span>
                            <span className="text-center">Stage 4</span>
                            <span className="text-center">Stage 5</span>
                          </div>

                          {/* Rows */}
                          {selectedClassroom.students.map((student) => (
                            <div key={student.id} className="grid grid-cols-7 gap-2 items-center hover:bg-white/5 p-1 rounded-lg transition-colors">
                              <span className="col-span-2 font-bold text-text truncate">{student.displayName}</span>
                              {[1, 2, 3, 4, 5].map((stage) => {
                                // Default progress is 0 if no progress seeded
                                const progress = student.mastery[String(stage)] ?? 0;
                                return (
                                  <div
                                    key={stage}
                                    className={`heatmap-cell flex items-center justify-center p-2 font-extrabold text-[10px] text-center rounded-lg ${getProgressColor(
                                      progress,
                                    )}`}
                                    title={`Stage ${stage}: ${progress}% progress`}
                                  >
                                    {progress === 100 ? "Cleared" : `${progress}%`}
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
                  <h4 className="font-bold text-base text-text">Reports View</h4>
                  <p className="text-xs text-muted max-w-xs leading-normal">
                    Select a classroom from the sidebar to inspect enrolled student rankings and level progress heatmaps.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
