"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  X,
  Users,
  User,
  Calendar,
  Download,
  Plus,
  Trash2,
  Activity,
  Dumbbell,
  Flame,
  Wind,
  Zap,
  BarChart2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ExerciseCard, ExerciseCategory, EquipmentTier } from "@/lib/conditioning/types";
import { SEED_CARDS } from "@/lib/conditioning/seed-cards";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "library" | "week" | "assignments";

type CategoryFilter = ExerciseCategory | "all";
type EquipmentFilter = EquipmentTier | "any";

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;
type DayName = (typeof DAYS)[number];

interface WeekPlan {
  [day: string]: string[]; // day → card IDs
}

interface SquadMember {
  id: string;
  name: string;
  position?: string;
}

interface Assignment {
  id: string;
  target: "player" | "team";
  playerName: string;
  cardIds: string[];
  weekPlan?: WeekPlan;
  assignedAt: string;
}

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

const EQUIPMENT_COLORS: Record<EquipmentTier, string> = {
  zero:  "bg-emerald-500/20 text-emerald-300",
  basic: "bg-blue-500/20 text-blue-300",
  gym:   "bg-orange-500/20 text-orange-300",
};

const FILTER_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all",         label: "All" },
  { id: "fifa_warmup", label: "FIFA 11+" },
  { id: "aerobic",     label: "Stamina" },
  { id: "hiit",        label: "HIIT" },
  { id: "strength",    label: "Strength" },
  { id: "agility",     label: "Agility" },
  { id: "plyometrics", label: "Power" },
];

