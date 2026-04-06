"use client";

/**
 * FutureFit — Junior Football Development Hub
 *
 * Tabs:
 *  - Sessions   : FIFA / FCRF / FA coaching session library (existing)
 *  - Pathway    : ECD stages + development pathway from age 3 to 14+
 *  - Formats    : Official age-group pitch sizes + full session plans with drills
 *  - 3v3        : U7 entry format guide — rules, setup, coaching tips
 *  - Ask THUTO  : AI coach chat with knowledge-base context
 */

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, BookOpen, Brain, Shield, Target, Users,
  ChevronRight, ChevronDown, AlertTriangle, Loader2,
  Send, Sparkles, Star, Flag, Zap, Map, Globe, ChevronUp,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  COACHING_SESSIONS,
  findRelevantSessions,
  type CoachingSession,
} from "@/lib/football-knowledge";
import {
  FORMATS_TABLE,
  FORMAT_COLORS,
  TRAINING_FORMATS,
  PATHWAY_STEPS,
  ECD_STAGES,
  THREE_V_THREE_RULES,
  THREE_V_THREE_COACHING_TIPS,
  type TrainingFormat,
  type EcdStage,
} from "@/lib/football-formats";

// ─── Filter junior-relevant sessions ─────────────────────────────────────────

const JUNIOR_SESSIONS = COACHING_SESSIONS.filter(
  (s) => s.level === "youth" || s.level === "grassroots" || s.level === "all"
);

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  attacking:    { label: "Attacking",    icon: Zap,           color: "text-amber-400"  },
  defending:    { label: "Defending",    icon: Shield,        color: "text-blue-400"   },
  pressing:     { label: "Pressing",     icon: Target,        color: "text-green-400"  },
  fundamentals: { label: "Fundamentals", icon: Star,          color: "text-purple-400" },
  safety:       { label: "Safety",       icon: AlertTriangle, color: "text-red-400"    },
};

