"use client";

import { useMemo } from "react";
import { ZONE_GRID, type Zone } from "@/lib/commentary-zones";

interface ZonedEvent {
  minute: number | null;
  audio_time_seconds: number | null;
  event_type: string;
  team: string | null;
  player: string | null;
  description: string;
  zone?: string | null;
  zone_source?: string | null;
}

interface MatchZonePitchProps {
  events: ZonedEvent[];
  /** Current audio playback position in seconds. */
  audioCur: number;
  homeTeam: string;
  awayTeam: string;
  homeColor?: string;
  awayColor?: string;
}

const EVENT_EMOJI: Record<string, string> = {
  goal:         "⚽",
  yellow_card:  "🟨",
  red_card:     "🟥",
  penalty:      "⚡",
  corner:       "🚩",
  substitution: "🔄",
  free_kick:    "🎯",
  injury:       "🏥",
  var_check:    "📺",
};

const VALID_ZONES = new Set<Zone>([
  "top_left", "top_center", "top_right",
  "mid_left", "mid_center", "mid_right",
  "bot_left", "bot_center", "bot_right",
]);

function isValidZone(z: string | null | undefined): z is Zone {
  return typeof z === "string" && VALID_ZONES.has(z as Zone);
}

export default function MatchZonePitch({
  events,
  audioCur,
  homeTeam,
  awayTeam,
  homeColor = "#1a5c2a",
  awayColor = "#c8962a",
}: MatchZonePitchProps) {
  // Only work with events that have valid zone data
  const zoned = useMemo(
    () => events.filter((e) => isValidZone(e.zone)),
    [events],
  );

  // Most recent event at or before the current audio position
  const activeIdx = useMemo(() => {
    if (zoned.length === 0) return -1;
    let best = -1;
    for (let i = 0; i < zoned.length; i++) {
      const t = zoned[i].audio_time_seconds;
      if (t !== null && t !== undefined && t <= audioCur) {
        best = i;
      }
    }
    return best;
  }, [zoned, audioCur]);

  if (zoned.length === 0) return null;

  const activeEvent = activeIdx >= 0 ? zoned[activeIdx] : null;
  const activeZone  = isValidZone(activeEvent?.zone) ? activeEvent!.zone! : null;
  const [activeRow, activeCol] = activeZone ? ZONE_GRID[activeZone] : [-1, -1];

  // Previous 3 events for the trail
  const trailEvents = activeIdx > 0
    ? zoned.slice(Math.max(0, activeIdx - 3), activeIdx)
    : [];

  // Ball centre position as percentages
  const ballLeft = activeCol >= 0 ? `${activeCol * 33.33 + 16.67}%` : "50%";
  const ballTop  = activeRow >= 0 ? `${activeRow * 33.33 + 16.67}%` : "50%";

  const teamColor = (team: string | null) => {
    if (!team) return "#888";
    if (team === homeTeam) return homeColor;
    if (team === awayTeam) return awayColor;
    return "#888";
  };

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0d2b18" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: homeColor }}>{homeTeam}</span>
          <span className="text-white/30 text-xs">vs</span>
          <span className="text-xs font-semibold" style={{ color: awayColor }}>{awayTeam}</span>
        </div>
        <span className="text-xs text-white/40">Play Zone Tracker</span>
      </div>

      {/* Pitch */}
      <div className="relative mx-auto" style={{ width: "100%", maxWidth: 420, aspectRatio: "7/10" }}>
        {/* Pitch background */}
        <svg
          viewBox="0 0 210 300"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Grass stripes */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect
              key={i}
              x={0} y={i * 43} width={210} height={43}
              fill={i % 2 === 0 ? "#145026" : "#1a5c2a"}
            />
          ))}

          {/* Outer boundary */}
          <rect x={8} y={8} width={194} height={284} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} rx={1} />

          {/* Centre line */}
          <line x1={8} y1={150} x2={202} y2={150} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />

          {/* Centre circle */}
          <circle cx={105} cy={150} r={28} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          <circle cx={105} cy={150} r={2} fill="rgba(255,255,255,0.5)" />

          {/* Top penalty area */}
          <rect x={47} y={8} width={116} height={52} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          {/* Top 6-yard box */}
          <rect x={75} y={8} width={60} height={20} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          {/* Top penalty spot */}
          <circle cx={105} cy={42} r={1.5} fill="rgba(255,255,255,0.5)" />

          {/* Bottom penalty area */}
          <rect x={47} y={240} width={116} height={52} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          {/* Bottom 6-yard box */}
          <rect x={75} y={272} width={60} height={20} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
          {/* Bottom penalty spot */}
          <circle cx={105} cy={258} r={1.5} fill="rgba(255,255,255,0.5)" />

          {/* Zone grid dashes */}
          {/* Vertical dividers at x=78 and x=132 (thirds) */}
          <line x1={78} y1={8} x2={78} y2={292} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} strokeDasharray="4 3" />
          <line x1={132} y1={8} x2={132} y2={292} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} strokeDasharray="4 3" />
          {/* Horizontal dividers at y=108 and y=192 (thirds) */}
          <line x1={8} y1={108} x2={202} y2={108} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} strokeDasharray="4 3" />
          <line x1={8} y1={192} x2={202} y2={192} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} strokeDasharray="4 3" />
        </svg>

        {/* Active zone highlight */}
        {activeZone && (
          <div
            className="absolute pointer-events-none transition-all duration-500"
            style={{
              left:   `${activeCol * 33.33}%`,
              top:    `${activeRow * 33.33}%`,
              width:  "33.33%",
              height: "33.33%",
              background: `${teamColor(activeEvent?.team ?? null)}22`,
              border: `1.5px solid ${teamColor(activeEvent?.team ?? null)}66`,
              borderRadius: 4,
            }}
          />
        )}

        {/* Trail dots (last 3 events, fading) */}
        {trailEvents.map((ev, i) => {
          if (!isValidZone(ev.zone)) return null;
          const [r, c] = ZONE_GRID[ev.zone];
          const opacity = 0.15 + i * 0.12;
          const size    = 6 + i * 2;
          return (
            <div
              key={`trail-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                left:      `calc(${c * 33.33 + 16.67}% - ${size / 2}px)`,
                top:       `calc(${r * 33.33 + 16.67}% - ${size / 2}px)`,
                width:     size,
                height:    size,
                background: teamColor(ev.team),
                opacity,
              }}
            />
          );
        })}

        {/* Animated ball / event marker */}
        {activeZone && (
          <div
            className="absolute flex items-center justify-center rounded-full shadow-lg pointer-events-none"
            style={{
              left:       `calc(${ballLeft} - 16px)`,
              top:        `calc(${ballTop} - 16px)`,
              width:      32,
              height:     32,
              background: teamColor(activeEvent?.team ?? null),
              border:     "2px solid rgba(255,255,255,0.8)",
              fontSize:   14,
              transition: "left 0.65s cubic-bezier(0.34,1.56,0.64,1), top 0.65s cubic-bezier(0.34,1.56,0.64,1)",
              zIndex:     10,
            }}
          >
            {EVENT_EMOJI[activeEvent?.event_type ?? ""] ?? "●"}
          </div>
        )}

        {/* No active event yet — placeholder */}
        {!activeZone && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/30 text-xs text-center px-4">
              Play the audio recording to see<br />zone tracking
            </p>
          </div>
        )}
      </div>

      {/* Active event label */}
      {activeEvent && (
        <div
          className="px-4 py-2 border-t border-white/10 flex items-start gap-2"
          style={{ minHeight: 48 }}
        >
          <span className="text-base leading-none mt-0.5">
            {EVENT_EMOJI[activeEvent.event_type] ?? "●"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/80 leading-snug line-clamp-2">
              {activeEvent.description}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {activeEvent.minute !== null && (
                <span className="text-xs text-white/40">{activeEvent.minute}&apos;</span>
              )}
              {activeEvent.zone_source === "spatial_cue" && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1a3d26", color: "#6ee7b7", fontSize: 10 }}>
                  spatial cue
                </span>
              )}
              {activeEvent.zone_source === "formation_default" && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#1a2a3d", color: "#93c5fd", fontSize: 10 }}>
                  formation est.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-white/25 px-4 pb-3" style={{ fontSize: 10 }}>
        Estimated play zones · based on commentary and formation
      </p>
    </div>
  );
}
