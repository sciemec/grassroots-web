"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ─── Case browse types ────────────────────────────────────────────────────────

interface SponsorshipCase {
  id: string;
  title: string;
  sport: string;
  category: string;
  story_short: string | null;
  cover_image_url: string | null;
  status: string;
  owner_name: string;
  province: string | null;
  age_group: string | null;
  vouched: boolean;
  introduction_count: number;
  created_at: string;
}

interface ApiResponse {
  data: SponsorshipCase[];
  meta?: { current_page: number; last_page: number };
}

// ─── My introductions types ───────────────────────────────────────────────────

interface IntroCase {
  id: string;
  title: string;
  category: string;
  sport: string;
  cover_image_url: string | null;
  status: string;
}

interface MyIntro {
  id: string;
  case_id: string;
  status: "pending" | "accepted" | "declined" | "withdrawn" | "expired";
  offer_cents: number | null;
  message: string | null;
  response_note: string | null;
  responded_at: string | null;
  created_at: string;
  case: IntroCase | null;
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const SPORTS = [
  "All", "Football", "Rugby", "Athletics", "Netball",
  "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "🏐",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

const INTRO_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:  { label: "Pending",   bg: "bg-blue-50",  text: "text-blue-700",  border: "border-blue-200" },
  accepted: { label: "Accepted",  bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  declined: { label: "Declined",  bg: "bg-red-50",   text: "text-red-600",   border: "border-red-200" },
  expired:  { label: "Expired",   bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
  withdrawn:{ label: "Withdrawn", bg: "bg-gray-50",  text: "text-gray-500",  border: "border-gray-200" },
};

const INTRO_STATUS_TABS = ["all", "pending", "accepted", "declined", "expired", "withdrawn"] as const;
type IntroStatusTab = typeof INTRO_STATUS_TABS[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CaseSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-9 bg-gray-200 rounded-lg mt-2" />
      </div>
    </div>
  );
}

function IntroSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse flex gap-4">
      <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function CaseCard({ c }: { c: SponsorshipCase }) {
  const sportEmoji = SPORT_EMOJI[c.sport?.toLowerCase()] ?? "🏅";
  const excerpt = c.story_short ?? c.title;

  return (
    <Link href={`/sponsorships/${c.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#1a5c2a] hover:shadow-md transition-all">
      <div className="relative h-44 bg-gradient-to-br from-[#1a5c2a] to-[#2e7d45] overflow-hidden">
        {c.cover_image_url ? (
          <img
            src={c.cover_image_url}
            alt={c.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl opacity-60">
            {sportEmoji}
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/90 text-[#1a5c2a] text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
          {sportEmoji} {c.sport}
        </span>
        {c.vouched && (
          <span className="absolute top-3 right-3 bg-[#f0b429] text-[#1a3a1a] text-xs font-bold px-2 py-0.5 rounded-full">
            ✓ Vouched
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
          <span className="capitalize">{c.category?.replace(/_/g, " ")}</span>
          {c.province && <><span>·</span><span>{c.province}</span></>}
          {c.age_group && <><span>·</span><span className="capitalize">{c.age_group.replace(/_/g, " ")}</span></>}
        </div>

        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#1a5c2a] transition-colors">
          {c.title}
        </h3>

        {excerpt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{excerpt}</p>
        )}

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">
            {c.introduction_count > 0
              ? `${c.introduction_count} sponsor${c.introduction_count === 1 ? "" : "s"} interested`
              : "Be the first sponsor"}
          </span>
          <span className="text-xs text-gray-400">{c.owner_name}</span>
        </div>

        <div className="w-full text-center bg-[#1a5c2a] hover:bg-[#145222] text-white text-xs font-semibold py-2 rounded-lg transition-colors">
          Ask to Connect
        </div>
      </div>
    </Link>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SponsorshipsPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // View toggle
  const [view, setView] = useState<"browse" | "my_intros">("browse");

  // Browse state
  const [cases, setCases]       = useState<SponsorshipCase[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [sport, setSport]       = useState("All");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // My introductions state
  const [myIntros, setMyIntros]           = useState<MyIntro[]>([]);
  const [myIntrosLoading, setMyIntrosLoading] = useState(false);
  const [myIntrosLoaded, setMyIntrosLoaded]   = useState(false);
  const [introTab, setIntroTab]           = useState<IntroStatusTab>("all");
  const [withdrawing, setWithdrawing]     = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  // Reset page when browse filters change
  useEffect(() => { setPage(1); }, [sport, search]);

  // Fetch browse cases
  useEffect(() => {
    if (view !== "browse") return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page) });
    if (sport !== "All") params.set("sport", sport.toLowerCase());
    if (search.trim()) params.set("search", search.trim());

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${base}/sponsorships?${params.toString()}`, { headers, signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<ApiResponse>; })
      .then((json) => { setCases(json.data ?? []); setLastPage(json.meta?.last_page ?? 1); })
      .catch((err) => { if (err.name !== "AbortError") setError("Could not load sponsorships. Please try again."); })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sport, search, page, token, view, base]);

  // Fetch my introductions (once, lazily on first switch to that view)
  useEffect(() => {
    if (view !== "my_intros" || !token || myIntrosLoaded) return;
    setMyIntrosLoading(true);
    setMyIntrosLoaded(true);
    fetch(`${base}/sponsor/introductions`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (Array.isArray(json?.data)) setMyIntros(json.data); })
      .catch(() => {})
      .finally(() => setMyIntrosLoading(false));
  }, [view, token, myIntrosLoaded, base]);

