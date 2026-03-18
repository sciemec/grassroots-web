"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, ChevronDown, ChevronUp, BookOpen,
  Dumbbell, Brain, Leaf, Zap, Shield, Trophy, Clock, Users, X,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

// ─── Category definitions ────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: "drills",
    label: "Drill Library",
    sublabel: "200+ drills by skill & difficulty",
    icon: Dumbbell,
    gradient: "from-[#1a5276] to-[#0d2b4a]",
    hex: "#1a5276",
    file: "/data/drill_library.json",
  },
  {
    id: "coaching",
    label: "Coaching Knowledge",
    sublabel: "Techniques, faults & fixes",
    icon: Brain,
    gradient: "from-[#6c3483] to-[#4a235a]",
    hex: "#6c3483",
    file: "/data/coaching_knowledge.json",
  },
  {
    id: "phases",
    label: "Development Phases",
    sublabel: "Foundation → Elite pathways",
    icon: Trophy,
    gradient: "from-[#1a6b3c] to-[#0f3d22]",
    hex: "#1a6b3c",
    file: "/data/development_phases.json",
  },
  {
    id: "nutrition",
    label: "Nutrition Guide",
    sublabel: "Zimbabwe foods, pre & post training",
    icon: Leaf,
    gradient: "from-[#7d6608] to-[#5a4b06]",
    hex: "#7d6608",
    file: "/data/nutrition_advice.json",
  },
  {
    id: "fitness",
    label: "Fitness Protocols",
    sublabel: "Warm-ups, drills & conditioning",
    icon: Zap,
    gradient: "from-[#d35400] to-[#a04000]",
    hex: "#d35400",
    file: "/data/fitness_protocols.json",
  },
  {
    id: "football",
    label: "Football Guide",
    sublabel: "Rules, positions & formations",
    icon: Shield,
    gradient: "from-[#2471a3] to-[#1a5276]",
    hex: "#2471a3",
    file: "/data/football_guide.json",
  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// ─── JSON shape helpers ───────────────────────────────────────────────────────

interface Drill {
  id?: string;
  name: string;
  category?: string;
  skill?: string;
  difficulty?: string;
  duration_minutes?: number;
  players?: string;
  equipment?: string[];
  setup?: string;
  instructions?: string[];
  coaching_points?: string[];
  when_to_use?: string;
  age_phase?: string[];
}

interface Technique {
  name: string;
  description?: string;
  steps?: string[];
}

interface SkillEntry {
  description?: string;
  key_words?: string[];
  techniques?: Technique[];
  faults_and_fixes?: { fault: string; fix: string }[];
}

interface Phase {
  id: string;
  name: string;
  label: string;
  age_range?: string;
  focus?: string;
  description?: string;
  training_guidelines?: {
    sessions_per_week?: number;
    session_duration_minutes?: number;
    session_structure?: { component: string; duration_minutes: number }[];
    ratio?: string;
    ball_size?: string;
  };
  physical_milestones?: string[];
  technical_milestones?: string[];
  mental_milestones?: string[];
}

// ─── Drill card ───────────────────────────────────────────────────────────────

function DrillCard({ drill, hex }: { drill: Drill; hex: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: hex }} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{drill.name}</p>
            <div className="mt-0.5 flex items-center gap-2 flex-wrap">
              {drill.difficulty && (
                <span className="text-xs capitalize text-muted-foreground">{drill.difficulty}</span>
              )}
              {drill.duration_minutes && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{drill.duration_minutes} min
                </span>
              )}
              {drill.players && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />{drill.players}
                </span>
              )}
            </div>
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-3">
          {drill.setup && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Setup</p>
              <p className="text-sm text-white/80">{drill.setup}</p>
            </div>
          )}
          {drill.instructions && drill.instructions.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructions</p>
              <ol className="space-y-1.5">
                {drill.instructions.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/80">
                    <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full text-center text-xs font-bold text-white" style={{ backgroundColor: hex + "99" }}>{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {drill.coaching_points && drill.coaching_points.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coaching Points</p>
              <ul className="space-y-1">
                {drill.coaching_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {drill.when_to_use && (
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: hex + "22" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: hex === "#1a5276" ? "#5dade2" : "#f39c12" }}>When to use</p>
              <p className="mt-0.5 text-sm text-white/80">{drill.when_to_use}</p>
            </div>
          )}
          {drill.age_phase && drill.age_phase.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {drill.age_phase.map((ph) => (
                <span key={ph} className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs text-white/70">{ph}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({ skillKey, skill, hex }: { skillKey: string; skill: SkillEntry; hex: string }) {
  const [open, setOpen] = useState(false);
  const title = skillKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="rounded-xl border border-white/10 bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: hex }} />
          <p className="text-sm font-semibold text-white">{title}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          {skill.description && <p className="text-sm text-white/80">{skill.description}</p>}

          {skill.techniques && skill.techniques.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Techniques</p>
              <div className="space-y-3">
                {skill.techniques.map((t, i) => (
                  <div key={i} className="rounded-lg border border-white/10 px-3 py-2.5">
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    {t.description && <p className="mt-1 text-sm text-white/70">{t.description}</p>}
                    {t.steps && t.steps.length > 0 && (
                      <ol className="mt-2 space-y-1">
                        {t.steps.map((s, j) => (
                          <li key={j} className="text-xs text-white/60">{j + 1}. {s}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {skill.faults_and_fixes && skill.faults_and_fixes.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Common Faults & Fixes</p>
              <div className="space-y-2">
                {skill.faults_and_fixes.map((f, i) => (
                  <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
                    <p className="text-xs font-semibold text-red-300">❌ {f.fault}</p>
                    <p className="mt-1 text-xs text-green-300">✅ {f.fix}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Phase card ───────────────────────────────────────────────────────────────

function PhaseCard({ phase, hex }: { phase: Phase; hex: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: hex }} />
          <div>
            <p className="text-sm font-semibold text-white">{phase.label}</p>
            {phase.age_range && <p className="text-xs text-muted-foreground">{phase.age_range}</p>}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4">
          {phase.focus && (
            <div className="rounded-lg px-3 py-2" style={{ backgroundColor: hex + "22" }}>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Focus</p>
              <p className="mt-0.5 text-sm text-white/90">{phase.focus}</p>
            </div>
          )}
          {phase.description && <p className="text-sm text-white/70">{phase.description}</p>}

          {phase.training_guidelines && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Training Guidelines</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {phase.training_guidelines.sessions_per_week && (
                  <div className="rounded-lg border border-white/10 bg-card/40 p-2 text-center">
                    <p className="text-lg font-bold text-white">{phase.training_guidelines.sessions_per_week}</p>
                    <p className="text-xs text-muted-foreground">sessions/week</p>
                  </div>
                )}
                {phase.training_guidelines.session_duration_minutes && (
                  <div className="rounded-lg border border-white/10 bg-card/40 p-2 text-center">
                    <p className="text-lg font-bold text-white">{phase.training_guidelines.session_duration_minutes}</p>
                    <p className="text-xs text-muted-foreground">min/session</p>
                  </div>
                )}
                {phase.training_guidelines.ball_size && (
                  <div className="rounded-lg border border-white/10 bg-card/40 p-2 text-center">
                    <p className="text-lg font-bold text-white">{phase.training_guidelines.ball_size}</p>
                    <p className="text-xs text-muted-foreground">ball size</p>
                  </div>
                )}
              </div>
              {phase.training_guidelines.session_structure && (
                <div className="mt-3 space-y-1">
                  {phase.training_guidelines.session_structure.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-1.5">
                      <p className="text-sm text-white/80">{s.component}</p>
                      <span className="text-xs text-accent">{s.duration_minutes} min</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {phase.technical_milestones && phase.technical_milestones.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Technical Milestones</p>
              <ul className="space-y-1">
                {phase.technical_milestones.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-0.5 text-green-400">✓</span> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Nutrition section ────────────────────────────────────────────────────────

function NutritionPanel({ data, hex }: { data: Record<string, unknown>; hex: string }) {
  const TIMING_LABELS: Record<string, string> = {
    pre_training: "Before Training",
    post_training: "After Training",
    hydration: "Hydration",
    match_day: "Match Day",
  };

  const timings = Object.keys(data).filter((k) =>
    ["pre_training", "post_training", "hydration", "match_day"].includes(k)
  );

  if (timings.length === 0) {
    return <p className="text-sm text-muted-foreground">No nutrition data found.</p>;
  }

  return (
    <div className="space-y-4">
      {timings.map((timing) => {
        const section = data[timing] as Record<string, { english?: string; shona?: string }>;
        return (
          <div key={timing}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "#f0b429" }}>
              {TIMING_LABELS[timing] ?? timing}
            </p>
            <div className="space-y-2">
              {Object.entries(section).map(([type, content]) => (
                <div
                  key={type}
                  className="rounded-xl border border-white/10 px-4 py-3"
                  style={{ backgroundColor: hex + "18" }}
                >
                  <p className="mb-1 text-xs font-semibold capitalize text-accent">{type.replace(/_/g, " ")}</p>
                  <p className="text-sm text-white/80">{content?.english ?? ""}</p>
                  {content?.shona && (
                    <p className="mt-1 text-xs italic text-muted-foreground">{content.shona}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Generic JSON panel (fitness / football guide) ────────────────────────────

function GenericPanel({ data, hex }: { data: unknown; hex: string }) {
  if (Array.isArray(data)) {
    return (
      <div className="space-y-2">
        {(data as Record<string, unknown>[]).map((item, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-card/50 px-4 py-3">
            {Object.entries(item).filter(([k]) => !["id"].includes(k)).slice(0, 5).map(([k, v]) => (
              typeof v === "string" || typeof v === "number" ? (
                <div key={k} className="mb-1">
                  <span className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}: </span>
                  <span className="text-sm text-white/80">{String(v)}</span>
                </div>
              ) : null
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === "object" && data !== null) {
    return (
      <div className="space-y-4">
        {Object.entries(data as Record<string, unknown>)
          .filter(([k]) => !["version", "source", "description"].includes(k))
          .map(([key, value]) => (
            <div key={key} className="rounded-xl border border-white/10 bg-card/50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "#f0b429" }}>
                {key.replace(/_/g, " ")}
              </p>
              {typeof value === "string" ? (
                <p className="text-sm text-white/80">{value}</p>
              ) : Array.isArray(value) ? (
                <ul className="space-y-1">
                  {(value as string[]).slice(0, 6).map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: hex }} />
                      {typeof v === "string" ? v : JSON.stringify(v)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
      </div>
    );
  }

  return null;
}

// ─── Content renderer ─────────────────────────────────────────────────────────

function CategoryContent({
  categoryId,
  data,
  hex,
  search,
}: {
  categoryId: CategoryId;
  data: unknown;
  hex: string;
  search: string;
}) {
  const q = search.toLowerCase().trim();

  if (categoryId === "drills") {
    const drills: Drill[] = (data as { drills?: Drill[] })?.drills ?? (Array.isArray(data) ? (data as Drill[]) : []);
    const filtered = q ? drills.filter((d) =>
      [d.name, d.skill, d.category, d.when_to_use, ...(d.coaching_points ?? [])].join(" ").toLowerCase().includes(q)
    ) : drills;
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{filtered.length} drills</p>
        {filtered.map((d, i) => <DrillCard key={d.id ?? i} drill={d} hex={hex} />)}
      </div>
    );
  }

  if (categoryId === "coaching") {
    const skills = (data as { skills?: Record<string, SkillEntry> })?.skills ?? {};
    const entries = Object.entries(skills).filter(([k, v]) =>
      q ? [k, v.description ?? "", ...(v.key_words ?? [])].join(" ").toLowerCase().includes(q) : true
    );
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{entries.length} skills</p>
        {entries.map(([key, skill]) => <SkillCard key={key} skillKey={key} skill={skill} hex={hex} />)}
      </div>
    );
  }

  if (categoryId === "phases") {
    const phases: Phase[] = (data as { phases?: Phase[] })?.phases ?? (Array.isArray(data) ? (data as Phase[]) : []);
    const filtered = q ? phases.filter((p) =>
      [p.name, p.focus ?? "", p.description ?? ""].join(" ").toLowerCase().includes(q)
    ) : phases;
    return (
      <div className="space-y-2">
        {filtered.map((p) => <PhaseCard key={p.id} phase={p} hex={hex} />)}
      </div>
    );
  }

  if (categoryId === "nutrition") {
    return <NutritionPanel data={data as Record<string, unknown>} hex={hex} />;
  }

  return <GenericPanel data={data} hex={hex} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [active, setActive] = useState<CategoryId | null>(null);
  const [data, setData] = useState<unknown>(null);
  const [loadingCat, setLoadingCat] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  const selectCategory = useCallback(async (id: CategoryId) => {
    if (active === id) { setActive(null); setData(null); return; }
    const cat = CATEGORIES.find((c) => c.id === id)!;
    setActive(id);
    setData(null);
    setSearch("");
    setLoadingCat(true);
    try {
      const res = await fetch(cat.file);
      setData(await res.json());
    } catch {
      setData({ error: "Failed to load data file." });
    } finally {
      setLoadingCat(false);
    }
  }, [active]);

  if (!user) return null;

  const activeCat = CATEGORIES.find((c) => c.id === active);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6 lg:pt-6 pt-20">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href={user.role === "coach" ? "/coach" : "/player"}
            className="rounded-lg p-1.5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Offline Knowledge Base
            </p>
            <h1 className="text-2xl font-bold text-white">Coaching Library</h1>
            <p className="mt-0.5 text-sm text-accent/80 italic">
              Bhora rino — Everything you need, even without internet
            </p>
          </div>
        </div>

        {/* Category grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = active === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => selectCategory(cat.id)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-200 ${
                  isActive ? "ring-2 ring-white/40 scale-[0.97]" : "hover:scale-[1.02]"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${cat.hex}dd, ${cat.hex}88)`,
                }}
              >
                {/* Glow on active */}
                {isActive && (
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{ background: `radial-gradient(circle at 30% 30%, white, transparent 70%)` }}
                  />
                )}
                <Icon className="mb-2 h-5 w-5 text-white" />
                <p className="text-sm font-bold text-white leading-tight">{cat.label}</p>
                <p className="mt-0.5 text-xs text-white/70 leading-tight">{cat.sublabel}</p>
                {isActive && (
                  <div className="absolute right-2 top-2">
                    <X className="h-3.5 w-3.5 text-white/60" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        {active && activeCat && (
          <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ background: `linear-gradient(135deg, ${activeCat.hex}cc, ${activeCat.hex}66)` }}
            >
              <div className="flex items-center gap-3">
                <activeCat.icon className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-base font-bold text-white">{activeCat.label}</h2>
                  <p className="text-xs text-white/70">{activeCat.sublabel}</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-8 w-44 rounded-lg border border-white/20 bg-white/10 pl-8 pr-3 text-xs text-white placeholder-white/40 outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Mobile search */}
            <div className="px-4 py-3 border-b border-white/10 sm:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeCat.label.toLowerCase()}…`}
                  className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder-muted-foreground outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              {loadingCat ? (
                <div className="flex items-center gap-3 py-12 justify-center">
                  <BookOpen className="h-5 w-5 animate-pulse text-accent" />
                  <span className="text-sm text-muted-foreground">Loading knowledge base…</span>
                </div>
              ) : data ? (
                <CategoryContent
                  categoryId={active}
                  data={data}
                  hex={activeCat.hex}
                  search={search}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Empty state — no category selected */}
        {!active && (
          <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
            <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-semibold text-white">Select a category above</p>
            <p className="mt-1 text-sm text-muted-foreground">
              All content works offline — no internet needed
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
