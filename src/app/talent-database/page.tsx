"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, Globe, MapPin, Loader2, UserPlus, ExternalLink, Trophy } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

const SPORTS = ["All", "Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];
const PROVINCES = ["All", "Harare", "Bulawayo", "Manicaland", "Mashonaland East", "Mashonaland West", "Mashonaland Central", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];
const AGE_GROUPS = ["All", "U16", "U18", "U21", "Senior"];

const SPORT_EMOJIS: Record<string, string> = {
  Football: "⚽", Rugby: "🏉", Athletics: "🏃", Netball: "🏐",
  Basketball: "🏀", Cricket: "🏏", Swimming: "🏊", Tennis: "🎾",
  Volleyball: "🏐", Hockey: "🏑",
};

interface Player {
  id: string;
  player_id: string;
  name: string;
  sport: string;
  position: string;
  province: string;
  age: number | null;
  age_group?: string;
  club?: string;
  rating?: number | null;
}

export default function TalentDatabasePage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const [sport, setSport] = useState("All");
  const [position, setPosition] = useState("");
  const [province, setProvince] = useState("All");
  const [ageGroup, setAgeGroup] = useState("All");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) router.push("/login");
  }, [_hasHydrated, user, router]);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const params: Record<string, string> = {};
      if (sport !== "All") params.sport = sport;
      if (position.trim()) params.position = position.trim();
      if (province !== "All") params.province = province;
      if (ageGroup !== "All") params.age_group = ageGroup;

      const res = await api.get("/scout/players", { params });
      const data: Player[] = res.data?.data ?? res.data ?? [];
      setPlayers(data);
    } catch {
      setPlayers([]);
      setError("Could not load players. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShortlist(playerId: string) {
    try {
      await api.post("/scout/shortlist", { player_id: playerId });
      setShortlisted((prev) => new Set(Array.from(prev).concat(playerId)));
    } catch {
      // silently fail
    }
  }

  if (!_hasHydrated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">National Talent Database</h1>
              <span className="rounded-full bg-[#f0b429] px-2.5 py-0.5 text-xs font-bold text-[#1a3a1a]">
                PRO
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Zimbabwe&apos;s top grassroots talent — searchable by position, province, age, sport
            </p>
          </div>
        </div>

        {/* Stat badges */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Users, label: "Total Players", value: "847", color: "text-[#f0b429]" },
            { icon: Trophy, label: "Sports Covered", value: "10", color: "text-green-500" },
            { icon: MapPin, label: "Provinces", value: "10", color: "text-blue-500" },
            { icon: Globe, label: "Active Scouts", value: "23", color: "text-purple-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm p-4 text-center">
              <Icon className={`mx-auto mb-1 h-5 w-5 ${color}`} />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="mb-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Sport</label>
              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {SPORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Position</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Striker, GK…"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Province</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {PROVINCES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Age Group</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                {AGE_GROUPS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-2 text-sm font-semibold text-[#1a3a1a] hover:bg-[#f0b429]/90 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search Players
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl bg-red-500/10 px-5 py-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && searched && players.length === 0 && !error && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No players found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try different filters — e.g. change province or remove position</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">Search the talent database</p>
            <p className="mt-1 text-sm text-muted-foreground">Use the filters above to find players across Zimbabwe</p>
          </div>
        )}

        {!loading && players.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-xl">
                      {SPORT_EMOJIS[player.sport] ?? "🏅"}
                    </div>
                    <div>
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.sport} · {player.position}</p>
                    </div>
                  </div>
                  {player.rating !== undefined && (
                    <span className="rounded-lg bg-[#f0b429]/20 px-2 py-0.5 text-xs font-bold text-[#f0b429]">
                      {player.rating}
                    </span>
                  )}
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    <MapPin className="h-3 w-3" /> {player.province ?? "—"}
                  </span>
                  {player.age_group && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                      {player.age_group.toUpperCase()}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground">
                    {player.player_id ?? player.id}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/scout/compare?player=${player.player_id ?? player.id}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Profile
                  </Link>
                  <button
                    onClick={() => handleShortlist(player.id)}
                    disabled={shortlisted.has(player.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1a5c2a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a5c2a]/90 disabled:opacity-60 transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    {shortlisted.has(player.id) ? "Shortlisted" : "Shortlist"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
