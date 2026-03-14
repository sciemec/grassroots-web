"use client";

import { useState } from "react";
import { EventType, MatchEvent } from "../_types";

const EVENT_BUTTONS: { type: EventType; emoji: string; label: string }[] = [
  { type: "goal", emoji: "⚽", label: "Goal" },
  { type: "assist", emoji: "🎯", label: "Assist" },
  { type: "yellow_card", emoji: "🟨", label: "Yellow" },
  { type: "red_card", emoji: "🟥", label: "Red" },
  { type: "sub", emoji: "🔄", label: "Sub" },
  { type: "injury", emoji: "🚑", label: "Injury" },
  { type: "shot_on_target", emoji: "🎯", label: "Shot" },
  { type: "foul", emoji: "⚠️", label: "Foul" },
];

interface EventLoggerProps {
  minute: number;
  homeTeam: string;
  awayTeam: string;
  onLog: (event: Omit<MatchEvent, "id">) => void;
}

/** Tap-based event logger panel with player name and team selection. */
export function EventLogger({
  minute,
  homeTeam,
  awayTeam,
  onLog,
}: EventLoggerProps) {
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [player, setPlayer] = useState("");
  const [team, setTeam] = useState<"home" | "away">("home");

  const handleConfirm = () => {
    if (!selectedType) return;
    onLog({ type: selectedType, minute, player, team });
    setSelectedType(null);
    setPlayer("");
  };

  return (
    <div className="space-y-3">
      {/* Event type grid */}
      <div className="grid grid-cols-4 gap-2">
        {EVENT_BUTTONS.map(({ type, emoji, label }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border text-xs font-medium transition-all ${
              selectedType === type
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <span className="text-xl">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Player + team inputs (shown when type is selected) */}
      {selectedType && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Log event at {minute}&apos;
          </p>

          <input
            type="text"
            value={player}
            onChange={(e) => setPlayer(e.target.value)}
            placeholder="Player name (optional)"
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTeam("home")}
              className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                team === "home"
                  ? "border-blue-500 bg-blue-500/10 text-blue-700"
                  : "hover:bg-muted/40"
              }`}
            >
              {homeTeam}
            </button>
            <button
              onClick={() => setTeam("away")}
              className={`rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                team === "away"
                  ? "border-red-500 bg-red-500/10 text-red-700"
                  : "hover:bg-muted/40"
              }`}
            >
              {awayTeam}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setSelectedType(null)}
              className="rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
