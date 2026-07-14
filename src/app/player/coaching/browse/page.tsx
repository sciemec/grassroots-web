// src/app/player/coaching/browse/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { CoachProfile } from "@/types/coaching";

const SPORTS = ["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis"];

const BADGE_CONFIG: Record<string, { label: string; color: string }> = {
  premier:  { label: "Premier",  color: "bg-purple-100 text-purple-700" },
  zifa:     { label: "ZIFA",     color: "bg-blue-100 text-blue-700" },
  national: { label: "National", color: "bg-green-100 text-green-700" },
  academy:  { label: "Academy",  color: "bg-amber-100 text-amber-700" },
  elite:    { label: "Elite",    color: "bg-red-100 text-red-700" },
};

const SESSION_TYPES = ["individual", "group", "video_analysis", "tactical", "drills", "match_analysis"];

const mockCoaches: CoachProfile[] = [
  {
    id: "c1",
    userId: "u1",
    name: "Coach T. Musona",
    email: "musona@grassroots.live",
    phone: "+263771000001",
    credentials: [{ id: "cr1", name: "UEFA B License", issuer: "UEFA", year: 2019 }],
    experience: 8,
    currentClub: "Dynamos FC",
    currentRole: "Head Coach",
    formerClubs: ["Caps United", "ZIFA Academy"],
    specialties: ["Football", "Tactical Analysis", "Youth Development"],
    coachingStyle: "Possession-based, high-press attacking football",
    bio: "Former Zimbabwe Premier League coach with 8 years experience developing youth talent. UEFA B Licensed and ZIFA certified.",
    languages: ["English", "Shona"],
    rating: 4.8,
    totalSessions: 124,
    totalStudents: 34,
    reviews: [],
    availability: [
      { id: "a1", day: "Monday", startTime: "06:00", endTime: "10:00", isRecurring: true, maxBookings: 4, bookedCount: 2 },
      { id: "a2", day: "Wednesday", startTime: "16:00", endTime: "20:00", isRecurring: true, maxBookings: 4, bookedCount: 1 },
      { id: "a3", day: "Saturday", startTime: "08:00", endTime: "14:00", isRecurring: true, maxBookings: 6, bookedCount: 4 },
    ],
    pricePerSession: 35,
    sessionDuration: 60,
    isVerified: true,
    verificationBadge: "zifa",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2025-06-01T00:00:00Z",
  },
  {
    id: "c2",
    userId: "u2",
    name: "Coach F. Ndlovu",
    email: "ndlovu@grassroots.live",
    phone: "+263772000002",
    credentials: [
      { id: "cr2", name: "CAF Level 2", issuer: "CAF", year: 2021 },
      { id: "cr3", name: "ZIFA Grassroots", issuer: "ZIFA", year: 2020 },
    ],
    experience: 12,
    currentClub: "Highlanders FC",
    currentRole: "Assistant Coach",
    formerClubs: ["Bulawayo City FC"],
    specialties: ["Football", "Defending", "Set Pieces", "Goalkeeping"],
    coachingStyle: "Compact defensive shape with fast counter-attacks",
    bio: "12 years coaching professional football in Zimbabwe. Specialist in defensive organisation and set piece design.",
    languages: ["English", "Ndebele"],
    rating: 4.6,
    totalSessions: 89,
    totalStudents: 21,
    reviews: [],
    availability: [
      { id: "a4", day: "Tuesday", startTime: "07:00", endTime: "09:00", isRecurring: true, maxBookings: 3, bookedCount: 1 },
      { id: "a5", day: "Thursday", startTime: "17:00", endTime: "19:00", isRecurring: true, maxBookings: 3, bookedCount: 2 },
      { id: "a6", day: "Sunday", startTime: "09:00", endTime: "13:00", isRecurring: true, maxBookings: 5, bookedCount: 0 },
    ],
    pricePerSession: 28,
    sessionDuration: 45,
    isVerified: true,
    verificationBadge: "national",
    createdAt: "2023-08-15T00:00:00Z",
    updatedAt: "2025-05-20T00:00:00Z",
  },
  {
    id: "c3",
    userId: "u3",
    name: "Coach A. Chigumba",
    email: "chigumba@grassroots.live",
    phone: "+263773000003",
    credentials: [{ id: "cr4", name: "ZIFA Level 1", issuer: "ZIFA", year: 2022 }],
    experience: 5,
    currentClub: "Masvingo Stars",
    currentRole: "Head Coach",
    formerClubs: [],
    specialties: ["Football", "Dribbling", "Attacking Play", "Speed Training"],
    coachingStyle: "Flair-based, freedom of expression for attackers",
    bio: "Former Zimbabwe Under-20 international. Specialises in developing technical skill and individual flair.",
    languages: ["English", "Shona"],
    rating: 4.4,
    totalSessions: 56,
    totalStudents: 18,
    reviews: [],
    availability: [
      { id: "a7", day: "Monday", startTime: "15:00", endTime: "19:00", isRecurring: true, maxBookings: 4, bookedCount: 2 },
      { id: "a8", day: "Friday", startTime: "15:00", endTime: "18:00", isRecurring: true, maxBookings: 3, bookedCount: 1 },
    ],
    pricePerSession: 20,
    sessionDuration: 60,
    isVerified: false,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2025-04-10T00:00:00Z",
  },
  {
    id: "c4",
    userId: "u4",
    name: "Coach R. Sibanda",
    email: "sibanda@grassroots.live",
    phone: "+263774000004",
    credentials: [
      { id: "cr5", name: "CAF A License", issuer: "CAF", year: 2018 },
      { id: "cr6", name: "UEFA Pro (Part)", issuer: "UEFA", year: 2020 },
    ],
    experience: 15,
    currentClub: "Harare City FC",
    currentRole: "Technical Director",
    formerClubs: ["ZIFA Senior Team (Asst)", "Caps United", "Triangle FC"],
    specialties: ["Football", "Tactical Systems", "Video Analysis", "Physical Conditioning"],
    coachingStyle: "Data-driven analysis with modern pressing triggers",
    bio: "CAF A Licensed coach with 15 years at the highest level. Former Zimbabwe national team assistant. Expert in tactical periodisation.",
    languages: ["English", "Shona", "Ndebele"],
    rating: 5.0,
    totalSessions: 203,
    totalStudents: 61,
    reviews: [],
    availability: [
      { id: "a9", day: "Wednesday", startTime: "07:00", endTime: "09:00", isRecurring: true, maxBookings: 2, bookedCount: 1 },
      { id: "a10", day: "Saturday", startTime: "07:00", endTime: "12:00", isRecurring: true, maxBookings: 4, bookedCount: 3 },
    ],
    pricePerSession: 65,
    sessionDuration: 90,
    isVerified: true,
    verificationBadge: "premier",
    createdAt: "2023-01-05T00:00:00Z",
    updatedAt: "2025-07-01T00:00:00Z",
  },
];

