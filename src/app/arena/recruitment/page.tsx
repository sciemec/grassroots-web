"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin, Search, SlidersHorizontal, X, Briefcase,
  ChevronRight, Clock, Users, Zap, Plus,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TalentPosting {
  id: number;
  sport: string;
  position: string;
  age_min: number;
  age_max: number;
  thuto_min: number;
  province: string | null;
  style_of_play: string | null;
  stipend: boolean;
  description: string;
  status: "open" | "closed";
  closes_at: string | null;
  created_at: string;
  applications_count: number;
  poster: { id: number; name: string } | null;
  club: { id: number; name: string } | null;
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
          <Link href="/arena/clubs" className="text-gray-600 hover:text-gray-900">Clubs</Link>
          <Link href="/arena/recruitment" className="font-semibold" style={{ color: "#1a5c2a" }}>Talent Board</Link>
          <Link href="/arena/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user?.role === "coach" && (
          <Link
            href="/arena/recruitment/new"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "#c8962a" }}
          >
            <Plus size={14} />
            Post
          </Link>
        )}
        <div className="relative group">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            {initials}
          </div>
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40 hidden group-hover:block z-50">
            {user?.role === "coach" && (
              <Link href="/arena/recruitment/new" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Post Talent Wanted
              </Link>
            )}
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

// ─── PostingCard ──────────────────────────────────────────────────────────────

function PostingCard({ posting }: { posting: TalentPosting }) {
  const daysLeft = posting.closes_at
    ? Math.max(0, Math.ceil((new Date(posting.closes_at).getTime() - Date.now()) / 86400000))
    : null;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    return `${d}d ago`;
  };

  return (
    <Link href={`/arena/recruitment/${posting.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: "#1a5c2a" }}>
                {posting.sport}
              </span>
              {posting.stipend && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                  Stipend
                </span>
              )}
              {posting.thuto_min > 0 && (
                <span className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ede9fe", color: "#5b21b6" }}>
                  <Zap size={10} />
                  THUTO {posting.thuto_min}+
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-lg mt-1.5">{posting.position}</h3>
            {posting.club && (
              <p className="text-sm text-gray-600">{posting.club.name}</p>
            )}
          </div>
          <ChevronRight size={18} className="text-gray-400 flex-shrink-0 mt-1" />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          {posting.province && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {posting.province}
            </span>
          )}
          {!posting.province && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              Nationwide
            </span>
          )}
          <span>Age {posting.age_min}–{posting.age_max}</span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {posting.applications_count} applied
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{posting.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
          <span>{timeAgo(posting.created_at)}</span>
          {daysLeft !== null ? (
            <span className={`flex items-center gap-1 ${daysLeft <= 3 ? "text-red-500 font-semibold" : ""}`}>
              <Clock size={11} />
              {daysLeft === 0 ? "Closes today" : `${daysLeft}d left`}
            </span>
          ) : (
            <span>Open</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-12 bg-gray-200 rounded-full" />
      </div>
      <div className="h-6 w-48 bg-gray-200 rounded" />
      <div className="h-4 w-32 bg-gray-200 rounded" />
      <div className="h-4 w-full bg-gray-200 rounded" />
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SPORTS = ["Football", "Rugby", "Netball", "Athletics", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];
const PROVINCES = ["Harare", "Bulawayo", "Manicaland", "Mashonaland Central", "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands"];

export default function RecruitmentPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [postings, setPostings]   = useState<TalentPosting[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [sport, setSport]       = useState("");
  const [province, setProvince] = useState("");
  const [position, setPosition] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (sport)    params.set("sport", sport);
      if (province) params.set("province", province);
      if (position) params.set("position", position);

      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API}/arena/talent-wanted?${params}`, { headers });
      const json = await res.json();
      setPostings(safeArray<TalentPosting>(json));
    } catch {
      setError("Failed to load postings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [API, token, sport, province, position]);

  useEffect(() => { load(); }, [load]);

  const activeFilters = [sport, province, position].filter(Boolean).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Talent Board</h1>
            <p className="text-sm text-gray-500 mt-0.5">Clubs looking for players across Zimbabwe</p>
          </div>
          {user?.role === "coach" && (
            <Link
              href="/arena/recruitment/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#c8962a" }}
            >
              <Plus size={15} />
              Post
            </Link>
          )}
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Search position (e.g. Striker, Centre Back)"
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
              <h3 className="text-sm font-semibold text-gray-700">Filter Postings</h3>
              {activeFilters > 0 && (
                <button
                  onClick={() => { setSport(""); setProvince(""); setPosition(""); }}
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
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => <Skeleton key={n} />)}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm text-center">
            {error}
            <button onClick={load} className="ml-2 underline">Retry</button>
          </div>
        ) : postings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No postings found</p>
            <p className="text-sm text-gray-400 mt-1">
              {activeFilters > 0 ? "Try adjusting your filters." : "No clubs are currently recruiting. Check back soon."}
            </p>
            {user?.role === "coach" && (
              <Link
                href="/arena/recruitment/new"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Plus size={15} /> Post Talent Wanted
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {postings.map((p) => <PostingCard key={p.id} posting={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
