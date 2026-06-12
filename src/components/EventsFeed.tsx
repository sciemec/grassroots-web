"use client";

import type { ISportsEvent } from "@/lib/isports/types";

interface EventsFeedProps {
  events: ISportsEvent[];
}

const EVENT_ICON: Record<string, string> = {
  goal:         "⚽",
  yellow_card:  "🟨",
  red_card:     "🟥",
  substitution: "🔄",
  corner:       "🚩",
  offside:      "🚫",
  foul:         "⚠️",
};

export function EventsFeed({ events }: EventsFeedProps) {
  const sorted = [...events].sort((a, b) => b.event_minute - a.event_minute);

  if (sorted.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-bold text-gray-300 mb-3">Match Events</h3>
        <p className="text-gray-500 text-xs text-center py-4">No events yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-bold text-gray-300 mb-3">Match Events</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {sorted.map((event) => (
          <div key={event.event_id} className="flex items-start gap-2 text-xs">
            <span className="text-gray-500 w-8 shrink-0 text-right">
              {event.event_minute}&apos;
            </span>
            <span className="shrink-0">
              {EVENT_ICON[event.event_type] ?? "•"}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-white font-medium">
                {event.player_name ?? event.team_name}
              </span>
              {event.assist_player_name && (
                <span className="text-gray-400"> (assist: {event.assist_player_name})</span>
              )}
              <p className="text-gray-500 truncate">{event.event_description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
