"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserSearch, Send, Star, ChevronRight, Search, Loader2, Shield,
  FileText, ClipboardList, Sparkles, TrendingUp, Video, Eye,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { HubCard } from "@/components/ui/hub-card";
import api from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScoutPlayer {
  id: string;
  initials: string;
  region: string;
  position: string;
  age_group: string;
  overall_score: number | null;
  sessions_count: number;
  scout_visible: boolean;
}

interface ShowcaseClip {
  id: string;
  skill_type: string;
  video_url: string;
  ai_rating: number;
  top_strength: string;
  scout_note: string;
  position_fit: string[];
  open_for_scouting: boolean;
  view_count: number;
}

type Tab = "search" | "for-you" | "showcase" | "rising";

// ── Constants ─────────────────────────────────────────────────────────────────

const POSITIONS  = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
const PROVINCES  = [
  "Harare", "Bulawayo", "Manicaland", "Masvingo",
  "Mashonaland East", "Mashonaland West", "Mashonaland Central",
  "Matabeleland North", "Matabeleland South", "Midlands",
];
const AGE_GROUPS = ["u13", "u17", "u20", "senior"];

const LS_VIEWED_KEY   = "scout_viewed_players";
const LS_SHOWCASE_KEY = "grassroots_showcase_clips";

// ── Helpers ───────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 80 ? "text-green-400" : s >= 60 ? "text-[#f0b429]" : "text-muted-foreground";

function loadViewed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(LS_VIEWED_KEY) ?? "[]")); }
  catch { return new Set(); }
}

function markViewed(id: string) {
  try {
    const viewed = loadViewed();
    viewed.add(id);
    localStorage.setItem(LS_VIEWED_KEY, JSON.stringify([...viewed]));
  } catch { /* ok */ }
}

