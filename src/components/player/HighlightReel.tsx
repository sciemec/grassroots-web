"use client";

import { useEffect, useRef, useState } from "react";
import { Film, Play, X, Zap, Shield } from "lucide-react";
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

interface AutoHighlight {
  id: string;
  player_id: string;
  match_id: string;
  r2_key: string;
  r2_url: string;
  event_type: "sprint" | "tackle" | string;
  speed_kmh: number | null;
  timestamp_seconds: number | null;
  created_at: string;
}

type ActiveVideo =
  | { kind: "showcase"; clip: ShowcaseClip }
  | { kind: "auto"; clip: AutoHighlight };

interface HighlightReelProps {
  /** Pre-fetched showcase clips — pass from server components (public page) */
  clips?: ShowcaseClip[];
  /** Pre-fetched auto-generated highlights — pass from server components */
  highlights?: AutoHighlight[];
  /** "self" fetches authenticated player's own clips; "public" only renders passed clips */
  mode?: "self" | "public";
  /** Player UUID — used to fetch auto-generated highlights when mode="self" or "public" */
  playerId?: string;
}

const EVENT_COLOURS: Record<string, string> = {
  sprint: "bg-amber-500 text-black",
  tackle: "bg-red-600 text-white",
};

function formatTime(secs: number | null): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function HighlightReel({
  clips: initialClips,
  highlights: initialHighlights,
  mode = "self",
  playerId,
}: HighlightReelProps) {
  const [clips, setClips] = useState<ShowcaseClip[]>(initialClips ?? []);
  const [highlights, setHighlights] = useState<AutoHighlight[]>(initialHighlights ?? []);
  const [loading, setLoading] = useState(!initialClips && mode === "self");
  const [activeVideo, setActiveVideo] = useState<ActiveVideo | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch showcase clips (self mode)
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

  // Fetch auto-generated highlights when playerId is available
  useEffect(() => {
    if (initialHighlights || !playerId) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1"}/players/${playerId}/highlights`,
      token && token !== "dev-token"
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        const raw = d?.data ?? d;
        setHighlights(Array.isArray(raw) ? raw : []);
      })
      .catch(() => {});
  }, [initialHighlights, playerId]);

  const totalClips = clips.length + highlights.length;

  if (loading) {
    return (
      <div className="mb-8 rounded-2xl border border-[#f0b429]/10 bg-card/60 p-5 backdrop-blur-sm">
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

  if (!totalClips) {
    return (
      <div className="mb-8 rounded-2xl border border-[#f0b429]/10 bg-card/60 p-5 backdrop-blur-sm">
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
      <div className="mb-8 rounded-2xl border border-[#f0b429]/10 bg-card/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[#f0b429]" />
            <h3 className="font-semibold text-white">Highlight Reel</h3>
            <span className="rounded-full border border-[#f0b429]/20 bg-[#f0b429]/10 px-2 py-0.5 text-[10px] font-bold text-[#f0b429]">
              {totalClips} clip{totalClips !== 1 ? "s" : ""}
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

        {/* Showcase clips (manually uploaded) */}
        {clips.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {clips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => setActiveVideo({ kind: "showcase", clip })}
                className="group w-44 flex-shrink-0 overflow-hidden rounded-xl border border-[#f0b429]/10 bg-white/5 text-left transition-colors hover:border-[#f0b429]/40"
              >
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
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0b429]">
                      <Play className="ml-0.5 h-5 w-5 text-[#1a3a1a]" />
                    </div>
                  </div>
                  <div className="absolute left-2 top-2">
                    <span className="rounded-full bg-[#f0b429] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#1a3a1a]">
                      {clip.skill_type}
                    </span>
                  </div>
                </div>
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
        )}

        {/* Auto-generated highlights from AI tracking */}
        {highlights.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-purple-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                AI-Generated Clips
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {highlights.map((hl) => {
                const badgeClass = EVENT_COLOURS[hl.event_type] ?? "bg-gray-600 text-white";
                const Icon = hl.event_type === "tackle" ? Shield : Zap;
                return (
                  <button
                    key={hl.id}
                    onClick={() => setActiveVideo({ kind: "auto", clip: hl })}
                    className="group w-44 flex-shrink-0 overflow-hidden rounded-xl border border-[#f0b429]/10 bg-white/5 text-left transition-colors hover:border-purple-400/40"
                  >
                    <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-purple-900/40 to-black/60">
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-purple-500/60">
                          <Play className="ml-0.5 h-5 w-5 text-white" />
                        </div>
                      </div>
                      {/* Event type badge */}
                      <div className="absolute left-2 top-2">
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeClass}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {hl.event_type}
                        </span>
                      </div>
                      {/* Speed overlay */}
                      {hl.speed_kmh && (
                        <div className="absolute bottom-2 right-2">
                          <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white">
                            {hl.speed_kmh.toFixed(1)} km/h
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[10px] font-semibold capitalize text-white/70">
                        {hl.event_type === "sprint" ? "Sprint event" : "Tackle event"}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] text-white/40">
                          {formatTime(hl.timestamp_seconds)}
                        </span>
                        <span className="text-[9px] text-purple-400/70">AI</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            {activeVideo.kind === "showcase" ? (
              <>
                {activeVideo.clip.video_url ? (
                  <video
                    ref={videoRef}
                    src={activeVideo.clip.video_url}
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
                        {activeVideo.clip.skill_type}
                      </span>
                      {activeVideo.clip.top_strength && (
                        <p className="mt-2 text-sm text-white/80">{activeVideo.clip.top_strength}</p>
                      )}
                      {activeVideo.clip.scout_note && (
                        <p className="mt-1 text-xs italic text-white/50">{activeVideo.clip.scout_note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveVideo(null)}
                      className="flex-shrink-0 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {activeVideo.clip.r2_url ? (
                  <video
                    ref={videoRef}
                    src={activeVideo.clip.r2_url}
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
                      {(() => {
                        const badgeClass =
                          EVENT_COLOURS[activeVideo.clip.event_type] ?? "bg-gray-600 text-white";
                        const Icon =
                          activeVideo.clip.event_type === "tackle" ? Shield : Zap;
                        return (
                          <span
                            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${badgeClass}`}
                          >
                            <Icon className="h-3 w-3" />
                            {activeVideo.clip.event_type}
                          </span>
                        );
                      })()}
                      <div className="mt-2 flex gap-4 text-sm text-white/70">
                        {activeVideo.clip.speed_kmh && (
                          <span className="font-mono font-bold text-white">
                            {activeVideo.clip.speed_kmh.toFixed(1)} km/h
                          </span>
                        )}
                        {activeVideo.clip.timestamp_seconds && (
                          <span className="text-white/50">
                            at {formatTime(activeVideo.clip.timestamp_seconds)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-purple-300/60">
                        AI-generated · Match {activeVideo.clip.match_id.slice(0, 12)}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveVideo(null)}
                      className="flex-shrink-0 rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
