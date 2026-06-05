"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MessageCircle,
  Play,
  Plus,
  CheckCircle2,
  Activity,
  Dumbbell,
  Flame,
  Wind,
  Zap,
  BarChart2,
} from "lucide-react";
import type { ExerciseCard, ExerciseCategory, EquipmentTier, IntensityFelt } from "@/lib/conditioning/types";
import { SEED_CARDS } from "@/lib/conditioning/seed-cards";
import { saveSession } from "@/lib/conditioning/storage";

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  ExerciseCategory,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  fifa_warmup: { label: "FIFA 11+",  color: "text-teal-300",   bg: "bg-teal-500/15",   border: "border-teal-500/30",   icon: <Activity className="h-3 w-3" /> },
  aerobic:     { label: "Stamina",   color: "text-amber-300",  bg: "bg-amber-500/15",  border: "border-amber-500/30",  icon: <Wind className="h-3 w-3" /> },
  hiit:        { label: "HIIT",      color: "text-red-300",    bg: "bg-red-500/15",    border: "border-red-500/30",    icon: <Flame className="h-3 w-3" /> },
  strength:    { label: "Strength",  color: "text-purple-300", bg: "bg-purple-500/15", border: "border-purple-500/30", icon: <Dumbbell className="h-3 w-3" /> },
  agility:     { label: "Agility",   color: "text-yellow-300", bg: "bg-yellow-500/15", border: "border-yellow-500/30", icon: <Zap className="h-3 w-3" /> },
  plyometrics: { label: "Power",     color: "text-indigo-300", bg: "bg-indigo-500/15", border: "border-indigo-500/30", icon: <BarChart2 className="h-3 w-3" /> },
};