function CoachCard({ coach }: { coach: CoachProfile }) {
  const badge = coach.verificationBadge ? BADGE_CONFIG[coach.verificationBadge] : null;
  const availableDays = [...new Set(coach.availability.map((a) => a.day.slice(0, 3)))].join(", ");

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          {coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-gray-900 text-base">{coach.name}</h3>
            {coach.isVerified && (
              <div className="flex items-center gap-1">
                <Icons.BadgeCheck size={15} className="text-[#1a5c2a]" />
                {badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500">{coach.currentRole} · {coach.currentClub}</p>
        </div>
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{coach.bio}</p>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {coach.specialties.slice(0, 3).map((s) => (
          <span key={s} className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
            {s}
          </span>
        ))}
        {coach.specialties.length > 3 && (
          <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
            +{coach.specialties.length - 3}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <Icons.Star size={12} className="fill-[#f0b429] text-[#f0b429]" />
            <span className="text-sm font-black text-gray-900">{coach.rating.toFixed(1)}</span>
          </div>
          <p className="text-[10px] text-gray-500">Rating</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-sm font-black text-gray-900">{coach.totalSessions}</p>
          <p className="text-[10px] text-gray-500">Sessions</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-gray-900">{coach.experience}yr</p>
          <p className="text-[10px] text-gray-500">Exp</p>
        </div>
      </div>

      {/* Availability + price */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">Available</p>
          <p className="text-xs font-bold text-gray-700">{availableDays}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 mb-0.5">From</p>
          <p className="text-base font-black text-[#1a5c2a]">${coach.pricePerSession}</p>
          <p className="text-[10px] text-gray-400">{coach.sessionDuration}min</p>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/player/coaching/${coach.id}`}
        className="block w-full text-center py-2.5 rounded-xl text-sm font-black text-white transition-colors"
        style={{ backgroundColor: "#1a5c2a" }}
      >
        View Profile &amp; Book
      </Link>
    </div>
  );
}

export default function BrowseCoachesPage() {
  const token = useAuthStore((s) => s.token);

  const [coaches, setCoaches] = useState<CoachProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const loadCoaches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.set("q", search);
      if (selectedSport) params.set("sport", selectedSport);
      if (maxPrice)      params.set("max_price", String(maxPrice));
      if (verifiedOnly)  params.set("verified", "1");
      if (selectedBadge) params.set("badge", selectedBadge);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coaches?${params.toString()}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const raw = data?.data?.data ?? data?.data ?? data;
      setCoaches(Array.isArray(raw) ? raw : mockCoaches);
    } catch {
      setCoaches(mockCoaches);
    } finally {
      setLoading(false);
    }
  }, [token, search, selectedSport, maxPrice, verifiedOnly, selectedBadge]);

  useEffect(() => {
    loadCoaches();
  }, [loadCoaches]);

  useEffect(() => {
    let count = 0;
    if (selectedSport) count++;
    if (maxPrice)       count++;
    if (verifiedOnly)   count++;
    if (selectedBadge)  count++;
    setActiveFilterCount(count);
  }, [selectedSport, maxPrice, verifiedOnly, selectedBadge]);

  const clearFilters = () => {
    setSelectedSport("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setSelectedBadge("");
  };

  // Client-side filter on mock data
  const filtered = coaches.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.specialties.join(" ").toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedSport && !c.specialties.includes(selectedSport)) return false;
    if (maxPrice && c.pricePerSession > Number(maxPrice)) return false;
    if (verifiedOnly && !c.isVerified) return false;
    if (selectedBadge && c.verificationBadge !== selectedBadge) return false;
    return true;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/player/coaching"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Icons.ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-base font-black text-gray-900">Find a Coach</h1>
            <p className="text-xs text-gray-500">Zimbabwe-certified coaching professionals</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Search + filter bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-[#1a5c2a] bg-[#1a5c2a]/5 text-[#1a5c2a]"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <Icons.SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#1a5c2a] text-white text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sport */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Sport</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSport(selectedSport === s ? "" : s)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
                        selectedSport === s
                          ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price + Verified */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Max Price ($/session)</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                    placeholder="e.g. 50"
                    min={0}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${verifiedOnly ? "bg-[#1a5c2a]" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        verifiedOnly ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-sm font-bold text-gray-700">Verified coaches only</span>
                </div>
              </div>
            </div>

            {/* Badge filter */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">Certification Badge</label>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(BADGE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedBadge(selectedBadge === key ? "" : key)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
                      selectedBadge === key
                        ? cfg.color + " border-current"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1 transition-colors"
              >
                <Icons.X size={14} />
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${filtered.length} coach${filtered.length !== 1 ? "es" : ""} found`}
          </p>
          {search && (
            <p className="text-sm text-gray-400">Results for &ldquo;{search}&rdquo;</p>
          )}
        </div>

        {/* Coach grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-100 rounded" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                </div>
                <div className="h-9 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Icons.UserX size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-gray-700">No coaches match your filters</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or removing filters</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm font-bold text-[#1a5c2a] border border-[#1a5c2a] rounded-xl hover:bg-[#1a5c2a]/5 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((coach) => (
              <CoachCard key={coach.id} coach={coach} />
            ))}
          </div>
        )}

        {/* Session type info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-black text-gray-900 mb-3">Session Types Available</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { type: "individual", icon: Icons.User, label: "1-on-1", desc: "Personal coaching" },
              { type: "group", icon: Icons.Users, label: "Group", desc: "Up to 6 players" },
              { type: "video_analysis", icon: Icons.Video, label: "Video Analysis", desc: "Review match footage" },
              { type: "tactical", icon: Icons.Target, label: "Tactical", desc: "Formation & systems" },
              { type: "drills", icon: Icons.Activity, label: "Drills", desc: "Skill development" },
              { type: "match_analysis", icon: Icons.BarChart2, label: "Match Review", desc: "Post-match breakdown" },
            ].map(({ type, icon: Icon, label, desc }) => (
              <div key={type} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
                <Icon size={16} className="text-[#1a5c2a] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-900">{label}</p>
                  <p className="text-[10px] text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
