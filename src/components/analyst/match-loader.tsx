"use client";

import { useEffect, useState } from "react";
import { Database, Loader2, X, ChevronRight, AlertCircle } from "lucide-react";
import { listMatches, type AnalystMatch } from "@/lib/analyst-api";

interface Props {
  onSelect: (match: AnalystMatch) => void;
  onClose: () => void;
  title?: string;
}

function fmt(date: string) {
  try {
    return new Date(date).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" });
  } catch { return date; }
}

export function MatchLoader({ onSelect, onClose, title = "Load from Saved Match" }: Props) {
  const [matches, setMatches] = useState<AnalystMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    listMatches()
      .then(setMatches)
      .catch(() => setError("Could not load matches. Check your connection."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-card shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Database className="h-4 w-4 text-primary" />
            {title}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="py-10 text-center">
              <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium text-white">No saved matches yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish a match in Live Match Collector to save it here.
              </p>
            </div>
          )}

          {!loading && matches.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {matches.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onSelect(m)}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-card/60 px-4 py-3 text-left transition-colors hover:bg-card hover:border-primary/40"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">
                      {m.home_team} vs {m.away_team}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fmt(m.match_date)} · {m.stats.home_goals}–{m.stats.away_goals} ·{" "}
                      {m.stats.home_shots + m.stats.away_shots} shots ·{" "}
                      {m.stats.total_events} events
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