const EQUIPMENT_CONFIG: Record<EquipmentTier, { label: string; color: string }> = {
  zero:  { label: "Zero equipment", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  basic: { label: "Basic equipment", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  gym:   { label: "Gym equipment",   color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

const DIFFICULTY_META: Record<1 | 2 | 3, { label: string; note: string; activeColor: string; barColor: string }> = {
  1: {
    label: "Level 1",
    note: "Focus on form. Move slowly and deliberately through each step. Quality over speed.",
    activeColor: "border-emerald-400/60 bg-emerald-400/10 text-emerald-300",
    barColor: "bg-emerald-400",
  },
  2: {
    label: "Level 2",
    note: "Standard pace. Full range of motion. Maintain consistent breathing throughout.",
    activeColor: "border-[#f0b429]/60 bg-[#f0b429]/10 text-[#f0b429]",
    barColor: "bg-[#f0b429]",
  },
  3: {
    label: "Level 3",
    note: "Maximum effort. Increase speed or reps. Push to the edge of control — not beyond.",
    activeColor: "border-red-400/60 bg-red-400/10 text-red-300",
    barColor: "bg-red-400",
  },
};

const INTENSITY_OPTIONS: { value: IntensityFelt; label: string; emoji: string }[] = [
  { value: "easy",     label: "Easy",     emoji: "😌" },
  { value: "moderate", label: "Moderate", emoji: "💪" },
  { value: "hard",     label: "Hard",     emoji: "🔥" },
  { value: "max",      label: "Max",      emoji: "💀" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExerciseCardDetailPage() {
  const { id = "" } = useParams<{ id: string }>() ?? {};
  const router = useRouter();

  const [card, setCard]                   = useState<ExerciseCard | null>(null);
  const [loading, setLoading]             = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3>(2);
  const [showLogModal, setShowLogModal]   = useState(false);
  const [intensity, setIntensity]         = useState<IntensityFelt | null>(null);
  const [addedToSession, setAddedToSession] = useState(false);
  const [logSaved, setLogSaved]           = useState(false);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;

    const applyCard = (c: ExerciseCard) => {
      setCard(c);
      setSelectedLevel(c.difficulty_level);
    };

    if (API) {
      fetch(`${API}/exercise-cards/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.data) {
            applyCard(data.data as ExerciseCard);
          } else {
            const found = SEED_CARDS.find((c) => c.id === id);
            if (found) applyCard(found);
          }
        })
        .catch(() => {
          const found = SEED_CARDS.find((c) => c.id === id);
          if (found) applyCard(found);
        })
        .finally(() => setLoading(false));
    } else {
      const found = SEED_CARDS.find((c) => c.id === id);
      if (found) applyCard(found);
      setLoading(false);
    }
  }, [id]);

  function addToSession() {
    if (!card) return;
    const key = "gs_session_cart";
    const existing: string[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!existing.includes(card.id)) {
      localStorage.setItem(key, JSON.stringify([...existing, card.id]));
    }
    setAddedToSession(true);
    setTimeout(() => setAddedToSession(false), 2500);
  }

  function submitQuickLog() {
    if (!card || !intensity) return;
    saveSession({
      id: `cond-${Date.now()}`,
      session_type: card.category,
      cards_used: [card.id],
      duration_actual: Math.max(1, Math.round((card.duration_seconds ?? 120) / 60)),
      intensity_felt: intensity,
      joy_response: null,
      notes: null,
      logged_at: new Date().toISOString(),
    });

    // Non-blocking API sync
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (token && process.env.NEXT_PUBLIC_API_URL) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/conditioning/sessions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          session_type: card.category,
          cards_used: [card.id],
          duration_actual: Math.max(1, Math.round((card.duration_seconds ?? 120) / 60)),
          intensity_felt: intensity,
        }),
      }).catch(() => {});
    }

    setLogSaved(true);
    setShowLogModal(false);
    setIntensity(null);
    setTimeout(() => setLogSaved(false), 3000);
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 pb-32 pt-6">
        <div className="mx-auto max-w-lg animate-pulse space-y-4">
          <div className="h-3 w-16 rounded-full bg-white/10" />
          <div className="h-8 w-3/4 rounded-lg bg-white/10" />
          <div className="h-4 w-1/2 rounded-lg bg-white/10" />
          <div className="h-32 rounded-2xl bg-white/5" />
          <div className="h-48 rounded-2xl bg-white/5" />
        </div>
      </main>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!card) {
    return (
      <main className="min-h-screen bg-background px-4 pb-20 pt-6">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm text-white/60">Exercise not found.</p>
          <Link href="/player/conditioning" className="mt-4 block text-sm text-[#f0b429]">
            ← Back to library
          </Link>
        </div>
      </main>
    );
  }

  const cfg      = CATEGORY_CONFIG[card.category];
  const eqCfg    = EQUIPMENT_CONFIG[card.equipment_tier];
  const diffMeta = DIFFICULTY_META[selectedLevel];

  return (
    <main className="min-h-screen bg-background pb-36">
      <div className="mx-auto max-w-lg px-4 pt-6">

        {/* ── Back link ──────────────────────────────────────────────────────── */}
        <Link
          href="/player/conditioning"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Conditioning Library
        </Link>

        {/* ── Title ──────────────────────────────────────────────────────────── */}
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}
            >
              {cfg.icon}
              {cfg.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${eqCfg.color}`}
            >
              {eqCfg.label}
            </span>
            {card.is_fifa_11plus && card.category !== "fifa_warmup" && (
              <span className="inline-flex items-center rounded-full border border-teal-400/30 bg-teal-400/10 px-2.5 py-0.5 text-xs font-semibold text-teal-300">
                FIFA 11+
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-bold text-white">{card.name}</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {card.duration_seconds ? `${Math.round(card.duration_seconds / 60)} min` : card.reps}
            {card.muscles_targeted.length > 0 &&
              ` · ${card.muscles_targeted.slice(0, 2).join(", ")}`}
          </p>
        </div>

        {/* ── Difficulty selector ─────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-card/60 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Difficulty
          </p>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((level) => {
              const meta = DIFFICULTY_META[level];
              const isActive = selectedLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                    isActive ? meta.activeColor : "border-white/10 text-white/40 hover:text-white/60"
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-white/60">{diffMeta.note}</p>
          {/* Progress bar showing difficulty */}
          <div className="mt-2 flex gap-1">
            {([1, 2, 3] as const).map((d) => (
              <span
                key={d}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  d <= selectedLevel ? diffMeta.barColor : "bg-white/10"
                }`}
              />
            ))}
          </div>
          {card.difficulty_level !== selectedLevel && (
            <p className="mt-2 text-[10px] text-white/30">
              This card is rated Level {card.difficulty_level}.{" "}
              {selectedLevel < card.difficulty_level
                ? "Viewing at a lower intensity — focus on technique."
                : "Pushing above the card rating — increase reps or speed to match."}
            </p>
          )}
        </div>

        {/* ── Step-by-step instructions ───────────────────────────────────────── */}
        <div className="mt-6">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Instructions
          </p>
          <div className="space-y-2">
            {card.instructions.map((step, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 text-xs font-bold text-[#f0b429]">
                  {i + 1}
                </span>
                <p className="text-sm text-white/90">{step}</p>
              </div>
            ))}

            {/* Level 3 challenge cue */}
            {selectedLevel === 3 && (
              <div className="flex gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400/20 text-xs font-bold text-red-300">
                  ↑
                </span>
                <p className="text-sm text-red-200/80">
                  Level 3 challenge: push the pace, increase reps by 20%, or reduce rest time by half.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Muscles targeted ────────────────────────────────────────────────── */}
        {card.muscles_targeted.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Muscles worked
            </p>
            <div className="flex flex-wrap gap-2">
              {card.muscles_targeted.map((m, i) => (
                <span
                  key={i}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Football benefit ────────────────────────────────────────────────── */}
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold text-emerald-400">
            Why this helps your game
          </p>
          <p className="text-sm text-white/90">{card.football_benefit}</p>
        </div>

        {/* ── THUTO's coaching question ───────────────────────────────────────── */}
        <div className="mt-3 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#f0b429]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#f0b429]">
                THUTO asks
              </p>
              <p className="mt-1 text-sm italic text-white/90">{card.thuto_question}</p>
            </div>
          </div>
        </div>

        {/* ── What good feels like ────────────────────────────────────────────── */}
        <div className="mt-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            What good feels like
          </p>
          <p className="text-sm italic text-white/60">{card.success_feels_like}</p>
        </div>

        {/* ── Position tags ────────────────────────────────────────────────────── */}
        {card.position_tags.length > 0 && (
          <p className="mt-3 text-[10px] text-white/25">
            Best for: {card.position_tags.join(" · ")}
          </p>
        )}

        {/* Log saved toast */}
        {logSaved && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-emerald-300">Exercise logged.</p>
          </div>
        )}
      </div>

      {/* ── Fixed bottom bar ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background/95 backdrop-blur-sm p-4">
        <div className="mx-auto max-w-lg space-y-2">
          {/* Add to session + Log row */}
          <div className="flex gap-2">
            <button
              onClick={addToSession}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-colors ${
                addedToSession
                  ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300"
                  : "border-white/20 bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {addedToSession ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {addedToSession ? "Added to session" : "Add to today's session"}
            </button>

            <button
              onClick={() => setShowLogModal(true)}
              className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 active:opacity-80"
            >
              Log exercise
            </button>
          </div>

          {/* Start in Pitch Mode */}
          <button
            onClick={() =>
              router.push(
                `/player/conditioning/session?cards=${card.id}&type=${card.category}`,
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f0b429] py-3.5 text-sm font-bold text-[#1a3a1a] transition-opacity active:opacity-80"
          >
            <Play className="h-4 w-4" />
            Start in Pitch Mode
          </button>
        </div>
      </div>

      {/* ── Quick log modal ──────────────────────────────────────────────────── */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-[#1a3d26] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white">Log exercise</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{card.name}</p>
            <p className="mt-4 mb-3 text-xs font-semibold text-white">How did it feel?</p>

            <div className="grid grid-cols-2 gap-2">
              {INTENSITY_OPTIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setIntensity(value)}
                  className={`rounded-2xl border py-3.5 text-center transition-colors ${
                    intensity === value
                      ? "border-[#f0b429] bg-[#f0b429]/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  <span className="block text-2xl">{emoji}</span>
                  <span className="mt-1 block text-sm font-semibold">{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={submitQuickLog}
              disabled={!intensity}
              className="mt-5 w-full rounded-2xl bg-[#f0b429] py-3.5 text-sm font-bold text-[#1a3a1a] disabled:opacity-40 active:opacity-80"
            >
              Save log
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
