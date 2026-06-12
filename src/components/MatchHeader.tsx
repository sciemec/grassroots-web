"use client";

import type { ISportsMatch } from "@/lib/isports/types";

interface MatchHeaderProps {
  match: ISportsMatch;
  lastUpdated: Date | null;
}

const STATUS_LABEL: Record<string, string> = {
  "1": "Not Started",
  "2": "Live",
  "3": "Finished",
};

const PERIOD_LABEL: Record<string, string> = {
  "1H": "1st Half",
  "2H": "2nd Half",
  HT: "Half Time",
  ET: "Extra Time",
  PEN: "Penalties",
};

export function MatchHeader({ match, lastUpdated }: MatchHeaderProps) {
  const isLive = match.match_status === "2";

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* League name */}
        <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-3">
          {match.league_name}
        </p>

        {/* Score row */}
        <div className="flex items-center justify-center gap-6">
          <span className="text-white font-bold text-lg text-right w-40 truncate">
            {match.home_team_name}
          </span>

          <div className="text-center">
            <div className="text-4xl font-black text-white tracking-tight">
              {match.home_score} – {match.away_score}
            </div>
            {isLive && (
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-bold">
                  {match.match_minute}&apos; {PERIOD_LABEL[match.match_period] ?? match.match_period}
                </span>
              </div>
            )}
            {!isLive && (
              <p className="text-gray-400 text-xs mt-1">
                {STATUS_LABEL[match.match_status] ?? "Unknown"}
              </p>
            )}
          </div>

          <span className="text-white font-bold text-lg text-left w-40 truncate">
            {match.away_team_name}
          </span>
        </div>

        {/* Cards row */}
        <div className="flex justify-center gap-8 mt-3 text-xs text-gray-500">
          {match.home_red_card > 0 && (
            <span>
              🟥 {match.home_team_name} ×{match.home_red_card}
            </span>
          )}
          {match.away_red_card > 0 && (
            <span>
              🟥 {match.away_team_name} ×{match.away_red_card}
            </span>
          )}
          {lastUpdated && (
            <span className="text-gray-600">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
