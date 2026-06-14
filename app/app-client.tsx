"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AnswerResponse,
  BossState,
  LevelInfo,
  LevelState,
  MapResponse,
  Problem,
  Stats,
  Subject,
  UserSummary,
} from "@/shared/contract";
import { emailSignIn, googleSignIn, isFirebaseConfigured, logout, watchAuth } from "@/lib/firebaseClient";

type Tab = "game" | "progress" | "leaderboard";
interface Leader { id: string; username: string; displayName: string; totalXp: number; currentStreak: number }
interface LeaderboardResp { leaderboard: Leader[]; currentUserRank: number | null }

const ACCENT = "#7c5cff";
const CYAN = "#22d3ee";
const glass: CSSProperties = {
  background: "rgba(19,23,34,0.55)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};
const NODE = {
  cleared: { bg: "#f5a623", fg: "#3a2600", ring: "#f5a62355" },
  current: { bg: "#34d399", fg: "#06281c", ring: "#34d39955" },
  locked: { bg: "rgba(255,255,255,0.07)", fg: "#64748b", ring: "transparent" },
} as const;
const WORLD_TINT: Record<string, string> = {
  arithmetic: "#34d399", integers: "#f59e0b", "pre-algebra": "#38bdf8", "algebra-1": "#a78bfa",
};

const displayStage = (s: number) => (s > 3000 ? s - 3000 : s > 2000 ? s - 2000 : s > 1000 ? s - 1000 : s);
const levelTitle = (l: LevelInfo) =>
  l.isBoss ? `Boss · ${l.skillNames.join(" & ")}` : l.kind === "pure" ? l.skillNames[0] : l.skillNames.join(" + ");

export default function AppClient() {
  const tokenRef = useRef<string | null>(null);
  const [authUser, setAuthUser] = useState<{ name: string; token: string } | null>(null);
  const [subject, setSubject] = useState<Subject>("math");
  const [tab, setTab] = useState<Tab>("game");

  const [me, setMe] = useState<UserSummary | null>(null);
  const [map, setMap] = useState<MapResponse | null>(null);
  const [board, setBoard] = useState<LeaderboardResp | null>(null);

  // play state
  const [view, setView] = useState<"map" | "play">("map");
  const [level, setLevel] = useState<LevelInfo | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [boss, setBoss] = useState<BossState | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "hint" | "correct" | "revealed"; text?: string; solution?: string } | null>(null);
  const [pendingNext, setPendingNext] = useState<Problem | null>(null);
  const [advanceStage, setAdvanceStage] = useState<number | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(2);
  const [lastGain, setLastGain] = useState(0);
  const [busy, setBusy] = useState(false);

  // login dialog
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const api = useCallback(async <T,>(path: string, opts: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
    if (tokenRef.current) headers["Authorization"] = "Bearer " + tokenRef.current;
    const r = await fetch(path, { cache: "no-store", ...opts, headers });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }, []);

  const loadMap = useCallback(async (s: Subject) => {
    const [m, u] = await Promise.all([
      api<MapResponse>(`/api/map?subject=${s}`),
      api<UserSummary>("/api/me"),
    ]);
    setMap(m);
    setMe(u);
  }, [api]);

  // auth subscription
  useEffect(() => {
    const unsub = watchAuth((u) => {
      tokenRef.current = u?.token ?? null;
      setAuthUser(u);
      loadMap(subject).catch(console.error);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMap(subject).catch(console.error);
    setView("map");
  }, [subject, loadMap]);

  useEffect(() => {
    if (tab === "leaderboard") api<LeaderboardResp>("/api/leaderboard").then(setBoard).catch(console.error);
  }, [tab, api]);

  // ── game actions ──
  const openLevel = useCallback(async (stage: number) => {
    setBusy(true);
    try {
      const res = await api<{ level: LevelInfo; problem: Problem; stats: Stats; boss?: BossState }>(`/api/levels/${stage}/problem`);
      setLevel(res.level); setProblem(res.problem); setStats(res.stats); setBoss(res.boss ?? null);
      setFeedback(null); setPendingNext(null); setAdvanceStage(null); setInput(""); setAttemptsRemaining(2);
      setView("play");
    } catch (e) { console.error(e); } finally { setBusy(false); }
  }, [api]);

  const submit = useCallback(async (answer: string) => {
    if (!problem || busy || !answer.trim()) return;
    setBusy(true);
    try {
      const res = await api<AnswerResponse>(`/api/levels/${problem.stage}/answer`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: problem.token, answer }),
      });
      setStats(res.stats);
      if (res.boss) setBoss(res.boss);
      if (res.state === "hint") {
        setFeedback({ kind: "hint", text: res.hint }); setAttemptsRemaining(res.attemptsRemaining); setInput("");
      } else {
        setFeedback({ kind: res.state === "solved" ? "correct" : "revealed", solution: res.solution });
        setPendingNext(res.nextProblem ?? null); setAdvanceStage(res.advanced?.toStage ?? null); setLastGain(res.stats.xpGained);
      }
    } catch (e) { console.error(e); } finally { setBusy(false); }
  }, [api, problem, busy]);

  const next = useCallback(() => {
    if (advanceStage) { void openLevel(advanceStage); return; }
    if (pendingNext) { setProblem(pendingNext); setPendingNext(null); setFeedback(null); setInput(""); setAttemptsRemaining(2); }
  }, [advanceStage, pendingNext, openLevel]);

  const backToMap = useCallback(async () => { await loadMap(subject); setView("map"); }, [loadMap, subject]);

  // ── login ──
  useEffect(() => {
    if (!localStorage.getItem("yl_has_visited")) setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    localStorage.setItem("yl_has_visited", "1");
    setLoginOpen(false);
  }, []);

  const doEmail = async () => {
    setLoginBusy(true); setLoginErr(null);
    try { await emailSignIn(email, pw); closeLogin(); }
    catch (e) { setLoginErr(e instanceof Error ? e.message : "Sign-in failed"); }
    finally { setLoginBusy(false); }
  };
  const doGoogle = async () => {
    setLoginBusy(true); setLoginErr(null);
    try { await googleSignIn(); closeLogin(); }
    catch (e) { setLoginErr(e instanceof Error ? e.message : "Sign-in failed"); }
    finally { setLoginBusy(false); }
  };
  const doLogout = async () => { await logout(); tokenRef.current = null; setAuthUser(null); loadMap(subject).catch(console.error); };

  return (
    <div style={{ padding: "12px 28px 60px", color: "#e2e8f0" }}>
      {/* ── Top bar ── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Young Learners</div>
        <div style={{ ...seg, marginLeft: 8 }}>
          {(["math", "english", "reading", "science"] as Subject[]).map((s) => (
            <button key={s} onClick={() => setSubject(s)} style={segBtn(subject === s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          <span style={chip}>⭐ {(me?.totalXp ?? 0).toLocaleString()} XP</span>
          <span style={chip}>🔥 {me?.streakDays ?? 0}</span>
          {authUser ? (
            <button onClick={doLogout} style={loginBtn} title="Log out">{authUser.name.split(" ")[0]} · Log out</button>
          ) : (
            <button onClick={() => setLoginOpen(true)} style={loginBtn}>Log in</button>
          )}
        </div>
      </header>

      {/* ── Tabs ── */}
      <div style={{ ...seg, marginBottom: 16 }}>
        {(["game", "progress", "leaderboard"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={segBtn(tab === t)}>
            {t === "game" ? "🎮 Game" : t === "progress" ? "📈 Progress" : "🏆 Leaderboard"}
          </button>
        ))}
      </div>

      {!map ? (
        <div style={{ ...glass, padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>
      ) : tab === "game" ? (
        view === "play" && level && problem ? (
          <PlayView
            level={level} problem={problem} stats={stats} boss={boss} input={input} setInput={setInput}
            feedback={feedback} attemptsRemaining={attemptsRemaining} lastGain={lastGain} busy={busy}
            onSubmit={submit} onNext={next} onBack={backToMap}
          />
        ) : (
          <GameMap map={map} subject={subject} onOpen={openLevel} />
        )
      ) : tab === "progress" ? (
        <Progress me={me} map={map} subject={subject} />
      ) : (
        <Leaderboard board={board} meId={me?.id} />
      )}

      {loginOpen && (
        <LoginDialog
          email={email} setEmail={setEmail} pw={pw} setPw={setPw} err={loginErr} busy={loginBusy}
          onEmail={doEmail} onGoogle={doGoogle} onClose={closeLogin}
        />
      )}
    </div>
  );
}

// ── Game map ──
function GameMap({ map, subject, onOpen }: { map: MapResponse; subject: Subject; onOpen: (s: number) => void }) {
  const nodes: ReactNode[] = [];
  let lastWorld = "";
  map.levels.forEach((l, i) => {
    if (l.world !== lastWorld) {
      lastWorld = l.world;
      const w = map.worlds.find((x) => x.id === l.world);
      nodes.push(
        <div key={`w-${l.world}-${i}`} style={{ flex: "0 0 auto", alignSelf: "stretch", display: "flex", alignItems: "center", padding: "0 6px" }}>
          <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 12, fontWeight: 700, color: WORLD_TINT[l.world] ?? "#94a3b8", letterSpacing: 1 }}>
            {w?.name ?? l.world}
          </div>
        </div>,
      );
    }
    nodes.push(<MapNode key={l.stage} level={l} index={i} onOpen={onOpen} />);
  });

  return (
    <div>
      <p style={{ color: "#94a3b8", fontSize: 13, margin: "0 0 10px" }}>
        {map.levels.length} levels · tap your 🟢 current or any cleared 🟡 level. Scroll sideways →
      </p>
      <div style={{ ...glass, overflowX: "auto", overflowY: "hidden", padding: "6px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", height: 300, paddingRight: 30 }}>{nodes}</div>
      </div>
    </div>
  );
}

