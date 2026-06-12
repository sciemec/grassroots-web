"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, MessageSquare, Home, Plus, MapPin, Trophy } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface Club {
  id: string;
  name: string;
  sport: string;
  province: string;
  tier: string;
  member_count: number;
  is_member: boolean;
  avatar_initials?: string;
  description?: string;
  open_for_trials: boolean;
}

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena",             label: "Feed",         icon: Home },
    { href: "/arena/network",     label: "Network",      icon: Users },
    { href: "/arena/clubs",       label: "Clubs",        icon: Users },
    { href: "/arena/recruitment", label: "Talent Board", icon: Briefcase },
    { href: "/arena/messages",    label: "Messages",     icon: MessageSquare },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>The Arena</Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === href ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={pathname === href ? { background: GRS_GREEN } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

export default function ClubsPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [clubs,    setClubs]    = useState<Club[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sport,    setSport]    = useState("");
  const [province, setProvince] = useState("");
  const [joining,  setJoining]  = useState<string | null>(null);

  const SPORTS    = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];
  const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (sport)    params.set("sport", sport);
    if (province) params.set("province", province);
    setLoading(true);
    fetch(`${API}/arena/clubs?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setClubs(safeArray(json.data ?? json)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, sport, province]);

  const toggleJoin = async (club: Club) => {
    if (!token) return;
    setJoining(club.id);
    try {
      if (club.is_member) {
        await fetch(`${API}/arena/clubs/${club.id}/leave`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        setClubs((cs) => cs.map((c) => c.id === club.id ? { ...c, is_member: false, member_count: c.member_count - 1 } : c));
      } else {
        await fetch(`${API}/arena/clubs/${club.id}/join`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        setClubs((cs) => cs.map((c) => c.id === club.id ? { ...c, is_member: true, member_count: c.member_count + 1 } : c));
      }
    } catch {}
    setJoining(null);
  };

  if (!hasHydrated || !user) return null;
  const userName = user.name ?? "You";
  const isCoach  = user.role === "coach" || user.role === "admin";

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <ArenaNav userName={userName} />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clubs</h1>
            <p className="text-sm text-gray-500 mt-0.5">Discover and join clubs across Zimbabwe</p>
          </div>
          {isCoach && (
            <Link href="/arena/clubs/new"
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full text-white"
              style={{ background: GRS_GREEN }}>
              <Plus size={15} /> Create Club
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select value={sport} onChange={(e) => setSport(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white outline-none">
            <option value="">All sports</option>
            {SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={province} onChange={(e) => setProvince(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full border border-gray-200 bg-white outline-none">
            <option value="">All provinces</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Club grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-40 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Trophy className="mx-auto mb-3 text-gray-300" size={32} />
            <p className="text-sm text-gray-500">No clubs found.</p>
            {isCoach && (
              <Link href="/arena/clubs/new" className="mt-3 inline-block text-sm font-semibold" style={{ color: GRS_GREEN }}>
                Create the first club
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clubs.map((club) => {
              const initials = club.avatar_initials ?? club.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={club.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/arena/clubs/${club.id}`} className="font-semibold text-sm text-gray-900 hover:underline truncate block">{club.name}</Link>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500 capitalize">{club.sport}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="flex items-center gap-0.5 text-xs text-gray-500"><MapPin size={10} />{club.province}</span>
                      </div>
                    </div>
                  </div>
                  {club.description && <p className="text-xs text-gray-500 line-clamp-2">{club.description}</p>}
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{club.member_count} members</span>
                      {club.open_for_trials && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: GRS_GREEN }}>Open for trials</span>
                      )}
                    </div>
                    <button onClick={() => toggleJoin(club)} disabled={joining === club.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
                      style={club.is_member
                        ? { background: "#f0fdf4", borderColor: "#bbf7d0", color: GRS_GREEN }
                        : { borderColor: GRS_GREEN, color: GRS_GREEN }}>
                      {joining === club.id ? "..." : club.is_member ? "Joined" : "Join"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
