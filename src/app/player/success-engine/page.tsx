"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Flame, Target, CheckCircle2, Circle, Bell, BellOff,
  Trophy, TrendingUp, ChevronLeft, Pencil, Save, X, Plus, Trash2, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Sidebar } from "@/components/layout/sidebar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CheckIn {
  mood: number;
  note: string;
  ts: string;
}

interface Goal {
  text: string;
  done: boolean;
}

/** Recurring daily habit — same label every day, just tick done/not done.
 *  Equivalent to DailyAction entity in SuccessDatabase.java */
interface DailyAction {
  id: string;
  label: string;
}

interface DailyActionLog {
  [id: string]: boolean; // true = done today
}

// ── localStorage keys ─────────────────────────────────────────────────────────

const STREAK_KEY      = "thuto_streak";
const BEST_KEY        = "thuto_streak_best";
const TOTAL_KEY       = "thuto_checkin_total";
const NOTIF_KEY       = "thuto_notif_enabled";
/** Preferred notification time — equivalent to NotificationScheduler hourOfDay/minute */
const NOTIF_TIME_KEY  = "thuto_notif_time";   // "HH:MM" 24h
const ACTIONS_DEF_KEY = "thuto_daily_actions"; // DailyAction[] definitions

function checkinKey(d: string)     { return `thuto_checkin_${d}`; }
function goalsKey(d: string)       { return `thuto_goals_${d}`; }
function actionsLogKey(d: string)  { return `thuto_actions_log_${d}`; }
function notifSentKey(d: string)   { return `thuto_notif_sent_${d}`; }

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${weekdays[d.getDay()]} ${d.getDate()}`;
}

// ── Streak calculator ─────────────────────────────────────────────────────────

function recalcStreak(): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    if (localStorage.getItem(checkinKey(daysAgoStr(i)))) streak++;
    else break;
  }
  return streak;
}

// ── Notification time helpers — equivalent to NotificationScheduler.calculateDelay ──

/** Returns milliseconds until the next occurrence of HH:MM today or tomorrow.
 *  Mirrors NotificationScheduler.calculateDelay(hourOfDay, minute). */
function msUntilTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // already passed today → tomorrow
  return target.getTime() - now.getTime();
}

/** True if current time has reached or passed the user's preferred notification time. */
function isPastNotifTime(hhmm: string): boolean {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
}

// ── Motivational messages ─────────────────────────────────────────────────────

function getMotivationalMessage(streak: number): string {
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

// ── Browser notification helper ───────────────────────────────────────────────

async function fireNotif(streak: number): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "denied") return;
  if (localStorage.getItem(notifSentKey(todayStr()))) return;

  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return;

  new Notification("THUTO Daily Check-In ⚽", {
    body: getMotivationalMessage(streak),
    icon: "/icons/icon-192x192.png",
  });
  localStorage.setItem(notifSentKey(todayStr()), "1");
}

// ── Suggested daily actions (defaults for new users) ─────────────────────────

const DEFAULT_ACTIONS: DailyAction[] = [
  { id: "a1", label: "Morning stretch (10 min)" },
  { id: "a2", label: "Drink 2L water" },
  { id: "a3", label: "Watch 1 training video" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuccessEnginePage() {
  const today = todayStr();

  // ── State ────────────────────────────────────────────────────────────────
  const [hydrated,      setHydrated]      = useState(false);
  const [streak,        setStreak]        = useState(0);
  const [bestStreak,    setBestStreak]    = useState(0);
  const [totalCheckIns, setTotal]         = useState(0);

  // Check-in
  const [todayCheckIn,  setTodayCheckIn]  = useState<CheckIn | null>(null);
  const [moodScore,     setMoodScore]     = useState(7);
  const [moodNote,      setMoodNote]      = useState("");
  const [savingMood,    setSavingMood]    = useState(false);
  const [moodSaved,     setMoodSaved]     = useState(false);

  // Goals (custom, set fresh daily)
  const [goals,         setGoals]         = useState<Goal[]>([
    { text: "", done: false }, { text: "", done: false }, { text: "", done: false },
  ]);
  const [editingGoals,  setEditingGoals]  = useState(false);
  const [draftGoals,    setDraftGoals]    = useState<string[]>(["", "", ""]);
  const [celebration,   setCelebration]   = useState(false);

  // Daily actions (recurring habits)
  const [actions,       setActions]       = useState<DailyAction[]>([]);
  const [actionLog,     setActionLog]     = useState<DailyActionLog>({});
  const [editingActions, setEditingActions] = useState(false);
  const [newActionText, setNewActionText] = useState("");

  // Mood history chart
  const [moodHistory, setMoodHistory]     = useState<{ date: string; mood: number; label: string }[]>([]);

  // Notification settings
  const [notifEnabled,  setNotifEnabled]  = useState(false);
  const [notifTime,     setNotifTime]     = useState("07:00");
  const [showSettings,  setShowSettings]  = useState(false);

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(() => {
    setStreak(parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10));
    setBestStreak(parseInt(localStorage.getItem(BEST_KEY) ?? "0", 10));
    setTotal(parseInt(localStorage.getItem(TOTAL_KEY) ?? "0", 10));
    setNotifEnabled(localStorage.getItem(NOTIF_KEY) === "1");
    setNotifTime(localStorage.getItem(NOTIF_TIME_KEY) ?? "07:00");

    const ci = localStorage.getItem(checkinKey(today));
    if (ci) { setTodayCheckIn(JSON.parse(ci)); setMoodSaved(true); }

    const gs = localStorage.getItem(goalsKey(today));
    if (gs) {
      const parsed: Goal[] = JSON.parse(gs);
      while (parsed.length < 3) parsed.push({ text: "", done: false });
      setGoals(parsed);
      setDraftGoals(parsed.map((g) => g.text));
    }

    // Daily actions definitions
    const raw = localStorage.getItem(ACTIONS_DEF_KEY);
    const defs: DailyAction[] = raw ? JSON.parse(raw) : DEFAULT_ACTIONS;
    setActions(defs);

    // Today's action log
    const log = localStorage.getItem(actionsLogKey(today));
    setActionLog(log ? JSON.parse(log) : {});

    // 7-day mood history
    const history = Array.from({ length: 7 }, (_, i) => {
      const raw2 = localStorage.getItem(checkinKey(daysAgoStr(i)));
      if (!raw2) return null;
      const c: CheckIn = JSON.parse(raw2);
      return { date: shortDate(daysAgoStr(i)), mood: c.mood, label: moodLabel(c.mood) };
    }).filter(Boolean).reverse() as { date: string; mood: number; label: string }[];
    setMoodHistory(history);

    setHydrated(true);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  // ── Auto-fire notification at user's chosen time ──────────────────────────
  // Web equivalent of NotificationScheduler.scheduleDailyCheckIn(context, hour, minute)
  useEffect(() => {
    if (!hydrated || todayCheckIn) return;
    const time = localStorage.getItem(NOTIF_TIME_KEY) ?? "07:00";
    if (localStorage.getItem(NOTIF_KEY) !== "1") return;
    if (!isPastNotifTime(time)) return;
    fireNotif(streak);
  }, [hydrated, todayCheckIn, streak]);

  // ── Celebration when all goals done ──────────────────────────────────────
  useEffect(() => {
    const active = goals.filter((g) => g.text.trim());
    setCelebration(active.length > 0 && active.every((g) => g.done));
  }, [goals]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  function saveCheckIn() {
    setSavingMood(true);
    const ci: CheckIn = { mood: moodScore, note: moodNote, ts: new Date().toISOString() };
    localStorage.setItem(checkinKey(today), JSON.stringify(ci));
    const ns = recalcStreak();
    const nb = Math.max(ns, bestStreak);
    const nt = totalCheckIns + 1;
    localStorage.setItem(STREAK_KEY, String(ns));
    localStorage.setItem(BEST_KEY,   String(nb));
    localStorage.setItem(TOTAL_KEY,  String(nt));
    setTodayCheckIn(ci); setStreak(ns); setBestStreak(nb);
    setTotal(nt); setMoodSaved(true); setSavingMood(false);
    load();
  }

  function saveGoals() {
    const updated: Goal[] = draftGoals.map((text, i) => ({
      text, done: goals[i]?.done ?? false,
    }));
    localStorage.setItem(goalsKey(today), JSON.stringify(updated));
    setGoals(updated); setEditingGoals(false);
  }

  function toggleGoal(i: number) {
    const updated = goals.map((g, idx) => idx === i ? { ...g, done: !g.done } : g);
    localStorage.setItem(goalsKey(today), JSON.stringify(updated));
    setGoals(updated);
  }

  function toggleAction(id: string) {
    const updated = { ...actionLog, [id]: !actionLog[id] };
    localStorage.setItem(actionsLogKey(today), JSON.stringify(updated));
    setActionLog(updated);
  }

  function addAction() {
    if (!newActionText.trim()) return;
    const updated = [...actions, { id: Date.now().toString(), label: newActionText.trim() }];
    localStorage.setItem(ACTIONS_DEF_KEY, JSON.stringify(updated));
    setActions(updated); setNewActionText("");
  }

  function removeAction(id: string) {
    const updated = actions.filter((a) => a.id !== id);
    localStorage.setItem(ACTIONS_DEF_KEY, JSON.stringify(updated));
    setActions(updated);
    const log = { ...actionLog };
    delete log[id];
    localStorage.setItem(actionsLogKey(today), JSON.stringify(log));
    setActionLog(log);
  }

  /** Save notification time — equivalent to NotificationScheduler.scheduleDailyCheckIn(ctx, h, m) */
  function saveNotifSettings(enabled: boolean, time: string) {
    if (enabled) {
      localStorage.setItem(NOTIF_KEY, "1");
      localStorage.setItem(NOTIF_TIME_KEY, time);
      // Clear today's sent flag so the notification fires again at the new time if needed
      if (isPastNotifTime(time)) {
        fireNotif(streak);
      } else {
        // Schedule: calculate delay (mirrors calculateDelay), use setTimeout for tab session
        const delay = msUntilTime(time);
        setTimeout(() => fireNotif(streak), delay);
      }
    } else {
      // Equivalent to NotificationScheduler.cancelCheckIn(context)
      localStorage.removeItem(NOTIF_KEY);
    }
    setNotifEnabled(enabled);
    setNotifTime(time);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 space-y-4">
          {[28, 40, 48, 48, 120, 32].map((h, i) => (
            <div key={i} className={`h-${h} animate-pulse rounded-2xl bg-muted`} />
          ))}
        </main>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.text.trim());
  const doneGoals   = activeGoals.filter((g) => g.done).length;
  const doneActions = actions.filter((a) => actionLog[a.id]).length;

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
              <p className="text-xs text-muted-foreground">Daily check-in · Goals · Habits · Streak</p>
            </div>
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {notifEnabled
                ? <Bell className="h-3.5 w-3.5 text-emerald-400" />
                : <BellOff className="h-3.5 w-3.5" />}
              Reminders
            </button>
          </div>

          {/* ── Notification settings panel ────────────────── */}
          {showSettings && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Daily Reminder Settings
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <label className="text-sm text-foreground">Time</label>
                  <input
                    type="time"
                    value={notifTime}
                    onChange={(e) => setNotifTime(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={() => saveNotifSettings(true, notifTime)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  Save &amp; Enable
                </button>
                {notifEnabled && (
                  <button
                    onClick={() => saveNotifSettings(false, notifTime)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Disable
                  </button>
                )}
              </div>
              {notifEnabled && (
                <p className="mt-2 text-xs text-emerald-400">
                  ✓ Reminder set for {notifTime} daily
                </p>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Notification fires when you open the app after this time each day.
              </p>
            </div>
          )}

          {/* ── Motivational banner ────────────────────────── */}
          <div className="mb-5 rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-[#1a3d26] to-[#0f2019] px-5 py-4">
            <p className="text-sm font-medium text-emerald-100">
              {getMotivationalMessage(streak)}
            </p>
          </div>

          {/* ── Stats strip ────────────────────────────────── */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatCard icon={<Flame className="h-4 w-4 text-orange-400" />} value={streak} label="Day streak" />
            <StatCard icon={<Trophy className="h-4 w-4 text-yellow-400" />} value={bestStreak} label="Best streak" />
            <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} value={totalCheckIns} label="Total check-ins" />
          </div>

          {/* ── Mood check-in ──────────────────────────────── */}
          {moodSaved && todayCheckIn ? (
            <div className={`mb-5 rounded-2xl border border-white/10 bg-gradient-to-br ${moodBg(todayCheckIn.mood)} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Mood</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-3xl">{moodEmoji(todayCheckIn.mood)}</span>
                    <div>
                      <span className="text-2xl font-bold text-foreground">{todayCheckIn.mood}</span>
                      <span className="ml-1 text-xs text-muted-foreground">/10 — {moodLabel(todayCheckIn.mood)}</span>
                    </div>
                  </div>
                  {todayCheckIn.note && (
                    <p className="mt-1.5 text-xs italic text-muted-foreground">&ldquo;{todayCheckIn.note}&rdquo;</p>
                  )}
                </div>
                <button onClick={() => { setMoodSaved(false); setTodayCheckIn(null); }} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How are you feeling today? (1–10)</p>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl">{moodEmoji(moodScore)}</span>
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
              <button onClick={saveCheckIn} disabled={savingMood}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">
                {savingMood ? "Saving…" : "Save Check-In"}
              </button>
            </div>
          )}

          {/* ── Daily Actions (DailyAction entity) ────────── */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Daily Habits</p>
                {actions.length > 0 && (
                  <p className="text-xs text-muted-foreground">{doneActions}/{actions.length} done today</p>
                )}
              </div>
              <button onClick={() => setEditingActions((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {editingActions ? <><X className="h-3 w-3" />Done</> : <><Pencil className="h-3 w-3" />Edit</>}
              </button>
            </div>

            <div className="space-y-2">
              {actions.map((a) =>
                editingActions ? (
                  <div key={a.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
                    <span className="flex-1 text-sm text-foreground">{a.label}</span>
                    <button onClick={() => removeAction(a.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button key={a.id} onClick={() => toggleAction(a.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      actionLog[a.id]
                        ? "bg-emerald-900/30 text-muted-foreground line-through"
                        : "bg-muted/40 text-foreground hover:bg-muted/60"
                    }`}>
                    {actionLog[a.id]
                      ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                      : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                    <span className="text-sm">{a.label}</span>
                  </button>
                )
              )}

              {editingActions && (
                <div className="flex gap-2 pt-1">
                  <input value={newActionText} onChange={(e) => setNewActionText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAction()}
                    placeholder="New daily habit…"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground" />
                  <button onClick={addAction}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}

              {actions.length === 0 && !editingActions && (
                <button onClick={() => setEditingActions(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-emerald-700 hover:text-foreground transition-colors">
                  <Plus className="h-4 w-4" />Add daily habits
                </button>
              )}
            </div>
          </div>

          {/* ── Daily Goals (custom, set fresh each day) ───── */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s 3 Goals</p>
                {activeGoals.length > 0 && (
                  <p className="text-xs text-muted-foreground">{doneGoals}/{activeGoals.length} complete</p>
                )}
              </div>
              {editingGoals ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingGoals(false)} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={saveGoals} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors">
                    <Save className="mr-1 inline h-3.5 w-3.5" />Save
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditingGoals(true)}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3 w-3" />Set goals
                </button>
              )}
            </div>

            {editingGoals ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input value={draftGoals[i]}
                      onChange={(e) => { const n = [...draftGoals]; n[i] = e.target.value; setDraftGoals(n); }}
                      placeholder={`Goal ${i + 1}…`}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : activeGoals.length === 0 ? (
              <button onClick={() => setEditingGoals(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-emerald-700 hover:text-foreground transition-colors">
                <Target className="h-4 w-4" />Set 3 goals for today
              </button>
            ) : (
              <div className="space-y-2">
                {goals.map((g, i) =>
                  g.text.trim() ? (
                    <button key={i} onClick={() => toggleGoal(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        g.done ? "bg-emerald-900/30 text-muted-foreground line-through" : "bg-muted/40 text-foreground hover:bg-muted/60"
                      }`}>
                      {g.done
                        ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
                      <span className="text-sm">{g.text}</span>
                    </button>
                  ) : null
                )}
              </div>
            )}

            {celebration && (
              <div className="mt-3 rounded-xl bg-gradient-to-r from-yellow-900/40 to-amber-900/20 px-4 py-3 text-center">
                <p className="text-sm font-bold text-yellow-300">🏆 Waita! All goals done today!</p>
                <p className="text-xs text-yellow-400/80">Unokwanisa — you&apos;re unstoppable.</p>
              </div>
            )}
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

          {/* ── Footer tips ────────────────────────────────── */}
          <div className="rounded-2xl border border-white/5 bg-card/50 px-5 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">THUTO reminds you</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Daily Habits repeat every day — tick them off to build consistency</li>
              <li>• Today&apos;s Goals are set fresh — different focus each day</li>
              <li>• Low mood? Tap the THUTO circle (bottom right) to talk it through</li>
              <li>• Set your reminder time above — THUTO will notify you daily</li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card px-3 py-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
