"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Copy, Check, Database, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { getMatch, extractShots } from "@/lib/analyst-api";
import { MatchLoader } from "@/components/analyst/match-loader";

// Zone definitions — each zone has SVG coordinates for the pitch diagram
const XG_ZONES = [
  { id: "six_yard",        label: "Six-Yard Box",        xg: 0.76, x: 115, y: 0,   w: 70,  h: 28  },
  { id: "penalty_spot",    label: "Penalty Spot",         xg: 0.45, x: 115, y: 28,  w: 70,  h: 38  },
  { id: "central_box",     label: "Central Box",          xg: 0.35, x: 115, y: 66,  w: 70,  h: 24  },
  { id: "wide_box_left",   label: "Wide Box Left",        xg: 0.12, x: 75,  y: 0,   w: 40,  h: 90  },
  { id: "wide_box_right",  label: "Wide Box Right",       xg: 0.12, x: 185, y: 0,   w: 40,  h: 90  },
  { id: "edge_centre",     label: "Edge of Box (Centre)", xg: 0.18, x: 100, y: 90,  w: 100, h: 42  },
  { id: "edge_wide_left",  label: "Edge Left",            xg: 0.07, x: 44,  y: 90,  w: 56,  h: 42  },
  { id: "edge_wide_right", label: "Edge Right",           xg: 0.07, x: 200, y: 90,  w: 56,  h: 42  },
  { id: "long_range",      label: "Long Range",           xg: 0.04, x: 0,   y: 132, w: 300, h: 68  },
];

interface Shot {
  id: string;
  team: "home" | "away";
  zone: string;
  xg: number;
  minute: number;
  isGoal: boolean;
}

function xgColor(xg: number) {
  if (xg >= 0.5) return "bg-red-500/80";
  if (xg >= 0.3) return "bg-orange-500/80";
  if (xg >= 0.15) return "bg-yellow-500/80";
  return "bg-zinc-500/60";
}

// Fill colour per zone based on xG danger level
function zoneFill(xg: number, selected: boolean): string {
  const base =
    xg >= 0.5  ? "#dc2626" :   // red
    xg >= 0.3  ? "#ea580c" :   // orange
    xg >= 0.15 ? "#ca8a04" :   // amber
    xg >= 0.1  ? "#6b7280" :   // gray
                 "#374151";    // dark gray
  return selected ? base : base + "55"; // 55 = ~33% opacity when not selected
}

