"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ChevronRight,
  Play,
  Sparkles,
  Dumbbell,
  Flame,
  Wind,
  Zap,
  BarChart2,
} from "lucide-react";
import type { ExerciseCard, ExerciseCategory, EquipmentTier } from "@/lib/conditioning/types";
import { SEED_CARDS } from "@/lib/conditioning/seed-cards";

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  ExerciseCategory,
  { label: string; color: string; border: string; dot: string; icon: React.ReactNode }
> = {
  fifa_warmup: {
    label: "FIFA 11+",
    color: "text-teal-300",
    border: "border-teal-500/30",
    dot: "bg-teal-400",
    icon: <Activity className="h-3 w-3" />,
  },
  aerobic: {
    label: "Stamina",
    color: "text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    icon: <Wind className="h-3 w-3" />,
  },
  hiit: {
    label: "HIIT",
    color: "text-red-300",
    border: "border-red-500/30",
    dot: "bg-red-400",
    icon: <Flame className="h-3 w-3" />,
  },
  strength: {
    label: "Strength",
    color: "text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
    icon: <Dumbbell className="h-3 w-3" />,
  },
  agility: {
    label: "Agility",
    color: "text-yellow-300",
    border: "border-yellow-500/30",
    dot: "bg-yellow-400",
    icon: <Zap className="h-3 w-3" />,
  },
  plyometrics: {
    label: "Power",
    color: "text-indigo-300",
    border: "border-indigo-500/30",
    dot: "bg-indigo-400",
    icon: <BarChart2 className="h-3 w-3" />,
  },
};

const CATEGORY_BG: Record<ExerciseCategory, string> = {
  fifa_warmup: "bg-teal-500/15",
  aerobic:     "bg-amber-500/15",
  hiit:        "bg-red-500/15",
  strength:    "bg-purple-500/15",
  agility:     "bg-yellow-500/15",
  plyometrics: "bg-indigo-500/15",
};

const EQUIPMENT_CONFIG: Record<EquipmentTier, { label: string; color: string }> = {
  zero:  { label: "Zero",  color: "bg-emerald-500/20 text-emerald-300" },
  basic: { label: "Basic", color: "bg-blue-500/20 text-blue-300" },
  gym:   { label: "Gym",   color: "bg-orange-500/20 text-orange-300" },
};

type CategoryFilter = ExerciseCategory | "all";
type EquipmentFilter = EquipmentTier | "any";

const FILTER_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "fifa_warmup", label: "FIFA 11+" },
  { id: "aerobic",     label: "Stamina" },
  { id: "hiit",        label: "HIIT" },
  { id: "strength",    label: "Strength" },
  { id: "agility",     label: "Agility" },
  { id: "plyometrics", label: "Power" },
];

