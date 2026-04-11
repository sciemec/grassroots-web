// THUTO Success Engine — browser storage layer
// All data stays in localStorage — works offline, no backend needed

export interface Goal {
  id: string;
  goalText: string;
  whyText: string;
  targetDate: string;   // YYYY-MM-DD
  createdAt: string;    // YYYY-MM-DD
  actions: string[];    // 3 auto-assigned daily actions
  reminderHour: number;
  reminderMinute: number;
}

export interface CheckIn {
  date: string;         // YYYY-MM-DD
  action1: boolean;
  action2: boolean;
  action3: boolean;
  score: number;        // 0–3 (count of actions done)
  timestamp: number;
}

// ── Goal ──────────────────────────────────────────────────────────────────────

export function saveGoal(goal: Goal): void {
  localStorage.setItem("thuto_goal", JSON.stringify(goal));
}

export function getGoal(): Goal | null {
  const raw = localStorage.getItem("thuto_goal");
  return raw ? (JSON.parse(raw) as Goal) : null;
}

export function hasGoal(): boolean {
  return !!localStorage.getItem("thuto_goal");
}

export function clearGoal(): void {
  localStorage.removeItem("thuto_goal");
}

// ── Check-ins ─────────────────────────────────────────────────────────────────

export function saveCheckIn(checkIn: CheckIn): void {
  const all = getAllCheckIns().filter((c) => c.date !== checkIn.date);
  all.unshift(checkIn); // newest first
  localStorage.setItem("thuto_checkins", JSON.stringify(all));
}

export function getAllCheckIns(): CheckIn[] {
  const raw = localStorage.getItem("thuto_checkins");
  return raw ? (JSON.parse(raw) as CheckIn[]) : [];
}

export function getTodayCheckIn(): CheckIn | null {
  const today = new Date().toISOString().split("T")[0];
  return getAllCheckIns().find((c) => c.date === today) ?? null;
}

export function getLastSevenCheckIns(): CheckIn[] {
  return getAllCheckIns().slice(0, 7);
}

export function hasCheckedInToday(): boolean {
  return !!getTodayCheckIn();
}

// ── Adjustment engine state ───────────────────────────────────────────────────

export function shouldShowAdjustment(): boolean {
  const last3 = getAllCheckIns().slice(0, 3);
  if (last3.length < 3) return false;
  return last3.every((c) => c.score / 3 < 0.7);
}

export function saveAdjustmentSeen(): void {
  const week = getISOWeek();
  localStorage.setItem("thuto_adjust_seen", week);
}

export function hasSeenAdjustmentThisWeek(): boolean {
  return localStorage.getItem("thuto_adjust_seen") === getISOWeek();
}

function getISOWeek(): string {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${week}`;
}

// ── Weekly report ─────────────────────────────────────────────────────────────

export function getWeeklyReportData() {
  const last7 = getLastSevenCheckIns();
  const goal = getGoal();
  if (!last7.length || !goal) return null;

  const totalPossible = last7.length * 3;
  const totalDone = last7.reduce((s, c) => s + c.score, 0);
  const completionRate = Math.round((totalDone / totalPossible) * 100);

  const action1Done = last7.filter((c) => c.action1).length;
  const action2Done = last7.filter((c) => c.action2).length;
  const action3Done = last7.filter((c) => c.action3).length;
  const scores = [action1Done, action2Done, action3Done];
  const maxIdx = scores.indexOf(Math.max(...scores));
  const minIdx = scores.indexOf(Math.min(...scores));

  return {
    completionRate,
    totalDone,
    totalPossible,
    strongestAction: goal.actions[maxIdx] ?? "Action 1",
    weakestAction: goal.actions[minIdx] ?? "Action 3",
    strongestDays: scores[maxIdx],
    weakestDays: scores[minIdx],
  };
}