// ── Clickable pitch diagram ────────────────────────────────────────────────────
function PitchZonePicker({
  selectedZone,
  onSelect,
}: {
  selectedZone: string;
  onSelect: (id: string) => void;
}) {
  const selected = XG_ZONES.find((z) => z.id === selectedZone);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">
        Tap zone on pitch
      </label>
      {/* SVG pitch — viewBox 300×200, goal at top */}
      <svg
        viewBox="0 0 300 200"
        className="w-full rounded-xl border border-white/10 touch-manipulation"
        style={{ background: "#1a4a1a", maxHeight: 240 }}
      >
        {/* Pitch outline */}
        <rect x="0" y="0" width="300" height="200" fill="none" stroke="#ffffff22" strokeWidth="1" />

        {/* Penalty area outline */}
        <rect x="75" y="0" width="150" height="90" fill="none" stroke="#ffffff33" strokeWidth="1" />

        {/* Six-yard box outline */}
        <rect x="115" y="0" width="70" height="28" fill="none" stroke="#ffffff33" strokeWidth="1" />

        {/* Goal mouth */}
        <rect x="120" y="0" width="60" height="6" fill="#ffffff18" stroke="#ffffffaa" strokeWidth="1.5" />

        {/* Penalty spot dot */}
        <circle cx="150" cy="60" r="2.5" fill="#ffffff66" />

        {/* Penalty arc (half-circle below penalty area) */}
        <path d="M 110 90 A 40 40 0 0 0 190 90" fill="none" stroke="#ffffff22" strokeWidth="1" />

        {/* Centre circle arc at bottom */}
        <path d="M 0 200 Q 150 140 300 200" fill="none" stroke="#ffffff15" strokeWidth="1" />

        {/* Midfield line */}
        <line x1="0" y1="200" x2="300" y2="200" stroke="#ffffff20" strokeWidth="1" />

        {/* Zone rectangles — clickable */}
        {XG_ZONES.map((z) => {
          const isSelected = z.id === selectedZone;
          return (
            <g key={z.id} onClick={() => onSelect(z.id)} style={{ cursor: "pointer" }}>
              <rect
                x={z.x} y={z.y} width={z.w} height={z.h}
                fill={zoneFill(z.xg, isSelected)}
                stroke={isSelected ? "#ffffff" : "#ffffff22"}
                strokeWidth={isSelected ? 2 : 0.5}
                rx="2"
              />
              {/* xG value label — only in larger zones */}
              {z.h >= 30 && (
                <text
                  x={z.x + z.w / 2}
                  y={z.y + z.h / 2 - 4}
                  textAnchor="middle"
                  fontSize="7"
                  fill={isSelected ? "#ffffff" : "#ffffffaa"}
                  fontWeight={isSelected ? "700" : "400"}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {z.label.split(" ")[0]}
                </text>
              )}
              <text
                x={z.x + z.w / 2}
                y={z.h >= 30 ? z.y + z.h / 2 + 8 : z.y + z.h / 2 + 4}
                textAnchor="middle"
                fontSize="8"
                fill={isSelected ? "#ffffff" : "#ffffffcc"}
                fontWeight="700"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {z.xg}
              </text>
            </g>
          );
        })}

        {/* Goal arrow label */}
        <text x="150" y="16" textAnchor="middle" fontSize="7" fill="#ffffff55" style={{ userSelect: "none" }}>
          GOAL
        </text>
      </svg>

      {/* Selected zone confirmation */}
      {selected && (
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-card/40 px-3 py-2">
          <span className="text-xs font-semibold text-white">{selected.label}</span>
          <span className="text-xs font-bold text-accent">xG {selected.xg}</span>
        </div>
      )}
    </div>
  );
}

const LS_KEY = "gs_xg_shots";

