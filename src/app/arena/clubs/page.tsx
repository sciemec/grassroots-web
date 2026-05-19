"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, MapPin, Trophy, ChevronRight,
  Star, Search, Filter, X, UserCheck, Zap,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArenaClub {
  id: number;
  name: string;
  sport: string;
  province: string;
  district: string | null;
  tier: string | null;
  formation: string | null;
  playing_style: string | null;
  is_scouting: boolean;
  is_open_trials: boolean;
  avg_thuto_score: number | null;
  follower_count: number;
  reviews_count: number;
  coach: { id: number; name: string } | null;
}

// ─── ArenaNav (shared across Arena pages) ────────────────────────────────────

function ArenaNav() {
  const user  = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/arena" className="text-lg font-bold" style={{ color: "#1a5c2a" }}>
          The Arena
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/arena" className="text-gray-600 hover:text-gray-900">Feed</Link>
          <Link href="/arena/network" className="text-gray-600 hover:text-gray-900">Network</Link>
          <Link href="/arena/clubs" className="font-semibold" style={{ color: "#1a5c2a" }}>Clubs</Link>
          <Link href="/arena/recruitment" className="text-gray-600 hover:text-gray-900">Talent Board</Link>
          <Link href="/arena/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            {initials}
          </div>
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40 hidden group-hover:block z-50">
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── ClubCard ─────────────────────────────────────────────────────────────────

function ClubCard({ club }: { club: ArenaClub }) {
  const score = club.avg_thuto_score;
  const scoreColor = score
    ? score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626"
    : "#9ca3af";

  return (
    <Link href={`/arena/clubs/${club.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base truncate">{club.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{club.sport}</p>
          </div>
          {score !== null && (
            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold" style={{ color: scoreColor }}>
                {score.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">THUTO</div>
            </div>
          )}
        </div>

        {/* Location + Tier */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <MapPin size={13} />
          <span>{club.province}{club.district ? ` · ${club.district}` : ""}</span>
          {club.tier && (
            <>
              <span className="text-gray-300 mx-1">|</span>
              <Trophy size={13} />
              <span>{club.tier}</span>
            </>
          )}
        </div>

        {/* Formation + Style */}
        {(club.formation || club.playing_style) && (
          <div className="flex flex-wrap gap-1.5">
            {club.formation && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                {club.formation}
              </span>
            )}
            {club.playing_style && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {club.playing_style}
              </span>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          {club.is_scouting && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
              Scouting
            </span>
          )}
          {club.is_open_trials && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
              Open Trials
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100 mt-auto">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {club.follower_count} followers
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} />
            {club.reviews_count} reviews
          </span>
          <ChevronRight size={14} className="text-gray-300" />
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ClubSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse flex flex-col gap-3">
      <div className="flex justify-between">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/5" />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
        </div>
        <div className="h-8 w-10 bg-gray-100 rounded" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-4/5" />
      <div className="flex gap-1.5">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SPORTS   = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Athletics", "Swimming", "Tennis"];
const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East",
  "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];
const TIERS    = ["PSL", "Division One", "Division Two", "School", "Amateur"];
const STYLES   = ["Attacking", "Defensive", "Possession", "Counter-attack", "High-press"];
const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2"];

export default function ArenaClubsPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [clubs, setClubs]         = useState<ArenaClub[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch]       = useState("");

  const [filters, setFilters] = useState({
    sport: "", province: "", tier: "", formation: "", playing_style: "",
    open_trials: false, scouting: false,
  });

  const API = process.env.NEXT_PUBLIC_API_URL;

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.sport)        params.set("sport", filters.sport);
      if (filters.province)     params.set("province", filters.province);
      if (filters.tier)         params.set("tier", filters.tier);
      if (filters.formation)    params.set("formation", filters.formation);
      if (filters.playing_style) params.set("playing_style", filters.playing_style);
      if (filters.open_trials)  params.set("open_trials", "1");
      if (filters.scouting)     params.set("scouting", "1");

      const res = await fetch(`${API}/arena/clubs?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json();
      setClubs(safeArray(json));
    } catch {
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClubs(); }, [filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const displayed = search.trim()
    ? clubs.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.province.toLowerCase().includes(search.toLowerCase())
      )
    : clubs;

  const setFilter = (key: string, val: string | boolean) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Page header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Club Directory</h1>
          <p className="text-gray-500 text-sm mt-1">
            Discover clubs across Zimbabwe — find where you belong or where to scout next.
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clubs by name or province..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: "#c8962a" }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={() => router.push("/arena/clubs/new")}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            + Register Club
          </button>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Sport</label>
              <select value={filters.sport} onChange={(e) => setFilter("sport", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All sports</option>
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Province</label>
              <select value={filters.province} onChange={(e) => setFilter("province", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All provinces</option>
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Tier</label>
              <select value={filters.tier} onChange={(e) => setFilter("tier", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">All tiers</option>
                {TIERS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Formation</label>
              <select value={filters.formation} onChange={(e) => setFilter("formation", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Any formation</option>
                {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Style</label>
              <select value={filters.playing_style} onChange={(e) => setFilter("playing_style", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Any style</option>
                {STYLES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.open_trials}
                  onChange={(e) => setFilter("open_trials", e.target.checked)}
                  className="rounded" />
                Open Trials only
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={filters.scouting}
                  onChange={(e) => setFilter("scouting", e.target.checked)}
                  className="rounded" />
                Actively Scouting
              </label>
            </div>
            <div className="col-span-full flex justify-end">
              <button
                onClick={() => setFilters({ sport: "", province: "", tier: "", formation: "", playing_style: "", open_trials: false, scouting: false })}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
              >
                <X size={14} /> Clear all
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-gray-400 mb-3">{displayed.length} club{displayed.length !== 1 ? "s" : ""} found</p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ClubSkeleton key={i} />)
            : displayed.length === 0
              ? (
                <div className="col-span-full text-center py-16 text-gray-400">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No clubs found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or be the first to register your club</p>
                  <button
                    onClick={() => router.push("/arena/clubs/new")}
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: "#c8962a" }}
                  >
                    Register Club
                  </button>
                </div>
              )
              : displayed.map((club) => <ClubCard key={club.id} club={club} />)
          }
        </div>
      </div>
    </div>
  );
}
