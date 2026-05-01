"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Check, X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types (mirror Python service v2 response)
// ---------------------------------------------------------------------------

interface PlayerPosition {
  second: number;
  x: number;
  y: number;
}

interface BallPosition {
  second: number;
  x: number;
  y: number;
}

export interface TrackedPlayer {
  id: number;
  name: string;
  team: "home" | "away" | "referee";
  positions: PlayerPosition[];
  distance_m: number;
  avg_x: number;
  avg_y: number;
  heatmap: number[][];
  top_speed_kmh: number;
  avg_speed_kmh: number;
}

export interface TrackingStats {
  possession_home: number;
  possession_away: number;
  duration_seconds: number;
  frames_processed: number;
  ball_detected_frames?: number;
}

export interface TrackingData {
  players: TrackedPlayer[];
  ball: BallPosition[];
  stats: TrackingStats;
  video: { width: number; height: number; fps: number; total_frames: number };
}

interface Props {
  data: TrackingData;
  homeTeam: string;
  awayTeam: string;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const TEAM_COLORS: Record<string, string> = {
  home:     "#f0b429",
  away:     "#60a5fa",
  referee:  "#f87171",
};

function heatmapColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "transparent";
  const t = value / max;
  if (t < 0.25) return `rgba(0, 200, 200, ${t * 0.8})`;
  if (t < 0.5)  return `rgba(200, 200, 0, ${t * 0.9})`;
  if (t < 0.75) return `rgba(255, 140, 0, ${t})`;
  return `rgba(220, 50, 50, ${Math.min(1, t)})`;
}

function displayName(player: TrackedPlayer, names: Record<number, string>): string {
  return names[player.id] || player.name || `#${player.id}`;
}

// ---------------------------------------------------------------------------
// Pitch SVG — player dots + ball position
// ---------------------------------------------------------------------------

