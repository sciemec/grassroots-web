"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGoal, getWeeklyReportData } from "@/lib/success/storage";
import {
  getCurrentStreak,
  calculateSuccessProbability,
  getDaysRemaining,
  weeklyRate,
  getWeekGrid,
} from "@/lib/success/streak";
import { ChevronLeft, BarChart2, Loader2, Share2 } from "lucide-react";

export default function WeeklyReportPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const goal = getGoal();
  if (!goal) {
    router.replace("/player/success/goal");
    return null;
  }

  const reportData = getWeeklyReportData();
  const streak = getCurrentStreak();
  const probability = calculateSuccessProbability();
  const daysRemaining = getDaysRemaining();
  const rate = weeklyRate();
  const grid = getWeekGrid();

  async function generateAnalysis() {
    if (!reportData) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/success-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal!.goalText,
          completionRate: reportData.completionRate,
          strongestAction: reportData.strongestAction,
          weakestAction: reportData.weakestAction,
          streak,
          daysRemaining,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch {
      setError("Could not generate analysis. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleShare() {
    const text = `My THUTO Weekly Report 🏆\n\nGoal: ${goal!.goalText}\nCompletion: ${rate}%\nStreak: ${streak} days\nSuccess probability: ${probability}%\n\nTrack your goals at grassrootssports.live`;
    if (navigator.share) {
      navigator.share({ title: "THUTO Weekly Report", text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert("Report copied to clipboard!"));
    }
  }

  const probColor =
    probability >= 70 ? "#1B5E20" : probability >= 40 ? "#F9A825" : "#B71C1C";

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-10">
      {/* Header */}
      <div className="px-5 pt-10 pb-5 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F9A825]">
            Weekly Report
          </p>
          <p className="text-sm text-white/50 truncate max-w-[240px]">{goal.goalText}</p>
        </div>
        <button
          onClick={handleShare}
          className="ml-auto w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <Share2 size={14} />
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* Completion rate */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
              This Week
            </p>
            <span className="text-3xl font-bold text-[#F9A825]">{rate}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 mb-3">
            <div
              className="h-2 rounded-full bg-[#F9A825] transition-all duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>

          {/* 7-day grid */}
          <div className="flex items-center justify-between mt-4">
            {grid.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    day.status === "done"
                      ? "bg-[#1B5E20] text-white"
                      : day.status === "future"
                      ? "bg-white/5 text-white/20 border border-white/10"
                      : "bg-[#B71C1C]/30 border border-[#B71C1C]/40 text-[#B71C1C]"
                  }`}
                >
                  {day.status === "done" ? "✓" : day.status === "future" ? "·" : "✗"}
                </div>
                <span className="text-[9px] text-white/30">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-[#F9A825]">{streak}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Day streak</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xl font-bold" style={{ color: probColor }}>
              {probability}%
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">Success prob.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-xl font-bold text-white">{daysRemaining}</p>
            <p className="text-[10px] text-white/40 mt-0.5">Days left</p>
          </div>
        </div>

        {reportData && (
          <>
            {/* Strongest / Weakest */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#1B5E20]/40 bg-[#1B5E20]/10 p-4">
                <p className="text-[10px] font-semibold text-[#1B5E20] uppercase tracking-wide mb-1">
                  Strongest ✅
                </p>
                <p className="text-xs text-white/80 leading-relaxed line-clamp-3">
                  {reportData.strongestAction}
                </p>
                <p className="text-xs text-[#1B5E20] mt-1 font-semibold">
                  {reportData.strongestDays}/7 days
                </p>
              </div>
              <div className="rounded-2xl border border-[#B71C1C]/30 bg-[#B71C1C]/10 p-4">
                <p className="text-[10px] font-semibold text-[#B71C1C] uppercase tracking-wide mb-1">
                  Needs Work ⚠️
                </p>
                <p className="text-xs text-white/80 leading-relaxed line-clamp-3">
                  {reportData.weakestAction}
                </p>
                <p className="text-xs text-[#B71C1C] mt-1 font-semibold">
                  {reportData.weakestDays}/7 days
                </p>
              </div>
            </div>

            {/* Raw totals */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
                Actions This Week
              </p>
              <p className="text-sm text-white/70">
                {reportData.totalDone} of {reportData.totalPossible} actions completed
              </p>
            </div>
          </>
        )}

        {/* AI Analysis */}
        <div className="rounded-2xl border border-[#F9A825]/20 bg-[#F9A825]/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-[#F9A825]" />
            <p className="text-xs font-semibold text-[#F9A825] uppercase tracking-wide">
              THUTO AI Analysis
            </p>
          </div>

          {!analysis && !loading && (
            <button
              onClick={generateAnalysis}
              className="w-full rounded-xl bg-[#F9A825] text-[#121212] py-2.5 text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Generate Analysis
            </button>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Loader2 size={14} className="animate-spin" />
              THUTO is reading your week…
            </div>
          )}

          {error && (
            <div className="text-sm text-[#B71C1C]">{error}</div>
          )}

          {analysis && (
            <div>
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">
                {analysis}
              </p>
              <button
                onClick={generateAnalysis}
                className="mt-3 text-xs text-[#F9A825]/60 hover:text-[#F9A825] transition-colors"
              >
                Regenerate
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/player/success")}
          className="w-full rounded-xl bg-[#1B5E20] py-3.5 text-sm font-semibold hover:bg-[#2e7d32] transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
