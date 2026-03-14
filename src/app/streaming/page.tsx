"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, Users, Clock, MapPin, Eye, ChevronRight, X, Volume2, VolumeX, Maximize2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { VoiceCommentary } from "@/components/video/voice-commentary";
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

// Fallback mock data when API is unavailable
const MOCK_LIVE: LiveMatch[] = [
  {
    id: "1", homeTeam: "Harare City Youth", awayTeam: "Dynamos FC U17",
    homeScore: 2, awayScore: 1, minute: 67,
    venue: "Rufaro Stadium", province: "Harare", ageGroup: "U17", viewers: 142,
    status: "live",
    commentary: "⚡ GOAL! Tinashe scores with a powerful left-foot strike from 25 yards!",
  },
  {
    id: "2", homeTeam: "Bulawayo Chiefs", awayTeam: "Highlanders Academy",
    homeScore: 0, awayScore: 0, minute: 34,
    venue: "Barbourfields", province: "Bulawayo", ageGroup: "U20", viewers: 89,
    status: "live",
    commentary: "🔥 End-to-end action — Mutanda nearly scores from the corner!",
  },
];

const MOCK_UPCOMING: UpcomingMatch[] = [
  { id: "3", homeTeam: "Mutare FC", awayTeam: "Masvingo Stars", date: "Today 15:00", venue: "Sakubva Stadium", province: "Manicaland", ageGroup: "Senior" },
  { id: "4", homeTeam: "Gweru United", awayTeam: "Kwekwe FC", date: "Tomorrow 10:00", venue: "Gweru SC Ground", province: "Midlands", ageGroup: "U17" },
  { id: "5", homeTeam: "Bindura Youth", awayTeam: "Shamva FC", date: "Tomorrow 14:00", venue: "Trojan Stadium", province: "Mashonaland Central", ageGroup: "U13" },
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
        // Native HLS (Safari / iOS)
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
        {/* Top bar */}
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

        {/* Video */}
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
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                muted={muted}
                playsInline
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StreamingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>(MOCK_LIVE);
  const [upcoming, setUpcoming] = useState<UpcomingMatch[]>(MOCK_UPCOMING);
  const [activeStream, setActiveStream] = useState<{ url: string; title: string } | null>(null);
  const [province, setProvince] = useState("all");
  // Track latest commentary text for voice commentary auto-speak
  const [latestCommentary, setLatestCommentary] = useState("");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    // Fetch real matches from API, fall back to mock on error
    api.get("/matches/live").then((res) => {
      if (res.data?.live?.length) setLiveMatches(res.data.live);
      if (res.data?.upcoming?.length) setUpcoming(res.data.upcoming);
    }).catch(() => {}); // keep mock data on error
  }, [user, router]);

  if (!user) return null;

  const provinces = ["all", ...Array.from(new Set([...liveMatches.map(m => m.province), ...upcoming.map(m => m.province)]))];
  const filteredLive = province === "all" ? liveMatches : liveMatches.filter(m => m.province === province);
  const filteredUpcoming = province === "all" ? upcoming : upcoming.filter(m => m.province === province);

  const watchMatch = (match: LiveMatch) => {
    setLatestCommentary(match.commentary);
    if (match.stream_url) {
      setActiveStream({ url: match.stream_url, title: `${match.homeTeam} vs ${match.awayTeam}` });
    } else {
      // No stream URL — show placeholder with match info
      setActiveStream({ url: "", title: `${match.homeTeam} vs ${match.awayTeam}` });
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="h-6 w-6 text-red-500 animate-pulse" /> Live Streaming Hub
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Zimbabwe grassroots matches — live and upcoming</p>
          </div>
          {/* Province filter */}
          <div className="flex flex-wrap gap-2">
            {provinces.map((p) => (
              <button
                key={p}
                onClick={() => setProvince(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize ${
                  province === p ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-muted"
                }`}
              >
                {p === "all" ? "All Provinces" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Live now */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-semibold text-sm uppercase tracking-wide">Live Now ({filteredLive.length})</h2>
          </div>

          {filteredLive.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Radio className="mx-auto mb-2 h-6 w-6" />
              <p className="text-sm">No live matches in {province} right now</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredLive.map((match) => (
                <div key={match.id} className="rounded-2xl border-2 border-red-500/30 bg-red-500/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-red-500">LIVE {match.minute}&apos;</span>
                      <span className="text-xs text-muted-foreground">{match.ageGroup}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" /> {match.viewers} watching
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-sm font-bold">{match.homeTeam}</p>
                      <p className="text-4xl font-black text-primary">{match.homeScore}</p>
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-1.5 text-sm font-bold text-muted-foreground">vs</div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{match.awayTeam}</p>
                      <p className="text-4xl font-black text-primary">{match.awayScore}</p>
                    </div>
                  </div>

                  <div className="mb-3 rounded-lg bg-background/60 px-3 py-2.5 text-sm">{match.commentary}</div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}, {match.province}</span>
                    <button
                      onClick={() => watchMatch(match)}
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Watch live <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming Matches ({filteredUpcoming.length})
          </h2>
          {filteredUpcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming matches in {province}</p>
          ) : (
            <div className="space-y-2">
              {filteredUpcoming.map((match) => (
                <div key={match.id} className="flex items-center justify-between rounded-xl border bg-card px-5 py-4 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="font-medium">{match.homeTeam} vs {match.awayTeam}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {match.date}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {match.venue}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {match.ageGroup}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{match.province}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coach streaming CTA — includes web broadcast button */}
        {user.role === "coach" && (
          <div className="mt-8 rounded-2xl border border-dashed p-6 text-center">
            <Radio className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h3 className="font-semibold">Stream your match</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a local broadcast directly from your browser — record your match and download the recording.
            </p>
            <Link
              href="/streaming/broadcast"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors"
            >
              <Radio className="h-4 w-4" /> Start Broadcasting
            </Link>
          </div>
        )}

        {/* Voice commentary — auto-speaks latest match commentary */}
        {latestCommentary && (
          <div className="mt-6">
            <VoiceCommentary
              commentary={latestCommentary}
              autoPlay
              style="enthusiastic"
            />
          </div>
        )}
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
            <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center">
              <Radio className="mx-auto mb-4 h-10 w-10 text-red-500 animate-pulse" />
              <h3 className="text-lg font-bold mb-2">{activeStream.title}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Stream link not yet available. The coach is broadcasting from the mobile app — refresh in a moment.
              </p>
              <button
                onClick={() => setActiveStream(null)}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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
