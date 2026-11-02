"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, ChevronDown, ChevronUp, Loader2, CheckCircle2, Clock, Users, Target } from "lucide-react";

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

// ─── Category colours ─────────────────────────────────────────────────────────

const CAT_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  defending: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  attacking:  { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
  passing:    { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  finishing:  { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const PHASE_ICONS: Record<string, string> = {
  foundation:   "🌱",
  development:  "📈",
  performance:  "⚡",
  professional: "🏆",
};

// ─── Shared card style ────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  marginBottom: 12,
};

// ─── PhaseCard ────────────────────────────────────────────────────────────────

function PhaseCard({ phase }: { phase: Phase }) {
  const [open, setOpen] = useState(false);
  const emoji = PHASE_ICONS[phase.id] ?? "📋";

  return (
    <div style={CARD}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 20px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 13, flexShrink: 0,
          backgroundColor: `${phase.color}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{phase.label}</span>
            <span style={{
              backgroundColor: "#f0fdf4", color: "#15803d",
              border: "1px solid #bbf7d0",
              borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600,
            }}>
              {phase.age_range}
            </span>
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {phase.focus}
          </p>
        </div>
        {open
          ? <ChevronUp size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0 }} />}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "20px" }}>
          <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, marginBottom: 20 }}>{phase.description}</p>

          {/* Training guidelines */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { icon: Clock, label: "Sessions/week", value: String(phase.training_guidelines.sessions_per_week) },
              { icon: Clock, label: "Duration",       value: `${phase.training_guidelines.session_duration_minutes} min` },
              { icon: Users, label: "Ratio",          value: phase.training_guidelines.ratio.split(" ")[0] + " coach" },
              { icon: Target, label: "Ball size",     value: `Size ${phase.training_guidelines.ball_size}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                backgroundColor: "#f9fafb", borderRadius: 12,
                border: "1px solid #e5e7eb", padding: "12px 10px", textAlign: "center",
              }}>
                <Icon size={14} color="#6b7280" style={{ margin: "0 auto 4px" }} />
                <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 2px" }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Session structure */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              Session Structure
            </p>
            {phase.training_guidelines.session_structure.map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 10, padding: "8px 14px", marginBottom: 6,
              }}>
                <span style={{ fontSize: 13, color: "#374151" }}>{s.component}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2a" }}>{s.duration_minutes} min</span>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Physical
              </p>
              {phase.physical_milestones.slice(0, 5).map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={12} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.4 }}>{m}</span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Technical
              </p>
              {phase.technical_milestones.slice(0, 5).map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
                  <CheckCircle2 size={12} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.4 }}>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProgrammeCard ────────────────────────────────────────────────────────────

