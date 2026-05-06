"use client";

import { useEffect, useRef, useState } from "react";
import { Film, Play, X } from "lucide-react";
import api from "@/lib/api";

interface ShowcaseClip {
  id: string;
  skill_type: string;
  video_url: string | null;
  thumbnail_url: string | null;
  ai_rating: number;
  top_strength: string;
  scout_note: string;
  view_count: number;
}

interface HighlightReelProps {
  /** Pre-fetched clips — pass from server components (public page) */
  clips?: ShowcaseClip[];
  /** "self" fetches authenticated player's own clips; "public" only renders passed clips */
  mode?: "self" | "public";
}

export function HighlightReel({ clips: initialClips, mode = "self" }: HighlightReelProps) {
  const [clips, setClips] = useState<ShowcaseClip[]>(initialClips ?? []);
  const [loading, setLoading] = useState(!initialClips && mode === "self");
  const [activeClip, setActiveClip] = useState<ShowcaseClip | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (initialClips || mode !== "self") return;
    api
      .get("/player/showcase")
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setClips(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialClips, mode]);

  if (loading) {
    return (
      <div className="mb-8 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center gap-2">
          <Film className="h-4 w-4 text-[#f0b429]" />
          <h3 className="font-semibold text-white">Highlight Reel</h3>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-44 flex-shrink-0 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!clips.length) {
    return (
      <div className="mb-8 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Film className="h-4 w-4 text-[#f0b429]" />
          <h3 className="font-semibold text-white">Highlight Reel</h3>
        </div>
        {mode === "self" ? (
          <p className="text-sm text-muted-foreground">
            No highlights yet.{" "}
            <a href="/player/showcase" className="text-[#f0b429] hover:underline">
              Upload your first skill clip →
            </a>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">This player has no public highlights yet.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#f0b429]" />
            <h3 className="font-semibold text-white">Highlight Reel</h3>
            <span className="rounded-full border border-[#f0b429]/20 bg-[#f0b429]/10 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">
              {clips.length} clip{clips.length !== 1 ? "s" : ""}
            </span>
          </div>
          {mode === "self" && (
            <a
              href="/player/showcase"
              className="text-xs text-muted-foreground transition-colors hover:text-[#f0b429]"
            >
              Manage →
            </a>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {clips.map((clip) => (
            <button
              key={clip.id}
              onClick={() => setActiveClip(clip)}
              className="group w-44 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition-colors hover:border-[#f0b429]/40"
            >
              {/* Thumbnail */}
              <div className="relative h-28 bg-black/40">
                {clip.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={clip.thumbnail_url}
                    alt={clip.skill_type}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a3d26] to-[#0c1f10]">
                    <Play className="h-8 w-8 text-[#f0b429]/50" />
                  </div>
                )}
                {/* Play overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0b429]">
                    <Play className="ml-0.5 h-5 w-5 text-[#1a3a1a]" />
                  </div>
                </div>
                {/* Skill badge */}
                <div className="absolute left-2 top-2">
                  <span className="rounded-full bg-[#f0b429] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1a3a1a]">
                    {clip.skill_type}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="line-clamp-2 text-[10px] leading-tight text-white/60">
                  {clip.top_strength || clip.scout_note || "Skill highlight"}
                </p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#f0b429]">
                    {clip.ai_rating ? `${clip.ai_rating}/10` : ""}
                  </span>
                  <span className="text-[9px] text-white/30">{clip.view_count ?? 0} views</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Video modal */}
      {activeClip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveClip(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {activeClip.video_url ? (
              <video
                ref={videoRef}
                src={activeClip.video_url}
                controls
                autoPlay
                className="w-full"
                style={{ maxHeight: "70vh" }}
              />
            ) : (
              <div className="flex h-48 items-center justify-center bg-black/60">
                <p className="text-sm text-white/40">Video not available</p>
              </div>
            )}

            <div className="bg-[#0c1f10] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-[#f0b429] px-2.5 py-1 text-xs font-bold uppercase text-[#1a3a1a]">
                    {activeClip.skill_type}
                  </span>
                  {activeClip.top_strength && (
                    <p className="mt-2 text-sm text-white/80">{activeClip.top_strength}</p>
                  )}
                  {activeClip.scout_note && (
                    <p className="mt-1 text-xs italic text-white/50">{activeClip.scout_note}</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveClip(null)}
                  className="flex-shrink-0 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
