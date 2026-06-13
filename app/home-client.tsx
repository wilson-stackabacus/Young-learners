"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AnswerResponse,
  LevelInfo,
  LevelState,
  MapResponse,
  Problem,
  ProblemResponse,
  Stats,
  WorldId,
} from "@/shared/contract";

const WORLD_COLOR: Record<WorldId, string> = {
  arithmetic: "#4f9e30",
  integers: "#cf963f",
  "pre-algebra": "#3a7bd0",
  "algebra-1": "#6354b0",
};
const WORLD_ICON: Record<WorldId, string> = {
  arithmetic: "🌱",
  integers: "🍂",
  "pre-algebra": "⛰️",
  "algebra-1": "🚀",
};
const NODE = {
  cleared: { bg: "#f5a623", color: "#5c3500", border: "#d98e00" },
  current: { bg: "#36a636", color: "#ffffff", border: "#2c8a2c" },
  locked: { bg: "#cdcdcd", color: "#ffffff", border: "#b3b3b3" },
} as const;

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json() as Promise<T>;
}
async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json() as Promise<T>;
}

function levelTitle(l: LevelInfo): string {
  return l.kind === "pure"
    ? `${l.skillNames[0]}`
    : `${l.skillNames[0]} + ${l.skillNames[1]}`;
}
function diffLabel(l: LevelInfo): string {
  return Number.isInteger(l.difficulty) ? `Lv ${l.difficulty}` : `Lv ${Math.floor(l.difficulty)}½`;
}

