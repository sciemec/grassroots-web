"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CircleDot, Upload, CheckCircle2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";

const AI_URL = process.env.NEXT_PUBLIC_AI_URL ?? "https://grassroots-ai-tracker.onrender.com";

// ── types ────────────────────────────────────────────────────────────────────

interface BallPosition {
  second: number;
  time_s: number;
  x: number;
  y: number;
  interpolated?: boolean;
}

interface BallEvent {
  type: "kick" | "deflection" | "stopped";
  frame: number;
  time_s: number;
  x: number;
  y: number;
  speed_kmh?: number;
  direction_cos?: number;
}

interface PlayerStat {
  id: number;
  team: "home" | "away";
  jersey?: string;
  name?: string;
  top_speed_kmh: number;
  distance_m: number;
  sprint_count: number;
  avg_speed_kmh: number;
}

interface TrackResult {
  players: PlayerStat[];
  ball: BallPosition[];
  ball_events: BallEvent[];
  stats: {
    home_possession: number;
    away_possession: number;
    duration_s: number;
    ball_detected_frames: number;
    ball_interpolated_frames: number;
    ball_events_detected: number;
    ball_sample_fps: number;
    total_players: number;
    home_players: number;
    away_players: number;
  };
  video: {
    fps: number;
    total_frames: number;
    duration_s: number;
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function pitchZoneLabel(x: number, y: number): string {
  const col = x < 0.33 ? "Left" : x < 0.67 ? "Central" : "Right";
  const row = y < 0.25 ? "Att. 3rd" : y < 0.5 ? "Mid Upper" : y < 0.75 ? "Mid Lower" : "Def. 3rd";
  return `${col} ${row}`;
}

function EventIcon({ type }: { type: string }) {
  const cfg: Record<string, { label: string; color: string }> = {
    kick:       { label: "K", color: "#16a34a" },
    deflection: { label: "D", color: "#d97706" },
    stopped:    { label: "S", color: "#dc2626" },
  };
  const { label, color } = cfg[type] ?? { label: "?", color: "#6b7280" };
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black shrink-0 text-white"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

// ── SVG pitch with ball path ──────────────────────────────────────────────────

function PitchWithBall({
  ball,
  events,
}: {
  ball: BallPosition[];
  events: BallEvent[];
}) {
  const W = 560;
  const H = 360;
  const px = (x: number) => x * W;
  const py = (y: number) => y * H;

  // Build polyline points
  const pts = ball.map((p) => `${px(p.x)},${py(p.y)}`).join(" ");

  // Colour legend for event dots
  const DOT_COLOR: Record<string, string> = {
    kick: "#16a34a",
    deflection: "#d97706",
    stopped: "#dc2626",
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-xl border border-gray-200"
      style={{ backgroundColor: "#1a5c2a", maxHeight: 320 }}
    >
      {/* Pitch markings */}
      {/* Outer boundary */}
      <rect x={10} y={8} width={W - 20} height={H - 16} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
      {/* Centre line */}
      <line x1={W / 2} y1={8} x2={W / 2} y2={H - 8} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      {/* Centre circle */}
      <circle cx={W / 2} cy={H / 2} r={45} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={W / 2} cy={H / 2} r={2.5} fill="rgba(255,255,255,0.6)" />
      {/* Left penalty box */}
      <rect x={10} y={H / 2 - 58} width={88} height={116} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <rect x={10} y={H / 2 - 28} width={40} height={56} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={98} cy={H / 2} r={2} fill="rgba(255,255,255,0.5)" />
      {/* Right penalty box */}
      <rect x={W - 98} y={H / 2 - 58} width={88} height={116} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <rect x={W - 50} y={H / 2 - 28} width={40} height={56} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
      <circle cx={W - 98} cy={H / 2} r={2} fill="rgba(255,255,255,0.5)" />
      {/* Goals */}
      <rect x={3} y={H / 2 - 20} width={7} height={40} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      <rect x={W - 10} y={H / 2 - 20} width={7} height={40} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />

      {/* Ball path */}
      {ball.length > 1 && (
        <polyline
          points={pts}
          fill="none"
          stroke="rgba(240,180,41,0.75)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Event dots */}
      {events.map((ev, i) => (
        <g key={i}>
          <circle
            cx={px(ev.x)}
            cy={py(ev.y)}
            r={6}
            fill={DOT_COLOR[ev.type] ?? "#6b7280"}
            stroke="white"
            strokeWidth={1.5}
            opacity={0.9}
          />
          <text
            x={px(ev.x)}
            y={py(ev.y) + 4}
            textAnchor="middle"
            fill="white"
            fontSize={7}
            fontWeight="bold"
          >
            {ev.type[0].toUpperCase()}
          </text>
        </g>
      ))}

      {/* Start / end markers */}
      {ball.length > 0 && (
        <>
          <circle cx={px(ball[0].x)} cy={py(ball[0].y)} r={5} fill="#60a5fa" stroke="white" strokeWidth={1.5} />
          <circle cx={px(ball[ball.length - 1].x)} cy={py(ball[ball.length - 1].y)} r={5} fill="#f0b429" stroke="white" strokeWidth={1.5} />
        </>
      )}
    </svg>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

type Phase = "setup" | "running" | "results";

export default function BallTrackerPage() {
  const user = useAuthStore((s) => s.user);

  // Setup state
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [squadText, setSquadText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Running state
  const [phase, setPhase] = useState<Phase>("setup");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Results state
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [xgSaved, setXgSaved] = useState(false);

  // ── drag & drop ──────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) setFile(f);
  }, []);

  // ── parse squad text → map ────────────────────────────────────────────────

  function parseSquad(text: string): Record<string, string> {
    const map: Record<string, string> = {};
    text.split(/[\n,]+/).forEach((line) => {
      const m = line.trim().match(/^(\d+)\s*[=:]\s*(.+)$/);
      if (m) map[m[1]] = m[2].trim();
    });
    return map;
  }

  // ── upload & track ────────────────────────────────────────────────────────

  async function runTracking() {
    if (!file) return;
    setPhase("running");
    setProgress(0);
    setError("");
    setResult(null);

    const squad = parseSquad(squadText);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("home_team", homeTeam || "Home");
    formData.append("away_team", awayTeam || "Away");
    if (Object.keys(squad).length) {
      formData.append("squad", JSON.stringify(squad));
    }

    // Upload progress via XHR
    try {
      const data = await new Promise<TrackResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${AI_URL}/track-ball`);

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setProgress(Math.round((ev.loaded / ev.total) * 50));
            setStatusMsg("Uploading video…");
          }
        };

        // Simulate analysis ticks once upload done
        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
            setProgress(50);
            setStatusMsg("Detecting ball & players…");
            let tick = 50;
            const id = setInterval(() => {
              tick = Math.min(tick + 3, 92);
              setProgress(tick);
              if (tick < 65) setStatusMsg("Detecting ball & players…");
              else if (tick < 80) setStatusMsg("Tracking ball path…");
              else setStatusMsg("Detecting events…");
              if (tick >= 92) clearInterval(id);
            }, 900);
          }
        };

        xhr.onload = () => {
          setProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Invalid response from tracker"));
            }
          } else {
            try {
              const body = JSON.parse(xhr.responseText);
              reject(new Error(body.detail ?? `Tracker error ${xhr.status}`));
            } catch {
              reject(new Error(`Tracker error ${xhr.status}`));
            }
          }
        };
        xhr.onerror = () => reject(new Error("Network error — is the AI service running?"));
        xhr.send(formData);
      });

      setResult(data);
      setPhase("results");
      saveToAnalystTools(data, homeTeam, awayTeam);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("setup");
    }
  }

  // ── toggle event row ──────────────────────────────────────────────────────

  function toggleEvent(i: number) {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  // ── save kick events → xG Analysis + Season Intelligence ─────────────────

  const XG_VALUES: Record<string, number> = {
    six_yard: 0.76, penalty_spot: 0.45, central_box: 0.35,
    wide_box_left: 0.12, wide_box_right: 0.12,
    edge_centre: 0.18, edge_wide_left: 0.07, edge_wide_right: 0.07,
    long_range: 0.04,
  };

  function kickToZone(x: number, y: number, attackingRight: boolean): string {
    const rx = attackingRight ? (1 - x) : x; // distance from attacking goal
    const dy = Math.abs(y - 0.5);
    if (rx < 0.05 && dy < 0.11) return "six_yard";
    if (rx < 0.18 && dy < 0.08) return "penalty_spot";
    if (rx < 0.25 && dy < 0.16) return "central_box";
    if (rx < 0.25 && y < 0.34)  return "wide_box_left";
    if (rx < 0.25 && y > 0.66)  return "wide_box_right";
    if (rx < 0.40 && dy < 0.12) return "edge_centre";
    if (rx < 0.40 && y < 0.38)  return "edge_wide_left";
    if (rx < 0.40 && y > 0.62)  return "edge_wide_right";
    return "long_range";
  }

  function saveToAnalystTools(trackResult: TrackResult, home: string, away: string) {
    // Only kick events in the attacking third count as shots
    const shots = trackResult.ball_events
      .filter((ev) => ev.type === "kick" && (ev.x > 0.6 || ev.x < 0.4))
      .map((ev, i) => {
        const isHome = ev.x > 0.6; // home attacks right side by convention
        const zone = kickToZone(ev.x, ev.y, isHome);
        return {
          id: `bt-${i}`,
          team: isHome ? ("home" as const) : ("away" as const),
          zone,
          xg: XG_VALUES[zone] ?? 0.04,
          isGoal: false,
          minute: Math.floor(ev.time_s / 60),
        };
      });

    // Write to xG Analysis
    localStorage.setItem(
      "gs_touch_tracker",
      JSON.stringify({ homeTeam: home || "Home", awayTeam: away || "Away", shots }),
    );

    // Append record to Season Intelligence history
    const homeXg = shots.filter((s) => s.team === "home").reduce((sum, s) => sum + s.xg, 0);
    const awayXg = shots.filter((s) => s.team === "away").reduce((sum, s) => sum + s.xg, 0);
    const record = {
      id: `bt-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      homeTeam: home || "Home",
      awayTeam: away || "Away",
      homeXg: Math.round(homeXg * 100) / 100,
      awayXg: Math.round(awayXg * 100) / 100,
      homeGoals: 0,
      awayGoals: 0,
    };
    try {
      const prev = JSON.parse(localStorage.getItem("gs_touch_tracker_history") ?? "[]");
      const updated = [record, ...(Array.isArray(prev) ? prev : [])].slice(0, 20);
      localStorage.setItem("gs_touch_tracker_history", JSON.stringify(updated));
    } catch {
      localStorage.setItem("gs_touch_tracker_history", JSON.stringify([record]));
    }

    setXgSaved(true);
  }

  // ── setup phase ───────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="flex h-screen" style={{ backgroundColor: "#f4f2ee" }}>
        <Sidebar />
        <main className="flex-1 overflow-auto p-5">
          {/* Nav */}
          <div className="mb-5 flex items-center gap-3">
            <Link href="/analyst" className="rounded-lg p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#c8962a]">Ball Tracking Mode</p>
              <h1 className="text-lg font-black text-gray-900">Ball Tracker</h1>
            </div>
          </div>

          {/* Explainer */}
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-[#c8962a] shrink-0">
                <CircleDot size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Ball path · events · player stats — from one clip</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                  YOLOv8 tracks the ball at 5 fps and players at 1 fps. Kicks, deflections, and stops are
                  detected automatically. Ball positions are linearly interpolated across gaps up to 5 seconds.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-2xl space-y-5">
            {/* Team names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-600">Home Team</label>
                <input
                  type="text"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g. Dynamos FC"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a]"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-600">Away Team</label>
                <input
                  type="text"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g. Highlanders FC"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a]"
                />
              </div>
            </div>

            {/* Squad map */}
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-600">
                Squad Map <span className="font-medium text-gray-400 normal-case tracking-normal">(optional)</span>
              </label>
              <textarea
                value={squadText}
                onChange={(e) => setSquadText(e.target.value)}
                rows={4}
                placeholder={"10=Musona K.\n7=Billiat K.\n4=Nakamba M."}
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-[#1a5c2a] focus:border-[#1a5c2a] resize-none"
              />
              <p className="mt-1 text-[10px] text-gray-400">One entry per line: jersey=Name. Used to label the players table.</p>
            </div>

            {/* Drop zone */}
            <div>
              <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-gray-600">Video Clip</label>
              <div
                className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
                style={{ borderColor: dragging ? "#1a5c2a" : "#d1d5db", backgroundColor: dragging ? "#f0fdf4" : "white" }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} className="text-[#1a5c2a]" />
                    <span className="text-sm font-bold text-gray-800 truncate max-w-xs">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-600">Drop a clip here or click to browse</p>
                    <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI · Any length</p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={runTracking}
              disabled={!file}
              className="w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-wider text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Run Ball Tracker
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── running phase ─────────────────────────────────────────────────────────

  if (phase === "running") {
    const steps = [
      { label: "Upload", done: progress >= 50 },
      { label: "YOLO Detection", done: progress >= 80 },
      { label: "Event Detection", done: progress >= 95 },
    ];
    return (
      <div className="flex h-screen" style={{ backgroundColor: "#f4f2ee" }}>
        <Sidebar />
        <main className="flex-1 overflow-auto p-5 flex items-center justify-center">
          <div className="max-w-sm w-full space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "#f0fdf4", border: "2px solid #bbf7d0" }}>
                <CircleDot size={24} className="text-[#1a5c2a] animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-gray-900">Tracking ball…</h2>
              <p className="text-sm text-gray-500 mt-1">{statusMsg}</p>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: "#1a5c2a" }}
                />
              </div>
            </div>

            {/* Step cards */}
            <div className="space-y-2">
              {steps.map((s) => (
                <div key={s.label}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                  style={{
                    backgroundColor: s.done ? "#f0fdf4" : "white",
                    borderColor: s.done ? "#bbf7d0" : "#e5e7eb",
                  }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: s.done ? "#16a34a" : "#e5e7eb" }}>
                    {s.done && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── results phase ─────────────────────────────────────────────────────────

  if (!result) return null;
  const { stats, ball, ball_events, players } = result;
  const sortedPlayers = [...players].sort((a, b) => b.top_speed_kmh - a.top_speed_kmh);

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto p-5 space-y-5">

        {/* Nav */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setPhase("setup"); setResult(null); setFile(null); }}
            className="rounded-lg p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#c8962a]">Ball Tracking Results</p>
            <h1 className="text-lg font-black text-gray-900">
              {homeTeam || "Home"} vs {awayTeam || "Away"}
            </h1>
            {xgSaved && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Link
                  href="/analyst/xg-analysis"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black text-white"
                  style={{ backgroundColor: "#16a34a" }}
                >
                  <CheckCircle2 size={9} /> Saved to xG Analysis →
                </Link>
                <Link
                  href="/analyst/season"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black text-white"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  <CheckCircle2 size={9} /> Saved to Season Intelligence →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Possession bar */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Ball Possession</p>
          <div className="flex justify-between text-sm font-black mb-2">
            <span style={{ color: "#1a5c2a" }}>{homeTeam || "Home"} {stats.home_possession}%</span>
            <span className="text-gray-400">{awayTeam || "Away"} {stats.away_possession}%</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden bg-gray-100 flex">
            <div className="h-full rounded-l-full transition-all"
              style={{ width: `${stats.home_possession}%`, backgroundColor: "#1a5c2a" }} />
            <div className="h-full rounded-r-full transition-all"
              style={{ width: `${stats.away_possession}%`, backgroundColor: "#d1d5db" }} />
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Duration",         value: fmtTime(stats.duration_s) },
            { label: "Events",           value: String(stats.ball_events_detected) },
            { label: "Ball Frames",      value: String(stats.ball_detected_frames) },
            { label: "Interpolated",     value: String(stats.ball_interpolated_frames) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white border border-gray-200 p-3.5 text-center shadow-sm">
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Pitch with ball path */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ball Path</p>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#60a5fa]" /> Start</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#f0b429]" /> End</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#16a34a]" /> Kick</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#d97706]" /> Deflect</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[#dc2626]" /> Stop</span>
            </div>
          </div>
          {ball.length > 0 ? (
            <PitchWithBall ball={ball} events={ball_events} />
          ) : (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-8 text-center">
              <CircleDot size={24} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No ball positions detected in this clip</p>
            </div>
          )}
        </div>

        {/* Ball events timeline */}
        {ball_events.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ball Events</p>
            </div>
            <div className="divide-y divide-gray-50">
              {ball_events.map((ev, i) => {
                const expanded = expandedEvents.has(i);
                return (
                  <div key={i}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => toggleEvent(i)}
                    >
                      <EventIcon type={ev.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 capitalize">{ev.type}</p>
                        <p className="text-[11px] text-gray-400">{pitchZoneLabel(ev.x, ev.y)}</p>
                      </div>
                      <span className="text-xs font-black tabular-nums text-gray-600 shrink-0">
                        {fmtTime(ev.time_s)}
                      </span>
                      {expanded ? (
                        <ChevronUp size={14} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown size={14} className="text-gray-400 shrink-0" />
                      )}
                    </button>
                    {expanded && (
                      <div className="px-4 pb-3 bg-gray-50 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {[
                          ["Frame", String(ev.frame)],
                          ["Time", fmtTime(ev.time_s)],
                          ...(ev.speed_kmh != null ? [["Speed", `${ev.speed_kmh} km/h`]] : []),
                          ...(ev.direction_cos != null ? [["Dir. cos", ev.direction_cos.toFixed(2)]] : []),
                          ["X", ev.x.toFixed(3)],
                          ["Y", ev.y.toFixed(3)],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-lg bg-white border border-gray-200 px-2.5 py-1.5">
                            <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">{k}</p>
                            <p className="font-bold text-gray-800 mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Players table */}
        {sortedPlayers.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users size={13} className="text-gray-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Player Stats</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["#", "Team", "Player", "Top Speed", "Distance", "Sprints", "Avg Speed"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left font-black uppercase tracking-wider text-[10px] text-gray-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedPlayers.map((p, i) => {
                    const nameLabel = p.name ?? (p.jersey ? `#${p.jersey}` : `Player ${p.id}`);
                    const teamColor = p.team === "home" ? "#1a5c2a" : "#1e3a5f";
                    const teamLabel = p.team === "home" ? (homeTeam || "Home") : (awayTeam || "Away");
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 font-black text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                            style={{ backgroundColor: teamColor }}>
                            {teamLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap">{nameLabel}</td>
                        <td className="px-3 py-2.5 font-black text-gray-900">{p.top_speed_kmh.toFixed(1)} <span className="font-normal text-gray-400">km/h</span></td>
                        <td className="px-3 py-2.5 text-gray-700">{Math.round(p.distance_m)} m</td>
                        <td className="px-3 py-2.5 text-gray-700">{p.sprint_count}</td>
                        <td className="px-3 py-2.5 text-gray-700">{p.avg_speed_kmh.toFixed(1)} km/h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New tracking button */}
        <div className="pb-6">
          <button
            onClick={() => { setPhase("setup"); setResult(null); setFile(null); setExpandedEvents(new Set()); }}
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
          >
            ← Track another clip
          </button>
        </div>

      </main>
    </div>
  );
}
