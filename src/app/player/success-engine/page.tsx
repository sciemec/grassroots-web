"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Flame, Target, CheckCircle2, Circle, Bell, BellOff,
  Trophy, TrendingUp, ChevronLeft, Pencil, Save, X,
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

// ── localStorage keys ─────────────────────────────────────────────────────────

const STREAK_KEY   = "thuto_streak";
const BEST_KEY     = "thuto_streak_best";
const TOTAL_KEY    = "thuto_checkin_total";
const NOTIF_KEY    = "thuto_notif_enabled";

function checkinKey(dateStr: string) { return `thuto_checkin_${dateStr}`; }
function goalsKey(dateStr: string)   { return `thuto_goals_${dateStr}`; }
function notifSentKey(dateStr: string) { return `thuto_notif_sent_${dateStr}`; }

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
  const [, , day] = dateStr.split("-");
  const d = new Date(dateStr + "T12:00:00");
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${weekdays[d.getDay()]} ${parseInt(day)}`;
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

// ── Motivational messages (from SuccessCheckInWorker.java reference) ──────────

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

function moodEmoji(score: number): string {
  if (score <= 2) return "😞";
  if (score <= 4) return "😐";
  if (score <= 6) return "🙂";
  if (score <= 8) return "😊";
  return "🔥";
}

function moodLabel(score: number): string {
  if (score <= 2) return "Struggling";
  if (score <= 4) return "Below par";
  if (score <= 6) return "Okay";
  if (score <= 8) return "Good";
  return "On fire";
}

function moodBg(score: number): string {
  if (score <= 2) return "from-red-900/40 to-red-800/20";
  if (score <= 4) return "from-orange-900/40 to-orange-800/20";
  if (score <= 6) return "from-yellow-900/40 to-yellow-800/20";
  if (score <= 8) return "from-green-900/40 to-green-800/20";
  return "from-emerald-900/50 to-emerald-700/30";
}

function moodChartColor(score: number): string {
  if (score <= 2) return "#ef4444";
  if (score <= 4) return "#f97316";
  if (score <= 6) return "#eab308";
  if (score <= 8) return "#22c55e";
  return "#10b981";
}

// ── Browser notification helper ───────────────────────────────────────────────

async function requestAndFireNotif(streak: number): Promise<void> {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "denied") return;
  if (localStorage.getItem(notifSentKey(todayStr()))) return;

  let perm = Notification.permission;
  if (perm === "default") {
    perm = await Notification.requestPermission();
  }
  if (perm !== "granted") return;

  const title = "THUTO Daily Check-In ⚽";
  const body = getMotivationalMessage(streak);
  new Notification(title, { body, icon: "/icons/icon-192x192.png" });
  localStorage.setItem(notifSentKey(todayStr()), "1");
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuccessEnginePage() {
  const today = todayStr();

  // ── State ────────────────────────────────────────────────────────────────
  const [hydrated, setHydrated]       = useState(false);
  const [streak, setStreak]           = useState(0);
  const [bestStreak, setBestStreak]   = useState(0);
  const [totalCheckIns, setTotal]     = useState(0);

  const [todayCheckIn, setTodayCheckIn] = useState<CheckIn | null>(null);
  const [moodScore, setMoodScore]       = useState(7);
  const [moodNote, setMoodNote]         = useState("");
  const [savingMood, setSavingMood]     = useState(false);
  const [moodSaved, setMoodSaved]       = useState(false);

  const [goals, setGoals]             = useState<Goal[]>([
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ]);
  const [editingGoals, setEditingGoals] = useState(false);
  const [draftGoals, setDraftGoals]    = useState<string[]>(["", "", ""]);

  const [moodHistory, setMoodHistory] = useState<{ date: string; mood: number; label: string }[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [celebration, setCelebration] = useState(false);

  // ── Load from localStorage ────────────────────────────────────────────────

  const load = useCallback(() => {
    const s = parseInt(localStorage.getItem(STREAK_KEY) ?? "0", 10);
    const b = parseInt(localStorage.getItem(BEST_KEY) ?? "0", 10);
    const t = parseInt(localStorage.getItem(TOTAL_KEY) ?? "0", 10);
    setStreak(s);
    setBestStreak(b);
    setTotal(t);

    const ci = localStorage.getItem(checkinKey(today));
    if (ci) {
      setTodayCheckIn(JSON.parse(ci) as CheckIn);
      setMoodSaved(true);
    }

    const gs = localStorage.getItem(goalsKey(today));
    if (gs) {
      const parsed = JSON.parse(gs) as Goal[];
      // Pad to 3
      while (parsed.length < 3) parsed.push({ text: "", done: false });
      setGoals(parsed);
      setDraftGoals(parsed.map((g) => g.text));
    }

    const history = Array.from({ length: 7 }, (_, i) => {
      const key = checkinKey(daysAgoStr(i));
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const ci = JSON.parse(raw) as CheckIn;
      return { date: shortDate(daysAgoStr(i)), mood: ci.mood, label: moodLabel(ci.mood) };
    })
      .filter(Boolean)
      .reverse() as { date: string; mood: number; label: string }[];
    setMoodHistory(history);

    setNotifEnabled(localStorage.getItem(NOTIF_KEY) === "1");
    setHydrated(true);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  // ── Fire browser notification if user hasn't checked in yet ──────────────
  useEffect(() => {
    if (!hydrated) return;
    if (todayCheckIn) return; // already checked in
    const hour = new Date().getHours();
    if (hour >= 7) requestAndFireNotif(streak);
  }, [hydrated, todayCheckIn, streak]);

  // ── Check for all-goals-done celebration ─────────────────────────────────
  useEffect(() => {
    const hasGoals = goals.some((g) => g.text.trim());
    const allDone = hasGoals && goals.filter((g) => g.text.trim()).every((g) => g.done);
    setCelebration(allDone);
  }, [goals]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function saveCheckIn() {
    setSavingMood(true);
    const ci: CheckIn = { mood: moodScore, note: moodNote, ts: new Date().toISOString() };
    localStorage.setItem(checkinKey(today), JSON.stringify(ci));

    // Update streak
    const newStreak = recalcStreak();
    const newBest   = Math.max(newStreak, bestStreak);
    const newTotal  = totalCheckIns + 1;
    localStorage.setItem(STREAK_KEY, String(newStreak));
    localStorage.setItem(BEST_KEY,   String(newBest));
    localStorage.setItem(TOTAL_KEY,  String(newTotal));

    setTodayCheckIn(ci);
    setStreak(newStreak);
    setBestStreak(newBest);
    setTotal(newTotal);
    setMoodSaved(true);
    setSavingMood(false);

    // Refresh mood history
    load();
  }

  function saveGoals() {
    const updated: Goal[] = draftGoals.map((text, i) => ({
      text,
      done: goals[i]?.done ?? false,
    }));
    localStorage.setItem(goalsKey(today), JSON.stringify(updated));
    setGoals(updated);
    setEditingGoals(false);
  }

  function toggleGoal(i: number) {
    const updated = goals.map((g, idx) =>
      idx === i ? { ...g, done: !g.done } : g
    );
    localStorage.setItem(goalsKey(today), JSON.stringify(updated));
    setGoals(updated);
  }

  function toggleNotifications() {
    if (notifEnabled) {
      localStorage.removeItem(NOTIF_KEY);
      setNotifEnabled(false);
    } else {
      requestAndFireNotif(streak).then(() => {
        localStorage.setItem(NOTIF_KEY, "1");
        setNotifEnabled(true);
      });
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (!hydrated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6 h-8 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="mb-4 h-28 animate-pulse rounded-2xl bg-muted" />
          <div className="mb-4 h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="mb-4 h-48 animate-pulse rounded-2xl bg-muted" />
        </main>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.text.trim());
  const doneCount   = activeGoals.filter((g) => g.done).length;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">

          {/* ── Back + header ──────────────────────────────── */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/player" className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">THUTO Success Engine</h1>
              <p className="text-xs text-muted-foreground">Daily check-in · Goals · Streak</p>
            </div>
            <button
              onClick={toggleNotifications}
              title={notifEnabled ? "Disable daily reminders" : "Enable daily reminders"}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {notifEnabled ? <Bell className="h-3.5 w-3.5 text-emerald-400" /> : <BellOff className="h-3.5 w-3.5" />}
              {notifEnabled ? "Reminders on" : "Enable reminders"}
            </button>
          </div>

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

          {/* ── Today's mood check-in ──────────────────────── */}
          {moodSaved && todayCheckIn ? (
            <div className={`mb-5 rounded-2xl border border-white/10 bg-gradient-to-br ${moodBg(todayCheckIn.mood)} px-5 py-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s Check-In</p>
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
                <button
                  onClick={() => { setMoodSaved(false); setTodayCheckIn(null); }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit check-in"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                How are you feeling today? (1 – 10)
              </p>

              {/* Slider */}
              <div className="mb-2 flex items-center gap-3">
                <span className="text-3xl">{moodEmoji(moodScore)}</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-emerald-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>1</span>
                    <span className="font-semibold text-foreground">{moodScore} — {moodLabel(moodScore)}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Note (optional for low moods) */}
              {moodScore <= 5 && (
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="What's on your mind? (optional)"
                  rows={2}
                  className="mb-3 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground"
                />
              )}

              <button
                onClick={saveCheckIn}
                disabled={savingMood}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingMood ? "Saving…" : "Save Check-In"}
              </button>
            </div>
          )}

          {/* ── Daily goals ────────────────────────────────── */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Today&apos;s 3 Goals</p>
                {activeGoals.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {doneCount}/{activeGoals.length} complete
                  </p>
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
                <button onClick={() => setEditingGoals(true)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="h-3 w-3" />Set goals
                </button>
              )}
            </div>

            {editingGoals ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <input
                      value={draftGoals[i]}
                      onChange={(e) => {
                        const next = [...draftGoals];
                        next[i] = e.target.value;
                        setDraftGoals(next);
                      }}
                      placeholder={`Goal ${i + 1}…`}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-muted-foreground"
                    />
                  </div>
                ))}
              </div>
            ) : activeGoals.length === 0 ? (
              <button
                onClick={() => setEditingGoals(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:border-emerald-700 hover:text-foreground transition-colors"
              >
                <Target className="h-4 w-4" />
                Set 3 goals for today
              </button>
            ) : (
              <div className="space-y-2">
                {goals.map((g, i) =>
                  g.text.trim() ? (
                    <button
                      key={i}
                      onClick={() => toggleGoal(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                        g.done
                          ? "bg-emerald-900/30 text-muted-foreground line-through"
                          : "bg-muted/40 text-foreground hover:bg-muted/60"
                      }`}
                    >
                      {g.done
                        ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                      }
                      <span className="text-sm">{g.text}</span>
                    </button>
                  ) : null
                )}
              </div>
            )}

            {/* Celebration banner */}
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mood — Last 7 Days
              </p>
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
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke={moodChartColor(
                      moodHistory.length > 0
                        ? moodHistory[moodHistory.length - 1].mood
                        : 7
                    )}
                    strokeWidth={2}
                    fill="url(#moodGrad)"
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Tips footer ────────────────────────────────── */}
          <div className="rounded-2xl border border-white/5 bg-card/50 px-5 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">THUTO reminds you</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>• Check in every day to keep your streak alive</li>
              <li>• Low mood? Tell THUTO — tap the circle at the bottom right</li>
              <li>• 3 goals a day builds a champion&apos;s mentality over time</li>
              <li>• Enable reminders above to get a 7am daily notification</li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-card px-3 py-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
