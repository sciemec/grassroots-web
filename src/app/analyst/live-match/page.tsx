"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, Play,
  Zap, Flag, ArrowUpDown, MoveRight, Users,
  Save, BarChart2, FileText, Loader2, CheckCircle2,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { SPORTS } from "@/config/sports";
import { saveMatch } from "@/lib/analyst-api";

// ─── xG zone definitions ──────────────────────────────────────────────────────
interface XgZone { id: string; label: string; xg: number; col: number; row: number; }

const XG_ZONES: XgZone[] = [
  { id: "six_yard",        label: "Six-Yard Box",       xg: 0.76, col: 2, row: 1 },
  { id: "wide_box_left",   label: "Wide Box (L)",        xg: 0.12, col: 1, row: 2 },
  { id: "penalty_spot",    label: "Penalty Spot",        xg: 0.45, col: 2, row: 2 },
  { id: "wide_box_right",  label: "Wide Box (R)",        xg: 0.12, col: 3, row: 2 },
  { id: "central_box",     label: "Central Box",         xg: 0.35, col: 2, row: 3 },
  { id: "edge_wide_left",  label: "Edge (L)",            xg: 0.07, col: 1, row: 4 },
  { id: "edge_centre",     label: "Edge (Centre)",       xg: 0.18, col: 2, row: 4 },
  { id: "edge_wide_right", label: "Edge (R)",            xg: 0.07, col: 3, row: 4 },
  { id: "long_range",      label: "Long Range",          xg: 0.04, col: 2, row: 5 },
];

const ZONE_MAP = Object.fromEntries(XG_ZONES.map((z) => [z.id, z]));

function xgColor(xg: number): string {
  if (xg >= 0.5)  return "bg-red-600 hover:bg-red-500";
  if (xg >= 0.3)  return "bg-orange-500 hover:bg-orange-400";
  if (xg >= 0.15) return "bg-amber-500 hover:bg-amber-400";
  if (xg >= 0.07) return "bg-yellow-600 hover:bg-yellow-500";
  return "bg-zinc-600 hover:bg-zinc-500";
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface MatchSetup { homeTeam: string; awayTeam: string; sport: string; }

type EventType = "shot" | "pass" | "press" | "set_piece" | "substitution";
type ActiveTab  = "shot" | "pass" | "press" | "set_piece" | "sub";

interface MatchEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  type: EventType;
  // shot
  zoneId?: string;
  xg?: number;
  isGoal?: boolean;
  // pass
  completed?: boolean;
  // set piece
  setPieceType?: "corner" | "free_kick" | "throw_in";
  location?: "left" | "centre" | "right";
  outcome?: "goal" | "shot_on" | "cleared" | "wasted";
  // substitution
  reason?: "tactical" | "injury" | "fatigue";
}

interface PossessionBlock { team: "home" | "away"; startMinute: number; }

type Phase = "setup" | "live" | "ended";

// ─── Possession calculator ───────────────────────────────────────────────────
function calcPossession(log: PossessionBlock[], currentMinute: number) {
  if (log.length === 0) return { home: 50, away: 50 };
  let homeMin = 0, awayMin = 0;
  log.forEach((block, i) => {
    const end = i < log.length - 1 ? log[i + 1].startMinute : currentMinute;
    const dur = Math.max(0, end - block.startMinute);
    if (block.team === "home") homeMin += dur; else awayMin += dur;
  });
  const total = homeMin + awayMin;
  if (total === 0) return { home: 50, away: 50 };
  return { home: Math.round((homeMin / total) * 100), away: Math.round((awayMin / total) * 100) };
}

// ─── Team toggle ──────────────────────────────────────────────────────────────
function TeamToggle({ active, home, away, onChange }: {
  active: "home" | "away"; home: string; away: string;
  onChange: (t: "home" | "away") => void;
}) {
  return (
    <div className="flex gap-2">
      <button onClick={() => onChange("home")}
        className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
          active === "home" ? "bg-emerald-600 text-white" : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
        }`}>{home || "Home"}
      </button>
      <button onClick={() => onChange("away")}
        className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
          active === "away" ? "bg-blue-600 text-white" : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
        }`}>{away || "Away"}
      </button>
    </div>
  );
}

