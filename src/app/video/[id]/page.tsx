"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Eye, Play, ArrowLeft, UserPlus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const SPORT_EMOJI: Record<string, string> = {
  football:   "⚽",
  rugby:      "🏉",
  netball:    "🏐",
  athletics:  "🏃",
  cricket:    "🏏",
  basketball: "🏀",
  swimming:   "🏊",
  tennis:     "🎾",
  volleyball: "🏐",
  hockey:     "🏑",
};

interface VideoData {
  id: string;
  user_id: string;
  player_id: string;
  player_name: string;
  body: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sport: string | null;
  province: string | null;
  position: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  avatar_url?: string | null;
}

export default function PublicVideoPage({ params }: { params: { id: string } }) {
  const [video, setVideo]     = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch(`${API}/public/videos/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((json) => setVideo(json.data ?? json))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#f0b429] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-white text-lg font-semibold">Video not found</p>
        <p className="text-gray-400 text-sm">This clip may have been removed or made private.</p>
        <Link href="/" className="text-[#f0b429] text-sm font-semibold underline">
          Back to home
        </Link>
      </div>
    );
  }

  const sportLabel = video.sport
    ? video.sport.charAt(0).toUpperCase() + video.sport.slice(1)
    : null;
  const emoji = video.sport ? (SPORT_EMOJI[video.sport.toLowerCase()] ?? "🏅") : "🏅";
  const initials = video.player_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Minimal nav */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white">
          <ArrowLeft className="h-4 w-4 text-gray-400" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_v2.png" alt="Grassroots Sport" width={28} height={28} className="rounded-md" />
          <span className="text-sm font-bold text-white hidden sm:inline">
            Grassroots <span style={{ color: "#F5C842" }}>Sport</span>
          </span>
        </Link>
        <Link
          href="/register"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition"
          style={{ background: "#E6A817", color: "#2C2416" }}
        >
          <UserPlus className="h-3 w-3" />
          Join Free
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Video player */}
        <div
          className="relative w-full rounded-xl overflow-hidden bg-[#1c3d22]"
          style={{ paddingBottom: "56.25%" }}
        >
          <video
            src={video.video_url}
            poster={video.thumbnail_url ?? undefined}
            controls
            playsInline
            autoPlay
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* View count */}
        {video.view_count > 0 && (
          <div className="mt-2 flex items-center gap-1 text-gray-500 text-xs">
            <Eye className="h-3 w-3" />
            <span>
              {video.view_count >= 1000
                ? `${(video.view_count / 1000).toFixed(1)}k views`
                : `${video.view_count} views`}
            </span>
          </div>
        )}

        {/* Athlete info */}
        <div className="mt-4 flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold"
            style={{ background: "#1c3d22", color: "#c8962a" }}
          >
            {video.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={video.avatar_url}
                alt={video.player_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold truncate">{video.player_name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-400">
              {sportLabel && (
                <span>{emoji} {sportLabel}</span>
              )}
              {video.position && (
                <span className="capitalize">{video.position}</span>
              )}
              {video.province && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5" />
                  {video.province}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Caption */}
        {video.body && (
          <p className="mt-3 text-gray-300 text-sm leading-relaxed">{video.body}</p>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-xl p-5 text-center" style={{ background: "#1c3d22" }}>
          <div className="flex justify-center mb-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(240,180,41,0.15)" }}
            >
              <Play className="h-5 w-5 text-[#f0b429] fill-[#f0b429]" />
            </div>
          </div>
          <p className="text-white font-bold text-base mb-1">
            Discover Zimbabwe&apos;s next stars
          </p>
          <p className="text-green-300 text-xs mb-4">
            Join free to upload your own clips, get AI coaching, and be discovered by scouts.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/register"
              className="rounded-lg px-5 py-2.5 text-sm font-bold transition"
              style={{ background: "#f0b429", color: "#1c3d22" }}
            >
              Create Free Account
            </Link>
            <Link
              href="/"
              className="rounded-lg px-5 py-2.5 text-sm font-semibold border border-green-700 text-green-300 hover:bg-green-900/30 transition"
            >
              Browse More Clips
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
