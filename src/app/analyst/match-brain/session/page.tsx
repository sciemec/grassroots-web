"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, Square, ChevronRight, Target, X, Brain } from "lucide-react";

// ── Types (match Pass Map's MBSession exactly; period fields are extra) ─────────

type PassType = "pass" | "long" | "cross" | "corner" | "throw-in" | "intercept" | "penalty";
type Team = "home" | "away";

interface TouchEv {
  id: string; type: "touch"; team: Team; player: number;
  min: number; sec: number; period: number; periodMin: number;
}
interface ShotEv {
  id: string; type: "shot"; team: Team; zone: string; xg: number; isGoal: boolean;
  min: number; period: number; periodMin: number;
}
interface PassEv {
  id: string; type: "pass"; team: Team; fromPlayer: number; toPlayer: number; passType: PassType;
  min: number; period: number; periodMin: number;
}
interface ZoneEv {
  id: string; type: "zone"; team: Team; player: number; pitchZone: string;
  min: number; period: number; periodMin: number;
}
type MatchEvent = TouchEv | ShotEv | PassEv | ZoneEv;

interface MBSession {
  homeTeam: string; awayTeam: string; sport: string; formation: string; date: string;
  events: MatchEvent[];
}

// ── Constants ────────────────────────────────────────────────────────────────────

const PERIOD_OFFSETS_2 = [0, 45];
const PERIOD_OFFSETS_4 = [0, 22, 45, 67];

// Zone labels must match ZONE_POS_TOP keys in pass-map exactly
const SHOT_ZONES: { label: string; xg: number }[] = [
  { label: "Six-Yard Box",  xg: 0.76 },
  { label: "Penalty Spot",  xg: 0.45 },
  { label: "Central Box",   xg: 0.35 },
  { label: "Wide Box L",    xg: 0.12 },
  { label: "Wide Box R",    xg: 0.12 },
  { label: "Edge Centre",   xg: 0.18 },
  { label: "Edge Left",     xg: 0.07 },
  { label: "Edge Right",    xg: 0.07 },
  { label: "Long Range",    xg: 0.04 },
];

const PASS_TYPES: PassType[] = ["pass", "long", "cross", "corner", "throw-in", "intercept", "penalty"];

const PITCH_ZONES = [
  "Def. Third", "Central Midfield", "Attack. Third",
  "Left Channel", "Right Channel", "Penalty Area",
];