function XgAnalysisInner() {
  const searchParams = useSearchParams();
  const [shots, setShots] = useState<Shot[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as Shot[]; } catch { return []; }
  });
  const [team, setTeam]         = useState<"home" | "away">("home");
  const [zone, setZone]         = useState(XG_ZONES[0].id);
  const [minute, setMinute]     = useState(1);
  const [isGoal, setIsGoal]     = useState(false);
  const [copied, setCopied]     = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [matchLabel, setMatchLabel] = useState<string | null>(null);

  useEffect(() => { try { localStorage.setItem(LS_KEY, JSON.stringify(shots)); } catch {} }, [shots]);

  // Auto-load if ?match_id= is in URL
  useEffect(() => {
    const mid = searchParams.get("match_id");
    if (!mid) return;
    setLoadingMatch(true);
    getMatch(mid).then((m) => {
      const loaded = extractShots(m.events);
      setShots(loaded);
      setMatchLabel(`${m.home_team} vs ${m.away_team}`);
    }).catch(() => {}).finally(() => setLoadingMatch(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addShot = () => {
    const zoneData = XG_ZONES.find((z) => z.id === zone);
    if (!zoneData) return;
    setShots((prev) => [...prev, {
      id: crypto.randomUUID(),
      team, zone: zoneData.label, xg: zoneData.xg, minute, isGoal,
    }]);
    setIsGoal(false);
  };

  const removeShot = (id: string) => setShots((prev) => prev.filter((s) => s.id !== id));

  const homeShots  = shots.filter((s) => s.team === "home");
  const awayShots  = shots.filter((s) => s.team === "away");
  const homeXg     = homeShots.reduce((s, x) => s + x.xg, 0);
  const awayXg     = awayShots.reduce((s, x) => s + x.xg, 0);
  const homeGoals  = homeShots.filter((s) => s.isGoal).length;
  const awayGoals  = awayShots.filter((s) => s.isGoal).length;

  const efficiency = (goals: number, xg: number) =>
    xg > 0 ? `${Math.round((goals / xg) * 100)}%` : "—";

  const exportText = () => {
    const lines = [
      "⚽ xG MATCH REPORT",
      `Home: ${homeGoals} goals / ${homeXg.toFixed(2)} xG (efficiency: ${efficiency(homeGoals, homeXg)})`,
      `Away: ${awayGoals} goals / ${awayXg.toFixed(2)} xG (efficiency: ${efficiency(awayGoals, awayXg)})`,
      "",
      "SHOTS:",
      ...shots.map((s) => `${s.minute}' [${s.team.toUpperCase()}] ${s.zone} — xG ${s.xg.toFixed(2)}${s.isGoal ? " ✅ GOAL" : ""}`),
    ].join("\n");
    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      {showLoader && (
        <MatchLoader
          title="Load Shots from Match"
          onClose={() => setShowLoader(false)}
          onSelect={(m) => {
            setShots(extractShots(m.events));
            setMatchLabel(`${m.home_team} vs ${m.away_team}`);
            setShowLoader(false);
          }}
        />
      )}
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/analyst" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">xG & Shot Analysis</h1>
            <p className="text-sm text-muted-foreground italic">
              {matchLabel ? `Loaded: ${matchLabel}` : "Tap a zone on the pitch, then log the shot"}
            </p>
          </div>
          <button
            onClick={() => setShowLoader(true)}
            disabled={loadingMatch}
            className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-white"
          >
            {loadingMatch ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
            Load Match
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add shot panel */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Log a Shot</h2>

              {/* Team toggle */}
              <div className="flex rounded-xl border overflow-hidden">
                {(["home", "away"] as const).map((t) => (
                  <button key={t} onClick={() => setTeam(t)}
                    className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${team === t ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {t}
                  </button>
                ))}
              </div>

              {/* Clickable pitch zone picker */}
              <PitchZonePicker selectedZone={zone} onSelect={setZone} />

              {/* Minute */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Minute</label>
                <input
                  type="number" min={1} max={120} value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Goal checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isGoal} onChange={(e) => setIsGoal(e.target.checked)}
                  className="h-4 w-4 rounded" />
                <span className="text-sm">Goal scored ✅</span>
              </label>

              <button
                onClick={addShot}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Shot
              </button>
            </div>

            {/* xG legend */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zone Danger Key</p>
              <div className="space-y-1.5">
                {XG_ZONES.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setZone(z.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 transition-colors text-left ${zone === z.id ? "bg-white/10" : "hover:bg-white/5"}`}
                  >
                    <div className={`h-3 w-3 flex-shrink-0 rounded-sm ${xgColor(z.xg)}`} />
                    <span className="flex-1 text-xs">{z.label}</span>
                    <span className="text-xs font-bold text-muted-foreground">{z.xg}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats + shot log */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Home xG",    value: homeXg.toFixed(2),                                      color: "text-blue-400" },
                { label: "Away xG",    value: awayXg.toFixed(2),                                      color: "text-orange-400" },
                { label: "Home Goals", value: `${homeGoals} (${efficiency(homeGoals, homeXg)})`,       color: "text-green-400" },
                { label: "Away Goals", value: `${awayGoals} (${efficiency(awayGoals, awayXg)})`,       color: "text-green-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm text-center">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Shot log */}
            <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between border-b px-5 py-3">
                <p className="text-sm font-semibold">{shots.length} shot{shots.length !== 1 ? "s" : ""} logged</p>
                {shots.length > 0 && (
                  <button
                    onClick={exportText}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    {copied ? <><Check className="h-3.5 w-3.5 text-green-500" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Export</>}
                  </button>
                )}
              </div>
              {shots.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No shots yet — tap a zone on the pitch and press Add Shot.</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {shots.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="w-8 text-center text-xs font-bold text-muted-foreground">{s.minute}&apos;</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${s.team === "home" ? "bg-blue-500/15 text-blue-400" : "bg-orange-500/15 text-orange-400"}`}>
                        {s.team}
                      </span>
                      <span className="flex-1 text-sm">{s.zone}</span>
                      <div className={`h-2.5 w-2.5 rounded-sm ${xgColor(s.xg)}`} />
                      <span className="w-10 text-right text-xs font-bold">{s.xg.toFixed(2)}</span>
                      {s.isGoal && <span className="text-green-400 text-xs font-bold">GOAL</span>}
                      <button onClick={() => removeShot(s.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
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

export default function XgAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      <XgAnalysisInner />
    </Suspense>
  );
}