function ProgrammeCard({ prog }: { prog: Programme }) {
  const [open, setOpen] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const cat = CAT_STYLE[prog.category] ?? CAT_STYLE.defending;

  return (
    <div style={{ ...CARD, border: `1px solid ${cat.border}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "16px 18px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{
              backgroundColor: cat.bg, color: cat.color,
              border: `1px solid ${cat.border}`,
              borderRadius: 20, padding: "2px 10px",
              fontSize: 11, fontWeight: 700, textTransform: "capitalize",
            }}>
              {prog.category}
            </span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{prog.weeks.length}-week programme</span>
          </div>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "#111", lineHeight: 1.4 }}>{prog.title}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {prog.key_words.slice(0, 4).map((kw) => (
              <span key={kw} style={{
                backgroundColor: "#f3f4f6", color: "#6b7280",
                borderRadius: 6, padding: "2px 7px", fontSize: 10,
              }}>{kw}</span>
            ))}
          </div>
        </div>
        {open
          ? <ChevronUp size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
          : <ChevronDown size={16} color="#9ca3af" style={{ flexShrink: 0 }} />}
      </button>

      {open && (
        <div style={{ borderTop: `1px solid ${cat.border}` }}>
          {/* Week selector */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "12px 16px 0" }}>
            {prog.weeks.map((w, i) => (
              <button
                key={i}
                onClick={() => setActiveWeek(i)}
                style={{
                  flexShrink: 0, borderRadius: 10, padding: "6px 14px",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: "none",
                  backgroundColor: activeWeek === i ? "#1a5c2a" : "#f3f4f6",
                  color: activeWeek === i ? "white" : "#6b7280",
                }}
              >
                Week {w.week}
              </button>
            ))}
          </div>

          {prog.weeks[activeWeek] && (
            <div style={{ padding: "16px 18px" }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 14 }}>
                {prog.weeks[activeWeek].title}
              </p>

              {/* Objectives */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Objectives
              </p>
              {prog.weeks[activeWeek].objectives.map((o, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <Target size={12} color="#1a5c2a" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{o}</span>
                </div>
              ))}

              {/* Coaching points */}
              <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "16px 0 8px" }}>
                Coaching Points
              </p>
              {prog.weeks[activeWeek].coaching_points.map((cp, i) => (
                <div key={i} style={{
                  backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                  borderRadius: 10, padding: "8px 14px", marginBottom: 6,
                  fontSize: 13, color: "#374151", lineHeight: 1.5,
                }}>
                  {cp}
                </div>
              ))}

              {/* Activities */}
              {prog.weeks[activeWeek].activities?.length > 0 && (
                <>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "16px 0 8px" }}>
                    Activities
                  </p>
                  {prog.weeks[activeWeek].activities.map((act, i) => (
                    <div key={i} style={{
                      backgroundColor: "#f9fafb", border: "1px solid #e5e7eb",
                      borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                    }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1a5c2a", marginBottom: 8 }}>{act.name}</p>
                      {act.instructions.map((ins, j) => (
                        <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>{j + 1}.</span>
                          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>{ins}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const SPORT_OPTIONS = [
  { key: "football", label: "Football", emoji: "⚽", phases: "/data/development_phases.json",         progs: "/data/session_programmes.json" },
  { key: "netball",  label: "Netball",  emoji: "🏐", phases: "/data/netball_development_phases.json", progs: "/data/netball_session_programmes.json" },
] as const;
type SportOption = typeof SPORT_OPTIONS[number]["key"];

export default function TrainingPlansPage() {
  const [sport, setSport] = useState<SportOption>("football");
  const [tab, setTab] = useState<"phases" | "programmes">("phases");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");

  useEffect(() => {
    const cfg = SPORT_OPTIONS.find((s) => s.key === sport)!;
    setLoading(true);
    setPhases([]);
    setProgrammes([]);
    const p1 = fetch(cfg.phases).then((r) => r.json()).then((d) => setPhases(d.phases ?? [])).catch(() => {});
    const p2 = fetch(cfg.progs).then((r) => r.json()).then((d) => setProgrammes(d.session_programmes ?? [])).catch(() => {});
    Promise.all([p1, p2]).finally(() => setLoading(false));
  }, [sport]);

  const categories    = ["all", ...Array.from(new Set(programmes.map((p) => p.category))).sort()];
  const filteredProgs = catFilter === "all" ? programmes : programmes.filter((p) => p.category === catFilter);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Nav */}
      <div style={{
        backgroundColor: "white", borderBottom: "1px solid #e5e5e5",
        padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link
          href="/coach"
          style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}
        >
          <ArrowLeft size={15} /> Coach Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Training Plans</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Layers size={22} color="#f0b429" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111" }}>Training Plans</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Development phases &amp; session programmes</p>
          </div>
        </div>

        {/* Sport selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {SPORT_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setSport(s.key); setCatFilter("all"); setTab("phases"); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
                border: "2px solid",
                borderColor: sport === s.key ? "#1a5c2a" : "#e5e7eb",
                backgroundColor: sport === s.key ? "#f0fdf4" : "white",
                color: sport === s.key ? "#1a5c2a" : "#374151",
              }}
            >
              <span>{s.emoji}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, backgroundColor: "white",
          border: "1px solid #e5e7eb", borderRadius: 12, padding: 4,
          width: "fit-content", marginBottom: 24,
        }}>
          {(["phases", "programmes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "7px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600,
                cursor: "pointer", border: "none",
                backgroundColor: tab === t ? "#1a5c2a" : "transparent",
                color: tab === t ? "white" : "#6b7280",
              }}
            >
              {t === "phases" ? "Development Phases" : "Session Programmes"}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0", color: "#6b7280" }}>
            <Loader2 size={22} style={{ marginRight: 8, animation: "spin 1s linear infinite" }} /> Loading…
          </div>
        ) : tab === "phases" ? (
          <>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
              Zimbabwe Grassroots {SPORT_OPTIONS.find((s) => s.key === sport)?.label} Development Framework — player development phases from junior to elite.
            </p>
            {phases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)}
          </>
        ) : (
          <>
            {/* Category filter */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  style={{
                    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "2px solid", textTransform: "capitalize",
                    borderColor: catFilter === c ? "#1a5c2a" : "#e5e7eb",
                    backgroundColor: catFilter === c ? "#1a5c2a" : "white",
                    color: catFilter === c ? "white" : "#374151",
                  }}
                >
                  {c === "all" ? `All (${programmes.length})` : `${c} (${programmes.filter((p) => p.category === c).length})`}
                </button>
              ))}
            </div>
            {filteredProgs.map((prog) => <ProgrammeCard key={prog.id} prog={prog} />)}
            {filteredProgs.length === 0 && (
              <p style={{ textAlign: "center", padding: "60px 0", fontSize: 14, color: "#6b7280" }}>
                No programmes in this category.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
