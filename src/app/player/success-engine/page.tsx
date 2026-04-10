"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Flame, Target, CheckCircle2, Circle, Bell, BellOff, Trophy,
  TrendingUp, ChevronLeft, Pencil, Save, X, Plus, Trash2,
  Clock, CalendarDays, Zap, Brain,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Sidebar } from "@/components/layout/sidebar";

// ── Types — mirror SuccessDatabase entities ───────────────────────────────────

/** Mirrors Goal.java entity */
interface Goal {
  id: string;
  goalText: string;
  targetDate: string;      // YYYY-MM-DD
  createdAt: string;
  isActive: boolean;
  successProbability: number; // 0-100, recalculated on each check-in
}

/** Mirrors DailyAction entity — recurring habits */
interface DailyAction {
  id: string;
  label: string;
}

/** Mirrors CheckIn.java entity:
 *  goalId links check-in to the active goal.
 *  action1/2/3Completed are the 3 DailyActions ticked off.
 *  dailyScore = count of actions done (0-3).
 *  thutoMessage = AI response for the day. */
interface CheckIn {
  goalId: string;
  date: string;
  action1Completed: boolean;
  action2Completed: boolean;
  action3Completed: boolean;
  dailyScore: number;       // 0-3
  thutoMessage: string;
  mood: number;             // 1-10 (kept alongside goal check-in)
  moodNote: string;
  timestamp: string;
}

// ── localStorage keys ─────────────────────────────────────────────────────────

const GOALS_KEY      = "thuto_goals_list";      // Goal[]
const ACTIVE_KEY     = "thuto_active_goal_id";  // string
const ACTIONS_KEY    = "thuto_daily_actions";   // DailyAction[]
const STREAK_KEY     = "thuto_streak";
const BEST_KEY       = "thuto_streak_best";
const TOTAL_KEY      = "thuto_checkin_total";
const NOTIF_KEY      = "thuto_notif_enabled";
const NOTIF_TIME_KEY = "thuto_notif_time";

function checkinKey(date: string) { return `thuto_checkin_${date}`; }
function notifSentKey(date: string) { return `thuto_notif_sent_${date}`; }

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}
function daysRemaining(targetDate: string): number {
  const diff = new Date(targetDate).getTime() - new Date(todayStr()).getTime();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}
function shortDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]} ${d.getDate()}`;
}

// ── Streak ────────────────────────────────────────────────────────────────────

function recalcStreak(): number {
  let s = 0;
  for (let i = 0; i < 365; i++) {
    if (localStorage.getItem(checkinKey(daysAgoStr(i)))) s++;
    else break;
  }
  return s;
}

// ── Success probability — mirrors the field in Goal.java ─────────────────────
// Formula: (check-ins done / total days since goal created) * consistency bonus

function calcSuccessProbability(goal: Goal): number {
  const created  = new Date(goal.createdAt);
  const target   = new Date(goal.targetDate);
  const today    = new Date(todayStr());
  const totalDays = Math.max(1, Math.ceil((target.getTime() - created.getTime()) / 86_400_000));
  const elapsed   = Math.max(0, Math.ceil((today.getTime() - created.getTime()) / 86_400_000));

  let checkedIn = 0;
  let totalScore = 0;
  for (let i = 0; i < elapsed; i++) {
    const raw = localStorage.getItem(checkinKey(daysAgoStr(i)));
    if (raw) {
      const ci: CheckIn = JSON.parse(raw);
      if (ci.goalId === goal.id) {
        checkedIn++;
        totalScore += ci.dailyScore;
      }
    }
  }

  if (elapsed === 0) return 50; // neutral on day 0
  const consistency  = checkedIn / elapsed;           // 0-1
  const avgScore     = checkedIn > 0 ? totalScore / (checkedIn * 3) : 0; // 0-1
  const timeLeft     = daysRemaining(goal.targetDate) / Math.max(1, totalDays);
  const raw = (consistency * 0.5 + avgScore * 0.3 + (timeLeft > 0 ? 0.2 : 0)) * 100;
  return Math.min(99, Math.max(1, Math.round(raw)));
}

// ── Motivational messages ─────────────────────────────────────────────────────

function getBannerMessage(streak: number): string {
  if (streak === 0)
    return "Your daily check-in is ready. 30 seconds to keep your goal alive. Mangwanani!";
  if (streak < 7)
    return `Day ${streak} streak 🔥 Champions show up every day. Keep going.`;
  if (streak < 30)
    return `${streak} days strong! Ramba uchishanda — you're building something real. Don't break the chain.`;
  return `${streak} day streak! 🏆 Unokwanisa — you're in the top 10% of all THUTO athletes.`;
}

