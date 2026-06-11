"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame, Target, Calendar, ChevronRight, ArrowLeft,
  CheckCircle2, Circle, TrendingUp, Zap, AlertTriangle,
  RefreshCw, Bell, BarChart3, Loader2, Users,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  getGoal, clearGoal, saveGoal, shouldShowAdjustment,
  hasSeenAdjustmentThisWeek, saveAdjustmentSeen, getWeeklyReportData,
  getTodayCheckIn, hasCheckedInToday, type Goal,
} from "@/lib/success/storage";
import {
  getCurrentStreak, calculateSuccessProbability,
  getDaysRemaining, weeklyRate, getWeekGrid,
} from "@/lib/success/streak";
import {
  detectCoachGoalType, COACH_ACTION_BLUEPRINTS, getCoachActionsForGoal,
  type CoachGoalType,
} from "@/lib/success/coach-actions";
import {
  requestNotificationPermission, scheduleDailyReminder,
} from "@/lib/success/notifications";

// localStorage key — separate from player engine
const COACH_GOAL_KEY  = "thuto_coach_goal";
const COACH_CI_KEY    = "thuto_coach_checkins";
const COACH_ADJ_KEY   = "thuto_coach_adjust_seen";

// ── Coach-scoped storage wrappers ─────────────────────────────────────────────
// We reuse the same Goal / CheckIn types but under a different localStorage key

function getCoachGoal(): Goal | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COACH_GOAL_KEY);
  return raw ? (JSON.parse(raw) as Goal) : null;
}

function saveCoachGoal(goal: Goal): void {
  localStorage.setItem(COACH_GOAL_KEY, JSON.stringify(goal));
}

function clearCoachGoal(): void {
  localStorage.removeItem(COACH_GOAL_KEY);
  localStorage.removeItem(COACH_CI_KEY);
  localStorage.removeItem(COACH_ADJ_KEY);
}

function getAllCoachCheckIns() {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(COACH_CI_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function getTodayCoachCheckIn() {
  const today = new Date().toISOString().split("T")[0];
  return getAllCoachCheckIns().find((c: { date: string }) => c.date === today) ?? null;
}

function hasCheckedInTodayCoach(): boolean {
  return !!getTodayCoachCheckIn();
}

function getCoachLastSevenCheckIns() {
  return getAllCoachCheckIns().slice(0, 7);
}

function getCoachCurrentStreak(): number {
  const checkIns = getAllCoachCheckIns();
  if (!checkIns.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < checkIns.length; i++) {
    const d    = new Date(checkIns[i].date);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff === i && checkIns[i].score >= 2) streak++;
    else break;
  }
  return streak;
}

function getCoachSuccessProbability(goal: Goal): number {
  const checkIns = getAllCoachCheckIns();
  if (!checkIns.length) return 50;
  const totalPossible = checkIns.length * 3;
  const totalDone     = checkIns.reduce((s: number, c: { score: number }) => s + c.score, 0);
  const adherence     = totalDone / totalPossible;
  const base          = adherence * 100;
  const streak        = getCoachCurrentStreak();
  const streakBonus   = Math.min(Math.floor(streak / 7) * 2, 10);
  const target        = new Date(goal.targetDate);
  const today         = new Date();
  const daysLeft      = Math.floor((target.getTime() - today.getTime()) / 86400000);
  const timePenalty   = daysLeft < 30 ? 10 : 0;
  const recent        = getCoachLastSevenCheckIns();
  const allDone       = recent.length === 7 && recent.every((c: { score: number }) => c.score >= 2);
  const bonus         = allDone ? 5 : 0;
  return Math.max(10, Math.min(95, Math.round(base + streakBonus + bonus - timePenalty)));
}

function getCoachWeeklyRate(): number {
  const last7 = getCoachLastSevenCheckIns();
  if (!last7.length) return 0;
  const total = last7.reduce((s: number, c: { score: number }) => s + c.score, 0);
  return Math.round((total / (last7.length * 3)) * 100);
}

function getCoachWeekGrid() {
  const checkIns = getAllCoachCheckIns();
  const today    = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d       = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const label   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    if (d > today) return { label, status: "future" as const };
    const ci = checkIns.find((c: { date: string; score: number }) => c.date === dateStr);
    return {
      label,
      status: ci && ci.score >= 2 ? ("done" as const) : ("missed" as const),
    };
  });
}

