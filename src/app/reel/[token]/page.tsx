"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Play, Eye, MapPin, User, Trophy, ChevronRight,
  Clock, HardDrive, AlertCircle, Loader2,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReelVideo {
  id: string;
  title: string;
  tag: string;
  duration?: number;
  size_mb: number;
  thumbnail_url?: string;
  video_url: string;
  description?: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  position?: string;
  province?: string;
  sport?: string;
}

interface ReelInfo {
  id: string;
  title: string;
  views: number;
}

interface ReelData {
  reel: ReelInfo;
  player: PlayerInfo;
  videos: ReelVideo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

const TAG_COLORS: Record<string, string> = {
  Goals:        "bg-green-500/20 text-green-300 border-green-500/30",
  Skills:       "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Assists:      "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Defending:    "bg-red-500/20 text-red-300 border-red-500/30",
  "Full Match": "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

// ─── Video Thumbnail ──────────────────────────────────────────────────────────

function VideoThumb({
  video,
  active,
  onClick,
}: {
  video: ReelVideo;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
        active
          ? "border-green-500/50 bg-green-500/10 ring-1 ring-green-500/30"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-black/40">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-2xl">⚽</span>
          </div>
        )}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{video.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${TAG_COLORS[video.tag] ?? "bg-white/10 text-white/60"}`}>
            {video.tag}
          </span>
          <span className="flex items-center gap-0.5 text-xs text-white/50">
            <Clock className="h-3 w-3" />
            {formatDuration(video.duration)}
          </span>
        </div>
      </div>

      <ChevronRight className={`h-4 w-4 flex-shrink-0 ${active ? "text-green-400" : "text-white/30"}`} />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicReelPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<ReelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!token) return;

    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

    fetch(`${apiBase}/player/vault/share/${token}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData(json);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const activeVideo = data?.videos[activeIndex];

  function selectVideo(index: number) {
    setActiveIndex(index);
    // Reset + play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }, 50);
  }

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-950">
        <PublicNavbar />
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
          <p className="text-sm text-green-300">Loading highlight reel…</p>
        </div>
      </div>
    );
  }

  // ── 404 ─────────────────────────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col bg-green-950">
        <PublicNavbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <AlertCircle className="h-12 w-12 text-green-400/50" />
          <h1 className="text-2xl font-bold text-white">Reel not found</h1>
          <p className="text-green-300">
            This highlight reel does not exist or has been removed.
          </p>
          <Link
            href="/"
            className="mt-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500 transition-colors"
          >
            Go to Grassroots Sports
          </Link>
        </div>
      </div>
    );
  }

  const { reel, player, videos } = data;

  return (
    <div className="min-h-screen bg-green-950">
      <PublicNavbar />

      {/* Hero header */}
      <div
        className="relative overflow-hidden pt-16"
        style={{
          background: "linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)",
          backgroundImage: `
            linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpolygon points='40,8 52,32 40,56 28,32' fill='none' stroke='%23E6A817' stroke-width='0.8' opacity='0.12'/%3E%3C/svg%3E")
          `,
        }}
      >
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* Avatar placeholder */}
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-4xl ring-2 ring-white/20">
              ⚽
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium uppercase tracking-widest text-green-300">
                Highlight Reel
              </p>
              <h1 className="mt-1 text-3xl font-bold text-white">{reel.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 text-sm text-green-200">
                  <User className="h-4 w-4" />
                  {player.name}
                </span>
                {player.position && (
                  <span className="flex items-center gap-1.5 text-sm text-green-200">
                    <Trophy className="h-4 w-4" />
                    {player.position}
                  </span>
                )}
                {player.province && (
                  <span className="flex items-center gap-1.5 text-sm text-green-200">
                    <MapPin className="h-4 w-4" />
                    {player.province}
                  </span>
                )}
                {player.sport && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
                    {player.sport}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
              <Eye className="h-4 w-4 text-green-300" />
              <span className="text-sm font-semibold text-white">
                {reel.views.toLocaleString()} views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main video player */}
          <div>
            {activeVideo && (
              <>
                <div className="overflow-hidden rounded-2xl bg-black shadow-2xl">
                  <video
                    ref={videoRef}
                    key={activeVideo.id}
                    src={activeVideo.video_url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full"
                    style={{ maxHeight: "480px" }}
                  />
                </div>

                <div className="mt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-white">{activeVideo.title}</h2>
                      {activeVideo.description && (
                        <p className="mt-1 text-sm text-green-300">{activeVideo.description}</p>
                      )}
                    </div>
                    <span className={`mt-1 flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${TAG_COLORS[activeVideo.tag] ?? "bg-white/10 text-white"}`}>
                      {activeVideo.tag}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-green-400/70">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(activeVideo.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      {formatSize(activeVideo.size_mb)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* CTA */}
            <div className="mt-8 overflow-hidden rounded-2xl"
              style={{ background: "linear-gradient(135deg, #14532d 0%, #166534 100%)" }}>
              <div className="p-6">
                <h3 className="mb-1 text-lg font-bold text-white">
                  Interested in {player.name}?
                </h3>
                <p className="mb-4 text-sm text-green-200">
                  Connect with this player through the Grassroots Sports platform — Zimbabwe&apos;s
                  leading grassroots sports network.
                </p>
                <Link
                  href="/register?role=scout"
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#E6A817", color: "#1a0e00" }}
                >
                  Contact Player via GrassRoots Sports
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Playlist */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-green-400/70">
              Playlist · {videos.length} video{videos.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {videos.map((video, index) => (
                <VideoThumb
                  key={video.id}
                  video={video}
                  active={index === activeIndex}
                  onClick={() => selectVideo(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="mt-12 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)" }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_v2.png" alt="Grassroots Sport" width={36} height={36} className="rounded-md" />
          <p className="text-sm font-bold text-white">Grassroots Sports</p>
          <p className="text-xs text-green-400/70">
            Zimbabwe&apos;s platform for grassroots football talent — connecting players, coaches and scouts.
          </p>
          <div className="flex items-center gap-4 text-xs text-green-400/50">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/register" className="hover:text-white transition-colors">Join Free</Link>
            <Link href="/register?role=scout" className="hover:text-white transition-colors">I&apos;m a Scout</Link>
          </div>
          <p className="mt-2 text-xs text-green-400/30">
            &copy; {new Date().getFullYear()} Grassroots Sports. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
