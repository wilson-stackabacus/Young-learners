"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import type {
  AnswerResponse,
  BossState,
  LevelInfo,
  LevelState,
  MapResponse,
  PlacementProbe,
  PlacementResult,
  Problem,
  Stats,
  Subject,
  UserSummary,
} from "@/shared/contract";
import { emailSignIn, googleSignIn, isFirebaseConfigured, logout, watchAuth } from "@/lib/firebaseClient";

type Tab = "game" | "progress" | "leaderboard";
interface Leader { rank: number; id: string; username: string; displayName: string; totalXp: number; currentStreak: number; currentStage: number }
interface LeaderboardResp { subject: Subject; leaderboard: Leader[]; currentUserRank: number | null; isGuest: boolean }
interface ProgressData {
  subject: Subject;
  totalXp: number; currentStreak: number; longestStreak: number;
  levelsCleared: number; levelsTotal: number; stars: number;
  totalSolved: number; totalAttempts: number; accuracy: number;
  weekly: { day: string; label: string; xp: number; solved: number }[];
  worlds: { id: string; total: number; cleared: number; stars: number }[];
  badges: { slug: string; name: string; description: string; tier: string; earnedAt: string }[];
}

const ACCENT = "#7c5cff";
const CYAN = "#22d3ee";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Tiny sessionStorage cache so switching subjects/tabs renders instantly from
// the browser instead of re-fetching every time. Keys are namespaced per
// identity (see cacheKey) so one user never sees another's cached data.
function cacheGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try { const v = sessionStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function cacheSet(key: string, val: unknown): void {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch { /* quota / private mode — ignore */ }
}
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
  const guestRef = useRef<string | null>(null);
  const presentedRef = useRef<number>(0); // when the current problem was shown (for response-time analytics)
  const [authUser, setAuthUser] = useState<{ name: string; token: string } | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [subject, setSubject] = useState<Subject>("math");
  const [tab, setTab] = useState<Tab>("game");

  const [me, setMe] = useState<UserSummary | null>(null);
  const [map, setMap] = useState<MapResponse | null>(null);
  const [board, setBoard] = useState<LeaderboardResp | null>(null);
  const [prog, setProg] = useState<ProgressData | null>(null);

  // placement test state
  const [placementProb, setPlacementProb] = useState<PlacementProbe | null>(null);
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);
  const [placementBusy, setPlacementBusy] = useState(false);

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
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: string }[]>([]);

  const pushToast = useCallback((text: string, tone: string = CYAN) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  }, []);

  // intro + login dialogs
  const [introOpen, setIntroOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [storedName, setStoredName] = useState<string | null>(null);

  const api = useCallback(async <T,>(path: string, opts: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
    if (tokenRef.current) headers["Authorization"] = "Bearer " + tokenRef.current;
    else if (guestRef.current) headers["X-Guest-Id"] = guestRef.current;
    const r = await fetch(path, { cache: "no-store", ...opts, headers });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return r.json() as Promise<T>;
  }, []);

  // Cache keys are namespaced by who you currently are, so login/logout/guest
  // switches never reuse the previous identity's cached map/me/leaderboard.
  const cacheKey = useCallback((kind: string) => {
    const id = tokenRef.current ? "t" + tokenRef.current.slice(-12) : guestRef.current ? "g" + guestRef.current : "demo";
    return `yl.${kind}.${id}`;
  }, []);

  // Stale-while-revalidate: paint instantly from the browser cache (no flash or
  // "Loading…"), then ALWAYS refetch and update. So a value that changed — XP
  // after solving, or a brand-new guest at 0 — corrects itself on its own
  // instead of showing a stale score until you manually reload.
  const loadMap = useCallback(async (s: Subject) => {
    const mk = cacheKey("map." + s), uk = cacheKey("me");
    const cm = cacheGet<MapResponse>(mk), cu = cacheGet<UserSummary>(uk);
    if (cm) setMap(cm);
    if (cu) setMe(cu);
    const [m, u] = await Promise.all([
      api<MapResponse>(`/api/map?subject=${s}`),
      api<UserSummary>("/api/me"),
    ]);
    setMap(m); setMe(u);
    cacheSet(mk, m); cacheSet(uk, u);
  }, [api, cacheKey]);

  // auth subscription
  useEffect(() => {
    // Restore a prior guest session (so a refresh keeps the same guest row)
    // before we start listening — api() then attaches the X-Guest-Id header.
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("ql.guestId") : null;
    if (stored) { guestRef.current = stored; setGuestId(stored); }
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
    setPlacementProb(null); setPlacementResult(null);
  }, [subject, loadMap]);

  useEffect(() => {
    if (tab !== "leaderboard") return;
    const k = cacheKey("lb." + subject);
    setBoard(cacheGet<LeaderboardResp>(k)); // show cached instantly, then revalidate
    api<LeaderboardResp>(`/api/leaderboard?subject=${subject}`)
      .then((b) => { setBoard(b); cacheSet(k, b); })
      .catch(console.error);
  }, [tab, subject, api, cacheKey]);

  useEffect(() => {
    if (tab === "progress") {
      setProg(null);
      api<ProgressData>(`/api/progress?subject=${subject}`).then(setProg).catch(console.error);
    }
  }, [tab, subject, api]);

  // ── game actions ──
  const openLevel = useCallback(async (stage: number) => {
    setBusy(true);
    try {
      const res = await api<{ level: LevelInfo; problem: Problem; stats: Stats; boss?: BossState }>(`/api/levels/${stage}/problem`);
      setLevel(res.level); setProblem(res.problem); setStats(res.stats); setBoss(res.boss ?? null);
      setFeedback(null); setPendingNext(null); setAdvanceStage(null); setInput(""); setAttemptsRemaining(2);
      presentedRef.current = Date.now();
      setView("play");
    } catch (e) { console.error(e); } finally { setBusy(false); }
  }, [api]);

  const submit = useCallback(async (answer: string) => {
    if (!problem || busy || !answer.trim()) return;
    setBusy(true);
    try {
      const responseMs = presentedRef.current ? Date.now() - presentedRef.current : undefined;
      const res = await api<AnswerResponse>(`/api/levels/${problem.stage}/answer`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: problem.token, answer, responseMs }),
      });
      setStats(res.stats);
      if (res.boss) setBoss(res.boss);
      if (res.state === "hint") {
        setFeedback({ kind: "hint", text: res.hint }); setAttemptsRemaining(res.attemptsRemaining); setInput("");
      } else {
        setFeedback({ kind: res.state === "solved" ? "correct" : "revealed", solution: res.solution });
        setPendingNext(res.nextProblem ?? null); setAdvanceStage(res.advanced?.toStage ?? null); setLastGain(res.stats.xpGained);
        if (res.state === "solved") {
          if (res.stats.xpGained > 0) pushToast(`+${res.stats.xpGained} XP`, "#34d399");
          if (res.boss?.defeated) pushToast("Dragon defeated! 🐉", "#fbbf24");
          else if (res.advanced) pushToast("Level cleared! 🎉", "#fbbf24");
        }
      }
    } catch (e) { console.error(e); } finally { setBusy(false); }
  }, [api, problem, busy, pushToast]);

  const next = useCallback(() => {
    if (advanceStage) { void openLevel(advanceStage); return; }
    if (pendingNext) { setProblem(pendingNext); setPendingNext(null); setFeedback(null); setInput(""); setAttemptsRemaining(2); presentedRef.current = Date.now(); }
  }, [advanceStage, pendingNext, openLevel]);

  // Force-refresh on return from play — XP / stars / stage just changed.
  const backToMap = useCallback(async () => { await loadMap(subject); setView("map"); }, [loadMap, subject]);

  // ── placement test ──
  const startPlacement = useCallback(async () => {
    setPlacementBusy(true); setPlacementResult(null);
    try { setPlacementProb(await api<PlacementProbe>(`/api/placement?subject=${subject}&level=1`)); }
    catch (e) { console.error(e); } finally { setPlacementBusy(false); }
  }, [api, subject]);

  const answerPlacement = useCallback(async (answer: string) => {
    if (!placementProb || placementBusy || !answer.trim()) return;
    setPlacementBusy(true);
    try {
      const res = await api<PlacementResult>("/api/placement", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, level: placementProb.level, token: placementProb.problem.token, answer }),
      });
      if (res.done) { setPlacementProb(null); setPlacementResult(res); }
      else { setPlacementProb(await api<PlacementProbe>(`/api/placement?subject=${subject}&level=${res.nextLevel}`)); }
    } catch (e) { console.error(e); } finally { setPlacementBusy(false); }
  }, [api, subject, placementProb, placementBusy]);

  const skipPlacement = useCallback(async () => {
    setPlacementBusy(true);
    try { await api("/api/placement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, action: "skip" }) }); }
    catch (e) { console.error(e); }
    finally { setPlacementProb(null); setPlacementResult(null); setPlacementBusy(false); await loadMap(subject); }
  }, [api, subject, loadMap]);

  const finishPlacement = useCallback(async () => {
    setPlacementProb(null); setPlacementResult(null);
    await loadMap(subject);
  }, [loadMap, subject]);

  // ── intro + login ──
  // First visit → show the welcome/intro dialog (which then leads into login).
  useEffect(() => {
    const n = localStorage.getItem("yl_name");
    if (n) { setStoredName(n); setName(n); }
    if (!localStorage.getItem("yl_has_visited")) setIntroOpen(true);
  }, []);

  const closeIntro = useCallback(() => {
    localStorage.setItem("yl_has_visited", "1");
    setIntroOpen(false);
  }, []);
  const startFromIntro = useCallback(() => { closeIntro(); setLoginOpen(true); }, [closeIntro]);

  const saveName = useCallback((n: string) => {
    const t = n.trim();
    if (!t) return;
    localStorage.setItem("yl_name", t);
    setStoredName(t);
  }, []);

  const closeLogin = useCallback(() => {
    localStorage.setItem("yl_has_visited", "1");
    setLoginOpen(false);
  }, []);

  const doEmail = async () => {
    setLoginBusy(true); setLoginErr(null);
    try { await emailSignIn(email, pw, name); saveName(name); closeLogin(); }
    catch (e) { setLoginErr(e instanceof Error ? e.message : "Sign-in failed"); }
    finally { setLoginBusy(false); }
  };
  const doGoogle = async () => {
    setLoginBusy(true); setLoginErr(null);
    try { if (name.trim()) saveName(name); await googleSignIn(); closeLogin(); }
    catch (e) { setLoginErr(e instanceof Error ? e.message : "Sign-in failed"); }
    finally { setLoginBusy(false); }
  };
  const doLogout = async () => { await logout(); tokenRef.current = null; setAuthUser(null); setMe(null); setMap(null); loadMap(subject).catch(console.error); };
  const continueAsGuest = async () => {
    setLoginBusy(true); setLoginErr(null);
    try {
      const g = await api<{ id: string }>("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name.trim() || undefined }),
      });
      guestRef.current = g.id; setGuestId(g.id);
      if (typeof window !== "undefined") sessionStorage.setItem("ql.guestId", g.id);
      setMe(null); setMap(null); // drop the previous identity's stats so the new guest shows 0, not a stale score
      if (name.trim()) saveName(name);
      closeLogin();
      await loadMap(subject);
    } catch (e) { setLoginErr(e instanceof Error ? e.message : "Could not start guest session"); }
    finally { setLoginBusy(false); }
  };

  // Resolved first name for the greeting — ignores generic placeholder names.
  const GENERIC = ["Guest", "Demo Learner", "Learner", ""];
  const rawName = authUser?.name ?? (me?.displayName && !GENERIC.includes(me.displayName) ? me.displayName : null) ?? storedName ?? "";
  const greetName = rawName && !GENERIC.includes(rawName) ? rawName.split(/[\s@]/)[0] : "";

  return (
    <div style={{ padding: "12px 28px 60px", color: "#e2e8f0" }}>
      <GameStyles />
      <Toaster toasts={toasts} />
      {/* ── Top bar ── */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Young Learners 4</div>
        <div style={{ ...seg, marginLeft: 8 }}>
          {(["math", "english", "reading", "science"] as Subject[]).map((s) => (
            <button key={s} onClick={() => setSubject(s)} style={segBtn(subject === s)}>{cap(s)}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto", alignItems: "center" }}>
          <a href="/about" style={{ ...ghostBtn, textDecoration: "none", fontSize: 13 }}>About</a>
          <span style={chip}>⭐ <CountUp value={me?.totalXp ?? 0} /> XP</span>
          <span style={chip}>🔥 <CountUp value={me?.streakDays ?? 0} /></span>
          {authUser ? (
            <button onClick={doLogout} style={loginBtn} title="Log out">{authUser.name.split(" ")[0]} · Log out</button>
          ) : guestId ? (
            <>
              <span style={{ ...chip, color: CYAN, borderColor: `${CYAN}55` }}>👤 Guest</span>
              <button onClick={() => setLoginOpen(true)} style={loginBtn}>Sign up</button>
            </>
          ) : (
            <button onClick={() => setLoginOpen(true)} style={loginBtn}>Log in</button>
          )}
        </div>
      </header>

      {/* ── Greeting ── */}
      {greetName && (
        <div style={{ marginBottom: 14, animation: "yl-fade-slide .5s ease both" }}>
          <span style={{ fontSize: 20, fontWeight: 800 }}>
            Hey, <span style={{ color: CYAN }}>{greetName}</span> 👋
          </span>
          <span style={{ color: "#94a3b8", fontSize: 14, marginLeft: 10 }}>Ready for some {cap(subject)}?</span>
        </div>
      )}

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
        placementProb || placementResult ? (
          <PlacementView
            subject={subject} prob={placementProb} result={placementResult} busy={placementBusy}
            onAnswer={answerPlacement} onSkip={skipPlacement} onDone={finishPlacement}
          />
        ) : view === "play" && level && problem ? (
          <PlayView
            level={level} problem={problem} stats={stats} boss={boss} input={input} setInput={setInput}
            feedback={feedback} attemptsRemaining={attemptsRemaining} lastGain={lastGain} busy={busy}
            onSubmit={submit} onNext={next} onBack={backToMap}
          />
        ) : (
          <>
            {map.placementDone === false && <PlacementBanner busy={placementBusy} onStart={startPlacement} onSkip={skipPlacement} />}
            <GameMap map={map} subject={subject} onOpen={openLevel} />
          </>
        )
      ) : tab === "progress" ? (
        <Progress prog={prog} map={map} subject={subject} />
      ) : (
        <Leaderboard board={board} meId={me?.id} subject={subject} onSignUp={() => setLoginOpen(true)} />
      )}

      {introOpen && <IntroDialog onStart={startFromIntro} onClose={closeIntro} />}

      {loginOpen && (
        <LoginDialog
          name={name} setName={setName}
          email={email} setEmail={setEmail} pw={pw} setPw={setPw} err={loginErr} busy={loginBusy}
          onEmail={doEmail} onGoogle={doGoogle} onGuest={continueAsGuest} onClose={closeLogin}
        />
      )}
    </div>
  );
}

// ── Intro / welcome ──
function IntroDialog({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  const points: [string, string][] = [
    ["Four subjects", "Math, English, Reading and Science — switch any time from the top."],
    ["Level up by solving", "Clear a level's problems to fill the bar and unlock the next one."],
    ["Hints, not dead-ends", "Miss a question and you get a hint, then a worked solution — never just “wrong.”"],
    ["Earn XP & streaks", "Every correct answer earns XP; practice daily to grow your streak."],
    ["Boss dragons & leaderboards", "Beat a dragon at the end of each stage and climb the per-subject leaderboard."],
  ];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,4,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...glass, width: 460, maxWidth: "100%", padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, letterSpacing: 1, textTransform: "uppercase" }}>Welcome to</div>
        <h2 style={{ margin: "4px 0 6px", fontSize: 26, letterSpacing: -0.5 }}>Young Learners 4</h2>
        <p style={{ margin: "0 0 18px", color: "#94a3b8", fontSize: 14 }}>An adaptive practice playground for grades K–8. Here&apos;s how it works:</p>
        <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
          {points.map(([title, body], i) => (
            <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ flex: "0 0 26px", height: 26, borderRadius: "50%", background: `${ACCENT}22`, color: "#c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 1 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onStart} style={{ ...primaryBtn, width: "100%", marginBottom: 8 }}>Get started</button>
        <div style={{ textAlign: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>
            Explore first
          </button>
        </div>
      </div>
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

// ── Dragon battle (boss re-skin) ──
function DragonBattle({ boss }: { boss: BossState }) {
  const [fx, setFx] = useState<"idle" | "hit" | "attack" | "victory">("idle");
  const prev = useRef({ hp: boss.hp, hearts: boss.hearts });
  useEffect(() => {
    const p = prev.current;
    let next: typeof fx = "idle";
    if (boss.defeated) next = "victory";
    else if (boss.hp < p.hp) next = "hit";
    else if (boss.hearts < p.hearts) next = "attack";
    prev.current = { hp: boss.hp, hearts: boss.hearts };
    if (next === "idle") return;
    setFx(next);
    if (next === "victory") return;
    const t = setTimeout(() => setFx("idle"), 520);
    return () => clearTimeout(t);
  }, [boss.hp, boss.hearts, boss.defeated]);

  const hpPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  const anim =
    fx === "hit" ? "yl-hit .5s" : fx === "attack" ? "yl-attack .5s" : fx === "victory" ? "yl-victory 1s forwards" : "yl-float 2.6s ease-in-out infinite";
  return (
    <div style={{ marginTop: 14, position: "relative" }}>
      {fx === "victory" && <Confetti />}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
        <div style={{ fontSize: 60, lineHeight: 1, animation: anim, filter: fx === "hit" ? "drop-shadow(0 0 12px #ef4444) saturate(1.8)" : "none" }}>🐉</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
        <span>Dragon HP</span>
        <span>{"❤️".repeat(boss.hearts)}{"🤍".repeat(Math.max(0, boss.maxHearts - boss.hearts))}</span>
      </div>
      <div style={barOuter}><div style={{ ...barInner, width: `${hpPct}%`, background: "linear-gradient(90deg,#f87171,#ef4444)", transition: "width .4s" }} /></div>
      {boss.defeated && <div style={{ textAlign: "center", marginTop: 8, fontWeight: 800, color: "#fbbf24", animation: "yl-pop .4s" }}>Dragon defeated! 🎉</div>}
      {boss.failed && <div style={{ textAlign: "center", marginTop: 8, fontWeight: 700, color: "#f87171" }}>The dragon roars back — regroup and try again!</div>}
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(() => {
    const colors = [ACCENT, CYAN, "#fbbf24", "#34d399", "#f87171"];
    return Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100, delay: Math.random() * 0.5, dur: 1.2 + Math.random() * 1.3,
      color: colors[i % colors.length], size: 6 + Math.random() * 7,
    }));
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: "absolute", top: -12, left: `${p.left}%`, width: p.size, height: p.size, background: p.color, borderRadius: 2, animation: `yl-confetti ${p.dur}s ${p.delay}s ease-in forwards` }} />
      ))}
    </div>
  );
}

// Smoothly counts the displayed number up/down when `value` changes.
function CountUp({ value, style }: { value: number; style?: CSSProperties }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    prev.current = to;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now(), dur = 650;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span style={style}>{display.toLocaleString()}</span>;
}

// Celebration toasts (XP gains, level-ups, streaks).
function Toaster({ toasts }: { toasts: { id: number; text: string; tone: string }[] }) {
  return (
    <div style={{ position: "fixed", top: 12, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 60, pointerEvents: "none" }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ ...glass, padding: "8px 16px", fontWeight: 800, fontSize: 14, color: t.tone, border: `1px solid ${t.tone}55`, animation: "yl-toastin .3s ease" }}>{t.text}</div>
      ))}
    </div>
  );
}

