"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getGoal,
  hasGoal,
  hasCheckedInToday,
  shouldShowAdjustment,
  hasSeenAdjustmentThisWeek,
} from "@/lib/success/storage";
import {
  getCurrentStreak,
  calculateSuccessProbability,
  getDaysRemaining,
  weeklyRate,
  getWeekGrid,
} from "@/lib/success/streak";
import { scheduleSessionReminder } from "@/lib/success/notifications";
import {
  Flame,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  Settings2,
  ChevronRight,
} from "lucide-react";

export default function SuccessDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!hasGoal()) {
      router.replace("/player/success/goal");
      return;
    }
    // Restore session reminder
    const goal = getGoal();
    if (goal) scheduleSessionReminder(goal.reminderHour, goal.reminderMinute);
    // Redirect to adjustment engine if triggered
    if (shouldShowAdjustment() && !hasSeenAdjustmentThisWeek()) {
      router.replace("/player/success/adjust");
    }
  }, [mounted, router]);

  if (!mounted) return null;

  const goal = getGoal();
  if (!goal) return null;

  const streak = getCurrentStreak();
  const probability = calculateSuccessProbability();
  const daysRemaining = getDaysRemaining();
  const rate = weeklyRate();
  const grid = getWeekGrid();
  const checkedInToday = hasCheckedInToday();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Mangwanani 🌅";
    if (h < 17) return "Masikati ☀️";
    return "Manheru 🌙";
  };

  const streakLabel =
    streak === 0
      ? "Start your streak today"
      : streak === 1
      ? "1 day streak — keep going!"
      : `${streak} day streak 🔥`;

  const probColor =
    probability >= 70 ? "#1B5E20" : probability >= 40 ? "#F9A825" : "#B71C1C";

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-10">
      {/* Header */}
      <div className="px-5 pt-10 pb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F9A825] mb-1">
          THUTO Success Engine
        </p>
        <h1 className="text-xl font-bold">{greeting()}</h1>
        <p className="text-sm text-white/50 mt-0.5 truncate">{goal.goalText}</p>
      </div>

      <div className="px-5 space-y-4">
        {/* Check-in CTA */}
        {!checkedInToday ? (
          <button
            onClick={() => router.push("/player/success/checkin")}
            className="w-full rounded-2xl bg-[#1B5E20] border border-[#2e7d32] p-5 flex items-center justify-between hover:bg-[#2e7d32] transition-colors"
          >
            <div>
              <p className="text-sm font-bold text-[#F9A825]">Daily Check-In</p>
              <p className="text-xs text-white/60 mt-0.5">Log today&apos;s training — 30 seconds</p>
            </div>
            <ChevronRight size={20} className="text-white/50" />
          </button>
        ) : (
          <div className="w-full rounded-2xl bg-white/5 border border-[#1B5E20]/40 p-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-[#1B5E20] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Checked in today ✅</p>
              <p className="text-xs text-white/40">Unokwanisa — you showed up!</p>
            </div>
          </div>
        )}

        {/* Success Probability */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#F9A825]" />
              <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Success Probability
              </span>
            </div>
            <span className="text-2xl font-bold" style={{ color: probColor }}>
              {probability}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${probability}%`, backgroundColor: probColor }}
            />
          </div>
          <p className="text-xs text-white/40 mt-2">
            {daysRemaining} days remaining • {rate}% this week
          </p>
        </div>

        {/* Streak + Week Grid */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-[#F9A825]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-white/50">
              Streak
            </span>
          </div>
          <p className="text-sm font-semibold text-white mb-4">{streakLabel}</p>

          {/* 7-day circles */}
          <div className="flex items-center justify-between">
            {grid.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    day.status === "done"
                      ? "bg-[#1B5E20] text-white"
                      : day.status === "future"
                      ? "bg-white/5 text-white/20 border border-white/10"
                      : "bg-[#B71C1C]/30 border border-[#B71C1C]/40 text-[#B71C1C]"
                  }`}
                >
                  {day.status === "done" ? "✓" : day.status === "future" ? "·" : "✗"}
                </div>
                <span className="text-[10px] text-white/30">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/player/success/report")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors text-left"
          >
            <BarChart2 size={18} className="text-[#F9A825]" />
            <span className="text-sm font-semibold">Weekly Report</span>
            <span className="text-xs text-white/40">AI analysis of your week</span>
          </button>

          <button
            onClick={() => router.push("/player/success/goal")}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2 hover:bg-white/10 transition-colors text-left"
          >
            <Settings2 size={18} className="text-[#F9A825]" />
            <span className="text-sm font-semibold">Change Goal</span>
            <span className="text-xs text-white/40">Update your commitment</span>
          </button>
        </div>

        {/* Goal card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
            Your Commitment
          </p>
          <p className="text-sm text-white/90 leading-relaxed mb-3">
            &ldquo;{goal.goalText}&rdquo;
          </p>
          <p className="text-xs text-white/40 italic">&ldquo;{goal.whyText}&rdquo;</p>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-xs text-white/30">Target: {goal.targetDate}</p>
          </div>
        </div>

        {/* Today's actions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-3">
            Today&apos;s Actions
          </p>
          <div className="space-y-2.5">
            {goal.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border border-[#F9A825]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[#F9A825]">{i + 1}</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
          {!checkedInToday && (
            <button
              onClick={() => router.push("/player/success/checkin")}
              className="mt-4 w-full rounded-xl bg-[#F9A825] text-[#121212] py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Log Today&apos;s Progress
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
