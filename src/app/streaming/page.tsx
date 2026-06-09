"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Radio, Users, Clock, MapPin, Eye, ChevronRight, X,
  Volume2, VolumeX, Maximize2, Activity, GraduationCap,
  ShieldCheck, Zap,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { VoiceCommentary } from "@/components/video/voice-commentary";
import { LiveMatchBanner } from "@/components/LiveMatchBanner";
import api from "@/lib/api";

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  venue: string;
  province: string;
  ageGroup: string;
  viewers: number;
  status: "live" | "upcoming";
  commentary: string;
  stream_url?: string;
}

interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  venue: string;
  province: string;
  ageGroup: string;
}

const MOCK_LIVE: LiveMatch[] = [
  {
    id: "1", homeTeam: "Harare City Youth", awayTeam: "Dynamos FC U17",
    homeScore: 2, awayScore: 1, minute: 67,
    venue: "Rufaro Stadium", province: "Harare", ageGroup: "U17", viewers: 142,
    status: "live",
    commentary: "GOAL! Tinashe scores with a powerful left-foot strike from 25 yards!",
  },
  {
    id: "2", homeTeam: "Bulawayo Chiefs", awayTeam: "Highlanders Academy",
    homeScore: 0, awayScore: 0, minute: 34,
    venue: "Barbourfields", province: "Bulawayo", ageGroup: "U20", viewers: 89,
    status: "live",
    commentary: "End-to-end action — Mutanda nearly scores from the corner!",
  },
];

const MOCK_UPCOMING: UpcomingMatch[] = [
  { id: "3", homeTeam: "Mutare FC", awayTeam: "Masvingo Stars", date: "Today 15:00", venue: "Sakubva Stadium", province: "Manicaland", ageGroup: "Senior" },
  { id: "4", homeTeam: "Gweru United", awayTeam: "Kwekwe FC", date: "Tomorrow 10:00", venue: "Gweru SC Ground", province: "Midlands", ageGroup: "U17" },
  { id: "5", homeTeam: "Bindura Youth", awayTeam: "Shamva FC", date: "Tomorrow 14:00", venue: "Trojan Stadium", province: "Mashonaland Central", ageGroup: "U13" },
];

const WIRE = [
  "Harare City Youth 2–1 Dynamos FC U17 · 67' — Rufaro Stadium",
  "Bulawayo Chiefs 0–0 Highlanders Academy · 34' — Barbourfields",
  "Mutare FC vs Masvingo Stars — kicking off Today 15:00 at Sakubva",
  "142 fans watching live on GrassRoots Sports right now",
  "Coach broadcast mode now available — stream from your browser",
  "FC Platinum vs Chicken Inn — AI commentary available on Fan Hub",
];

