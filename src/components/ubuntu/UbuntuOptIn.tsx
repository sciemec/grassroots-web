"use client";

import { useState } from "react";
import { Users, MapPin, CheckCircle2, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface Props {
  onOptIn: () => void;
}

export default function UbuntuOptIn({ onOptIn }: Props) {
  const [areaLabel,  setAreaLabel]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);
  const [error,      setError]      = useState("");

  const handleOptIn = async () => {
    if (!areaLabel.trim()) {
      setError("Tell THUTO where you train first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.patch("/profile", {
        area_label:    areaLabel.trim(),
        ubuntu_opt_in: true,
      });
      setConfirmed(true);
      setTimeout(() => onOptIn(), 2200);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-teal-500/20 bg-teal-900/10 px-5 py-6">
        <div className="flex items-start gap-3">
          {/* THUTO avatar */}
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-teal-400/40 bg-gradient-to-br from-teal-600 to-emerald-700 shadow-sm">
            <span className="text-sm font-bold text-white select-none">T</span>
          </div>
          <div className="rounded-2xl rounded-tl-sm border border-teal-500/20 bg-teal-900/40 px-4 py-3 text-sm leading-relaxed text-white">
            Welcome to the Ubuntu Network, {areaLabel}! 🌍
            <br />
            I&apos;ll find training partners near you. Check back tomorrow morning — I run matches at 08:00.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-900/20 to-emerald-900/10 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-teal-400/30 bg-teal-900/50">
          <Users className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <p className="font-bold text-white">Join the Ubuntu Network</p>
          <p className="text-xs text-teal-400/80">Vanhu pamwe — People together</p>
        </div>
      </div>

      {/* Body copy */}
      <p className="mb-4 text-sm leading-relaxed text-white/60">
        Train with players near you. Share what you have. Learn what you don&apos;t.
        <br />
        <span className="mt-1 block text-xs italic text-white/35">
          &quot;Umuntu ngumuntu ngabantu&quot; — I am because we are
        </span>
      </p>

      {/* Area input */}
      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/50">
          <MapPin className="h-3 w-3" />
          What area do you usually train in?
        </label>
        <input
          value={areaLabel}
          onChange={(e) => { setAreaLabel(e.target.value); setError(""); }}
          placeholder="e.g. Mbare, Bulawayo, Gweru..."
          maxLength={120}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-teal-500/50"
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Opt-in button */}
      <button
        onClick={handleOptIn}
        disabled={saving || !areaLabel.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Joining...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Join the Ubuntu Network
          </>
        )}
      </button>

      <p className="mt-2.5 text-center text-[11px] text-white/25">
        THUTO will find players near you each morning
      </p>
    </div>
  );
}
