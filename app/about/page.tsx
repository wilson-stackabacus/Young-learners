import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "About · Young Learners",
  description: "The story, the product, and the technology behind Young Learners — adaptive, gamified K–8 learning.",
};

const ACCENT = "#7c5cff";
const CYAN = "#22d3ee";

const glass: CSSProperties = {
  background: "rgba(19,23,34,0.55)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  backdropFilter: "blur(12px)",
};

const HOW = [
  { icon: "🎯", title: "Placement, then precision", body: "Every learner starts on a 247-stage ladder per subject. The engine watches accuracy and pace, then serves the next problem at exactly the right difficulty — never too easy, never crushing." },
  { icon: "🧠", title: "Mistakes become lessons", body: "Wrong answers are matched against a library of common misconceptions. Instead of just 'incorrect,' learners get a targeted hint that addresses the specific thinking error." },
  { icon: "⚔️", title: "Boss battles & streaks", body: "Skills are gated behind boss levels with hearts and HP. Daily streaks, XP, stars, and badges turn consistent practice into a game kids actually want to return to." },
  { icon: "📈", title: "Progress you can see", body: "A live progress dashboard tracks XP over time, per-world mastery, accuracy, and earned badges — giving learners (and parents) a real picture of growth." },
];

const STACK = [
  { group: "Frontend", items: ["Next.js 14 (App Router)", "React 18", "TypeScript", "Tailwind CSS"] },
  { group: "Backend", items: ["Next.js Route Handlers", "Prisma ORM", "Adaptive level engine", "Server-side answer checking"] },
  { group: "Data", items: ["libSQL / Turso (edge SQLite)", "Per-subject progress model", "Attempt + badge ledger"] },
  { group: "Auth & AI", items: ["Firebase Authentication", "Google + email sign-in", "Gemini-assisted hints", "Guest mode"] },
];

const SUBJECTS = [
  { icon: "🔢", name: "Math", detail: "Arithmetic → Algebra I" },
  { icon: "📖", name: "English", detail: "Grammar & vocabulary" },
  { icon: "📚", name: "Reading", detail: "Comprehension & context" },
  { icon: "🔬", name: "Science", detail: "Core concepts K–8" },
];

const METRICS = [
  { value: "4", label: "Subjects" },
  { value: "247", label: "Stages / subject" },
  { value: "23", label: "Skill strands" },
  { value: "8", label: "Earnable badges" },
];

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 24px 80px", color: "#e2e8f0" }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>Young Learners</div>
        <Link href="/" style={{ ...glass, padding: "8px 16px", textDecoration: "none", color: "#cbd5e1", fontWeight: 600, fontSize: 14 }}>
          ← Back to app
        </Link>
      </div>

      {/* Hero */}
      <section style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 999, background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, color: CYAN, fontSize: 13, fontWeight: 700, marginBottom: 18 }}>
          Adaptive learning, gamified
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, margin: "0 0 16px", letterSpacing: -1 }}>
          We turn K–8 practice into a game<br />kids <span style={{ color: CYAN }}>choose</span> to play.
        </h1>
        <p style={{ fontSize: 17, color: "#94a3b8", maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
          Young Learners is an adaptive learning platform that meets every student exactly where they are —
          adjusting difficulty in real time, turning mistakes into targeted coaching, and wrapping it all in
          a progression system that keeps learners coming back.
        </p>
      </section>

      {/* Metrics */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 44 }}>
        {METRICS.map((m) => (
          <div key={m.label} style={{ ...glass, padding: "20px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: ACCENT }}>{m.value}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </section>

      {/* Story */}
      <section style={{ ...glass, padding: 30, marginBottom: 44 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 16px" }}>The story</h2>
        <div style={{ color: "#cbd5e1", fontSize: 15.5, lineHeight: 1.7, display: "grid", gap: 14 }}>
          <p style={{ margin: 0 }}>
            Most learning apps fail the same way: they teach to the middle. The strong kids get bored, the
            struggling kids fall behind, and everyone quits. Worksheets don&apos;t adapt, and a red &quot;X&quot;
            never tells a child <i>why</i> they were wrong.
          </p>
          <p style={{ margin: 0 }}>
            Young Learners was built on a simple belief: <b style={{ color: "#e2e8f0" }}>every learner deserves a path
            built for them.</b> Our engine measures each student&apos;s accuracy and pace on every problem and
            continuously re-calibrates — keeping them in the productive zone where real learning happens.
          </p>
          <p style={{ margin: 0 }}>
            And because motivation is half the battle, we borrowed the best mechanics from games kids already
            love: a world map to conquer, boss battles that gate mastery, streaks that reward showing up, and
            badges worth earning. The result is practice that feels like play.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 18px", textAlign: "center" }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 14 }}>
          {HOW.map((h) => (
            <div key={h.title} style={{ ...glass, padding: 22 }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>{h.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{h.title}</h3>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 14, lineHeight: 1.6 }}>{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 18px", textAlign: "center" }}>Four subjects, one ladder each</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 12 }}>
          {SUBJECTS.map((s) => (
            <div key={s.name} style={{ ...glass, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 30 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ marginBottom: 44 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 18px", textAlign: "center" }}>Built on a modern stack</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 14 }}>
          {STACK.map((s) => (
            <div key={s.group} style={{ ...glass, padding: 22 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: CYAN, margin: "0 0 12px" }}>{s.group}</h3>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 8 }}>
                {s.items.map((it) => (
                  <li key={it} style={{ fontSize: 14, color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: ACCENT, flex: "0 0 auto" }} />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...glass, padding: 36, textAlign: "center", borderColor: `${ACCENT}55`, background: `linear-gradient(135deg, ${ACCENT}1a, rgba(19,23,34,0.55))` }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: "0 0 10px" }}>See it in action</h2>
        <p style={{ color: "#94a3b8", margin: "0 0 22px", fontSize: 15 }}>
          Jump into the live product — no signup required to start playing.
        </p>
        <Link href="/" style={{ display: "inline-block", background: `linear-gradient(90deg,${ACCENT},#9b8cff)`, color: "#fff", padding: "12px 28px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
          Launch Young Learners →
        </Link>
      </section>

      <footer style={{ textAlign: "center", color: "#64748b", fontSize: 13, marginTop: 40 }}>
        Young Learners · Adaptive K–8 learning, gamified.
      </footer>
    </div>
  );
}
