"use client";

import { MatchEvent } from "../_types";

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  assist: "🎯",
  yellow_card: "🟨",
  red_card: "🟥",
  sub: "🔄",
  injury: "🚑",
  shot_on_target: "🎯",
  foul: "⚠️",
};

const EVENT_LABELS: Record<string, string> = {
  goal: "Goal",
  assist: "Assist",
  yellow_card: "Yellow Card",
  red_card: "Red Card",
  sub: "Substitution",
  injury: "Injury",
  shot_on_target: "Shot on Target",
  foul: "Foul",
};

interface EventLogProps {
  events: MatchEvent[];
  homeTeam: string;
  awayTeam: string;
}

/** Scrollable timeline of all match events. */
export function EventLog({ events, homeTeam, awayTeam }: EventLogProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No events logged yet
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 280 }}>
      {[...events].reverse().map((evt) => (
        <div
          key={evt.id}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
            evt.team === "home"
              ? "bg-blue-500/5"
              : "bg-red-500/5"
          }`}
        >
          <span className="w-10 flex-shrink-0 text-xs font-bold text-muted-foreground">
            {evt.minute}&apos;
          </span>
          <span className="text-base">{EVENT_ICONS[evt.type] ?? "•"}</span>
          <div className="flex-1 min-w-0">
            <span className="font-medium">{evt.player || "Unknown"}</span>
            <span className="ml-1.5 text-xs text-muted-foreground">
              {EVENT_LABELS[evt.type]} · {evt.team === "home" ? homeTeam : awayTeam}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
