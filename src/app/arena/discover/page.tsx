"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, X, Users, Zap, MapPin,
  ChevronRight, UserPlus, UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscoverPlayer {
  id: number;
  name: string;
  sport: string | null;
  province: string | null;
  position: string | null;
  thuto_score: number | null;
  role: string;
  peak_level_label?: string | null;
}

// ─── ArenaNav ─────────────────────────────────────────────────────────────────

function ArenaNav() {
  const user   = useAuthStore((s) => s.user);
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
          <Link href="/arena/discover" className="font-semibold" style={{ color: "#1a5c2a" }}>Discover</Link>
          <Link href="/arena/recruitment" className="text-gray-600 hover:text-gray-900">Talent Board</Link>
          <Link href="/arena/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
        </div>
      </div>
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
    </nav>
  );
}

// ─── PlayerCard ───────────────────────────────────────────────────────────────

function PlayerCard({ player, currentUserId }: { player: DiscoverPlayer; currentUserId?: number }) {
  const token = useAuthStore((s) => s.token);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  const initials = player.name
    ? player.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token || followLoading) return;
    const prev = following;
    setFollowing(!prev);
    setFollowLoading(true);
    try {
      const method = prev ? "DELETE" : "POST";
      const res = await fetch(`${API}/arena/follow/${player.id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) setFollowing(prev);
    } catch {
      setFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwn = currentUserId === player.id;

  const scoreColor = (score: number | null) => {
    if (!score) return "#9ca3af";
    if (score >= 75) return "#1a5c2a";
    if (score >= 55) return "#c8962a";
    return "#6b7280";
  };

  return (
    <Link href={`/arena/profile/${player.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 cursor-pointer group">
        {/* Avatar + Name */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{player.name}</p>
              <p className="text-xs text-gray-500 capitalize">{player.role}</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1 group-hover:text-gray-600 transition-colors" />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
          {player.sport && (
            <span
              className="px-2 py-0.5 rounded-full text-white font-semibold text-xs"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              {player.sport}
            </span>
          )}
          {player.position && (
            <span className="bg-gray-100 px-2 py-0.5 rounded-full">{player.position}</span>
          )}
          {player.province && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {player.province}
            </span>
          )}
        </div>

        {/* THUTO Score */}
        {player.thuto_score !== null && player.thuto_score !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={13} style={{ color: "#c8962a" }} />
              <span className="text-xs font-semibold text-gray-700">THUTO Score</span>
            </div>
            <span
              className="text-sm font-bold"
              style={{ color: scoreColor(player.thuto_score) }}
            >
              {Math.round(player.thuto_score)}
            </span>
          </div>
        )}

        {player.peak_level_label && (
          <p className="text-xs text-gray-400 truncate">{player.peak_level_label}</p>
        )}

        {/* Follow Button */}
        {!isOwn && token && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60"
            style={
              following
                ? { borderColor: "#1a5c2a", color: "#1a5c2a", backgroundColor: "#f0fdf4" }
                : { borderColor: "#c8962a", color: "#c8962a", backgroundColor: "transparent" }
            }
          >
            {following ? (
              <><UserCheck size={14} /> Following</>
            ) : (
              <><UserPlus size={14} /> Follow</>
            )}
          </button>
        )}
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-full bg-gray-200 rounded" />
      <div className="h-8 w-full bg-gray-200 rounded-xl" />
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORTS = ["Football", "Rugby", "Netball", "Athletics", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];
const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];
const POSITIONS = ["Striker", "Midfielder", "Defender", "Goalkeeper", "Winger", "Centre Back", "Full Back", "Attacking Mid", "Defensive Mid"];
const THUTO_FILTERS = [
  { label: "Any", value: "" },
  { label: "50+", value: "50" },
  { label: "60+", value: "60" },
  { label: "70+", value: "70" },
  { label: "80+", value: "80" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [players, setPlayers]       = useState<DiscoverPlayer[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch]     = useState("");
  const [sport, setSport]       = useState("");
  const [province, setProvince] = useState("");
  const [position, setPosition] = useState("");
  const [minThuto, setMinThuto] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (sport)    params.set("sport", sport);
      if (province) params.set("province", province);
      if (position) params.set("position", position);
      if (minThuto) params.set("min_thuto", minThuto);
      if (search)   params.set("search", search);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res  = await fetch(`${API}/arena/discover?${params}`, { headers });
      const json = await res.json();
      setPlayers(safeArray<DiscoverPlayer>(json));
    } catch {
      setError("Failed to load athletes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API, token, sport, province, position, minThuto, search]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { load(); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const activeFilters = [sport, province, position, minThuto].filter(Boolean).length;
  const clearFilters  = () => { setSport(""); setProvince(""); setPosition(""); setMinThuto(""); };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discover Athletes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Find players, coaches and scouts across Zimbabwe
          </p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors"
            style={{
              backgroundColor: showFilters ? "#1a5c2a" : "white",
              color: showFilters ? "white" : "#374151",
              borderColor: showFilters ? "#1a5c2a" : "#e5e7eb",
            }}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilters > 0 && (
              <span className="ml-0.5 w-4 h-4 flex items-center justify-center text-xs rounded-full bg-amber-500 text-white font-bold">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Filter Athletes</h3>
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Sport</label>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">All sports</option>
                  {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Province</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Nationwide</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="">Any position</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Min THUTO Score</label>
                <div className="flex gap-1.5 flex-wrap">
                  {THUTO_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setMinThuto(f.value)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors"
                      style={
                        minThuto === f.value
                          ? { backgroundColor: "#1a5c2a", color: "white", borderColor: "#1a5c2a" }
                          : { backgroundColor: "white", color: "#374151", borderColor: "#e5e7eb" }
                      }
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && !error && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users size={14} />
            {players.length === 0 ? "No athletes found" : `${players.length} athlete${players.length !== 1 ? "s" : ""} found`}
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-xs underline hover:text-gray-700">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => <Skeleton key={n} />)}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm text-center">
            {error}
            <button onClick={load} className="ml-2 underline">Retry</button>
          </div>
        ) : players.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <Users size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No athletes found</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeFilters > 0 || search
                ? "Try adjusting your filters or search term."
                : "Be the first to join the Arena."}
            </p>
            {(activeFilters > 0 || search) && (
              <button
                onClick={() => { clearFilters(); setSearch(""); }}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((p) => (
              <PlayerCard key={p.id} player={p} currentUserId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
