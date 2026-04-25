"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Types (mirror Python service response)
// ---------------------------------------------------------------------------

interface PlayerPosition {
  second: number;
  x: number; // 0-1 normalised (0=left touchline)
  y: number; // 0-1 normalised (0=top goal)
}

export interface TrackedPlayer {
  id: number;
  team: "home" | "away" | "referee";
  positions: PlayerPosition[];
  distance_m: number;
  avg_x: number;
  avg_y: number;
  heatmap: number[][]; // 13 rows × 20 cols
}

export interface TrackingStats {
  possession_home: number;
  possession_away: number;
  duration_seconds: number;
  frames_processed: number;
}

export interface TrackingData {
  players: TrackedPlayer[];
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
  home: "#f0b429",   // gold
  away: "#60a5fa",   // blue
  referee: "#f87171", // red
};

function heatmapColor(value: number, max: number): string {
  if (max === 0 || value === 0) return "transparent";
  const t = value / max;
  if (t < 0.25) return `rgba(0, 200, 200, ${t * 0.8})`;
  if (t < 0.5)  return `rgba(200, 200, 0, ${t * 0.9})`;
  if (t < 0.75) return `rgba(255, 140, 0, ${t})`;
  return `rgba(220, 50, 50, ${Math.min(1, t)})`;
}

// ---------------------------------------------------------------------------
// Pitch SVG — dots for current avg position of each player
// ---------------------------------------------------------------------------