// HLS Video Player component
function HLSPlayer({ streamUrl, title, onClose }: { streamUrl: string; title: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: import("hls.js").default | null = null;

    const initPlayer = async () => {
      const Hls = (await import("hls.js")).default;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setReady(true);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError("Stream unavailable. Check connection.");
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
        video.addEventListener("loadedmetadata", () => { setReady(true); video.play().catch(() => {}); });
      } else {
        setError("HLS playback not supported in this browser.");
      }
    };

    initPlayer();
    return () => { hls?.destroy(); };
  }, [streamUrl]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-2xl">
        <div className="flex items-center justify-between bg-black/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold text-white">LIVE — {title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (videoRef.current) videoRef.current.muted = !muted; setMuted(!muted); }}
              className="rounded-lg p-1.5 text-white hover:bg-white/20 transition-colors"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => videoRef.current?.requestFullscreen()}
              className="rounded-lg p-1.5 text-white hover:bg-white/20 transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white hover:bg-white/20 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative aspect-video bg-black">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-2">
              <Radio className="h-10 w-10 text-red-500" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <>
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
                </div>
              )}
              <video ref={videoRef} className="w-full h-full" controls muted={muted} playsInline />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StreamingPage() {
  const router = useRouter();
  const user     = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const [activeStream, setActiveStream] = useState<{ url: string; title: string } | null>(null);
  const [province, setProvince] = useState("all");
  const [latestCommentary, setLatestCommentary] = useState("");
  const [wireIndex, setWireIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWireIndex((p) => (p + 1) % WIRE.length), 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  const { data: liveData } = useQuery<LiveMatch[]>({
    queryKey: ["streaming-live"],
    queryFn: async () => {
      const res = await api.get("/matches/live");
      const raw = (() => { const _r = res.data?.data ?? res.data; return Array.isArray(_r) ? _r : []; })();
      if (raw.length === 0) return MOCK_LIVE;
      return raw.map((item: {
        id: string; home_team: string; away_team: string; home_score: number;
        away_score: number; minute: number; venue: string; province: string;
        age_group: string; viewer_count: number; status: "live" | "upcoming";
        commentary: string; stream_url?: string;
      }) => ({
        id: item.id, homeTeam: item.home_team, awayTeam: item.away_team,
        homeScore: item.home_score, awayScore: item.away_score, minute: item.minute,
        venue: item.venue, province: item.province, ageGroup: item.age_group,
        viewers: item.viewer_count, status: item.status, commentary: item.commentary,
        stream_url: item.stream_url,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
    placeholderData: MOCK_LIVE,
  });

  const { data: upcomingData } = useQuery<UpcomingMatch[]>({
    queryKey: ["streaming-upcoming"],
    queryFn: async () => {
      const res = await api.get("/matches/upcoming", { params: { per_page: 6 } });
      const raw = (() => { const _r = res.data?.data ?? res.data; return Array.isArray(_r) ? _r : []; })();
      if (raw.length === 0) return MOCK_UPCOMING;
      return raw.map((item: {
        id: string; home_team: string; away_team: string; match_date: string;
        venue: string; province: string; age_group: string;
      }) => ({
        id: item.id, homeTeam: item.home_team, awayTeam: item.away_team,
        date: item.match_date, venue: item.venue, province: item.province, ageGroup: item.age_group,
      }));
    },
    enabled: !!user,
    refetchInterval: 60000,
    placeholderData: MOCK_UPCOMING,
  });

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f4f2ee" }}>
        <Activity className="animate-spin" size={28} style={{ color: "#1a5c2a" }} />
      </div>
    );
  }

  const liveMatches: LiveMatch[] = liveData ?? MOCK_LIVE;
  const upcoming: UpcomingMatch[] = upcomingData ?? MOCK_UPCOMING;
  const provinces = ["all", ...Array.from(new Set([...liveMatches.map(m => m.province), ...upcoming.map(m => m.province)]))];
  const filteredLive = province === "all" ? liveMatches : liveMatches.filter(m => m.province === province);
  const filteredUpcoming = province === "all" ? upcoming : upcoming.filter(m => m.province === province);

  const watchMatch = (match: LiveMatch) => {
    setLatestCommentary(match.commentary);
    setActiveStream({ url: match.stream_url ?? "", title: `${match.homeTeam} vs ${match.awayTeam}` });
  };

  const initials = user.name ? user.name.slice(0, 2).toUpperCase() : "GR";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>

      {/* Brand header */}
      <div style={{ backgroundColor: "#1a5c2a", borderBottom: "3px solid #f0b429" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
              style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}>
              GRS
            </div>
            <div>
              <p className="font-black text-white text-sm uppercase tracking-wider leading-none">GrassRoots Sports</p>
              <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.45)" }}>Live Streaming</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <GraduationCap size={14} style={{ color: "#f0b429" }} />
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest leading-none" style={{ color: "#f0b429" }}>Education Partner</p>
              <p className="text-[10px] font-black uppercase text-white">Teach For Zimbabwe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live wire ticker */}
      <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center gap-1 rounded text-[9px] font-black uppercase tracking-widest px-2 py-0.5 text-white"
            style={{ backgroundColor: "#dc2626" }}>
            <Radio size={9} className="animate-pulse" /> Live
          </span>
          <p className="text-xs font-semibold truncate" style={{ color: "#92400e" }}>
            {WIRE[wireIndex]}
          </p>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-700 hidden sm:block">Auto-refreshing</span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Province filter */}
        <div className="flex flex-wrap gap-2">
          {provinces.map((p) => (
            <button
              key={p}
              onClick={() => setProvince(p)}
              className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide transition-all capitalize"
              style={province === p
                ? { backgroundColor: "#1a5c2a", color: "#fff" }
                : { backgroundColor: "#fff", color: "#6b7280", border: "1px solid #e5e7eb" }}
            >
              {p === "all" ? "All Provinces" : p}
            </button>
          ))}
        </div>

        {/* World Cup banner */}
        <LiveMatchBanner />

        {/* Live Now */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#9ca3af" }}>
              Live Now ({filteredLive.length})
            </h2>
          </div>

          {filteredLive.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-200 p-8 text-center shadow-sm">
              <Radio className="mx-auto mb-2 text-gray-300" size={24} />
              <p className="text-sm font-semibold text-gray-400">No live matches in {province} right now</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredLive.map((match) => (
                <div key={match.id} className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
                  {/* Live header */}
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ backgroundColor: "#fef2f2", borderBottom: "1px solid #fecaca" }}>
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                        Live {match.minute}&apos;
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400">{match.ageGroup}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Eye size={10} /> {match.viewers} watching
                    </div>
                  </div>

                  {/* Scoreboard */}
                  <div className="flex items-center justify-around px-4 py-4">
                    <div className="text-center min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-700 leading-tight truncate">{match.homeTeam}</p>
                      <p className="text-4xl font-black mt-1" style={{ color: "#1a5c2a" }}>{match.homeScore}</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl text-xs font-black text-gray-400 shrink-0"
                      style={{ backgroundColor: "#f4f2ee" }}>vs</div>
                    <div className="text-center min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-wide text-gray-700 leading-tight truncate">{match.awayTeam}</p>
                      <p className="text-4xl font-black mt-1" style={{ color: "#1a5c2a" }}>{match.awayScore}</p>
                    </div>
                  </div>

                  {/* Commentary */}
                  <div className="mx-4 mb-3 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600"
                    style={{ backgroundColor: "#f4f2ee" }}>
                    {match.commentary}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 pb-4 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {match.venue}, {match.province}
                    </span>
                    <button
                      onClick={() => watchMatch(match)}
                      className="flex items-center gap-1 font-black uppercase tracking-wide transition-colors"
                      style={{ color: "#1a5c2a" }}
                    >
                      Watch live <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Matches */}
        <section>
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-3 ml-0.5" style={{ color: "#9ca3af" }}>
            Upcoming Matches ({filteredUpcoming.length})
          </h2>
          {filteredUpcoming.length === 0 ? (
            <p className="text-sm text-gray-400 font-semibold">No upcoming matches in {province}</p>
          ) : (
            <div className="space-y-2">
              {filteredUpcoming.map((match) => (
                <div key={match.id}
                  className="flex items-center justify-between rounded-2xl bg-white border border-gray-200 px-4 py-3.5 shadow-sm hover:border-gray-300 transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide text-gray-900 truncate">
                      {match.homeTeam} vs {match.awayTeam}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-gray-400 font-semibold">
                      <span className="flex items-center gap-1"><Clock size={9} /> {match.date}</span>
                      <span className="flex items-center gap-1"><MapPin size={9} /> {match.venue}</span>
                      <span className="flex items-center gap-1"><Users size={9} /> {match.ageGroup}</span>
                    </div>
                  </div>
                  <span className="shrink-0 ml-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
                    style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
                    {match.province}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Coach broadcast CTA */}
        {user.role === "coach" && (
          <section className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #14472a 100%)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(240,180,41,0.15)", border: "1px solid rgba(240,180,41,0.2)" }}>
                <Radio size={16} style={{ color: "#f0b429" }} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-white">Stream Your Match</p>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Broadcast from your browser · record + download
                </p>
              </div>
            </div>
            <Link
              href="/streaming/broadcast"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all hover:opacity-90"
              style={{ backgroundColor: "#f0b429", color: "#1a5c2a" }}
            >
              <Radio size={11} /> Start
            </Link>
          </section>
        )}

        {/* Voice commentary */}
        {latestCommentary && (
          <VoiceCommentary commentary={latestCommentary} autoPlay style="enthusiastic" />
        )}

        {/* Identity footer */}
        <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px]"
              style={{ backgroundColor: "#1a5c2a", color: "#f0b429" }}>
              {initials}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-gray-900 leading-none">{user.name || "Active Session"}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
                {user.province || "Zimbabwe"} · {user.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg"
            style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
            <ShieldCheck size={11} /> Sync Active
          </div>
        </div>

      </main>

      {/* HLS Player Modal */}
      {activeStream && (
        activeStream.url ? (
          <HLSPlayer
            streamUrl={activeStream.url}
            title={activeStream.title}
            onClose={() => setActiveStream(null)}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
              <Radio className="mx-auto mb-4 text-red-500 animate-pulse" size={40} />
              <h3 className="text-base font-black uppercase tracking-wide text-gray-900 mb-2">{activeStream.title}</h3>
              <p className="text-xs font-semibold text-gray-400 mb-6">
                Stream link not yet available. The coach is broadcasting from the mobile app — refresh in a moment.
              </p>
              <button
                onClick={() => setActiveStream(null)}
                className="rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-wide text-white transition-colors"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                Close
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
