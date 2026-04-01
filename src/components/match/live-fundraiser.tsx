"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Heart, Trophy, Star } from "lucide-react";

interface Shoutout {
  name: string;
  amount: number;
  time: string;
}

interface FundraiserData {
  event_id: string;
  name: string;
  fundraiser_purpose: string | null;
  fundraiser_goal: number;
  fundraiser_raised: number;
  progress_pct: number;
  fundraiser_shoutouts: Shoutout[];
}

interface LiveFundraiserProps {
  eventId: string;
  onDonateClick?: () => void;
  compact?: boolean;
}

export function LiveFundraiser({ eventId, onDonateClick, compact = false }: LiveFundraiserProps) {
  const [data, setData]       = useState<FundraiserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/business/events/${eventId}/fundraiser`);
      if (!res.ok) { setError("Fundraiser not found."); return; }
      const json = await res.json() as FundraiserData;
      setData(json);
      setError("");
    } catch {
      setError("Could not load fundraiser status.");
    } finally {
      setLoading(false);
    }
  }, [eventId, apiUrl]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
        {error || "Fundraiser not available."}
      </div>
    );
  }

  const pct    = data.progress_pct;
  const raised = Number(data.fundraiser_raised).toFixed(2);
  const goal   = Number(data.fundraiser_goal).toFixed(2);

  return (
    <div className={`rounded-2xl border border-amber-500/30 bg-black/30 backdrop-blur-sm space-y-4 ${compact ? "p-4" : "p-5"}`}>
      {/* Header */}
      <div className="flex items-start gap-2">
        <Trophy className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-300/70 uppercase tracking-wide font-semibold">Live Fundraiser</p>
          {data.fundraiser_purpose && (
            <p className="text-sm text-white font-bold leading-tight mt-0.5">{data.fundraiser_purpose}</p>
          )}
        </div>
        <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-white/60">
            <span className="text-amber-300 font-bold text-xl">${raised}</span>
            {" "}raised
          </span>
          <span className="text-xs text-white/50">
            Goal: <span className="text-white font-semibold">${goal}</span>
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-1000"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className="text-right text-xs font-bold text-amber-400">{pct}% of goal</p>
      </div>

      {/* Shoutouts */}
      {data.fundraiser_shoutouts.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[11px] text-amber-300/70 uppercase tracking-wide font-semibold">
            <Star className="h-3 w-3" /> Recent supporters
          </p>
          <div className="space-y-1">
            {data.fundraiser_shoutouts.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5">
                <span className="text-xs text-white font-medium truncate">{s.name}</span>
                <span className="text-xs text-amber-400 font-bold ml-2 shrink-0">${s.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donate button */}
      {onDonateClick && (
        <button
          onClick={onDonateClick}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-bold text-black hover:from-amber-400 hover:to-yellow-300 transition-all active:scale-[0.98]"
        >
          <Heart className="h-4 w-4" />
          Support the Team (EcoCash / InnBucks)
        </button>
      )}
    </div>
  );
}