const EQUIPMENT_TABS: { id: EquipmentFilter; label: string }[] = [
  { id: "any",   label: "Any" },
  { id: "zero",  label: "Zero equipment" },
  { id: "basic", label: "Basic" },
  { id: "gym",   label: "Gym" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConditioningLibraryPage() {
  const router = useRouter();

  const [cards, setCards] = useState<ExerciseCard[]>(SEED_CARDS);
  const [recommended, setRecommended] = useState<ExerciseCard[]>([]);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [equipment, setEquipment] = useState<EquipmentFilter>("any");
  const [loadingRec, setLoadingRec] = useState(true);

  // Load full card library from API
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    if (!API) return;
    fetch(`${API}/exercise-cards?per_page=100`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.data)) setCards(data.data as ExerciseCard[]);
      })
      .catch(() => {/* keep seeds */});
  }, []);

  // Load THUTO's personalised picks (auth required)
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!API || !token) {
      setLoadingRec(false);
      return;
    }
    fetch(`${API}/exercise-cards/recommended`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.data)) setRecommended(data.data.slice(0, 5) as ExerciseCard[]);
      })
      .catch(() => {})
      .finally(() => setLoadingRec(false));
  }, []);

  const fifaCards = useMemo(
    () => cards.filter((c) => c.is_fifa_11plus).slice(0, 15),
    [cards],
  );

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (equipment !== "any" && c.equipment_tier !== equipment) return false;
      return true;
    });
  }, [cards, category, equipment]);

  function startExercise(card: ExerciseCard) {
    router.push(`/player/conditioning/session?cards=${card.id}&type=${card.category}`);
  }

  function startAllFifa() {
    const ids = fifaCards.map((c) => c.id).join(",");
    router.push(`/player/conditioning/session?cards=${ids}&type=fifa_warmup`);
  }

  return (
    <main className="min-h-screen bg-background pb-20">

      {/* ── Sticky header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-white/10 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link href="/player" className="text-xs text-muted-foreground hover:text-white">
            ← Hub
          </Link>
          <h1 className="mt-0.5 text-xl font-bold text-white">Conditioning Library</h1>
          <p className="text-xs text-muted-foreground">
            No gym needed. Build like a professional.
          </p>

          {/* Category tabs */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTER_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  category === id
                    ? "border-[#f0b429] bg-[#f0b429] text-[#1a3a1a]"
                    : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Equipment filter */}
          <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {EQUIPMENT_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setEquipment(id)}
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  equipment === id
                    ? "border-white/40 bg-white/20 text-white"
                    : "border-white/10 text-white/50 hover:text-white/70"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-5">

        {/* ── THUTO's picks ──────────────────────────────────────────────────── */}
        {category === "all" && (loadingRec || recommended.length > 0) && (
          <section className="mb-7">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#f0b429]" />
              <h2 className="text-sm font-bold text-white">THUTO's picks for you</h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {loadingRec
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 w-44 shrink-0 animate-pulse rounded-2xl bg-white/5"
                    />
                  ))
                : recommended.map((card) => {
                    const cfg = CATEGORY_CONFIG[card.category];
                    return (
                      <Link
                        key={card.id}
                        href={`/player/conditioning/${card.id}`}
                        className={`group relative w-44 shrink-0 overflow-hidden rounded-2xl border ${cfg.border} ${CATEGORY_BG[card.category]} p-3 transition-all hover:border-opacity-60`}
                      >
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <p className="mt-2 text-sm font-bold leading-tight text-white">
                          {card.name}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {card.duration_seconds
                            ? `${Math.round(card.duration_seconds / 60)} min`
                            : (card.reps ?? "")}
                        </p>
                        <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-white/20 transition-colors group-hover:text-white/50" />
                      </Link>
                    );
                  })}
            </div>
          </section>
        )}

        {/* ── FIFA 11+ featured section ──────────────────────────────────────── */}
        {(category === "all" || category === "fifa_warmup") && fifaCards.length > 0 && (
          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-400" />
                <h2 className="text-sm font-bold text-white">FIFA 11+ warm-up</h2>
                <span className="rounded-full border border-teal-500/30 bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
                  {fifaCards.length} exercises · in sequence
                </span>
              </div>
              <button
                onClick={startAllFifa}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#f0b429] px-3 py-1.5 text-xs font-bold text-[#1a3a1a] active:opacity-80"
              >
                <Play className="h-3 w-3" />
                Do all in order
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {fifaCards.map((card, i) => (
                <Link
                  key={card.id}
                  href={`/player/conditioning/${card.id}`}
                  className="group w-40 shrink-0 rounded-2xl border border-teal-500/20 bg-teal-500/5 p-3 transition-all hover:border-teal-400/40"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-xs font-bold text-teal-300">
                    {i + 1}
                  </span>
                  <p className="mt-2 text-sm font-bold leading-tight text-white">{card.name}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {card.duration_seconds
                      ? `${Math.round(card.duration_seconds / 60)} min`
                      : (card.reps ?? "")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Card grid ──────────────────────────────────────────────────────── */}
        <section>
          {(category !== "all" || equipment !== "any") && (
            <p className="mb-3 text-xs text-muted-foreground">
              {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card/60 px-6 py-12 text-center">
              <p className="text-sm text-white/60">No exercises match this filter.</p>
              <button
                onClick={() => { setCategory("all"); setEquipment("any"); }}
                className="mt-3 text-sm text-[#f0b429] underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((card) => (
                <CardTile key={card.id} card={card} onStart={startExercise} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ─── Card tile (2-column grid) ────────────────────────────────────────────────

function CardTile({
  card,
  onStart,
}: {
  card: ExerciseCard;
  onStart: (c: ExerciseCard) => void;
}) {
  const cfg = CATEGORY_CONFIG[card.category];
  const eq  = EQUIPMENT_CONFIG[card.equipment_tier];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/60">
      <Link href={`/player/conditioning/${card.id}`} className="flex-1 p-3">
        {/* Category badge */}
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_BG[card.category]} ${cfg.border} ${cfg.color}`}
        >
          {cfg.icon}
          {cfg.label}
        </span>

        {/* Name */}
        <p className="mt-2 text-sm font-bold leading-snug text-white">{card.name}</p>

        {/* Duration / reps */}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {card.duration_seconds
            ? `${Math.round(card.duration_seconds / 60)} min`
            : (card.reps ?? "")}
        </p>

        {/* Equipment + difficulty */}
        <div className="mt-2 flex items-center gap-2">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${eq.color}`}>
            {eq.label}
          </span>
          <div className="flex gap-0.5">
            {([1, 2, 3] as const).map((d) => (
              <span
                key={d}
                className={`h-1.5 w-1.5 rounded-full ${
                  d <= card.difficulty_level ? "bg-[#f0b429]" : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Position tags */}
        {card.position_tags.length > 0 && (
          <p className="mt-1.5 text-[10px] leading-tight text-white/35">
            {card.position_tags.slice(0, 3).join(" · ")}
          </p>
        )}
      </Link>

      {/* Start button */}
      <button
        onClick={() => onStart(card)}
        className="flex items-center justify-center gap-1.5 border-t border-white/10 py-2.5 text-xs font-semibold text-[#f0b429] transition-colors hover:bg-[#f0b429]/5 active:bg-[#f0b429]/10"
      >
        <Play className="h-3 w-3" />
        Start this exercise
      </button>
    </div>
  );
}
