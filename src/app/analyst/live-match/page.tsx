"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  StopCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SPORTS } from "@/config/sports";

// ---------------------------------------------------------------------------
// xG zone definitions — attacking half, 3 columns × 5 rows
// ---------------------------------------------------------------------------
interface XgZone {
  id: string;
  label: string;
  xg: number;
  col: number; // 1-3
  row: number; // 1-5 (1 = closest to goal)
}

const XG_ZONES: XgZone[] = [
  { id: "six_yard",         label: "Six-Yard Box",        xg: 0.76, col: 2, row: 1 },
  { id: "wide_box_left",    label: "Wide Box (L)",        xg: 0.12, col: 1, row: 2 },
  { id: "penalty_spot",     label: "Penalty Spot",        xg: 0.45, col: 2, row: 2 },
  { id: "wide_box_right",   label: "Wide Box (R)",        xg: 0.12, col: 3, row: 2 },
  { id: "central_box",      label: "Central Box",         xg: 0.35, col: 2, row: 3 },
  { id: "edge_wide_left",   label: "Edge (L)",            xg: 0.07, col: 1, row: 4 },
  { id: "edge_centre",      label: "Edge (Centre)",       xg: 0.18, col: 2, row: 4 },
  { id: "edge_wide_right",  label: "Edge (R)",            xg: 0.07, col: 3, row: 4 },
  { id: "long_range",       label: "Long Range",          xg: 0.04, col: 2, row: 5 },
];

// Build a lookup: zone id → zone
const ZONE_MAP = Object.fromEntries(XG_ZONES.map((z) => [z.id, z]));

