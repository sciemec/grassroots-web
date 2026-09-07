"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, Search, Filter, User, ChevronDown } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlayerCard {
  user_id: string;
  name: string | null;
  initials: string;
  photo_url: string | null;
  position: string | null;
  sport: string | null;
  province: string | null;
  age_group: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GRS_GREEN = "#1a5c2a";
const GOLD      = "#c8962a";
const BG        = "#f4f2ee";

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const SPORTS = [
  "Football", "Rugby", "Athletics", "Netball", "Basketball",
  "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey",
];

const SPORT_EMOJI: Record<string, string> = {
  football: "⚽", rugby: "🏉", athletics: "🏃", netball: "⛹️",
  basketball: "🏀", cricket: "🏏", swimming: "🏊", tennis: "🎾",
  volleyball: "🏐", hockey: "🏑",
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-14 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

// ── Player Card ───────────────────────────────────────────────────────────────

function PlayerTile({ player }: { player: PlayerCard }) {
  const sportKey  = player.sport?.toLowerCase() ?? "";
  const sportLabel = player.sport
    ? player.sport.charAt(0).toUpperCase() + player.sport.slice(1)
    : null;
  const emoji = SPORT_EMOJI[sportKey] ?? "🏅";

  return (
    <Link
      href={`/player/public/${player.user_id}`}
      className="group bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden"
          style={{ background: GRS_GREEN }}
        >
          {player.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photo_url}
              alt={player.initials}
              className="w-12 h-12 object-cover object-top"
            />
          ) : (
            player.initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{player.name ?? player.initials}</p>
          <p className="text-xs text-gray-500 truncate">
            {[player.position, sportLabel].filter(Boolean).join(" · ")}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
      </div>

      <div className="flex flex-wrap gap-1">
        {sportLabel && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 font-medium" style={{ color: GRS_GREEN }}>
            {emoji} {sportLabel}
          </span>
        )}
        {player.province && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />{player.province}
          </span>
        )}
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlayersPage() {
  const [players, setPlayers]         = useState<PlayerCard[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(false);
  const [page, setPage]               = useState(1);
  const [lastPage, setLastPage]       = useState(1);
  const [total, setTotal]             = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [sport, setSport]       = useState("");
  const [province, setProvince] = useState("");
  const [position, setPosition] = useState("");

  const fetchPlayers = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(pageNum) });
      if (sport)    params.set("sport",    sport);
      if (province) params.set("province", province);
      if (position) params.set("position", position);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/players/browse?${params}`
      );
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setPlayers(Array.isArray(json.data) ? json.data : []);
      setLastPage(json.last_page ?? 1);
      setTotal(json.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sport, province, position]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    fetchPlayers(1);
  }, [sport, province, position]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (page === 1) return;
    fetchPlayers(page);
  }, [page, fetchPlayers]);

  const activeFilters = [sport, province, position].filter(Boolean).length;

  const clearFilters = () => {
    setSport("");
    setProvince("");
    setPosition("");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <PublicNavbar />

      <div className="max-w-5xl mx-auto px-4 pt-20 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 mt-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Discover Athletes</h1>
            <p className="text-sm text-gray-500">
              {loading ? "Loading…" : `${total.toLocaleString()} registered athletes across Zimbabwe`}
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors"
            style={{
              borderColor: activeFilters ? GOLD : "#d1d5db",
              color:       activeFilters ? GOLD : "#6b7280",
              background:  activeFilters ? "#fffbeb" : "white",
            }}
          >
            <Filter size={15} />
            Filters
            {activeFilters > 0 && (
              <span
                className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center"
                style={{ background: GOLD }}
              >
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-4">

            {/* Sport pills */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sport</p>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => {
                  const active = sport.toLowerCase() === s.toLowerCase();
                  return (
                    <button
                      key={s}
                      onClick={() => setSport(active ? "" : s)}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                      style={{
                        background:  active ? GRS_GREEN : "white",
                        color:       active ? "white" : "#374151",
                        borderColor: active ? GRS_GREEN : "#d1d5db",
                      }}
                    >
                      {SPORT_EMOJI[s.toLowerCase()] ?? ""} {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Province + position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Province</p>
                <div className="relative">
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white appearance-none pr-8"
                  >
                    <option value="">All provinces</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Position</p>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Striker, Goalkeeper…"
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-500 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-3">Could not load athletes right now.</p>
            <button
              onClick={() => fetchPlayers(page)}
              className="rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ background: GRS_GREEN }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && players.length === 0 && (
          <div className="text-center py-16">
            <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">No athletes found</p>
            <p className="text-gray-400 text-xs mt-1">
              {activeFilters > 0 ? "Try adjusting your filters." : "No players have registered yet."}
            </p>
          </div>
        )}

        {!loading && !error && players.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-400">{page} / {lastPage}</span>
            <button
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div className="mt-12 text-center space-y-3">
            <p className="text-xs text-gray-400">
              All athletes registered on GrassRoots Sports · Zimbabwe&apos;s #1 talent discovery platform
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-colors"
              style={{ background: GRS_GREEN }}
            >
              Join as an Athlete — Free
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
