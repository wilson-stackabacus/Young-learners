import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveUser } from "@/lib/auth";
import type { Subject } from "@/shared/contract";

export const dynamic = "force-dynamic";

const SUBJECTS: Subject[] = ["math", "english", "reading", "science"];

// Stage-number range that belongs to each subject (math 1–999, english 1001–1999, …).
const RANGE: Record<Subject, { gte: number; lt: number }> = {
  math: { gte: 1, lt: 1000 },
  english: { gte: 1000, lt: 2000 },
  reading: { gte: 2000, lt: 3000 },
  science: { gte: 3000, lt: 4000 },
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/**
 * GET /api/progress?subject=…
 * Everything the Progress tab shows, aggregated from REAL play data:
 * XP + streak, accuracy, levels cleared, per-world mastery, a 7-day XP
 * sparkline, and earned badges. No placeholder values.
 */
export async function GET(req: Request) {
  const param = new URL(req.url).searchParams.get("subject") as Subject | null;
  const subject: Subject = param && SUBJECTS.includes(param) ? param : "math";
  const u = await resolveUser(req);
  const range = RANGE[subject];

  const [sp, levels, progressRows, attempts, userBadges] = await Promise.all([
    prisma.subjectProgress.findUnique({ where: { userId_subject: { userId: u.id, subject } } }),
    prisma.level.findMany({ where: { subject }, select: { stage: true, world: true, isBoss: true } }),
    prisma.levelProgress.findMany({
      where: { userId: u.id, stage: { gte: range.gte, lt: range.lt } },
      select: { stage: true, status: true, stars: true, totalCorrect: true, totalAttempts: true },
    }),
    prisma.attempt.findMany({
      where: { userId: u.id, stage: { gte: range.gte, lt: range.lt }, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
      select: { correct: true, xpAwarded: true, createdAt: true },
    }),
    prisma.userBadge.findMany({ where: { userId: u.id }, include: { badge: true }, orderBy: { unlockedAt: "asc" } }),
  ]);

  // Per-world mastery (cleared / total + stars).
  const worldOf = new Map(levels.map((l) => [l.stage, l.world]));
  const totalByWorld = new Map<string, number>();
  for (const l of levels) totalByWorld.set(l.world, (totalByWorld.get(l.world) ?? 0) + 1);
  const clearedByWorld = new Map<string, number>();
  const starsByWorld = new Map<string, number>();
  let cleared = 0;
  let stars = 0;
  for (const p of progressRows) {
    if (p.status === "cleared") {
      cleared++;
      const w = worldOf.get(p.stage);
      if (w) clearedByWorld.set(w, (clearedByWorld.get(w) ?? 0) + 1);
    }
    stars += p.stars;
    const w = worldOf.get(p.stage);
    if (w) starsByWorld.set(w, (starsByWorld.get(w) ?? 0) + p.stars);
  }
  const worlds = [...totalByWorld.entries()].map(([id, total]) => ({
    id,
    total,
    cleared: clearedByWorld.get(id) ?? 0,
    stars: starsByWorld.get(id) ?? 0,
  }));

  // Accuracy over recorded attempts (rolling, all-time for this subject).
  const totalAttempts = progressRows.reduce((a, p) => a + p.totalAttempts, 0);
  const totalCorrect = progressRows.reduce((a, p) => a + p.totalCorrect, 0);
  const accuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  // 7-day XP sparkline (oldest → today).
  const today = new Date();
  const days: { day: string; label: string; xp: number; solved: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 864e5);
    days.push({ day: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: "short" }), xp: 0, solved: 0 });
  }
  const dayIndex = new Map(days.map((d, i) => [d.day, i]));
  for (const a of attempts) {
    const idx = dayIndex.get(dayKey(new Date(a.createdAt)));
    if (idx === undefined) continue;
    days[idx].xp += a.xpAwarded;
    if (a.correct) days[idx].solved += 1;
  }

  return NextResponse.json({
    subject,
    totalXp: sp?.totalXp ?? 0,
    currentStreak: sp?.currentStreak ?? 0,
    longestStreak: sp?.longestStreak ?? 0,
    levelsCleared: cleared,
    levelsTotal: levels.length,
    stars,
    totalSolved: totalCorrect,
    totalAttempts,
    accuracy,
    weekly: days,
    worlds,
    badges: userBadges.map((ub) => ({
      slug: ub.badge.slug,
      name: ub.badge.name,
      description: ub.badge.description,
      tier: ub.badge.tier,
      earnedAt: ub.unlockedAt,
    })),
  });
}
