"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, Flame, ThumbsUp } from "lucide-react";
import type { ExerciseCard, IntensityFelt, SessionType } from "@/lib/conditioning/types";
import { SEED_CARDS } from "@/lib/conditioning/seed-cards";
import { saveSession } from "@/lib/conditioning/storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findCards(ids: string[]): ExerciseCard[] {
  // Look in seeds first; API cards would be pre-loaded in a real implementation
  return ids.map((id) => SEED_CARDS.find((c) => c.id === id)).filter(Boolean) as ExerciseCard[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const INTENSITY_OPTIONS: { value: IntensityFelt; label: string; emoji: string }[] = [
  { value: "easy",     label: "Easy",     emoji: "😌" },
  { value: "moderate", label: "Moderate", emoji: "💪" },
  { value: "hard",     label: "Hard",     emoji: "🔥" },
  { value: "max",      label: "Max out",  emoji: "💀" },
];

// ─── Inner component (uses useSearchParams) ───────────────────────────────────

function SessionRunner() {
  const router = useRouter();
  const params = useSearchParams();

  const cardIds = (params.get("cards") ?? "").split(",").filter(Boolean);
  const sessionType = (params.get("type") ?? "full") as SessionType;

  const cards = findCards(cardIds);

  // Phase: "preview" | "active" | "done"
  const [phase, setPhase] = useState<"preview" | "active" | "done">("preview");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0); // seconds into current card
  const [totalElapsed, setTotalElapsed] = useState(0); // seconds total
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [intensity, setIntensity] = useState<IntensityFelt | null>(null);
  const [joyResponse, setJoyResponse] = useState("");
  const [saved, setSaved] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentCard = cards[currentIdx] ?? null;

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      setTotalElapsed((t) => t + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, currentIdx]);

  // Auto-advance when duration expires
  useEffect(() => {
    if (!currentCard?.duration_seconds) return;
    if (elapsed >= currentCard.duration_seconds) {
      handleNext();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, currentCard]);

  const handleNext = useCallback(() => {
    if (!currentCard) return;
    setCompleted((prev) => new Set(Array.from(prev).concat(currentCard.id)));
    setElapsed(0);
    if (currentIdx + 1 >= cards.length) {
      // End session
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase("done");
    } else {
      setCurrentIdx((i) => i + 1);
    }
  }, [currentCard, currentIdx, cards.length]);

  function startSession() {
    setPhase("active");
    setElapsed(0);
    setTotalElapsed(0);
  }

  function finishAndSave() {
    if (!intensity || saved) return;
    setSaved(true);

    const session = {
      id: `cond-${Date.now()}`,
      session_type: sessionType,
      cards_used: Array.from(completed),
      duration_actual: Math.round(totalElapsed / 60),
      intensity_felt: intensity,
      joy_response: joyResponse.trim() || null,
      notes: null,
      logged_at: new Date().toISOString(),
    };

    saveSession(session);

    // Also try API (non-blocking)
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/conditioning/sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(session),
      }).catch(() => {/* silently ignored */});
    }
  }

  // ─── Preview phase ──────────────────────────────────────────────────────────
  if (phase === "preview") {
    return (
      <main className="min-h-screen bg-background px-4 pb-10 pt-6">
        <div className="mx-auto max-w-lg">
          <button onClick={() => router.back()} className="mb-4 text-sm text-muted-foreground hover:text-white">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">Session Preview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} exercise{cards.length !== 1 ? "s" : ""} · est.{" "}
            {Math.round(cards.reduce((t, c) => t + (c.duration_seconds ?? 120), 0) / 60)} min
          </p>

          <div className="mt-5 space-y-3">
            {cards.map((card, i) => (
              <div key={card.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-card/60 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 text-sm font-bold text-[#f0b429]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{card.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.reps ?? (card.duration_seconds ? `${Math.round(card.duration_seconds / 60)} min` : "")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={startSession}
            className="mt-8 w-full rounded-2xl bg-[#f0b429] py-4 text-base font-bold text-[#1a3a1a] transition-opacity active:opacity-80"
          >
            Start Session
          </button>
        </div>
      </main>
    );
  }

  // ─── Done phase ─────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <main className="min-h-screen bg-background px-4 pb-10 pt-6">
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-[#f0b429]" />
            <h1 className="mt-4 text-2xl font-bold text-white">Session Complete!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {completed.size} of {cards.length} exercises · {Math.round(totalElapsed / 60)} min
            </p>
          </div>

          {/* Intensity rating */}
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold text-white">How did it feel?</p>
            <div className="grid grid-cols-2 gap-2">
              {INTENSITY_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setIntensity(value)}
                  className={`rounded-2xl border py-4 text-center transition-colors ${
                    intensity === value
                      ? "border-[#f0b429] bg-[#f0b429]/10 text-white"
                      : "border-white/10 bg-card/60 text-white/70"
                  }`}
                >
                  <span className="block text-2xl">{emoji}</span>
                  <span className="mt-1 block text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Joy response */}
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-white">Any moment that surprised you?</p>
            <textarea
              value={joyResponse}
              onChange={(e) => setJoyResponse(e.target.value)}
              placeholder="Optional — a move that felt great, something new you noticed..."
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b429]/50 focus:outline-none"
            />
          </div>

          <button
            onClick={() => { finishAndSave(); router.replace("/player/conditioning"); }}
            disabled={!intensity}
            className="mt-5 w-full rounded-2xl bg-[#f0b429] py-4 text-base font-bold text-[#1a3a1a] transition-opacity disabled:opacity-40 active:opacity-80"
          >
            {saved ? "Saved ✓" : "Save & Finish"}
          </button>
        </div>
      </main>
    );
  }

  // ─── Active phase ────────────────────────────────────────────────────────────
  if (!currentCard) return null;

  const cardProgress = currentCard.duration_seconds
    ? Math.min(elapsed / currentCard.duration_seconds, 1)
    : null;

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10 h-1 bg-white/10">
        <div
          className="h-full bg-[#f0b429] transition-all"
          style={{ width: `${(completed.size / cards.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-8">
        <div className="mx-auto max-w-lg">
          {/* Exercise counter */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Exercise {currentIdx + 1} of {cards.length}
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatTime(totalElapsed)}
            </div>
          </div>

          {/* Card name */}
          <h1 className="mt-3 text-3xl font-bold text-white">{currentCard.name}</h1>

          {/* Reps / duration display */}
          <div className="mt-4 flex items-center gap-4">
            {currentCard.duration_seconds && (
              <div className="text-center">
                <p className="text-4xl font-bold tabular-nums text-[#f0b429]">
                  {formatTime(Math.max(0, currentCard.duration_seconds - elapsed))}
                </p>
                <p className="text-xs text-muted-foreground">remaining</p>
              </div>
            )}
            {currentCard.reps && !currentCard.duration_seconds && (
              <div>
                <p className="text-3xl font-bold text-[#f0b429]">{currentCard.reps}</p>
                <p className="text-xs text-muted-foreground">target</p>
              </div>
            )}
            {cardProgress !== null && (
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#f0b429] transition-all"
                    style={{ width: `${cardProgress * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 space-y-3">
            {currentCard.instructions.map((step, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 text-xs font-bold text-[#f0b429]">
                  {i + 1}
                </span>
                <p className="text-sm text-white/90">{step}</p>
              </div>
            ))}
          </div>

          {/* THUTO coaching cue */}
          <div className="mt-5 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
            <div className="flex items-start gap-2">
              <Flame className="mt-0.5 h-4 w-4 shrink-0 text-[#f0b429]" />
              <p className="text-sm italic text-white/80">{currentCard.thuto_question}</p>
            </div>
          </div>

          {/* Football benefit */}
          <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <div className="flex items-start gap-2">
              <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs text-white/80">{currentCard.football_benefit}</p>
            </div>
          </div>

          {/* Upcoming exercises */}
          {currentIdx + 1 < cards.length && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Up next</p>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-white/80">{cards[currentIdx + 1].name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background/95 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-lg flex gap-3">
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#f0b429] py-4 text-sm font-bold text-[#1a3a1a] transition-opacity active:opacity-80"
          >
            <CheckCircle2 className="h-4 w-4" />
            {currentIdx + 1 >= cards.length ? "Finish" : "Done — Next Exercise"}
          </button>
        </div>
      </div>
    </main>
  );
}

// ─── Page wrapper (Suspense required for useSearchParams) ─────────────────────

export default function ConditioningSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SessionRunner />
    </Suspense>
  );
}
