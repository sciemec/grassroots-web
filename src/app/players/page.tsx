"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, Filter, MapPin, ChevronRight, User } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerCard {
  user_id: string;
  initials: string;
  photo_url: string | null;
  position: string | null;
  sport: string | null;
  province: string | null;
  age_group: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const SPORTS = [
  "football", "rugby", "athletics", "netball", "basketball",
  "cricket", "swimming", "tennis", "volleyball", "hockey",
];

const AGE_GROUPS: Record<string, string> = {
  u12:    "Under 12",
  u14:    "Under 14",
  u16:    "Under 16",
  u18:    "Under 18",
  u20:    "Under 20",
  u23:    "Under 23",
  senior: "Senior (24+)",
};

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "🏐",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#f0b429]/10 bg-white/5 p-4 flex flex-col items-center gap-3">
      <div className="h-16 w-16 rounded-full bg-white/10" />
      <div className="h-3 w-20 rounded bg-white/10" />
      <div className="h-2 w-14 rounded bg-white/10" />
    </div>
  );
}

// ── Player Card ───────────────────────────────────────────────────────────────

function PlayerTile({ player }: { player: PlayerCard }) {
  return (
    <Link
      href={`/player/public/${player.user_id}`}
      className="group rounded-2xl border border-[#f0b429]/10 bg-white/5 p-4 flex flex-col items-center gap-2.5 hover:bg-white/10 hover:border-[#f0b429]/30 transition-all"
    >
      {/* Avatar */}
      <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-[#f0b429]/30 bg-white/10 flex items-center justify-center flex-shrink-0">
        {player.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photo_url}
            alt={player.initials}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <span className="text-lg font-black text-white/60">{player.initials}</span>
        )}
      </div>

      {/* Name / initials */}
      <span className="text-sm font-bold text-white text-center leading-snug">
        {player.initials}
      </span>

      {/* Sport + position */}
      {(player.sport || player.position) && (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {player.sport && (
            <span className="text-[10px] font-semibold text-[#f0b429] bg-[#f0b429]/10 px-2 py-0.5 rounded-full capitalize">
              {SPORT_EMOJI[player.sport] ?? ""} {player.sport}
            </span>
          )}
          {player.position && (
            <span className="text-[10px] font-semibold text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
              {player.position}
            </span>
          )}
        </div>
      )}

      {/* Province */}
      {player.province && (
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <MapPin className="h-3 w-3" />
          {player.province}
        </div>
      )}

      {/* Age group */}
      {player.age_group && AGE_GROUPS[player.age_group] && (
        <span className="text-[10px] text-white/30">{AGE_GROUPS[player.age_group]}</span>
      )}

      {/* Hover CTA */}
      <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#f0b429]/60 group-hover:text-[#f0b429] transition-colors">
        View profile <ChevronRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlayersPage() {
  const [players, setPlayers]     = useState<PlayerCard[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [lastPage, setLastPage]   = useState(1);
  const [total, setTotal]         = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [province, setProvince]   = useState("");
  const [sport, setSport]         = useState("");
  const [ageGroup, setAgeGroup]   = useState("");

  const fetchPlayers = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (province) params.set("province", province);
      if (sport)    params.set("sport", sport);
      if (ageGroup) params.set("age_group", ageGroup);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/players/browse?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const json = await res.json();
      setPlayers(Array.isArray(json.data) ? json.data : []);
      setLastPage(json.last_page ?? 1);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [province, sport, ageGroup]);

  useEffect(() => {
    setPage(1);
  }, [province, sport, ageGroup]);

  useEffect(() => {
    fetchPlayers(page);
  }, [fetchPlayers, page]);

  const activeFilters = [province, sport, ageGroup].filter(Boolean).length;

  const clearFilters = () => {
    setProvince("");
    setSport("");
    setAgeGroup("");
  };

  return (
    <div className="min-h-screen bg-[#1a5c2a]">
      <PublicNavbar />

      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b429]/20 border border-[#f0b429]/30">
              <Users className="h-7 w-7 text-[#f0b429]" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]/70">
            GrassRoots Sports
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            Discover Talent
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {total > 0 ? `${total.toLocaleString()} registered athletes across Zimbabwe` : "All registered athletes across Zimbabwe"}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              showFilters
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-[#1a5c2a] px-1.5 py-0.5 text-[10px] font-bold text-[#f0b429]">
                {activeFilters}
              </span>
            )}
          </button>

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-white/40 hover:text-white/70 underline"
            >
              Clear all
            </button>
          )}

          <span className="ml-auto text-xs text-white/30">
            {!loading && `${players.length} shown · page ${page} of ${lastPage}`}
          </span>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 rounded-2xl border border-[#f0b429]/10 bg-white/5 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">Province</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-[#f0b429]/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f0b429]/50"
                >
                  <option value="">All provinces</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p} className="bg-[#1a3d26]">{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">Sport</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-[#f0b429]/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f0b429]/50"
                >
                  <option value="">All sports</option>
                  {SPORTS.map((s) => (
                    <option key={s} value={s} className="bg-[#1a3d26] capitalize">{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">Age Group</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full rounded-lg bg-white/10 border border-[#f0b429]/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f0b429]/50"
                >
                  <option value="">All ages</option>
                  {Object.entries(AGE_GROUPS).map(([val, label]) => (
                    <option key={val} value={val} className="bg-[#1a3d26]">{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-10 text-center">
            <p className="text-sm text-white/50 mb-4">Could not load players.</p>
            <button
              onClick={() => fetchPlayers(page)}
              className="rounded-xl bg-[#f0b429] px-5 py-2 text-sm font-bold text-[#1a3a1a]"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-12 text-center">
            <User className="h-10 w-10 text-white/20 mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-1">No players found</h3>
            <p className="text-sm text-white/40">
              {activeFilters > 0 ? "Try removing some filters." : "No players have registered yet."}
            </p>
          </div>
        )}

        {!loading && !error && players.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((p) => (
              <PlayerTile key={p.user_id} player={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && lastPage > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30 hover:bg-white/15 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-white/40">
              {page} / {lastPage}
            </span>
            <button
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-30 hover:bg-white/15 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center space-y-3">
          <p className="text-xs text-white/30">
            All athletes registered on GrassRoots Sports · Zimbabwe&apos;s #1 talent discovery platform
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
          >
            Join as an Athlete
          </Link>
          <p className="text-xs text-white/30">Free for all Zimbabwean athletes</p>
        </div>
      </div>
    </div>
  );
}
