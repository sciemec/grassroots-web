"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  MapPin, Calendar, Trophy, Star, ChevronRight, Filter, Search,
  Users, Newspaper, Heart, Bell, ArrowRight, Loader2, Medal
} from "lucide-react";

interface MatchReport {
  id: string;
  home_team: string;
  away_team: string;
  score: string;
  match_date: string;
  ai_headline: string;
  area_label: string | null;
  player_of_match?: string | null;
}

interface Spotlight {
  id: string;
  ai_story: string;
  trigger_reason: string;
  published_at: string;
  player: {
    initials: string;
    position: string | null;
    area: string | null;
  } | null;
}

interface Moment {
  id: string;
  type: string;
  ai_caption: string | null;
  area_label: string | null;
  likes_count: number;
  is_featured: boolean;
  created_at: string;
}

interface MatchAlert {
  id: string;
  home_team: string;
  away_team: string;
  match_datetime: string;
  location: string;
  area_label: string | null;
}

interface FeedResponse {
  match_reports: MatchReport[];
  spotlights: Spotlight[];
  moments: Moment[];
  match_alerts: MatchAlert[];
  personalised: boolean;
}

interface Talent {
  id: string;
  name: string;
  sport: string;
  province: string;
  percentile: number;
  tier: string;
}

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const TRIGGER_LABELS: Record<string, string> = {
  logged_7_sessions:   "7 sessions this week",
  stage_advanced:      "Level up",
  ubuntu_debut_leader: "First ubuntu session led",
  scout_viewed_profile:"Scout viewed profile",
  joy_score_rise:      "Joy score rising",
};

const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Masvingo", "Mashonaland East", "Mashonaland West", "Mashonaland Central", "Matabeleland North", "Matabeleland South", "Midlands"];
const SPORTS = ["All", "Football", "Athletics (Track)", "Rugby", "Netball", "Basketball", "Swimming", "Tennis", "Boxing", "Other"];

