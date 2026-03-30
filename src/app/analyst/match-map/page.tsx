"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Target, ArrowRight, Trash2, Copy, Check, RotateCcw, X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "shot" | "pass";

interface ShotMarker {
  id: string;
  team: "home" | "away";
  zoneId: string;
  zoneLabel: string;
  xg: number;
  minute: number;
  isGoal: boolean;
  svgX: number;
  svgY: number;
}

interface PassArrow {
  id: string;
  team: "home" | "away";
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  completed: boolean;
  minute: number;
}

// ── xG Zones (attack toward TOP of pitch, y=0 = goal) ────────────────────────

const ZONES = [
  { id: "six_yard",        label: "Six-Yard Box",   xg: 0.76, x: 115, y: 14,  w: 70,  h: 22  },
  { id: "penalty_spot",    label: "Penalty Spot",    xg: 0.45, x: 115, y: 36,  w: 70,  h: 32  },
  { id: "central_box",     label: "Central Box",     xg: 0.35, x: 115, y: 68,  w: 70,  h: 26  },
  { id: "wide_box_left",   label: "Wide Box Left",   xg: 0.12, x: 75,  y: 14,  w: 40,  h: 80  },
  { id: "wide_box_right",  label: "Wide Box Right",  xg: 0.12, x: 185, y: 14,  w: 40,  h: 80  },
  { id: "edge_centre",     label: "Edge Centre",     xg: 0.18, x: 100, y: 94,  w: 100, h: 46  },
  { id: "edge_wide_left",  label: "Edge Left",       xg: 0.07, x: 44,  y: 94,  w: 56,  h: 46  },
  { id: "edge_wide_right", label: "Edge Right",      xg: 0.07, x: 200, y: 94,  w: 56,  h: 46  },
  { id: "long_range",      label: "Long Range",      xg: 0.04, x: 10,  y: 140, w: 280, h: 80  },
];

function getZoneAt(x: number, y: number) {
  for (const z of ZONES) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
  }
  return null;
}

function zoneFill(xg: number) {
  if (xg >= 0.5)  return "#dc262655";
  if (xg >= 0.3)  return "#ea580c55";
  if (xg >= 0.15) return "#ca8a0455";
  if (xg >= 0.1)  return "#6b728044";
  return "#37415133";
}

function shotRingColor(xg: number) {
  if (xg >= 0.5)  return "#ef4444";
  if (xg >= 0.3)  return "#f97316";
  if (xg >= 0.15) return "#eab308";
  return "#6b7280";
}

const TEAM = {
  home: { arrow: "#60a5fa", badge: "bg-blue-500/15 text-blue-400",   btn: "bg-blue-600 text-white"   },
  away: { arrow: "#fb923c", badge: "bg-orange-500/15 text-orange-400", btn: "bg-orange-600 text-white" },
};

const VW = 300;
const VH = 440;

// ── Pitch SVG component ───────────────────────────────────────────────────────

