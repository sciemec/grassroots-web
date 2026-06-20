"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, UserPlus, UserCheck, Filter, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

const SPORTS = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const PROVINCES = ["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"];
const SCORE_CHIPS = [
  { label: "40+", value: 40 },
  { label: "55+", value: 55 },
  { label: "65+", value: 65 },
  { label: "75+", value: 75 },
];

interface Player {
  id: string;
  name: string;
  role: string;
  sport: string;
  province: string;
  position: string;
  thuto_score?: number;
  peak_level_label?: string;
  avatar_url?: string;
  is_following: boolean;
}

function safeArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const inner = (v as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena", label: "Feed" },
    { href: "/arena/network", label: "Network" },
    { href: "/arena/clubs", label: "Clubs" },
    { href: "/arena/recruitment", label: "Talent Board" },
    { href: "/arena/messages", label: "Messages" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>
          The Arena
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === href ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={pathname === href ? { background: GRS_GREEN } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

function ScoreColor(score?: number) {
  if (!score) return "text-gray-400";
  if (score >= 75) return "text-emerald-600";
  if (score >= 55) return "text-amber-600";
  return "text-red-500";
}

export default function DiscoverPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [players, setPlayers]         = useState<Player[]>([]);
  const [loading, setLoading]         = useState(true);
  const [query, setQuery]             = useState("");
  const [sport, setSport]             = useState("");
  const [province, setProvince]       = useState("");
  const [position, setPosition]       = useState("");
  const [minScore, setMinScore]       = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPlayers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)        params.set("q", q);
      if (sport)    params.set("sport", sport);
      if (province) params.set("province", province);
      if (position) params.set("position", position);
      if (minScore) params.set("min_score", String(minScore));

      const res = await fetch(`${API}/arena/discover?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setPlayers(safeArray<Player>(json));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token, sport, province, position, minScore]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPlayers(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchPlayers, hasHydrated]);

  const toggleFollow = async (playerId: string, currently: boolean) => {
    setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, is_following: !currently } : p));
    try {
      await fetch(`${API}/arena/follow/${playerId}`, {
        method: currently ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, is_following: currently } : p));
    }
  };

  const activeFilters = [sport, province, position, minScore > 0].filter(Boolean).length;

  if (!hasHydrated) return <div className="flex h-screen items-center justify-center" style={{ background: BG }}><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: GRS_GREEN, borderTopColor: "transparent" }} /></div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Discover Athletes</h1>
            <p className="text-sm text-gray-500">{players.length} athletes found</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors"
            style={{ borderColor: activeFilters ? GOLD : "#d1d5db", color: activeFilters ? GOLD : "#6b7280", background: activeFilters ? "#fffbeb" : "white" }}>
            <Filter size={15} />
            Filters {activeFilters > 0 && <span className="w-5 h-5 rounded-full text-white text-xs flex items-center justify-center" style={{ background: GOLD }}>{activeFilters}</span>}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2"
            style={{ "--tw-ring-color": GRS_GREEN } as React.CSSProperties} />
          {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Sport</p>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button key={s} onClick={() => setSport(sport === s ? "" : s)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{ background: sport === s ? GRS_GREEN : "white", color: sport === s ? "white" : "#374151", borderColor: sport === s ? GRS_GREEN : "#d1d5db" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Province</p>
                <select value={province} onChange={(e) => setProvince(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">All provinces</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Position</p>
                <input value={position} onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Striker"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Min THUTO Score</p>
              <div className="flex gap-2">
                {SCORE_CHIPS.map((c) => (
                  <button key={c.value} onClick={() => setMinScore(minScore === c.value ? 0 : c.value)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={{ background: minScore === c.value ? GRS_GREEN : "white", color: minScore === c.value ? "white" : "#374151", borderColor: minScore === c.value ? GRS_GREEN : "#d1d5db" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setSport(""); setProvince(""); setPosition(""); setMinScore(0); }}
                className="text-sm text-red-500 hover:underline">Clear all filters</button>
            )}
          </div>
        )}

        {/* Player grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200" />
                  <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
                </div>
                <div className="h-3 bg-gray-100 rounded w-full mb-3" />
                <div className="h-8 bg-gray-100 rounded-full w-24" />
              </div>
            ))}
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-2">No athletes found</p>
            <p className="text-gray-300 text-xs">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => {
              const initials = player.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={player.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: GRS_GREEN }}>{initials}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/arena/profile/${player.id}`} className="font-semibold text-gray-900 hover:underline truncate block">
                        {player.name}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">{player.position || player.role} · {player.sport}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {player.province && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{player.province}</span>}
                    {player.peak_level_label && <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#f0fdf4", color: GRS_GREEN }}>{player.peak_level_label}</span>}
                    {player.thuto_score != null && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ScoreColor(player.thuto_score)}`}
                        style={{ background: "#f9fafb" }}>
                        {player.thuto_score}
                      </span>
                    )}
                  </div>
                  <button onClick={() => toggleFollow(player.id, player.is_following)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={player.is_following
                      ? { background: "#f9fafb", color: "#6b7280", borderColor: "#d1d5db" }
                      : { background: GOLD, color: "white", borderColor: GOLD }}>
                    {player.is_following ? <UserCheck size={13} /> : <UserPlus size={13} />}
                    {player.is_following ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
