"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { PublicNavbar } from "@/components/layout/public-navbar";

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

const SPORTS = [
  "All", "Football", "Rugby", "Athletics", "Netball",
  "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "🏐",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

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

function CaseCard({ c }: { c: SponsorshipCase }) {
  const sportEmoji = SPORT_EMOJI[c.sport?.toLowerCase()] ?? "🏅";
  const excerpt = c.story_short ?? c.title;

  return (
    <Link href={`/sponsorships/${c.id}`} className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[#1a5c2a] hover:shadow-md transition-all">
      {/* Cover image */}
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
        {/* Sport badge */}
        <span className="absolute top-3 left-3 bg-white/90 text-[#1a5c2a] text-xs font-semibold px-2 py-0.5 rounded-full capitalize">
          {sportEmoji} {c.sport}
        </span>
        {/* Vouched badge */}
        {c.vouched && (
          <span className="absolute top-3 right-3 bg-[#f0b429] text-[#1a3a1a] text-xs font-bold px-2 py-0.5 rounded-full">
            ✓ Vouched
          </span>
        )}
      </div>

      {/* Content */}
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

        {/* Sponsor interest count */}
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

export default function SponsorshipsPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [cases, setCases] = useState<SponsorshipCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sport, setSport] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [sport, search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page) });
    if (sport !== "All") params.set("sport", sport.toLowerCase());
    if (search.trim()) params.set("search", search.trim());

    const base = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`${base}/sponsorships?${params.toString()}`, { headers, signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiResponse>;
      })
      .then((json) => {
        setCases(json.data ?? []);
        setLastPage(json.meta?.last_page ?? 1);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError("Could not load sponsorships. Please try again.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sport, search, page, token]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-[#1a5c2a] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Athlete Sponsorships
          </h1>
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
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          {/* Sport chips */}
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

      {/* Grid */}
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

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-1.5 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {lastPage}
                </span>
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

      {/* CTA for athletes */}
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
    </div>
  );
}
