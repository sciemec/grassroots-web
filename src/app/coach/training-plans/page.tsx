"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, ChevronDown, ChevronUp, Loader2, CheckCircle2, Clock, Users, Target } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionComponent {
  component: string;
  duration_minutes: number;
}

interface Phase {
  id: string;
  name: string;
  label: string;
  age_range: string;
  color: string;
  focus: string;
  description: string;
  training_guidelines: {
    sessions_per_week: number;
    session_duration_minutes: number;
    session_structure: SessionComponent[];
    ratio: string;
    field_size: string;
    ball_size: string;
  };
  physical_milestones: string[];
  technical_milestones: string[];
}

interface Activity {
  name: string;
  instructions: string[];
}

interface Week {
  week: number;
  title: string;
  coaching_points: string[];
  objectives: string[];
  activities: Activity[];
}

interface Programme {
  id: string;
  title: string;
  category: string;
  key_words: string[];
  weeks: Week[];
  image_id?: string;
}

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  defending:  { bg: "bg-blue-500/15",   text: "text-blue-400",   border: "border-blue-500/40" },
  attacking:  { bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/40" },
  passing:    { bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/40" },
  finishing:  { bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/40" },
};

const PHASE_ICONS: Record<string, string> = {
  foundation:   "🌱",
  development:  "📈",
  performance:  "⚡",
  professional: "🏆",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseCard({ phase }: { phase: Phase }) {
  const [open, setOpen] = useState(false);
  const emoji = PHASE_ICONS[phase.id] ?? "📋";

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${phase.color}22` }}>
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-white">{phase.label}</h3>
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary">
              {phase.age_range}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{phase.focus}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/10 p-5 space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>

          {/* Training guidelines */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Clock, label: "Sessions/week", value: String(phase.training_guidelines.sessions_per_week) },
              { icon: Clock, label: "Duration", value: `${phase.training_guidelines.session_duration_minutes} min` },
              { icon: Users, label: "Ratio", value: phase.training_guidelines.ratio.split(" ")[0] + " coach" },
              { icon: Target, label: "Ball size", value: `Size ${phase.training_guidelines.ball_size}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                <Icon className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Session structure */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-white">Session Structure</h4>
            <div className="space-y-1.5">
              {phase.training_guidelines.session_structure.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                  <span className="text-sm text-white/80">{s.component}</span>
                  <span className="text-xs font-medium text-primary">{s.duration_minutes} min</span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white">Physical Milestones</h4>
              <ul className="space-y-1.5">
                {phase.physical_milestones.slice(0, 5).map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold text-white">Technical Milestones</h4>
              <ul className="space-y-1.5">
                {phase.technical_milestones.slice(0, 5).map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-blue-400" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgrammeCard({ prog }: { prog: Programme }) {
  const [open, setOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const colors = CAT_COLORS[prog.category] ?? CAT_COLORS.defending;

  return (
    <div className={`rounded-2xl border bg-card/60 overflow-hidden ${colors.border}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${colors.bg} ${colors.text}`}>
              {prog.category}
            </span>
            <span className="text-xs text-muted-foreground">{prog.weeks.length}-week programme</span>
          </div>
          <h3 className="mt-1 font-semibold text-sm text-white leading-snug">{prog.title}</h3>
          <div className="mt-1 flex flex-wrap gap-1">
            {prog.key_words.slice(0, 4).map((kw) => (
              <span key={kw} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted-foreground">{kw}</span>
            ))}
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/10">
          {/* Week selector */}
          <div className="flex gap-1 overflow-x-auto p-3 pb-0">
            {prog.weeks.map((w, i) => (
              <button
                key={i}
                onClick={() => setActiveWeek(i)}
                className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeWeek === i ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                Week {w.week}
              </button>
            ))}
          </div>

          {/* Week content */}
          {prog.weeks[activeWeek] && (
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-semibold text-white">{prog.weeks[activeWeek].title}</h4>
              </div>

              {/* Objectives */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Objectives</p>
                <ul className="space-y-1">
                  {prog.weeks[activeWeek].objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/80">
                      <Target className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
                      {o}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Coaching points */}
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coaching Points</p>
                <ul className="space-y-1.5">
                  {prog.weeks[activeWeek].coaching_points.map((cp, i) => (
                    <li key={i} className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-white/80 leading-relaxed">
                      {cp}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Activities */}
              {prog.weeks[activeWeek].activities?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activities</p>
                  <div className="space-y-3">
                    {prog.weeks[activeWeek].activities.map((act, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="mb-2 text-xs font-bold text-primary">{act.name}</p>
                        <ul className="space-y-1">
                          {act.instructions.map((ins, j) => (
                            <li key={j} className="flex gap-2 text-xs text-white/70">
                              <span className="flex-shrink-0 text-muted-foreground">{j + 1}.</span>
                              {ins}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TrainingPlansPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"phases" | "programmes">("phases");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  useEffect(() => {
    const p1 = fetch("/data/development_phases.json").then((r) => r.json()).then((d) => setPhases(d.phases ?? []));
    const p2 = fetch("/data/session_programmes.json").then((r) => r.json()).then((d) => setProgrammes(d.session_programmes ?? []));
    Promise.all([p1, p2]).finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(programmes.map((p) => p.category))).sort()];
  const filteredProgs = catFilter === "all" ? programmes : programmes.filter((p) => p.category === catFilter);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="border-b bg-card px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Training Plans</h1>
              <p className="text-sm text-muted-foreground">Development phases & session programmes</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
            {(["phases", "programmes"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "phases" ? "Development Phases" : "Session Programmes"}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
            </div>
          ) : tab === "phases" ? (
            <>
              <p className="text-sm text-muted-foreground">
                Zimbabwe Grassroots Football Development Framework — 4 phases from U10 to professional.
              </p>
              {phases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
            </>
          ) : (
            <>
              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      catFilter === c ? "bg-primary text-primary-foreground" : "border border-white/10 bg-card/60 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {c === "all" ? `All (${programmes.length})` : `${c} (${programmes.filter((p) => p.category === c).length})`}
                  </button>
                ))}
              </div>
              <div className="grid gap-4">
                {filteredProgs.map((prog) => <ProgrammeCard key={prog.id} prog={prog} />)}
              </div>
              {filteredProgs.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">No programmes in this category.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