// Injected once: all gameplay keyframes.
function GameStyles() {
  return (
    <style>{`
@keyframes yl-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes yl-hit { 0%{transform:translateX(0)} 20%{transform:translateX(-8px) rotate(-7deg)} 40%{transform:translateX(8px) rotate(7deg)} 60%{transform:translateX(-6px)} 80%{transform:translateX(4px)} 100%{transform:translateX(0)} }
@keyframes yl-attack { 0%{transform:scale(1) translateY(0)} 45%{transform:scale(1.28) translateY(8px)} 100%{transform:scale(1) translateY(0)} }
@keyframes yl-victory { 0%{transform:scale(1) rotate(0);opacity:1} 55%{transform:scale(1.12) rotate(10deg)} 100%{transform:scale(.55) rotate(45deg) translateY(34px);opacity:.15} }
@keyframes yl-confetti { 0%{transform:translateY(0) rotate(0);opacity:1} 100%{transform:translateY(340px) rotate(420deg);opacity:0} }
@keyframes yl-pop { 0%{transform:scale(.6);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes yl-toastin { 0%{transform:translateY(-12px);opacity:0} 100%{transform:translateY(0);opacity:1} }
`}</style>
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
  const [picked, setPicked] = useState<string | null>(null);
  const correct = feedback?.kind === "correct";
  const wrong = feedback?.kind === "hint" || feedback?.kind === "revealed";

  // Reset the per-problem UI state whenever a new problem arrives.
  useEffect(() => { setPicked(null); }, [problem.token]);

  const handle = (answer: string) => { setPicked(answer); props.onSubmit(answer); };

  // Choice color: green if it's the picked-correct one, red if picked-wrong.
  const choiceStyle = (id: string): CSSProperties => {
    if (picked === id && correct) return { ...choiceBtn, borderColor: "#34d399", background: "rgba(52,211,153,0.16)", color: "#bbf7d0", animation: "yl-correct-pop .5s ease" };
    if (picked === id && wrong) return { ...choiceBtn, borderColor: "#f87171", background: "rgba(248,113,113,0.14)", color: "#fecaca", animation: "yl-shake .4s ease" };
    return choiceBtn;
  };

  return (
    <div style={{ animation: "yl-fade-slide .35s ease both" }}>
      <button onClick={props.onBack} style={ghostBtn}>← Map</button>
      <div style={{ ...glass, padding: 22, marginTop: 12, position: "relative", overflow: "hidden",
        animation: correct ? "yl-flash-good 1s ease" : undefined }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ ...pill, background: level.isBoss ? "#7f1d1d" : ACCENT }}>
            {level.isBoss ? "BOSS" : Number.isInteger(level.difficulty) ? `Lv ${level.difficulty}` : `Lv ${Math.floor(level.difficulty)}½`}
          </span>
          <h2 style={{ margin: 0, fontSize: 17 }}>Stage {displayStage(level.stage)} · {levelTitle(level)}</h2>
        </div>

        {boss ? (
          <DragonBattle boss={boss} />
        ) : stats ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
              <span>Progress</span><span>{stats.progress}% · accuracy {Math.round(stats.accuracy * 100)}%</span>
            </div>
            <div style={barOuter}><div style={{ ...barInner, width: `${stats.progress}%` }} /></div>
          </div>
        ) : null}

        <div style={{ position: "relative", fontSize: 26, fontWeight: 700, textAlign: "center", margin: "26px 0 22px",
          animation: correct ? "yl-correct-pop .55s ease" : wrong ? "yl-shake .4s ease" : undefined }}>
          {problem.prompt}
          {correct && (
            <span style={{ position: "absolute", left: "50%", top: -6, transform: "translateX(-50%)", color: "#34d399",
              fontWeight: 800, fontSize: 20, animation: "yl-xp-float 1.4s ease forwards", pointerEvents: "none" }}>
              +{lastGain} XP
            </span>
          )}
        </div>

        {problem.inputType === "multiple-choice" && problem.choices ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {problem.choices.map((c) => (
              <button key={c.id} disabled={busy || !!done} onClick={() => handle(c.id)} style={choiceStyle(c.id)}>{c.label}</button>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, animation: wrong ? "yl-shake .4s ease" : undefined }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handle(input)}
              placeholder={problem.inputType === "fraction" ? "e.g. 5/6" : "Your answer"} disabled={busy || !!done} autoFocus
              style={{ ...inputBox, borderColor: correct ? "#34d399" : wrong ? "#f87171" : "rgba(255,255,255,0.12)", transition: "border-color .25s" }} />
            <button onClick={() => handle(input)} disabled={busy} style={primaryBtn}>Submit</button>
          </div>
        )}

        {!feedback && !boss && <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>{attemptsRemaining} hint{attemptsRemaining === 1 ? "" : "s"} before the solution.</p>}
        {!feedback && boss && <p style={{ fontSize: 12, color: "#64748b", marginTop: 10 }}>No hints — it's a boss. A miss costs a heart.</p>}

        {feedback?.kind === "hint" && <div style={{ ...note, borderColor: "#f59e0b66", background: "#78350f33", animation: "yl-slide-up .35s ease both" }}>💡 {feedback.text}</div>}
        {feedback?.kind === "correct" && (
          <div style={{ ...note, borderColor: "#34d39966", background: "#06402b55", animation: "yl-slide-up .35s ease both" }}>
            ✅ Correct! <b>+{lastGain} XP</b>
            <div style={{ marginTop: 10 }}><button onClick={props.onNext} style={primaryBtn}>Next →</button></div>
          </div>
        )}
        {feedback?.kind === "revealed" && (
          <div style={{ ...note, borderColor: "#f8717166", background: "#4c181855", animation: "yl-slide-up .35s ease both" }}>
            {feedback.solution ? <>Solution: <b>{feedback.solution}</b></> : "Out of hearts — the fight resets."}
            <div style={{ marginTop: 10 }}><button onClick={props.onNext} style={primaryBtn}>Next →</button></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Progress ──
const TIER_COLOR: Record<string, string> = { bronze: "#cd7f32", silver: "#cbd5e1", gold: "#f5a623" };

function Donut({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 46, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div style={{ ...glass, padding: 18, display: "flex", alignItems: "center", gap: 16 }}>
      <svg width="110" height="110" viewBox="0 0 110 110" style={{ flex: "0 0 auto" }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={ACCENT} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.9,.3,1)", strokeDashoffset: off }} />
        <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="800" fill="#e2e8f0">{Math.round(pct * 100)}%</text>
        <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#94a3b8">{sub}</text>
      </svg>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, maxWidth: 180 }}>
          Your rolling answer accuracy on this track.
        </div>
      </div>
    </div>
  );
}

function Progress({ prog, map, subject }: { prog: ProgressData | null; map: MapResponse | null; subject: Subject }) {
  if (!prog) return <div style={{ ...glass, padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading your progress…</div>;

  const worldName = (id: string) => map?.worlds.find((w) => w.id === id)?.name ?? id;
  const maxXp = Math.max(1, ...prog.weekly.map((d) => d.xp));
  const weekTotal = prog.weekly.reduce((a, d) => a + d.xp, 0);
  const cards = [
    { label: "Total XP", value: prog.totalXp.toLocaleString(), tint: ACCENT, icon: "⭐" },
    { label: "Day streak", value: prog.currentStreak, tint: "#f59e0b", icon: "🔥" },
    { label: "Problems solved", value: prog.totalSolved.toLocaleString(), tint: "#34d399", icon: "✅" },
    { label: "Levels cleared", value: `${prog.levelsCleared} / ${prog.levelsTotal}`, tint: CYAN, icon: "🏁" },
    { label: "Stars earned", value: prog.stars, tint: "#f5a623", icon: "★" },
  ];
  const fresh = prog.totalAttempts === 0 && prog.totalXp === 0;

  return (
    <div style={{ animation: "yl-fade .35s ease both" }}>
      {fresh && (
        <div style={{ ...glass, padding: "14px 18px", marginBottom: 14, borderColor: `${ACCENT}55`, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          <div style={{ fontSize: 14 }}><b>Your {cap(subject)} journey starts here.</b> Solve a few problems and watch these stats come to life.</div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ ...glass, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -8, top: -8, fontSize: 44, opacity: 0.12 }}>{c.icon}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: c.tint }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Weekly XP + accuracy donut */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 12, marginTop: 12 }}>
        <div style={{ ...glass, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>XP this week</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{weekTotal.toLocaleString()} XP · 7 days</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, height: 140 }}>
            {prog.weekly.map((d, i) => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>{d.xp > 0 ? d.xp : ""}</div>
                <div style={{ width: "70%", maxWidth: 34, height: `${Math.max(4, (d.xp / maxXp) * 104)}px`,
                  background: d.xp > 0 ? `linear-gradient(180deg,${CYAN},${ACCENT})` : "rgba(255,255,255,0.06)",
                  borderRadius: 6, transition: "height .6s cubic-bezier(.2,.9,.3,1)", animation: `yl-grow .6s ${i * 0.05}s ease both`,
                  transformOrigin: "bottom" }} />
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
        <Donut pct={prog.accuracy} label="Accuracy" sub={`${prog.totalSolved}/${prog.totalAttempts}`} />
      </div>

      {/* Per-world mastery */}
      <div style={{ ...glass, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{cap(subject)} mastery by world</div>
        {prog.worlds.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>No worlds loaded.</div>
        ) : prog.worlds.map((w) => {
          const pct = w.total ? (w.cleared / w.total) * 100 : 0;
          const tint = WORLD_TINT[w.id] ?? ACCENT;
          return (
            <div key={w.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ fontWeight: 600 }}>{worldName(w.id)}</span>
                <span style={{ color: "#94a3b8" }}>{w.cleared}/{w.total} cleared · {"★".repeat(Math.min(3, Math.round(w.stars / Math.max(1, w.cleared))))} </span>
              </div>
              <div style={barOuter}><div style={{ ...barInner, width: `${pct}%`, background: `linear-gradient(90deg,${tint},${tint}aa)` }} /></div>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div style={{ ...glass, padding: 18, marginTop: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Badges {prog.badges.length > 0 && <span style={{ color: "#94a3b8", fontWeight: 500 }}>· {prog.badges.length} earned</span>}</div>
        {prog.badges.length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>🏅 No badges yet — solve problems and clear levels to start earning them.</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {prog.badges.map((b) => (
              <div key={b.slug} title={b.description} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${(TIER_COLOR[b.tier] ?? "#888")}55` }}>
                <span style={{ fontSize: 18 }}>🏅</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: TIER_COLOR[b.tier] ?? "#94a3b8", textTransform: "capitalize" }}>{b.tier}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Leaderboard ──
function Leaderboard({ board, meId, subject, onSignUp }: { board: LeaderboardResp | null; meId?: string; subject: Subject; onSignUp: () => void }) {
  if (!board) return <div style={{ ...glass, padding: 30, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;
  const subj = cap(subject);
  return (
    <div>
      {board.isGuest ? (
        <div style={{ ...glass, padding: "14px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", borderColor: `${CYAN}44` }}>
          <span style={{ fontSize: 22 }}>🏆</span>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 700 }}>Sign up to see your rank and save your progress!</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>Guest scores aren&apos;t ranked on the {subj} leaderboard.</div>
          </div>
          <button onClick={onSignUp} style={loginBtn}>Sign up</button>
        </div>
      ) : board.currentUserRank ? (
        <div style={{ ...glass, padding: "14px 18px", marginBottom: 12, borderColor: `${ACCENT}55`, fontWeight: 700 }}>
          🎉 You&apos;re <span style={{ color: CYAN }}>#{board.currentUserRank}</span> in {subj}! Keep it up.
        </div>
      ) : null}

      <div style={{ ...glass, padding: 8 }}>
        <div style={{ padding: "6px 14px 10px", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          {subj} leaderboard · top {board.leaderboard.length}
        </div>
        {board.leaderboard.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>No ranked players yet — be the first!</div>
        ) : board.leaderboard.map((u) => {
          const isMe = u.id === meId;
          return (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: isMe ? `${ACCENT}22` : "transparent" }}>
              <div style={{ width: 28, textAlign: "center", fontWeight: 800, color: u.rank <= 3 ? "#f5a623" : "#64748b" }}>{u.rank}</div>
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
    </div>
  );
}

// ── Placement test ──
function PlacementBanner({ busy, onStart, onSkip }: { busy: boolean; onStart: () => void; onSkip: () => void }) {
  return (
    <div style={{ ...glass, padding: "14px 18px", marginBottom: 12, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderColor: `${ACCENT}55` }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700 }}>New here? Take a quick placement check.</div>
        <div style={{ fontSize: 13, color: "#94a3b8" }}>A few questions to start you at the right level — or skip and begin from the top.</div>
      </div>
      <button onClick={onStart} disabled={busy} style={loginBtn}>Take placement</button>
      <button onClick={onSkip} disabled={busy} style={ghostBtn}>Skip</button>
    </div>
  );
}

function PlacementView({ subject, prob, result, busy, onAnswer, onSkip, onDone }: {
  subject: Subject; prob: PlacementProbe | null; result: PlacementResult | null; busy: boolean;
  onAnswer: (a: string) => void; onSkip: () => void; onDone: () => void;
}) {
  const [input, setInput] = useState("");
  const token = prob?.problem.token;
  useEffect(() => { setInput(""); }, [token]);

  if (result) {
    return (
      <div style={{ ...glass, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CYAN, letterSpacing: 1, textTransform: "uppercase" }}>Placement complete</div>
        <h2 style={{ margin: "8px 0 6px", fontSize: 24 }}>You&apos;re starting at Level {result.placedLevel}</h2>
        <p style={{ color: "#94a3b8", margin: "0 0 18px", fontSize: 14 }}>
          {result.clearedStages ? <>We cleared <b style={{ color: "#e2e8f0" }}>{result.clearedStages}</b> {cap(subject)} levels you&apos;ve already mastered{result.xpAwarded ? <> and banked <b style={{ color: "#e2e8f0" }}>+{result.xpAwarded} XP</b></> : null}.</> : <>We&apos;ll start you from the beginning — let&apos;s build it up!</>}
        </p>
        <button onClick={onDone} style={{ ...primaryBtn, minWidth: 180 }}>Start playing →</button>
      </div>
    );
  }
  if (!prob) return <div style={{ ...glass, padding: 30, textAlign: "center", color: "#94a3b8" }}>Starting placement…</div>;

  const p = prob.problem;
  const pct = Math.round(((prob.level - 1) / Math.max(1, prob.maxLevel)) * 100);
  return (
    <div style={{ ...glass, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ ...pill, background: CYAN, color: "#06281c" }}>PLACEMENT</span>
        <h2 style={{ margin: 0, fontSize: 17 }}>{cap(subject)} · Level {prob.level} of {prob.maxLevel}</h2>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginTop: 14 }}>
        <span>Finding your level…</span><span>{pct}%</span>
      </div>
      <div style={barOuter}><div style={{ ...barInner, width: `${pct}%` }} /></div>

      <div style={{ fontSize: 26, fontWeight: 700, textAlign: "center", margin: "26px 0 22px" }}>{p.prompt}</div>

      {p.inputType === "multiple-choice" && p.choices ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {p.choices.map((c) => (
            <button key={c.id} disabled={busy} onClick={() => onAnswer(c.id)} style={choiceBtn}>{c.label}</button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAnswer(input)}
            placeholder={p.inputType === "fraction" ? "e.g. 5/6" : "Your answer"} disabled={busy} autoFocus style={inputBox} />
          <button onClick={() => onAnswer(input)} disabled={busy} style={primaryBtn}>Submit</button>
        </div>
      )}

      <p style={{ fontSize: 12, color: "#64748b", marginTop: 14, textAlign: "center" }}>
        Answer as many as you can — we stop when it gets too tricky.{" "}
        <button onClick={onSkip} disabled={busy} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Skip placement</button>
      </p>
    </div>
  );
}

// ── Login dialog ──
function LoginDialog(props: {
  name: string; setName: (s: string) => void;
  email: string; setEmail: (s: string) => void; pw: string; setPw: (s: string) => void;
  err: string | null; busy: boolean; onEmail: () => void; onGoogle: () => void; onGuest: () => void; onClose: () => void;
}) {
  const configured = isFirebaseConfigured();
  const named = props.name.trim().length > 0;
  return (
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, background: "rgba(2,4,10,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16, animation: "yl-fade .25s ease both" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ ...glass, width: 380, maxWidth: "100%", padding: 26, animation: "yl-pop .3s cubic-bezier(.2,.9,.3,1.2) both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
              {named ? <>Hi, <span style={{ color: CYAN }}>{props.name.trim().split(/\s+/)[0]}</span>!</> : "Welcome to Young Learners"}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13.5 }}>
              {named ? "Log in to save your progress, or jump right in." : "What should we call you?"}
            </p>
          </div>
          <button onClick={props.onClose} style={{ ...ghostBtn, padding: "2px 10px" }}>✕</button>
        </div>

        <label style={{ display: "block", fontSize: 12, color: "#94a3b8", margin: "16px 0 6px", fontWeight: 600 }}>Your name</label>
        <input
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          placeholder="e.g. Alex"
          autoFocus
          style={{ ...inputBox, width: "100%", marginBottom: 14 }}
        />

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "2px 0 14px" }} />

        <label style={{ display: "block", fontSize: 12, color: "#94a3b8", margin: "0 0 6px", fontWeight: 600 }}>
          Log in with email {!configured && <span style={{ color: "#f59e0b" }}>(needs Firebase setup)</span>}
        </label>
        <input value={props.email} onChange={(e) => props.setEmail(e.target.value)} placeholder="Email" disabled={!configured} style={{ ...inputBox, width: "100%", marginBottom: 8, opacity: configured ? 1 : 0.5 }} />
        <input value={props.pw} onChange={(e) => props.setPw(e.target.value)} type="password" placeholder="Password" disabled={!configured} onKeyDown={(e) => e.key === "Enter" && configured && props.onEmail()} style={{ ...inputBox, width: "100%", marginBottom: 12, opacity: configured ? 1 : 0.5 }} />
        {props.err && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{props.err}</div>}
        <button onClick={props.onEmail} disabled={!configured || props.busy} style={{ ...primaryBtn, width: "100%", marginBottom: 8, opacity: configured ? 1 : 0.5, cursor: configured ? "pointer" : "not-allowed" }}>
          Log in / Sign up with Email
        </button>
        <button onClick={props.onGoogle} disabled={!configured || props.busy} style={{ ...ghostBtn, width: "100%", marginBottom: 14, opacity: configured ? 1 : 0.5, cursor: configured ? "pointer" : "not-allowed" }}>
          Continue with Google
        </button>

        <button onClick={props.onGuest} disabled={props.busy} style={{ ...primaryBtn, width: "100%", background: configured ? "rgba(255,255,255,0.06)" : ACCENT, color: configured ? "#cbd5e1" : "#fff", border: configured ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
          {named ? `Start learning as ${props.name.trim().split(/\s+/)[0]} →` : "Continue as guest →"}
        </button>
        <p style={{ textAlign: "center", color: "#64748b", fontSize: 12, margin: "10px 0 0" }}>
          Guest progress is saved on this device.
        </p>
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
