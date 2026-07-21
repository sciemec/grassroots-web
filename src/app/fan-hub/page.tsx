"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, Play, Cpu, TrendingUp, Eye, Globe, Film, RefreshCw, Zap, MapPin } from "lucide-react";
import VideoCard, { type FanHubVideo } from "@/components/fan-hub/VideoCard";
import VideoPlayer from "@/components/fan-hub/VideoPlayer";
import UploadModal from "@/components/fan-hub/UploadModal";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const CATEGORY_FILTERS = [
  { value: "",          label: "All" },
  { value: "live",      label: "Live" },
  { value: "highlight", label: "Highlights" },
  { value: "analysis",  label: "AI Analysis" },
  { value: "full",      label: "Full Matches" },
  { value: "training",  label: "Training" },
  { value: "goals",     label: "Goals" },
];

const PROVINCES = [
  "All Provinces", "Harare", "Bulawayo", "Manicaland",
  "Mashonaland Central", "Mashonaland East", "Mashonaland West",
  "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands",
];

interface FeedStats {
  total_videos: number;
  total_views: number;
  live_count: number;
  provinces_count: number;
}

interface HighlightClip {
  id: string;
  player_id: string;
  match_id: string | null;
  r2_url: string;
  event_type: string;
  speed_kmh: number | null;
  timestamp_seconds: number | null;
  created_at: string;
  player_initials?: string;
  province?: string | null;
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden border border-[#f0b429]/10 bg-white/5 animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function FanHubPage() {
  const [featured, setFeatured]       = useState<FanHubVideo | null>(null);
  const [videos, setVideos]           = useState<FanHubVideo[]>([]);
  const [aiClips, setAiClips]         = useState<FanHubVideo[]>([]);
  const [stats, setStats]             = useState<FeedStats | null>(null);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [activeCategory, setActiveCategory] = useState("");
  const [activeProvince, setActiveProvince] = useState("All Provinces");
  const [playing, setPlaying]         = useState<FanHubVideo | null>(null);
  const [showUpload, setShowUpload]   = useState(false);
  const [error, setError]             = useState("");
  const [highlights, setHighlights]   = useState<HighlightClip[]>([]);

  const buildQuery = useCallback((pg: number, cat: string, prov: string) => {
    const params = new URLSearchParams({ page: String(pg), per_page: "20" });
    if (cat)  params.set("clip_type", cat);
    if (prov && prov !== "All Provinces") params.set("province", prov);
    return params.toString();
  }, []);

  // Adapter: user_media record → FanHubVideo shape
  const adaptMediaToFanVideo = (m: Record<string, unknown>): FanHubVideo => {
    const meta = (m.metadata as Record<string, unknown>) ?? {};
    return {
      id:               String(m.id),
      title:            String(m.title ?? "Untitled"),
      clip_type:        String(meta.clip_type ?? "highlight"),
      province:         meta.province ? String(meta.province) : null,
      r2_key:           String(m.r2_key ?? ""),
      r2_url:           String(m.r2_url ?? ""),
      thumbnail_url:    m.thumbnail_url ? String(m.thumbnail_url) : null,
      duration_seconds: m.duration_seconds ? Number(m.duration_seconds) : null,
      uploader_name:    meta.uploader_name ? String(meta.uploader_name) : null,
      uploader_id:      null,
      tagged_player_id: null,
      view_count:       Number(m.view_count ?? 0),
      is_featured:      false,
      is_live:          false,
      is_ai_generated:  Boolean(m.is_ai_analysed),
      status:           "approved",
      created_at:       String(m.created_at ?? ""),
    };
  };

  const fetchFeed = useCallback(async (cat: string, prov: string) => {
    setLoading(true);
    setError("");
    setPage(1);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const authHeaders = token && token !== "dev-token"
        ? { Authorization: `Bearer ${token}` }
        : {};

      const [featRes, feedRes, mediaRes, aiRes, statsRes, hlRes] = await Promise.allSettled([
        fetch(`${API}/fan-hub/videos/featured`),
        fetch(`${API}/fan-hub/videos?${buildQuery(1, cat, prov)}`),
        fetch(`${API}/media/discover?context=fan_hub&per_page=20`, { headers: authHeaders }),
        fetch(`${API}/fan-hub/videos/ai-clips`),
        fetch(`${API}/fan-hub/stats`),
        fetch(`${API}/highlights/feed`),
      ]);

      if (featRes.status === "fulfilled" && featRes.value.ok) {
        const d = await featRes.value.json() as { data: FanHubVideo | null };
        setFeatured(d.data ?? null);
      }

      // Merge legacy + unified media feeds (dedupe by r2_key)
      const legacyVideos: FanHubVideo[] = [];
      let lastPage = 1;
      if (feedRes.status === "fulfilled" && feedRes.value.ok) {
        const d = await feedRes.value.json() as { data: FanHubVideo[]; last_page?: number };
        const _r = d.data ?? d;
        if (Array.isArray(_r)) legacyVideos.push(..._r.map((v) => ({ ...v, id: String(v.id) })));
        lastPage = d.last_page ?? 1;
      }

      const unifiedVideos: FanHubVideo[] = [];
      if (mediaRes.status === "fulfilled" && mediaRes.value.ok) {
        const d = await mediaRes.value.json() as { data: Record<string, unknown>[] };
        const _r = d.data ?? d;
        if (Array.isArray(_r)) unifiedVideos.push(..._r.map(adaptMediaToFanVideo));
      }

      // Unified records first (newest uploads), then legacy — dedupe by r2_key
      const seenKeys = new Set<string>();
      const merged: FanHubVideo[] = [];
      for (const v of [...unifiedVideos, ...legacyVideos]) {
        if (!seenKeys.has(v.r2_key)) {
          seenKeys.add(v.r2_key);
          merged.push(v);
        }
      }
      setVideos(merged);
      setHasMore(lastPage > 1);

      if (aiRes.status === "fulfilled" && aiRes.value.ok) {
        const d = await aiRes.value.json() as { data: FanHubVideo[] };
        const _r = d.data ?? d;
        setAiClips(Array.isArray(_r) ? _r.map((v) => ({ ...v, id: String(v.id) })) : []);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const d = await statsRes.value.json() as { data: FeedStats };
        setStats(d.data ?? null);
      }

      if (hlRes.status === "fulfilled" && hlRes.value.ok) {
        const d = await hlRes.value.json() as { data: HighlightClip[] };
        const _r = d.data ?? d;
        setHighlights(Array.isArray(_r) ? _r : []);
      }
    } catch {
      setError("Could not load the feed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(`${API}/fan-hub/videos?${buildQuery(nextPage, activeCategory, activeProvince)}`);
      if (!res.ok) throw new Error("Failed to load more");
      const d = await res.json() as { data: FanHubVideo[]; last_page?: number };
      const _r = d.data ?? d;
      const newVideos = Array.isArray(_r) ? _r.map((v) => ({ ...v, id: String(v.id) })) : [];
      setVideos((prev) => [...prev, ...newVideos]);
      setPage(nextPage);
      setHasMore(nextPage < (d.last_page ?? 1));
    } catch {
      // silent fail — button stays visible
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReport = async (videoId: string) => {
    // Only call legacy report endpoint for numeric IDs (old fan_hub_videos rows)
    if (/^\d+$/.test(videoId)) {
      await fetch(`${API}/fan-hub/videos/${videoId}/report`, { method: "POST" }).catch(() => {});
    }
  };

  // Initial load
  useEffect(() => {
    fetchFeed("", "All Provinces");
  }, [fetchFeed]);

  // Filter change
  const applyFilter = (cat: string, prov: string) => {
    setActiveCategory(cat);
    setActiveProvince(prov);
    fetchFeed(cat, prov);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a1f0e" }}>
      {/* ── Header ── */}
      <div className="border-b border-[#f0b429]/10 bg-[#0f2a14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Fan Hub</h1>
            <p className="text-green-300/60 text-sm">Match highlights, live streams &amp; AI analysis — by Zimbabwe, for Zimbabwe</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Clip
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-8">

        {/* ── Stats row ── */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Film,     label: "Clips uploaded",  value: stats.total_videos.toLocaleString() },
              { icon: Eye,      label: "Total views",     value: stats.total_views.toLocaleString() },
              { icon: Play,     label: "Live now",        value: String(stats.live_count) },
              { icon: Globe,    label: "Provinces",       value: String(stats.provinces_count) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-[#f0b429]/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                <Icon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-bold text-lg leading-none">{value}</p>
                  <p className="text-green-300/60 text-xs mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Featured slot ── */}
        {featured && (
          <div className="rounded-2xl overflow-hidden border border-[#f0b429]/10 relative">
            <div className="relative aspect-video sm:aspect-[21/7] bg-black">
              {featured.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.thumbnail_url}
                  alt={featured.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-900 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
                <div>
                  {featured.is_live && (
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white uppercase tracking-widest mb-2 animate-pulse">
                      LIVE
                    </span>
                  )}
                  <h2 className="text-white font-bold text-xl sm:text-2xl leading-tight">{featured.title}</h2>
                  {featured.province && (
                    <p className="text-green-300/70 text-sm mt-1">{featured.province}</p>
                  )}
                </div>
                <button
                  onClick={() => setPlaying(featured)}
                  className="flex-shrink-0 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 flex items-center justify-center shadow-xl transition-colors ml-4"
                >
                  <Play className="w-6 h-6 text-black fill-black" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORY_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => applyFilter(f.value, activeProvince)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  activeCategory === f.value
                    ? "bg-amber-500 text-black"
                    : "bg-white/10 text-green-200 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Province dropdown */}
          <div className="sm:ml-auto">
            <select
              value={activeProvince}
              onChange={(e) => applyFilter(activeCategory, e.target.value)}
              className="rounded-lg bg-white/10 border border-[#f0b429]/10 text-green-200 px-3 py-1.5 text-sm focus:outline-none focus:border-amber-400/60"
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-300">
            <span className="text-sm">{error}</span>
            <button onClick={() => fetchFeed(activeCategory, activeProvince)} className="ml-auto flex items-center gap-1 text-sm text-red-400 hover:text-red-200">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ── Trending grid ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold text-lg">Trending Clips</h2>
          </div>

          {loading ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16 text-green-300/40">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-white/60">No clips yet</p>
              <p className="text-sm mt-1">Be the first to upload a clip for this category.</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
              >
                Upload Now
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {videos.map((v) => (
                  <div key={v.id} className="relative group/card">
                    <VideoCard video={v} onPlay={setPlaying} />
                    {/* Report button */}
                    <button
                      onClick={() => handleReport(v.id)}
                      title="Report this clip"
                      className="absolute bottom-12 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity text-[10px] text-red-400/70 hover:text-red-300"
                    >
                      &#9872;
                    </button>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── AI Analysis section ── */}
        {aiClips.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h2 className="text-white font-bold text-lg">AI-generated Analysis</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600/30 text-purple-300 uppercase tracking-wider">
                  THUTO
                </span>
              </div>
              <a href="?clip_type=analysis" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
                View all →
              </a>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {aiClips.slice(0, 8).map((v) => (
                <VideoCard key={v.id} video={v} onPlay={setPlaying} />
              ))}
            </div>
          </section>
        )}

        {/* ── Sprint Highlights ── */}
        {highlights.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-white font-bold text-lg">Sprint Highlights</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase tracking-wider">
                  AI-Detected
                </span>
              </div>
              <span className="text-xs text-white/30">Auto-generated from match footage</span>
            </div>

            <div className="space-y-2">
              {highlights.slice(0, 10).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-4 rounded-xl border border-[#f0b429]/10 bg-white/5 p-3 hover:bg-white/[0.07] transition-colors"
                >
                  {/* Event badge */}
                  <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full ${
                    h.event_type === "sprint" ? "bg-amber-500/20" : "bg-red-500/20"
                  }`}>
                    <Zap className={`h-4 w-4 ${h.event_type === "sprint" ? "text-amber-400" : "text-red-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        h.event_type === "sprint"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {h.event_type}
                      </span>
                      {h.player_initials && (
                        <span className="text-xs text-white/60 font-medium">{h.player_initials}</span>
                      )}
                      {h.province && (
                        <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                          <MapPin className="h-2.5 w-2.5" />{h.province}
                        </span>
                      )}
                    </div>
                    {h.timestamp_seconds != null && (
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {Math.floor(h.timestamp_seconds / 60)}:{String(Math.round(h.timestamp_seconds % 60)).padStart(2, "0")} min
                      </p>
                    )}
                  </div>

                  {/* Speed */}
                  {h.speed_kmh != null && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-black text-amber-400">{h.speed_kmh.toFixed(1)}</div>
                      <div className="text-[10px] text-white/30">km/h</div>
                    </div>
                  )}

                  {/* Play button */}
                  <a
                    href={h.r2_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                  >
                    <Play className="h-3.5 w-3.5 text-amber-400" />
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Video Player Modal ── */}
      {playing && (
        <VideoPlayer video={playing} onClose={() => setPlaying(null)} />
      )}

      {/* ── Upload Modal ── */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => fetchFeed(activeCategory, activeProvince)}
        />
      )}
    </div>
  );
}
