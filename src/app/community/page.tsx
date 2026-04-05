"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import {
  MapPin, Calendar, Trophy, Star, ChevronRight,
  Users, Newspaper, Heart, Bell, ArrowRight, Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const TRIGGER_LABELS: Record<string, string> = {
  logged_7_sessions:   "7 sessions this week",
  stage_advanced:      "Level up",
  ubuntu_debut_leader: "First ubuntu session led",
  scout_viewed_profile:"Scout viewed their profile",
  joy_score_rise:      "Joy score rising",
};

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Masvingo",
  "Mashonaland East", "Mashonaland West", "Mashonaland Central",
  "Matabeleland North", "Matabeleland South", "Midlands",
  "Mutare", "Gweru", "Kwekwe", "Kadoma", "Chinhoyi",
  "Bindura", "Masvingo City", "Zvishavane", "Hwange",
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [feed, setFeed] = useState<FeedResponse | null>(null);
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLastPage, setReportsLastPage] = useState(1);

  // Follow widget state
  const [followType, setFollowType] = useState<"club" | "area">("club");
  const [followId, setFollowId] = useState("");
  const [followMsg, setFollowMsg] = useState("");
  const [followPending, setFollowPending] = useState(false);

  // Area filter for match alerts
  const [selectedArea, setSelectedArea] = useState("");

  // ── Fetch feed ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const headers: HeadersInit = token && token !== "dev-token"
      ? { Authorization: `Bearer ${token}` }
      : {};

    Promise.all([
      fetch(`${API}/fan/feed`, { headers }).then((r) => r.json()),
      fetch(`${API}/matches/reports?per_page=6&page=${reportsPage}`).then((r) => r.json()),
    ])
      .then(([feedData, reportData]) => {
        setFeed(feedData);
        setReports(reportData.data ?? []);
        setReportsLastPage(reportData.last_page ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [reportsPage]);

  // ── Follow handler ──────────────────────────────────────────────────────────

  const handleFollow = async () => {
    if (!followId.trim()) return;
    if (!hasHydrated) return;

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
        setFollowMsg(`Now following ${followId.trim()}. You'll get match reports and alerts.`);
        setFollowId("");
      } else {
        setFollowMsg("Could not follow — please try again.");
      }
    } catch {
      setFollowMsg("Something went wrong. Try again.");
    } finally {
      setFollowPending(false);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const digest = feed?.moments.find((m) => m.type === "digest" && m.is_featured);
  const featuredMoments = feed?.moments.filter((m) => m.type !== "digest").slice(0, 6) ?? [];
  const spotlights = feed?.spotlights ?? [];
  const upcomingAlerts = (feed?.match_alerts ?? []).filter((a) => {
    if (!selectedArea) return true;
    return a.area_label === selectedArea;
  });

  // ── Skeleton ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1f13]">
        <PublicNav />
        <div className="mx-auto max-w-5xl px-4 py-16">
          <div className="space-y-4">
            <div className="h-12 w-2/3 animate-pulse rounded-xl bg-white/10" />
            <div className="h-6 w-1/2 animate-pulse rounded-xl bg-white/10" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d1f13] text-white">
      <PublicNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#1a5c2a] to-[#0d1f13] px-4 py-20 text-center">
        {/* Chevron pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg,transparent 0,transparent 8px,rgba(240,180,41,0.4) 8px,rgba(240,180,41,0.4) 10px),repeating-linear-gradient(45deg,transparent 0,transparent 8px,rgba(240,180,41,0.4) 8px,rgba(240,180,41,0.4) 10px)",
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-[#f0b429]">
            GrassRoots Sports · Zimbabwe
          </p>
          <h1 className="mb-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Zimbabwe&apos;s beautiful game,{" "}
            <span className="text-[#f0b429]">live.</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-white/70 sm:text-lg">
            Match reports. Player spotlights. Community moments.
            The grassroots story, told the way it deserves to be.
          </p>
          {!user && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="rounded-full bg-[#f0b429] px-6 py-2.5 text-sm font-bold text-[#1a3a1a] transition hover:bg-[#f5c542]"
              >
                Join the network
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-12">

        {/* ── This Week digest ──────────────────────────────────────────────── */}
        {digest && (
          <section>
            <SectionHeader icon={<Newspaper className="h-5 w-5" />} label="This Week" />
            <div className="mt-4 rounded-2xl border border-[#f0b429]/30 bg-[#1a5c2a]/40 p-6 backdrop-blur-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#f0b429]">
                This Week in Zimbabwean Football
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-white/85 sm:text-base">
                {digest.ai_caption}
              </p>
              <p className="mt-4 text-xs text-white/40">
                {formatDate(digest.created_at)}
              </p>
            </div>
          </section>
        )}

        {/* ── Latest Match Reports ──────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<Trophy className="h-5 w-5" />} label="Latest Match Reports" />
          {reports.length === 0 ? (
            <EmptyState text="No match reports yet. Be the first to submit one." />
          ) : (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {reports.map((r) => (
                  <MatchReportCard key={r.id} report={r} />
                ))}
              </div>
              {reportsLastPage > 1 && (
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    disabled={reportsPage === 1}
                    onClick={() => setReportsPage((p) => p - 1)}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/70 disabled:opacity-40 hover:border-white/40 transition"
                  >
                    Previous
                  </button>
                  <span className="flex items-center text-sm text-white/50">
                    {reportsPage} / {reportsLastPage}
                  </span>
                  <button
                    disabled={reportsPage === reportsLastPage}
                    onClick={() => setReportsPage((p) => p + 1)}
                    className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/70 disabled:opacity-40 hover:border-white/40 transition"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Player Spotlights ─────────────────────────────────────────────── */}
        {spotlights.length > 0 && (
          <section>
            <SectionHeader icon={<Star className="h-5 w-5" />} label="Player Spotlights" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {spotlights.map((s) => (
                <SpotlightCard key={s.id} spotlight={s} />
              ))}
            </div>
          </section>
        )}

        {/* ── Beautiful Moments ─────────────────────────────────────────────── */}
        {featuredMoments.length > 0 && (
          <section>
            <SectionHeader icon={<Heart className="h-5 w-5" />} label="Beautiful Moments" />
            <div className="mt-4 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {featuredMoments.map((m) => (
                <MomentCard key={m.id} moment={m} />
              ))}
            </div>
          </section>
        )}

        {/* ── Matches This Weekend ──────────────────────────────────────────── */}
        <section>
          <SectionHeader icon={<Bell className="h-5 w-5" />} label="Matches This Weekend" />
          <div className="mt-4">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="mb-4 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/80 outline-none focus:border-[#f0b429]/50"
            >
              <option value="">All areas</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {upcomingAlerts.length === 0 ? (
              <EmptyState text="No upcoming matches found for this area." />
            ) : (
              <div className="space-y-3">
                {upcomingAlerts.map((a) => (
                  <AlertCard key={a.id} alert={a} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Follow a team or area ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <SectionHeader icon={<Users className="h-5 w-5" />} label="Follow a Team or Area" />
          <p className="mt-1 text-sm text-white/60">
            Get match reports, player spotlights, and upcoming match alerts for the teams and areas you love.
          </p>

          <div className="mt-5 space-y-3">
            {/* Type toggle */}
            <div className="flex gap-2">
              {(["club", "area"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFollowType(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                    followType === t
                      ? "bg-[#f0b429] text-[#1a3a1a]"
                      : "border border-white/20 text-white/60 hover:border-white/40"
                  }`}
                >
                  {t === "club" ? "Club / Team" : "Area"}
                </button>
              ))}
            </div>

            {/* Input */}
            {followType === "area" ? (
              <select
                value={followId}
                onChange={(e) => setFollowId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[#f0b429]/50"
              >
                <option value="">Select province or city</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            ) : (
              <input
                value={followId}
                onChange={(e) => setFollowId(e.target.value)}
                placeholder="e.g. Harare City FC, Highlanders, Caps United…"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#f0b429]/50"
              />
            )}

            <button
              onClick={handleFollow}
              disabled={!followId.trim() || followPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2.5 text-sm font-bold text-[#1a3a1a] transition hover:bg-[#f5c542] disabled:opacity-50"
            >
              {followPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {followPending ? "Following…" : `Follow ${followType === "club" ? "this team" : "this area"}`}
            </button>

            {followMsg && (
              <p className={`text-sm ${followMsg.includes("Now following") ? "text-green-400" : "text-white/60"}`}>
                {followMsg}
                {followMsg.includes("Sign in") && (
                  <> <Link href="/login" className="underline text-[#f0b429]">Sign in here</Link>.</>
                )}
              </p>
            )}
          </div>
        </section>

        {/* ── Footer CTA ────────────────────────────────────────────────────── */}
        {!user && (
          <section className="py-8 text-center">
            <p className="mb-2 text-lg font-semibold text-white/80">
              Ready to be part of the story?
            </p>
            <p className="mb-6 text-sm text-white/50">
              Register as a player, coach, or scout and get your work recognised.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#f0b429] px-8 py-3 font-bold text-[#1a3a1a] transition hover:bg-[#f5c542]"
            >
              Join GrassRoots Sports <ChevronRight className="h-4 w-4" />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PublicNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0d1f13]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-black tracking-tight text-white">
          Grassroots<span className="text-[#f0b429]">Sports</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/community" className="text-xs font-semibold text-[#f0b429]">
            Community
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/40"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  );
}

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 border-l-4 border-[#f0b429] pl-3">
      <span className="text-[#f0b429]">{icon}</span>
      <h2 className="text-lg font-black uppercase tracking-wide">{label}</h2>
    </div>
  );
}

function MatchReportCard({ report }: { report: MatchReport }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-white/20">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">
          {report.area_label ?? "Zimbabwe"}
        </p>
        <p className="text-xs text-white/40">{formatDate(report.match_date)}</p>
      </div>

      <h3 className="mb-1 text-sm font-black leading-snug text-white sm:text-base">
        {report.ai_headline}
      </h3>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <span className="font-semibold text-white/90">{report.home_team}</span>
        <span className="rounded bg-[#f0b429]/20 px-2 py-0.5 text-xs font-black text-[#f0b429]">
          {report.score}
        </span>
        <span className="font-semibold text-white/90">{report.away_team}</span>
      </div>

      {report.player_of_match && (
        <p className="mt-2 text-xs text-white/50">
          ⭐ POTM: <span className="text-white/70">{report.player_of_match}</span>
        </p>
      )}
    </div>
  );
}

function SpotlightCard({ spotlight }: { spotlight: Spotlight }) {
  const trigger = TRIGGER_LABELS[spotlight.trigger_reason] ?? spotlight.trigger_reason.replace(/_/g, " ");
  const excerpt = spotlight.ai_story.slice(0, 160) + (spotlight.ai_story.length > 160 ? "…" : "");

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0b429]/20 text-sm font-black text-[#f0b429]">
          {spotlight.player?.initials ?? "??"}
        </div>
        <div>
          <p className="text-xs font-bold text-white/80">
            {spotlight.player?.position ?? "Player"}
          </p>
          {spotlight.player?.area && (
            <p className="flex items-center gap-1 text-xs text-white/40">
              <MapPin className="h-3 w-3" /> {spotlight.player.area}
            </p>
          )}
        </div>
      </div>

      <span className="mb-2 inline-block w-fit rounded-full bg-[#1a5c2a] px-2.5 py-0.5 text-xs font-bold text-[#f0b429]">
        {trigger}
      </span>

      <p className="text-sm leading-relaxed text-white/70">{excerpt}</p>

      <p className="mt-3 text-xs text-white/30">{formatDate(spotlight.published_at)}</p>
    </div>
  );
}

function MomentCard({ moment }: { moment: Moment }) {
  if (!moment.ai_caption) return null;
  return (
    <div className="mb-4 break-inside-avoid rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      {moment.is_featured && (
        <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-[#f0b429]">
          Featured
        </p>
      )}
      <p className="text-sm leading-relaxed text-white/80">{moment.ai_caption}</p>
      <div className="mt-3 flex items-center justify-between">
        {moment.area_label && (
          <p className="flex items-center gap-1 text-xs text-white/40">
            <MapPin className="h-3 w-3" /> {moment.area_label}
          </p>
        )}
        {moment.likes_count > 0 && (
          <p className="flex items-center gap-1 text-xs text-white/40">
            <Heart className="h-3 w-3 fill-current" /> {moment.likes_count}
          </p>
        )}
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: MatchAlert }) {
  const dt = new Date(alert.match_datetime);
  const day = dt.toLocaleDateString("en-ZW", { weekday: "short", month: "short", day: "numeric" });
  const time = dt.toLocaleTimeString("en-ZW", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="shrink-0 text-center">
        <p className="text-xs font-bold text-[#f0b429]">{day.split(" ")[0]}</p>
        <p className="text-xs text-white/50">{time}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">
          {alert.home_team} <span className="text-white/40">vs</span> {alert.away_team}
        </p>
        <p className="flex items-center gap-1 text-xs text-white/50">
          <MapPin className="h-3 w-3" /> {alert.location}
          {alert.area_label && ` · ${alert.area_label}`}
        </p>
      </div>
      <Calendar className="h-4 w-4 shrink-0 text-white/30" />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-white/15 py-10 text-center text-sm text-white/40">
      {text}
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
