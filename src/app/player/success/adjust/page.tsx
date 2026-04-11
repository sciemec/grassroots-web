"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGoal, saveAdjustmentSeen } from "@/lib/success/storage";
import { ChevronLeft, Loader2, RefreshCcw } from "lucide-react";

const STRUGGLE_REASONS = [
  "My schedule changed and I don't have time for all 3 actions",
  "Load-shedding affected my routine (no power for training / cooking)",
  "The actions feel too hard — I need smaller steps",
  "I'm injured or unwell and couldn't train",
  "I lost motivation — I'm not sure why I'm doing this",
];

export default function AdjustmentEnginePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const goal = getGoal();
  if (!goal) {
    router.replace("/player/success/goal");
    return null;
  }

  async function handleSubmit() {
    if (selectedReason === null) return;
    setLoading(true);
    setError("");
    saveAdjustmentSeen();

    try {
      const res = await fetch("/api/success-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal!.goalText,
          reason: STRUGGLE_REASONS[selectedReason],
          actions: goal!.actions,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResponse(data.response);
      setDone(true);
    } catch {
      setError("Could not get a response. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    router.push("/player/success");
  }

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
            THUTO Adjustment Engine
          </p>
          <p className="text-sm text-white/50">Let&apos;s adapt your plan</p>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {!done ? (
          <>
            {/* Intro */}
            <div className="rounded-2xl border border-[#F9A825]/20 bg-[#F9A825]/5 p-5">
              <p className="text-sm text-white/90 leading-relaxed">
                THUTO noticed you&apos;ve had a tough few days.{" "}
                <span className="text-[#F9A825] font-semibold">That&apos;s normal.</span> Every
                champion hits walls. Let&apos;s figure out what&apos;s getting in the way and
                adjust your plan so you can keep moving forward.
              </p>
            </div>

            {/* Goal reminder */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-1">
                Your Goal
              </p>
              <p className="text-sm text-white/80 leading-relaxed">&ldquo;{goal.goalText}&rdquo;</p>
            </div>

            {/* Reason selector */}
            <div>
              <p className="text-sm font-semibold text-white mb-3">
                What&apos;s making it hard right now?
              </p>
              <div className="space-y-2.5">
                {STRUGGLE_REASONS.map((reason, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedReason(i)}
                    className={`w-full text-left rounded-xl border p-4 text-sm leading-relaxed transition-colors ${
                      selectedReason === i
                        ? "border-[#F9A825]/60 bg-[#F9A825]/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full border mr-2 align-middle ${
                        selectedReason === i
                          ? "border-[#F9A825] bg-[#F9A825]"
                          : "border-white/20"
                      }`}
                    />
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-[#B71C1C]">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={selectedReason === null || loading}
              className="w-full rounded-xl bg-[#F9A825] text-[#121212] py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> THUTO is thinking…
                </>
              ) : (
                "Get THUTO&apos;s Advice"
              )}
            </button>

            <button
              onClick={handleContinue}
              className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              Skip — I&apos;ll push through
            </button>
          </>
        ) : (
          /* Response state */
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F9A825]/20 bg-[#F9A825]/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCcw size={16} className="text-[#F9A825]" />
                <p className="text-xs font-semibold text-[#F9A825] uppercase tracking-wide">
                  THUTO&apos;s Adjustment
                </p>
              </div>
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">
                {response}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                Your Struggle
              </p>
              <p className="text-xs text-white/60 italic">
                &ldquo;{selectedReason !== null ? STRUGGLE_REASONS[selectedReason] : ""}&rdquo;
              </p>
            </div>

            <p className="text-xs text-white/30 text-center leading-relaxed">
              THUTO won&apos;t ask about this again this week. Focus on tomorrow.
            </p>

            <button
              onClick={handleContinue}
              className="w-full rounded-xl bg-[#1B5E20] py-3.5 text-sm font-semibold hover:bg-[#2e7d32] transition-colors"
            >
              Back to Dashboard — Pamberi! 🔥
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
