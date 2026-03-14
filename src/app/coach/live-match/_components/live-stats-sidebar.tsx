"use client";

import { MatchEvent } from "../_types";

interface LiveStatsSidebarProps {
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  events: MatchEvent[];
  elapsedSeconds: number;
}

/** Formats seconds as MM:SS string. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Live stats panel showing score, shots, cards, and possession. */
export function LiveStatsSidebar({
  homeScore,
  awayScore,
  homeTeam,
  awayTeam,
  events,
  elapsedSeconds,
}: LiveStatsSidebarProps) {
  const homeShots = events.filter(
    (e) => (e.type === "shot_on_target" || e.type === "goal") && e.team === "home"
  ).length;
  const awayShots = events.filter(
    (e) => (e.type === "shot_on_target" || e.type === "goal") && e.team === "away"
  ).length;

  const homeYellows = events.filter(
    (e) => e.type === "yellow_card" && e.team === "home"
  ).length;
  const awayYellows = events.filter(
    (e) => e.type === "yellow_card" && e.team === "away"
  ).length;

  const homeReds = events.filter(
    (e) => e.type === "red_card" && e.team === "home"
  ).length;
  const awayReds = events.filter(
    (e) => e.type === "red_card" && e.team === "away"
  ).length;

  const totalEvents = events.length;
  const homeEvents = events.filter((e) => e.team === "home").length;
  const estPossession =
    totalEvents > 0 ? Math.round((homeEvents / totalEvents) * 100) : 50;

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="font-mono text-4xl font-black tracking-widest">
          {formatTime(elapsedSeconds)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Match time</p>
      </div>

      {/* Score */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="max-w-[80px] truncate font-medium text-foreground">
            {homeTeam}
          </span>
          <span className="max-w-[80px] truncate text-right font-medium text-foreground">
            {awayTeam}
          </span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <span className="text-5xl font-black text-blue-600">{homeScore}</span>
          <span className="text-2xl text-muted-foreground">–</span>
          <span className="text-5xl font-black text-red-600">{awayScore}</span>
        </div>
      </div>

      {/* Stats table */}
      <div className="rounded-xl border bg-card divide-y">
        {[
          { label: "Shots on Target", home: homeShots, away: awayShots },
          { label: "Yellow Cards", home: homeYellows, away: awayYellows },
          { label: "Red Cards", home: homeReds, away: awayReds },
          {
            label: "Est. Possession",
            home: `${estPossession}%`,
            away: `${100 - estPossession}%`,
          },
        ].map(({ label, home, away }) => (
          <div key={label} className="flex items-center px-4 py-2.5 text-sm">
            <span className="w-12 text-center font-bold">{home}</span>
            <span className="flex-1 text-center text-xs text-muted-foreground">
              {label}
            </span>
            <span className="w-12 text-center font-bold">{away}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