// ── Mood helpers ──────────────────────────────────────────────────────────────

function moodEmoji(s: number) {
  if (s <= 2) return "😞";
  if (s <= 4) return "😐";
  if (s <= 6) return "🙂";
  if (s <= 8) return "😊";
  return "🔥";
}
function moodLabel(s: number) {
  if (s <= 2) return "Struggling";
  if (s <= 4) return "Below par";
  if (s <= 6) return "Okay";
  if (s <= 8) return "Good";
  return "On fire";
}
function moodBg(s: number) {
  if (s <= 2) return "from-red-900/40 to-red-800/20";
  if (s <= 4) return "from-orange-900/40 to-orange-800/20";
  if (s <= 6) return "from-yellow-900/40 to-yellow-800/20";
  if (s <= 8) return "from-green-900/40 to-green-800/20";
  return "from-emerald-900/50 to-emerald-700/30";
}
function moodChartColor(s: number) {
  if (s <= 2) return "#ef4444";
  if (s <= 4) return "#f97316";
  if (s <= 6) return "#eab308";
  if (s <= 8) return "#22c55e";
  return "#10b981";
}

// ── Notification helpers ──────────────────────────────────────────────────────

function msUntilTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const t = new Date(now);
  t.setHours(h, m, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  return t.getTime() - now.getTime();
}
function isPastNotifTime(hhmm: string): boolean {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
}
async function fireNotif(streak: number): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "denied") return;
  if (localStorage.getItem(notifSentKey(todayStr()))) return;
  const p: NotificationPermission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (p !== "granted") return;
  new Notification("THUTO Daily Check-In ⚽", {
    body: getBannerMessage(streak),
    icon: "/icons/icon-192x192.png",
  });
  localStorage.setItem(notifSentKey(todayStr()), "1");
}

// ── Default daily actions ─────────────────────────────────────────────────────

const DEFAULT_ACTIONS: DailyAction[] = [
  { id: "a1", label: "Morning stretch (10 min)" },
  { id: "a2", label: "Drink 2L water" },
  { id: "a3", label: "Watch 1 training video" },
];

// ── Probability colour ────────────────────────────────────────────────────────

