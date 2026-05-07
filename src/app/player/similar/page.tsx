"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, MapPin, Shirt, ExternalLink } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import api from "@/lib/api";

interface SimilarPlayer {
  player_id: string;
  name?: string;
  initials?: string;
  position?: string;
  province?: string;
  age_group?: string;
  chemistry_score: number;
  shared_strengths?: string[];
  style_score?: number;
  demographic_score?: number;
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 55) return "text-orange-400";
  return "text-red-400";
}

function scoreBg(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-400";
  if (score >= 55) return "bg-orange-400";
  return "bg-red-400";
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Good";
  return "Developing";
}

export default function SimilarPlayersPage() {
  const { user } = useAuthStore();
  const [players, setPlayers]   = useState<SimilarPlayer[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        // Check consent state first (from profile)
        const profRes = await api.get("/profile").catch(() => null);
        const prof = profRes?.data?.profile ?? profRes?.data;
        const consented = prof?.safeguarding_consent_chemistry ?? false;
        setHasConsent(!!consented);

        if (!consented) {
          setLoading(false);
          return;
        }

        const res = await api.get(`/chemistry/similar/${user.id}`);
        const raw = res.data?.data ?? res.data;
        setPlayers(safeArray<SimilarPlayer>(raw));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("404") || msg.includes("403")) {
          setPlayers([]);
        } else {
          setError("Could not load similarity data. Try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 space-y-6">

        {/* Header */}
        <div>
          <Link
            href="/player"
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs mb-2 transition-colors"
          >
            <ArrowLeft size={12} /> Player Hub
          </Link>
          <h1 className="text-2xl font-black text-white">Players Like You</h1>
          <p className="text-white/50 text-sm mt-0.5">
            Players who share your style, position and energy — ranked by compatibility
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {/* Consent required */}
        {!loading && hasConsent === false && (
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1a5c2a]/50 border border-white/10">
              <Users className="text-[#f0b429]" size={24} />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Chemistry Matching is Off</h2>
              <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
                Enable chemistry matching in your settings to discover players who share your style
                and see how compatible you are with your squadmates.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a] transition-opacity hover:opacity-90"
            >
              Enable in Settings
            </Link>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Empty state — consented but no data yet */}
        {!loading && !error && hasConsent && players.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-10 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
              <Users className="text-white/30" size={24} />
            </div>
            <p className="text-white font-semibold">No matches yet</p>
            <p className="text-white/40 text-sm max-w-sm mx-auto">
              You need at least 8 drills across 3 sessions to build a style fingerprint.
              The nightly similarity job runs at 02:00 Harare time.
            </p>
            <Link
              href="/player/drills"
              className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-xs font-bold text-[#1a3a1a] mt-2"
            >
              Start Training
            </Link>
          </div>
        )}

        {/* Player cards */}
        {!loading && !error && players.length > 0 && (
          <div className="space-y-3">
            {players.map((p, i) => (
              <div
                key={p.player_id}
                className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Rank + avatar */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                    <span className="text-white/30 text-xs font-mono w-5 text-center">{i + 1}</span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a5c2a]/60 border border-white/10 text-sm font-bold text-[#f0b429]">
                      {p.initials ?? p.name?.slice(0, 2).toUpperCase() ?? "??"}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {p.name ?? p.initials ?? "Anonymous Player"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {p.position && (
                            <span className="flex items-center gap-1 text-white/50 text-xs">
                              <Shirt size={10} /> {p.position}
                            </span>
                          )}
                          {p.province && (
                            <span className="flex items-center gap-1 text-white/50 text-xs">
                              <MapPin size={10} /> {p.province}
                            </span>
                          )}
                          {p.age_group && (
                            <span className="text-white/40 text-xs">{p.age_group}</span>
                          )}
                        </div>
                      </div>

                      {/* Score badge */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-2xl font-black ${scoreColor(p.chemistry_score)}`}>
                          {Math.round(p.chemistry_score)}%
                        </div>
                        <div className="text-white/40 text-xs">{scoreLabel(p.chemistry_score)}</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${scoreBg(p.chemistry_score)}`}
                        style={{ width: `${Math.min(100, p.chemistry_score)}%` }}
                      />
                    </div>

                    {/* Shared strengths */}
                    {p.shared_strengths && p.shared_strengths.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {p.shared_strengths.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-green-500/15 border border-green-500/20 px-2 py-0.5 text-xs text-green-300 capitalize"
                          >
                            {s.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* View public passport */}
                    <Link
                      href={`/passport/${p.player_id}`}
                      className="mt-3 inline-flex items-center gap-1 text-xs text-white/40 hover:text-[#f0b429] transition-colors"
                    >
                      <ExternalLink size={10} /> View talent passport
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info banner */}
        {!loading && hasConsent && (
          <div className="rounded-2xl border border-white/5 bg-white/3 p-4 text-center">
            <p className="text-white/30 text-xs">
              Similarity is calculated nightly using your style fingerprint — 60% training style · 25% demographics · 15% location.
              Names are privacy-protected for U18 players.{" "}
              <Link href="/settings" className="text-white/50 hover:text-white underline transition-colors">
                Manage privacy settings
              </Link>
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
