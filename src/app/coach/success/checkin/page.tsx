"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Flame, ArrowLeft, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { type Goal } from "@/lib/success/storage";

const COACH_GOAL_KEY = "thuto_coach_goal";
const COACH_CI_KEY   = "thuto_coach_checkins";

interface CoachCheckIn {
  date:         string;
  action1:      boolean;
  action2:      boolean;
  action3:      boolean;
  score:        number;
  timestamp:    number;
  mood?:        number;
  moodNote?:    string;
  thutoMessage?: string;
}

function getCoachGoal(): Goal | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(COACH_GOAL_KEY);
  return raw ? (JSON.parse(raw) as Goal) : null;
}

function getAllCoachCheckIns(): CoachCheckIn[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(COACH_CI_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function getTodayCoachCheckIn(): CoachCheckIn | null {
  const today = new Date().toISOString().split("T")[0];
  return getAllCoachCheckIns().find((c) => c.date === today) ?? null;
}

function saveCoachCheckIn(ci: CoachCheckIn): void {
  const all   = getAllCoachCheckIns().filter((c) => c.date !== ci.date);
  const sorted = [ci, ...all].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  localStorage.setItem(COACH_CI_KEY, JSON.stringify(sorted));
}

export default function CoachCheckInPage() {
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
    const g = getCoachGoal();
    setGoal(g);

    // Pre-populate from existing check-in (allow edits during the day)
    const existing = getTodayCoachCheckIn();
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

    let message: string | undefined;
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `A Zimbabwean grassroots coach just checked in for the day. They completed ${score}/3 coaching actions.
Their coaching goal: "${goal.goalText}". Mood: ${mood}/10.
Write ONE short motivational line for the coach (max 15 words). End with a Shona phrase. No intro — just the line.`,
          system_prompt: "You are THUTO, a motivational AI coach for Zimbabwean grassroots coaches. Be warm and direct.",
        }),
      });
      const data = await res.json();
      message = data.response?.trim();
    } catch {
      const fallbacks = [
        "Your players are lucky to have a coach who shows up. Pamberi! 🔥",
        "Coaching is a daily commitment. Ramba uchishanda! 💪",
        "Great coaches build habits. Unokwanisa! 🌟",
      ];
      message = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    const today = new Date().toISOString().split("T")[0];
    saveCoachCheckIn({
      date:         today,
      action1:      a1,
      action2:      a2,
      action3:      a3,
      score,
      timestamp:    Date.now(),
      mood,
      moodNote:     moodNote.trim() || undefined,
      thutoMessage: message,
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
          <p className="text-white font-semibold mb-2">No coaching goal set yet</p>
          <p className="text-white/50 text-sm mb-4">Set your coaching goal first to start daily check-ins.</p>
          <button
            onClick={() => router.push("/coach/success")}
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
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Coaching Check-In</h1>
            <p className="text-sm text-white/50">{today}</p>
          </div>
        </div>

        {/* Done state */}
        {done ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/30 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f0b429]/20 border-2 border-[#f0b429] mb-4">
                <span className="text-3xl font-bold text-[#f0b429]">{score}/3</span>
              </div>
              <p className="text-white font-bold text-lg mb-1">
                {score === 3 ? "Perfect coaching day!" : score === 2 ? "Strong session!" : score === 1 ? "You showed up for your players." : "Rest day logged."}
              </p>
              {thutoMsg && (
                <p className="text-[#f0b429] text-sm font-medium italic mt-2">&ldquo;{thutoMsg}&rdquo;</p>
              )}
            </div>

            <button
              onClick={() => router.push("/coach/success")}
              className="w-full bg-[#f0b429] text-[#1a3a1a] font-semibold py-3 rounded-xl"
            >
              Back to Success Engine
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Goal reminder */}
            <div className="rounded-xl bg-white/5 border border-[#f0b429]/10 p-3">
              <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Your Coaching Goal</p>
              <p className="text-white text-sm font-medium">{goal.goalText}</p>
            </div>

            {/* Actions */}
            <div className="rounded-2xl bg-white/10 border border-[#f0b429]/10 p-4 space-y-4">
              <p className="text-white font-semibold text-sm">Did you complete these today?</p>
              {goal.actions.map((action, i) => {
                const checked = [a1, a2, a3][i];
                const toggle  = [setA1, setA2, setA3][i];
                return (
                  <button
                    key={i}
                    onClick={() => toggle(!checked)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                      checked ? "bg-[#f0b429]/10 border border-[#f0b429]/30" : "bg-white/5 border border-[#f0b429]/10"
                    }`}
                  >
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-[#f0b429] flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${checked ? "text-white" : "text-white/70"}`}>
                      {action}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mood */}
            <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/70 text-sm font-medium">How is your coaching energy today?</p>
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
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>Drained 😞</span>
                <span>Energised 🔥</span>
              </div>

              <textarea
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Anything on your mind as a coach today? (optional)"
                rows={2}
                className="mt-3 w-full bg-transparent text-white/70 placeholder-white/20 text-sm resize-none focus:outline-none border-t border-[#f0b429]/10 pt-2"
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