export default function HomeClient() {
  const [map, setMap] = useState<MapResponse | null>(null);
  const [view, setView] = useState<"map" | "play">("map");
  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<
    { kind: "hint" | "correct" | "revealed"; text?: string; solution?: string } | null
  >(null);
  const [pendingNext, setPendingNext] = useState<Problem | null>(null);
  const [advanceStage, setAdvanceStage] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [lastGain, setLastGain] = useState(0);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadMap = useCallback(async () => {
    setMap(await getJSON<MapResponse>("/api/map"));
  }, []);

  useEffect(() => {
    loadMap().catch(console.error);
  }, [loadMap]);

  const openLevel = useCallback(async (stage: number) => {
    setBusy(true);
    try {
      const res = await getJSON<ProblemResponse>(`/api/levels/${stage}/problem`);
      setLevel(res.level);
      setProblem(res.problem);
      setStats(res.stats);
      setFeedback(null);
      setPendingNext(null);
      setAdvanceStage(null);
      setInput("");
      setAttemptsRemaining(2);
      setView("play");
      setToast(null);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }, []);

  const submit = useCallback(
    async (answer: string) => {
      if (!problem || busy || !answer.trim()) return;
      setBusy(true);
      try {
        const res = await postJSON<AnswerResponse>(`/api/levels/${problem.stage}/answer`, {
          token: problem.token,
          answer,
        });
        setStats(res.stats);
        if (res.state === "hint") {
          setFeedback({ kind: "hint", text: res.hint });
          setAttemptsRemaining(res.attemptsRemaining);
          setInput("");
        } else {
          setFeedback({
            kind: res.state === "solved" ? "correct" : "revealed",
            solution: res.solution,
          });
          setPendingNext(res.nextProblem ?? null);
          setAdvanceStage(res.advanced?.toStage ?? null);
          setLastGain(res.stats.xpGained);
          if (res.advanced) setToast(`Level cleared — stage ${res.advanced.toStage} unlocked! 🎉`);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setBusy(false);
      }
    },
    [problem, busy],
  );

  const next = useCallback(() => {
    if (advanceStage) {
      void openLevel(advanceStage);
      return;
    }
    if (pendingNext) {
      setProblem(pendingNext);
      setPendingNext(null);
      setFeedback(null);
      setInput("");
      setAttemptsRemaining(2);
    }
  }, [advanceStage, pendingNext, openLevel]);

  const backToMap = useCallback(async () => {
    await loadMap();
    setView("map");
    setToast(null);
  }, [loadMap]);

  if (!map) return <p style={{ color: "#667" }}>Loading…</p>;

  // ── Header ──
  const header = (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>🎯 Questline</h1>
      <div style={{ display: "flex", gap: 14, marginLeft: "auto", fontSize: 14, color: "#445" }}>
        <span>⭐ {(stats?.totalXp ?? map.user.totalXp).toLocaleString()} XP</span>
        <span>🔥 {map.user.streakDays}-day streak</span>
        <span>📍 Stage {map.user.currentStage}/225</span>
      </div>
    </div>
  );

  if (view === "play" && level && problem) {
    return (
      <div>
        {header}
        <button onClick={backToMap} style={btnGhost}>← Back to map</button>

        <div style={{ ...card, marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ ...chip, background: WORLD_COLOR[level.world] }}>{diffLabel(level)}</span>
            <h2 style={{ margin: 0, fontSize: 18 }}>
              Stage {level.stage} · {levelTitle(level)}
            </h2>
          </div>

          {stats && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#667" }}>
                <span>Progress</span>
                <span>{stats.progress}% · accuracy {Math.round(stats.accuracy * 100)}%</span>
              </div>
              <div style={barOuter}>
                <div style={{ ...barInner, width: `${stats.progress}%` }} />
              </div>
            </div>
          )}

          <div style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "26px 0", letterSpacing: 0.5 }}>
            {problem.prompt}
          </div>

          {problem.inputType === "multiple-choice" && problem.choices ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {problem.choices.map((c) => (
                <button key={c.id} disabled={busy || (!!feedback && feedback.kind !== "hint")} onClick={() => submit(c.id)} style={choiceBtn}>
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit(input)}
                placeholder={problem.inputType === "fraction" ? "e.g. 5/6" : "Your answer"}
                disabled={busy || (!!feedback && feedback.kind !== "hint")}
                style={inputBox}
                autoFocus
              />
              <button onClick={() => submit(input)} disabled={busy} style={btnPrimary}>Submit</button>
            </div>
          )}

          {!feedback && (
            <p style={{ fontSize: 12, color: "#8a8a8a", marginTop: 10 }}>
              {attemptsRemaining} hint{attemptsRemaining === 1 ? "" : "s"} before the solution shows.
            </p>
          )}

          {feedback?.kind === "hint" && (
            <div style={{ ...note, background: "#fff7e6", border: "1px solid #f5c97a" }}>
              💡 {feedback.text}
            </div>
          )}
          {feedback?.kind === "correct" && (
            <div style={{ ...note, background: "#e9f8ec", border: "1px solid #8fd6a0" }}>
              ✅ Correct! <b>+{lastGain} XP</b>
              <div style={{ marginTop: 10 }}><button onClick={next} style={btnPrimary}>Next →</button></div>
            </div>
          )}
          {feedback?.kind === "revealed" && (
            <div style={{ ...note, background: "#fdecec", border: "1px solid #f0a6a6" }}>
              Here's the worked solution:
              <div style={{ marginTop: 6, fontWeight: 600 }}>{feedback.solution}</div>
              <div style={{ marginTop: 10 }}><button onClick={next} style={btnPrimary}>Next →</button></div>
            </div>
          )}
        </div>

        {toast && <div style={toastStyle}>{toast}</div>}
      </div>
    );
  }

  // ── Map view ──
  const nodes: ReactNode[] = [];
  let lastWorld: WorldId | null = null;
  map.levels.forEach((l, i) => {
    if (l.world !== lastWorld) {
      lastWorld = l.world;
      nodes.push(
        <div key={`w-${l.world}`} style={{ ...worldBanner, background: WORLD_COLOR[l.world] }}>
          <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            {WORLD_ICON[l.world]} {map.worlds.find((w) => w.id === l.world)?.name}
          </span>
        </div>,
      );
    }
    nodes.push(<MapNode key={l.stage} level={l} index={i} onOpen={openLevel} />);
  });

  return (
    <div>
      {header}
      <p style={{ color: "#667", fontSize: 14, marginTop: -8, marginBottom: 12 }}>
        225 levels · tap your current 🟢 or any cleared 🟡 level to play. Scroll sideways to explore.
      </p>
      <div style={mapScroll}>
        <div style={{ display: "flex", alignItems: "flex-start", height: 220, paddingRight: 40 }}>{nodes}</div>
      </div>
    </div>
  );
}

