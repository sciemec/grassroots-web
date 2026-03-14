"use client";

import { VoiceCommentary } from "@/components/video/voice-commentary";

interface StreamInfoPanelProps {
  sport: string;
  setSport: (v: string) => void;
  homeTeam: string;
  setHomeTeam: (v: string) => void;
  awayTeam: string;
  setAwayTeam: (v: string) => void;
  venue: string;
  setVenue: (v: string) => void;
  streamId: string;
  resolution: string;
  duration: number;
  commentaryText: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "00")}`;
}

/** Right-panel with match details, stream stats, and voice commentary. */
export function StreamInfoPanel({
  sport, setSport,
  homeTeam, setHomeTeam,
  awayTeam, setAwayTeam,
  venue, setVenue,
  streamId, resolution, duration, commentaryText,
}: StreamInfoPanelProps) {
  const inputClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-4">
      {/* Match info form */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">Match Information</h3>
        <div className="space-y-2">
          <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Sport (e.g. Football)" className={inputClass} />
          <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="Home team" className={inputClass} />
          <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="Away team" className={inputClass} />
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className={inputClass} />
        </div>
      </div>

      {/* Stream stats */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <h3 className="text-sm font-semibold">Stream Info</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Stream ID: <span className="font-mono font-bold text-foreground">{streamId}</span></p>
          <p>Resolution: <span className="font-mono text-foreground">{resolution}</span></p>
          <p>Duration: <span className="font-mono text-foreground">{formatDuration(duration)}</span></p>
          <p className="pt-1 text-[10px] italic">Share link available in Phase 6b (requires signaling server)</p>
        </div>
      </div>

      {/* Voice commentary */}
      <VoiceCommentary commentary={commentaryText} autoPlay={false} style="enthusiastic" />
    </div>
  );
}
