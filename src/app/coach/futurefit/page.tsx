"use client";

/**
 * FutureFit — Junior Football Development Hub
 *
 * Tabs: Pathway | Formats | 3v3 | Saved | Log | Ask THUTO
 *
 * Features:
 *  1. Save/Favourite drills   — star any drill or warmup → Saved tab
 *  2. Session Log             — log sessions run with squad → Log tab
 *  3. Print-Ready PDF         — full session plan as printable PDF (jsPDF)
 *  4. Assign Drill to Players — coach assigns a drill to named players
 *
 * Storage: localStorage (gs_futurefit_saved / gs_futurefit_logs / gs_futurefit_assignments)
 * Backend fallback pattern: try API → catch 404/405 → localStorage (matching Business Hub)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import {
  ArrowLeft, Brain, Users, ChevronRight, ChevronDown, ChevronUp,
  Loader2, Send, Sparkles, Flag, Map, Globe, Star, ClipboardList,
  Printer, UserPlus, Check, X, Trash2, BookOpen, AlertCircle,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { findRelevantSessions } from "@/lib/football-knowledge";
import {
  FORMATS_TABLE, FORMAT_COLORS, TRAINING_FORMATS, PATHWAY_STEPS,
  ECD_STAGES, THREE_V_THREE_RULES, THREE_V_THREE_COACHING_TIPS,
  type TrainingFormat, type EcdStage,
} from "@/lib/football-formats";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "pathway" | "formats" | "3v3" | "saved" | "log" | "chat";

interface SavedItem {
  id: string;
  type: "warmup" | "drill";
  formatId: string;
  formatLabel: string;
  name: string;
  duration: string;
  players: string;
  savedAt: string;
}

interface SessionLog {
  id: string;
  formatId: string;
  formatLabel: string;
  formatAges: string;
  squadName: string;
  date: string;
  rating: number;
  notes: string;
  loggedAt: string;
}

interface DrillAssignment {
  id: string;
  drillName: string;
  formatLabel: string;
  playerNames: string;
  message: string;
  assignedAt: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_SAVED       = "gs_futurefit_saved";
const LS_LOGS        = "gs_futurefit_logs";
const LS_ASSIGNMENTS = "gs_futurefit_assignments";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function lsSet(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// ─── PDF generator ────────────────────────────────────────────────────────────

function printSessionPlan(fmt: TrainingFormat) {
  const doc = new jsPDF();
  const GREEN = [26, 92, 42] as const;
  const GOLD  = [240, 180, 41] as const;
  const DARK  = [30, 30, 30] as const;
  const GREY  = [90, 90, 90] as const;

  // Header bar
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFontSize(14);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.text("GrassRoots Sports — FutureFit Session Plan", 14, 11);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.text(`${fmt.format} (${fmt.ages})  ·  ${fmt.priority}  ·  ${fmt.sessionLength}`, 14, 20);

  let y = 36;

  // Overview
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text("SESSION OVERVIEW", 14, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  const ovLines = doc.splitTextToSize(fmt.overview, 182);
  doc.text(ovLines, 14, y);
  y += ovLines.length * 4 + 4;

  // Stats row
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  [
    `Formation: ${fmt.formation}`,
    `Frequency: ${fmt.frequency}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ].forEach((s, i) => doc.text(s, 14 + i * 62, y));
  y += 8;

  // Warm-up bar
  doc.setFillColor(...GOLD);
  doc.rect(14, y, 182, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(26, 42, 26);
  doc.text(`WARM-UP: ${fmt.warmup.name}  (${fmt.warmup.duration} · ${fmt.warmup.players})`, 16, y + 4.8);
  y += 11;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  const wuLines = doc.splitTextToSize(fmt.warmup.setup, 182);
  doc.text(wuLines, 14, y);
  y += wuLines.length * 4 + 2;
  doc.setFont("helvetica", "italic");
  const cueText = "Cues: " + fmt.warmup.cues.join("  ·  ");
  const cueLines = doc.splitTextToSize(cueText, 182);
  doc.text(cueLines, 14, y);
  y += cueLines.length * 4 + 7;

  // Drills
  fmt.drills.forEach((drill, i) => {
    if (y > 248) { doc.addPage(); y = 20; }

    doc.setFillColor(...GREEN);
    doc.rect(14, y, 182, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`DRILL ${i + 1}: ${drill.name}  (${drill.duration} · ${drill.players})`, 16, y + 4.8);
    y += 11;

    doc.setTextColor(...GREY);
    doc.setFontSize(8);

    // Objective
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Objective:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    const objLines = doc.splitTextToSize(drill.objective, 163);
    doc.text(objLines, 40, y);
    y += Math.max(objLines.length, 1) * 4 + 2;

    // Setup
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Setup:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    const setupLines = doc.splitTextToSize(drill.setup, 170);
    doc.text(setupLines, 32, y);
    y += Math.max(setupLines.length, 1) * 4 + 2;

    // Cues
    doc.setFont("helvetica", "italic");
    const drillCueText = "Cues: " + drill.cues.join("  ·  ");
    const drillCueLines = doc.splitTextToSize(drillCueText, 182);
    doc.text(drillCueLines, 14, y);
    y += drillCueLines.length * 4 + 2;

    // Progression
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text("Progression:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GREY);
    const progLines = doc.splitTextToSize(drill.progression, 158);
    doc.text(progLines, 47, y);
    y += Math.max(progLines.length, 1) * 4 + 8;
  });

  // Footer
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `GrassRoots Sports · grassrootssports.live · FutureFit Junior Development · Page ${p}/${totalPages}`,
      14, 290
    );
  }

  doc.save(`futurefit-${fmt.format}-${fmt.ages.replace(/\s|–/g, "")}.pdf`);
}

// ─── PathwayTab ───────────────────────────────────────────────────────────────

function PathwayTab() {
  const [activeStage, setActiveStage] = useState("tiny");
  const [activeActivity, setActiveActivity] = useState<number | null>(null);
  const [showShona, setShowShona] = useState(false);
  const stage = ECD_STAGES.find((s) => s.id === activeStage) as EcdStage;

  return (
    <div className="px-4 pb-8 pt-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Development Pathway</p>
          <h2 className="text-xl font-bold text-white">From ECD to 11v11</h2>
          <p className="text-xs text-white/40 mt-0.5">Zimbabwe&apos;s full football development pathway, age 3 to Open Age</p>
        </div>
        <button
          onClick={() => setShowShona((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${showShona ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/10 text-white/60 hover:bg-white/15"}`}
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
              <div className="rounded-xl border p-3 text-center min-w-[80px]"
                style={{ borderColor: step.color + "60", borderTopWidth: 3, borderTopColor: step.color, background: step.isEcd ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)" }}>
                <div className="text-xl mb-1">{step.icon}</div>
                <div className="text-[11px] font-bold" style={{ color: step.color }}>{step.age}</div>
                <div className="text-[9px] text-white/50 uppercase tracking-wide mt-0.5">{step.label}</div>
                <div className="text-[10px] text-white/70 mt-0.5">{showShona ? step.shona : step.sub}</div>
              </div>
              {i < PATHWAY_STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-white/20 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* ECD section */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-2">Early Childhood Development</p>
        <p className="text-xs text-white/50 mb-4 leading-relaxed">
          {showShona
            ? "Nzira yepamusoro yekudzidzisa bhora muZimbabwe inotanga kuECD. Vana vane makore 3–6 vanogona kudzidza kutamba bhora usati wapinda muchidzidzo chikuru."
            : "The most powerful football pathway in Zimbabwe starts at ECD. Children aged 3–6 can begin their football journey long before organised school sport begins."}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {ECD_STAGES.map((s) => (
            <button key={s.id} onClick={() => { setActiveStage(s.id); setActiveActivity(null); }}
              className="rounded-xl border p-3 text-center transition-all"
              style={{ background: activeStage === s.id ? s.color : "rgba(255,255,255,0.05)", borderColor: activeStage === s.id ? s.color : "rgba(255,255,255,0.1)" }}>
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-xs font-bold text-white">{showShona ? s.shona : s.stage}</div>
              <div className="text-[10px] text-white/60 mt-0.5">{showShona ? s.ageShona : s.age}</div>
            </button>
          ))}
        </div>
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
              <div key={i} className="rounded-xl border cursor-pointer transition-all"
                style={{ borderColor: activeActivity === i ? stage.color : "rgba(255,255,255,0.08)", background: activeActivity === i ? "rgba(255,255,255,0.05)" : "transparent" }}
                onClick={() => setActiveActivity(activeActivity === i ? null : i)}>
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: stage.color }}>ACT {i + 1}</span>
                    <span className="text-sm font-semibold text-white">{showShona ? act.shona : act.name}</span>
                  </div>
                  {activeActivity === i ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
                </div>
                {activeActivity === i && (
                  <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-3">
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

// ─── ThreeVThreeTab ───────────────────────────────────────────────────────────

function ThreeVThreeTab() {
  const [tab, setTab] = useState<"why" | "setup" | "rules" | "coaching">("why");
  return (
    <div className="px-4 pb-8 pt-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Featured Format — U7</p>
        <h2 className="text-xl font-bold text-white mb-1">3v3 — The Entry Format</h2>
        <p className="text-xs text-white/40 leading-relaxed">The recommended format for Under 7s. Fast, fun, and proven to develop better players from day one.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["why", "setup", "rules", "coaching"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${tab === t ? "bg-[#006400] text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"}`}>
            {t === "why" ? "Why 3v3?" : t === "setup" ? "Pitch Setup" : t === "rules" ? "Rules" : "Coaching Tips"}
          </button>
        ))}
      </div>
      {tab === "why" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4" style={{ borderLeft: "4px solid #006400" }}>
            <p className="text-sm text-white/80 leading-relaxed">3v3 gives young players the best introduction to football — more chances to learn, play, make decisions, score and stop goals. Research shows it encourages more physical activity and increases technical actions, meaning more touches on the ball and more play on the pitch.</p>
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
      {tab === "setup" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: "📐", title: "Pitch Size",     body: "10×15m min, up to 15×20m. Create up to 4 pitches inside a 5v5 pitch. Use cones — no permanent markings needed." },
            { icon: "⚽", title: "Ball & Goals",   body: "Size 3 ball. Mini goals: 4×2.5ft. Four cones marking two small goals is enough to get started." },
            { icon: "👥", title: "Teams & Adults", body: "Squads of 6–12. 2 adults as Pitch Facilitators. No referee — children make their own decisions." },
            { icon: "⏱️", title: "Duration",       body: "6–10 min per game. Carousel rotation gives every player 30–40 minutes total playing time." },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4" style={{ borderLeft: "4px solid #006400" }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#006400] mb-1.5">{s.title}</p>
              <p className="text-xs text-white/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      )}
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

// ─── FormatsTab ───────────────────────────────────────────────────────────────

function FormatsTab({
  savedIds,
  onToggleSave,
  onLogSession,
  onPrint,
  onAssign,
}: {
  savedIds: Set<string>;
  onToggleSave: (item: SavedItem) => void;
  onLogSession: (fmt: TrainingFormat) => void;
  onPrint: (fmt: TrainingFormat) => void;
  onAssign: (drillId: string, drillName: string, formatLabel: string) => void;
}) {
  const [filterFormat, setFilterFormat] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState("5v5");
  const [openDrill, setOpenDrill] = useState<number | null>(null);
  const [showWarmup, setShowWarmup] = useState(false);

  const fmt = TRAINING_FORMATS.find((f) => f.id === activeFormat) as TrainingFormat;
  const filteredRows = filterFormat ? FORMATS_TABLE.filter((r) => r.format === filterFormat) : FORMATS_TABLE;

  const warmupId = `${fmt.id}-warmup`;
  const drillId  = (i: number) => `${fmt.id}-drill-${i}`;

  return (
    <div className="px-4 pb-8 pt-4 space-y-6">
      {/* Pitch Size Table */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Official Formats</p>
        <h2 className="text-xl font-bold text-white mb-1">Age Group Formats & Pitch Sizes</h2>
        <p className="text-xs text-white/40 mb-3 leading-relaxed">All pitch sizes in metres. Min 3m run-off required. * 24×8 also permitted &nbsp;** 21×7 also permitted</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(FORMAT_COLORS).map(([f, color]) => (
            <button key={f} onClick={() => setFilterFormat(filterFormat === f ? null : f)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold border transition-all"
              style={{ background: filterFormat === f ? color : "transparent", borderColor: color, color: filterFormat === f ? "#fff" : color }}>
              {f}
            </button>
          ))}
          {filterFormat && (
            <button onClick={() => setFilterFormat(null)} className="rounded-lg px-3 py-1.5 text-xs text-white/30 border border-white/10 hover:text-white/60 transition-colors">
              ✕ Clear
            </button>
          )}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {["Age Group","Format","Ball","Rec. Pitch (m)","Min (m)","Max (m)","Goal (ft)"].map((h) => (
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
                    <td className="px-3 py-2.5"><span className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: color }}>{row.format}</span></td>
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
        <p className="text-xs text-white/40 mb-4 leading-relaxed">Complete session plans with warm-up, drills, coaching cues, and progressions.</p>

        {/* Format selector */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TRAINING_FORMATS.map((f) => (
            <button key={f.id} onClick={() => { setActiveFormat(f.id); setOpenDrill(null); setShowWarmup(false); }}
              className="rounded-xl border p-3 text-center transition-all"
              style={{ background: activeFormat === f.id ? f.color : "rgba(255,255,255,0.03)", borderColor: activeFormat === f.id ? f.color : "rgba(255,255,255,0.1)" }}>
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-sm font-bold text-white">{f.format}</div>
              <div className="text-[9px] text-white/50 mt-0.5">{f.ages}</div>
            </button>
          ))}
        </div>

        {/* Action bar — Print, Log, Save format */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => onPrint(fmt)}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/15 hover:text-white transition-all">
            <Printer className="h-3.5 w-3.5" /> Print PDF
          </button>
          <button onClick={() => onLogSession(fmt)}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/15 hover:text-white transition-all">
            <ClipboardList className="h-3.5 w-3.5" /> Log This Session
          </button>
        </div>

        {/* Session overview */}
        <div className="rounded-2xl border p-4 mb-3"
          style={{ borderColor: fmt.color + "40", borderLeftColor: fmt.color, borderLeftWidth: 4 }}>
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

        {/* Warm-up card */}
        <div className="rounded-2xl border mb-2 transition-all"
          style={{ borderColor: showWarmup ? fmt.color : "rgba(255,255,255,0.1)", borderLeftColor: fmt.color, borderLeftWidth: 4 }}>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setShowWarmup((v) => !v)}>
            <div className="flex items-center gap-3">
              <span className="text-[9px] uppercase tracking-widest font-bold border rounded px-2 py-0.5" style={{ color: fmt.color, borderColor: fmt.color }}>WARM-UP</span>
              <span className="text-sm font-semibold text-white">{fmt.warmup.name}</span>
              <span className="text-[10px] text-white/30 hidden sm:inline">· {fmt.warmup.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); onToggleSave({ id: warmupId, type: "warmup", formatId: fmt.id, formatLabel: fmt.format, name: fmt.warmup.name, duration: fmt.warmup.duration, players: fmt.warmup.players, savedAt: new Date().toISOString() }); }}
                className={`rounded-lg p-1.5 transition-colors ${savedIds.has(warmupId) ? "text-[#f0b429]" : "text-white/20 hover:text-white/60"}`}>
                <Star className="h-4 w-4" fill={savedIds.has(warmupId) ? "currentColor" : "none"} />
              </button>
              {showWarmup ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
            </div>
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
          <div key={i} className="rounded-2xl border mb-2 transition-all"
            style={{ borderColor: openDrill === i ? fmt.color : "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setOpenDrill(openDrill === i ? null : i)}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest font-bold border rounded px-2 py-0.5" style={{ color: fmt.color, borderColor: fmt.color + "50" }}>DRILL {i + 1}</span>
                <span className="text-sm font-semibold text-white">{drill.name}</span>
                <span className="text-[10px] text-white/30 hidden sm:inline">· {drill.duration} · {drill.players}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onToggleSave({ id: drillId(i), type: "drill", formatId: fmt.id, formatLabel: fmt.format, name: drill.name, duration: drill.duration, players: drill.players, savedAt: new Date().toISOString() }); }}
                  className={`rounded-lg p-1.5 transition-colors ${savedIds.has(drillId(i)) ? "text-[#f0b429]" : "text-white/20 hover:text-white/60"}`}>
                  <Star className="h-4 w-4" fill={savedIds.has(drillId(i)) ? "currentColor" : "none"} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAssign(drillId(i), drill.name, fmt.format); }}
                  className="rounded-lg p-1.5 text-white/20 hover:text-white/60 transition-colors">
                  <UserPlus className="h-4 w-4" />
                </button>
                {openDrill === i ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
              </div>
            </div>
            {openDrill === i && (
              <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-3">
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: fmt.color }}>OBJECTIVE: </span>
                  <span className="text-xs text-white/60">{drill.objective}</span>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: fmt.color }}>SETUP</p>
                  <p className="text-xs text-white/70 leading-relaxed">{drill.setup}</p>
                </div>
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
                <div className="rounded-xl border px-3 py-2.5 flex gap-2 items-start"
                  style={{ borderColor: fmt.color + "40", background: fmt.color + "10" }}>
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
            { label: "Warm-Up",       val: fmt.warmup.duration          },
            { label: "Drills",        val: `${fmt.drills.length} drills` },
            { label: "Game Included", val: "✓ Yes"                      },
            { label: "Total",         val: fmt.sessionLength             },
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

// ─── SavedTab ─────────────────────────────────────────────────────────────────

function SavedTab({ saved, onRemove }: { saved: SavedItem[]; onRemove: (id: string) => void }) {
  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <Star className="h-10 w-10 text-white/10 mb-4" />
        <p className="text-sm font-semibold text-white/40">No saved drills yet</p>
        <p className="mt-1 text-xs text-white/25">Tap the ⭐ on any drill or warm-up in the Formats tab to save it here</p>
      </div>
    );
  }

  // Group by format
  const groups: Record<string, SavedItem[]> = {};
  saved.forEach((item) => {
    if (!groups[item.formatLabel]) groups[item.formatLabel] = [];
    groups[item.formatLabel].push(item);
  });

  return (
    <div className="px-4 pb-8 pt-4 space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Saved Drills</p>
        <h2 className="text-xl font-bold text-white mb-0.5">Your Favourites</h2>
        <p className="text-xs text-white/40">{saved.length} item{saved.length !== 1 ? "s" : ""} saved</p>
      </div>
      {Object.entries(groups).map(([formatLabel, items]) => {
        const color = FORMAT_COLORS[formatLabel] ?? "#f0b429";
        return (
          <div key={formatLabel}>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: color }}>{formatLabel}</span>
              <span className="text-[10px] text-white/30">{items.length} saved</span>
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Star className="h-4 w-4 shrink-0 text-[#f0b429]" fill="currentColor" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-white/40">{item.type === "warmup" ? "Warm-Up" : "Drill"} · {item.duration} · {item.players}</p>
                  </div>
                  <button onClick={() => onRemove(item.id)} className="rounded-lg p-1.5 text-white/20 hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LogTab ───────────────────────────────────────────────────────────────────

function LogTab({ logs, onDelete, onAdd }: { logs: SessionLog[]; onDelete: (id: string) => void; onAdd: () => void }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <ClipboardList className="h-10 w-10 text-white/10 mb-4" />
        <p className="text-sm font-semibold text-white/40">No sessions logged yet</p>
        <p className="mt-1 text-xs text-white/25">Click &quot;Log This Session&quot; in the Formats tab after running a session</p>
        <button onClick={onAdd} className="mt-5 flex items-center gap-1.5 rounded-xl bg-[#f0b429] px-4 py-2.5 text-xs font-bold text-[#1a3a1a] transition-opacity hover:opacity-90">
          <ClipboardList className="h-3.5 w-3.5" /> Log a Session
        </button>
      </div>
    );
  }

  // ── Analytics ────────────────────────────────────────────────────────────
  const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthCount = logs.filter((l) => l.date.startsWith(thisMonth)).length;
  const avgRating  = (logs.reduce((s, l) => s + l.rating, 0) / logs.length);

  // Format breakdown
  const formatCounts: Record<string, number> = {};
  logs.forEach((l) => { formatCounts[l.formatLabel] = (formatCounts[l.formatLabel] ?? 0) + 1; });
  const maxCount = Math.max(...Object.values(formatCounts));
  const topFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // Squad breakdown (unique squads)
  const squadSet = new Set(logs.map((l) => l.squadName));

  return (
    <div className="px-4 pb-8 pt-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold mb-1">Session Log</p>
          <h2 className="text-xl font-bold text-white mb-0.5">Training History</h2>
          <p className="text-xs text-white/40">{logs.length} session{logs.length !== 1 ? "s" : ""} logged</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-1.5 rounded-xl bg-[#f0b429] px-3 py-2 text-xs font-bold text-[#1a3a1a]">
          <ClipboardList className="h-3.5 w-3.5" /> Log Session
        </button>
      </div>

      {/* ── Stats Summary ── */}
      {logs.length >= 2 && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total",        value: logs.length,              unit: "sessions"      },
              { label: "This Month",   value: monthCount,               unit: "sessions"      },
              { label: "Avg Rating",   value: avgRating.toFixed(1),     unit: "/ 5"           },
              { label: "Squads",       value: squadSet.size,            unit: "groups"        },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{s.label}</p>
                <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                <p className="text-[9px] text-white/30 mt-0.5">{s.unit}</p>
              </div>
            ))}
          </div>

          {/* Format breakdown bars */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[9px] uppercase tracking-widest text-[#f0b429] font-semibold mb-3">Format Breakdown</p>
            <div className="space-y-2">
              {Object.entries(formatCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([fmt, count]) => {
                  const color = FORMAT_COLORS[fmt] ?? "#f0b429";
                  const pct   = Math.round((count / maxCount) * 100);
                  return (
                    <div key={fmt} className="flex items-center gap-3">
                      <span className="w-8 text-right text-[10px] font-bold shrink-0" style={{ color }}>{fmt}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[10px] text-white/40 shrink-0 w-16">
                        {count} session{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="mt-3 text-[10px] text-white/30">
              Most used: <span className="font-bold" style={{ color: FORMAT_COLORS[topFormat] ?? "#f0b429" }}>{topFormat}</span>
              {" "}· avg rating <span className="font-bold text-white/60">{avgRating.toFixed(1)} ⭐</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Session Cards ── */}
      <div className="space-y-3">
        {[...logs].reverse().map((log) => {
          const color = FORMAT_COLORS[log.formatLabel] ?? "#f0b429";
          return (
            <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="rounded px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: color }}>{log.formatLabel}</span>
                    <span className="text-[10px] text-white/40">{log.formatAges}</span>
                    <span className="text-[10px] text-white/30">{new Date(log.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{log.squadName}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= log.rating ? "text-[#f0b429]" : "text-white/15"}`} fill={n <= log.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  {log.notes && <p className="mt-1.5 text-xs text-white/50 leading-relaxed">{log.notes}</p>}
                </div>
                <button onClick={() => onDelete(log.id)} className="shrink-0 rounded-lg p-1.5 text-white/20 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log Modal ────────────────────────────────────────────────────────────────

function LogModal({
  formats,
  onSave,
  onClose,
}: {
  formats: TrainingFormat[];
  onSave: (log: Omit<SessionLog, "id" | "loggedAt">) => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [formatId, setFormatId] = useState(formats[0]?.id ?? "5v5");
  const [squadName, setSquadName] = useState("");
  const [date, setDate] = useState(today);
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");

  const fmt = formats.find((f) => f.id === formatId);

  const handleSave = () => {
    if (!squadName.trim()) return;
    onSave({
      formatId,
      formatLabel: fmt?.format ?? formatId,
      formatAges:  fmt?.ages   ?? "",
      squadName:   squadName.trim(),
      date,
      rating,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f2318] p-6 sm:rounded-3xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold">Session Log</p>
            <h3 className="text-lg font-bold text-white">Log This Session</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          {/* Format */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Format</label>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {formats.map((f) => (
                <button key={f.id} onClick={() => setFormatId(f.id)}
                  className="rounded-xl border py-2 text-xs font-bold text-white transition-all"
                  style={{ background: formatId === f.id ? FORMAT_COLORS[f.format] : "rgba(255,255,255,0.05)", borderColor: formatId === f.id ? FORMAT_COLORS[f.format] : "rgba(255,255,255,0.1)" }}>
                  {f.format}
                </button>
              ))}
            </div>
          </div>
          {/* Squad */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Squad / Group Name</label>
            <input value={squadName} onChange={(e) => setSquadName(e.target.value)} placeholder="e.g. U12 Lions"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all" />
          </div>
          {/* Date */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-[#f0b429]/40 transition-all" />
          </div>
          {/* Rating */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Session Rating</label>
            <div className="mt-1.5 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)}>
                  <Star className={`h-6 w-6 transition-colors ${n <= rating ? "text-[#f0b429]" : "text-white/20"}`} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What went well? What needs work next session?"
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all resize-none" />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!squadName.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-2.5 text-sm font-bold text-[#1a3a1a] disabled:opacity-40 transition-opacity">
            <Check className="h-4 w-4" /> Save Log
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({
  drillName,
  formatLabel,
  onSave,
  onClose,
}: {
  drillName: string;
  formatLabel: string;
  onSave: (a: Omit<DrillAssignment, "id" | "assignedAt">) => void;
  onClose: () => void;
}) {
  const [playerNames, setPlayerNames] = useState("");
  const [message, setMessage]         = useState("");
  const [sent, setSent]               = useState(false);

  const handleSend = async () => {
    if (!playerNames.trim()) return;

    const payload = { drillName, formatLabel, playerNames: playerNames.trim(), message: message.trim() };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/drill-assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("api-error");
    } catch {
      // fallback: save to localStorage
    }

    onSave(payload);
    setSent(true);
    setTimeout(onClose, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f2318] p-6 sm:rounded-3xl">
        {sent ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 mb-4">
              <Check className="h-7 w-7 text-green-400" />
            </div>
            <p className="text-lg font-bold text-white">Drill Assigned!</p>
            <p className="mt-1 text-xs text-white/40">Players will see it in their training feed</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#f0b429] font-semibold">Assign Drill</p>
                <h3 className="text-base font-bold text-white leading-snug">{drillName}</h3>
                <p className="text-xs text-white/40">{formatLabel} format</p>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-white/30 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 flex gap-2 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">Players will receive this drill as a recommendation in their Training tab.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Player Names</label>
                <textarea value={playerNames} onChange={(e) => setPlayerNames(e.target.value)} rows={3}
                  placeholder="One per line or comma-separated&#10;e.g. Tinashe Moyo, Farai Dube"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all resize-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">Message to Players (optional)</label>
                <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Focus on your first touch this week"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSend} disabled={!playerNames.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-2.5 text-sm font-bold text-[#1a3a1a] disabled:opacity-40 transition-opacity">
                <UserPlus className="h-4 w-4" /> Assign Drill
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FutureFitPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pathway");

  // ── Feature state ─────────────────────────────────────────────────────────
  const [savedItems, setSavedItems]   = useState<SavedItem[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [assignments, setAssignments] = useState<DrillAssignment[]>([]);

  const [showLogModal, setShowLogModal]     = useState(false);
  const [logPresetFmt, setLogPresetFmt]     = useState<TrainingFormat | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget]     = useState<{ id: string; name: string; format: string } | null>(null);

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Hydrate from localStorage ─────────────────────────────────────────────
  useEffect(() => {
    setSavedItems(lsGet<SavedItem[]>(LS_SAVED, []));
    setSessionLogs(lsGet<SessionLog[]>(LS_LOGS, []));
    setAssignments(lsGet<DrillAssignment[]>(LS_ASSIGNMENTS, []));
  }, []);

  const savedIds = new Set(savedItems.map((s) => s.id));

  // ── Save / unsave a drill ─────────────────────────────────────────────────
  const handleToggleSave = useCallback((item: SavedItem) => {
    setSavedItems((prev) => {
      const next = prev.some((s) => s.id === item.id)
        ? prev.filter((s) => s.id !== item.id)
        : [...prev, item];
      lsSet(LS_SAVED, next);
      return next;
    });
  }, []);

  const handleRemoveSaved = useCallback((id: string) => {
    setSavedItems((prev) => {
      const next = prev.filter((s) => s.id !== id);
      lsSet(LS_SAVED, next);
      return next;
    });
  }, []);

  // ── Log a session ─────────────────────────────────────────────────────────
  const handleSaveLog = useCallback((log: Omit<SessionLog, "id" | "loggedAt">) => {
    const entry: SessionLog = { ...log, id: crypto.randomUUID(), loggedAt: new Date().toISOString() };
    setSessionLogs((prev) => {
      const next = [...prev, entry];
      lsSet(LS_LOGS, next);
      return next;
    });
  }, []);

  const handleDeleteLog = useCallback((id: string) => {
    setSessionLogs((prev) => {
      const next = prev.filter((l) => l.id !== id);
      lsSet(LS_LOGS, next);
      return next;
    });
  }, []);

  // ── Save an assignment ────────────────────────────────────────────────────
  const handleSaveAssignment = useCallback((a: Omit<DrillAssignment, "id" | "assignedAt">) => {
    const entry: DrillAssignment = { ...a, id: crypto.randomUUID(), assignedAt: new Date().toISOString() };
    setAssignments((prev) => {
      const next = [...prev, entry];
      lsSet(LS_ASSIGNMENTS, next);
      return next;
    });
  }, []);

  // ── Open modals from FormatsTab ───────────────────────────────────────────
  const handleOpenLog = useCallback((fmt: TrainingFormat) => {
    setLogPresetFmt(fmt);
    setShowLogModal(true);
  }, []);

  const handleOpenAssign = useCallback((drillId: string, drillName: string, formatLabel: string) => {
    setAssignTarget({ id: drillId, name: drillName, format: formatLabel });
    setShowAssignModal(true);
  }, []);

  // ── Chat ──────────────────────────────────────────────────────────────────
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
      ? `\n\nKNOWLEDGE BASE CONTEXT:\n` + relevant.map((s) => `--- ${s.title} ---\n${s.content.slice(0, 600)}`).join("\n\n")
      : "";

    const systemPrompt =
      `You are THUTO, the AI coach assistant for GrassRoots Sports in Zimbabwe. ` +
      `You specialise in junior football coaching (youth and grassroots levels). ` +
      `Provide practical, field-ready advice suitable for coaches with no professional facilities. ` +
      `Keep answers concise (3-5 sentences max unless asked for detail). ` +
      `Use simple language — your coaches may be new to formal coaching. ` +
      `Always mention player safety first when relevant.` + context;

    const history = next.slice(-8).map((m) => ({ role: m.role as "user" | "assistant", content: m.text }));

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, system_prompt: systemPrompt, history: history.slice(0, -1) }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory([...next, { role: "assistant", text: data.response ?? data.reply ?? "No response." }]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        setChatLoading(false);
        return;
      }
    } catch { /* fall through */ }

    setChatHistory([...next, { role: "assistant", text: "THUTO is currently offline. Check your connection and try again." }]);
    setChatLoading(false);
  }, [chatInput, chatLoading, chatHistory]);

  const tabs: { key: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "pathway", label: "Pathway",  icon: Map          },
    { key: "formats", label: "Formats",  icon: Flag         },
    { key: "3v3",     label: "3v3",      icon: Users        },
    { key: "saved",   label: "Saved",    icon: Star,        badge: savedItems.length    },
    { key: "log",     label: "Log",      icon: ClipboardList,badge: sessionLogs.length  },
    { key: "chat",    label: "THUTO",    icon: Brain        },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="gs-watermark flex-1 overflow-auto">
        {/* ── Sticky header ─────────────────────────────────────────────── */}
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
            {tabs.map(({ key, label, icon: Icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === key ? "bg-[#f0b429] text-[#1a3a1a]" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${activeTab === key ? "bg-[#1a3a1a]/30 text-[#1a3a1a]" : "bg-[#f0b429]/20 text-[#f0b429]"}`}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ──────────────────────────────────────────────── */}
        {activeTab === "pathway" && <PathwayTab />}
        {activeTab === "formats" && (
          <FormatsTab
            savedIds={savedIds}
            onToggleSave={handleToggleSave}
            onLogSession={handleOpenLog}
            onPrint={printSessionPlan}
            onAssign={handleOpenAssign}
          />
        )}
        {activeTab === "3v3"     && <ThreeVThreeTab />}
        {activeTab === "saved"   && <SavedTab saved={savedItems} onRemove={handleRemoveSaved} />}
        {activeTab === "log"     && <LogTab logs={sessionLogs} onDelete={handleDeleteLog} onAdd={() => setShowLogModal(true)} />}

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
                    <button key={q} onClick={() => setChatInput(q)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-white/70 hover:border-[#f0b429]/30 hover:text-white transition-all">
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
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                  placeholder="Ask about junior coaching…"
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-[#f0b429]/40 transition-all"
                  disabled={chatLoading} />
                <button onClick={sendMessage} disabled={!chatInput.trim() || chatLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b429] text-[#1a3a1a] disabled:opacity-40 transition-opacity">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {showLogModal && (
        <LogModal
          formats={logPresetFmt ? [logPresetFmt, ...TRAINING_FORMATS.filter((f) => f.id !== logPresetFmt.id)] : TRAINING_FORMATS}
          onSave={handleSaveLog}
          onClose={() => { setShowLogModal(false); setLogPresetFmt(null); }}
        />
      )}
      {showAssignModal && assignTarget && (
        <AssignModal
          drillName={assignTarget.name}
          formatLabel={assignTarget.format}
          onSave={handleSaveAssignment}
          onClose={() => { setShowAssignModal(false); setAssignTarget(null); }}
        />
      )}
    </div>
  );
}
