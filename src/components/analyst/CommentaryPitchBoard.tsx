"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";

type Phase = "setup" | "recording" | "upload" | "analysing" | "done" | "error";

interface PlayerPosition {
  name:    string;
  team:    string;
  number:  number | null;
  pitch_x: number; // 0 = own goal, 100 = opponent goal
  pitch_y: number; // 0 = left touchline, 100 = right touchline
}

interface TimelineEvent {
  minute:             number | null;
  audio_time_seconds: number | null;
  event_type:         string;
  team:               string | null;
  player:             string | null;
  description:        string;
  zone?:              string | null;
  zone_source?:       string | null;
}

interface CommentaryPitchBoardProps {
  homeTeam:  string;
  awayTeam:  string;
  positions: PlayerPosition[];
  events:    TimelineEvent[];
  audioCur:  number;
  phase:     Phase;
}

// SVG viewBox: 0 0 100 140.  Pitch boundary: x=5..95, y=5..135.
// Top of SVG = home attacking third.  Bottom = home defensive third.

const VALID_ZONES = new Set([
  "top_left", "top_center", "top_right",
  "mid_left", "mid_center", "mid_right",
  "bot_left", "bot_center", "bot_right",
]);

// Centre of each 3×3 zone in SVG coordinates
const ZONE_SVG: Record<string, [number, number]> = {
  top_left:   [20, 27],  top_center:  [50, 27],  top_right:  [80, 27],
  mid_left:   [20, 70],  mid_center:  [50, 70],  mid_right:  [80, 70],
  bot_left:   [20, 112], bot_center:  [50, 112], bot_right:  [80, 112],
};

const EVENT_EMOJI: Record<string, string> = {
  goal: "⚽", yellow_card: "🟨", red_card: "🟥",
  penalty: "⚡", corner: "🚩", substitution: "🔄",
  free_kick: "🎯", injury: "🏥", var_check: "📺",
};

// Convert Gemini pitch_x / pitch_y → SVG x / y
// pitch_x 0 = own goal (SVG bottom), 100 = opp goal (SVG top)
// pitch_y 0 = left (SVG x=5), 100 = right (SVG x=95)
function toSVG(pitch_x: number, pitch_y: number): [number, number] {
  const svgX = 5  + (pitch_y / 100) * 90;
  const svgY = 135 - (pitch_x / 100) * 130;
  return [svgX, svgY];
}

