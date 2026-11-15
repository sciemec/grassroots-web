"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

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

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "🏐",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pending:  { label: "Pending",  bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-200" },
  accepted: { label: "Accepted", bg: "bg-green-50",  text: "text-green-700", border: "border-green-200" },
  declined: { label: "Declined", bg: "bg-red-50",    text: "text-red-600",   border: "border-red-200" },
  expired:  { label: "Expired",  bg: "bg-slate-50",  text: "text-slate-500", border: "border-slate-200" },
  withdrawn:{ label: "Withdrawn",bg: "bg-gray-50",   text: "text-gray-500",  border: "border-gray-200" },
};

const TABS = ["all", "pending", "accepted", "declined", "expired", "withdrawn"] as const;
type Tab = typeof TABS[number];

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

export default function MyIntroductionsPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  const [intros, setIntros]     = useState<MyIntro[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<Tab>("all");
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user || !token) { router.replace("/login"); return; }

    fetch(`${base}/sponsor/introductions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (Array.isArray(json?.data)) setIntros(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hasHydrated, user, token, base, router]);

  const withdraw = async (intro: MyIntro) => {
    if (!confirm(`Withdraw your request for "${intro.case?.title ?? "this case"}"?`)) return;
    setWithdrawing(intro.id);
    try {
      const res = await fetch(`${base}/sponsor/introductions/${intro.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIntros((prev) =>
          prev.map((i) => (i.id === intro.id ? { ...i, status: "withdrawn" } : i))
        );
      }
    } catch {
      // silent
    } finally {
      setWithdrawing(null);
    }
  };

  const visible = tab === "all" ? intros : intros.filter((i) => i.status === tab);

  const countFor = (t: Tab) =>
    t === "all" ? intros.length : intros.filter((i) => i.status === t).length;

  if (!hasHydrated) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Introductions</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track every sponsorship connection request you have submitted.
            </p>
          </div>
          <Link
            href="/sponsorships"
            className="text-xs font-semibold text-[#1a5c2a] hover:underline"
          >
            Browse cases
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
          {TABS.map((t) => {
            const count = countFor(t);
            if (t !== "all" && count === 0) return null;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  tab === t
                    ? "bg-[#1a5c2a] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#1a5c2a]/40"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {count > 0 && (
                  <span className={`ml-1.5 ${tab === t ? "text-white/70" : "text-gray-400"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => <IntroSkeleton key={n} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-12 text-center">
            <div className="text-4xl mb-3">🤝</div>
            <h2 className="font-semibold text-gray-900 mb-1">
              {tab === "all" ? "No introduction requests yet" : `No ${tab} requests`}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {tab === "all"
                ? "Browse live cases and tap \"Ask to Connect\" to reach out to an athlete."
                : `You have no ${tab} introduction requests at the moment.`}
            </p>
            {tab === "all" && (
              <Link
                href="/sponsorships"
                className="inline-block bg-[#1a5c2a] text-white text-sm font-semibold px-5 py-2.5 rounded-full"
              >
                Browse Cases
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((intro) => {
              const c = intro.case;
              const sportEmoji = SPORT_EMOJI[c?.sport?.toLowerCase() ?? ""] ?? "🏅";
              const cfg = STATUS_CONFIG[intro.status] ?? STATUS_CONFIG.pending;
              const submittedDate = new Date(intro.created_at).toLocaleDateString("en-US", {
                day: "numeric", month: "short", year: "numeric",
              });

              return (
                <div
                  key={intro.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >
                  {/* Top row */}
                  <Link
                    href={`/sponsorships/${intro.case_id}`}
                    className="flex gap-4 p-4 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Cover thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#1a5c2a] to-[#2e7d45] flex items-center justify-center">
                      {c?.cover_image_url ? (
                        <img
                          src={c.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl opacity-60">{sportEmoji}</span>
                      )}
                    </div>

                    {/* Case info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                        {c?.status && c.status !== "live" && (
                          <span className="text-xs text-gray-400 capitalize">
                            Case {c.status}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#1a5c2a] transition-colors">
                        {c?.title ?? "Untitled case"}
                      </div>
                      <div className="flex flex-wrap gap-x-3 mt-0.5 text-xs text-gray-400">
                        <span className="capitalize">{sportEmoji} {c?.sport}</span>
                        {c?.category && (
                          <span className="capitalize">{c.category.replace(/_/g, " ")}</span>
                        )}
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

                    <span className="text-gray-300 group-hover:text-[#1a5c2a] transition-colors self-center text-sm flex-shrink-0">
                      →
                    </span>
                  </Link>

                  {/* Status detail strip */}
                  {(intro.status === "accepted" || intro.status === "declined" || intro.status === "expired") && (
                    <div className={`px-4 py-2 border-t text-xs flex items-center justify-between gap-3 ${cfg.bg} ${cfg.border} border-t`}>
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
                      <span className="text-xs text-blue-600">
                        Awaiting response from the athlete.
                      </span>
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
      </div>
    </div>
  );
}
