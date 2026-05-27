"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, User, Share2, Copy, Check,
  MapPin, Star, Eye, Video,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Profile {
  sport:               string;
  position:            string;
  province:            string;
  age_group:           string;
  preferred_foot:      string;
  height_cm:           string;
  weight_kg:           string;
  club:                string;
  school:              string;
  bio:                 string;
  scout_visible:       boolean;
  verification_status: string;
  photo_url:           string | null;
  ai_narrative?:       string;
  joy_score?:          number;
}

interface ShowcaseClip {
  id: string;
  skill_type: string;
  video_url: string;
  ai_rating: number;
  top_strength: string;
  scout_note: string;
  open_for_scouting: boolean;
  view_count: number;
}

const LS_KEY = "grassroots_showcase_clips";

function loadLocalClips(): ShowcaseClip[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}

export default function ScoutViewPage() {
  const { user } = useAuthStore();
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [clips, setClips]       = useState<ShowcaseClip[]>([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/profile").catch(() => null),
      api.get("/player/showcase").catch(() => null),
    ]).then(([profRes, clipRes]) => {
      if (profRes) setProfile(profRes.data);
      const apiClips: ShowcaseClip[] = clipRes?.data?.data ?? clipRes?.data ?? [];
      setClips(apiClips.length ? apiClips : loadLocalClips());
    }).finally(() => setLoading(false));
  }, [user]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/player/public/${user?.id}`
    : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard not available */ }
  };

  const visibleClips = clips.filter((c) => c.open_for_scouting);

  if (!user || loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Link href="/player/profile" className="rounded-lg p-1.5 transition-colors hover:bg-muted">
              <ArrowLeft className="h-4 w-4 text-white" />
            </Link>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-widest text-accent">Scout View</p>
              <h1 className="mt-0.5 text-2xl font-bold text-white">How scouts see you</h1>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy link"}
              <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Shareable link banner */}
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/5 px-4 py-3">
            <Share2 className="h-4 w-4 flex-shrink-0 text-[#f0b429]" />
            <p className="text-xs text-muted-foreground">
              Share your public profile:{" "}
              <span className="break-all font-mono text-[#f0b429]">{shareUrl}</span>
            </p>
          </div>

          {/* Player card — scout view */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-sm">

            {/* Top row: photo + identity */}
            <div className="mb-5 flex items-start gap-5">
              <div className="relative">
                {profile?.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photo_url}
                    alt={user.name}
                    className="h-20 w-20 rounded-full border-2 border-[#f0b429]/30 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b429]/10">
                    <User className="h-10 w-10 text-[#f0b429]" />
                  </div>
                )}
                {profile?.verification_status === "approved" && (
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                  {profile?.verification_status === "approved" && (
                    <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-400">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold capitalize text-[#f0b429]">
                  {profile?.position} · {profile?.sport?.toUpperCase() ?? "Football"}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile?.province ?? "Zimbabwe"} · {profile?.age_group?.toUpperCase() ?? "—"}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mb-5 grid grid-cols-3 gap-3">
              {[
                { label: "Height",   value: profile?.height_cm ? `${profile.height_cm} cm` : "—" },
                { label: "Weight",   value: profile?.weight_kg ? `${profile.weight_kg} kg` : "—" },
                { label: "Foot",     value: profile?.preferred_foot ? `${profile.preferred_foot.charAt(0).toUpperCase()}${profile.preferred_foot.slice(1)}` : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-white/5 p-3 text-center">
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Club / School */}
            {(profile?.club || profile?.school) && (
              <div className="mb-5 flex flex-wrap gap-2">
                {profile.club && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    🏟️ {profile.club}
                  </span>
                )}
                {profile.school && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                    🏫 {profile.school}
                  </span>
                )}
              </div>
            )}

            {/* AI Narrative */}
            {profile?.ai_narrative && (
              <div className="mb-5 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#f0b429]">
                  Scout Profile
                </p>
                <p className="text-sm leading-relaxed text-white">{profile.ai_narrative}</p>
              </div>
            )}

            {/* Beautiful Game Score */}
            {(profile?.joy_score ?? 0) > 0 && (
              <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Beautiful Game Score
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-[#f0b429]">{profile?.joy_score}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <span className="text-2xl">⚽</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f0b429] to-[#f5c542]"
                    style={{ width: `${profile?.joy_score ?? 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Measures passion and consistency — logged joyful training experiences
                </p>
              </div>
            )}

            {/* Bio */}
            {profile?.bio && (
              <div className="mb-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Player Bio
                </p>
                <p className="text-sm leading-relaxed text-white">{profile.bio}</p>
              </div>
            )}

            {/* Availability */}
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              profile?.scout_visible
                ? "bg-green-500/10 text-green-400"
                : "bg-muted text-muted-foreground"
            }`}>
              <Eye className="h-4 w-4" />
              {profile?.scout_visible
                ? "Open for scouting — this player is available for contact"
                : "Not currently accepting scout contact"}
            </div>
          </div>

          {/* Showcase clips */}
          {visibleClips.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">
                Showcase Clips ({visibleClips.length})
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {visibleClips.slice(0, 4).map((clip) => (
                  <div
                    key={clip.id}
                    className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm"
                  >
                    <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-black/40">
                      {clip.video_url ? (
                        <video
                          src={clip.video_url}
                          className="h-full w-full rounded-xl object-cover"
                          controls
                          preload="metadata"
                        />
                      ) : (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-[#f0b429]/20 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#f0b429]">
                        {clip.skill_type}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#f0b429] text-[#f0b429]" />
                        <span className="text-sm font-bold text-white">{clip.ai_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{clip.scout_note}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {clip.view_count} views
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA for scouts */}
          <div className="rounded-2xl border border-white/10 bg-[#1a3d26]/80 p-6 text-center">
            <p className="mb-1 text-sm font-medium text-white">This is your shareable scout profile</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Send the link above to coaches, scouts or clubs to share your full profile
            </p>
            <button
              onClick={copyLink}
              className="flex mx-auto items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-2.5 text-sm font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link copied!" : "Copy my profile link"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
