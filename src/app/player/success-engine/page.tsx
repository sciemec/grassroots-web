"use client";
// v2 — refactored Apr 2026 (fireNotif/notifSentKey removed, moved to lib/success/notifications)
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Flame, Trophy, TrendingUp, ChevronRight, CheckCircle2,
  Circle, BarChart2, RefreshCcw, Target, Brain, Bell, BellOff, Clock,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Sidebar } from "@/components/layout/sidebar";
import {
  getGoal, hasCheckedInToday, shouldShowAdjustment,
  hasSeenAdjustmentThisWeek, getLastSevenCheckIns, getTodayCheckIn,
  getAllCheckIns,
} from "@/lib/success/storage";
import {
  getCurrentStreak, calculateSuccessProbability, getDaysRemaining,
  weeklyRate, getWeekGrid,
} from "@/lib/success/streak";
import {
  scheduleSessionReminder, getNotificationPermission,
} from "@/lib/success/notifications";

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Mangwanani 🌅";
  if (h < 17) return "Masikati ☀️";
  return "Manheru 🌙";
}

function banner(streak: number): string {
  if (streak === 0) return "Your daily check-in is ready. 30 seconds to keep your goal alive.";
  if (streak < 7) return `Day ${streak} streak 🔥 Champions show up every day. Keep going.`;
  if (streak < 30)
    return `${streak} days strong! Ramba uchishanda — you're building something real.`;
  return `${streak} day streak! 🏆 Unokwanisa — you're in the top 10% of THUTO athletes.`;
}

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
function moodColor(s: number) {
  if (s <= 2) return "#ef4444";
  if (s <= 4) return "#f97316";
  if (s <= 6) return "#eab308";
  if (s <= 8) return "#22c55e";
  return "#10b981";
}

