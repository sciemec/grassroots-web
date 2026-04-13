"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell,
  Flame,
  Zap,
  Activity,
  Wind,
  ChevronRight,
  Play,
  X,
  Filter,
  CheckCircle2,
  Clock,
  BarChart2,
} from "lucide-react";
import type { ExerciseCard, ExerciseCategory, EquipmentTier } from "@/lib/conditioning/types";
import { SEED_CARDS } from "@/lib/conditioning/seed-cards";
import { getSessionCount, getTotalMinutes } from "@/lib/conditioning/storage";

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { id: ExerciseCategory | "all"; label: string; icon: React.ReactNode }[] = [
  { id: "all",          label: "All",       icon: <Dumbbell className="h-4 w-4" /> },
  { id: "fifa_warmup",  label: "FIFA 11+",  icon: <Activity className="h-4 w-4" /> },
  { id: "aerobic",      label: "Aerobic",   icon: <Wind className="h-4 w-4" /> },
  { id: "hiit",         label: "HIIT",      icon: <Flame className="h-4 w-4" /> },
  { id: "strength",     label: "Strength",  icon: <Dumbbell className="h-4 w-4" /> },
  { id: "agility",      label: "Agility",   icon: <Zap className="h-4 w-4" /> },
  { id: "plyometrics",  label: "Plyo",      icon: <BarChart2 className="h-4 w-4" /> },
];

const EQUIPMENT_LABELS: Record<EquipmentTier, string> = {
  zero:  "No equipment",
  basic: "Basic",
  gym:   "Gym",
};