const ASSIGNMENTS_KEY = "gs_coach_conditioning_assignments";
const WEEK_TEMPLATE_KEY = "gs_coach_week_template";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CoachConditioningPage() {
  const [tab, setTab]                   = useState<TabId>("library");
  const [cards, setCards]               = useState<ExerciseCard[]>(SEED_CARDS);
  const [squad, setSquad]               = useState<SquadMember[]>([]);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery]   = useState("");
  const [category, setCategory]         = useState<CategoryFilter>("all");
  const [equipment, setEquipment]       = useState<EquipmentFilter>("any");
  const [weekPlan, setWeekPlan]         = useState<WeekPlan>({});
  const [assignments, setAssignments]   = useState<Assignment[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignMode, setAssignMode]     = useState<"player" | "team">("player");
  const [dayPickerOpen, setDayPickerOpen] = useState<DayName | null>(null);
  const [templateName, setTemplateName] = useState("Week 1");
  const [toast, setToast]               = useState<string | null>(null);

  // Load cards from API
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!API || !token) return;

    fetch(`${API}/exercise-cards?per_page=100`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (Array.isArray(data?.data)) setCards(data.data as ExerciseCard[]); })
      .catch(() => {});
  }, []);

  // Load squad from API
  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!API || !token) return;

    fetch(`${API}/coach/squad`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = data?.data ?? data?.squad ?? [];
        if (Array.isArray(list)) setSquad(list as SquadMember[]);
      })
      .catch(() => {});
  }, []);

  // Load saved assignments and week plan from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ASSIGNMENTS_KEY);
      if (saved) setAssignments(JSON.parse(saved));
      const week = localStorage.getItem(WEEK_TEMPLATE_KEY);
      if (week) setWeekPlan(JSON.parse(week));
    } catch { /* ignore */ }
  }, []);

  // ── Filtered cards ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return cards.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (equipment !== "any" && c.equipment_tier !== equipment) return false;
      if (q) {
        const inName     = c.name.toLowerCase().includes(q);
        const inMuscles  = c.muscles_targeted.some((m) => m.toLowerCase().includes(q));
        const inPosition = c.position_tags.some((p) => p.toLowerCase().includes(q));
        const inCategory = c.category.toLowerCase().includes(q);
        if (!inName && !inMuscles && !inPosition && !inCategory) return false;
      }
      return true;
    });
  }, [cards, category, equipment, searchQuery]);

  // ── Selection ────────────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  // ── Toast ────────────────────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ── Assign to player/team ────────────────────────────────────────────────────

  function assignCards(target: "player" | "team", player?: SquadMember) {
    const cardIds = Array.from(selected);
    if (cardIds.length === 0) return;

    const assignment: Assignment = {
      id: `assign-${Date.now()}`,
      target,
      playerName: target === "team" ? "Full Squad" : (player?.name ?? "Player"),
      cardIds,
      assignedAt: new Date().toISOString(),
    };

    const next = [assignment, ...assignments];
    setAssignments(next);
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(next));

    // Store under player key so their THUTO picks can surface it
    const storeKey = target === "team"
      ? "gs_coach_team_conditioning"
      : `gs_coach_assigns_${player?.id ?? "unknown"}`;
    localStorage.setItem(storeKey, JSON.stringify(cardIds));

    showToast(`${cardIds.length} exercise${cardIds.length !== 1 ? "s" : ""} assigned to ${assignment.playerName}`);
    clearSelection();
    setShowAssignModal(false);
  }

  // ── Week plan ────────────────────────────────────────────────────────────────

  function addCardsToDay(day: DayName, cardIds: string[]) {
    setWeekPlan((prev) => {
      const existing = prev[day] ?? [];
      const merged   = Array.from(new Set([...existing, ...cardIds]));
      const next     = { ...prev, [day]: merged };
      localStorage.setItem(WEEK_TEMPLATE_KEY, JSON.stringify(next));
      return next;
    });
    setDayPickerOpen(null);
  }

  function removeCardFromDay(day: DayName, cardId: string) {
    setWeekPlan((prev) => {
      const next = { ...prev, [day]: (prev[day] ?? []).filter((id) => id !== cardId) };
      localStorage.setItem(WEEK_TEMPLATE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearDay(day: DayName) {
    setWeekPlan((prev) => {
      const next = { ...prev, [day]: [] };
      localStorage.setItem(WEEK_TEMPLATE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function assignWeekToTeam() {
    const assignment: Assignment = {
      id: `week-${Date.now()}`,
      target: "team",
      playerName: "Full Squad",
      cardIds: Object.values(weekPlan).flat(),
      weekPlan,
      assignedAt: new Date().toISOString(),
    };
    const next = [assignment, ...assignments];
    setAssignments(next);
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(next));
    localStorage.setItem("gs_coach_team_week", JSON.stringify(weekPlan));
    showToast("Week plan assigned to full squad");
  }

  // ── Download as WhatsApp image ───────────────────────────────────────────────

  function downloadPlan() {
    const canvas  = document.createElement("canvas");
    canvas.width  = 1080;
    canvas.height = 1920;
    const ctx     = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = "#1a3d26";
    ctx.fillRect(0, 0, W, H);

    // Gold header band
    ctx.fillStyle = "#f0b429";
    ctx.fillRect(0, 0, W, 200);

    ctx.fillStyle = "#1a3a1a";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("THUTO Conditioning Plan", 60, 90);
    ctx.font = "34px sans-serif";
    ctx.fillText(templateName, 60, 148);

    // Days
    const topPad = 200;
    const rowH   = Math.floor((H - topPad - 80) / 7);

    DAYS.forEach((day, i) => {
      const y     = topPad + i * rowH;
      const dayCards = (weekPlan[day] ?? [])
        .map((id) => cards.find((c) => c.id === id))
        .filter(Boolean) as ExerciseCard[];

      // Alternating rows
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)";
      ctx.fillRect(0, y, W, rowH);

      // Left accent bar
      const accent = ["#14b8a6","#f59e0b","#ef4444","#a855f7","#eab308","#6366f1","#22c55e"][i];
      ctx.fillStyle = accent;
      ctx.fillRect(0, y, 8, rowH);

      // Day name
      ctx.fillStyle = "#f0b429";
      ctx.font = "bold 38px sans-serif";
      ctx.fillText(day, 32, y + 52);

      if (dayCards.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.font = "italic 28px sans-serif";
        ctx.fillText("Rest day", 32, y + 100);
      } else {
        ctx.font = "28px sans-serif";
        dayCards.slice(0, 3).forEach((card, ci) => {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillText(`• ${card.name}`, 40, y + 100 + ci * 42);
        });
        if (dayCards.length > 3) {
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillText(`+${dayCards.length - 3} more exercises`, 40, y + 100 + 3 * 42);
        }
      }
    });

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "26px sans-serif";
    ctx.fillText("grassrootssports.live  ·  Powered by THUTO AI", 40, H - 30);

    const link      = document.createElement("a");
    link.download   = `conditioning-${templateName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href       = canvas.toDataURL("image/png");
    link.click();
  }

  // ── Selected card lookup ──────────────────────────────────────────────────────

  const selectedCards = useMemo(
    () => cards.filter((c) => selected.has(c.id)),
    [cards, selected],
  );

  // ── Day picker cards (for week builder modal) ─────────────────────────────────

  const dayPickerFiltered = useMemo(() => {
    if (!dayPickerOpen) return [];
    const alreadyIn = new Set(weekPlan[dayPickerOpen] ?? []);
    return cards.filter((c) => !alreadyIn.has(c.id));
  }, [dayPickerOpen, cards, weekPlan]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-background pb-24">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-[#f0b429]/10 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link href="/coach" className="text-xs text-muted-foreground hover:text-white">
            ← Coach Hub
          </Link>
          <h1 className="mt-0.5 text-xl font-bold text-white">Conditioning Hub</h1>
          <p className="text-xs text-muted-foreground">
            Build sessions, assign plans, and track physical development.
          </p>

          {/* Tab bar */}
          <div className="mt-3 flex gap-1 rounded-xl border border-[#f0b429]/10 bg-white/5 p-1">
            {(
              [
                { id: "library",     label: "Library",      icon: <ClipboardList className="h-3.5 w-3.5" /> },
                { id: "week",        label: "Week Builder",  icon: <Calendar className="h-3.5 w-3.5" /> },
                { id: "assignments", label: "Assignments",   icon: <Users className="h-3.5 w-3.5" /> },
              ] as { id: TabId; label: string; icon: React.ReactNode }[]
            ).map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                  tab === id
                    ? "bg-[#f0b429] text-[#1a3a1a]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-5">

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1 — LIBRARY                                                    */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === "library" && (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, muscle, position, category…"
                className="w-full rounded-xl border border-[#f0b429]/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-[#f0b429]/50 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category filters */}
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {FILTER_TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    category === id
                      ? "border-[#f0b429] bg-[#f0b429] text-[#1a3a1a]"
                      : "border-[#f0b429]/20 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Equipment filter */}
            <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
              {(["any", "zero", "basic", "gym"] as const).map((eq) => (
                <button
                  key={eq}
                  onClick={() => setEquipment(eq)}
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    equipment === eq
                      ? "border-[#f0b429]/40 bg-white/20 text-white"
                      : "border-[#f0b429]/10 text-white/50 hover:text-white/70"
                  }`}
                >
                  {eq === "any" ? "Any equipment" : eq.charAt(0).toUpperCase() + eq.slice(1)}
                </button>
              ))}
            </div>

            {/* Count */}
            <p className="mb-3 text-xs text-muted-foreground">
              {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
              {selected.size > 0 && (
                <span className="ml-2 font-semibold text-[#f0b429]">
                  · {selected.size} selected
                </span>
              )}
            </p>

            {/* Card grid */}
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-[#f0b429]/10 bg-card/60 px-6 py-10 text-center">
                <p className="text-sm text-white/60">No exercises match.</p>
                <button
                  onClick={() => { setSearchQuery(""); setCategory("all"); setEquipment("any"); }}
                  className="mt-2 text-sm text-[#f0b429] underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-32">
                {filtered.map((card) => (
                  <CoachCardTile
                    key={card.id}
                    card={card}
                    isSelected={selected.has(card.id)}
                    onToggle={toggleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2 — WEEK BUILDER                                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === "week" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="rounded-lg border border-[#f0b429]/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white focus:border-[#f0b429]/50 focus:outline-none"
                  placeholder="Plan name…"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={assignWeekToTeam}
                  className="flex items-center gap-1.5 rounded-xl border border-[#f0b429]/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
                >
                  <Users className="h-3.5 w-3.5" />
                  Assign to team
                </button>
                <button
                  onClick={downloadPlan}
                  className="flex items-center gap-1.5 rounded-xl bg-[#f0b429] px-3 py-2 text-xs font-bold text-[#1a3a1a] active:opacity-80"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </div>
            </div>

            <div className="space-y-3 pb-16">
              {DAYS.map((day) => {
                const dayCardIds = weekPlan[day] ?? [];
                const dayCards   = dayCardIds
                  .map((id) => cards.find((c) => c.id === id))
                  .filter(Boolean) as ExerciseCard[];
                const isRest     = day === "Sunday";

                return (
                  <div key={day} className="rounded-2xl border border-[#f0b429]/10 bg-card/60">
                    <div className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-bold text-white">{day}</p>
                        <p className="text-xs text-muted-foreground">
                          {isRest
                            ? "Rest day"
                            : dayCards.length === 0
                            ? "No exercises yet"
                            : `${dayCards.length} exercise${dayCards.length !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {dayCards.length > 0 && (
                          <button
                            onClick={() => clearDay(day)}
                            className="rounded-lg border border-[#f0b429]/10 p-1.5 text-white/40 hover:text-white/70"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!isRest && (
                          <button
                            onClick={() => setDayPickerOpen(dayPickerOpen === day ? null : day)}
                            className="flex items-center gap-1.5 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 px-3 py-1.5 text-xs font-semibold text-[#f0b429]"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add exercises
                            {dayPickerOpen === day
                              ? <ChevronUp className="h-3 w-3" />
                              : <ChevronDown className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Exercise pills for this day */}
                    {dayCards.length > 0 && (
                      <div className="flex flex-wrap gap-2 border-t border-[#f0b429]/10 px-4 pb-4 pt-3">
                        {dayCards.map((card) => {
                          const cfg = CATEGORY_CONFIG[card.category];
                          return (
                            <span
                              key={card.id}
                              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}
                            >
                              {cfg.icon}
                              {card.name}
                              <button
                                onClick={() => removeCardFromDay(day, card.id)}
                                className="ml-0.5 opacity-60 hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline card picker for this day */}
                    {dayPickerOpen === day && (
                      <div className="border-t border-[#f0b429]/10 px-4 pb-4 pt-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Tap to add to {day}
                        </p>
                        <DayCardPicker
                          availableCards={dayPickerFiltered}
                          onAdd={(id) => addCardsToDay(day, [id])}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3 — ASSIGNMENTS                                                */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {tab === "assignments" && (
          <div className="space-y-3 pb-10">
            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-[#f0b429]/10 bg-card/60 px-6 py-12 text-center">
                <ClipboardList className="mx-auto mb-3 h-10 w-10 text-white/20" />
                <p className="text-sm text-white/60">No assignments yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Select exercises in the Library tab and assign them to players.
                </p>
              </div>
            ) : (
              assignments.map((a) => (
                <div key={a.id} className="rounded-2xl border border-[#f0b429]/10 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {a.target === "team"
                          ? <Users className="h-4 w-4 text-[#f0b429]" />
                          : <User className="h-4 w-4 text-[#f0b429]" />}
                        <p className="text-sm font-bold text-white">{a.playerName}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {a.weekPlan ? "Week plan" : `${a.cardIds.length} exercise${a.cardIds.length !== 1 ? "s" : ""}`}
                        {" · "}
                        {new Date(a.assignedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Assigned
                    </span>
                  </div>

                  {/* Card names preview */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.cardIds
                      .slice(0, 5)
                      .map((id) => cards.find((c) => c.id === id))
                      .filter(Boolean)
                      .map((card) => (
                        <span
                          key={card!.id}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/60"
                        >
                          {card!.name}
                        </span>
                      ))}
                    {a.cardIds.length > 5 && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                        +{a.cardIds.length - 5} more
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-[10px] text-white/25">
                    Player sees this in THUTO's picks tagged "Your coach added this"
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Selection action bar (Library tab) ─────────────────────────────── */}
      {tab === "library" && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t border-[#f0b429]/10 bg-background/95 backdrop-blur-sm p-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                {selected.size} exercise{selected.size !== 1 ? "s" : ""} selected
              </p>
              <button
                onClick={clearSelection}
                className="rounded-full border border-[#f0b429]/20 p-1.5 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setAssignMode("player"); setShowAssignModal(true); }}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#f0b429]/20 bg-white/5 py-3 text-xs font-semibold text-white hover:bg-white/10"
              >
                <User className="h-4 w-4" />
                Assign to player
              </button>
              <button
                onClick={() => assignCards("team")}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#f0b429]/20 bg-white/5 py-3 text-xs font-semibold text-white hover:bg-white/10"
              >
                <Users className="h-4 w-4" />
                Assign to team
              </button>
              <button
                onClick={() => {
                  Array.from(selected).forEach((id) => {
                    const day = DAYS[Object.keys(weekPlan).length % 7];
                    addCardsToDay(day, [id]);
                  });
                  setTab("week");
                  clearSelection();
                }}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#f0b429] py-3 text-xs font-bold text-[#1a3a1a] active:opacity-80"
              >
                <Calendar className="h-4 w-4" />
                Add to week
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign to player modal ──────────────────────────────────────────── */}
      {showAssignModal && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/70 backdrop-blur-sm"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="w-full max-h-[70vh] overflow-y-auto rounded-t-3xl bg-[#1a3d26] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Assign to player</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCards.length} exercise{selectedCards.length !== 1 ? "s" : ""} selected
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {squad.length === 0 ? (
              <p className="text-sm text-white/50">
                No squad members found. Add players via{" "}
                <Link href="/coach/squad" className="text-[#f0b429] underline">
                  Coach → Squad
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2">
                {squad.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => assignCards("player", player)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#f0b429]/10 bg-white/5 px-4 py-3 hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0b429]/20 text-sm font-bold text-[#f0b429]">
                        {player.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">{player.name}</p>
                        {player.position && (
                          <p className="text-xs text-muted-foreground">{player.position}</p>
                        )}
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-white/20" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-300 shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}
    </main>
  );
}

// ─── Card tile (library grid) ─────────────────────────────────────────────────

function CoachCardTile({
  card,
  isSelected,
  onToggle,
}: {
  card: ExerciseCard;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  const cfg = CATEGORY_CONFIG[card.category];

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border transition-all ${
        isSelected
          ? "border-[#f0b429]/60 bg-[#f0b429]/5"
          : "border-[#f0b429]/10 bg-card/60"
      }`}
    >
      <button onClick={() => onToggle(card.id)} className="flex-1 p-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}
          >
            {cfg.icon}
            {cfg.label}
          </span>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              isSelected
                ? "border-[#f0b429] bg-[#f0b429]"
                : "border-[#f0b429]/30 bg-transparent"
            }`}
          >
            {isSelected && <CheckCircle2 className="h-3 w-3 text-[#1a3a1a]" />}
          </span>
        </div>

        <p className="mt-2 text-sm font-bold leading-snug text-white">{card.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {card.duration_seconds
            ? `${Math.round(card.duration_seconds / 60)} min`
            : (card.reps ?? "")}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${EQUIPMENT_COLORS[card.equipment_tier]}`}>
            {card.equipment_tier.charAt(0).toUpperCase() + card.equipment_tier.slice(1)}
          </span>
          <div className="flex gap-0.5">
            {([1, 2, 3] as const).map((d) => (
              <span
                key={d}
                className={`h-1.5 w-1.5 rounded-full ${d <= card.difficulty_level ? "bg-[#f0b429]" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>

        {card.muscles_targeted.length > 0 && (
          <p className="mt-1.5 text-[10px] text-white/30">
            {card.muscles_targeted.slice(0, 2).join(" · ")}
          </p>
        )}
      </button>
    </div>
  );
}

// ─── Day card picker (week builder inline panel) ──────────────────────────────

function DayCardPicker({
  availableCards,
  onAdd,
}: {
  availableCards: ExerciseCard[];
  onAdd: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const shown = useMemo(
    () =>
      availableCards.filter(
        (c) =>
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.category.toLowerCase().includes(search.toLowerCase()),
      ),
    [availableCards, search],
  );

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Filter exercises…"
        className="mb-2 w-full rounded-lg border border-[#f0b429]/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-[#f0b429]/50 focus:outline-none"
      />
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {shown.slice(0, 20).map((card) => {
          const cfg = CATEGORY_CONFIG[card.category];
          return (
            <button
              key={card.id}
              onClick={() => onAdd(card.id)}
              className="flex w-full items-center justify-between rounded-lg border border-[#f0b429]/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                <p className="truncate text-xs font-semibold text-white">{card.name}</p>
              </div>
              <Plus className="h-3.5 w-3.5 shrink-0 text-[#f0b429]" />
            </button>
          );
        })}
        {shown.length === 0 && (
          <p className="py-3 text-center text-xs text-white/40">No exercises found.</p>
        )}
      </div>
    </div>
  );
}