function MapNode({ level, index, onOpen }: { level: LevelState; index: number; onOpen: (s: number) => void }) {
  const p = NODE[level.status];
  const top = 78 + Math.sin(index * 0.55) * 46;
  const clickable = level.status !== "locked";
  return (
    <div style={{ width: 70, height: 280, position: "relative", flex: "0 0 auto" }}>
      <button
        onClick={() => clickable && onOpen(level.stage)} disabled={!clickable}
        title={`Stage ${displayStage(level.stage)} · ${level.skillNames.join(" + ")}`}
        style={{
          position: "absolute", left: 5, top, width: 48, height: 48, borderRadius: level.isBoss ? 10 : "50%",
          transform: level.isBoss ? "rotate(45deg)" : undefined,
          border: level.isBoss ? "2px solid #f87171" : "none", background: p.bg, color: p.fg, fontWeight: 800, fontSize: 13,
          cursor: clickable ? "pointer" : "default", boxShadow: `0 0 0 6px ${p.ring}`,
        }}
      >
        <span style={{ display: "inline-block", transform: level.isBoss ? "rotate(-45deg)" : undefined }}>
          {level.status === "locked" ? "🔒" : level.isBoss ? "👾" : displayStage(level.stage)}
        </span>
      </button>
      {level.status === "cleared" && !level.isBoss && (
        <div style={{ position: "absolute", left: 0, top: top + 50, width: 58, textAlign: "center", fontSize: 11, color: "#f5a623" }}>
          {"★".repeat(level.stars)}{"☆".repeat(3 - level.stars)}
        </div>
      )}
    </div>
  );
}

