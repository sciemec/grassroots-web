"use client";

import { useState } from "react";
import { MapPin, Star, Zap, CheckCircle2, MessageCircle } from "lucide-react";
import api from "@/lib/api";

interface Props {
  connectionId: string;
  thutoMessage: string;      // Claude-generated warm suggestion
  matchName: string;
  matchArea: string | null;
  theyHave: string[];        // e.g. ["ball", "boots"]
  theirStrengths: string[];  // e.g. ["shooting", "dribbling"]
  onRespond: (response: "accepted" | "declined") => void;
}

export default function UbuntuSuggestionCard({
  connectionId,
  thutoMessage,
  matchName,
  matchArea,
  theyHave,
  theirStrengths,
  onRespond,
}: Props) {
  const [responding,  setResponding]  = useState(false);
  const [accepted,    setAccepted]    = useState(false);
  const [declined,    setDeclined]    = useState(false);

  const respond = async (response: "accepted" | "declined") => {
    setResponding(true);
    try {
      await api.post(`/ubuntu/connections/${connectionId}/respond`, { response });
      if (response === "accepted") {
        setAccepted(true);
      } else {
        setDeclined(true);
      }
      onRespond(response);
    } catch {
      // silently fail — user can retry
    } finally {
      setResponding(false);
    }
  };

  // ── Accepted confirmation ──────────────────────────────────────────────────
  if (accepted) {
    return (
      <div className="rounded-2xl border border-teal-500/30 bg-teal-900/20 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <ThutoAvatar />
          <div className="rounded-2xl rounded-tl-sm border border-teal-500/20 bg-teal-900/40 px-4 py-3 text-sm leading-relaxed text-white">
            Ubuntu! 🤝 You and {matchName} are now training partners.
            <br />
            <span className="text-xs text-teal-300/80">
              Check WhatsApp — I've sent you both a message with your first drill.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-teal-400 flex-shrink-0" />
          <p className="text-xs text-white/60">
            WhatsApp confirmation sent to both players
          </p>
        </div>
      </div>
    );
  }

  // ── Declined ──────────────────────────────────────────────────────────────
  if (declined) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
        <p className="text-xs text-white/25 italic">
          Suggestion passed — THUTO will find another match tomorrow.
        </p>
      </div>
    );
  }

  // ── Default card ──────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 p-4 space-y-3">

      {/* THUTO speech bubble */}
      <div className="flex items-start gap-3">
        <ThutoAvatar />
        <div className="rounded-2xl rounded-tl-sm border border-teal-500/20 bg-teal-900/40 px-4 py-3 text-sm leading-relaxed text-white">
          {thutoMessage}
        </div>
      </div>

      {/* Match player card */}
      <div className="ml-12 rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-800/60 text-sm font-bold text-teal-300">
            {matchName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{matchName}</p>
            {matchArea && (
              <p className="flex items-center gap-1 text-[11px] text-white/40">
                <MapPin className="h-3 w-3" />
                {matchArea}
              </p>
            )}
          </div>
        </div>

        {/* Tags */}
        {(theyHave.length > 0 || theirStrengths.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {theyHave.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1 rounded-full bg-[#f0b429]/10 px-2 py-0.5 text-[11px] font-medium text-[#f0b429]"
              >
                <Zap className="h-2.5 w-2.5" />
                has {item}
              </span>
            ))}
            {theirStrengths.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 rounded-full bg-teal-900/40 px-2 py-0.5 text-[11px] text-teal-300"
              >
                <Star className="h-2.5 w-2.5" />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="ml-12 flex gap-2">
        <button
          onClick={() => respond("accepted")}
          disabled={responding}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
        >
          {responding ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Yes, let's train
        </button>
        <button
          onClick={() => respond("declined")}
          disabled={responding}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ── Shared THUTO avatar ───────────────────────────────────────────────────────

function ThutoAvatar() {
  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-teal-400/40 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-sm">
      <span className="text-xs font-bold text-white select-none">T</span>
    </div>
  );
}