function PitchView({
  players,
  ball,
  homeTeam,
  awayTeam,
  names,
}: {
  players: TrackedPlayer[];
  ball: BallPosition[];
  homeTeam: string;
  awayTeam: string;
  names: Record<number, string>;
}) {
  const VW = 600;
  const VH = 400;

  const toSvg = (x: number, y: number) => ({ cx: x * VW, cy: y * VH });

  // Last known ball position
  const lastBall = ball.length > 0 ? ball[ball.length - 1] : null;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full rounded-xl border border-white/10"
      style={{ background: "#1a5c2a" }}
    >
      {/* Pitch markings */}
      <rect x={10} y={10} width={VW - 20} height={VH - 20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
      <line x1={VW / 2} y1={10} x2={VW / 2} y2={VH - 10} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={VW / 2} cy={VH / 2} r={50} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={VW / 2} cy={VH / 2} r={3} fill="rgba(255,255,255,0.5)" />
      {/* Left penalty area */}
      <rect x={10} y={VH / 2 - 80} width={90} height={160} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <rect x={10} y={VH / 2 - 35} width={30} height={70} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={100} cy={VH / 2} r={3} fill="rgba(255,255,255,0.5)" />
      {/* Right penalty area */}
      <rect x={VW - 100} y={VH / 2 - 80} width={90} height={160} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <rect x={VW - 40} y={VH / 2 - 35} width={30} height={70} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={VW - 100} cy={VH / 2} r={3} fill="rgba(255,255,255,0.5)" />

      {/* Player dots */}
      {players.map((p) => {
        const { cx, cy } = toSvg(p.avg_x, p.avg_y);
        const color = TEAM_COLORS[p.team] ?? "#fff";
        const label = names[p.id] || p.name || String(p.id);
        const shortLabel = label.length > 6 ? label.slice(0, 6) : label;
        return (
          <g key={p.id}>
            <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.9} stroke="#000" strokeWidth={1} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={6} fontWeight="bold" fill="#000">
              {shortLabel}
            </text>
          </g>
        );
      })}

      {/* Ball — white circle at last known position */}
      {lastBall && (() => {
        const { cx, cy } = toSvg(lastBall.x, lastBall.y);
        return (
          <g>
            <circle cx={cx} cy={cy} r={6} fill="white" stroke="#999" strokeWidth={1} />
            <circle cx={cx} cy={cy} r={2} fill="#555" />
          </g>
        );
      })()}

      {/* Legend */}
      <circle cx={20} cy={VH - 20} r={5} fill={TEAM_COLORS.home} />
      <text x={30} y={VH - 16} fontSize={9} fill="white" opacity={0.8}>{homeTeam}</text>
      <circle cx={120} cy={VH - 20} r={5} fill={TEAM_COLORS.away} />
      <text x={130} y={VH - 16} fontSize={9} fill="white" opacity={0.8}>{awayTeam}</text>
      {lastBall && (
        <>
          <circle cx={220} cy={VH - 20} r={5} fill="white" stroke="#999" strokeWidth={1} />
          <text x={230} y={VH - 16} fontSize={9} fill="white" opacity={0.8}>Ball</text>
        </>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Heatmap canvas
// ---------------------------------------------------------------------------

function HeatmapCanvas({ heatmap }: { heatmap: number[][] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = heatmap.length;
    const cols = heatmap[0]?.length ?? 0;
    if (!rows || !cols) return;

    const cw = canvas.width / cols;
    const ch = canvas.height / rows;
    const max = heatmap.flat().reduce((a, b) => Math.max(a, b), 1);

    ctx.fillStyle = "#1a5c2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = heatmap[r][c];
        if (val > 0) {
          ctx.fillStyle = heatmapColor(val, max);
          ctx.fillRect(c * cw, r * ch, cw, ch);
        }
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(canvas.width, r * ch); ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, canvas.height); ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ATTACK ▶", canvas.width / 2, 10);
    ctx.fillText("◀ DEFEND", canvas.width / 2, canvas.height - 4);
  }, [heatmap]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={130}
      className="rounded border border-white/10"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// ---------------------------------------------------------------------------
// Possession bar
// ---------------------------------------------------------------------------

function PossessionBar({
  home, away, homeTeam, awayTeam, ballFrames, totalFrames,
}: {
  home: number; away: number; homeTeam: string; awayTeam: string;
  ballFrames?: number; totalFrames: number;
}) {
  const ballPct = ballFrames && totalFrames > 0
    ? Math.round((ballFrames / totalFrames) * 100)
    : null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Ball Possession</p>
        {ballPct !== null && (
          <span className="text-[10px] text-white/40">Ball detected in {ballPct}% of frames</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-right text-sm font-bold text-[#f0b429]">{home}%</span>
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="absolute left-0 top-0 h-full rounded-full bg-[#f0b429] transition-all duration-700" style={{ width: `${home}%` }} />
          <div className="absolute right-0 top-0 h-full rounded-full bg-[#60a5fa] transition-all duration-700" style={{ width: `${away}%` }} />
        </div>
        <span className="w-16 text-sm font-bold text-[#60a5fa]">{away}%</span>
      </div>
      <div className="mt-1 flex justify-between">
        <span className="text-[10px] text-white/40">{homeTeam}</span>
        <span className="text-[10px] text-white/40">{awayTeam}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Speed leaderboard (top speed per player)
// ---------------------------------------------------------------------------

function SpeedLeaderboard({
  players, homeTeam, awayTeam, names,
}: {
  players: TrackedPlayer[]; homeTeam: string; awayTeam: string; names: Record<number, string>;
}) {
  const sorted = [...players]
    .filter((p) => p.team !== "referee")
    .sort((a, b) => b.top_speed_kmh - a.top_speed_kmh)
    .slice(0, 10);

  const maxSpeed = sorted[0]?.top_speed_kmh ?? 1;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
        Top Speed — km/h (Fastest 10)
      </p>
      <div className="space-y-2">
        {sorted.map((p) => {
          const color = TEAM_COLORS[p.team];
          const teamLabel = p.team === "home" ? homeTeam : awayTeam;
          const label = displayName(p, names);
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span
                className="w-16 truncate rounded px-1 text-center text-[10px] font-bold"
                style={{ background: color, color: "#000" }}
              >
                {label}
              </span>
              <span className="w-14 truncate text-[10px] text-white/40">{teamLabel}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(p.top_speed_kmh / maxSpeed) * 100}%`, background: color }}
                />
              </div>
              <span className="w-14 text-right text-xs font-bold text-white/80">
                {p.top_speed_kmh} km/h
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Distance leaderboard
// ---------------------------------------------------------------------------

function DistanceLeaderboard({
  players, homeTeam, awayTeam, names,
}: {
  players: TrackedPlayer[]; homeTeam: string; awayTeam: string; names: Record<number, string>;
}) {
  const sorted = [...players]
    .filter((p) => p.team !== "referee")
    .sort((a, b) => b.distance_m - a.distance_m)
    .slice(0, 10);

  const maxDist = sorted[0]?.distance_m ?? 1;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
        Distance Covered (Top 10)
      </p>
      <div className="space-y-2">
        {sorted.map((p) => {
          const color = TEAM_COLORS[p.team];
          const teamLabel = p.team === "home" ? homeTeam : awayTeam;
          const label = displayName(p, names);
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span
                className="w-16 truncate rounded px-1 text-center text-[10px] font-bold"
                style={{ background: color, color: "#000" }}
              >
                {label}
              </span>
              <span className="w-14 truncate text-[10px] text-white/40">{teamLabel}</span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(p.distance_m / maxDist) * 100}%`, background: color }}
                />
              </div>
              <span className="w-14 text-right text-xs font-semibold text-white/80">
                {(p.distance_m / 1000).toFixed(2)} km
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Name Players panel — analyst assigns names to tracker IDs
// ---------------------------------------------------------------------------

function NamePlayersPanel({
  players, homeTeam, awayTeam, names, onSave,
}: {
  players: TrackedPlayer[];
  homeTeam: string;
  awayTeam: string;
  names: Record<number, string>;
  onSave: (id: number, name: string) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const outfield = [...players]
    .filter((p) => p.team !== "referee")
    .sort((a, b) => {
      if (a.team !== b.team) return a.team === "home" ? -1 : 1;
      return b.distance_m - a.distance_m;
    });

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
        Name Players
      </p>
      <p className="mb-4 text-[10px] text-white/30">
        Click the pencil to assign real names to tracker IDs. Names are saved in this session.
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {outfield.map((p) => {
          const color = TEAM_COLORS[p.team];
          const teamLabel = p.team === "home" ? homeTeam : awayTeam;
          const currentName = names[p.id] || p.name || "";
          const isEditing = editing === p.id;

          return (
            <div
              key={p.id}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-[10px] font-black"
                style={{ background: color, color: "#000" }}
              >
                {p.id}
              </span>
              <span className="text-[10px] text-white/40 w-12 truncate">{teamLabel}</span>

              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onSave(p.id, draft); setEditing(null); }
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="flex-1 rounded bg-white/10 px-2 py-0.5 text-xs text-white outline-none focus:ring-1 focus:ring-[#f0b429]"
                    placeholder="Player name..."
                  />
                  <button onClick={() => { onSave(p.id, draft); setEditing(null); }} className="text-green-400 hover:text-green-300">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setEditing(null)} className="text-white/30 hover:text-white/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-xs text-white/70">
                    {currentName || <span className="text-white/20 italic">unnamed</span>}
                  </span>
                  <button
                    onClick={() => { setDraft(currentName); setEditing(p.id); }}
                    className="text-white/30 hover:text-[#f0b429] transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player heatmap grid
// ---------------------------------------------------------------------------

function HeatmapGrid({
  players, homeTeam, awayTeam, names,
}: {
  players: TrackedPlayer[]; homeTeam: string; awayTeam: string; names: Record<number, string>;
}) {
  const outfield = players.filter((p) => p.team !== "referee").slice(0, 22);

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
        Player Heatmaps
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {outfield.map((p) => {
          const color = TEAM_COLORS[p.team];
          const teamLabel = p.team === "home" ? homeTeam : awayTeam;
          const label = displayName(p, names);
          return (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold truncate max-w-[80px]"
                  style={{ background: color, color: "#000" }}
                >
                  {label}
                </span>
                <span className="truncate text-[10px] text-white/40">{teamLabel}</span>
              </div>
              <HeatmapCanvas heatmap={p.heatmap} />
              <div className="mt-1.5 flex justify-between text-[10px] text-white/40">
                <span>{(p.distance_m / 1000).toFixed(1)} km</span>
                <span>{p.top_speed_kmh} km/h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats summary row
// ---------------------------------------------------------------------------

function StatsSummary({
  data, homeTeam, awayTeam,
}: {
  data: TrackingData; homeTeam: string; awayTeam: string;
}) {
  const { stats } = data;
  const homePlayers = data.players.filter((p) => p.team === "home");
  const awayPlayers = data.players.filter((p) => p.team === "away");

  const avgDist = (players: TrackedPlayer[]) =>
    players.length
      ? (players.reduce((s, p) => s + p.distance_m, 0) / players.length / 1000).toFixed(1)
      : "—";

  const topSpeed = (players: TrackedPlayer[]) =>
    players.length ? Math.max(...players.map((p) => p.top_speed_kmh)).toFixed(1) : "—";

  const mins = Math.floor(stats.duration_seconds / 60);

  const statCards = [
    { label: "Duration",            value: `${mins} min` },
    { label: "Frames Analysed",     value: stats.frames_processed.toLocaleString() },
    { label: `${homeTeam} Players`, value: homePlayers.length.toString(), color: "#f0b429" },
    { label: `${awayTeam} Players`, value: awayPlayers.length.toString(), color: "#60a5fa" },
    { label: `${homeTeam} Top Speed`, value: `${topSpeed(homePlayers)} km/h`, color: "#f0b429" },
    { label: `${awayTeam} Top Speed`, value: `${topSpeed(awayPlayers)} km/h`, color: "#60a5fa" },
    { label: `${homeTeam} Avg Dist`, value: `${avgDist(homePlayers)} km`, color: "#f0b429" },
    { label: `${awayTeam} Avg Dist`, value: `${avgDist(awayPlayers)} km`, color: "#60a5fa" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {statCards.map((s) => (
        <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-base font-black leading-tight" style={{ color: s.color ?? "#fff" }}>
            {s.value}
          </p>
          <p className="mt-0.5 text-[9px] leading-tight text-white/40">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------

export default function TrackingDashboard({ data, homeTeam, awayTeam }: Props) {
  const { players, stats, ball } = data;

  // Player names — persisted in localStorage per session
  const [names, setNames] = useState<Record<number, string>>(() => {
    try {
      const raw = localStorage.getItem("gs_tracking_player_names");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const saveName = (id: number, name: string) => {
    const updated = { ...names, [id]: name.trim() };
    setNames(updated);
    try {
      localStorage.setItem("gs_tracking_player_names", JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Header badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="rounded-full bg-[#4a1a8a] px-3 py-1 text-xs font-bold text-white">
          YOLOv8x + ByteTrack
        </span>
        <span className="rounded-full bg-[#1a3a1a] border border-green-700/40 px-3 py-1 text-xs font-semibold text-green-300">
          Ball Tracking
        </span>
        <span className="rounded-full bg-[#1a1a3a] border border-blue-700/40 px-3 py-1 text-xs font-semibold text-blue-300">
          Speed Data
        </span>
        <span className="text-xs text-white/40">
          {players.length} players · {stats.frames_processed.toLocaleString()} frames
          {ball.length > 0 && ` · ball in ${ball.length} frames`}
        </span>
      </div>

      {/* Stats summary */}
      <StatsSummary data={data} homeTeam={homeTeam} awayTeam={awayTeam} />

      {/* Possession */}
      <PossessionBar
        home={stats.possession_home}
        away={stats.possession_away}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        ballFrames={stats.ball_detected_frames}
        totalFrames={stats.frames_processed}
      />

      {/* Pitch radar with ball */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
          Average Position Radar
        </p>
        <PitchView
          players={players}
          ball={ball}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          names={names}
        />
      </div>

      {/* Speed + Distance leaderboards side by side on large screens */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SpeedLeaderboard
          players={players}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          names={names}
        />
        <DistanceLeaderboard
          players={players}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          names={names}
        />
      </div>

      {/* Name Players */}
      <NamePlayersPanel
        players={players}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        names={names}
        onSave={saveName}
      />

      {/* Player heatmaps */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <HeatmapGrid
          players={players}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          names={names}
        />
      </div>

      {/* Value proposition */}
      <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
        <p className="text-xs font-bold text-[#f0b429]">
          Wyscout charges €299/month for this data.
        </p>
        <p className="mt-0.5 text-xs text-white/50">
          GrassRoots Sports delivers ball tracking, speed data, and player heatmaps
          at $99/month — built for Zimbabwe, powered by YOLOv8x computer vision.
        </p>
      </div>
    </div>
  );
}