function loadLocalShowcase(): ShowcaseClip[] {
  try { return JSON.parse(localStorage.getItem(LS_SHOWCASE_KEY) ?? "[]"); }
  catch { return []; }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </main>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [tab, setTab]             = useState<Tab>("search");
  const [players, setPlayers]     = useState<ScoutPlayer[] | null>(null);
  const [loading, setLoading]     = useState(false);
  const [position, setPosition]   = useState("");
  const [province, setProvince]   = useState("");
  const [ageGroup, setAgeGroup]   = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [contactReason, setContactReason] = useState<Record<string, string>>({});
  const [sent, setSent]           = useState<Record<string, boolean>>({});
  const [sending, setSending]     = useState<Record<string, boolean>>({});

  // Natural language search
  const [nlQuery, setNlQuery]     = useState("");
  const [parsingNl, setParsingNl] = useState(false);

  // For You tab
  const [forYouPlayers, setForYouPlayers] = useState<ScoutPlayer[]>([]);
  const [loadingForYou, setLoadingForYou] = useState(false);

  // Showcase tab
  const [showcaseClips, setShowcaseClips] = useState<ShowcaseClip[]>([]);
  const [loadingShowcase, setLoadingShowcase] = useState(false);

  // Rising Stars tab
  const [risingStars, setRisingStars] = useState<ScoutPlayer[]>([]);
  const [loadingRising, setLoadingRising] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    if (user.role !== "scout" && user.role !== "admin") { router.push("/dashboard"); }
  }, [user, router]);

  // ── Tab data loaders ─────────────────────────────────────────────────────

  const loadForYou = useCallback(async () => {
    setLoadingForYou(true);
    try {
      const res = await api.get("/scout/players");
      const all: ScoutPlayer[] = res.data?.data ?? res.data ?? [];
      const viewed = loadViewed();
      // Prioritise unviewed players, then show all
      const unviewed = all.filter((p) => !viewed.has(p.id));
      setForYouPlayers(unviewed.length >= 3 ? unviewed : all);
    } catch { setForYouPlayers([]); }
    finally { setLoadingForYou(false); }
  }, []);

  const loadShowcase = useCallback(async () => {
    setLoadingShowcase(true);
    try {
      const res = await api.get("/showcase/discover");
      const clips: ShowcaseClip[] = res.data?.data ?? res.data ?? [];
      setShowcaseClips(clips.length ? clips : loadLocalShowcase());
    } catch { setShowcaseClips(loadLocalShowcase()); }
    finally { setLoadingShowcase(false); }
  }, []);

  const loadRising = useCallback(async () => {
    setLoadingRising(true);
    try {
      const res = await api.get("/scout/players");
      const all: ScoutPlayer[] = res.data?.data ?? res.data ?? [];
      const sorted = [...all]
        .filter((p) => p.overall_score !== null)
        .sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0));
      setRisingStars(sorted);
    } catch { setRisingStars([]); }
    finally { setLoadingRising(false); }
  }, []);

  useEffect(() => {
    if (tab === "for-you") loadForYou();
    if (tab === "showcase") loadShowcase();
    if (tab === "rising") loadRising();
  }, [tab, loadForYou, loadShowcase, loadRising]);

  // ── Search ────────────────────────────────────────────────────────────────

  const search = async () => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await api.get("/scout/players", {
        params: {
          position:  position  || undefined,
          province:  province  || undefined,
          age_group: ageGroup  || undefined,
        },
      });
      const results: ScoutPlayer[] = res.data?.data ?? res.data ?? [];
      setPlayers(results);
      // Track viewed
      results.forEach((p) => markViewed(p.id));
    } catch { setPlayers([]); }
    finally { setLoading(false); }
  };

  // ── Natural language search ───────────────────────────────────────────────

  const parseNlSearch = async () => {
    if (!nlQuery.trim()) return;
    setParsingNl(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Parse this scout search query into filters. Return ONLY valid JSON, no extra text:
Query: "${nlQuery}"
Format: {"position": "<string or null>", "province": "<string or null>", "age_group": "<u13/u17/u20/senior or null>"}
Use null for any field not mentioned. Position should be a short code like GK, CB, ST, CM, LW, ST etc.`,
          system_prompt: "You are a search query parser. Return only valid JSON.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw  = data.response ?? data.reply ?? "";
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.position) setPosition(parsed.position);
          if (parsed.province) setProvince(parsed.province);
          if (parsed.age_group) setAgeGroup(parsed.age_group);
        }
      }
    } catch { /* keep existing filters */ }
    finally { setParsingNl(false); }
    search();
  };

  // ── Contact ───────────────────────────────────────────────────────────────

  const sendContact = async (playerId: string) => {
    if (!contactReason[playerId]?.trim()) return;
    setSending((s) => ({ ...s, [playerId]: true }));
    try {
      await api.post("/scout/contact-requests", {
        player_id: playerId,
        reason:    contactReason[playerId],
      });
      setSent((s) => ({ ...s, [playerId]: true }));
    } catch { /* keep form open */ }
    finally { setSending((s) => ({ ...s, [playerId]: false })); }
  };

  if (!user) return <PageSkeleton />;

  const scoutCards = [
    { icon: UserSearch,    title: "Find Players",   subtitle: "Tsvaga vatambi — Search talent", href: "#search",          bg: "bg-[#c0392b]", gradient: "bg-gradient-to-br from-[#c0392b] to-[#922b21]" },
    { icon: Star,          title: "Shortlist",      subtitle: "Vadakara vako — Your watchlist", href: "/scout/shortlist", bg: "bg-[#d35400]", gradient: "bg-gradient-to-br from-[#d35400] to-[#a04000]" },
    { icon: FileText,      title: "PDF Reports",    subtitle: "AI scouting reports — Claude",  href: "/scout/reports",   bg: "bg-[#6c3483]", gradient: "bg-gradient-to-br from-[#6c3483] to-[#4a235a]" },
    { icon: ClipboardList, title: "Scout Requests", subtitle: "Contact approvals",             href: "/scout-requests",  bg: "bg-[#1a5276]", gradient: "bg-gradient-to-br from-[#1a5276] to-[#0d2b4a]" },
  ];

  const TABS: { id: Tab; label: string; icon: typeof Search }[] = [
    { id: "search",   label: "Search",        icon: Search },
    { id: "for-you",  label: "For You",       icon: Sparkles },
    { id: "showcase", label: "Showcase Clips", icon: Video },
    { id: "rising",   label: "Rising Stars",  icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Mhoro — Scout Hub</p>
          <h1 className="mt-1 text-2xl font-bold text-white">Find Players 🔍</h1>
          <p className="mt-0.5 text-sm italic text-accent/80">Tsvaga mukurumbira — Names hidden until contact approved</p>
        </div>

        {/* Hub cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {scoutCards.map((c) => <HubCard key={c.href} {...c} />)}
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                tab === id
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ── SEARCH TAB ── */}
        {tab === "search" && (
          <>
            {/* Natural language search */}
            <div className="mb-5 flex gap-2">
              <input
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && parseNlSearch()}
                placeholder='Try: "fast strikers under 17 in Harare" or "left back from Bulawayo"'
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-[#f0b429]/50 focus:ring-1 focus:ring-[#f0b429]/30"
              />
              <button
                onClick={parseNlSearch}
                disabled={parsingNl || !nlQuery.trim()}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-3 text-sm font-semibold text-[#1a3a1a] transition-colors hover:bg-[#f5c542] disabled:opacity-40"
              >
                {parsingNl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </button>
            </div>

            {/* Privacy notice */}
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
              <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
              <p className="text-sm text-blue-300">
                Player privacy is protected. You see initials and region only. Full contact details are shared only after admin approval.
              </p>
            </div>

            {/* Filters */}
            <div id="search" className="mb-5 rounded-xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Position</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPosition("")} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!position ? "bg-[#f0b429] text-[#1a3a1a]" : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}>Any</button>
                    {POSITIONS.map((p) => (
                      <button key={p} onClick={() => setPosition(position === p ? "" : p)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${position === p ? "bg-[#f0b429] text-[#1a3a1a]" : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Province</label>
                  <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#f0b429]">
                    <option value="">Any province</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-white">Age Group</label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setAgeGroup("")} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!ageGroup ? "bg-[#f0b429] text-[#1a3a1a]" : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}>Any</button>
                    {AGE_GROUPS.map((ag) => (
                      <button key={ag} onClick={() => setAgeGroup(ageGroup === ag ? "" : ag)} className={`rounded-full px-3 py-1 text-xs font-medium uppercase transition-colors ${ageGroup === ag ? "bg-[#f0b429] text-[#1a3a1a]" : "border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"}`}>{ag}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={search} disabled={loading} className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-6 py-2.5 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f5c542] disabled:opacity-50 transition-colors">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {loading ? "Searching…" : "Search players"}
                </button>
              </div>
            </div>

            <PlayerGrid
              players={players}
              loading={loading}
              hasSearched={hasSearched}
              contactReason={contactReason}
              sent={sent}
              sending={sending}
              onContactChange={(id, val) => setContactReason((p) => ({ ...p, [id]: val }))}
              onSendContact={sendContact}
            />
          </>
        )}

        {/* ── FOR YOU TAB ── */}
        {tab === "for-you" && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Players you haven&apos;t seen yet — based on your search history. Tap a card to add a contact request.
            </p>
            <PlayerGrid
              players={forYouPlayers.length ? forYouPlayers : null}
              loading={loadingForYou}
              hasSearched={true}
              contactReason={contactReason}
              sent={sent}
              sending={sending}
              onContactChange={(id, val) => setContactReason((p) => ({ ...p, [id]: val }))}
              onSendContact={sendContact}
              emptyMessage="You've seen all available players. Keep searching to discover more!"
            />
          </div>
        )}

        {/* ── SHOWCASE CLIPS TAB ── */}
        {tab === "showcase" && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Watch skill clips uploaded by players — AI-rated and open for scouting.
            </p>
            {loadingShowcase ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-52 animate-pulse rounded-xl bg-muted/40" />)}
              </div>
            ) : showcaseClips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
                <Video className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-white">No showcase clips yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Players upload clips from their showcase page — clips will appear here once submitted.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {showcaseClips.map((clip) => (
                  <div key={clip.id} className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-sm">
                    <div className="mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-black/40">
                      {clip.video_url ? (
                        <video src={clip.video_url} className="h-full w-full rounded-xl object-cover" controls preload="metadata" />
                      ) : (
                        <Video className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-[#f0b429]/20 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#f0b429]">{clip.skill_type}</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-[#f0b429] text-[#f0b429]" />
                        <span className="text-sm font-bold text-white">{clip.ai_rating.toFixed(1)}/10</span>
                      </div>
                    </div>
                    <p className="mb-1 text-xs font-medium text-accent">Scout Note</p>
                    <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">{clip.scout_note}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(clip.position_fit ?? []).map((pos) => (
                        <span key={pos} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted-foreground">{pos}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {clip.view_count} views
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RISING STARS TAB ── */}
        {tab === "rising" && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              Players ranked by highest performance score — the most promising talent on the platform right now.
            </p>
            <PlayerGrid
              players={risingStars.length ? risingStars : null}
              loading={loadingRising}
              hasSearched={true}
              contactReason={contactReason}
              sent={sent}
              sending={sending}
              onContactChange={(id, val) => setContactReason((p) => ({ ...p, [id]: val }))}
              onSendContact={sendContact}
              emptyMessage="No ranked players yet. Players need completed sessions to appear here."
            />
          </div>
        )}

      </main>
    </div>
  );
}

// ── Player grid sub-component ─────────────────────────────────────────────────

function PlayerGrid({
  players, loading, hasSearched,
  contactReason, sent, sending,
  onContactChange, onSendContact,
  emptyMessage = "No players found. Try adjusting your filters.",
}: {
  players: ScoutPlayer[] | null;
  loading: boolean;
  hasSearched: boolean;
  contactReason: Record<string, string>;
  sent: Record<string, boolean>;
  sending: Record<string, boolean>;
  onContactChange: (id: string, val: string) => void;
  onSendContact: (id: string) => void;
  emptyMessage?: string;
}) {
  const scoreColor = (s: number) =>
    s >= 80 ? "text-green-400" : s >= 60 ? "text-[#f0b429]" : "text-muted-foreground";

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted/40" />)}
      </div>
    );
  }

  if (players !== null && players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
        <UserSearch className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-medium text-white">No players found</p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  if (!hasSearched || players === null) {
    return (
      <div className="rounded-xl border border-white/10 bg-card/60 p-12 text-center backdrop-blur-sm">
        <UserSearch className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-medium text-white">Search for players</p>
        <p className="mt-1 text-sm text-muted-foreground">Use the filters above to find players matching your criteria</p>
      </div>
    );
  }

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">{players.length} player{players.length !== 1 ? "s" : ""} found</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <div key={p.id} className="rounded-xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0b429]/10 text-lg font-bold text-[#f0b429]">
                  {p.initials}
                </div>
                <p className="mt-2 font-semibold uppercase text-white">{p.position}</p>
                <p className="text-sm text-muted-foreground">{p.region}</p>
                <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium uppercase text-muted-foreground">
                  {p.age_group}
                </span>
              </div>
              {p.overall_score !== null && (
                <div className="text-right">
                  <p className={`text-2xl font-black ${scoreColor(p.overall_score)}`}>{p.overall_score}</p>
                  <p className="text-xs text-muted-foreground">avg score</p>
                </div>
              )}
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              {p.sessions_count} session{p.sessions_count !== 1 ? "s" : ""} recorded
            </p>
            {sent[p.id] ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2.5 text-sm font-medium text-green-400">
                <Send className="h-3.5 w-3.5" /> Request sent — awaiting admin review
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={contactReason[p.id] ?? ""}
                  onChange={(e) => onContactChange(p.id, e.target.value)}
                  placeholder="Reason for contact…"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-[#f0b429]"
                />
                <button
                  onClick={() => onSendContact(p.id)}
                  disabled={!contactReason[p.id]?.trim() || sending[p.id]}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f0b429] px-3 py-2 text-xs font-semibold text-[#1a3a1a] hover:bg-[#f5c542] disabled:opacity-40 transition-colors"
                >
                  {sending[p.id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Contact Player
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