function PitchView({
  players,
  homeTeam,
  awayTeam,
}: {
  players: TrackedPlayer[];
  homeTeam: string;
  awayTeam: string;
}) {
  // Pitch is 105 × 68m — render in a 600 × 400 viewBox
  const VW = 600;
  const VH = 400;

  const toSvg = (x: number, y: number) => ({
    cx: x * VW,
    cy: y * VH,
  });

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full rounded-xl border border-white/10"
      style={{ background: "#1a5c2a" }}
    >
      {/* Pitch markings */}
      {/* Outer boundary */}
      <rect x={10} y={10} width={VW - 20} height={VH - 20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} />
      {/* Centre line */}
      <line x1={VW / 2} y1={10} x2={VW / 2} y2={VH - 10} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      {/* Centre circle */}
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
        return (
          <g key={p.id}>
            <circle
              cx={cx}
              cy={cy}
              r={8}
              fill={color}
              fillOpacity={0.9}
              stroke="#000"
              strokeWidth={1}
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={7}
              fontWeight="bold"
              fill="#000"
            >
              {p.id}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <circle cx={20} cy={VH - 20} r={5} fill={TEAM_COLORS.home} />
      <text x={30} y={VH - 16} fontSize={9} fill="white" opacity={0.8}>{homeTeam}</text>
      <circle cx={120} cy={VH - 20} r={5} fill={TEAM_COLORS.away} />
      <text x={130} y={VH - 16} fontSize={9} fill="white" opacity={0.8}>{awayTeam}</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Heatmap — canvas-rendered grid for a single player
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

    const max = Math.max(...heatmap.flat(), 1);

    // Pitch background
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

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * ch);
      ctx.lineTo(canvas.width, r * ch);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cw, 0);
      ctx.lineTo(c * cw, canvas.height);
      ctx.stroke();
    }

    // Direction labels
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
  home,
  away,
  homeTeam,
  awayTeam,
}: {
  home: number;
  away: number;
  homeTeam: string;
  awayTeam: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/60">
        Ball Possession
      </p>
      <div className="flex items-center gap-2">
        <span className="w-16 text-right text-sm font-bold text-[#f0b429]">
          {home}%
        </span>
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[#f0b429] transition-all duration-700"
            style={{ width: `${home}%` }}
          />
          <div
            className="absolute right-0 top-0 h-full rounded-full bg-[#60a5fa] transition-all duration-700"
            style={{ width: `${away}%` }}
          />
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
// Distance leaderboard
// ---------------------------------------------------------------------------

function DistanceLeaderboard({
  players,
  homeTeam,
  awayTeam,
}: {
  players: TrackedPlayer[];
  homeTeam: string;
  awayTeam: string;
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
          return (
            <div key={p.id} className="flex items-center gap-2">
              <span
                className="w-6 rounded text-center text-[10px] font-bold"
                style={{ background: color, color: "#000" }}
              >
                {p.id}
              </span>
              <span className="w-20 truncate text-[10px] text-white/50">
                {teamLabel}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(p.distance_m / maxDist) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              <span className="w-16 text-right text-xs font-semibold text-white/80">
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
// Player heatmap grid
// ---------------------------------------------------------------------------

function HeatmapGrid({
  players,
  homeTeam,
  awayTeam,
}: {
  players: TrackedPlayer[];
  homeTeam: string;
  awayTeam: string;
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
          return (
            <div
              key={p.id}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: color, color: "#000" }}
                >
                  #{p.id}
                </span>
                <span className="truncate text-[10px] text-white/50">
                  {teamLabel}
                </span>
              </div>
              <HeatmapCanvas heatmap={p.heatmap} />
              <p className="mt-1.5 text-center text-[10px] text-white/40">
                {(p.distance_m / 1000).toFixed(1)} km
              </p>
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
  data,
  homeTeam,
  awayTeam,
}: {
  data: TrackingData;
  homeTeam: string;
  awayTeam: string;
}) {
  const { stats } = data;
  const homePlayers = data.players.filter((p) => p.team === "home");
  const awayPlayers = data.players.filter((p) => p.team === "away");

  const avgDist = (players: TrackedPlayer[]) =>
    players.length
      ? (
          players.reduce((s, p) => s + p.distance_m, 0) /
          players.length /
          1000
        ).toFixed(1)
      : "—";

  const mins = Math.floor(stats.duration_seconds / 60);

  const statCards = [
    { label: "Duration", value: `${mins} min` },
    { label: "Frames", value: stats.frames_processed.toLocaleString() },
    {
      label: `${homeTeam} Players`,
      value: homePlayers.length.toString(),
      color: "#f0b429",
    },
    {
      label: `${awayTeam} Players`,
      value: awayPlayers.length.toString(),
      color: "#60a5fa",
    },
    {
      label: `${homeTeam} Avg Dist`,
      value: `${avgDist(homePlayers)} km`,
      color: "#f0b429",
    },
    {
      label: `${awayTeam} Avg Dist`,
      value: `${avgDist(awayPlayers)} km`,
      color: "#60a5fa",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {statCards.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
        >
          <p
            className="text-lg font-black"
            style={{ color: s.color ?? "#fff" }}
          >
            {s.value}
          </p>
          <p className="text-[10px] text-white/50">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------

export default function TrackingDashboard({ data, homeTeam, awayTeam }: Props) {
  const { players, stats } = data;

  return (
    <div className="space-y-5">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#4a1a8a] px-3 py-1 text-xs font-bold text-white">
          YOLOv8 + ByteTrack
        </span>
        <span className="text-xs text-white/40">
          {players.length} players tracked · {stats.frames_processed.toLocaleString()} frames
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
      />

      {/* Pitch radar */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/60">
          Average Position Radar
        </p>
        <PitchView players={players} homeTeam={homeTeam} awayTeam={awayTeam} />
      </div>

      {/* Distance leaderboard */}
      <DistanceLeaderboard
        players={players}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
      />

      {/* Player heatmaps */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <HeatmapGrid
          players={players}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      </div>

      {/* Wyscout comparison note */}
      <div className="rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
        <p className="text-xs font-bold text-[#f0b429]">
          Wyscout charges €299/month for this data.
        </p>
        <p className="mt-0.5 text-xs text-white/50">
          GrassRoots Sports delivers it at $99/month — built for Zimbabwe, powered by
          YOLOv8 computer vision running every frame of your match video.
        </p>
      </div>
    </div>
  );
}
