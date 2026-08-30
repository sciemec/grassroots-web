"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Play, Eye, MapPin, ChevronDown, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const SPORTS = ["All", "Football", "Rugby", "Netball", "Athletics", "Cricket", "Basketball"];

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

interface VideoTile {
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
}

interface PaginatedResponse {
  data: VideoTile[];
  next_page_url: string | null;
  current_page: number;
}

function ThumbnailPlaceholder({ name, sport }: { name: string; sport: string | null }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const emoji = sport ? (SPORT_EMOJI[sport.toLowerCase()] ?? "🏅") : "🏅";

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1"
      style={{
        background: "linear-gradient(135deg, #1c3d22 0%, #2d5a36 50%, #1c3d22 100%)",
      }}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-lg font-extrabold text-[#c8962a]">{initials}</span>
    </div>
  );
}

function VideoCard({ tile }: { tile: VideoTile }) {
  const href = `/arena?play=${tile.id}`;
  const sportLabel = tile.sport
    ? tile.sport.charAt(0).toUpperCase() + tile.sport.slice(1)
    : null;
  const emoji = tile.sport ? (SPORT_EMOJI[tile.sport.toLowerCase()] ?? "🏅") : "🏅";

  return (
    <Link href={href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c8962a] rounded-xl">
      {/* Thumbnail */}
      <div className="relative w-full overflow-hidden rounded-xl bg-[#1c3d22]" style={{ paddingBottom: "56.25%" }}>
        {tile.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tile.thumbnail_url}
            alt={tile.player_name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <ThumbnailPlaceholder name={tile.player_name} sport={tile.sport} />
        )}

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
          </div>
        </div>

        {/* View count badge */}
        {tile.view_count > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 backdrop-blur-sm">
            <Eye className="h-2.5 w-2.5 text-white/70" />
            <span className="text-[10px] font-medium text-white/70">
              {tile.view_count >= 1000
                ? `${(tile.view_count / 1000).toFixed(1)}k`
                : tile.view_count}
            </span>
          </div>
        )}
      </div>

      {/* Card footer */}
      <div className="mt-2 px-0.5">
        <p className="truncate text-sm font-semibold text-white group-hover:text-[#c8962a] transition-colors">
          {tile.player_name}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
          {sportLabel && (
            <span>
              {emoji} {sportLabel}
            </span>
          )}
          {tile.province && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {tile.province}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="w-full rounded-xl bg-white/10" style={{ paddingBottom: "56.25%" }} />
      <div className="mt-2 h-3.5 w-3/4 rounded bg-white/10" />
      <div className="mt-1 h-3 w-1/2 rounded bg-white/10" />
    </div>
  );
}

export default function PublicVideoGrid() {
  const [sport, setSport]             = useState("All");
  const [tiles, setTiles]             = useState<VideoTile[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(false);

  const fetchPage = useCallback(async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    return res.json() as Promise<PaginatedResponse>;
  }, []);

  // Initial load and sport change
  useEffect(() => {
    setLoading(true);
    setError(false);
    setTiles([]);
    setNextPageUrl(null);

    const params = new URLSearchParams({ per_page: "12" });
    if (sport !== "All") params.set("sport", sport.toLowerCase());
    const url = `${API}/public/videos?${params}`;

    fetchPage(url)
      .then((json) => {
        setTiles(Array.isArray(json.data) ? json.data : []);
        setNextPageUrl(json.next_page_url ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sport, fetchPage]);

  const handleLoadMore = async () => {
    if (!nextPageUrl || loadingMore) return;
    setLoadingMore(true);
    try {
      const json = await fetchPage(nextPageUrl);
      setTiles((prev) => [...prev, ...(Array.isArray(json.data) ? json.data : [])]);
      setNextPageUrl(json.next_page_url ?? null);
    } catch {
      // silently ignore — button stays visible for retry
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="py-14 px-4" style={{ background: "#f4f2ee" }}>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#c8962a" }}
            >
              Live from Zimbabwe
            </p>
            <h2 className="text-2xl font-black" style={{ color: "#1c3d22" }}>
              Watch athletes in action
            </h2>
          </div>

          {/* Sport filter pills */}
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => {
              const active = sport === s;
              return (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
                  style={{
                    background:   active ? "#1c3d22" : "transparent",
                    color:        active ? "#fff"    : "#1c3d22",
                    borderColor:  active ? "#1c3d22" : "#1c3d2240",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">Could not load videos right now.</p>
          </div>
        ) : tiles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-500">
              No public {sport !== "All" ? sport.toLowerCase() : ""} videos yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
            {tiles.map((tile) => (
              <VideoCard key={tile.id} tile={tile} />
            ))}
          </div>
        )}

        {/* Load more */}
        {nextPageUrl && !loading && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ borderColor: "#1c3d22", color: "#1c3d22" }}
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          </div>
        )}

        {/* CTA nudge */}
        {!loading && tiles.length > 0 && (
          <p className="mt-6 text-center text-xs" style={{ color: "#1c3d2280" }}>
            Click any thumbnail to watch in The Arena &mdash;{" "}
            <Link href="/register" className="font-semibold underline" style={{ color: "#c8962a" }}>
              join free
            </Link>{" "}
            to upload your own.
          </p>
        )}
      </div>
    </section>
  );
}