export default function CommentaryPitchBoard({
  homeTeam, awayTeam, positions, events, audioCur, phase,
}: CommentaryPitchBoardProps) {
  const home = homeTeam || "Home";
  const away = awayTeam || "Away";

  // Most recent zoned event at or before current audio position
  const activeEvent = useMemo(() => {
    let best: TimelineEvent | null = null;
    for (const ev of events) {
      if (!ev.zone || !VALID_ZONES.has(ev.zone)) continue;
      if (ev.audio_time_seconds != null && ev.audio_time_seconds <= audioCur) best = ev;
    }
    return best;
  }, [events, audioCur]);

  const ballPos = activeEvent?.zone ? ZONE_SVG[activeEvent.zone] ?? null : null;
  const isLoading = phase === "upload" || phase === "analysing";
  const hasData   = phase === "done" && (positions.length > 0 || events.some((e) => e.zone && VALID_ZONES.has(e.zone)));

  const placeholderText =
    phase === "setup"      ? "Record or upload commentary to see player positions" :
    phase === "recording"  ? "Recording in progress…" :
    phase === "error"      ? "Analysis failed — try again" :
    "";

  return (
    <div style={{ backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "#1a5c2a", fontSize: 13 }}>
            {home.length > 14 ? home.slice(0, 14) + "…" : home}
          </span>
          <span style={{ color: "#bbb", fontSize: 11 }}>vs</span>
          <span style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>
            {away.length > 14 ? away.slice(0, 14) + "…" : away}
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Pitch Board
        </span>
      </div>

      {/* Pitch SVG */}
      <div style={{ position: "relative", width: "100%", maxWidth: 300, margin: "0 auto" }}>
        <svg
          viewBox="0 0 100 140"
          style={{ width: "100%", display: "block", borderRadius: 6 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grass stripes */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={0} y={i * 23.34} width={100} height={23.34}
              fill={i % 2 === 0 ? "#2d6a2d" : "#306e30"} />
          ))}

          {/* Outer boundary */}
          <rect x="5" y="5" width="90" height="130"
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.7" />

          {/* Centre line */}
          <line x1="5" y1="70" x2="95" y2="70"
            stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />

          {/* Centre circle + spot */}
          <circle cx="50" cy="70" r="12"
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.7)" />

          {/* Top penalty area */}
          <rect x="24" y="5" width="52" height="20"
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          {/* Top 6-yard box */}
          <rect x="36" y="5" width="28" height="10"
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          {/* Top goal */}
          <rect x="42" y="2" width="16" height="4"
            fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" />
          {/* Top penalty spot */}
          <circle cx="50" cy="22" r="0.8" fill="rgba(255,255,255,0.7)" />

          {/* Bottom penalty area */}
          <rect x="24" y="115" width="52" height="20"
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          {/* Bottom 6-yard box */}
          <rect x="36" y="125" width="28" height="10"
            fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.5" />
          {/* Bottom goal */}
          <rect x="42" y="134" width="16" height="4"
            fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="0.8" />
          {/* Bottom penalty spot */}
          <circle cx="50" cy="118" r="0.8" fill="rgba(255,255,255,0.7)" />

          {/* Subtle 3×3 zone grid */}
          <line x1="35" y1="5"  x2="35" y2="135"
            stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="3 2" />
          <line x1="65" y1="5"  x2="65" y2="135"
            stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="3 2" />
          <line x1="5"  y1="50" x2="95" y2="50"
            stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="3 2" />
          <line x1="5"  y1="90" x2="95" y2="90"
            stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" strokeDasharray="3 2" />

          {/* Team attack-direction labels */}
          <text x="50" y="13" textAnchor="middle"
            fill="rgba(255,255,255,0.35)" fontSize="3.5" fontWeight="600">
            {home.slice(0, 10).toUpperCase()} ▲
          </text>
          <text x="50" y="133" textAnchor="middle"
            fill="rgba(255,255,255,0.35)" fontSize="3.5" fontWeight="600">
            {away.slice(0, 10).toUpperCase()} ▼
          </text>

          {/* Active zone highlight */}
          {ballPos && activeEvent && (() => {
            const [bx, by] = ballPos;
            const isHome = activeEvent.team === home;
            const color  = isHome ? "#22c55e" : "#ef4444";
            return (
              <rect
                x={bx - 15} y={by - 22} width={30} height={44}
                fill={`${color}22`} stroke={`${color}55`}
                strokeWidth="0.6" rx="2"
              />
            );
          })()}

          {/* Player positions */}
          {positions.map((p, i) => {
            const isHome = p.team === home;
            const [sx, sy] = toSVG(
              Math.max(0, Math.min(100, p.pitch_x)),
              Math.max(0, Math.min(100, p.pitch_y)),
            );
            const fill   = isHome ? "#22c55e" : "#ef4444";
            const stroke = isHome ? "#16a34a" : "#dc2626";
            const label  = p.number != null
              ? String(p.number)
              : (p.name.split(" ").pop() ?? p.name).slice(0, 3);
            return (
              <g key={i}>
                <circle cx={sx} cy={sy} r="5.5"
                  fill={fill} stroke={stroke} strokeWidth="0.8" />
                <text x={sx} y={sy + 0.8}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="3.2" fontWeight="bold"
                  style={{ pointerEvents: "none" }}>
                  {label}
                </text>
                <text x={sx} y={sy + 8.5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)" fontSize="2.6"
                  style={{ pointerEvents: "none" }}>
                  {(p.name.split(" ").pop() ?? "").slice(0, 7)}
                </text>
              </g>
            );
          })}

          {/* Event ball marker */}
          {ballPos && (
            <g>
              <circle cx={ballPos[0]} cy={ballPos[1]} r="5.5"
                fill="white" stroke="#c8962a" strokeWidth="1.2" />
              <text
                x={ballPos[0]} y={ballPos[1] + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="5" style={{ pointerEvents: "none" }}>
                {EVENT_EMOJI[activeEvent?.event_type ?? ""] ?? "●"}
              </text>
            </g>
          )}

          {/* Placeholder text when no data */}
          {!isLoading && !hasData && placeholderText && (
            <text x="50" y="70"
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.28)" fontSize="4.5"
              style={{ pointerEvents: "none" }}>
              {placeholderText}
            </text>
          )}
        </svg>

        {/* Loading overlay */}
        {isLoading && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: 6,
            backgroundColor: "rgba(30,70,30,0.65)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ textAlign: "center" }}>
              <Loader2 size={28} color="white"
                style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 8px" }} />
              <p style={{ color: "white", fontSize: 11, fontWeight: 600, margin: 0 }}>
                {phase === "upload" ? "Uploading audio…" : "Gemini is analysing…"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active event label */}
      {activeEvent && (
        <div style={{
          marginTop: 10, padding: "8px 12px",
          backgroundColor: "#f0fdf4", borderRadius: 8,
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1 }}>
            {EVENT_EMOJI[activeEvent.event_type] ?? "●"}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#1a1a1a", lineHeight: 1.4, wordBreak: "break-word" }}>
              {activeEvent.description}
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
              {activeEvent.minute != null && (
                <span style={{ fontSize: 10, color: "#888" }}>{activeEvent.minute}&apos;</span>
              )}
              {activeEvent.zone_source === "spatial_cue" && (
                <span style={{ fontSize: 10, backgroundColor: "#d1fae5", color: "#065f46", borderRadius: 4, padding: "1px 6px" }}>
                  spatial cue
                </span>
              )}
              {activeEvent.zone_source === "formation_default" && (
                <span style={{ fontSize: 10, backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: 4, padding: "1px 6px" }}>
                  formation est.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
        {[
          { color: "#22c55e", border: "#16a34a", label: home },
          { color: "#ef4444", border: "#dc2626", label: away },
          { color: "white",   border: "#c8962a", label: "Event" },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: color, border: `1.5px solid ${border}`, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#555" }}>{label.length > 10 ? label.slice(0, 10) + "…" : label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