  const withdraw = async (intro: MyIntro) => {
    if (!confirm(`Withdraw your request for "${intro.case?.title ?? "this case"}"?`)) return;
    setWithdrawing(intro.id);
    try {
      const res = await fetch(`${base}/sponsor/introductions/${intro.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyIntros((prev) => prev.map((i) => (i.id === intro.id ? { ...i, status: "withdrawn" } : i)));
      }
    } catch { /* silent */ } finally { setWithdrawing(null); }
  };

  const visibleIntros = introTab === "all"
    ? myIntros
    : myIntros.filter((i) => i.status === introTab);

  const introCountFor = (t: IntroStatusTab) =>
    t === "all" ? myIntros.length : myIntros.filter((i) => i.status === t).length;

  const pendingCount = myIntros.filter((i) => i.status === "pending").length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-[#1a5c2a] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Athlete Sponsorships</h1>
          <p className="text-white/80 max-w-xl mx-auto text-sm md:text-base">
            Connect with talented Zimbabwean athletes. GRS verifies every case and
            facilitates the introduction — you bring the support.
          </p>
          {user && (
            <Link
              href="/sponsorships/new"
              className="inline-block mt-5 bg-[#f0b429] text-[#1a3a1a] font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#e0a420] transition-colors"
            >
              + Submit a Case
            </Link>
          )}
        </div>

        {/* View tabs — only shown when logged in */}
        {hasHydrated && user && (
          <div className="max-w-5xl mx-auto mt-6 flex justify-center gap-2">
            <button
              onClick={() => setView("browse")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                view === "browse"
                  ? "bg-white text-[#1a5c2a]"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Browse Cases
            </button>
            <button
              onClick={() => setView("my_intros")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                view === "my_intros"
                  ? "bg-white text-[#1a5c2a]"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              My Introductions
              {pendingCount > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  view === "my_intros" ? "bg-[#1a5c2a] text-white" : "bg-[#f0b429] text-[#1a3a1a]"
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        )}
      </section>

      {/* ── Browse Cases view ─────────────────────────────────────────────── */}
      {view === "browse" && (
        <>
          {/* Sticky filters */}
          <section className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <input
                type="text"
                placeholder="Search cases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              />
              <div className="flex gap-1.5 flex-wrap">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSport(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      sport === s
                        ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[#1a5c2a] hover:text-[#1a5c2a]"
                    }`}
                  >
                    {s !== "All" ? `${SPORT_EMOJI[s.toLowerCase()] ?? ""} ` : ""}{s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Case grid */}
          <main className="max-w-5xl mx-auto px-4 py-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => <CaseSkeleton key={i} />)}
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-20 text-gray-500">
                <div className="text-5xl mb-4">🏅</div>
                <p className="font-medium text-gray-700">No cases found</p>
                <p className="text-sm mt-1">Try a different sport or search term</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cases.map((c) => <CaseCard key={c.id} c={c} />)}
                </div>
                {lastPage > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-10">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">Page {page} of {lastPage}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                      disabled={page === lastPage}
                      className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* How it works */}
          <section className="bg-white border-t border-gray-200 py-12 px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-center text-gray-900 mb-8">How GRS Sponsorship Works</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                  { step: "1", icon: "🔍", title: "Browse Cases", desc: "Find an athlete whose story and sport match your sponsorship goals." },
                  { step: "2", icon: "🤝", title: "Ask to Connect", desc: "Submit an introduction request. GRS verifies your interest and notifies the athlete." },
                  { step: "3", icon: "✉️", title: "GRS Facilitates", desc: "Once the athlete accepts, GRS makes the formal introduction so you can discuss terms directly." },
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a5c2a] text-white flex items-center justify-center font-bold text-sm">
                      {item.step}
                    </div>
                    <div className="text-3xl">{item.icon}</div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA for guests */}
          {!user && (
            <section className="bg-[#1a5c2a] text-white py-10 px-4 text-center">
              <h2 className="text-xl font-bold mb-2">Are you an athlete looking for a sponsor?</h2>
              <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
                Create your GRS profile, get vouched by a coach, and submit your case to connect with sponsors.
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                <Link href="/register" className="bg-[#f0b429] text-[#1a3a1a] font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-[#e0a420] transition-colors">
                  Create Account
                </Link>
                <Link href="/login" className="border border-white/40 text-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors">
                  Sign In
                </Link>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── My Introductions view ─────────────────────────────────────────── */}
      {view === "my_intros" && (
        <main className="max-w-2xl mx-auto px-4 py-8">

          {/* Status filter tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5">
            {INTRO_STATUS_TABS.map((t) => {
              const count = introCountFor(t);
              if (t !== "all" && count === 0) return null;
              return (
                <button
                  key={t}
                  onClick={() => setIntroTab(t)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    introTab === t
                      ? "bg-[#1a5c2a] text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-[#1a5c2a]/40"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {count > 0 && (
                    <span className={`ml-1.5 ${introTab === t ? "text-white/70" : "text-gray-400"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          {myIntrosLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => <IntroSkeleton key={n} />)}
            </div>
          ) : visibleIntros.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
              <div className="text-4xl mb-3">🤝</div>
              <h2 className="font-semibold text-gray-900 mb-1">
                {introTab === "all" ? "No introduction requests yet" : `No ${introTab} requests`}
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                {introTab === "all"
                  ? "Browse live cases and tap \"Ask to Connect\" to reach out to an athlete."
                  : `You have no ${introTab} introduction requests at the moment.`}
              </p>
              {introTab === "all" && (
                <button
                  onClick={() => setView("browse")}
                  className="inline-block bg-[#1a5c2a] text-white text-sm font-semibold px-5 py-2.5 rounded-full"
                >
                  Browse Cases
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleIntros.map((intro) => {
                const c = intro.case;
                const sportEmoji = SPORT_EMOJI[c?.sport?.toLowerCase() ?? ""] ?? "🏅";
                const cfg = INTRO_STATUS_CONFIG[intro.status] ?? INTRO_STATUS_CONFIG.pending;
                const submittedDate = new Date(intro.created_at).toLocaleDateString("en-US", {
                  day: "numeric", month: "short", year: "numeric",
                });

                return (
                  <div key={intro.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <Link
                      href={`/sponsorships/${intro.case_id}`}
                      className="flex gap-4 p-4 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#1a5c2a] to-[#2e7d45] flex items-center justify-center">
                        {c?.cover_image_url ? (
                          <img src={c.cover_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl opacity-60">{sportEmoji}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          {c?.status && c.status !== "live" && (
                            <span className="text-xs text-gray-400 capitalize">Case {c.status}</span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#1a5c2a] transition-colors">
                          {c?.title ?? "Untitled case"}
                        </div>
                        <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-400">
                          <span className="capitalize">{sportEmoji} {c?.sport}</span>
                          {c?.category && <span className="capitalize">{c.category.replace(/_/g, " ")}</span>}
                          <span>Submitted {submittedDate}</span>
                        </div>
                        {intro.offer_cents != null && (
                          <div className="text-xs text-[#1a5c2a] font-medium mt-1">
                            Offer: USD {(intro.offer_cents / 100).toLocaleString("en-US", {
                              minimumFractionDigits: 2, maximumFractionDigits: 2,
                            })}
                          </div>
                        )}
                      </div>

                      <span className="text-gray-300 group-hover:text-[#1a5c2a] transition-colors self-center text-sm flex-shrink-0">→</span>
                    </Link>

                    {/* Status detail strip */}
                    {(intro.status === "accepted" || intro.status === "declined" || intro.status === "expired") && (
                      <div className={`px-4 py-2 border-t text-xs flex items-center justify-between gap-3 ${cfg.bg} border-t ${cfg.border}`}>
                        <span className={cfg.text}>
                          {intro.status === "accepted" && "GRS will be in touch to facilitate the introduction."}
                          {intro.status === "declined" && (intro.response_note
                            ? `Declined: ${intro.response_note}`
                            : "The athlete has declined at this time.")}
                          {intro.status === "expired" && "The athlete did not respond within 7 days. You can re-apply if the case is still live."}
                        </span>
                        {intro.status === "accepted" && (
                          <Link
                            href={`/sponsorships/${intro.case_id}/introductions/${intro.id}/agreement`}
                            className="text-xs font-semibold text-[#1a5c2a] hover:underline flex-shrink-0"
                          >
                            View Agreement →
                          </Link>
                        )}
                        {intro.status === "expired" && c?.status === "live" && (
                          <Link
                            href={`/sponsorships/${intro.case_id}`}
                            className="text-xs font-semibold text-[#1a5c2a] hover:underline flex-shrink-0"
                          >
                            Re-apply →
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Withdraw strip — pending only */}
                    {intro.status === "pending" && (
                      <div className="px-4 py-2 border-t border-blue-100 bg-blue-50 flex items-center justify-between gap-3">
                        <span className="text-xs text-blue-600">Awaiting response from the athlete.</span>
                        <button
                          onClick={() => withdraw(intro)}
                          disabled={withdrawing === intro.id}
                          className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50 flex-shrink-0"
                        >
                          {withdrawing === intro.id ? "Withdrawing…" : "Withdraw"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
