"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getGoal, saveCheckIn, getTodayCheckIn } from "@/lib/success/storage";
import { getCurrentStreak } from "@/lib/success/streak";
import { CheckCircle2, XCircle, ChevronLeft, Loader2 } from "lucide-react";

const STREAK_KEY = "thuto_streak";
const BEST_KEY = "thuto_streak_best";
const TOTAL_KEY = "thuto_checkin_total";

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

export default function CheckInPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [action1, setAction1] = useState<boolean | null>(null);
  const [action2, setAction2] = useState<boolean | null>(null);
  const [action3, setAction3] = useState<boolean | null>(null);
  const [mood, setMood] = useState(7);
  const [moodNote, setMoodNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [thutoMessage, setThutoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const existing = getTodayCheckIn();
    if (existing) {
      setAction1(existing.action1);
      setAction2(existing.action2);
      setAction3(existing.action3);
      if (existing.mood !== undefined) setMood(existing.mood);
      if (existing.moodNote) setMoodNote(existing.moodNote);
      if (existing.thutoMessage) setThutoMessage(existing.thutoMessage);
      setSubmitted(true);
    }
  }, [mounted]);

  if (!mounted) return null;

  const goal = getGoal();
  if (!goal) {
    router.replace("/player/success-engine/goal");
    return null;
  }

  const allAnswered = action1 !== null && action2 !== null && action3 !== null;
  const score = [action1, action2, action3].filter(Boolean).length;
  const scoreColor = score === 3 ? "#1B5E20" : score >= 1 ? "#F9A825" : "#B71C1C";

  async function handleSubmit() {
    if (!allAnswered || !goal) return;
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const checkIn = {
      date: today,
      action1: action1!,
      action2: action2!,
      action3: action3!,
      score,
      timestamp: Date.now(),
      mood,
      moodNote: mood <= 5 ? moodNote : undefined,
    };
    saveCheckIn(checkIn);

    // Update streak + totals in localStorage
    const ns = getCurrentStreak();
    const prevBest = parseInt(localStorage.getItem(BEST_KEY) ?? "0", 10);
    const prevTotal = parseInt(localStorage.getItem(TOTAL_KEY) ?? "0", 10);
    localStorage.setItem(STREAK_KEY, String(ns));
    localStorage.setItem(BEST_KEY, String(Math.max(ns, prevBest)));
    localStorage.setItem(TOTAL_KEY, String(prevTotal + 1));

    setSubmitted(true);

    // Fetch THUTO message
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `A Zimbabwean athlete just completed their daily THUTO check-in.
Goal: "${goal.goalText}" (target: ${goal.targetDate})
Today's score: ${score}/3
Actions done: ${[goal.actions[0], goal.actions[1], goal.actions[2]]
  .filter((_, i) => [action1, action2, action3][i])
  .join(", ") || "none"}
Mood: ${mood}/10 (${moodLabel(mood)})
${mood <= 5 && moodNote ? `Mood note: "${moodNote}"` : ""}
Streak: ${ns} days

Write ONE short personalised coaching response (2–3 sentences max).
Be warm, direct, Zimbabwean in spirit. Use one Shona word naturally.
${score === 3 ? "They completed everything — celebrate them!" : score === 0 ? "They checked in but did nothing — be supportive, not harsh." : "Acknowledge what they did and encourage the rest."}`,
          system_prompt:
            "You are THUTO, a Zimbabwean AI sports coach. Warm, direct, brief — max 3 sentences. No bullet points.",
        }),
      });
      const data = await res.json();
      const msg: string = data.response ?? data.answer ?? "";
      if (msg) {
        setThutoMessage(msg);
        // Update saved check-in with THUTO message
        saveCheckIn({ ...checkIn, thutoMessage: msg });
      }
    } catch {
      const fallbacks = [
        "Every rep counts. Ramba uchishanda! 🔥",
        "Champions are made on days like today. Pamberi! ⚽",
        "You showed up — that is everything. Unokwanisa! 🌟",
      ];
      setThutoMessage(fallbacks[score % fallbacks.length]);
    } finally {
      setLoading(false);
    }
  }

  const actStates = [action1, action2, action3];
  const actSetters = [setAction1, setAction2, setAction3] as ((v: boolean) => void)[];

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="px-5 pt-10 pb-5 flex items-center gap-3">
        <button
          onClick={() => router.push("/player/success-engine")}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#F9A825]">Daily Check-In</p>
          <p className="text-sm text-white/50">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <div className="px-5 space-y-4 pb-10">
        {!submitted ? (
          <>
            <p className="text-sm text-white/60 leading-relaxed">
              Did you complete each action today? Be honest — THUTO is here to help, not judge.
            </p>

            {/* Action YES/NO cards */}
            {goal.actions.map((action, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold text-[#F9A825] mb-1">Action {i + 1}</p>
                <p className="text-sm text-white/80 leading-relaxed mb-4">{action}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => actSetters[i](true)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      actStates[i] === true
                        ? "bg-[#1B5E20] text-white"
                        : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    <CheckCircle2 size={15} /> YES
                  </button>
                  <button
                    onClick={() => actSetters[i](false)}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                      actStates[i] === false
                        ? "bg-[#B71C1C]/60 border border-[#B71C1C]/40 text-white"
                        : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    <XCircle size={15} /> NO
                  </button>
                </div>
              </div>
            ))}

            {/* Score preview */}
            {allAnswered && (
              <div
                className="rounded-2xl border p-4 text-center"
                style={{ borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}15` }}
              >
                <p className="text-2xl font-bold" style={{ color: scoreColor }}>{score}/3</p>
                <p className="text-xs text-white/50 mt-1">
                  {score === 3 ? "Perfect day! 🏆" : score >= 2 ? "Solid effort!" : score === 1 ? "You showed up — build on this" : "Tough day — tomorrow starts fresh"}
                </p>
              </div>
            )}

            {/* Mood */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-[#F9A825] mb-3">How are you feeling? (1–10)</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{moodEmoji(mood)}</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={mood}
                    onChange={(e) => setMood(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-500"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-white/30">
                    <span>1</span>
                    <span className="font-semibold text-white/60">{mood} — {moodLabel(mood)}</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
              {mood <= 5 && (
                <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="What&apos;s on your mind? (optional)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#F9A825]"
                />
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allAnswered || loading}
              className="w-full rounded-xl bg-[#F9A825] text-[#121212] py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Getting THUTO message…</> : "Submit Check-In"}
            </button>
          </>
        ) : (
          /* Submitted */
          <div className="space-y-4">
            <div
              className="rounded-2xl border p-6 text-center"
              style={{ borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}15` }}
            >
              <p className="text-4xl font-bold mb-1" style={{ color: scoreColor }}>{score}/3</p>
              <p className="text-sm text-white/70">
                {score === 3 ? "Perfect! You nailed it today 🏆" : score >= 2 ? "Good effort 💪" : score === 1 ? "You showed up — that matters" : "Tough day. Tomorrow starts fresh"}
              </p>
            </div>

            {/* THUTO message */}
            {(thutoMessage || loading) && (
              <div className="rounded-2xl border border-[#F9A825]/20 bg-[#F9A825]/10 p-5">
                <p className="text-xs font-semibold text-[#F9A825] mb-2 uppercase tracking-wide">THUTO says</p>
                {loading
                  ? <div className="flex items-center gap-2 text-white/40 text-sm"><Loader2 size={14} className="animate-spin" /> Thinking…</div>
                  : <p className="text-sm text-white/90 leading-relaxed">{thutoMessage}</p>
                }
              </div>
            )}

            {/* Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-3">Today&apos;s Summary</p>
              {goal.actions.map((action, i) => {
                const done = [action1, action2, action3][i];
                return (
                  <div key={i} className="flex items-start gap-3 mb-2">
                    {done
                      ? <CheckCircle2 size={15} className="text-[#1B5E20] shrink-0 mt-0.5" />
                      : <XCircle size={15} className="text-[#B71C1C]/60 shrink-0 mt-0.5" />}
                    <p className={`text-xs leading-relaxed ${done ? "text-white/80" : "text-white/30"}`}>{action}</p>
                  </div>
                );
              })}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-sm">
                <span className="text-lg">{moodEmoji(mood)}</span>
                <span className="text-white/50">{mood}/10 — {moodLabel(mood)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/player/success-engine")}
              className="w-full rounded-xl bg-[#1B5E20] py-3.5 text-sm font-semibold hover:bg-[#2e7d32] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
