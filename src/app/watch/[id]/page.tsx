"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, ThumbsUp, MapPin, ArrowLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", netball: "🏐", athletics: "🏃",
  cricket: "🏏", basketball: "🏀", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

interface VideoPost {
  id: string;
  player_id: string;
  player_name: string;
  body: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sport: string | null;
  province: string | null;
  position: string | null;
  like_count: number;
  view_count: number;
  aq_at_post: number | null;
  rank_at_post: string | null;
  test_tier: string | null;
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const [video, setVideo]       = useState<VideoPost | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/public/videos/${params.id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        if (!r.ok) throw new Error("fetch failed");
        return r.json();
      })
      .then((json) => { if (json) setVideo(json.data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d1f12" }}>
        <div className="h-8 w-8 rounded-full border-2 border-[#c8962a] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !video) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center"
        style={{ background: "#0d1f12" }}
      >
        <p className="text-2xl font-black text-white">Video not found</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          This video may have been removed or made private.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-lg px-6 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#c8962a" }}
        >
          Back to Grassroots Sports
        </Link>
      </div>
    );
  }

  const sportLabel = video.sport
    ? video.sport.charAt(0).toUpperCase() + video.sport.slice(1)
    : null;
  const emoji     = video.sport ? (SPORT_EMOJI[video.sport.toLowerCase()] ?? "🏅") : "🏅";
  const firstName = (video.player_name ?? "this athlete").split(" ")[0];

  return (
    <div className="min-h-screen text-white" style={{ background: "#0d1f12" }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: "rgba(13,31,18,0.95)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <ArrowLeft className="h-4 w-4" />
          Grassroots Sports
        </Link>
        <Link
          href="/register"
          className="rounded-lg px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#c8962a" }}
        >
          Join free
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6">
        {/* Video player */}
        <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ paddingBottom: "56.25%" }}>
          <video
            src={video.video_url}
            poster={video.thumbnail_url ?? undefined}
            controls
            playsInline
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        {/* Player info */}
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-black">{video.player_name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              {sportLabel && <span>{emoji} {sportLabel}</span>}
              {video.position && <span>{video.position}</span>}
              {video.province && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {video.province}
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {video.like_count.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {video.view_count.toLocaleString()}
            </span>
          </div>
        </div>

        {/* AQ badge */}
        {video.aq_at_post && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(200,150,42,0.15)" }}>
            <span className="text-xs font-bold" style={{ color: "#c8962a" }}>AQ {video.aq_at_post}</span>
            {video.test_tier  && <span className="text-xs" style={{ color: "rgba(200,150,42,0.7)" }}>· {video.test_tier}</span>}
            {video.rank_at_post && <span className="text-xs" style={{ color: "rgba(200,150,42,0.7)" }}>· {video.rank_at_post}</span>}
          </div>
        )}

        {/* Caption */}
        {video.body && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            {video.body}
          </p>
        )}

        {/* CTA */}
        <div
          className="mt-8 rounded-xl p-6 text-center border"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-base font-black">Like what you see?</p>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Join Grassroots Sports to connect with {firstName}, track their progress, and discover more Zimbabwean talent.
          </p>
          <Link
            href="/register"
            className="mt-4 block w-full rounded-lg py-3 text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#c8962a" }}
          >
            Create free account
          </Link>
          <Link
            href="/login"
            className="mt-2 block text-xs transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