function MapNode({
  level,
  index,
  onOpen,
}: {
  level: LevelState;
  index: number;
  onOpen: (stage: number) => void;
}) {
  const palette = NODE[level.status];
  const offset = 80 + Math.sin(index * 0.55) * 46;
  const clickable = level.status !== "locked";
  return (
    <div style={{ width: 64, height: 200, position: "relative", flex: "0 0 auto" }}>
      <button
        onClick={() => clickable && onOpen(level.stage)}
        disabled={!clickable}
        title={`Stage ${level.stage} · ${level.skillNames.join(" + ")}`}
        style={{
          position: "absolute",
          left: 6,
          top: offset,
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: `3px solid ${palette.border}`,
          background: palette.bg,
          color: palette.color,
          fontWeight: 700,
          fontSize: 14,
          cursor: clickable ? "pointer" : "default",
          boxShadow: level.status === "current" ? "0 0 0 4px rgba(54,166,54,.25)" : "0 2px 4px rgba(0,0,0,.2)",
        }}
      >
        {level.status === "locked" ? "🔒" : level.stage}
      </button>
      {level.status === "cleared" && (
        <div style={{ position: "absolute", left: 0, top: offset + 52, width: 62, textAlign: "center", fontSize: 11, color: "#f5a623" }}>
          {"★".repeat(level.stars)}{"☆".repeat(3 - level.stars)}
        </div>
      )}
    </div>
  );
}

// ── inline styles ──
const card: CSSProperties = { background: "#fff", border: "1px solid #e6e6ea", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,.05)" };
const chip: CSSProperties = { color: "#fff", fontWeight: 700, fontSize: 12, padding: "3px 10px", borderRadius: 999 };
const barOuter: CSSProperties = { height: 12, background: "#eef0f3", borderRadius: 999, overflow: "hidden", marginTop: 4 };
const barInner: CSSProperties = { height: "100%", background: "linear-gradient(90deg,#5ec8ff,#36a636)", borderRadius: 999, transition: "width .3s" };
const inputBox: CSSProperties = { flex: 1, fontSize: 18, padding: "10px 14px", borderRadius: 10, border: "1px solid #cfd4da" };
const btnPrimary: CSSProperties = { background: "#2f9be8", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const btnGhost: CSSProperties = { background: "transparent", border: "1px solid #cfd4da", borderRadius: 10, padding: "6px 12px", cursor: "pointer", color: "#445" };
const choiceBtn: CSSProperties = { background: "#f4f7fb", border: "1px solid #cfd9e6", borderRadius: 10, padding: "14px", fontSize: 16, fontWeight: 600, cursor: "pointer" };
const note: CSSProperties = { marginTop: 14, padding: "12px 14px", borderRadius: 10, fontSize: 14 };
const mapScroll: CSSProperties = { overflowX: "auto", overflowY: "hidden", border: "1px solid #e6e6ea", borderRadius: 16, background: "linear-gradient(#bfeaff,#dff3e0)", padding: "8px 0" };
const worldBanner: CSSProperties = { flex: "0 0 auto", height: 200, width: 34, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, borderRadius: 8, margin: "0 6px" };
const toastStyle: CSSProperties = { marginTop: 16, background: "#1f2937", color: "#fff", padding: "12px 16px", borderRadius: 10, textAlign: "center", fontWeight: 600 };