const DIFFICULTY_LABEL = ["", "Beginner", "Intermediate", "Advanced"] as const;

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  fifa_warmup: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  aerobic:     "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  hiit:        "bg-red-500/20 text-red-300 border-red-500/30",
  strength:    "bg-orange-500/20 text-orange-300 border-orange-500/30",
  agility:     "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  plyometrics: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConditioningPage() {
  const router = useRouter();

  const [cards, setCards] = useState<ExerciseCard[]>(SEED_CARDS);
  const [category, setCategory] = useState<ExerciseCategory | "all">("all");
  const [equipment, setEquipment] = useState<EquipmentTier | "any">("any");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ExerciseCard | null>(null);
  const [stats, setStats] = useState({ sessions: 0, minutes: 0 });

  // Load API cards (with seed fallback)
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token || !API) return;

    fetch(`${API}/conditioning/exercises`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.data) && data.data.length > 0) {
          setCards(data.data as ExerciseCard[]);
        }
      })
      .catch(() => {/* use seeds */});
  }, []);

  // Load stats
  useEffect(() => {
    setStats({
      sessions: getSessionCount(),
      minutes:  getTotalMinutes(),
    });
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (equipment !== "any" && c.equipment_tier !== equipment) return false;
      return true;
    });
  }, [cards, category, equipment]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startSession() {
    const ids = Array.from(selected).join(",");
    router.push(`/player/conditioning/session?cards=${ids}&type=${category === "all" ? "full" : category}`);
  }

  const selectedCards = filtered.filter((c) => selected.has(c.id));

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/player" className="text-xs text-muted-foreground hover:text-white">
                ← Hub
              </Link>
              <h1 className="mt-0.5 text-xl font-bold text-white">Conditioning</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{stats.sessions} sessions</p>
              <p className="text-xs text-muted-foreground">{stats.minutes} min total</p>
            </div>
          </div>

          {/* Category tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setCategory(id as ExerciseCategory | "all")}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === id
                    ? "border-[#f0b429] bg-[#f0b429] text-[#1a3a1a]"
                    : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* Equipment filter */}
          <div className="mt-2 flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {(["any", "zero", "basic", "gym"] as const).map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipment(eq)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  equipment === eq
                    ? "border-white/40 bg-white/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white/70"
                }`}
              >
                {eq === "any" ? "Any" : EQUIPMENT_LABELS[eq]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="mx-auto max-w-lg space-y-3 px-4 pt-4">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-card/60 px-6 py-10 text-center">
            <p className="text-white">No exercises match this filter.</p>
            <button
              onClick={() => { setCategory("all"); setEquipment("any"); }}
              className="mt-3 text-sm text-[#f0b429] underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {filtered.map((card) => {
          const isSelected = selected.has(card.id);
          return (
            <div
              key={card.id}
              className={`rounded-2xl border transition-all ${
                isSelected
                  ? "border-[#f0b429]/60 bg-[#f0b429]/5"
                  : "border-white/10 bg-card/60"
              }`}
            >
              <div className="flex items-start gap-3 p-4">
                {/* Select checkbox */}
                <button
                  onClick={() => toggleSelect(card.id)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected
                      ? "border-[#f0b429] bg-[#f0b429]"
                      : "border-white/30 bg-transparent"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-[#1a3a1a]" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[card.category]}`}>
                      {card.category === "fifa_warmup" ? "FIFA 11+" : card.category.replace("_", " ")}
                    </span>
                    {card.is_fifa_11plus && card.category !== "fifa_warmup" && (
                      <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 text-xs text-blue-300">
                        11+
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {DIFFICULTY_LABEL[card.difficulty_level]}
                    </span>
                  </div>

                  <h3 className="mt-1 text-sm font-bold text-white">{card.name}</h3>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {card.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.round(card.duration_seconds / 60)}m
                      </span>
                    )}
                    {card.reps && (
                      <span>{card.reps}</span>
                    )}
                    <span className="capitalize">{EQUIPMENT_LABELS[card.equipment_tier]}</span>
                  </div>

                  <p className="mt-1.5 text-xs text-white/70 line-clamp-2">
                    {card.football_benefit}
                  </p>
                </div>

                {/* Preview button */}
                <button
                  onClick={() => setPreview(card)}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-2 transition-colors hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4 text-white/60" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start session bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background/95 backdrop-blur-sm p-4">
          <div className="mx-auto max-w-lg flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {selected.size} exercise{selected.size !== 1 ? "s" : ""} selected
              </p>
              <p className="text-xs text-muted-foreground">
                Est. {selectedCards.reduce((t, c) => t + (c.duration_seconds ?? 120), 0) / 60 | 0}+ min
              </p>
            </div>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-full border border-white/20 p-2 text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <button
              onClick={startSession}
              className="flex items-center gap-2 rounded-2xl bg-[#f0b429] px-5 py-3 text-sm font-bold text-[#1a3a1a] transition-opacity active:opacity-80"
            >
              <Play className="h-4 w-4" />
              Start Session
            </button>
          </div>
        </div>
      )}

      {/* Card preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div
            className="w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[#1a3d26] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[preview.category]}`}>
                  {preview.category === "fifa_warmup" ? "FIFA 11+" : preview.category.replace("_", " ")}
                </span>
                <h2 className="mt-2 text-xl font-bold text-white">{preview.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {DIFFICULTY_LABEL[preview.difficulty_level]} · {EQUIPMENT_LABELS[preview.equipment_tier]}
                  {preview.duration_seconds ? ` · ${Math.round(preview.duration_seconds / 60)} min` : ""}
                  {preview.reps ? ` · ${preview.reps}` : ""}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-white/60 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Instructions */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Instructions</p>
              <ol className="space-y-2">
                {preview.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/90">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 text-xs font-bold text-[#f0b429]">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Football benefit */}
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs font-semibold text-emerald-400 mb-1">Why this helps your game</p>
              <p className="text-sm text-white/90">{preview.football_benefit}</p>
            </div>

            {/* THUTO question */}
            <div className="mb-6 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
              <p className="text-xs font-semibold text-[#f0b429] mb-1">THUTO asks</p>
              <p className="text-sm italic text-white/90">{preview.thuto_question}</p>
            </div>

            {/* Success */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Success feels like</p>
              <p className="text-sm text-white/80">{preview.success_feels_like}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { toggleSelect(preview.id); setPreview(null); }}
                className={`flex-1 rounded-2xl py-3 text-sm font-bold transition-colors ${
                  selected.has(preview.id)
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-[#f0b429] text-[#1a3a1a]"
                }`}
              >
                {selected.has(preview.id) ? "Remove from session" : "Add to session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