// ── Play ──
function PlayView(props: {
  level: LevelInfo; problem: Problem; stats: Stats | null; boss: BossState | null;
  input: string; setInput: (s: string) => void;
  feedback: { kind: "hint" | "correct" | "revealed"; text?: string; solution?: string } | null;
  attemptsRemaining: number; lastGain: number; busy: boolean;
  onSubmit: (a: string) => void; onNext: () => void; onBack: () => void;
}) {
  const { level, problem, stats, boss, input, setInput, feedback, attemptsRemaining, lastGain, busy } = props;
  const done = feedback && feedback.kind !== "hint";
  return (
    <div>
      <button onClick={props.onBack} style={ghostBtn}>← Map</button>
      <div style={{ ...glass, padding: 22, marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ ...pill, background: level.isBoss ? "#7f1d1d" : ACCENT }}>
            {level.isBoss ? "BOSS" : Number.isInteger(level.difficulty) ? `Lv ${level.difficulty}` : `Lv ${Math.floor(level.difficulty)}½`}
          </span>
          <h2 style={{ margin: 0, fontSize: 17 }}>Stage {displayStage(level.stage)} · {levelTitle(level)}</h2>
        </div>

        {boss ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
              <span>👾 Boss HP</span><span>{"❤️".repeat(boss.hearts)}{"🤍".repeat(boss.maxHearts - boss.hearts)}</span>
            </div>
            <div style={barOuter}><div style={{ ...barInner, width: `${(boss.hp / boss.maxHp) * 100}%`, background: "linear-gradient(90deg,#f87171,#ef4444)" }} /></div>
          </div>
        ) : stats ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
              <span>Progress</span><span>{stats.progress}% · accuracy {Math.round(stats.accuracy * 100)}%</span>
            </div>
            <div style={barOuter}><div style={{ ...barInner, width: `${stats.progress}%` }} /></div>
          </div>
        ) : null}

        <div style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "26px 0 22px" }}>{problem.prompt}</div>

        {problem.inputType === "multiple-choice" && problem.choices ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {problem.choices.map((c) => (
              <button key={c.id} disabled={busy || !!done} onClick={() => props.onSubmit(c.id)} style={choiceBtn}>{c.label}</button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && props.onSubmit(input)}
              placeholder={problem.inputType === "fraction" ? "e.g. 5/6" : "Your answer"} disabled={busy || !!done} autoFocus style={inputBox} />
            <button onClick={() => props.onSubmit(input)} disabled={busy} style={primaryBtn}>Submit</button>
          </div>
        )}

        {!feedback && !boss && <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>{attemptsRemaining} hint{attemptsRemaining === 1 ? "" : "s"} before the solution.</p>}
        {!feedback && boss && <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>No hints — it's a boss. A miss costs a heart.</p>}

        {feedback?.kind === "hint" && <div style={{ ...note, borderColor: "#f59e0b66", background: "#78350f33" }}>💡 {feedback.text}</div>}
        {feedback?.kind === "correct" && (
          <div style={{ ...note, borderColor: "#34d39966", background: "#06402b55" }}>
            ✅ Correct! <b>+{lastGain} XP</b>
            <div style={{ marginTop: 10 }}><button onClick={props.onNext} style={primaryBtn}>Next →</button></div>
          </div>
        )}
        {feedback?.kind === "revealed" && (
          <div style={{ ...note, borderColor: "#f8717166", background: "#4c181855" }}>
            {feedback.solution ? <>Solution: <b>{feedback.solution}</b></> : "Out of hearts — the fight resets."}
            <div style={{ marginTop: 10 }}><button onClick={props.onNext} style={primaryBtn}>Next →</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Progress ──
function Progress({ me, map, subject }: { me: UserSummary | null; map: MapResponse | null; subject: Subject }) {
  const cleared = map?.levels.filter((l) => l.status === "cleared").length ?? 0;
  const total = map?.levels.length ?? 0;
  const stars = map?.levels.reduce((a, l) => a + l.stars, 0) ?? 0;
  const cur = map ? displayStage(map.user.currentStage) : 0;
  const cards = [
    { label: "Total XP", value: (me?.totalXp ?? 0).toLocaleString() },
    { label: "Day streak", value: me?.streakDays ?? 0 },
    { label: `${subject.charAt(0).toUpperCase() + subject.slice(1)} stage`, value: `${cur} / ${total}` },
    { label: "Levels cleared", value: cleared },
    { label: "Stars earned", value: stars },
  ];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ ...glass, padding: "16px 18px" }}>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ ...glass, padding: 18, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
          <span>{subject.charAt(0).toUpperCase() + subject.slice(1)} ladder</span><span>{cleared} / {total} cleared</span>
        </div>
        <div style={barOuter}><div style={{ ...barInner, width: `${total ? (cleared / total) * 100 : 0}%` }} /></div>
      </div>
    </div>
  );
}

// ── Leaderboard ──
function Leaderboard({ board, meId }: { board: LeaderboardResp | null; meId?: string }) {
  if (!board) return <div style={{ ...glass, padding: 30, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;
  return (
    <div style={{ ...glass, padding: 8 }}>
      {board.leaderboard.map((u, i) => {
        const isMe = u.id === meId;
        return (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: isMe ? `${ACCENT}22` : "transparent" }}>
            <div style={{ width: 28, textAlign: "center", fontWeight: 800, color: i < 3 ? "#f5a623" : "#64748b" }}>{i + 1}</div>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${CYAN}33`, color: CYAN, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
              {u.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ flex: 1, fontWeight: isMe ? 700 : 500 }}>{u.displayName}{isMe && " (you)"}</div>
            <div style={{ color: "#94a3b8", fontSize: 13 }}>🔥 {u.currentStreak}</div>
            <div style={{ fontWeight: 700 }}>{u.totalXp.toLocaleString()} XP</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Login dialog ──
function LoginDialog(props: {
  email: string; setEmail: (s: string) => void; pw: string; setPw: (s: string) => void;
  err: string | null; busy: boolean; onEmail: () => void; onGoogle: () => void; onClose: () => void;
}) {
  const configured = isFirebaseConfigured();
  return (
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,4,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...glass, width: 360, maxWidth: "100%", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>Log in with Google or Email</h2>
          <button onClick={props.onClose} style={{ ...ghostBtn, padding: "2px 10px" }}>✕</button>
        </div>
        {!configured && (
          <div style={{ ...note, borderColor: "#f59e0b66", background: "#78350f33", marginTop: 0, marginBottom: 14, fontSize: 13 }}>
            Firebase isn't configured yet — set the <code>NEXT_PUBLIC_FIREBASE_*</code> env vars to enable real logins. You're playing as a guest for now.
          </div>
        )}
        <input value={props.email} onChange={(e) => props.setEmail(e.target.value)} placeholder="Email" disabled={!configured} style={{ ...inputBox, width: "100%", marginBottom: 8 }} />
        <input value={props.pw} onChange={(e) => props.setPw(e.target.value)} type="password" placeholder="Password" disabled={!configured} style={{ ...inputBox, width: "100%", marginBottom: 12 }} />
        {props.err && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{props.err}</div>}
        <button onClick={props.onEmail} disabled={!configured || props.busy} style={{ ...primaryBtn, width: "100%", marginBottom: 8, opacity: configured ? 1 : 0.5 }}>
          Sign in / Sign up
        </button>
        <button onClick={props.onGoogle} disabled={!configured || props.busy} style={{ ...ghostBtn, width: "100%", marginBottom: 12, opacity: configured ? 1 : 0.5 }}>
           Continue with Google
        </button>
        <div style={{ textAlign: "center" }}>
          <button onClick={props.onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            Continue as guest
          </button>
        </div>
      </div>
    </div>
  );
}

// ── shared inline styles ──
const seg: CSSProperties = { display: "inline-flex", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 3, gap: 2 };
const segBtn = (active: boolean): CSSProperties => ({ border: "none", background: active ? ACCENT : "transparent", color: active ? "#fff" : "#94a3b8", padding: "7px 14px", borderRadius: 9, fontWeight: 600, fontSize: 13.5, cursor: "pointer" });
const chip: CSSProperties = { ...glass, padding: "6px 12px", fontSize: 13, fontWeight: 600 };
const loginBtn: CSSProperties = { background: `linear-gradient(90deg,${ACCENT},#9b8cff)`, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const barOuter: CSSProperties = { height: 12, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden", marginTop: 5 };
const barInner: CSSProperties = { height: "100%", background: `linear-gradient(90deg,${CYAN},${ACCENT})`, borderRadius: 999, transition: "width .3s" };
const inputBox: CSSProperties = { flex: 1, fontSize: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0" };
const primaryBtn: CSSProperties = { background: ACCENT, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const ghostBtn: CSSProperties = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 600 };
const choiceBtn: CSSProperties = { ...glass, padding: "16px", fontSize: 15, fontWeight: 600, color: "#e2e8f0", cursor: "pointer", textAlign: "left" };
const pill: CSSProperties = { color: "#fff", fontWeight: 800, fontSize: 12, padding: "4px 11px", borderRadius: 999 };
const note: CSSProperties = { marginTop: 14, padding: "12px 14px", borderRadius: 10, fontSize: 14, border: "1px solid" };