// Map Match Brain zone display labels → xG Analysis zone IDs
const ZONE_LABEL_TO_ID: Record<string, string> = {
  "Six-Yard Box": "six_yard",
  "Penalty Spot": "penalty_spot",
  "Central Box":  "central_box",
  "Wide Box L":   "wide_box_left",
  "Wide Box R":   "wide_box_right",
  "Edge Centre":  "edge_centre",
  "Edge Left":    "edge_wide_left",
  "Edge Right":   "edge_wide_right",
  "Long Range":   "long_range",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Session inner component (uses useSearchParams — must be inside Suspense) ────

function MatchBrainSession() {
  const router = useRouter();
  const params = useSearchParams();

  const homeTeam  = params?.get("home")      ?? "Home";
  const awayTeam  = params?.get("away")      ?? "Away";
  const sport     = params?.get("sport")     ?? "football";
  const formation = params?.get("formation") ?? "4-3-3";
  const periodsN  = (parseInt(params?.get("periods") ?? "2", 10) as 2 | 4);

  const PERIOD_OFFSETS  = periodsN === 4 ? PERIOD_OFFSETS_4 : PERIOD_OFFSETS_2;
  const PERIOD_LABEL    = periodsN === 4 ? "Quarter" : "Half";

  // ── State ────────────────────────────────────────────────────────────────────
  type Phase = "warmup" | "live" | "break" | "ended";
  const [phase, setPhase]         = useState<Phase>("warmup");
  const [period, setPeriod]       = useState(1);
  const [periodSec, setPeriodSec] = useState(0);   // seconds elapsed within current period
  const [events, setEvents]       = useState<MatchEvent[]>([]);
  const [team, setTeam]           = useState<Team>("home");
  const [activeTab, setActiveTab] = useState<"touch" | "shot" | "pass" | "zone">("touch");

  // Touch / Zone inputs
  const [touchPlayer, setTouchPlayer]   = useState(1);
  const [pitchZone, setPitchZone]       = useState("Central Midfield");

  // Shot inputs
  const [shotZone, setShotZone]   = useState(SHOT_ZONES[0].label);
  const [shotGoal, setShotGoal]   = useState(false);

  // Pass inputs
  const [passType, setPassType]       = useState<PassType>("pass");
  const [fromPlayer, setFromPlayer]   = useState(1);
  const [toPlayer, setToPlayer]       = useState(2);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appendedPeriodsRef = useRef<Set<number>>(new Set());

  // ── Derived ──────────────────────────────────────────────────────────────────
  const globalMin = PERIOD_OFFSETS[period - 1] + Math.floor(periodSec / 60);
  const mm = String(Math.floor(periodSec / 60)).padStart(2, "0");
  const ss = String(periodSec % 60).padStart(2, "0");

  const homeTouches = events.filter((e) => e.type === "touch" && e.team === "home").length;
  const awayTouches = events.filter((e) => e.type === "touch" && e.team === "away").length;
  const homeShots   = events.filter((e) => e.type === "shot"  && e.team === "home").length;
  const awayShots   = events.filter((e) => e.type === "shot"  && e.team === "away").length;

  // ── Timer ────────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setPeriodSec((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ── Auto-save to localStorage on every event ─────────────────────────────────
  useEffect(() => {
    const session: MBSession = {
      homeTeam, awayTeam, sport, formation,
      date: new Date().toISOString().split("T")[0],
      events,
    };
    localStorage.setItem("gs_match_brain_events", JSON.stringify(session));

    // Mirror shot events → xG Analysis (gs_touch_tracker) live
    const shots = events
      .filter((e): e is ShotEv => e.type === "shot")
      .map((e) => ({
        id: e.id,
        team: e.team,
        zone: ZONE_LABEL_TO_ID[e.zone] ?? "long_range",
        xg: e.xg,
        isGoal: e.isGoal,
        minute: e.min,
      }));
    try {
      localStorage.setItem("gs_touch_tracker", JSON.stringify({ homeTeam, awayTeam, shots }));
    } catch { /* storage full */ }
  }, [events, homeTeam, awayTeam, sport, formation]);

  // ── Append to Season Intelligence history at the end of each half/quarter ─────
  useEffect(() => {
    if ((phase !== "break" && phase !== "ended") || appendedPeriodsRef.current.has(period)) return;
    appendedPeriodsRef.current.add(period);

    const periodLabel = periodsN === 4 ? `Q${period}` : period === 1 ? "H1" : "H2";

    const shotEvs = events.filter((e): e is ShotEv => e.type === "shot" && e.period === period);
    const homeXg   = shotEvs.filter((e) => e.team === "home").reduce((s, e) => s + e.xg, 0);
    const awayXg   = shotEvs.filter((e) => e.team === "away").reduce((s, e) => s + e.xg, 0);
    const homeGoals = shotEvs.filter((e) => e.team === "home" && e.isGoal).length;
    const awayGoals = shotEvs.filter((e) => e.team === "away" && e.isGoal).length;

    const record = {
      id: `mb-${Date.now()}-p${period}`,
      date: new Date().toISOString().slice(0, 10),
      homeTeam: `${homeTeam} (${periodLabel})`,
      awayTeam,
      homeXg:   Math.round(homeXg * 100) / 100,
      awayXg:   Math.round(awayXg * 100) / 100,
      homeGoals,
      awayGoals,
    };

    try {
      const prev = JSON.parse(localStorage.getItem("gs_touch_tracker_history") ?? "[]");
      const updated = [record, ...(Array.isArray(prev) ? prev : [])].slice(0, 20);
      localStorage.setItem("gs_touch_tracker_history", JSON.stringify(updated));
    } catch {
      localStorage.setItem("gs_touch_tracker_history", JSON.stringify([record]));
    }
  }, [phase, period, events, homeTeam, awayTeam, periodsN]);

  // ── Phase transitions ────────────────────────────────────────────────────────
  function handleStartPeriod() {
    setPeriodSec(0);
    setPhase("live");
    startTimer();
  }

  function handleEndPeriod() {
    stopTimer();
    if (period >= periodsN) {
      setPhase("ended");
    } else {
      setPhase("break");
    }
  }

  function handleStartNextPeriod() {
    setPeriod((p) => p + 1);
    setPeriodSec(0);
    setPhase("live");
    startTimer();
  }

  // ── Event loggers ────────────────────────────────────────────────────────────
  function logEvent(ev: MatchEvent) {
    setEvents((prev) => [...prev, ev]);
  }

  function handleTouch() {
    logEvent({
      id: uid(), type: "touch", team, player: touchPlayer,
      min: globalMin, sec: periodSec % 60, period, periodMin: Math.floor(periodSec / 60),
    });
  }

  function handleShot() {
    const zoneData = SHOT_ZONES.find((z) => z.label === shotZone) ?? SHOT_ZONES[0];
    logEvent({
      id: uid(), type: "shot", team, zone: shotZone, xg: zoneData.xg,
      isGoal: shotGoal, min: globalMin, period, periodMin: Math.floor(periodSec / 60),
    });
    setShotGoal(false);
  }

  function handlePass() {
    logEvent({
      id: uid(), type: "pass", team, fromPlayer, toPlayer, passType,
      min: globalMin, period, periodMin: Math.floor(periodSec / 60),
    });
  }

  function handleZone() {
    logEvent({
      id: uid(), type: "zone", team, player: touchPlayer, pitchZone,
      min: globalMin, period, periodMin: Math.floor(periodSec / 60),
    });
  }

  function removeEvent(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Phase: warmup ────────────────────────────────────────────────────────────
  if (phase === "warmup") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#1a5c2a] flex items-center justify-center mx-auto">
            <Brain size={32} className="text-[#c8962a]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a] mb-1">Match Brain</p>
            <h1 className="text-2xl font-black text-white">{homeTeam} vs {awayTeam}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {sport} · {formation} · {periodsN} {periodsN === 2 ? "halves" : "quarters"}
            </p>
          </div>
          <button
            onClick={handleStartPeriod}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1a5c2a] py-4 text-sm font-bold text-white hover:bg-green-800 transition-all"
          >
            <Play size={16} fill="currentColor" />
            Start {PERIOD_LABEL} 1
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: break ─────────────────────────────────────────────────────────────
  if (phase === "break") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">{PERIOD_LABEL} {period} Complete</p>
          <h2 className="text-2xl font-black text-white">Break</h2>
          <div className="rounded-2xl bg-[#161b22] border border-white/10 p-4 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Touches</span>
              <span className="text-white font-bold">{homeTeam} {homeTouches} – {awayTouches} {awayTeam}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Shots</span>
              <span className="text-white font-bold">{homeTeam} {homeShots} – {awayShots} {awayTeam}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Events logged</span>
              <span className="text-white font-bold">{events.length}</span>
            </div>
          </div>
          <button
            onClick={handleStartNextPeriod}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1a5c2a] py-4 text-sm font-bold text-white hover:bg-green-800 transition-all"
          >
            <Play size={16} fill="currentColor" />
            Start {PERIOD_LABEL} {period + 1}
          </button>
        </div>
      </div>
    );
  }

  // ── Phase: ended ─────────────────────────────────────────────────────────────
  if (phase === "ended") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#c8962a]">Match Complete</p>
          <h2 className="text-2xl font-black text-white">{homeTeam} vs {awayTeam}</h2>
          <div className="rounded-2xl bg-[#161b22] border border-white/10 p-4 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total events</span>
              <span className="text-white font-bold">{events.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Touches</span>
              <span className="text-white font-bold">{homeTeam} {homeTouches} – {awayTouches} {awayTeam}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Shots</span>
              <span className="text-white font-bold">{homeTeam} {homeShots} – {awayShots} {awayTeam}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">Session saved — open any analysis tool to explore the data.</p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/analyst/pass-map")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1a5c2a] py-3.5 text-sm font-bold text-white hover:bg-green-800 transition-all"
            >
              <ChevronRight size={14} /> Open Pass Map
            </button>
            <button
              onClick={() => router.push("/analyst/xg-analysis")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/5 transition-all"
            >
              <Target size={14} /> Open xG Analysis
            </button>
            <button
              onClick={() => router.push("/analyst/season")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/5 transition-all"
            >
              <ChevronRight size={14} /> Open Season Intelligence
            </button>
            <button
              onClick={() => router.push("/analyst/heatmaps")}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 text-sm font-bold text-gray-300 hover:bg-white/5 transition-all"
            >
              <ChevronRight size={14} /> Open Heatmaps
            </button>
            <button
              onClick={() => router.push("/analyst/match-brain")}
              className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors py-2"
            >
              New Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: live ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">

      {/* Sticky header — timer + end period */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-white/10 shrink-0">
        <div>
          <p className="text-xs font-bold text-[#c8962a] uppercase tracking-wide">
            {PERIOD_LABEL} {period}/{periodsN}
          </p>
          <p className="text-xs text-gray-500">{homeTeam} vs {awayTeam}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-mono font-black text-white">{mm}:{ss}</p>
          <p className="text-[10px] text-gray-500">min {globalMin + 1}</p>
        </div>
        <button
          onClick={handleEndPeriod}
          className="flex items-center gap-1.5 rounded-xl bg-red-600/90 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
        >
          <Square size={10} fill="currentColor" />
          End {PERIOD_LABEL}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">

        {/* Team selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTeam("home")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              team === "home"
                ? "bg-[#1a5c2a] border-[#1a5c2a] text-white"
                : "bg-[#161b22] border-white/10 text-gray-400 hover:border-white/20"
            }`}
          >
            {homeTeam}
          </button>
          <button
            onClick={() => setTeam("away")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              team === "away"
                ? "bg-blue-700 border-blue-700 text-white"
                : "bg-[#161b22] border-white/10 text-gray-400 hover:border-white/20"
            }`}
          >
            {awayTeam}
          </button>
        </div>

        {/* Event type tabs */}
        <div className="flex gap-1 rounded-xl bg-[#161b22] p-1 border border-white/10">
          {(["touch", "shot", "pass", "zone"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === t
                  ? "bg-[#c8962a] text-white"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Touch tab ── */}
        {activeTab === "touch" && (
          <div className="rounded-2xl bg-[#161b22] border border-white/10 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Player #</p>
            <input
              type="number" min={1} max={99}
              value={touchPlayer}
              onChange={(e) => setTouchPlayer(parseInt(e.target.value) || 1)}
              className="w-full rounded-xl bg-[#0d1117] border border-white/10 px-4 py-2.5 text-lg font-bold text-white outline-none focus:border-[#c8962a] text-center"
            />
            <button
              onClick={handleTouch}
              className="w-full py-3.5 rounded-xl bg-[#c8962a] text-sm font-bold text-white hover:bg-amber-600 transition-colors"
            >
              Log Touch
            </button>
          </div>
        )}

        {/* ── Shot tab ── */}
        {activeTab === "shot" && (
          <div className="rounded-2xl bg-[#161b22] border border-white/10 p-4 space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Zone</p>
            <div className="grid grid-cols-3 gap-1.5">
              {SHOT_ZONES.map((z) => (
                <button
                  key={z.label}
                  onClick={() => setShotZone(z.label)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                    shotZone === z.label
                      ? "bg-[#c8962a] border-[#c8962a] text-white"
                      : "bg-[#0d1117] border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <span className="block truncate">{z.label}</span>
                  <span className="block text-[10px] opacity-70">xG {z.xg}</span>
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shotGoal}
                onChange={(e) => setShotGoal(e.target.checked)}
                className="w-4 h-4 rounded accent-[#c8962a]"
              />
              <span className="text-sm font-bold text-white">Goal</span>
            </label>
            <button
              onClick={handleShot}
              className="w-full py-3.5 rounded-xl bg-[#c8962a] text-sm font-bold text-white hover:bg-amber-600 transition-colors"
            >
              Log Shot{shotGoal ? " (GOAL)" : ""}
            </button>
          </div>
        )}

        {/* ── Pass tab ── */}
        {activeTab === "pass" && (
          <div className="rounded-2xl bg-[#161b22] border border-white/10 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">From #</p>
                <input
                  type="number" min={1} max={99}
                  value={fromPlayer}
                  onChange={(e) => setFromPlayer(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl bg-[#0d1117] border border-white/10 px-3 py-2.5 text-sm font-bold text-white text-center outline-none focus:border-[#c8962a]"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">To #</p>
                <input
                  type="number" min={1} max={99}
                  value={toPlayer}
                  onChange={(e) => setToPlayer(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl bg-[#0d1117] border border-white/10 px-3 py-2.5 text-sm font-bold text-white text-center outline-none focus:border-[#c8962a]"
                />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pass Type</p>
            <div className="flex flex-wrap gap-1.5">
              {PASS_TYPES.map((pt) => (
                <button
                  key={pt}
                  onClick={() => setPassType(pt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition-all ${
                    passType === pt
                      ? "bg-[#c8962a] border-[#c8962a] text-white"
                      : "bg-[#0d1117] border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {pt}
                </button>
              ))}
            </div>
            <button
              onClick={handlePass}
              className="w-full py-3.5 rounded-xl bg-[#c8962a] text-sm font-bold text-white hover:bg-amber-600 transition-colors"
            >
              Log Pass
            </button>
          </div>
        )}

        {/* ── Zone tab ── */}
        {activeTab === "zone" && (
          <div className="rounded-2xl bg-[#161b22] border border-white/10 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Player #</p>
                <input
                  type="number" min={1} max={99}
                  value={touchPlayer}
                  onChange={(e) => setTouchPlayer(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl bg-[#0d1117] border border-white/10 px-3 py-2.5 text-sm font-bold text-white text-center outline-none focus:border-[#c8962a]"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Pitch Zone</p>
                <select
                  value={pitchZone}
                  onChange={(e) => setPitchZone(e.target.value)}
                  className="w-full rounded-xl bg-[#0d1117] border border-white/10 px-3 py-2.5 text-xs font-bold text-white outline-none focus:border-[#c8962a]"
                >
                  {PITCH_ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleZone}
              className="w-full py-3.5 rounded-xl bg-[#c8962a] text-sm font-bold text-white hover:bg-amber-600 transition-colors"
            >
              Log Zone Entry
            </button>
          </div>
        )}

        {/* Mini event log */}
        {events.length > 0 && (
          <div className="rounded-2xl bg-[#161b22] border border-white/10 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Events</p>
              <span className="text-xs font-bold text-[#c8962a]">{events.length} total</span>
            </div>
            <div className="divide-y divide-white/5 max-h-48 overflow-auto">
              {[...events].reverse().slice(0, 20).map((ev) => (
                <div key={ev.id} className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${ev.team === "home" ? "bg-[#1a5c2a]" : "bg-blue-500"}`} />
                    <span className="text-xs text-gray-300 font-medium capitalize">{ev.type}</span>
                    {ev.type === "shot"  && <span className="text-[10px] text-gray-500 truncate">{ev.zone}</span>}
                    {ev.type === "pass"  && <span className="text-[10px] text-gray-500">{ev.passType} {ev.fromPlayer}→{ev.toPlayer}</span>}
                    {ev.type === "touch" && <span className="text-[10px] text-gray-500">#{ev.player}</span>}
                    {ev.type === "zone"  && <span className="text-[10px] text-gray-500 truncate">{ev.pitchZone}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] text-gray-500">{ev.min}&apos;</span>
                    <button onClick={() => removeEvent(ev.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom spacer so content clears mobile nav */}
        <div className="h-6" />
      </div>
    </div>
  );
}

// ── Page export — Suspense required by Next.js 14 for useSearchParams ────────────
export default function MatchBrainSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading session...</p>
      </div>
    }>
      <MatchBrainSession />
    </Suspense>
  );
}