function probColor(p: number) {
  if (p >= 75) return "bg-emerald-500";
  if (p >= 50) return "bg-yellow-500";
  if (p >= 25) return "bg-orange-500";
  return "bg-red-500";
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuccessEnginePage() {
  const today = todayStr();

  const [hydrated,    setHydrated]    = useState(false);
  const [streak,      setStreak]      = useState(0);
  const [bestStreak,  setBestStreak]  = useState(0);
  const [totalCIs,    setTotalCIs]    = useState(0);

  // Goals
  const [goals,       setGoals]       = useState<Goal[]>([]);
  const [activeGoal,  setActiveGoal]  = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");

  // Daily actions
  const [actions,      setActions]      = useState<DailyAction[]>([]);
  const [editActions,  setEditActions]  = useState(false);
  const [newActText,   setNewActText]   = useState("");

  // Today's check-in
  const [todayCi,    setTodayCi]     = useState<CheckIn | null>(null);
  const [moodScore,  setMoodScore]   = useState(7);
  const [moodNote,   setMoodNote]    = useState("");
  const [actDone,    setActDone]     = useState<boolean[]>([false, false, false]);
  const [submitting, setSubmitting]  = useState(false);
  const [thutoTyping, setThutoTyping] = useState(false);

  // Mood history
  const [moodHistory, setMoodHistory] = useState<{ date: string; mood: number; label: string }[]>([]);

  // Notification settings
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime,    setNotifTime]    = useState("07:00");
  const [showSettings, setShowSettings] = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setStreak(parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10));
    setBestStreak(parseInt(localStorage.getItem(BEST_KEY) ?? "0", 10));
    setTotalCIs(parseInt(localStorage.getItem(TOTAL_KEY) ?? "0", 10));
    setNotifEnabled(localStorage.getItem(NOTIF_KEY) === "1");
    setNotifTime(localStorage.getItem(NOTIF_TIME_KEY) ?? "07:00");

    // Goals
    const rawGoals = localStorage.getItem(GOALS_KEY);
    const allGoals: Goal[] = rawGoals ? JSON.parse(rawGoals) : [];
    setGoals(allGoals);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    const active = allGoals.find((g) => g.id === activeId && g.isActive) ?? null;
    setActiveGoal(active);

    // Actions
    const rawActs = localStorage.getItem(ACTIONS_KEY);
    setActions(rawActs ? JSON.parse(rawActs) : DEFAULT_ACTIONS);

    // Today's check-in
    const rawCi = localStorage.getItem(checkinKey(today));
    if (rawCi) setTodayCi(JSON.parse(rawCi));

    // 7-day mood history
    const hist = Array.from({ length: 7 }, (_, i) => {
      const r = localStorage.getItem(checkinKey(daysAgoStr(i)));
      if (!r) return null;
      const c: CheckIn = JSON.parse(r);
      return { date: shortDate(daysAgoStr(i)), mood: c.mood, label: moodLabel(c.mood) };
    }).filter(Boolean).reverse() as { date: string; mood: number; label: string }[];
    setMoodHistory(hist);

    setHydrated(true);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  // Auto-fire notification
  useEffect(() => {
    if (!hydrated || todayCi) return;
    const time = localStorage.getItem(NOTIF_TIME_KEY) ?? "07:00";
    if (localStorage.getItem(NOTIF_KEY) !== "1") return;
    if (isPastNotifTime(time)) fireNotif(streak);
  }, [hydrated, todayCi, streak]);

  // ── Create goal ───────────────────────────────────────────────────────────

  function createGoal() {
    if (!newGoalText.trim() || !newGoalDate) return;
    // Deactivate previous active goal
    const updated = goals.map((g) => ({ ...g, isActive: false }));
    const goal: Goal = {
      id: Date.now().toString(),
      goalText: newGoalText.trim(),
      targetDate: newGoalDate,
      createdAt: todayStr(),
      isActive: true,
      successProbability: 50,
    };
    const next = [...updated, goal];
    localStorage.setItem(GOALS_KEY, JSON.stringify(next));
    localStorage.setItem(ACTIVE_KEY, goal.id);
    setGoals(next); setActiveGoal(goal);
    setNewGoalText(""); setNewGoalDate("");
    setEditingGoal(false);
  }

  // ── Submit check-in (mirrors CheckInDao.insert) ───────────────────────────

  async function submitCheckIn() {
    if (!activeGoal) return;
    setSubmitting(true);

    const dailyScore = actDone.filter(Boolean).length;

    // Build CheckIn record (matches CheckIn.java fields)
    const ci: CheckIn = {
      goalId: activeGoal.id,
      date: today,
      action1Completed: actDone[0],
      action2Completed: actDone[1],
      action3Completed: actDone[2],
      dailyScore,
      thutoMessage: "",        // filled by AI below
      mood: moodScore,
      moodNote: moodNote,
      timestamp: new Date().toISOString(),
    };

    // Persist immediately — AI response fills in thutoMessage after
    localStorage.setItem(checkinKey(today), JSON.stringify(ci));

    // Streak + totals
    const ns = recalcStreak();
    const nb = Math.max(ns, bestStreak);
    const nt = totalCIs + 1;
    localStorage.setItem(STREAK_KEY, String(ns));
    localStorage.setItem(BEST_KEY,   String(nb));
    localStorage.setItem(TOTAL_KEY,  String(nt));
    setStreak(ns); setBestStreak(nb); setTotalCIs(nt);

    // Update successProbability on the goal
    const newProb = calcSuccessProbability(activeGoal);
    const updatedGoals = goals.map((g) =>
      g.id === activeGoal.id ? { ...g, successProbability: newProb } : g
    );
    localStorage.setItem(GOALS_KEY, JSON.stringify(updatedGoals));
    setGoals(updatedGoals);
    setActiveGoal((g) => g ? { ...g, successProbability: newProb } : null);

    setTodayCi(ci);
    setSubmitting(false);

    // ── Get THUTO's message for the day (mirrors thutoMessage field) ──────
    setThutoTyping(true);
    try {
      const actionLabels = [0, 1, 2].map((i) => ({
        label: actions[i]?.label ?? `Action ${i + 1}`,
        done: actDone[i],
      }));
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `The player just completed their daily THUTO check-in.
Goal: "${activeGoal.goalText}" (due ${activeGoal.targetDate}, ${daysRemaining(activeGoal.targetDate)} days left)
Today's score: ${dailyScore}/3
Actions: ${actionLabels.map((a) => `${a.done ? "✓" : "✗"} ${a.label}`).join(", ")}
Mood: ${moodScore}/10 (${moodLabel(moodScore)})
Streak: ${ns} days
Success probability: ${newProb}%

Give a short, personalised THUTO coaching response (2-3 sentences max).
Be warm, direct, Zimbabwean in spirit. Use one Shona word naturally if it fits.
${dailyScore === 3 ? "They completed everything — celebrate them!" : dailyScore === 0 ? "They checked in but didn't complete actions — be supportive, not harsh." : "They did some actions — acknowledge what they did and encourage the rest."}`,
          system_prompt:
            "You are THUTO, a Zimbabwean AI sports coach. You are warm, direct, and genuinely care about the athlete. Keep responses short — 2-3 sentences. Never use bullet points.",
        }),
      });
      const data = await res.json();
      const msg: string = data.response ?? data.answer ?? "";
      if (msg) {
        const withMsg = { ...ci, thutoMessage: msg };
        localStorage.setItem(checkinKey(today), JSON.stringify(withMsg));
        setTodayCi(withMsg);
      }
    } catch {
      // thutoMessage stays empty — non-critical
    } finally {
      setThutoTyping(false);
    }
  }

  // ── Actions CRUD ──────────────────────────────────────────────────────────

  function addAction() {
    if (!newActText.trim()) return;
    const updated = [...actions, { id: Date.now().toString(), label: newActText.trim() }];
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(updated));
    setActions(updated); setNewActText("");
  }
  function removeAction(id: string) {
    const updated = actions.filter((a) => a.id !== id);
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(updated));
    setActions(updated);
  }

  // ── Notification settings ─────────────────────────────────────────────────

  function saveNotifSettings(enabled: boolean, time: string) {
    if (enabled) {
      localStorage.setItem(NOTIF_KEY, "1");
      localStorage.setItem(NOTIF_TIME_KEY, time);
      if (isPastNotifTime(time)) fireNotif(streak);
      else setTimeout(() => fireNotif(streak), msUntilTime(time));
    } else {
      localStorage.removeItem(NOTIF_KEY);
    }
    setNotifEnabled(enabled); setNotifTime(time);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-4">
          {[28, 40, 80, 60, 48, 120].map((h, i) => (
            <div key={i} style={{ height: h }} className="animate-pulse rounded-2xl bg-muted" />
          ))}
        </main>
      </div>
    );
  }

  const days = activeGoal ? daysRemaining(activeGoal.targetDate) : 0;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">

          {/* ── Header ─────────────────────────────────────── */}
          <div className="mb-5 flex items-center gap-3">
            <Link href="/player" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">THUTO Success Engine</h1>
              <p className="text-xs text-muted-foreground">Goal · Daily actions · Check-in · Streak</p>
            </div>
            <button onClick={() => setShowSettings((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {notifEnabled ? <Bell className="h-3.5 w-3.5 text-emerald-400" /> : <BellOff className="h-3.5 w-3.5" />}
              Reminders
            </button>
          </div>

          {/* ── Notification settings ──────────────────────── */}
          {showSettings && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily Reminder</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input type="time" value={notifTime} onChange={(e) => setNotifTime(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <button onClick={() => saveNotifSettings(true, notifTime)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors">
                  Save &amp; Enable
                </button>
                {notifEnabled && (
                  <button onClick={() => saveNotifSettings(false, notifTime)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Disable
                  </button>
                )}
              </div>
              {notifEnabled && <p className="mt-2 text-xs text-emerald-400">✓ Reminder set for {notifTime} daily</p>}
            </div>
          )}

          {/* ── Motivational banner ────────────────────────── */}
          <div className="mb-5 rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-[#1a3d26] to-[#0f2019] px-5 py-4">
            <p className="text-sm font-medium text-emerald-100">{getBannerMessage(streak)}</p>
          </div>

          {/* ── Stats strip ────────────────────────────────── */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatCard icon={<Flame className="h-4 w-4 text-orange-400" />} value={streak} label="Day streak" />
            <StatCard icon={<Trophy className="h-4 w-4 text-yellow-400" />} value={bestStreak} label="Best streak" />
            <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} value={totalCIs} label="Total check-ins" />
          </div>

          {/* ── Active goal card (Goal entity) ─────────────── */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Goal</p>
              <button onClick={() => setEditingGoal((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {editingGoal ? <><X className="h-3 w-3" />Cancel</> : <><Plus className="h-3 w-3" />New goal</>}
              </button>
            </div>

            {editingGoal ? (
              <div className="space-y-3">
                <input value={newGoalText} onChange={(e) => setNewGoalText(e.target.value)}
                  placeholder="My goal is…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <label className="text-sm text-muted-foreground">Target date</label>
                  <input type="date" value={newGoalDate} onChange={(e) => setNewGoalDate(e.target.value)}
                    min={todayStr()}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <button onClick={createGoal} disabled={!newGoalText.trim() || !newGoalDate}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-40">
                  Set Goal
                </button>
              </div>
            ) : activeGoal ? (
              <div>
                <p className="mb-3 text-base font-semibold text-foreground">&ldquo;{activeGoal.goalText}&rdquo;</p>
                <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {days > 0 ? `${days} days left` : "Deadline today"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-yellow-400" />
                    {activeGoal.successProbability}% success probability
                  </span>
                </div>
                {/* successProbability bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${probColor(activeGoal.successProbability)}`}
                    style={{ width: `${activeGoal.successProbability}%` }}
                  />
                </div>
              </div>
            ) : (
              <button onClick={() => setEditingGoal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-5 text-sm text-muted-foreground hover:border-emerald-700 hover:text-foreground transition-colors">
                <Target className="h-4 w-4" />Set your first goal
              </button>
            )}
          </div>

          {/* ── Daily check-in (CheckIn entity) ───────────── */}
          {todayCi ? (
            /* Already checked in — show result */
            <div className={`mb-5 rounded-2xl border border-white/10 bg-gradient-to-br ${moodBg(todayCi.mood)} px-5 py-4`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Check-In</p>
                <span className="rounded-full bg-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {todayCi.dailyScore}/3 done
                </span>
              </div>
              {/* Daily score dots */}
              <div className="mb-3 flex gap-2">
                {[todayCi.action1Completed, todayCi.action2Completed, todayCi.action3Completed].map((done, i) => (
                  <div key={i} className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-xs ${done ? "bg-emerald-900/40 text-emerald-300" : "bg-muted/30 text-muted-foreground line-through"}`}>
                    {done ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{actions[i]?.label ?? `Action ${i + 1}`}</span>
                  </div>
                ))}
              </div>
              {/* Mood */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xl">{moodEmoji(todayCi.mood)}</span>
                <span className="text-sm text-foreground">{todayCi.mood}/10 — {moodLabel(todayCi.mood)}</span>
                {todayCi.moodNote && <span className="ml-1 text-xs italic text-muted-foreground">&ldquo;{todayCi.moodNote}&rdquo;</span>}
              </div>
              {/* THUTO message (thutoMessage field) */}
              {thutoTyping ? (
                <div className="flex items-center gap-2 rounded-xl bg-black/20 px-4 py-3">
                  <Brain className="h-4 w-4 shrink-0 text-teal-400 animate-pulse" />
                  <span className="text-xs text-teal-300">THUTO is writing…</span>
                </div>
              ) : todayCi.thutoMessage ? (
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-400">THUTO</span>
                  </div>
                  <p className="text-sm text-foreground">{todayCi.thutoMessage}</p>
                </div>
              ) : null}
            </div>
          ) : (
            /* Check-in form */
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Today&apos;s Check-In
              </p>

              {/* Daily actions (action1/2/3Completed in CheckIn.java) */}
              <p className="mb-2 text-xs text-muted-foreground">Daily actions</p>
              <div className="mb-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <button key={i} onClick={() => setActDone((prev) => { const n = [...prev]; n[i] = !n[i]; return n; })}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      actDone[i] ? "bg-emerald-900/30 text-emerald-200" : "bg-muted/40 text-foreground hover:bg-muted/60"
                    }`}>
                    {actDone[i]
                      ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                      : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                    <span className="text-sm">{actions[i]?.label ?? `Action ${i + 1}`}</span>
                  </button>
                ))}
              </div>

              {/* Mood */}
              <p className="mb-2 text-xs text-muted-foreground">How are you feeling? (1–10)</p>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{moodEmoji(moodScore)}</span>
                <div className="flex-1">
                  <input type="range" min={1} max={10} value={moodScore} onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-emerald-500" />
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>1</span>
                    <span className="font-semibold text-foreground">{moodScore} — {moodLabel(moodScore)}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
              {moodScore <= 5 && (
                <textarea value={moodNote} onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="What's on your mind? (optional)" rows={2}
                  className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground" />
              )}

              <button onClick={submitCheckIn} disabled={submitting || !activeGoal}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">
                {submitting ? "Saving…" : !activeGoal ? "Set a goal first" : `Submit Check-In (${actDone.filter(Boolean).length}/3)`}
              </button>
            </div>
          )}

          {/* ── Daily actions editor ───────────────────────── */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily Actions</p>
              <button onClick={() => setEditActions((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {editActions ? <><X className="h-3 w-3" />Done</> : <><Pencil className="h-3 w-3" />Edit</>}
              </button>
            </div>
            <div className="space-y-2">
              {actions.map((a, i) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                  <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1 text-sm text-foreground">{a.label}</span>
                  {editActions && (
                    <button onClick={() => removeAction(a.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {editActions && (
                <div className="flex gap-2 pt-1">
                  <input value={newActText} onChange={(e) => setNewActText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAction()}
                    placeholder="New daily action…"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground" />
                  <button onClick={addAction}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              These 3 actions are checked off in every daily check-in.
            </p>
          </div>

          {/* ── 7-day mood chart ───────────────────────────── */}
          {moodHistory.length > 1 && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mood — Last 7 Days</p>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={moodHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: "#888", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1a2e1a", border: "1px solid #2a4a2a", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#aaa" }}
                    itemStyle={{ color: "#10b981" }}
                    formatter={(v: number) => [`${v}/10 — ${moodLabel(v)}`, "Mood"]}
                  />
                  <Area type="monotone" dataKey="mood"
                    stroke={moodHistory.length ? moodChartColor(moodHistory[moodHistory.length - 1].mood) : "#10b981"}
                    strokeWidth={2} fill="url(#moodGrad)"
                    dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card px-3 py-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
