import { getGoal, getAllCheckIns, getLastSevenCheckIns, type CheckIn } from "./storage";

// ── Streak ────────────────────────────────────────────────────────────────────

export function getCurrentStreak(): number {
  const checkIns = getAllCheckIns();
  if (!checkIns.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < checkIns.length; i++) {
    const d = new Date(checkIns[i].date);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === i && checkIns[i].score >= 2) streak++;
    else break;
  }
  return streak;
}

// ── Success probability — 0–95% ───────────────────────────────────────────────
// Mirrors calculateSuccessProbability() from streak.ts in the spec

export function calculateSuccessProbability(): number {
  const checkIns = getAllCheckIns();
  const goal = getGoal();
  if (!checkIns.length || !goal) return 50;

  // 1. Adherence rate (base probability)
  const totalPossible = checkIns.length * 3;
  const totalDone = checkIns.reduce((sum, c) => sum + c.score, 0);
  const adherence = totalDone / totalPossible;
  const baseProbability = adherence * 100;

  // 2. Streak bonus (up to +10)
  const streak = getCurrentStreak();
  const streakBonus = Math.min(Math.floor(streak / 7) * 2, 10);

  // 3. Time remaining factor
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const daysRemaining = Math.floor(
    (targetDate.getTime() - today.getTime()) / 86400000
  );
  const timePenalty = daysRemaining < 30 ? 10 : 0;

  // 4. Consistency bonus — reward 7 consecutive days with score >= 2
  const recent = getLastSevenCheckIns();
  const allDone = recent.length === 7 && recent.every((c) => c.score >= 2);
  const consistencyBonus = allDone ? 5 : 0;

  const probability =
    baseProbability + streakBonus + consistencyBonus - timePenalty;
  return Math.max(10, Math.min(95, Math.round(probability)));
}

// ── Days remaining ────────────────────────────────────────────────────────────

export function getDaysRemaining(): number {
  const goal = getGoal();
  if (!goal) return 0;
  const diff = new Date(goal.targetDate).getTime() - new Date().getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

// ── Weekly completion rate ────────────────────────────────────────────────────

export function weeklyRate(): number {
  const last7 = getLastSevenCheckIns();
  if (!last7.length) return 0;
  const total = last7.reduce((s, c) => s + c.score, 0);
  return Math.round((total / (last7.length * 3)) * 100);
}

// ── Week grid (last 7 days Mon→Sun) ──────────────────────────────────────────

export function getWeekGrid(): { label: string; status: "done" | "missed" | "future" }[] {
  const checkIns = getAllCheckIns();
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    if (d > today) return { label, status: "future" as const };
    const ci = checkIns.find((c) => c.date === dateStr);
    return {
      label,
      status: ci && ci.score >= 2 ? ("done" as const) : ("missed" as const),
    };
  });
}