function probColor(p: number) {
  if (p >= 70) return "bg-emerald-500";
  if (p >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function shortDay(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

const NOTIF_KEY = "thuto_notif_enabled";
const NOTIF_TIME_KEY = "thuto_notif_time";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SuccessEnginePage() {
  const [hydrated, setHydrated] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState("07:00");

  // Derived state — all calculated from lib
  const [streak, setStreak] = useState(0);
  const [totalCIs, setTotalCIs] = useState(0);
  const [rate, setRate] = useState(0);
  const [probability, setProbability] = useState(50);
  const [daysLeft, setDaysLeft] = useState(0);
  const [grid, setGrid] = useState<ReturnType<typeof getWeekGrid>>([]);
  const [moodHistory, setMoodHistory] = useState<{ date: string; mood: number }[]>([]);
  const [goal, setGoal] = useState(getGoal());
  const [checkedToday, setCheckedToday] = useState(false);
  const [todayCi, setTodayCi] = useState(getTodayCheckIn());
  const [showAdjust, setShowAdjust] = useState(false);
  const [actionLabels, setActionLabels] = useState<string[]>([]);

  const load = useCallback(() => {
    const g = getGoal();
    const ci = getTodayCheckIn();
    setGoal(g);
    setTodayCi(ci);
    setCheckedToday(hasCheckedInToday());
    setStreak(getCurrentStreak());
    setTotalCIs(getAllCheckIns().length);
    setRate(weeklyRate());
    setProbability(calculateSuccessProbability());
    setDaysLeft(getDaysRemaining());
    setGrid(getWeekGrid());
    setShowAdjust(shouldShowAdjustment() && !hasSeenAdjustmentThisWeek());
    setNotifEnabled(localStorage.getItem(NOTIF_KEY) === "1");
    setNotifTime(localStorage.getItem(NOTIF_TIME_KEY) ?? "07:00");
    setActionLabels(g?.actions ?? []);

    const hist = getLastSevenCheckIns()
      .filter((c) => c.mood !== undefined)
      .reverse()
      .map((c) => ({ date: shortDay(c.date), mood: c.mood! }));
    setMoodHistory(hist);

    if (g) scheduleSessionReminder(g.reminderHour, g.reminderMinute);
    setHydrated(true);
  }, []);

  useEffect(() => { load(); }, [load]);

  function saveNotif(enabled: boolean, time: string) {
    if (enabled) {
      localStorage.setItem(NOTIF_KEY, "1");
      localStorage.setItem(NOTIF_TIME_KEY, time);
      const [h, m] = time.split(":").map(Number);
      scheduleSessionReminder(h, m);
    } else {
      localStorage.removeItem(NOTIF_KEY);
    }
    setNotifEnabled(enabled);
    setNotifTime(time);
  }

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

  const pColor = probability >= 70 ? "#22c55e" : probability >= 40 ? "#f59e0b" : "#ef4444";
  const notifSupported = getNotificationPermission() !== "unsupported";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">THUTO Success Engine</h1>
              <p className="text-xs text-muted-foreground">{greeting()}</p>
            </div>
            {notifSupported && (
              <button
                onClick={() => setShowNotifPanel((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {notifEnabled
                  ? <Bell className="h-3.5 w-3.5 text-emerald-400" />
                  : <BellOff className="h-3.5 w-3.5" />}
                Reminders
              </button>
            )}
          </div>

          {/* Notification panel */}
          {showNotifPanel && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Daily Reminder
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={notifTime}
                    onChange={(e) => setNotifTime(e.target.value)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={() => saveNotif(true, notifTime)}
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  Save &amp; Enable
                </button>
                {notifEnabled && (
                  <button
                    onClick={() => saveNotif(false, notifTime)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Disable
                  </button>
                )}
              </div>
              {notifEnabled && (
                <p className="mt-2 text-xs text-emerald-400">✓ Reminder set for {notifTime} daily</p>
              )}
            </div>
          )}

          {/* Motivational banner */}
          <div className="mb-5 rounded-2xl border border-emerald-800/40 bg-gradient-to-br from-[#1a3d26] to-[#0f2019] px-5 py-4">
            <p className="text-sm font-medium text-emerald-100">{banner(streak)}</p>
          </div>

          {/* Stats strip */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            <StatCard icon={<Flame className="h-4 w-4 text-orange-400" />} value={streak} label="Day streak" />
            <StatCard icon={<TrendingUp className="h-4 w-4 text-yellow-400" />} value={`${rate}%`} label="This week" />
            <StatCard icon={<Trophy className="h-4 w-4 text-emerald-400" />} value={totalCIs} label="Total check-ins" />
          </div>

          {/* Goal card */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Goal</p>
              <Link
                href="/player/success-engine/goal"
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Target className="h-3 w-3" />
                {goal ? "Change" : "Set Goal"}
              </Link>
            </div>

            {goal ? (
              <>
                <p className="mb-3 text-base font-semibold text-foreground">&ldquo;{goal.goalText}&rdquo;</p>
                <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{daysLeft > 0 ? `${daysLeft} days left` : "Deadline today"}</span>
                  <span style={{ color: pColor }}>{probability}% success probability</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${probColor(probability)}`}
                    style={{ width: `${probability}%` }}
                  />
                </div>
              </>
            ) : (
              <Link
                href="/player/success-engine/goal"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-5 text-sm text-muted-foreground hover:border-emerald-700 hover:text-foreground transition-colors"
              >
                <Target className="h-4 w-4" />Set your first goal
              </Link>
            )}
          </div>

          {/* Check-in section */}
          {!checkedToday ? (
            <Link
              href="/player/success-engine/checkin"
              className="mb-5 flex w-full items-center justify-between rounded-2xl bg-[#1B5E20] border border-[#2e7d32] p-5 hover:bg-[#2e7d32] transition-colors"
            >
              <div>
                <p className="text-sm font-bold text-[#F9A825]">Daily Check-In</p>
                <p className="text-xs text-white/60 mt-0.5">Log today&apos;s training — 30 seconds</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50" />
            </Link>
          ) : todayCi ? (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Today&apos;s Check-In
                </p>
                <span className="rounded-full bg-emerald-900/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                  {todayCi.score}/3 done
                </span>
              </div>

              {/* Action rows */}
              <div className="mb-3 space-y-1.5">
                {[todayCi.action1, todayCi.action2, todayCi.action3].map((done, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                      done ? "bg-emerald-900/30 text-emerald-300" : "bg-muted/20 text-muted-foreground line-through"
                    }`}
                  >
                    {done
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      : <Circle className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">{actionLabels[i] ?? `Action ${i + 1}`}</span>
                  </div>
                ))}
              </div>

              {/* Mood */}
              {todayCi.mood !== undefined && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <span className="text-lg">{moodEmoji(todayCi.mood)}</span>
                  <span className="text-foreground">{todayCi.mood}/10 — {moodLabel(todayCi.mood)}</span>
                  {todayCi.moodNote && (
                    <span className="ml-1 text-xs italic text-muted-foreground">
                      &ldquo;{todayCi.moodNote}&rdquo;
                    </span>
                  )}
                </div>
              )}

              {/* THUTO message */}
              {todayCi.thutoMessage && (
                <div className="rounded-xl bg-black/20 px-4 py-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-teal-400" />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-400">THUTO</span>
                  </div>
                  <p className="text-sm text-foreground">{todayCi.thutoMessage}</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Week grid */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              This Week
            </p>
            <div className="flex items-center justify-between">
              {grid.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      day.status === "done"
                        ? "bg-emerald-700 text-white"
                        : day.status === "future"
                        ? "bg-white/5 text-white/20 border border-white/10"
                        : "bg-red-900/30 border border-red-900/40 text-red-400"
                    }`}
                  >
                    {day.status === "done" ? "✓" : day.status === "future" ? "·" : "✗"}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mood chart */}
          {moodHistory.length >= 2 && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-card px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mood — Last 7 Days
              </p>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={moodHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
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
                    formatter={(v) => {
                      const n = Number(v ?? 0);
                      return [`${n}/10 — ${moodLabel(n)}`, "Mood"];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke={moodHistory.length ? moodColor(moodHistory[moodHistory.length - 1].mood) : "#10b981"}
                    strokeWidth={2}
                    fill="url(#moodGrad)"
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick actions */}
          <div className={`grid gap-3 ${showAdjust ? "grid-cols-2" : "grid-cols-1"}`}>
            <Link
              href="/player/success-engine/report"
              className="rounded-2xl border border-white/10 bg-card p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <BarChart2 className="h-5 w-5 text-[#F9A825] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Weekly Report</p>
                <p className="text-xs text-muted-foreground">AI analysis of your week</p>
              </div>
            </Link>

            {showAdjust && (
              <Link
                href="/player/success-engine/adjust"
                className="rounded-2xl border border-orange-900/40 bg-orange-900/10 p-4 flex items-center gap-3 hover:bg-orange-900/20 transition-colors"
              >
                <RefreshCcw className="h-5 w-5 text-orange-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Adjust Plan</p>
                  <p className="text-xs text-muted-foreground">THUTO noticed you&apos;re struggling</p>
                </div>
              </Link>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card px-3 py-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