function getCoachWeeklyReportData(goal: Goal) {
  const last7 = getCoachLastSevenCheckIns();
  if (!last7.length) return null;
  const totalPossible = last7.length * 3;
  const totalDone     = last7.reduce((s: number, c: { score: number }) => s + c.score, 0);
  const completionRate = Math.round((totalDone / totalPossible) * 100);
  const a1Done = last7.filter((c: { action1: boolean }) => c.action1).length;
  const a2Done = last7.filter((c: { action2: boolean }) => c.action2).length;
  const a3Done = last7.filter((c: { action3: boolean }) => c.action3).length;
  const scores = [a1Done, a2Done, a3Done];
  const maxIdx = scores.indexOf(Math.max(...scores));
  const minIdx = scores.indexOf(Math.min(...scores));
  return {
    completionRate,
    strongestAction: goal.actions[maxIdx] ?? goal.actions[0],
    weakestAction:   goal.actions[minIdx] ?? goal.actions[2],
  };
}

function shouldCoachShowAdjustment(): boolean {
  const last3 = getAllCoachCheckIns().slice(0, 3);
  if (last3.length < 3) return false;
  return last3.every((c: { score: number }) => c.score / 3 < 0.7);
}

function getISOWeek(): string {
  const d   = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const year = d.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${week}`;
}

function hasCoachSeenAdjustmentThisWeek(): boolean {
  return localStorage.getItem(COACH_ADJ_KEY) === getISOWeek();
}

function saveCoachAdjustmentSeen(): void {
  localStorage.setItem(COACH_ADJ_KEY, getISOWeek());
}

// ── Goal Setup ────────────────────────────────────────────────────────────────

function CoachGoalSetup({ onSave }: { onSave: () => void }) {
  const [goalText, setGoalText] = useState("");
  const [whyText,  setWhyText]  = useState("");
  const [days,     setDays]     = useState(90);
  const [hour,     setHour]     = useState(7);
  const [minute,   setMinute]   = useState(0);
  const [saving,   setSaving]   = useState(false);
  const [step,     setStep]     = useState<1 | 2>(1);

  const detected  = goalText.trim() ? detectCoachGoalType(goalText) : null;
  const blueprint = detected ? COACH_ACTION_BLUEPRINTS[detected as CoachGoalType] : null;
  const previewActs = goalText.trim() ? getCoachActionsForGoal(goalText) : null;

  const handleSave = async () => {
    if (!goalText.trim() || !whyText.trim()) return;
    setSaving(true);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    saveCoachGoal({
      id:             crypto.randomUUID(),
      goalText:       goalText.trim(),
      whyText:        whyText.trim(),
      targetDate:     targetDate.toISOString().split("T")[0],
      createdAt:      new Date().toISOString().split("T")[0],
      actions:        getCoachActionsForGoal(goalText.trim()),
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
        <h2 className="text-xl font-bold text-white">Set Your Coaching Goal</h2>
        <p className="text-white/60 text-sm mt-1">THUTO builds you a daily coaching action plan</p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4 space-y-3">
            <div>
              <label className="text-white/70 text-xs font-medium uppercase tracking-wide">
                My Coaching Goal
              </label>
              <textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="e.g. Get my team promoted to Division 1 this season"
                rows={2}
                className="mt-1 w-full bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none"
              />
            </div>
            <div className="border-t border-[#f0b429]/10 pt-3">
              <label className="text-white/70 text-xs font-medium uppercase tracking-wide">
                Why does this matter to you?
              </label>
              <textarea
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                placeholder="e.g. These kids deserve a chance to be seen. I want to give them the opportunity I never had."
                rows={2}
                className="mt-1 w-full bg-transparent text-white placeholder-white/30 text-sm resize-none focus:outline-none"
              />
            </div>
          </div>

          {blueprint && (
            <div className="rounded-xl bg-[#f0b429]/10 border border-[#f0b429]/20 p-3">
              <p className="text-[#f0b429] text-xs font-semibold uppercase tracking-wide mb-2">
                {blueprint.label} — Your 3 Daily Coaching Actions
              </p>
              {previewActs?.map((a, i) => (
                <p key={i} className="text-white/80 text-xs mb-1">
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
          <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4 space-y-4">
            <div>
              <label className="text-white/70 text-xs font-medium uppercase tracking-wide">
                Days until goal target
              </label>
              <div className="flex items-center gap-3 mt-2">
                {[30, 60, 90, 180].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      days === d ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/70"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-white/70 text-xs font-medium uppercase tracking-wide flex items-center gap-1">
                <Bell className="w-3 h-3" /> Daily reminder time
              </label>
              <div className="flex items-center gap-2 mt-2">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 text-sm"
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
                  className="flex-1 bg-white/10 text-white rounded-lg px-3 py-2 text-sm"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m} className="bg-[#1a3d26]">
                      :{String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-white/40 text-xs mt-1">THUTO will remind you at this time each day</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl bg-white/10 text-white/70 font-medium">
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

function CoachAdjustmentCard({ goal }: { goal: Goal }) {
  const [reason,    setReason]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [response,  setResponse]  = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const handleAsk = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/coach/success-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.goalText, reason, actions: goal.actions }),
      });
      const data = await res.json();
      setResponse(data.response ?? null);
    } catch {
      setResponse("Every session you run is making a difference. Keep going — Pamberi!");
    } finally {
      setLoading(false);
      saveCoachAdjustmentSeen();
    }
  };

  if (dismissed) return null;

  return (
    <div className="rounded-2xl bg-amber-900/30 border border-amber-500/30 p-4">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-300 font-semibold text-sm">Struggling this week?</p>
          <p className="text-white/60 text-xs mt-0.5">
            THUTO noticed you&apos;ve been missing coaching actions. Tell me what&apos;s getting in the way.
          </p>
        </div>
      </div>

      {!response ? (
        <>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Players not showing up. No pitch access this week. Work is overwhelming."
            rows={2}
            className="w-full bg-white/5 border border-[#f0b429]/10 rounded-lg px-3 py-2 text-white/80 text-sm placeholder-white/30 resize-none focus:outline-none"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setDismissed(true)} className="px-3 py-2 text-white/40 text-sm">
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
        <div className="bg-white/5 rounded-lg p-3 text-white/80 text-sm whitespace-pre-wrap">
          {response}
        </div>
      )}
    </div>
  );
}

// ── Weekly Report Card ────────────────────────────────────────────────────────

function CoachWeeklyReportCard({ goal }: { goal: Goal }) {
  const [loading,  setLoading]  = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const reportData = getCoachWeeklyReportData(goal);
  const streak     = getCoachCurrentStreak();
  const daysLeft   = Math.max(
    0,
    Math.floor((new Date(goal.targetDate).getTime() - new Date().getTime()) / 86400000)
  );

  if (!reportData) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coach/success-analysis", {
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
      setAnalysis("You showed up for your squad this week. That consistency is what builds champions — Ramba uchishanda!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#f0b429]" />
          <p className="text-white font-semibold text-sm">Weekly Coaching Report</p>
        </div>
        <span className="text-xs text-white/50">{reportData.completionRate}% completion</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-green-900/30 rounded-lg p-2">
          <p className="text-xs text-green-400 font-medium">Strongest</p>
          <p className="text-white text-xs mt-0.5 line-clamp-2">{reportData.strongestAction}</p>
        </div>
        <div className="bg-amber-900/30 rounded-lg p-2">
          <p className="text-xs text-amber-400 font-medium">Needs work</p>
          <p className="text-white text-xs mt-0.5 line-clamp-2">{reportData.weakestAction}</p>
        </div>
      </div>

      {analysis ? (
        <div className="bg-white/5 rounded-lg p-3 text-white/80 text-sm whitespace-pre-wrap">
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

export default function CoachSuccessPage() {
  const router   = useRouter();
  const [goal,    setGoal]    = useState<Goal | null>(null);
  const [loaded,  setLoaded]  = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setGoal(getCoachGoal());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (!window.confirm("Clear your coaching goal? All check-in history will be erased too.")) return;
    setClearing(true);
    clearCoachGoal();
    setGoal(null);
    setClearing(false);
  };

  const streak      = goal ? getCoachCurrentStreak()          : 0;
  const probability = goal ? getCoachSuccessProbability(goal) : 50;
  const rate        = goal ? getCoachWeeklyRate()             : 0;
  const weekGrid    = goal ? getCoachWeekGrid()               : [];
  const checkedIn   = goal ? hasCheckedInTodayCoach()         : false;
  const todayCI     = goal ? getTodayCoachCheckIn()           : null;
  const showAdjust  = goal ? shouldCoachShowAdjustment() && !hasCoachSeenAdjustmentThisWeek() : false;
  const daysLeft    = goal
    ? Math.max(0, Math.floor((new Date(goal.targetDate).getTime() - new Date().getTime()) / 86400000))
    : 0;

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
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#f0b429]" /> Coaching Success Engine
            </h1>
            <p className="text-sm text-white/60">Daily actions. Real results. For your squad.</p>
          </div>
        </div>

        {/* Goal Setup */}
        {!goal && <CoachGoalSetup onSave={() => setGoal(getCoachGoal())} />}

        {/* Dashboard */}
        {goal && (
          <div className="space-y-4">

            {/* Goal Card */}
            <div className="rounded-2xl bg-white/10 border border-[#f0b429]/10 p-4">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-[#f0b429] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#f0b429] font-semibold uppercase tracking-wide mb-1">
                    My Coaching Goal
                  </p>
                  <p className="text-white font-bold text-base leading-snug">{goal.goalText}</p>
                  <p className="text-white/50 text-xs mt-1 italic">&ldquo;{goal.whyText}&rdquo;</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {daysLeft} days left
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" /> {goal.targetDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in CTA */}
            {!checkedIn ? (
              <Link
                href="/coach/success/checkin"
                className="flex items-center justify-between rounded-2xl bg-[#f0b429] text-[#1a3a1a] p-4 hover:bg-[#f5c542] transition-colors"
              >
                <div>
                  <p className="font-bold text-base">Daily Coaching Check-In</p>
                  <p className="text-[#1a3a1a]/70 text-sm">Log today&apos;s coaching actions — 30 seconds</p>
                </div>
                <ChevronRight className="w-5 h-5" />
              </Link>
            ) : (
              <div className="rounded-2xl bg-green-900/40 border border-green-500/30 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div>
                  <p className="text-green-300 font-semibold text-sm">Checked in today!</p>
                  <p className="text-white/50 text-xs">
                    {todayCI ? `${todayCI.score}/3 actions done` : ""} — great coaching work.
                  </p>
                </div>
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 border border-[#f0b429]/10 p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <p className="text-2xl font-bold text-white">{streak}</p>
                </div>
                <p className="text-xs text-white/50">Day streak</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-[#f0b429]/10 p-3 text-center">
                <p className="text-2xl font-bold text-[#f0b429]">{probability}%</p>
                <p className="text-xs text-white/50">Goal odds</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-[#f0b429]/10 p-3 text-center">
                <p className="text-2xl font-bold text-white">{rate}%</p>
                <p className="text-xs text-white/50">This week</p>
              </div>
            </div>

            {/* Probability Bar */}
            <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/70 text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> Goal Success Probability
                </p>
                <span className="text-[#f0b429] font-bold text-sm">{probability}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${probability}%`,
                    background: probability >= 70 ? "#22c55e" : probability >= 40 ? "#f0b429" : "#ef4444",
                  }}
                />
              </div>
              <p className="text-white/40 text-xs mt-1">
                {probability >= 70
                  ? "Your squad is lucky to have a coach this committed."
                  : probability >= 40
                    ? "Building momentum — every session you run matters."
                    : "Each check-in raises this score. Show up today."}
              </p>
            </div>

            {/* Week Grid */}
            <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-3">
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
                            ? "bg-white/5 border border-[#f0b429]/10"
                            : "bg-red-900/40 border border-red-500/20"
                      }`}
                    >
                      {day.status === "done" ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1a3a1a]" />
                      ) : day.status === "future" ? (
                        <Circle className="w-3 h-3 text-white/20" />
                      ) : (
                        <Circle className="w-3 h-3 text-red-400/50" />
                      )}
                    </div>
                    <p className="text-white/40 text-xs">{day.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Actions */}
            <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide mb-3">
                Today&apos;s 3 Coaching Actions
              </p>
              <div className="space-y-3">
                {goal.actions.map((action, i) => {
                  const done = todayCI
                    ? i === 0 ? todayCI.action1 : i === 1 ? todayCI.action2 : todayCI.action3
                    : false;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-[#f0b429] flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-white/20 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${done ? "text-white/50 line-through" : "text-white/80"}`}>
                        {action}
                      </p>
                    </div>
                  );
                })}
              </div>
              {!checkedIn && (
                <Link
                  href="/coach/success/checkin"
                  className="mt-3 flex items-center justify-center gap-1 text-[#f0b429] text-sm font-medium"
                >
                  Mark actions complete <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>

            {/* Adjustment Card */}
            {showAdjust && <CoachAdjustmentCard goal={goal} />}

            {/* Weekly Report */}
            <CoachWeeklyReportCard goal={goal} />

            {/* Reset */}
            <button
              onClick={handleClear}
              disabled={clearing}
              className="w-full flex items-center justify-center gap-2 text-white/30 text-xs py-2 hover:text-white/50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reset goal & start over
            </button>

          </div>
        )}
      </main>
    </div>
  );
}