// ─── Setup screen ─────────────────────────────────────────────────────────────
function SetupScreen({ setup, onChange, onStart }: {
  setup: MatchSetup; onChange: (s: MatchSetup) => void; onStart: () => void;
}) {
  const valid = setup.homeTeam.trim() && setup.awayTeam.trim();
  return (
    <div className="mx-auto max-w-lg space-y-5 py-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Match Setup</h2>
        <p className="mt-1 text-sm text-zinc-400">Enter team names and select sport</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">Sport</label>
          <div className="grid grid-cols-5 gap-1.5">
            {SPORTS.map((s) => (
              <button key={s.key} type="button" onClick={() => onChange({ ...setup, sport: s.key })}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all ${
                  setup.sport === s.key
                    ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                }`}>
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-medium leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(["homeTeam", "awayTeam"] as const).map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {key === "homeTeam" ? "Home Team" : "Away Team"}
              </label>
              <input type="text" value={setup[key]}
                onChange={(e) => onChange({ ...setup, [key]: e.target.value })}
                placeholder={key === "homeTeam" ? "Your team" : "Opponent"}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#f0b429]/60" />
            </div>
          ))}
        </div>
        <button onClick={onStart} disabled={!valid}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-40 transition-colors">
          <Play className="h-4 w-4" /> Start Collecting
        </button>
      </div>
    </div>
  );
}

// ─── Pitch zone tapper (shots) ────────────────────────────────────────────────
function PitchZoneTapper({ onZoneTap, lastZone }: {
  onZoneTap: (zone: XgZone) => void; lastZone: string | null;
}) {
  const grid = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) =>
      XG_ZONES.find((z) => z.row === row + 1 && z.col === col + 1) ?? null
    )
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">← Goal Line →</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>
      <div className="space-y-1.5">
        {grid.map((rowCells, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-3 gap-1.5">
            {rowCells.map((zone, colIdx) =>
              zone ? (
                <button key={zone.id} onClick={() => onZoneTap(zone)}
                  className={`rounded-lg border py-4 text-center transition-all ${
                    lastZone === zone.id
                      ? "border-[#f0b429] ring-2 ring-[#f0b429]/40 scale-[1.03]"
                      : `border-white/10 ${xgColor(zone.xg)}`
                  }`}>
                  <p className="text-[11px] font-bold text-white leading-tight px-1">{zone.label}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/70">xG {zone.xg.toFixed(2)}</p>
                </button>
              ) : <div key={colIdx} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">← Halfway →</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}

// ─── Event logger panel ───────────────────────────────────────────────────────
function EventLoggerPanel({
  activeTab, setActiveTab, activeTeam, setActiveTeam,
  markGoal, setMarkGoal, lastZone, onShot,
  setPieceType, location, reason,
  onPassLog, onPressLog, onSetPieceLog, onSubLog,
  onSetPieceTypeChange, onLocationChange, onOutcomeChange, onReasonChange,
  selectedOutcome, homeTeam, awayTeam,
}: {
  activeTab: ActiveTab; setActiveTab: (t: ActiveTab) => void;
  activeTeam: "home" | "away"; setActiveTeam: (t: "home" | "away") => void;
  markGoal: boolean; setMarkGoal: (v: boolean) => void;
  lastZone: string | null;
  onShot: (zone: XgZone) => void;
  setPieceType: "corner" | "free_kick" | "throw_in";
  location: "left" | "centre" | "right";
  reason: "tactical" | "injury" | "fatigue";
  selectedOutcome: "goal" | "shot_on" | "cleared" | "wasted";
  onPassLog: (completed: boolean) => void;
  onPressLog: () => void;
  onSetPieceLog: () => void;
  onSubLog: () => void;
  onSetPieceTypeChange: (v: "corner" | "free_kick" | "throw_in") => void;
  onLocationChange: (v: "left" | "centre" | "right") => void;
  onOutcomeChange: (v: "goal" | "shot_on" | "cleared" | "wasted") => void;
  onReasonChange: (v: "tactical" | "injury" | "fatigue") => void;
  homeTeam: string; awayTeam: string;
}) {
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "shot",      label: "⚽ Shot" },
    { id: "pass",      label: "↗ Pass" },
    { id: "press",     label: "⚡ Press" },
    { id: "set_piece", label: "🚩 Set Piece" },
    { id: "sub",       label: "↕ Sub" },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-colors ${
              activeTab === t.id ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}>{t.label}
          </button>
        ))}
      </div>

      {/* Team toggle (all tabs except sub use it) */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {activeTab === "press" ? "Who pressed?" : activeTab === "sub" ? "Which team?" : "Shot by:"}
        </p>
        <TeamToggle active={activeTeam} home={homeTeam} away={awayTeam} onChange={setActiveTeam} />
      </div>

      {/* SHOT TAB */}
      {activeTab === "shot" && (
        <>
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer select-none">
            <input type="checkbox" checked={markGoal} onChange={(e) => setMarkGoal(e.target.checked)}
              className="h-4 w-4 accent-emerald-500" />
            Mark as Goal (auto-resets after logging)
          </label>
          <PitchZoneTapper onZoneTap={onShot} lastZone={lastZone} />
        </>
      )}

      {/* PASS TAB */}
      {activeTab === "pass" && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Result</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onPassLog(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-4 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <MoveRight className="h-4 w-4" /> Completed
            </button>
            <button onClick={() => onPassLog(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-4 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors">
              <StopCircle className="h-4 w-4" /> Intercepted
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-600">Tap to log instantly — no confirmation needed</p>
        </div>
      )}

      {/* PRESS TAB */}
      {activeTab === "press" && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Tap when your team wins the ball in the opponent&apos;s half
          </p>
          <button onClick={onPressLog}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#f0b429]/40 bg-[#f0b429]/10 py-5 text-sm font-bold text-[#f0b429] hover:bg-[#f0b429]/20 active:scale-95 transition-all">
            <Zap className="h-5 w-5" /> Press Won — Log Now
          </button>
          <p className="text-center text-[10px] text-zinc-600">Only log successful press recoveries, not every tackle</p>
        </div>
      )}

      {/* SET PIECE TAB */}
      {activeTab === "set_piece" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Type</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["corner", "free_kick", "throw_in"] as const).map((t) => (
                <button key={t} onClick={() => onSetPieceTypeChange(t)}
                  className={`rounded-lg border py-2 text-[10px] font-bold transition-colors ${
                    setPieceType === t ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  }`}>
                  {t === "corner" ? "Corner" : t === "free_kick" ? "Free Kick" : "Throw-in"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Location</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["left", "centre", "right"] as const).map((l) => (
                <button key={l} onClick={() => onLocationChange(l)}
                  className={`rounded-lg border py-2 text-[10px] font-bold capitalize transition-colors ${
                    location === l ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  }`}>{l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Outcome</p>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { v: "goal" as const,     label: "Goal" },
                { v: "shot_on" as const,  label: "Shot" },
                { v: "cleared" as const,  label: "Cleared" },
                { v: "wasted" as const,   label: "Wasted" },
              ]).map(({ v, label }) => (
                <button key={v} onClick={() => onOutcomeChange(v)}
                  className={`rounded-lg border py-2 text-[10px] font-bold transition-colors ${
                    selectedOutcome === v ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  }`}>{label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onSetPieceLog}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-700 py-3 text-sm font-bold text-white hover:bg-zinc-600 transition-colors">
            <Flag className="h-4 w-4" /> Log Set Piece
          </button>
        </div>
      )}

      {/* SUB TAB */}
      {activeTab === "sub" && (
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Reason</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["tactical", "injury", "fatigue"] as const).map((r) => (
                <button key={r} onClick={() => onReasonChange(r)}
                  className={`rounded-lg border py-2 text-[10px] font-bold capitalize transition-colors ${
                    reason === r ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  }`}>{r}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onSubLog}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-700 py-3 text-sm font-bold text-white hover:bg-zinc-600 transition-colors">
            <ArrowUpDown className="h-4 w-4" /> Log Substitution
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Possession tracker bar ───────────────────────────────────────────────────
function PossessionBar({
  possession, possessionTeam, homeTeam, awayTeam,
  onSwitch,
}: {
  possession: { home: number; away: number };
  possessionTeam: "home" | "away";
  homeTeam: string; awayTeam: string;
  onSwitch: (t: "home" | "away") => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Possession</p>
        <p className="text-[10px] text-zinc-600">Tap to update when possession changes</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSwitch("home")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
            possessionTeam === "home" ? "bg-emerald-600 text-white" : "border border-zinc-700 text-zinc-500 hover:bg-zinc-800"
          }`}>{homeTeam || "Home"} {possession.home}%
        </button>
        <button onClick={() => onSwitch("away")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
            possessionTeam === "away" ? "bg-blue-600 text-white" : "border border-zinc-700 text-zinc-500 hover:bg-zinc-800"
          }`}>{awayTeam || "Away"} {possession.away}%
        </button>
      </div>
      {/* Visual bar */}
      <div className="flex h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="bg-emerald-600 transition-all duration-500" style={{ width: `${possession.home}%` }} />
        <div className="bg-blue-600 transition-all duration-500" style={{ width: `${possession.away}%` }} />
      </div>
    </div>
  );
}

// ─── Event timeline row ───────────────────────────────────────────────────────
function EventRow({ evt, homeTeam, awayTeam }: {
  evt: MatchEvent; homeTeam: string; awayTeam: string;
}) {
  const teamColor = evt.team === "home" ? "text-emerald-400" : "text-blue-400";
  const teamName  = evt.team === "home" ? homeTeam : awayTeam;

  const label = (() => {
    switch (evt.type) {
      case "shot":        return `Shot — ${ZONE_MAP[evt.zoneId ?? ""]?.label ?? evt.zoneId} (xG ${evt.xg?.toFixed(2)})`;
      case "pass":        return `Pass — ${evt.completed ? "Completed" : "Intercepted"}`;
      case "press":       return "Press Won";
      case "set_piece":   return `${evt.setPieceType?.replace("_", " ")} (${evt.location}) → ${evt.outcome?.replace("_", " ")}`;
      case "substitution":return `Sub — ${evt.reason}`;
      default:            return evt.type;
    }
  })();

  const icon = (() => {
    switch (evt.type) {
      case "shot":        return "⚽";
      case "pass":        return evt.completed ? "↗" : "✗";
      case "press":       return "⚡";
      case "set_piece":   return "🚩";
      case "substitution":return "↕";
    }
  })();

  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs">
      <span className="w-8 text-center font-bold text-zinc-400">{evt.minute}&apos;</span>
      <span className="text-base">{icon}</span>
      <span className={`w-20 truncate font-semibold ${teamColor}`}>{teamName}</span>
      <span className="flex-1 truncate text-zinc-300">{label}</span>
      {evt.isGoal && (
        <span className="rounded-full bg-emerald-600/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">GOAL</span>
      )}
    </div>
  );
}

// ─── Stats sidebar ────────────────────────────────────────────────────────────
function StatsPanel({
  events, possession, homeTeam, awayTeam, elapsed, onEnd,
}: {
  events: MatchEvent[];
  possession: { home: number; away: number };
  homeTeam: string; awayTeam: string;
  elapsed: number;
  onEnd: () => void;
}) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const homeGoals  = events.filter((e) => e.type === "shot" && e.team === "home" && e.isGoal).length;
  const awayGoals  = events.filter((e) => e.type === "shot" && e.team === "away" && e.isGoal).length;
  const homeXg     = events.filter((e) => e.type === "shot" && e.team === "home").reduce((s, e) => s + (e.xg ?? 0), 0);
  const awayXg     = events.filter((e) => e.type === "shot" && e.team === "away").reduce((s, e) => s + (e.xg ?? 0), 0);
  const homeShots  = events.filter((e) => e.type === "shot" && e.team === "home").length;
  const awayShots  = events.filter((e) => e.type === "shot" && e.team === "away").length;
  const homePress  = events.filter((e) => e.type === "press" && e.team === "home").length;
  const awayPress  = events.filter((e) => e.type === "press" && e.team === "away").length;
  const homeCorners = events.filter((e) => e.type === "set_piece" && e.team === "home" && e.setPieceType === "corner").length;
  const awayCorners = events.filter((e) => e.type === "set_piece" && e.team === "away" && e.setPieceType === "corner").length;

  const homePasses  = events.filter((e) => e.type === "pass" && e.team === "home");
  const awayPasses  = events.filter((e) => e.type === "pass" && e.team === "away");
  const homePassPct = homePasses.length ? Math.round((homePasses.filter((e) => e.completed).length / homePasses.length) * 100) : "--";
  const awayPassPct = awayPasses.length ? Math.round((awayPasses.filter((e) => e.completed).length / awayPasses.length) * 100) : "--";

  const stat = (label: string, h: string | number, a: string | number) => (
    <div className="flex items-center justify-between text-xs">
      <span className="font-bold text-emerald-400">{h}</span>
      <span className="text-zinc-500 text-[10px] uppercase tracking-widest">{label}</span>
      <span className="font-bold text-blue-400">{a}</span>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Clock */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Clock</p>
        <p className="mt-0.5 font-mono text-3xl font-black text-white">{mm}:{ss}</p>
      </div>

      {/* Score */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-medium text-emerald-400 truncate max-w-[72px]">{homeTeam || "Home"}</p>
          <p className="text-[10px] font-medium text-blue-400 truncate max-w-[72px] text-right">{awayTeam || "Away"}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-4xl font-black text-white">{homeGoals}</span>
          <span className="text-xl font-bold text-zinc-600">–</span>
          <span className="text-4xl font-black text-white">{awayGoals}</span>
        </div>
      </div>

      {/* All stats */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-2.5">
        <div className="flex justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          <span className="text-emerald-400">{homeTeam || "Home"}</span>
          <span>Stats</span>
          <span className="text-blue-400">{awayTeam || "Away"}</span>
        </div>
        {stat("xG",          homeXg.toFixed(2),  awayXg.toFixed(2))}
        {stat("Shots",       homeShots,           awayShots)}
        {stat("Possession",  `${possession.home}%`, `${possession.away}%`)}
        {stat("Press Wins",  homePress,           awayPress)}
        {stat("Corners",     homeCorners,         awayCorners)}
        {stat("Pass %",      typeof homePassPct === "number" ? `${homePassPct}%` : homePassPct,
                             typeof awayPassPct === "number" ? `${awayPassPct}%` : awayPassPct)}
      </div>

      <button onClick={onEnd}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
        <StopCircle className="h-4 w-4" /> End Match
      </button>
    </div>
  );
}

// ─── End screen ───────────────────────────────────────────────────────────────
function EndScreen({ events, possession, setup, elapsed, onSaved }: {
  events: MatchEvent[];
  possession: { home: number; away: number };
  setup: MatchSetup;
  elapsed: number;
  onSaved: (matchId: string) => void;
}) {
  const homeGoals  = events.filter((e) => e.type === "shot" && e.team === "home" && e.isGoal).length;
  const awayGoals  = events.filter((e) => e.type === "shot" && e.team === "away" && e.isGoal).length;
  const homeXg     = events.filter((e) => e.type === "shot" && e.team === "home").reduce((s, e) => s + (e.xg ?? 0), 0);
  const awayXg     = events.filter((e) => e.type === "shot" && e.team === "away").reduce((s, e) => s + (e.xg ?? 0), 0);
  const homeShots  = events.filter((e) => e.type === "shot" && e.team === "home").length;
  const awayShots  = events.filter((e) => e.type === "shot" && e.team === "away").length;
  const homePress  = events.filter((e) => e.type === "press" && e.team === "home").length;
  const awayPress  = events.filter((e) => e.type === "press" && e.team === "away").length;
  const homeCorners = events.filter((e) => e.type === "set_piece" && e.team === "home" && e.setPieceType === "corner").length;
  const awayCorners = events.filter((e) => e.type === "set_piece" && e.team === "away" && e.setPieceType === "corner").length;
  const homePasses  = events.filter((e) => e.type === "pass" && e.team === "home");
  const awayPasses  = events.filter((e) => e.type === "pass" && e.team === "away");
  const homePassPct = homePasses.length ? Math.round((homePasses.filter((e) => e.completed).length / homePasses.length) * 100) : null;
  const awayPassPct = awayPasses.length ? Math.round((awayPasses.filter((e) => e.completed).length / awayPasses.length) * 100) : null;
  const totalMins   = Math.floor(elapsed / 60);
  const [saving, setSaving]     = useState(false);
  const [savedId, setSavedId]   = useState<string | null>(null);
  const [saveErr, setSaveErr]   = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveErr("");
    try {
      const m = await saveMatch({
        home_team: setup.homeTeam,
        away_team: setup.awayTeam,
        sport: setup.sport,
        events: events as Parameters<typeof saveMatch>[0]["events"],
        possession_log: [],
        elapsed,
        phase: "ended",
      });
      setSavedId(m.id);
      onSaved(m.id);
    } catch {
      setSaveErr("Save failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const perfLabel = (goals: number, xg: number) => {
    const diff = goals - xg;
    if (Math.abs(diff) < 0.1) return { text: "On expected", color: "text-zinc-400" };
    return diff > 0
      ? { text: `+${diff.toFixed(2)} overperformed`, color: "text-emerald-400" }
      : { text: `${diff.toFixed(2)} underperformed`, color: "text-red-400" };
  };

  const row = (label: string, h: string, a: string) => (
    <div key={label} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800 last:border-0">
      <span className="font-bold text-emerald-400">{h}</span>
      <span className="text-zinc-500 text-[10px] uppercase tracking-widest">{label}</span>
      <span className="font-bold text-blue-400">{a}</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 py-8">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]">Full Time — {totalMins} mins</p>
        <p className="mt-1 text-4xl font-black text-white">{homeGoals} – {awayGoals}</p>
        <p className="mt-1 text-sm text-zinc-400">{setup.homeTeam} vs {setup.awayTeam}</p>
      </div>

      {/* xG over/under */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">xG vs Actual Goals</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[11px] font-medium text-emerald-400 truncate">{setup.homeTeam}</p>
            <p className="mt-1 text-3xl font-black text-white">{homeGoals}</p>
            <p className="text-xs text-zinc-500">goals</p>
            <p className="mt-2 text-xl font-bold text-emerald-400">{homeXg.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">xG</p>
            <p className={`mt-1 text-[10px] font-semibold ${perfLabel(homeGoals, homeXg).color}`}>
              {perfLabel(homeGoals, homeXg).text}
            </p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-zinc-700">vs</span>
          </div>
          <div>
            <p className="text-[11px] font-medium text-blue-400 truncate">{setup.awayTeam}</p>
            <p className="mt-1 text-3xl font-black text-white">{awayGoals}</p>
            <p className="text-xs text-zinc-500">goals</p>
            <p className="mt-2 text-xl font-bold text-blue-400">{awayXg.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">xG</p>
            <p className={`mt-1 text-[10px] font-semibold ${perfLabel(awayGoals, awayXg).color}`}>
              {perfLabel(awayGoals, awayXg).text}
            </p>
          </div>
        </div>
      </div>

      {/* Full stats table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">Match Stats</p>
        <div className="flex justify-between text-[10px] font-semibold mb-2">
          <span className="text-emerald-400">{setup.homeTeam}</span>
          <span className="text-blue-400">{setup.awayTeam}</span>
        </div>
        {row("Shots",       `${homeShots}`,      `${awayShots}`)}
        {row("Possession",  `${possession.home}%`, `${possession.away}%`)}
        {row("Press Wins",  `${homePress}`,      `${awayPress}`)}
        {row("Corners",     `${homeCorners}`,    `${awayCorners}`)}
        {row("Pass %",      homePassPct !== null ? `${homePassPct}%` : "N/A", awayPassPct !== null ? `${awayPassPct}%` : "N/A")}
        {row("Total Events", `${events.filter((e) => e.team === "home").length}`, `${events.filter((e) => e.team === "away").length}`)}
      </div>

      {/* Save + analyse actions */}
      {!savedId ? (
        <div className="space-y-3">
          {saveErr && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{saveErr}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving to backend…</>
              : <><Save className="h-4 w-4" /> Save Match & Analyse</>}
          </button>
          <Link href="/analyst"
            className="block w-full rounded-xl border border-zinc-700 py-2.5 text-center text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">
            Back without saving
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Match saved! Open in an analysis tool:
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/analyst/xg-analysis?match_id=${savedId}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <BarChart2 className="h-4 w-4" /> xG Analysis
            </Link>
            <Link
              href={`/analyst/tactical-report?match_id=${savedId}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition-colors"
            >
              <FileText className="h-4 w-4" /> Tactical Report
            </Link>
          </div>
          <Link href="/analyst"
            className="block w-full rounded-xl border border-zinc-700 py-2.5 text-center text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">
            Back to Analyst Hub
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Persistence ─────────────────────────────────────────────────────────────
const LS_KEY = "gs_live_match";
interface SavedMatch { phase: Phase; setup: MatchSetup; events: MatchEvent[]; possessionLog: PossessionBlock[]; elapsed: number; }
function loadSaved(): SavedMatch | null {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "null") as SavedMatch | null; }
  catch { return null; }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AnalystLiveMatchPage() {
  const router = useRouter();
  const saved  = useMemo(() => loadSaved(), []);

  const [phase, setPhase]               = useState<Phase>(saved?.phase ?? "setup");
  const [setup, setSetup]               = useState<MatchSetup>(saved?.setup ?? { homeTeam: "", awayTeam: "", sport: "football" });
  const [events, setEvents]             = useState<MatchEvent[]>(saved?.events ?? []);
  const [elapsed, setElapsed]           = useState(saved?.elapsed ?? 0);
  const [activeTab, setActiveTab]       = useState<ActiveTab>("shot");
  const [activeTeam, setActiveTeam]     = useState<"home" | "away">("home");
  const [markGoal, setMarkGoal]         = useState(false);
  const [lastZone, setLastZone]         = useState<string | null>(null);
  const [setPieceType, setSetPieceType] = useState<"corner" | "free_kick" | "throw_in">("corner");
  const [location, setLocation]         = useState<"left" | "centre" | "right">("centre");
  const [outcome, setOutcome]           = useState<"goal" | "shot_on" | "cleared" | "wasted">("cleared");
  const [subReason, setSubReason]       = useState<"tactical" | "injury" | "fatigue">("tactical");
  const [possessionTeam, setPossessionTeam] = useState<"home" | "away">("home");
  const [possessionLog, setPossessionLog]   = useState<PossessionBlock[]>(saved?.possessionLog ?? []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Persist match state when live or ended
  useEffect(() => {
    if (phase === "live" || phase === "ended") {
      try { localStorage.setItem(LS_KEY, JSON.stringify({ phase, setup, events, possessionLog, elapsed })); } catch {}
    }
  }, [phase, setup, events, possessionLog, elapsed]);

  // Timer
  useEffect(() => {
    if (phase === "live") {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  const currentMinute = Math.max(1, Math.floor(elapsed / 60) + 1);
  const possession    = calcPossession(possessionLog, currentMinute);

  const logEvent = useCallback((partial: Omit<MatchEvent, "id" | "minute">) => {
    setEvents((prev) => [{ ...partial, id: crypto.randomUUID(), minute: currentMinute }, ...prev]);
  }, [currentMinute]);

  const handleStart = () => {
    setPhase("live");
    setElapsed(0);
    setEvents([]);
    setPossessionLog([{ team: "home", startMinute: 1 }]);
    try { localStorage.removeItem(LS_KEY); } catch {}
  };

  const handleShot = useCallback((zone: XgZone) => {
    logEvent({ type: "shot", team: activeTeam, zoneId: zone.id, xg: zone.xg, isGoal: markGoal });
    setLastZone(zone.id);
    if (markGoal) setMarkGoal(false);
  }, [activeTeam, markGoal, logEvent]);

  const handlePass = useCallback((completed: boolean) => {
    logEvent({ type: "pass", team: activeTeam, completed });
  }, [activeTeam, logEvent]);

  const handlePress = useCallback(() => {
    logEvent({ type: "press", team: activeTeam });
  }, [activeTeam, logEvent]);

  const handleSetPiece = useCallback(() => {
    logEvent({ type: "set_piece", team: activeTeam, setPieceType, location, outcome });
  }, [activeTeam, setPieceType, location, outcome, logEvent]);

  const handleSub = useCallback(() => {
    logEvent({ type: "substitution", team: activeTeam, reason: subReason });
  }, [activeTeam, subReason, logEvent]);

  const handlePossessionSwitch = useCallback((team: "home" | "away") => {
    if (team === possessionTeam) return;
    setPossessionTeam(team);
    setPossessionLog((prev) => [...prev, { team, startMinute: currentMinute }]);
  }, [possessionTeam, currentMinute]);

  const handleEnd = () => {
    if (!confirm("End match and view full summary?")) return;
    setPhase("ended");
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden text-white">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/analyst"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0b429]/20 border border-[#f0b429]/30">
              <Target className="h-5 w-5 text-[#f0b429]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Live Match Collector</h1>
              <p className="text-xs text-zinc-400">xG · Passes · Presses · Set Pieces · Subs</p>
            </div>
          </div>
          {phase === "live" && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="animate-pulse text-[#f0b429]">●</span>
              <span>{setup.homeTeam} vs {setup.awayTeam} · {events.length} events</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {phase === "setup" && (
            <SetupScreen setup={setup} onChange={setSetup} onStart={handleStart} />
          )}

          {phase === "live" && (
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Left: possession bar + event logger + timeline */}
              <div className="space-y-4 lg:col-span-2">
                <PossessionBar
                  possession={possession}
                  possessionTeam={possessionTeam}
                  homeTeam={setup.homeTeam}
                  awayTeam={setup.awayTeam}
                  onSwitch={handlePossessionSwitch}
                />
                <EventLoggerPanel
                  activeTab={activeTab} setActiveTab={setActiveTab}
                  activeTeam={activeTeam} setActiveTeam={setActiveTeam}
                  markGoal={markGoal} setMarkGoal={setMarkGoal}
                  lastZone={lastZone}
                  onShot={handleShot}
                  onPassLog={handlePass}
                  onPressLog={handlePress}
                  onSetPieceLog={handleSetPiece}
                  onSubLog={handleSub}
                  setPieceType={setPieceType}
                  location={location}
                  reason={subReason}
                  selectedOutcome={outcome}
                  onSetPieceTypeChange={setSetPieceType}
                  onLocationChange={setLocation}
                  onOutcomeChange={setOutcome}
                  onReasonChange={setSubReason}
                  homeTeam={setup.homeTeam}
                  awayTeam={setup.awayTeam}
                />
                {/* Event timeline */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Event Timeline ({events.length})
                  </p>
                  {events.length === 0 ? (
                    <p className="text-center text-xs text-zinc-600 py-4">No events yet — log a shot, pass, press or set piece above</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {events.map((e) => (
                        <EventRow key={e.id} evt={e} homeTeam={setup.homeTeam} awayTeam={setup.awayTeam} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: stats panel */}
              <StatsPanel
                events={events}
                possession={possession}
                homeTeam={setup.homeTeam}
                awayTeam={setup.awayTeam}
                elapsed={elapsed}
                onEnd={handleEnd}
              />
            </div>
          )}

          {phase === "ended" && (
            <EndScreen
              events={events}
              possession={possession}
              setup={setup}
              elapsed={elapsed}
              onSaved={() => { try { localStorage.removeItem(LS_KEY); } catch {} }}
            />
          )}
        </div>

        {/* Footer legend */}
        {phase === "live" && (
          <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-2">
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500">
              <span className="font-semibold uppercase tracking-widest">xG Zones:</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-red-600" /> High (0.5+)</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-orange-500" /> Good (0.3–0.5)</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-amber-500" /> Moderate</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded bg-zinc-600" /> Long range</span>
              <span className="ml-auto flex items-center gap-1.5">
                <Users className="h-3 w-3" /> Data feeds LSTM · OpenCV · KNN
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
