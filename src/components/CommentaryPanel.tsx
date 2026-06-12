"use client";

import { useEffect, useState } from "react";
import type { ISportsMatch } from "@/lib/isports/types";

interface CommentaryPanelProps {
  match: ISportsMatch;
}

interface CommentaryLine {
  minute: number;
  text: string;
  generated: boolean;
}

// Simple AI commentary lines based on match state
function generateCommentary(match: ISportsMatch): CommentaryLine[] {
  const lines: CommentaryLine[] = [];
  const minute = match.match_minute;

  if (match.home_score > match.away_score) {
    lines.push({
      minute,
      text: `${match.home_team_name} are in the lead — looking dangerous on the counter.`,
      generated: true,
    });
  } else if (match.away_score > match.home_score) {
    lines.push({
      minute,
      text: `${match.away_team_name} with the advantage — pressing high and winning second balls.`,
      generated: true,
    });
  } else {
    lines.push({
      minute,
      text: "Level match — both sides looking for a moment of quality to break the deadlock.",
      generated: true,
    });
  }

  if (match.match_period === "HT") {
    lines.push({
      minute: 45,
      text: "Half time. Both coaches will be addressing tactical adjustments in the dressing room.",
      generated: true,
    });
  }

  return lines;
}

export function CommentaryPanel({ match }: CommentaryPanelProps) {
  const [commentary, setCommentary] = useState<CommentaryLine[]>([]);

  useEffect(() => {
    if (match.match_status === "2") {
      const lines = generateCommentary(match);
      setCommentary((prev) => {
        const latest = lines[0];
        if (!latest) return prev;
        const alreadyExists = prev.some(
          (l) => l.minute === latest.minute && l.text === latest.text
        );
        return alreadyExists ? prev : [latest, ...prev].slice(0, 10);
      });
    }
  }, [match]);

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-[#f0b429] animate-pulse" />
        <h3 className="text-sm font-bold text-gray-300">THUTO Commentary</h3>
      </div>

      {commentary.length === 0 ? (
        <p className="text-gray-500 text-xs text-center py-4">
          Commentary will appear when the match is live
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {commentary.map((line, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <span className="text-[#f0b429] shrink-0 font-mono">{line.minute}&apos;</span>
              <p className="text-gray-300 leading-relaxed">{line.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
