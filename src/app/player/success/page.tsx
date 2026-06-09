"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame, Target, Calendar, ChevronRight, ArrowLeft,
  CheckCircle2, Circle, TrendingUp, Zap, AlertTriangle,
  RefreshCw, Bell, BarChart3, Loader2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  getGoal, clearGoal, shouldShowAdjustment,
  hasSeenAdjustmentThisWeek, saveAdjustmentSeen, getWeeklyReportData,
  getTodayCheckIn, hasCheckedInToday, type Goal,
} from "@/lib/success/storage";
import {
  getCurrentStreak, calculateSuccessProbability,
  getDaysRemaining, weeklyRate, getWeekGrid,
} from "@/lib/success/streak";
import {
  getActionsForGoal, detectGoalType, ACTION_BLUEPRINTS,
  type GoalType,
} from "@/lib/success/actions";
import {
  requestNotificationPermission, scheduleDailyReminder,
} from "@/lib/success/notifications";

// ── Goal Setup ────────────────────────────────────────────────────────────────

function GoalSetup({ onSave }: { onSave: () => void }) {
  const [goalText, setGoalText]   = useState("");
  const [whyText,  setWhyText]    = useState("");
  const [days,     setDays]       = useState(90);
  const [hour,     setHour]       = useState(7);
  const [minute,   setMinute]     = useState(0);
  const [saving,   setSaving]     = useState(false);
  const [step,     setStep]       = useState<1 | 2>(1);

  const detected     = goalText.trim() ? detectGoalType(goalText) : null;
  const blueprint    = detected ? ACTION_BLUEPRINTS[detected as GoalType] : null;
  const previewActs  = goalText.trim() ? getActionsForGoal(goalText) : null;

  const handleSave = async () => {
    if (!goalText.trim() || !whyText.trim()) return;
    setSaving(true);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    const { saveGoal } = await import("@/lib/success/storage");
    saveGoal({
      id:             crypto.randomUUID(),
      goalText:       goalText.trim(),
      whyText:        whyText.trim(),
      targetDate:     targetDate.toISOString().split("T")[0],
      createdAt:      new Date().toISOString().split("T")[0],
      actions:        getActionsForGoal(goalText.trim()),
      reminderHour:   hour,
      reminderMinute: minute,
    });

    const granted = await requestNotificationPermission();
    if (granted) await scheduleDailyReminder(hour, minute);

    setSaving(false);
    onSave();
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#f0b429]/20 border border-[#f0b429]/40 mb-3">
          <Flame className="w-7 h-7 text-[#f0b429]" />
        </div>
        <h2 className="text-xl font-bold text-[#f0b429]">Set Your Goal</h2>
        <p className="text-[#f0b429]/60 text-sm mt-1">THUTO will build you a daily action plan</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4 space-y-3">
            <div>
              <label className="text-[#f0b429]/70 text-xs font-medium uppercase tracking-wide">
                My Goal
              </label>
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. Make the school first team this season"
                rows={2}
                className="mt-1 w-full bg-transparent text-[#f0b429] placeholder-[#f0b429]/30 text-sm resize-none focus:outline-none"
              />
            </div>
            <div className="border-t border-[#f0b429]/15 pt-3">
              <label className="text-[#f0b429]/70 text-xs font-medium uppercase tracking-wide">
                Why does this matter to me?
              </label>
              <textarea
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                placeholder="e.g. My family sacrificed a lot for me. I don't want to let them down."
                rows={2}
                className="mt-1 w-full bg-transparent text-[#f0b429] placeholder-[#f0b429]/30 text-sm resize-none focus:outline-none"
              />
            </div>
          </div>

          {blueprint && (
            <div className="rounded-xl bg-[#f0b429]/10 border border-[#f0b429]/20 p-3">
              <p className="text-[#f0b429] text-xs font-semibold uppercase tracking-wide mb-2">
                {blueprint.label} — Your 3 Daily Actions
              </p>
              {previewActs?.map((a, i) => (
                <p key={i} className="text-[#f0b429]/80 text-xs mb-1">
                  <span className="text-[#f0b429] font-bold">{i + 1}.</span> {a}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={() => { if (goalText.trim() && whyText.trim()) setStep(2); }}
            disabled={!goalText.trim() || !whyText.trim()}
            className="w-full bg-[#f0b429] text-[#1a3a1a] font-semibold py-3 rounded-xl disabled:opacity-40"
          >
            Next — Set Timeline & Reminder
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4 space-y-4">
            <div>
              <label className="text-[#f0b429]/70 text-xs font-medium uppercase tracking-wide">
                Days until goal target
              </label>
              <div className="flex items-center gap-3 mt-2">
                {[30, 60, 90, 180].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      days === d
                        ? "bg-[#f0b429] text-[#1a3a1a]"
                        : "bg-[#f0b429]/10 text-[#f0b429]/70"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[#f0b429]/70 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                <Bell className="w-3 h-3" /> Daily reminder time
              </label>
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="flex-1 bg-[#f0b429]/10 text-[#f0b429] rounded-lg px-3 py-2 text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i} className="bg-[#1a3d26]">
                      {String(i).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="flex-1 bg-[#f0b429]/10 text-[#f0b429] rounded-lg px-3 py-2 text-sm"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m} className="bg-[#1a3d26]">
                      :{String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[#f0b429]/40 text-xs mt-1">
                THUTO will remind you to check in at this time
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl bg-[#f0b429]/10 text-[#f0b429]/70 font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#f0b429] text-[#1a3a1a] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
              Commit to My Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Adjustment Card ───────────────────────────────────────────────────────────

function AdjustmentCard({ goal }: { goal: Goal }) {
  const [reason,   setReason]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const handleAsk = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/success-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.goalText, reason, actions: goal.actions }),
      });
      const data = await res.json();
      setResponse(data.response ?? null);
    } catch {
      setResponse("Keep going. Every day you show up, you're ahead of who you were. Pamberi!");
    } finally {
      setLoading(false);
      saveAdjustmentSeen();
    }
  };

  if (dismissed) return null;

  return (
    <div className="rounded-2xl bg-amber-900/30 border border-amber-500/30 p-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-semibold text-sm">Struggling this week?</p>
          <p className="text-[#f0b429]/60 text-xs mt-0.5">
            THUTO noticed you&apos;ve been missing actions. Tell me why — I&apos;ll adjust the plan.
          </p>
        </div>
      </div>

      {!response ? (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Load shedding means I can't train at night. School exams this week."
            rows={2}
            className="w-full bg-[#f0b429]/5 border border-[#f0b429]/15 rounded-lg px-3 py-2 text-[#f0b429]/80 text-sm placeholder-[#f0b429]/30 resize-none focus:outline-none"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 text-[#f0b429]/40 text-sm"
            >
              Dismiss
            </button>
            <button
              onClick={handleAsk}
              disabled={!reason.trim() || loading}
              className="flex-1 bg-amber-500 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "THUTO is thinking..." : "Ask THUTO to Adjust"}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-[#f0b429]/5 rounded-lg p-3 text-[#f0b429]/80 text-sm whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}

// ── Weekly Report Card ────────────────────────────────────────────────────────

function WeeklyReportCard({ goal }: { goal: Goal }) {
  const [loading,  setLoading]  = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const reportData = getWeeklyReportData();
  const streak     = getCurrentStreak();
  const daysLeft   = getDaysRemaining();

  if (!reportData) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/success-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal:            goal.goalText,
          completionRate:  reportData.completionRate,
          strongestAction: reportData.strongestAction,
          weakestAction:   reportData.weakestAction,
          streak,
          daysRemaining:   daysLeft,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis ?? null);
    } catch {
      setAnalysis("Great work showing up this week. Keep building that habit — Ramba uchishanda!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#f0b429]" />
          <p className="text-[#f0b429] font-semibold text-sm">Weekly Report</p>
        </div>
        <span className="text-xs text-[#f0b429]/50">{reportData.completionRate}% completion</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-green-900/30 rounded-lg p-2">
          <p className="text-xs text-green-400 font-medium">Strongest</p>
          <p className="text-[#f0b429] text-xs mt-0.5 line-clamp-2">{reportData.strongestAction}</p>
        </div>
        <div className="bg-amber-900/30 rounded-lg p-2">
          <p className="text-xs text-amber-400 font-medium">Needs work</p>
          <p className="text-[#f0b429] text-xs mt-0.5 line-clamp-2">{reportData.weakestAction}</p>
        </div>
      </div>

      {analysis ? (
        <div className="bg-[#f0b429]/5 rounded-lg p-3 text-[#f0b429]/80 text-sm whitespace-pre-wrap">
          {analysis}
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-[#f0b429]/20 border border-[#f0b429]/30 text-[#f0b429] text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 className="w-3 h-3 animate-spin" /> THUTO is analysing...</>
            : <><Zap className="w-3 h-3" /> Get THUTO&apos;s Weekly Analysis</>
          }
        </button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SuccessEnginePage() {
  const router   = useRouter();
  const [goal,     setGoal]     = useState<Goal | null>(null);
  const [loaded,   setLoaded]   = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setGoal(getGoal());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (!window.confirm("Clear your goal? This will erase all check-in history too.")) return;
    setClearing(true);
    clearGoal();
    localStorage.removeItem("thuto_checkins");
    setGoal(null);
    setClearing(false);
  };

  // Derived values (only when goal exists)
  const streak      = goal ? getCurrentStreak()            : 0;
  const probability = goal ? calculateSuccessProbability() : 50;
  const daysLeft    = goal ? getDaysRemaining()            : 0;
  const rate        = goal ? weeklyRate()                  : 0;
  const weekGrid    = goal ? getWeekGrid()                 : [];
  const checkedIn   = goal ? hasCheckedInToday()           : false;
  const showAdjust  = goal ? shouldShowAdjustment() && !hasSeenAdjustmentThisWeek() : false;
  const todayCI     = goal ? getTodayCheckIn()             : null;

  if (!loaded) {
    return (
      <div className="flex min-h-screen bg-[#1a5c2a]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#f0b429] animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#1a5c2a]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-[#f0b429]/10 hover:bg-[#f0b429]/20 text-[#f0b429]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#f0b429] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#f0b429]" /> Success Engine
            </h1>
            <p className="text-sm text-[#f0b429]/60">Daily actions. Real results.</p>
          </div>
        </div>

        {/* Goal Setup */}
        {!goal && (
          <GoalSetup onSave={() => setGoal(getGoal())} />
        )}

        {/* Dashboard */}
        {goal && (
          <div className="space-y-4">

            {/* Goal Card */}
            <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/15 p-4">
              <p className="text-xs text-[#f0b429] font-semibold uppercase tracking-wide mb-1">
                My Goal
              </p>
              <p className="text-[#f0b429] font-bold text-base leading-snug">{goal.goalText}</p>
              <p className="text-[#f0b429]/50 text-xs mt-1 italic">&ldquo;{goal.whyText}&rdquo;</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-[#f0b429]/50">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {daysLeft} days left
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {goal.targetDate}
                </span>
              </div>
            </div>

            {/* Check-in CTA */}
            {!checkedIn ? (
              <Link
                href="/player/success/checkin"
                className="flex items-center justify-between rounded-2xl bg-[#f0b429] text-[#1a3a1a] p-4 hover:bg-[#f5c542] transition-colors"
              >
                <div>
                  <p className="font-bold text-base">Daily Check-In</p>
                  <p className="text-[#1a3a1a]/70 text-sm">
                    Tap to log today&apos;s actions — 30 seconds
                  </p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="rounded-2xl bg-green-900/40 border border-green-500/30 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-300 font-semibold text-sm">Checked in today!</p>
                  <p className="text-[#f0b429]/50 text-xs">
                    {todayCI ? `${todayCI.score}/3 actions done` : ""} — see you tomorrow.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/15 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <p className="text-2xl font-bold text-[#f0b429]">{streak}</p>
                </div>
                <p className="text-xs text-[#f0b429]/50">Day streak</p>
              </div>
              <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/15 p-3 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{probability}%</p>
                <p className="text-xs text-[#f0b429]/50">Success prob.</p>
              </div>
              <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/15 p-3 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{rate}%</p>
                <p className="text-xs text-[#f0b429]/50">This week</p>
              </div>
            </div>

            {/* Success Probability Bar */}
            <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#f0b429]/70 text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Goal Success Probability
                </p>
                <span className="text-[#f0b429] font-bold text-sm">{probability}%</span>
              </div>
              <div className="h-3 bg-[#f0b429]/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${probability}%`,
                    background: probability >= 70
                      ? "#22c55e"
                      : probability >= 40
                        ? "#f0b429"
                        : "#ef4444",
                  }}
                />
              </div>
              <p className="text-[#f0b429]/40 text-xs mt-1">
                {probability >= 70
                  ? "You're on track — keep the momentum!"
                  : probability >= 40
                    ? "Building up — consistency is key."
                    : "Every day you check in boosts this number."}
              </p>
            </div>

            {/* Week Grid */}
            <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4">
              <p className="text-[#f0b429]/70 text-xs font-medium uppercase tracking-wide mb-3">
                This Week
              </p>
              <div className="flex gap-2">
                {weekGrid.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        day.status === "done"
                          ? "bg-[#f0b429]"
                          : day.status === "future"
                            ? "bg-[#f0b429]/5 border border-[#f0b429]/15"
                            : "bg-red-900/40 border border-red-500/20"
                      }`}
                    >
                      {day.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1a3a1a]" />
                      ) : day.status === "future" ? (
                        <Circle className="w-3 h-3 text-[#f0b429]/20" />
                      ) : (
                        <Circle className="w-3 h-3 text-red-400/50" />
                      )}
                    </div>
                    <p className="text-[#f0b429]/40 text-xs">{day.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Actions (read-only — link to check-in to mark) */}
            <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4">
              <p className="text-[#f0b429]/70 text-xs font-medium uppercase tracking-wide mb-3">
                Today&apos;s 3 Actions
              </p>
              <div className="space-y-3">
                {goal.actions.map((action, i) => {
                  const done =
                    todayCI
                      ? i === 0
                        ? todayCI.action1
                        : i === 1
                          ? todayCI.action2
                          : todayCI.action3
                      : false;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#f0b429] flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#f0b429]/20 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${done ? "text-[#f0b429]/50 line-through" : "text-[#f0b429]/80"}`}>
                        {action}
                      </p>
                    </div>
                  );
                })}
              </div>
              {!checkedIn && (
                <Link
                  href="/player/success/checkin"
                  className="mt-3 flex items-center justify-center gap-1 text-[#f0b429] text-sm font-medium"
                >
                  Mark actions complete <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Adjustment Card */}
            {showAdjust && <AdjustmentCard goal={goal} />}

            {/* Weekly Report */}
            <WeeklyReportCard goal={goal} />

            {/* Reset */}
            <button
              onClick={handleClear}
              disabled={clearing}
              className="w-full flex items-center justify-center gap-2 text-[#f0b429]/30 text-xs py-2 hover:text-[#f0b429]/50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset goal & start over
            </button>

          </div>
        )}

      </main>
    </div>
  );
}