export default function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Consolidated core application ledger streams
  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLastPage, setReportsLastPage] = useState(1);

  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [talentsLoading, setTalentsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProvince, setFilterProvince] = useState("All");
  const [filterSport, setFilterSport] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const [followType, setFollowType] = useState<"club" | "area">("club");
  const [followId, setFollowId] = useState("");
  const [followMsg, setFollowMsg] = useState("");
  const [followPending, setFollowPending] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: HeadersInit = token && token !== "dev-token" ? { Authorization: `Bearer ${token}` } : {};

    setFeedLoading(true);
    Promise.all([
      fetch(`${API}/fan/feed`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API}/matches/reports?per_page=6&page=${reportsPage}`).then((r) => r.json()).catch(() => null),
    ])
      .then(([feedData, reportData]) => {
        if (feedData) setFeed(feedData);
        if (reportData) {
          setReports(reportData.data ?? []);
          setReportsLastPage(reportData.last_page ?? 1);
        }
      })
      .catch(console.error)
      .finally(() => setFeedLoading(false));
  }, [reportsPage]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/talent-leaderboard`);
        if (response.ok) {
          const data = await response.json();
          const transformed = (data.data || []).map((item: any) => ({
            id: item.user_id,
            name: item.initials || "Athlete",
            sport: item.sport || "Multi-sport",
            province: item.province || "Zimbabwe",
            percentile: item.percentile || 0,
            tier: item.peak_level_label || "Developing",
          }));
          setTalents(transformed);
        }
      } catch (err) {
        console.error("Failed to map live metrics:", err);
      } finally {
        setTalentsLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    let result = [...talents];
    if (searchTerm) {
      result = result.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterProvince !== "All") {
      result = result.filter(t => t.province === filterProvince);
    }
    if (filterSport !== "All") {
      result = result.filter(t => t.sport === filterSport);
    }
    result.sort((a, b) => b.percentile - a.percentile);
    setFilteredTalents(result);
  }, [talents, searchTerm, filterProvince, filterSport]);

  const handleFollowAction = async () => {
    if (!followId.trim() || !hasHydrated) return;
    if (!user) {
      setFollowMsg("Sign in to follow teams and areas.");
      return;
    }
    setFollowPending(true);
    setFollowMsg("");

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API}/fan/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ followed_type: followType, followed_id: followId.trim() }),
      });

      if (res.ok) {
        setFollowMsg(`Now following ${followId.trim()}. Metrics loaded.`);
        setFollowId("");
      } else {
        setFollowMsg("Could not process choices.");
      }
    } catch {
      setFollowMsg("Synchronization gap.");
    } finally {
      setFollowPending(false);
    }
  };

  const getTierBadgeStyle = (tier: string) => {
    if (tier?.includes("Elite")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (tier?.includes("Competitive")) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const digest = feed?.moments.find((m) => m.type === "digest" && m.is_featured);
  const featuredMoments = feed?.moments.filter((m) => m.type !== "digest").slice(0, 6) ?? [];
  const spotlights = feed?.spotlights ?? [];
  const upcomingAlerts = (feed?.match_alerts ?? []).filter((a) => {
    if (!selectedArea) return true;
    return a.area_label === selectedArea;
  });

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-gray-900 antialiased font-sans selection:bg-[#f0b429]/30">
      
      <nav className="bg-[#e2f0d9] border-b-2 border-[#f0b429] sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-[#1c3d22] p-1.5 rounded-lg text-[#f0b429] font-black text-xs">GRS</div>
            <span className="text-[#1c3d22] font-black text-sm tracking-wider uppercase group-hover:text-emerald-800 transition-colors">
              Grassroots Sports
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/community" className="text-xs font-black uppercase tracking-wider text-[#1c3d22] border-b-2 border-[#1c3d22]">
              Community Feed
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#e2f0d9] via-[#f0f9e8] to-[#f4f2ee] py-16 px-4 text-center border-b border-gray-200">
        <div className="relative max-w-3xl mx-auto space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-800">
            The Grassroots Ledger · National Stream
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 uppercase leading-none">
            Zimbabwe&apos;s Beautiful Game, <span className="text-[#1c3d22] border-b-4 border-[#f0b429]">Live.</span>
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm font-semibold text-gray-500 leading-relaxed">
            Unifying verified digital scout monitoring lists with automated live match diaries. Follow performance records transparently directly from the provincial pipelines.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-12">
          
          {/* DISCOVERY GRID PANEL */}
          <section className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-3xs space-y-4">
            <SectionHeader icon={<Medal className="h-4 w-4" />} label="Discover Zimbabwe's Stars" />
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search athletes by initials or name moniker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-zinc-400 transition-all text-gray-900"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3.5 rounded-xl border transition-all flex items-center justify-center ${
                  showFilters ? "bg-[#1c3d22] border-[#1c3d22] text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={16} />
              </button>
            </div>

            {showFilters && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-4 animate-fade-in">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Filter By Province</span>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...PROVINCES].map((p) => (
                      <button
                        key={p}
                        onClick={() => setFilterProvince(p)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border ${
                          filterProvince === p ? "bg-[#1c3d22] text-white border-[#1c3d22]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Filter By Discipline</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SPORTS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterSport(s)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border ${
                          filterSport === s ? "bg-[#1c3d22] text-white border-[#1c3d22]" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {talentsLoading ? (
              <div className="space-y-2 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredTalents.length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-gray-400 italic bg-gray-50 rounded-2xl border border-dashed">
                No active athlete records found.
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {filteredTalents.map((talent, index) => (
                  <Link href={`/player/passport`} key={talent.id} className="block group">
                    <div className="bg-white border border-gray-200 group-hover:border-[#1c3d22] p-4 rounded-xl flex items-center justify-between gap-4 transition-all shadow-3xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#e2f0d9] border border-[#1c3d22]/10 flex items-center justify-center text-[#1c3d22] font-black text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">{talent.name}</h3>
                            <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 border rounded-full ${getTierBadgeStyle(talent.tier)}`}>
                              {talent.tier}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                            <span>{talent.sport}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><MapPin size={10} /> {talent.province}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-[#1c3d22] leading-none">{talent.percentile}th</p>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block mt-0.5">Percentile</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 📰 AUTOMATED MATCH REPORTS */}
          <section className="space-y-4">
            <SectionHeader icon={<Trophy className="h-4 w-4" />} label="Latest Match Reports" />
            
            {feedLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
                <div className="h-28 bg-white border border-gray-200 rounded-2xl animate-pulse" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-xs font-semibold text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-200">
                No reports logged in the system.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reports.map((r) => (
                    <div key={r.id} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-3xs">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
                          <span>{r.area_label ?? "Zimbabwe"}</span>
                          <span>{formatDate(r.match_date)}</span>
                        </div>
                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide leading-tight">
                          {r.ai_headline}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 border-t border-gray-100 pt-2 text-xs font-bold">
                        <span className="text-gray-800">{r.home_team}</span>
                        <span className="bg-[#e2f0d9] text-[#1c3d22] border border-[#1c3d22]/10 px-2 py-0.5 rounded-md font-black text-[10px]">
                          {r.score}
                        </span>
                        <span className="text-gray-800">{r.away_team}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {reportsLastPage > 1 && (
                  <div className="flex justify-center items-center gap-3 pt-2">
                    <button
                      disabled={reportsPage === 1}
                      onClick={() => setReportsPage((p) => p - 1)}
                      className="px-3 py-1.5 border border-gray-200 bg-white text-[10px] font-black uppercase tracking-wider rounded-lg disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-gray-400">
                      {reportsPage} / {reportsLastPage}
                    </span>
                    <button
                      disabled={reportsPage === reportsLastPage}
                      onClick={() => setReportsPage((p) => p + 1)}
                      className="px-3 py-1.5 border border-gray-200 bg-white text-[10px] font-black uppercase tracking-wider rounded-lg disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* ⭐ PLAYER SPOTLIGHTS */}
          {!feedLoading && spotlights.length > 0 && (
            <section className="space-y-4">
              <SectionHeader icon={<Star className="h-4 w-4" />} label="Biometric Player Spotlights" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {spotlights.map((s) => {
                  const triggerLabel = TRIGGER_LABELS[s.trigger_reason] ?? s.trigger_reason.replace(/_/g, " ");
                  return (
                    <div key={s.id} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-3xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#e2f0d9] flex items-center justify-center text-xs font-black text-[#1c3d22] border border-[#1c3d22]/10">
                            {s.player?.initials ?? "??"}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight leading-none">
                              {s.player?.position ?? "Athlete Profile"}
                            </p>
                            {s.player?.area && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                                <MapPin size={8} /> {s.player.area}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-medium text-gray-600 leading-relaxed line-clamp-3">
                          {s.ai_story}
                        </p>
                      </div>
                      <div className="flex justify-between items-center border-t border-gray-100 pt-2 text-[9px] font-bold uppercase tracking-wide">
                        <span className="bg-[#f0b429] text-[#1c3d22] border border-[#1c3d22]/20 px-2 py-0.5 rounded-md text-[8px] font-black tracking-widest">
                          {triggerLabel}
                        </span>
                        <span className="text-gray-400">{formatDate(s.published_at)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>

        {/* RIGHT COLUMN FIXED ASSETS */}
        <div className="space-y-8">
          
          {/* NARRATIVE SUMMARY */}
          {!feedLoading && digest && (
            <section className="bg-[#e2f0d9] border-2 border-[#1c3d22]/10 rounded-3xl p-5 text-[#1c3d22] shadow-3xs space-y-3">
              <div className="flex items-center gap-2 border-b border-[#1c3d22]/10 pb-2">
                <Newspaper size={16} className="text-[#1c3d22]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">Weekly Narrative Summary</h4>
              </div>
              <p className="text-xs font-semibold text-gray-700 leading-relaxed whitespace-pre-line">
                {digest.ai_caption}
              </p>
              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Logged: {formatDate(digest.created_at)}
              </span>
            </section>
          )}

          {/* WEEKEND MATCH FIXTURE COMPONENT */}
          <section className="bg-white border border-gray-200 rounded-3xl p-5 shadow-3xs space-y-4">
            <SectionHeader icon={<Bell className="h-4 w-4" />} label="Matches This Weekend" />
            
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Isolate Regional Stream</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-zinc-400 font-bold transition-all text-gray-800"
              >
                <option value="">All Regions / Provinces</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {feedLoading ? (
              <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            ) : upcomingAlerts.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 italic bg-gray-50 rounded-xl border border-dashed">
                No fixtures scheduled.
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {upcomingAlerts.map((a) => {
                  const matchDate = new Date(a.match_datetime);
                  return (
                    <div key={a.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
                      <div className="text-center border-r border-gray-200 pr-2 shrink-0 min-w-[45px]">
                        <p className="text-[10px] font-black text-[#1c3d22] uppercase tracking-tighter leading-none">
                          {matchDate.toLocaleDateString("en-ZW", { weekday: "short" })}
                        </p>
                        <span className="text-[9px] font-bold text-gray-400 tracking-tight block mt-0.5">
                          {matchDate.toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-gray-900 uppercase tracking-tight">
                          {a.home_team} <span className="text-gray-400 font-bold lowercase">vs</span> {a.away_team}
                        </p>
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-wide truncate mt-0.5">
                          <MapPin size={8} /> {a.location} {a.area_label && ` · ${a.area_label}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* SUBSCRIPTION CAPTURE PANEL */}
          <section className="bg-white border border-gray-200 rounded-3xl p-5 shadow-3xs space-y-4">
            <SectionHeader icon={<Users className="h-4 w-4" />} label="Follow Pipeline Tracks" />
            <p className="text-[11px] font-medium text-gray-400 leading-normal">
              Subscribe to regional directories or specific club nodes to personalize upcoming match alert sequences.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex gap-1.5">
                {(["club", "area"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { setFollowType(type); setFollowId(""); }}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                      followType === type ? "bg-[#1c3d22] text-[#f0b429]" : "bg-white border-gray-200 text-gray-500"
                    }`}
                  >
                    {type === "club" ? "Club / Node" : "Province"}
                  </button>
                ))}
              </div>

              {followType === "area" ? (
                <select
                  value={followId}
                  onChange={(e) => setFollowId(e.target.value)}
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:border-zinc-400 font-bold text-gray-800"
                >
                  <option value="">Select target province...</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={followId}
                  onChange={(e) => setFollowId(e.target.value)}
                  placeholder="e.g. Highlanders FC, Caps United, Dynamos…"
                  className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-zinc-400 font-bold text-gray-900"
                />
              )}

              <button
                onClick={handleFollowAction}
                disabled={!followId.trim() || followPending}
                className="w-full bg-[#1c3d22] hover:bg-emerald-900 disabled:opacity-40 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-3xs"
              >
                {followPending ? <Loader2 size={12} className="animate-spin text-[#f0b429]" /> : <ArrowRight size={12} />}
                <span>{followPending ? "Syncing..." : `Follow selected ${followType}`}</span>
              </button>

              {followMsg && (
                <p className={`text-[11px] font-bold mt-1 text-center ${followMsg.includes("Now following") ? "text-emerald-700" : "text-gray-500"}`}>
                  {followMsg}
                </p>
              )}
            </div>
          </section>

          {/* COMMUNITY MOMENTS FEED */}
          {!feedLoading && featuredMoments.length > 0 && (
            <section className="space-y-4">
              <SectionHeader icon={<Heart className="h-4 w-4" />} label="Community Moments" />
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {featuredMoments.map((m) => {
                  if (!m.ai_caption) return null;
                  return (
                    <div key={m.id} className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3 shadow-3xs">
                      <p className="text-xs font-semibold text-gray-700 leading-relaxed">
                        {m.ai_caption}
                      </p>
                      <div className="flex items-center justify-between border-t border-gray-50 pt-2 text-[10px] font-bold text-gray-400 uppercase">
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> {m.area_label ?? "Zimbabwe"}</span>
                        {m.likes_count > 0 && <span className="flex items-center gap-0.5 text-rose-600"><Heart size={10} className="fill-current" /> {m.likes_count}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>
      
    </div>
  );
}

// ── HEADER HELPER INTERNAL WORKER ─────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-[#f0b429] pl-2.5 select-none">
      <span className="text-[#1c3d22]">{icon}</span>
      <h2 className="text-xs font-black uppercase tracking-wider text-[#1c3d22]">{label}</h2>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-ZW", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}