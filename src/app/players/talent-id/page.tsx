"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, Eye, EyeOff, Share2, Copy, Check,
  Video, TrendingUp, User, MapPin, Shirt, ChevronRight, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Profile {
  id?: string;
  first_name?: string;
  surname?: string;
  position?: string;
  position_primary?: string;
  sport?: string;
  province?: string;
  club?: string;
  school?: string;
  bio?: string;
  avatar_url?: string;
  photo_url?: string;
  open_for_scouting?: boolean;
  scout_visible?: boolean;
  age_group?: string;
}

interface Session {
  id: string;
  overall_score: number | null;
  status: string;
  created_at: string;
}

// ─── Plays-like lookup ────────────────────────────────────────────────────────

const PLAYS_LIKE: Record<string, string> = {
  "striker":          "Knowledge Musona",
  "forward":          "Knowledge Musona",
  "winger":           "Khama Billiat",
  "attacking mid":    "Marvelous Nakamba (youth)",
  "midfielder":       "Marshall Munetsi",
  "central mid":      "Marshall Munetsi",
  "defensive mid":    "Marvelous Nakamba",
  "centre back":      "Teenage Hadebe",
  "defender":         "Teenage Hadebe",
  "left back":        "Ronald Pfumbidzai",
  "right back":       "Ronald Pfumbidzai",
  "goalkeeper":       "Edmore Sibanda",
};

function getPlaysLike(position: string | undefined): string | null {
  if (!position) return null;
  const key = position.toLowerCase();
  for (const [k, v] of Object.entries(PLAYS_LIKE)) {
    if (key.includes(k)) return v;
  }
  return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TalentIdPage() {
  const router   = useRouter();
  const { user } = useAuthStore();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [scouting, setScouting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied,   setCopied]   = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profRes, sessRes] = await Promise.allSettled([
          api.get("/profile"),
          api.get("/training/sessions"),
        ]);

        if (profRes.status === "fulfilled") {
          const p: Profile = profRes.value.data?.data ?? profRes.value.data ?? {};
          setProfile(p);
          setScouting(!!(p.open_for_scouting ?? p.scout_visible));
        }

        if (sessRes.status === "fulfilled") {
          setSessions(safeArray<Session>(sessRes.value.data));
        }
      } catch {
        setError("Could not load your profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // ── Toggle scouting ────────────────────────────────────────────────────────
  const toggleScouting = async () => {
    if (toggling) return;
    setToggling(true);
    const next = !scouting;
    setScouting(next); // optimistic
    try {
      await api.patch("/profile", { open_for_scouting: next });
    } catch {
      setScouting(!next); // rollback
    } finally {
      setToggling(false);
    }
  };

  // ── Share CV ───────────────────────────────────────────────────────────────
  const shareCV = () => {
    const id  = profile?.id ?? user?.id ?? "";
    const url = `${window.location.origin}/passport/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const avgScore = completedSessions.length
    ? Math.round(
        completedSessions.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) /
        completedSessions.length
      )
    : null;

  const position    = profile?.position ?? profile?.position_primary ?? "";
  const displayName = profile
    ? `${profile.first_name ?? ""} ${profile.surname ?? ""}`.trim() || user?.name || "Player"
    : user?.name || "Player";
  const playsLike   = getPlaysLike(position);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#1a5c2a]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Scout Profile</h1>
            <p className="text-sm text-white/60">Your talent card for scouts & coaches</p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#f0b429] animate-spin" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl bg-red-900/40 border border-red-500/30 p-4 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-4">

            {/* Identity Card */}
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-[#f0b429]/20 border-2 border-[#f0b429] flex items-center justify-center flex-shrink-0">
                  {profile?.avatar_url || profile?.photo_url ? (
                    <img
                      src={profile.avatar_url ?? profile.photo_url}
                      alt={displayName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-[#f0b429]">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">{displayName}</h2>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/70">
                    {position && (
                      <span className="flex items-center gap-1">
                        <Shirt className="w-3.5 h-3.5" /> {position}
                      </span>
                    )}
                    {profile?.sport && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> {profile.sport}
                      </span>
                    )}
                    {profile?.province && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {profile.province}
                      </span>
                    )}
                    {profile?.age_group && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> {profile.age_group}
                      </span>
                    )}
                  </div>

                  {profile?.club && (
                    <p className="mt-1 text-xs text-white/50">{profile.club}</p>
                  )}
                </div>
              </div>

              {profile?.bio && (
                <p className="mt-3 text-sm text-white/70 border-t border-white/10 pt-3">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Open for Scouting toggle */}
            <div className="rounded-2xl bg-white/10 border border-white/10 p-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium text-sm">Open for Scouting</p>
                <p className="text-white/50 text-xs mt-0.5">
                  {scouting
                    ? "Scouts can find and contact you"
                    : "Hidden from scout discovery feed"}
                </p>
              </div>
              <button
                onClick={toggleScouting}
                disabled={toggling}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  scouting
                    ? "bg-[#f0b429] text-[#1a3a1a]"
                    : "bg-white/10 text-white/60 hover:bg-white/20"
                }`}
              >
                {scouting ? (
                  <><Eye className="w-4 h-4" /> Visible</>
                ) : (
                  <><EyeOff className="w-4 h-4" /> Hidden</>
                )}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold text-[#f0b429]">{completedSessions.length}</p>
                <p className="text-xs text-white/60 mt-1">Sessions Logged</p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
                <p className="text-3xl font-bold text-[#f0b429]">
                  {avgScore !== null ? avgScore : "—"}
                </p>
                <p className="text-xs text-white/60 mt-1">Avg Score</p>
              </div>
            </div>

            {/* Plays Like */}
            {playsLike && (
              <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/20 p-4">
                <p className="text-xs text-[#f0b429] font-semibold uppercase tracking-wide mb-1">
                  Plays Like
                </p>
                <p className="text-white font-bold">{playsLike}</p>
                <p className="text-white/50 text-xs mt-0.5">
                  Based on your position profile
                </p>
              </div>
            )}

            {/* No profile prompt */}
            {!position && !profile?.sport && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-white/60 text-sm">Complete your profile to unlock your full scout card</p>
                <Link
                  href="/player/profile"
                  className="inline-block mt-2 text-[#f0b429] text-sm font-medium hover:underline"
                >
                  Edit Profile →
                </Link>
              </div>
            )}

            {/* Quick links */}
            <div className="space-y-2">
              <Link
                href="/player/showcase"
                className="flex items-center justify-between rounded-xl bg-white/10 border border-white/10 p-4 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-[#f0b429]" />
                  <div>
                    <p className="text-white text-sm font-medium">Showcase Clips</p>
                    <p className="text-white/50 text-xs">Upload skill videos for scouts</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>

              <Link
                href="/player/potential"
                className="flex items-center justify-between rounded-xl bg-white/10 border border-white/10 p-4 hover:bg-white/15 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#f0b429]" />
                  <div>
                    <p className="text-white text-sm font-medium">My Potential</p>
                    <p className="text-white/50 text-xs">Development trajectory & peak rating</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/40" />
              </Link>
            </div>

            {/* Share CV */}
            <button
              onClick={shareCV}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] text-[#1a3a1a] font-semibold py-3 hover:bg-[#f5c542] transition-colors"
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Link Copied!</>
              ) : (
                <><Share2 className="w-4 h-4" /> Share Public CV</>
              )}
            </button>

          </div>
        )}
      </main>
    </div>
  );
}