// Colour based on xG value
function xgColor(xg: number): string {
  if (xg >= 0.5) return "bg-red-600 hover:bg-red-500";
  if (xg >= 0.3) return "bg-orange-500 hover:bg-orange-400";
  if (xg >= 0.15) return "bg-amber-500 hover:bg-amber-400";
  if (xg >= 0.07) return "bg-yellow-600 hover:bg-yellow-500";
  return "bg-zinc-600 hover:bg-zinc-500";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MatchSetup {
  homeTeam: string;
  awayTeam: string;
  sport: string;
}

interface ShotEvent {
  id: string;
  minute: number;
  team: "home" | "away";
  zoneId: string;
  xg: number;
  isGoal: boolean;
}

type Phase = "setup" | "live" | "ended";

// ---------------------------------------------------------------------------
// Setup screen
// ---------------------------------------------------------------------------
function SetupScreen({
  setup,
  onChange,
  onStart,
}: {
  setup: MatchSetup;
  onChange: (s: MatchSetup) => void;
  onStart: () => void;
}) {
  const valid = setup.homeTeam.trim() && setup.awayTeam.trim();
  return (
    <div className="mx-auto max-w-lg space-y-5 py-8">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Match Setup</h2>
        <p className="mt-1 text-sm text-zinc-400">Enter team names and select sport</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        {/* Sport selector */}
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Sport
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {SPORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onChange({ ...setup, sport: s.key })}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all ${
                  setup.sport === s.key
                    ? "border-[#f0b429] bg-[#f0b429]/10 text-[#f0b429]"
                    : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                }`}
              >
                <span className="text-xl">{s.emoji}</span>
                <span className="text-[10px] font-medium leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Home Team
            </label>
            <input
              type="text"
              value={setup.homeTeam}
              onChange={(e) => onChange({ ...setup, homeTeam: e.target.value })}
              placeholder="Your team"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#f0b429]/60 focus:ring-1 focus:ring-[#f0b429]/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Away Team
            </label>
            <input
              type="text"
              value={setup.awayTeam}
              onChange={(e) => onChange({ ...setup, awayTeam: e.target.value })}
              placeholder="Opponent"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#f0b429]/60 focus:ring-1 focus:ring-[#f0b429]/30"
            />
          </div>
        </div>

        <button
          onClick={onStart}
          disabled={!valid}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-40 transition-colors"
        >
          <Play className="h-4 w-4" /> Start Collecting
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pitch zone tapper
// ---------------------------------------------------------------------------
function PitchZoneTapper({
  onZoneTap,
  lastZone,
}: {
  onZoneTap: (zone: XgZone) => void;
  lastZone: string | null;
}) {
  // Build a 5-row × 3-col grid. Empty cells where no zone defined.
  const grid: (XgZone | null)[][] = Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) =>
      XG_ZONES.find((z) => z.row === row + 1 && z.col === col + 1) ?? null
    )
  );

  return (
    <div className="space-y-2">
      {/* Goal line indicator */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          ← Goal Line →
        </span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      {/* Zone grid */}
      <div className="space-y-1.5">
        {grid.map((rowCells, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-3 gap-1.5">
            {rowCells.map((zone, colIdx) =>
              zone ? (
                <button
                  key={zone.id}
                  onClick={() => onZoneTap(zone)}
                  className={`relative rounded-lg border py-4 text-center transition-all ${
                    lastZone === zone.id
                      ? "border-[#f0b429] ring-2 ring-[#f0b429]/40 scale-[1.03]"
                      : `border-white/10 ${xgColor(zone.xg)}`
                  }`}
                >
                  <p className="text-[11px] font-bold text-white leading-tight px-1">
                    {zone.label}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-white/70">
                    xG {zone.xg.toFixed(2)}
                  </p>
                </button>
              ) : (
                <div key={colIdx} className="rounded-lg bg-transparent" />
              )
            )}
          </div>
        ))}
      </div>

      {/* Distance indicator */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          ← Halfway →
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shot log row
// ---------------------------------------------------------------------------
function ShotRow({
  shot,
  homeTeam,
  awayTeam,
}: {
  shot: ShotEvent;
  homeTeam: string;
  awayTeam: string;
}) {
  const zone = ZONE_MAP[shot.zoneId];
  return (
    <div className="flex items-center gap-3 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs">
      <span className="w-8 text-center font-bold text-zinc-400">{shot.minute}&apos;</span>
      <span
        className={`w-16 truncate font-semibold ${
          shot.team === "home" ? "text-emerald-400" : "text-blue-400"
        }`}
      >
        {shot.team === "home" ? homeTeam : awayTeam}
      </span>
      <span className="flex-1 truncate text-zinc-300">{zone?.label ?? shot.zoneId}</span>
      <span className="font-mono text-zinc-400">xG {shot.xg.toFixed(2)}</span>
      {shot.isGoal && (
        <span className="rounded-full bg-emerald-600/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          GOAL
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// xG scoreboard panel
// ---------------------------------------------------------------------------
function XgScoreboard({
  homeTeam,
  awayTeam,
  shots,
  elapsed,
  onEnd,
}: {
  homeTeam: string;
  awayTeam: string;
  shots: ShotEvent[];
  elapsed: number;
  onEnd: () => void;
}) {
  const homeGoals = shots.filter((s) => s.team === "home" && s.isGoal).length;
  const awayGoals = shots.filter((s) => s.team === "away" && s.isGoal).length;
  const homeXg = shots
    .filter((s) => s.team === "home")
    .reduce((sum, s) => sum + s.xg, 0);
  const awayXg = shots
    .filter((s) => s.team === "away")
    .reduce((sum, s) => sum + s.xg, 0);
  const homeShots = shots.filter((s) => s.team === "home").length;
  const awayShots = shots.filter((s) => s.team === "away").length;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      {/* Timer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Match Clock
        </p>
        <p className="mt-1 font-mono text-3xl font-black text-white">
          {mm}:{ss}
        </p>
      </div>

      {/* Score */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Score
        </p>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-[11px] font-medium text-emerald-400 truncate max-w-[72px]">
              {homeTeam || "Home"}
            </p>
            <p className="text-4xl font-black text-white">{homeGoals}</p>
          </div>
          <span className="text-2xl font-bold text-zinc-600">–</span>
          <div className="text-center">
            <p className="text-[11px] font-medium text-blue-400 truncate max-w-[72px]">
              {awayTeam || "Away"}
            </p>
            <p className="text-4xl font-black text-white">{awayGoals}</p>
          </div>
        </div>
      </div>

      {/* xG */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Expected Goals (xG)
        </p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-emerald-400">{homeXg.toFixed(2)}</p>
          <TrendingUp className="h-4 w-4 text-zinc-600" />
          <p className="text-2xl font-black text-blue-400">{awayXg.toFixed(2)}</p>
        </div>
      </div>

      {/* Shots */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Shots
        </p>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-black text-emerald-400">{homeShots}</p>
          <Target className="h-4 w-4 text-zinc-600" />
          <p className="text-2xl font-black text-blue-400">{awayShots}</p>
        </div>
      </div>

      {/* End match */}
      <button
        onClick={onEnd}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
      >
        <StopCircle className="h-4 w-4" /> End Match
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AnalystLiveMatchPage() {
  const { user } = useAuthStore();

  const [phase, setPhase] = useState<Phase>("setup");
  const [setup, setSetup] = useState<MatchSetup>({
    homeTeam: "",
    awayTeam: "",
    sport: "football",
  });
  const [shots, setShots] = useState<ShotEvent[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [activeTeam, setActiveTeam] = useState<"home" | "away">("home");
  const [markGoal, setMarkGoal] = useState(false);
  const [lastZone, setLastZone] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (phase === "live") {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const currentMinute = Math.max(1, Math.floor(elapsed / 60) + 1);

  const handleStart = () => {
    setPhase("live");
    setElapsed(0);
    setShots([]);
  };

  const handleZoneTap = useCallback(
    (zone: XgZone) => {
      const shot: ShotEvent = {
        id: crypto.randomUUID(),
        minute: currentMinute,
        team: activeTeam,
        zoneId: zone.id,
        xg: zone.xg,
        isGoal: markGoal,
      };
      setShots((prev) => [shot, ...prev]);
      setLastZone(zone.id);
      if (markGoal) setMarkGoal(false); // auto-reset goal checkbox after logging
    },
    [activeTeam, currentMinute, markGoal]
  );

  const handleEnd = () => {
    if (!confirm("End match and view final summary?")) return;
    setPhase("ended");
  };

  // Derived totals for end screen
  const homeGoals = shots.filter((s) => s.team === "home" && s.isGoal).length;
  const awayGoals = shots.filter((s) => s.team === "away" && s.isGoal).length;
  const homeXg = shots
    .filter((s) => s.team === "home")
    .reduce((sum, s) => sum + s.xg, 0);
  const awayXg = shots
    .filter((s) => s.team === "away")
    .reduce((sum, s) => sum + s.xg, 0);

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/analyst"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0b429]/20 border border-[#f0b429]/30">
              <Target className="h-5 w-5 text-[#f0b429]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Live Match Collector</h1>
              <p className="text-xs text-zinc-400">Tap pitch zones — xG auto-calculated</p>
            </div>
          </div>

          {phase === "live" && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="animate-pulse text-[#f0b429]">●</span>
              <span>
                {setup.homeTeam} vs {setup.awayTeam}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {/* SETUP */}
          {phase === "setup" && (
            <SetupScreen setup={setup} onChange={setSetup} onStart={handleStart} />
          )}

          {/* LIVE */}
          {phase === "live" && (
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Left: pitch + event log */}
              <div className="space-y-4 lg:col-span-2">
                {/* Team toggle + goal checkbox */}
                <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <p className="text-xs font-semibold text-zinc-400 shrink-0">Shot by:</p>
                  <div className="flex flex-1 gap-2">
                    <button
                      onClick={() => setActiveTeam("home")}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                        activeTeam === "home"
                          ? "bg-emerald-600 text-white"
                          : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {setup.homeTeam || "Home"}
                    </button>
                    <button
                      onClick={() => setActiveTeam("away")}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-colors ${
                        activeTeam === "away"
                          ? "bg-blue-600 text-white"
                          : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {setup.awayTeam || "Away"}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 shrink-0 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={markGoal}
                      onChange={(e) => setMarkGoal(e.target.checked)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    Goal?
                  </label>
                </div>

                {/* Pitch */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Tap Zone to Log Shot — Minute {currentMinute}
                  </p>
                  <PitchZoneTapper onZoneTap={handleZoneTap} lastZone={lastZone} />
                </div>

                {/* Shot timeline */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Shot Timeline ({shots.length})
                  </p>
                  {shots.length === 0 ? (
                    <p className="text-center text-xs text-zinc-600 py-4">
                      No shots logged yet — tap a zone above
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {shots.map((s) => (
                        <ShotRow
                          key={s.id}
                          shot={s}
                          homeTeam={setup.homeTeam}
                          awayTeam={setup.awayTeam}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: scoreboard */}
              <XgScoreboard
                homeTeam={setup.homeTeam}
                awayTeam={setup.awayTeam}
                shots={shots}
                elapsed={elapsed}
                onEnd={handleEnd}
              />
            </div>
          )}

          {/* ENDED */}
          {phase === "ended" && (
            <div className="mx-auto max-w-lg space-y-5 py-8">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#f0b429]">
                  Full Time
                </p>
                <p className="mt-1 text-4xl font-black text-white">
                  {homeGoals} – {awayGoals}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {setup.homeTeam} vs {setup.awayTeam}
                </p>
              </div>

              {/* xG comparison */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  xG vs Actual Goals
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs font-medium text-emerald-400 truncate">
                      {setup.homeTeam || "Home"}
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">{homeGoals}</p>
                    <p className="text-xs text-zinc-500">goals</p>
                    <p className="mt-2 text-xl font-bold text-emerald-400">
                      {homeXg.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">xG</p>
                    <p className={`mt-1 text-xs font-semibold ${
                      homeGoals > homeXg ? "text-emerald-400" : homeGoals < homeXg ? "text-red-400" : "text-zinc-400"
                    }`}>
                      {homeGoals > homeXg
                        ? `+${(homeGoals - homeXg).toFixed(2)} overperformed`
                        : homeGoals < homeXg
                        ? `${(homeGoals - homeXg).toFixed(2)} underperformed`
                        : "On expected"}
                    </p>
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="text-2xl font-bold text-zinc-700">vs</span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-blue-400 truncate">
                      {setup.awayTeam || "Away"}
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">{awayGoals}</p>
                    <p className="text-xs text-zinc-500">goals</p>
                    <p className="mt-2 text-xl font-bold text-blue-400">
                      {awayXg.toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">xG</p>
                    <p className={`mt-1 text-xs font-semibold ${
                      awayGoals > awayXg ? "text-emerald-400" : awayGoals < awayXg ? "text-red-400" : "text-zinc-400"
                    }`}>
                      {awayGoals > awayXg
                        ? `+${(awayGoals - awayXg).toFixed(2)} overperformed`
                        : awayGoals < awayXg
                        ? `${(awayGoals - awayXg).toFixed(2)} underperformed`
                        : "On expected"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shot totals */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Shot Summary
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-xl font-black text-emerald-400">
                      {shots.filter((s) => s.team === "home").length}
                    </p>
                    <p className="text-xs text-zinc-500">shots</p>
                  </div>
                  <div className="text-zinc-600 text-xs font-semibold self-center">SHOTS</div>
                  <div>
                    <p className="text-xl font-black text-blue-400">
                      {shots.filter((s) => s.team === "away").length}
                    </p>
                    <p className="text-xs text-zinc-500">shots</p>
                  </div>
                </div>
              </div>

              <Link
                href="/analyst"
                className="block w-full rounded-xl bg-[#f0b429] py-3 text-center text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
              >
                Back to Analyst Hub
              </Link>
            </div>
          )}
        </div>

        {/* xG legend */}
        {phase === "live" && (
          <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-2">
            <div className="flex items-center gap-4 text-[10px] text-zinc-500">
              <span className="font-semibold uppercase tracking-widest">xG Legend:</span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-red-600" /> High (0.5+)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-orange-500" /> Good (0.3–0.5)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-amber-500" /> Moderate (0.15–0.3)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-yellow-600" /> Low (0.07–0.15)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded bg-zinc-600" /> Long range (&lt;0.07)
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