const LEVEL_META: Record<string, { label: string; color: string }> = {
  youth:      { label: "Youth",       color: "bg-purple-500/20 text-purple-300"  },
  grassroots: { label: "Grassroots",  color: "bg-green-500/20 text-green-300"   },
  all:        { label: "All Ages",    color: "bg-blue-500/20 text-blue-300"     },
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = "sessions" | "pathway" | "formats" | "3v3" | "chat";

// ─── Chat message type ────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

// ─── Session Detail Panel ─────────────────────────────────────────────────────

function SessionDetail({ session, onClose }: { session: CoachingSession; onClose: () => void }) {
  const meta = CATEGORY_META[session.category];
  const Icon = meta?.icon ?? BookOpen;
  const levelMeta = LEVEL_META[session.level];

  const paragraphs = session.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 20);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border border-white/10 bg-[#0f2318] sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-white/10 p-5">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 ${meta?.color ?? "text-white"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${levelMeta?.color ?? "bg-white/10 text-white/60"}`}>
                {levelMeta?.label ?? session.level}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                {session.source} · {session.pages}pp
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-white leading-snug">{session.title}</p>
          </div>
          <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {paragraphs.map((p, i) => {
            const isHeading = p.length < 80 && (p === p.toUpperCase() || /^PART \d|^Phase \d|^Key|^Session|^Organisation|^Objective/.test(p));
            return isHeading ? (
              <p key={i} className="mt-3 text-xs font-bold uppercase tracking-widest text-[#f0b429]">{p}</p>
            ) : (
              <p key={i} className="text-sm text-white/80 leading-relaxed">{p}</p>
            );
          })}
          {session.content.length > paragraphs.join("").length && (
            <p className="text-xs text-white/30 italic">· Showing first 20 sections — {session.pages} page session plan ·</p>
          )}
        </div>
        <div className="border-t border-white/10 p-4">
          <p className="text-center text-xs text-white/30">Source: {session.source} · Ask THUTO below for coaching tips on this session</p>
        </div>
      </div>
    </div>
  );
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onClick }: { session: CoachingSession; onClick: () => void }) {
  const meta = CATEGORY_META[session.category];
  const Icon = meta?.icon ?? BookOpen;
  const levelMeta = LEVEL_META[session.level];
  const preview = session.content.slice(0, 120).replace(/\s+/g, " ").trim() + "…";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 hover:bg-white/10 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ${meta?.color ?? "text-white"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${levelMeta?.color ?? "bg-white/10 text-white/50"}`}>
              {levelMeta?.label ?? session.level}
            </span>
            <span className="text-[9px] text-white/30 uppercase tracking-wider">{session.source}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{session.title}</p>
          <p className="mt-1 text-xs text-white/50 leading-relaxed line-clamp-2">{preview}</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-white/20 mt-1" />
      </div>
    </button>
  );
}

// ─── Pathway Tab ──────────────────────────────────────────────────────────────

function PathwayTab() {
  const [activeStage, setActiveStage] = useState<string>("tiny");
  const [activeActivity, setActiveActivity] = useState<number | null>(null);
  const [showShona, setShowShona] = useState(false);

  const stage = ECD_STAGES.find((s) => s.id === activeStage) as EcdStage;

  return (
    <div className="px-4 pb-8 pt-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Development Pathway</p>
          <h2 className="text-xl font-bold text-white">From ECD to 11v11</h2>
          <p className="text-xs text-white/40 mt-0.5">Zimbabwe&apos;s full football development pathway, age 3 to Open Age</p>
        </div>
        <button
          onClick={() => setShowShona((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            showShona ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/60 hover:bg-white/15"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          {showShona ? "English" : "Shona 🇿🇼"}
        </button>
      </div>

      {/* Pathway strip */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {PATHWAY_STEPS.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="rounded-xl border p-3 text-center min-w-[80px]"
                style={{
                  borderColor: step.color + "60",
                  borderTopWidth: 3,
                  borderTopColor: step.color,
                  background: step.isEcd ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                }}
              >
                <div className="text-xl mb-1">{step.icon}</div>
                <div className="text-[11px] font-bold" style={{ color: step.color }}>{step.age}</div>
                <div className="text-[9px] text-white/50 uppercase tracking-wide mt-0.5">{step.label}</div>
                <div className="text-[10px] text-white/70 mt-0.5">{showShona ? step.shona : step.sub}</div>
              </div>
              {i < PATHWAY_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ECD Section */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-3">Early Childhood Development</p>
        <p className="text-xs text-white/50 mb-4 leading-relaxed">
          {showShona
            ? "Nzira yepamusoro yekudzidzisa bhora muZimbabwe inotanga kuECD. Vana vane makore 3–6 vanogona kudzidza kutamba bhora usati wapinda muchidzidzo chikuru."
            : "The most powerful football pathway in Zimbabwe starts at ECD. Children aged 3–6 can begin their football journey long before organised school sport begins."}
        </p>

        {/* Stage selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {ECD_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveStage(s.id); setActiveActivity(null); }}
              className="rounded-xl border p-3 text-center transition-all"
              style={{
                background: activeStage === s.id ? s.color : "rgba(255,255,255,0.05)",
                borderColor: activeStage === s.id ? s.color : "rgba(255,255,255,0.1)",
              }}
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xs font-bold text-white">{showShona ? s.shona : s.stage}</div>
              <div className="text-[10px] text-white/60 mt-0.5">{showShona ? s.ageShona : s.age}</div>
            </button>
          ))}
        </div>

        {/* Stage detail */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: showShona ? "CHINANGWA" : "GOAL",      val: showShona ? stage.goalShona      : stage.goal      },
              { label: showShona ? "ZVINODIWA" : "EQUIPMENT", val: showShona ? stage.equipmentShona : stage.equipment },
              { label: "DURATION",                             val: stage.duration                                     },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: stage.color }}>{item.label}</p>
                <p className="text-xs text-white/70 leading-relaxed">{item.val}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: stage.color }}>
              {showShona ? "MAITIRO EMITAMBO" : "ACTIVITY CARDS"}
            </p>
            {stage.activities.map((act, i) => (
              <div
                key={i}
                className="rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: activeActivity === i ? stage.color : "rgba(255,255,255,0.08)", background: activeActivity === i ? "rgba(255,255,255,0.05)" : "transparent" }}
                onClick={() => setActiveActivity(activeActivity === i ? null : i)}
              >
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: stage.color }}>ACT {i + 1}</span>
                    <span className="text-sm font-semibold text-white">{showShona ? act.shona : act.name}</span>
                  </div>
                  {activeActivity === i ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                </div>
                {activeActivity === i && (
                  <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                    <p className="text-xs text-white/70 leading-relaxed">{showShona ? act.shonaDesc : act.desc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(showShona ? act.cuesShona : act.cues).map((cue, j) => (
                        <div key={j} className="flex gap-2 items-start">
                          <span className="text-xs mt-0.5 shrink-0" style={{ color: stage.color }}>›</span>
                          <span className="text-xs text-white/60 leading-relaxed">{cue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-4">
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">
          {showShona ? "NYORESA NZVIMBO YAKO YECD" : "REGISTER YOUR ECD CENTRE"}
        </p>
        <p className="text-sm font-bold text-white mb-0.5">
          {showShona ? "Nzvimbo yako yeECD inogona kutanga nzira yebhora nhasi." : "Your ECD centre can start Zimbabwe's football pipeline today."}
        </p>
        <p className="text-xs text-white/40">
          {showShona ? "Mahara. Bhora rimwe nemakoni mana zvakakwana." : "Free to join. One ball and four cones is enough."}
        </p>
      </div>
    </div>
  );
}

// ─── Formats Tab ──────────────────────────────────────────────────────────────

function FormatsTab() {
  const [filterFormat, setFilterFormat] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState<string>("5v5");
  const [openDrill, setOpenDrill] = useState<number | null>(null);
  const [showWarmup, setShowWarmup] = useState(false);

  const fmt = TRAINING_FORMATS.find((f) => f.id === activeFormat) as TrainingFormat;

  const filteredRows = filterFormat
    ? FORMATS_TABLE.filter((r) => r.format === filterFormat)
    : FORMATS_TABLE;

  return (
    <div className="px-4 pb-8 pt-4 space-y-6">
      {/* Pitch Size Table */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Official Formats</p>
        <h2 className="text-xl font-bold text-white mb-1">Age Group Formats & Pitch Sizes</h2>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">All pitch sizes in metres. Minimum 3m run-off required. * 24×8 also permitted &nbsp; ** 21×7 also permitted</p>

        {/* Format filter */}
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(FORMAT_COLORS).map(([fmt, color]) => (
            <button
              key={fmt}
              onClick={() => setFilterFormat(filterFormat === fmt ? null : fmt)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold border transition-all"
              style={{
                background: filterFormat === fmt ? color : "transparent",
                borderColor: color,
                color: filterFormat === fmt ? "#fff" : color,
              }}
            >
              {fmt}
            </button>
          ))}
          {filterFormat && (
            <button onClick={() => setFilterFormat(null)} className="rounded-lg px-3 py-1.5 text-xs text-white/30 border border-white/10 transition-colors hover:text-white/60">
              ✕ Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Age Group", "Format", "Ball", "Rec. Pitch (m)", "Min (m)", "Max (m)", "Goal (ft)"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[9px] uppercase tracking-widest text-[#f0b429] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => {
                const color = FORMAT_COLORS[row.format];
                return (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors" style={{ borderLeft: `3px solid ${color}` }}>
                    <td className="px-3 py-2.5 text-white/80 whitespace-nowrap">{row.age}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: color }}>{row.format}</span>
                    </td>
                    <td className="px-3 py-2.5 text-white/60">{row.ball}</td>
                    <td className="px-3 py-2.5 font-bold text-white">{row.recommended}</td>
                    <td className="px-3 py-2.5 text-white/40">{row.min}</td>
                    <td className="px-3 py-2.5 text-white/40">{row.max}</td>
                    <td className="px-3 py-2.5 font-bold" style={{ color }}>{row.goal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Plans */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Session Plans by Format</p>
        <h2 className="text-xl font-bold text-white mb-1">Training Drills & Plans</h2>
        <p className="text-xs text-white/40 mb-4 leading-relaxed">Complete session plans with warm-up, drills, coaching cues, and progressions for each format.</p>

        {/* Format selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TRAINING_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveFormat(f.id); setOpenDrill(null); setShowWarmup(false); }}
              className="rounded-xl border p-3 text-center transition-all"
              style={{
                background: activeFormat === f.id ? f.color : "rgba(255,255,255,0.03)",
                borderColor: activeFormat === f.id ? f.color : "rgba(255,255,255,0.1)",
              }}
            >
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-sm font-bold text-white">{f.format}</div>
              <div className="text-[9px] text-white/50 mt-0.5">{f.ages}</div>
            </button>
          ))}
        </div>

        {/* Session overview */}
        <div
          className="rounded-2xl border p-4 mb-3"
          style={{ borderColor: fmt.color + "40", borderLeftColor: fmt.color, borderLeftWidth: 4 }}
        >
          <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-4">
            {[
              { label: "PRIORITY",       value: fmt.priority      },
              { label: "FORMATION",      value: fmt.formation     },
              { label: "SESSION LENGTH", value: fmt.sessionLength },
              { label: "FREQUENCY",      value: fmt.frequency     },
            ].map((s, i) => (
              <div key={i}>
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: fmt.color }}>{s.label}</p>
                <p className="text-xs text-white/70 leading-relaxed">{s.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60 leading-relaxed">{fmt.overview}</p>
        </div>

        {/* Warm-up */}
        <div
          className="rounded-2xl border cursor-pointer transition-all mb-2"
          style={{ borderColor: showWarmup ? fmt.color : "rgba(255,255,255,0.1)", borderLeftColor: fmt.color, borderLeftWidth: 4 }}
          onClick={() => setShowWarmup((v) => !v)}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-widest font-bold border rounded px-2 py-0.5" style={{ color: fmt.color, borderColor: fmt.color }}>WARM-UP</span>
              <span className="text-sm font-semibold text-white">{fmt.warmup.name}</span>
              <span className="text-[10px] text-white/30 hidden sm:inline">· {fmt.warmup.duration} · {fmt.warmup.players}</span>
            </div>
            {showWarmup ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
          </div>
          {showWarmup && (
            <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3">
              <p className="text-xs text-white/70 leading-relaxed">{fmt.warmup.setup}</p>
              <div>
                <p className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: fmt.color }}>COACHING CUES</p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  {fmt.warmup.cues.map((c, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span style={{ color: fmt.color }} className="shrink-0 text-sm">›</span>
                      <span className="text-xs text-white/60 leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drill cards */}
        {fmt.drills.map((drill, i) => (
          <div
            key={i}
            className="rounded-2xl border cursor-pointer transition-all mb-2"
            style={{ borderColor: openDrill === i ? fmt.color : "rgba(255,255,255,0.1)" }}
            onClick={() => setOpenDrill(openDrill === i ? null : i)}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest font-bold border rounded px-2 py-0.5" style={{ color: fmt.color, borderColor: fmt.color + "50" }}>DRILL {i + 1}</span>
                <span className="text-sm font-semibold text-white">{drill.name}</span>
                <span className="text-[10px] text-white/30 hidden sm:inline">· {drill.duration} · {drill.players}</span>
              </div>
              {openDrill === i ? <ChevronUp className="h-4 w-4 shrink-0 text-white/30" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />}
            </div>
            {openDrill === i && (
              <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3">
                {/* Objective */}
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: fmt.color }}>OBJECTIVE: </span>
                  <span className="text-xs text-white/60">{drill.objective}</span>
                </div>
                {/* Setup */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: fmt.color }}>SETUP</p>
                  <p className="text-xs text-white/70 leading-relaxed">{drill.setup}</p>
                </div>
                {/* Cues */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: fmt.color }}>COACHING CUES</p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    {drill.cues.map((c, j) => (
                      <div key={j} className="flex gap-2 items-start rounded-lg bg-white/5 px-2.5 py-2">
                        <span style={{ color: fmt.color }} className="shrink-0 text-sm mt-0.5">›</span>
                        <span className="text-xs text-white/60 leading-relaxed">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Progression */}
                <div className="rounded-xl border px-3 py-2.5 flex gap-2 items-start" style={{ borderColor: fmt.color + "40", background: fmt.color + "10" }}>
                  <span className="text-[9px] uppercase tracking-widest font-bold shrink-0 pt-0.5" style={{ color: fmt.color }}>PROGRESSION →</span>
                  <span className="text-xs text-white/70 leading-relaxed">{drill.progression}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Session total */}
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex flex-wrap gap-4 items-center mt-2">
          <span className="text-[9px] uppercase tracking-widest font-semibold shrink-0" style={{ color: fmt.color }}>SESSION TOTAL →</span>
          {[
            { label: "Warm-Up",      val: fmt.warmup.duration     },
            { label: "Drills",       val: `${fmt.drills.length} drills` },
            { label: "Game Included",val: "✓ Yes"                 },
            { label: "Total",        val: fmt.sessionLength        },
          ].map((s, i) => (
            <div key={i} className="text-center border-l border-white/10 pl-4">
              <p className="text-[8px] uppercase tracking-widest text-white/30 mb-0.5">{s.label}</p>
              <p className="text-xs font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3v3 Tab ──────────────────────────────────────────────────────────────────

function ThreeVThreeTab() {
  const [tab, setTab] = useState<"why" | "setup" | "rules" | "coaching">("why");

  return (
    <div className="px-4 pb-8 pt-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Featured Format — U7</p>
        <h2 className="text-xl font-bold text-white mb-1">3v3 — The Entry Format</h2>
        <p className="text-xs text-white/40 leading-relaxed">The recommended format for Under 7s. Fast, fun, and proven to develop better players from day one.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {(["why", "setup", "rules", "coaching"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              tab === t ? "bg-[#006400] text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t === "why" ? "Why 3v3?" : t === "setup" ? "Pitch Setup" : t === "rules" ? "Rules" : "Coaching Tips"}
          </button>
        ))}
      </div>

      {/* Why 3v3 */}
      {tab === "why" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4" style={{ borderLeft: "4px solid #006400" }}>
            <p className="text-sm text-white/80 leading-relaxed">
              3v3 gives young players the best introduction to football — more chances to learn, play, make decisions, score and stop goals. Research shows it encourages more physical activity and increases technical actions, meaning more touches on the ball and more play on the pitch.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { n: "MORE TOUCHES", sub: "per player vs 5v5" },
              { n: "MORE ACTION",  sub: "physical activity per min" },
              { n: "MORE FUN",     sub: "every child plays always" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center" style={{ borderTop: "3px solid #006400" }}>
                <p className="text-xs font-bold text-[#006400] mb-1">{s.n}</p>
                <p className="text-[10px] text-white/40 leading-snug">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pitch Setup */}
      {tab === "setup" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: "📐", title: "Pitch Size",      body: "10×15m min, up to 15×20m. Create up to 4 pitches inside a 5v5 pitch. Use cones — no permanent markings needed." },
            { icon: "⚽", title: "Ball & Goals",    body: "Size 3 ball. Mini goals: 4×2.5ft. Four cones marking two small goals is enough to get started." },
            { icon: "👥", title: "Teams & Adults",  body: "Squads of 6–12. 2 adults as Pitch Facilitators. No referee — children make their own decisions." },
            { icon: "⏱️", title: "Duration",        body: "6–10 min per game. Carousel rotation gives every player 30–40 minutes total playing time." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4" style={{ borderLeft: "4px solid #006400" }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#006400] mb-1.5">{s.title}</p>
              <p className="text-xs text-white/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rules */}
      {tab === "rules" && (
        <div className="space-y-2">
          {THREE_V_THREE_RULES.map((r, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-[9px] uppercase tracking-widest font-bold text-[#006400] min-w-[90px] shrink-0 pt-0.5">{r.rule}</span>
              <span className="text-xs text-white/70 leading-relaxed">{r.detail}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coaching Tips */}
      {tab === "coaching" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4" style={{ borderLeft: "4px solid #006400" }}>
          <p className="text-[9px] uppercase tracking-widest font-bold text-[#006400] mb-3">Coaching Principles for U7 3v3</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {THREE_V_THREE_COACHING_TIPS.map((tip, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-[#006400] text-base shrink-0">›</span>
                <span className="text-xs text-white/70 leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FutureFitPage() {
  const [activeTab, setActiveTab]           = useState<Tab>("sessions");
  const [query, setQuery]                   = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<CoachingSession | null>(null);
  const [chatHistory, setChatHistory]       = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]           = useState("");
  const [chatLoading, setChatLoading]       = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Filter sessions ──────────────────────────────────────────────────────────
  const filteredSessions = (() => {
    let sessions = JUNIOR_SESSIONS;
    if (activeCategory !== "all") sessions = sessions.filter((s) => s.category === activeCategory);
    if (query.trim()) {
      const results = findRelevantSessions(query, 10);
      const ids = new Set(results.map((r) => r.id));
      sessions = sessions.filter((s) => ids.has(s.id));
    }
    return sessions;
  })();

  // ── Send chat message ────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", text };
    const next = [...chatHistory, userMsg];
    setChatHistory(next);
    setChatInput("");
    setChatLoading(true);

    const relevant = findRelevantSessions(text, 3);
    const context = relevant.length > 0
      ? `\n\nKNOWLEDGE BASE CONTEXT (from FIFA/FCRF/FA junior coaching materials):\n` +
        relevant.map((s) => `--- ${s.title} (${s.source}) ---\n${s.content.slice(0, 600)}`).join("\n\n")
      : "";

    const systemPrompt =
      `You are THUTO, the AI coach assistant for GrassRoots Sports in Zimbabwe. ` +
      `You specialise in junior football coaching (youth and grassroots levels). ` +
      `Provide practical, field-ready advice suitable for coaches with no access to professional facilities. ` +
      `Keep answers concise (3-5 sentences max unless asked for detail). ` +
      `Use simple language — your coaches may be new to formal coaching. ` +
      `Always mention player safety first when relevant.` +
      context;

    const history = next.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.text,
    }));

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          system_prompt: systemPrompt,
          history: history.slice(0, -1),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.response ?? data.reply ?? "No response from THUTO.";
        setChatHistory([...next, { role: "assistant", text: reply }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        return;
      }
    } catch { /* fall through */ }

    setChatHistory([...next, { role: "assistant", text: "THUTO is currently offline. Check your connection and try again." }]);
    setChatLoading(false);
  }, [chatInput, chatLoading, chatHistory]);

  const categories = [
    { key: "all",          label: "All",     icon: BookOpen      },
    { key: "attacking",    label: "Attack",  icon: Zap           },
    { key: "defending",    label: "Defence", icon: Shield        },
    { key: "pressing",     label: "Pressing",icon: Target        },
    { key: "fundamentals", label: "Skills",  icon: Star          },
    { key: "safety",       label: "Safety",  icon: AlertTriangle },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "sessions", label: "Sessions", icon: BookOpen },
    { key: "pathway",  label: "Pathway",  icon: Map     },
    { key: "formats",  label: "Formats",  icon: Flag    },
    { key: "3v3",      label: "3v3",      icon: Users   },
    { key: "chat",     label: "Ask THUTO",icon: Brain   },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="gs-watermark flex-1 overflow-auto">
        {/* ── Sticky header ───────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0b1f12]/95 backdrop-blur-md px-5 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Link href="/coach" className="rounded-lg p-1.5 text-white/40 hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f0b429]">FutureFit</span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Junior Development</span>
              </div>
              <h1 className="text-lg font-bold text-white leading-tight">Junior Football Hub</h1>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === key
                    ? "bg-[#f0b429] text-[#1a3a1a]"
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Search — only on sessions tab */}
          {activeTab === "sessions" && (
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sessions — e.g. 'pressing', 'U14 passing'…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 focus:ring-1 focus:ring-[#f0b429]/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* ── Tab content ─────────────────────────────────────────────────── */}

        {/* Sessions tab */}
        {activeTab === "sessions" && (
          <div className="px-4 pb-8">
            <div className="my-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeCategory === key
                      ? "bg-[#f0b429] text-[#1a3a1a]"
                      : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-[#f0b429]" />
                <span className="text-xs font-semibold text-[#f0b429]">
                  {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""} for junior players
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-white/30" />
                <span className="text-[10px] text-white/30">FIFA · FCRF · FA</span>
              </div>
            </div>

            {(activeCategory === "all" || activeCategory === "safety") && (
              <button
                onClick={() => { const s = JUNIOR_SESSIONS.find((s) => s.category === "safety"); if (s) setSelectedSession(s); }}
                className="mb-3 w-full rounded-2xl border border-red-500/30 bg-red-950/30 p-4 text-left hover:border-red-500/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-300">Concussion Guidelines — Required Reading</p>
                    <p className="mt-0.5 text-xs text-red-400/70">FA safety protocol · All junior coaches must know these signs and steps</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-red-400/40 mt-0.5 shrink-0" />
                </div>
              </button>
            )}

            <div className="space-y-3">
              {filteredSessions.filter((s) => s.category !== "safety").map((session) => (
                <SessionCard key={session.id} session={session} onClick={() => setSelectedSession(session)} />
              ))}
              {filteredSessions.filter((s) => s.category !== "safety").length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-12 text-center">
                  <Search className="h-8 w-8 text-white/20 mb-3" />
                  <p className="text-sm font-semibold text-white/60">No sessions found</p>
                  <p className="mt-1 text-xs text-white/30">Try a different search or ask THUTO</p>
                  <button onClick={() => { setQuery(""); setActiveCategory("all"); }} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/15 transition-colors">Clear filters</button>
                </div>
              )}
            </div>

            <button onClick={() => setActiveTab("chat")} className="mt-6 w-full rounded-2xl border border-[#f0b429]/20 bg-gradient-to-br from-[#f0b429]/10 to-[#f0b429]/5 p-4 text-center hover:border-[#f0b429]/40 transition-colors">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-[#f0b429]" />
                <span className="text-sm font-semibold text-[#f0b429]">Ask THUTO anything about junior coaching</span>
              </div>
              <p className="mt-1 text-xs text-white/30">Searches FIFA, FCRF & FA knowledge base · Works offline</p>
            </button>
          </div>
        )}

        {/* Pathway tab */}
        {activeTab === "pathway" && <PathwayTab />}

        {/* Formats tab */}
        {activeTab === "formats" && <FormatsTab />}

        {/* 3v3 tab */}
        {activeTab === "3v3" && <ThreeVThreeTab />}

        {/* Chat tab */}
        {activeTab === "chat" && (
          <div className="flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0b429]/20">
                <Sparkles className="h-4 w-4 text-[#f0b429]" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">THUTO — Junior Coach AI</p>
                <p className="text-xs text-white/40">Searches FIFA, FCRF & FA knowledge base first</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {chatHistory.length === 0 && (
                <div className="space-y-3 pt-4">
                  <p className="text-center text-xs text-white/30 uppercase tracking-wider">Suggested questions</p>
                  {[
                    "How do I coach pressing for U14 boys?",
                    "What are the best fundamentals drills for 10-12 year olds?",
                    "How do I spot concussion symptoms during training?",
                    "Give me a 45-minute session plan for youth attacking",
                  ].map((q) => (
                    <button key={q} onClick={() => setChatInput(q)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-white/70 hover:border-[#f0b429]/30 hover:text-white transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 mt-0.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#f0b429]" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-[#f0b429] text-[#1a3a1a] font-medium" : "bg-white/10 text-white"}`}>
                    {msg.text.split("\n").map((line, j) => (
                      <span key={j}>{line}{j < msg.text.split("\n").length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f0b429]/20">
                    <Sparkles className="h-3.5 w-3.5 text-[#f0b429]" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-white/10 px-4 py-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
                    <span className="text-xs text-white/50">Searching knowledge base…</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Ask about junior coaching…"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all"
                  disabled={chatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b429] text-[#1a3a1a] disabled:opacity-40 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedSession && (
        <SessionDetail session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
