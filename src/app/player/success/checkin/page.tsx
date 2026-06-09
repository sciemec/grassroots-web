"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Flame, ArrowLeft, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  getGoal, saveCheckIn, hasCheckedInToday, getTodayCheckIn, type Goal,
} from "@/lib/success/storage";

export default function CheckInPage() {
  const router = useRouter();

  const [goal,     setGoal]     = useState<Goal | null>(null);
  const [loaded,   setLoaded]   = useState(false);
  const [a1, setA1] = useState(false);
  const [a2, setA2] = useState(false);
  const [a3, setA3] = useState(false);
  const [mood,     setMood]     = useState(7);
  const [moodNote, setMoodNote] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [thutoMsg, setThutoMsg] = useState<string | null>(null);

  useEffect(() => {
    const g = getGoal();
    setGoal(g);

    // Pre-populate from existing check-in (allow edits during the day)
    const existing = getTodayCheckIn();
    if (existing) {
      setA1(existing.action1);
      setA2(existing.action2);
      setA3(existing.action3);
      setMood(existing.mood ?? 7);
      setMoodNote(existing.moodNote ?? "");
      setThutoMsg(existing.thutoMessage ?? null);
    }

    setLoaded(true);
  }, []);

  const score = [a1, a2, a3].filter(Boolean).length;

  const handleSubmit = async () => {
    if (!goal) return;
    setSaving(true);

    // Get a short THUTO message based on score
    let message: string | undefined;
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `A Zimbabwean athlete just checked in for the day. They completed ${score}/3 daily actions.
Their goal: "${goal.goalText}". Mood: ${mood}/10.
Write ONE short motivational line (max 15 words). End with a Shona phrase. No intro — just the line.`,
          system_prompt: "You are THUTO, a motivational AI coach for Zimbabwean athletes. Be concise and warm.",
        }),
      });
      const data = await res.json();
      message = data.response?.trim();
    } catch {
      const fallbacks = [
        "Every action counts. Pamberi! 🔥",
        "Keep building. Ramba uchishanda! 💪",
        "You showed up. That's everything. Unokwanisa! 🌟",
      ];
      message = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    const today = new Date().toISOString().split("T")[0];
    saveCheckIn({
      date:          today,
      action1:       a1,
      action2:       a2,
      action3:       a3,
      score,
      timestamp:     Date.now(),
      mood,
      moodNote:      moodNote.trim() || undefined,
      thutoMessage:  message,
    });

    setThutoMsg(message ?? null);
    setSaving(false);
    setDone(true);
  };

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

  if (!goal) {
    return (
      <div className="flex min-h-screen bg-[#1a5c2a]">
        <Sidebar />
        <main className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <Flame className="w-12 h-12 text-[#f0b429] mb-4" />
          <p className="text-[#f0b429] font-semibold mb-2">No goal set yet</p>
          <p className="text-[#f0b429]/50 text-sm mb-4">Set your goal first to start daily check-ins.</p>
          <button
            onClick={() => router.push("/player/success")}
            className="bg-[#f0b429] text-[#1a3a1a] font-semibold px-6 py-3 rounded-xl"
          >
            Set My Goal
          </button>
        </main>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="flex min-h-screen bg-[#1a5c2a]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 max-w-lg mx-auto w-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-[#f0b429]/10 hover:bg-[#f0b429]/20 text-[#f0b429]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#f0b429]">Daily Check-In</h1>
            <p className="text-sm text-[#f0b429]/50">{today}</p>
          </div>
        </div>

        {/* Done state */}
        {done ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/30 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f0b429]/20 border-2 border-[#f0b429] mb-4">
                <span className="text-3xl font-bold text-[#f0b429]">{score}/3</span>
              </div>
              <p className="text-[#f0b429] font-bold text-lg mb-1">
                {score === 3 ? "Perfect day!" : score === 2 ? "Great effort!" : score === 1 ? "You showed up." : "Rest day logged."}
              </p>
              {thutoMsg && (
                <p className="text-[#f0b429] text-sm font-medium italic mt-2">&ldquo;{thutoMsg}&rdquo;</p>
              )}
            </div>

            <button
              onClick={() => router.push("/player/success")}
              className="w-full bg-[#f0b429] text-[#1a3a1a] font-semibold py-3 rounded-xl"
            >
              Back to Success Engine
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Goal reminder */}
            <div className="rounded-xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-3">
              <p className="text-[#f0b429]/40 text-xs uppercase tracking-wide mb-1">Your Goal</p>
              <p className="text-[#f0b429] text-sm font-medium">{goal.goalText}</p>
            </div>

            {/* Actions */}
            <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/15 p-4 space-y-4">
              <p className="text-[#f0b429] font-semibold text-sm">Did you complete these today?</p>
              {goal.actions.map((action, i) => {
                const checked = [a1, a2, a3][i];
                const toggle  = [setA1, setA2, setA3][i];
                return (
                  <button
                    key={i}
                    onClick={() => toggle(!checked)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                      checked ? "bg-[#f0b429]/10 border border-[#f0b429]/30" : "bg-[#f0b429]/5 border border-[#f0b429]/15"
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-[#f0b429] flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#f0b429]/30 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${checked ? "text-[#f0b429]" : "text-[#f0b429]/70"}`}>
                      {action}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mood */}
            <div className="rounded-2xl bg-[#f0b429]/5 border border-[#f0b429]/15 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[#f0b429]/70 text-sm font-medium">How do you feel today?</p>
                <span className="text-[#f0b429] font-bold text-sm">{mood}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(Number(e.target.value))}
                className="w-full accent-[#f0b429]"
              />
              <div className="flex justify-between text-xs text-[#f0b429]/30 mt-1">
                <span>Tired 😞</span>
                <span>Fired up 🔥</span>
              </div>

              <textarea
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Any thoughts for THUTO? (optional)"
                rows={2}
                className="mt-3 w-full bg-transparent text-[#f0b429]/70 placeholder-[#f0b429]/20 text-sm resize-none focus:outline-none border-t border-[#f0b429]/15 pt-2"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-[#f0b429] text-[#1a3a1a] font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> THUTO is responding...</>
              ) : (
                <><Flame className="w-4 h-4" /> Submit Check-In ({score}/3 done)</>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