function PitchSVG({
  mode, shots, passes, passStart, team,
  onPitchClick, onRemoveShot, onRemovePass,
}: {
  mode: Mode;
  shots: ShotMarker[];
  passes: PassArrow[];
  passStart: { x: number; y: number } | null;
  team: "home" | "away";
  onPitchClick: (x: number, y: number) => void;
  onRemoveShot: (id: string) => void;
  onRemovePass: (id: string) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);

  const toSvg = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = ref.current;
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width)  * VW,
      y: ((e.clientY - r.top)  / r.height) * VH,
    };
  };

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VW} ${VH}`}
      onClick={(e) => { const p = toSvg(e); if (p) onPitchClick(p.x, p.y); }}
      className="w-full rounded-2xl border border-white/10 touch-manipulation select-none"
      style={{ background: "#1a4a1a", cursor: mode === "pass" ? "crosshair" : "pointer", maxHeight: 520 }}
    >
      {/* Grass stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x="0" y={i * 44} width="300" height="22"
          fill={i % 2 === 0 ? "#1a4a1a" : "#1d501d"} />
      ))}

      {/* Boundary */}
      <rect x="10" y="8" width="280" height="424" fill="none" stroke="#ffffff35" strokeWidth="1.5" />

      {/* ── Top goal & area ── */}
      <rect x="120" y="2"  width="60" height="7" fill="#ffffff12" stroke="#ffffffaa" strokeWidth="1.5" />
      <rect x="115" y="9"  width="70" height="22" fill="none" stroke="#ffffff30" strokeWidth="1" />
      <rect x="75"  y="9"  width="150" height="86" fill="none" stroke="#ffffff30" strokeWidth="1" />
      <circle cx="150" cy="62" r="2.5" fill="#ffffff66" />
      <path d="M 110 95 A 40 40 0 0 0 190 95" fill="none" stroke="#ffffff22" strokeWidth="1" />
      <text x="150" y="19" textAnchor="middle" fontSize="6" fill="#ffffff44"
        style={{ userSelect: "none" }}>GOAL ▲</text>

      {/* ── Centre ── */}
      <line x1="10" y1="220" x2="290" y2="220" stroke="#ffffff30" strokeWidth="1" />
      <circle cx="150" cy="220" r="42" fill="none" stroke="#ffffff25" strokeWidth="1" />
      <circle cx="150" cy="220" r="2.5" fill="#ffffff55" />

      {/* ── Bottom goal & area ── */}
      <rect x="120" y="431" width="60" height="7" fill="#ffffff12" stroke="#ffffffaa" strokeWidth="1.5" />
      <rect x="115" y="409" width="70" height="22" fill="none" stroke="#ffffff30" strokeWidth="1" />
      <rect x="75"  y="345" width="150" height="86" fill="none" stroke="#ffffff30" strokeWidth="1" />
      <circle cx="150" cy="378" r="2.5" fill="#ffffff66" />
      <path d="M 110 345 A 40 40 0 0 1 190 345" fill="none" stroke="#ffffff22" strokeWidth="1" />
      <text x="150" y="428" textAnchor="middle" fontSize="6" fill="#ffffff44"
        style={{ userSelect: "none" }}>GOAL ▼</text>

      {/* ── xG zones (shot mode, top half only) ── */}
      {mode === "shot" && ZONES.map((z) => (
        <rect key={z.id} x={z.x} y={z.y} width={z.w} height={z.h}
          fill={zoneFill(z.xg)} stroke="#ffffff18" strokeWidth="0.5" rx="2" />
      ))}

      {/* ── Zone xG labels (shot mode) ── */}
      {mode === "shot" && ZONES.map((z) => z.h >= 26 && (
        <text key={z.id + "_lbl"} x={z.x + z.w / 2} y={z.y + z.h / 2 + 4}
          textAnchor="middle" fontSize="7.5" fontWeight="700"
          fill="#ffffffbb" style={{ userSelect: "none", pointerEvents: "none" }}>
          {z.xg}
        </text>
      ))}

      {/* ── Existing pass arrows ── */}
      {passes.map((p) => {
        const color = TEAM[p.team].arrow;
        const dx = p.toX - p.fromX;
        const dy = p.toY - p.fromY;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const hx = p.toX - (dx / len) * 10;
        const hy = p.toY - (dy / len) * 10;
        const passColor = p.completed ? color : "#ef4444";
        return (
          <g key={p.id}>
            <line x1={p.fromX} y1={p.fromY} x2={p.toX} y2={p.toY}
              stroke={passColor} strokeWidth="2.5"
              strokeDasharray={p.completed ? "none" : "5 3"} opacity="0.85" />
            {/* Arrowhead dot */}
            <circle cx={hx} cy={hy} r="4" fill={passColor} opacity="0.9" />
            {/* Origin dot */}
            <circle cx={p.fromX} cy={p.fromY} r="3" fill={passColor} opacity="0.7" />
            {/* Minute label */}
            <text x={(p.fromX + p.toX) / 2} y={(p.fromY + p.toY) / 2 - 5}
              textAnchor="middle" fontSize="6.5" fill="#ffffffcc"
              style={{ userSelect: "none", pointerEvents: "none" }}>
              {p.minute}&apos;
            </text>
            {/* Invisible hit area to remove */}
            <line x1={p.fromX} y1={p.fromY} x2={p.toX} y2={p.toY}
              stroke="transparent" strokeWidth="14"
              onClick={(e) => { e.stopPropagation(); onRemovePass(p.id); }}
              style={{ cursor: "pointer" }} />
          </g>
        );
      })}

      {/* ── Pass origin indicator (waiting for second tap) ── */}
      {passStart && (
        <g>
          <circle cx={passStart.x} cy={passStart.y} r="10"
            fill="none" stroke="#f0b429" strokeWidth="2" strokeDasharray="3 2" />
          <circle cx={passStart.x} cy={passStart.y} r="4" fill="#f0b429" />
          <text x={passStart.x} y={passStart.y - 14}
            textAnchor="middle" fontSize="7" fill="#f0b429"
            style={{ userSelect: "none", pointerEvents: "none" }}>
            Tap end point
          </text>
        </g>
      )}

      {/* ── Shot markers ── */}
      {shots.map((s) => {
        const ring = shotRingColor(s.xg);
        const teamColor = TEAM[s.team].arrow;
        return (
          <g key={s.id}>
            {/* Outer glow ring */}
            <circle cx={s.svgX} cy={s.svgY} r="11"
              fill={ring + "22"} stroke={teamColor} strokeWidth="1.5" />
            {/* Filled dot coloured by xG danger */}
            <circle cx={s.svgX} cy={s.svgY} r="5" fill={ring} />
            {/* Goal star overlay */}
            {s.isGoal && (
              <text x={s.svgX} y={s.svgY + 4}
                textAnchor="middle" fontSize="7"
                style={{ userSelect: "none", pointerEvents: "none" }}>⚽</text>
            )}
            {/* Minute */}
            <text x={s.svgX} y={s.svgY - 14}
              textAnchor="middle" fontSize="6.5" fill="#ffffffcc"
              style={{ userSelect: "none", pointerEvents: "none" }}>
              {s.minute}&apos;
            </text>
            {/* Tap to remove */}
            <circle cx={s.svgX} cy={s.svgY} r="11" fill="transparent"
              onClick={(e) => { e.stopPropagation(); onRemoveShot(s.id); }}
              style={{ cursor: "pointer" }} />
          </g>
        );
      })}
    </svg>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const LS_SHOTS  = "gs_matchmap_shots";
const LS_PASSES = "gs_matchmap_passes";

export default function MatchMapPage() {
  const [mode,      setMode]      = useState<Mode>("shot");
  const [team,      setTeam]      = useState<"home" | "away">("home");
  const [minute,    setMinute]    = useState(1);
  const [isGoal,    setIsGoal]    = useState(false);
  const [completed, setCompleted] = useState(true);
  const [passStart, setPassStart] = useState<{ x: number; y: number } | null>(null);
  const [copied,    setCopied]    = useState(false);

  const [shots, setShots] = useState<ShotMarker[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_SHOTS) ?? "[]"); } catch { return []; }
  });
  const [passes, setPasses] = useState<PassArrow[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_PASSES) ?? "[]"); } catch { return []; }
  });

  useEffect(() => { try { localStorage.setItem(LS_SHOTS,  JSON.stringify(shots));  } catch {} }, [shots]);
  useEffect(() => { try { localStorage.setItem(LS_PASSES, JSON.stringify(passes)); } catch {} }, [passes]);

  const handlePitchClick = (x: number, y: number) => {
    if (mode === "shot") {
      const zone = getZoneAt(x, y);
      if (!zone) return;
      setShots(prev => [...prev, {
        id: crypto.randomUUID(),
        team, zoneId: zone.id, zoneLabel: zone.label,
        xg: zone.xg, minute, isGoal,
        svgX: x, svgY: y,
      }]);
      setIsGoal(false);
    } else {
      if (!passStart) {
        setPassStart({ x, y });
      } else {
        setPasses(prev => [...prev, {
          id: crypto.randomUUID(),
          team, fromX: passStart.x, fromY: passStart.y,
          toX: x, toY: y, completed, minute,
        }]);
        setPassStart(null);
      }
    }
  };

  // Computed stats
  const homeShots      = shots.filter(s => s.team === "home");
  const awayShots      = shots.filter(s => s.team === "away");
  const homeXg         = homeShots.reduce((s, x) => s + x.xg, 0);
  const awayXg         = awayShots.reduce((s, x) => s + x.xg, 0);
  const homeGoals      = homeShots.filter(s => s.isGoal).length;
  const awayGoals      = awayShots.filter(s => s.isGoal).length;
  const homePasses     = passes.filter(p => p.team === "home");
  const awayPasses     = passes.filter(p => p.team === "away");
  const homeCompleted  = homePasses.filter(p => p.completed).length;
  const awayCompleted  = awayPasses.filter(p => p.completed).length;
  const homePassPct    = homePasses.length ? Math.round(homeCompleted / homePasses.length * 100) : 0;
  const awayPassPct    = awayPasses.length ? Math.round(awayCompleted / awayPasses.length * 100) : 0;

  const reset = () => { setShots([]); setPasses([]); setPassStart(null); };

  const exportText = () => {
    const lines = [
      "📊 MATCH MAP REPORT",
      `Home xG: ${homeXg.toFixed(2)} | ${homeGoals} goals from ${homeShots.length} shots`,
      `Away xG: ${awayXg.toFixed(2)} | ${awayGoals} goals from ${awayShots.length} shots`,
      `Home passes: ${homeCompleted}/${homePasses.length} (${homePassPct}%)`,
      `Away passes: ${awayCompleted}/${awayPasses.length} (${awayPassPct}%)`,
      "",
      "SHOTS:",
      ...shots.map(s => `  ${s.minute}' [${s.team.toUpperCase()}] ${s.zoneLabel} — xG ${s.xg}${s.isGoal ? " ✅ GOAL" : ""}`),
      "",
      "PASSES:",
      ...passes.map(p => `  ${p.minute}' [${p.team.toUpperCase()}] ${p.completed ? "✅ Completed" : "❌ Intercepted"}`),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Sorted combined event log
  const allEvents = [
    ...shots.map(s  => ({ ...s, type: "shot" as const, sortMin: s.minute })),
    ...passes.map(p => ({ ...p, type: "pass" as const, sortMin: p.minute })),
  ].sort((a, b) => a.sortMin - b.sortMin);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-4 lg:p-6">

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Match Map</h1>
            <p className="text-xs text-muted-foreground italic">
              Tap pitch to log shots &amp; passes — live during or after the match
            </p>
          </div>
          <button onClick={reset} title="Reset all"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={exportText}
            className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
            {copied
              ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</>
              : <><Copy className="h-3.5 w-3.5" /> Export</>}
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_290px]">

          {/* ── Left: controls + pitch ── */}
          <div className="space-y-3">

            {/* Mode + Team toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex rounded-xl border overflow-hidden">
                <button onClick={() => { setMode("shot"); setPassStart(null); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors
                    ${mode === "shot" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}>
                  <Target className="h-3.5 w-3.5" /> Shot
                </button>
                <button onClick={() => setMode("pass")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors
                    ${mode === "pass" ? "bg-blue-600 text-white" : "hover:bg-muted text-muted-foreground"}`}>
                  <ArrowRight className="h-3.5 w-3.5" /> Pass
                </button>
              </div>

              <div className="flex rounded-xl border overflow-hidden">
                {(["home", "away"] as const).map(t => (
                  <button key={t} onClick={() => setTeam(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors
                      ${team === t ? TEAM[t].btn : "hover:bg-muted text-muted-foreground"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Options bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-card/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Min</label>
                <input type="number" min={1} max={120} value={minute}
                  onChange={e => setMinute(Math.max(1, Math.min(120, Number(e.target.value))))}
                  className="w-16 rounded-lg border bg-background px-2 py-1.5 text-sm text-center outline-none focus:ring-1 focus:ring-ring" />
              </div>

              {mode === "shot" ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={isGoal} onChange={e => setIsGoal(e.target.checked)}
                    className="h-4 w-4 rounded" />
                  <span className="text-sm">Goal ⚽</span>
                </label>
              ) : (
                <div className="flex rounded-lg border overflow-hidden text-xs font-semibold">
                  <button onClick={() => setCompleted(true)}
                    className={`px-3 py-1.5 transition-colors ${completed ? "bg-green-600 text-white" : "hover:bg-muted text-muted-foreground"}`}>
                    Completed
                  </button>
                  <button onClick={() => setCompleted(false)}
                    className={`px-3 py-1.5 transition-colors ${!completed ? "bg-red-600 text-white" : "hover:bg-muted text-muted-foreground"}`}>
                    Intercepted
                  </button>
                </div>
              )}

              {/* Contextual hint */}
              <span className="ml-auto text-xs text-muted-foreground">
                {mode === "shot" && "Tap coloured zone →"}
                {mode === "pass" && !passStart && "Tap pass origin →"}
                {mode === "pass" && passStart && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    Tap destination
                    <button onClick={() => setPassStart(null)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </span>
            </div>

            {/* Pitch */}
            <PitchSVG
              mode={mode} shots={shots} passes={passes}
              passStart={passStart} team={team}
              onPitchClick={handlePitchClick}
              onRemoveShot={id => setShots(prev => prev.filter(s => s.id !== id))}
              onRemovePass={id => setPasses(prev => prev.filter(p => p.id !== id))}
            />

            <p className="text-center text-xs text-muted-foreground pb-1">
              {mode === "shot"
                ? "Zones coloured by danger (🔴 high xG → ⚫ low). Tap existing shot to remove it."
                : "Solid line = completed pass · Dashed = intercepted. Tap line to remove."}
            </p>
          </div>

          {/* ── Right: stats + event log ── */}
          <div className="space-y-4">

            {/* Live stats grid */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Stats</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Home xG",  value: homeXg.toFixed(2),  sub: `${homeGoals} goals / ${homeShots.length} shots`,  color: "blue"   },
                  { label: "Away xG",  value: awayXg.toFixed(2),  sub: `${awayGoals} goals / ${awayShots.length} shots`,  color: "orange" },
                  { label: "Home Pass",value: `${homeCompleted}/${homePasses.length}`, sub: `${homePassPct}% completed`, color: "blue"   },
                  { label: "Away Pass",value: `${awayCompleted}/${awayPasses.length}`, sub: `${awayPassPct}% completed`, color: "orange" },
                ].map(({ label, value, sub, color }) => (
                  <div key={label}
                    className={`rounded-xl border p-3 text-center
                      ${color === "blue"   ? "border-blue-500/20 bg-blue-500/10"   : "border-orange-500/20 bg-orange-500/10"}`}>
                    <p className={`text-[10px] font-medium ${color === "blue" ? "text-blue-400" : "text-orange-400"}`}>{label}</p>
                    <p className={`text-xl font-black ${color === "blue" ? "text-blue-400" : "text-orange-400"}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* xG colour key */}
            <div className="rounded-2xl border border-white/10 bg-card/60 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Zone Key</p>
              {ZONES.slice(0, 6).map(z => (
                <div key={z.id} className="flex items-center gap-2">
                  <div className="h-3 w-3 flex-shrink-0 rounded-sm"
                    style={{ background: z.xg >= 0.5 ? "#ef4444" : z.xg >= 0.3 ? "#f97316" : z.xg >= 0.15 ? "#eab308" : "#6b7280" }} />
                  <span className="flex-1 text-xs text-muted-foreground">{z.label}</span>
                  <span className="text-xs font-bold">{z.xg}</span>
                </div>
              ))}
            </div>

            {/* Event log */}
            <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Events ({allEvents.length})
                </p>
                {allEvents.length > 0 && (
                  <button onClick={reset}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                    Clear all
                  </button>
                )}
              </div>

              {allEvents.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No events yet — tap the pitch to start
                </p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {allEvents.map(ev => (
                    <div key={ev.id} className="flex items-center gap-2 px-4 py-2.5">
                      <span className="w-7 shrink-0 text-xs font-bold text-muted-foreground">
                        {ev.minute}&apos;
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${TEAM[ev.team].badge}`}>
                        {ev.team[0].toUpperCase()}
                      </span>
                      {ev.type === "shot" ? (
                        <>
                          <Target className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate text-xs">{ev.zoneLabel}</span>
                          <span className="text-xs font-bold shrink-0">{ev.xg}</span>
                          {ev.isGoal && <span className="text-xs shrink-0">⚽</span>}
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 text-xs">
                            {ev.completed ? "Pass ✓" : "Intercepted ✗"}
                          </span>
                        </>
                      )}
                      <button
                        onClick={() => ev.type === "shot"
                          ? setShots(prev => prev.filter(s => s.id !== ev.id))
                          : setPasses(prev => prev.filter(p => p.id !== ev.id))
                        }
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
