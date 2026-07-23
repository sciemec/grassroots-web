"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  Medal,
  TrendingUp,
  Users,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank:       number;
  initials:   string;
  best_score: number;
  age_group:  string | null;
  gender:     string | null;
  user_id:    string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  my_rank:     number | null;
  my_user_id:  string | null;
}

// ── Drill definitions (kept in sync with capture page) ────────────────────────

const DRILLS = [
  { id: "first-touch",        name: "First Touch & Control" },
  { id: "dribbling-speed",    name: "Dribbling Speed" },
  { id: "passing-accuracy",   name: "Passing Accuracy" },
  { id: "shooting-power",     name: "Shooting Power & Accuracy" },
  { id: "heading",            name: "Heading Technique" },
  { id: "defensive-stance",   name: "Defensive Stance & Positioning" },
  { id: "agility-footwork",   name: "Agility & Footwork" },
  { id: "aerial-duels",       name: "Aerial Duels" },
  { id: "one-v-one",          name: "1v1 Attacking" },
  { id: "crossing",           name: "Crossing & Delivery" },
];

const AGE_GROUPS = ["U13", "U15", "U17", "U20", "Senior"];
const GENDERS    = [
  { value: "",       label: "All" },
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function rankMedal(rank: number) {
  if (rank === 1) return { icon: "🥇", colour: "text-yellow-500" };
  if (rank === 2) return { icon: "🥈", colour: "text-gray-400" };
  if (rank === 3) return { icon: "🥉", colour: "text-amber-600" };
  return { icon: `#${rank}`, colour: "text-gray-500" };
}

function scoreColour(score: number) {
  if (score >= 7) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DrillLeaderboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} />}>
      <DrillLeaderboard />
    </Suspense>
  );
}

function DrillLeaderboard() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = useAuthStore((s) => s.token);
  const user         = useAuthStore((s) => s.user);

  // Filters from query params (can also be changed in-page)
  const [drillId,  setDrillId]  = useState(searchParams.get("drill_id")  ?? DRILLS[0].id);
  const [ageGroup, setAgeGroup] = useState(searchParams.get("age_group") ?? "");
  const [gender,   setGender]   = useState(searchParams.get("gender")    ?? "");

  const [data,    setData]    = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  // ── Fetch leaderboard ──────────────────────────────────────────────────────

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ drill_id: drillId });
      if (ageGroup) params.set("age_group", ageGroup);
      if (gender)   params.set("gender",    gender);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res  = await fetch(`${apiBase}/leaderboard/drills?${params}`, { headers });
      const json = await res.json() as { data?: LeaderboardData; error?: string };

      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setData(json.data ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [drillId, ageGroup, gender, token, apiBase]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedDrill = DRILLS.find((d) => d.id === drillId) ?? DRILLS[0];
  const entries       = data?.leaderboard ?? [];
  const myRank        = data?.my_rank    ?? null;
  const myUserId      = data?.my_user_id ?? null;

  // Whether current user appears in top 10
  const myEntryInTable = entries.some((e) => e.user_id === myUserId);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* ── Header ── */}
      <div style={{ backgroundColor: "#1a5c2a" }} className="sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-tight truncate">
              Drill Leaderboard
            </h1>
            <p className="text-white/70 text-xs truncate">{selectedDrill.name}</p>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── My rank banner (if authenticated + ranked) ── */}
        {myRank !== null && (
          <div className="bg-white rounded-xl border border-[#c8962a]/30 p-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#f0b429]/20 flex items-center justify-center flex-shrink-0">
              <Trophy size={20} className="text-[#c8962a]" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Your rank</p>
              <p className="font-bold text-[#1a5c2a] text-lg leading-tight">
                #{myRank}
                {ageGroup || gender ? (
                  <span className="text-xs font-normal text-gray-500 ml-1">
                    in {[ageGroup, gender ? (gender === "male" ? "Male" : "Female") : ""].filter(Boolean).join(" ")}
                  </span>
                ) : null}
              </p>
            </div>
            <button
              onClick={() => router.push(`/player/capture?drill=${drillId}`)}
              className="text-xs font-semibold text-white px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Retest
            </button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm space-y-3">

          {/* Drill selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Drill</label>
            <div className="relative">
              <select
                value={drillId}
                onChange={(e) => setDrillId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              >
                {DRILLS.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2">
            {/* Age group */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Age Group</label>
              <div className="relative">
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                >
                  <option value="">All ages</option>
                  {AGE_GROUPS.map((ag) => (
                    <option key={ag} value={ag}>{ag}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Gender */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Top 3 podium ── */}
        {!loading && entries.length >= 3 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-end justify-center gap-2">

              {/* 2nd */}
              <div className="flex flex-col items-center gap-1 w-24">
                <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-500">{entries[1]?.initials}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 font-medium">🥈 2nd</p>
                  <p className={`text-sm font-bold px-2 py-0.5 rounded-full border ${scoreColour(entries[1]?.best_score ?? 0)}`}>
                    {(entries[1]?.best_score ?? 0).toFixed(1)}
                  </p>
                </div>
                <div className="w-full h-12 rounded-t-lg" style={{ backgroundColor: "#e5e7eb" }} />
              </div>

              {/* 1st */}
              <div className="flex flex-col items-center gap-1 w-24">
                <div className="w-14 h-14 rounded-full border-2 border-yellow-400 flex items-center justify-center" style={{ backgroundColor: "#fef9c3" }}>
                  <span className="text-xl font-bold text-yellow-700">{entries[0]?.initials}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-yellow-600 font-bold">🥇 1st</p>
                  <p className={`text-sm font-bold px-2 py-0.5 rounded-full border ${scoreColour(entries[0]?.best_score ?? 0)}`}>
                    {(entries[0]?.best_score ?? 0).toFixed(1)}
                  </p>
                </div>
                <div className="w-full h-20 rounded-t-lg" style={{ backgroundColor: "#fef08a" }} />
              </div>

              {/* 3rd */}
              <div className="flex flex-col items-center gap-1 w-24">
                <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center">
                  <span className="text-lg font-bold text-amber-700">{entries[2]?.initials}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-amber-700 font-medium">🥉 3rd</p>
                  <p className={`text-sm font-bold px-2 py-0.5 rounded-full border ${scoreColour(entries[2]?.best_score ?? 0)}`}>
                    {(entries[2]?.best_score ?? 0).toFixed(1)}
                  </p>
                </div>
                <div className="w-full h-8 rounded-t-lg" style={{ backgroundColor: "#fde68a" }} />
              </div>

            </div>
          </div>
        )}

        {/* ── Full table ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users size={15} className="text-[#1a5c2a]" />
            <span className="text-sm font-semibold text-gray-800">
              Top Scores — {selectedDrill.name}
            </span>
            {(ageGroup || gender) && (
              <span className="ml-auto text-xs text-gray-500">
                {[ageGroup, gender === "male" ? "Male" : gender === "female" ? "Female" : ""].filter(Boolean).join(" · ")}
              </span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-8 h-4 bg-gray-200 rounded" />
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-16 h-3 bg-gray-200 rounded" />
                    <div className="w-24 h-2.5 bg-gray-100 rounded" />
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-2 text-xs font-semibold text-[#1a5c2a] underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && entries.length === 0 && (
            <div className="px-4 py-10 text-center">
              <Trophy size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-600">No scores yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Be the first to record a score for this drill
                {ageGroup ? ` in ${ageGroup}` : ""}
                {gender ? ` (${gender})` : ""}!
              </p>
              <button
                onClick={() => router.push(`/player/capture?drill=${drillId}`)}
                className="mt-3 text-xs font-semibold text-white px-4 py-2 rounded-full"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                Take the drill now
              </button>
            </div>
          )}

          {/* Rows */}
          {!loading && !error && entries.length > 0 && (
            <div className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const isMe     = entry.user_id === myUserId;
                const { icon, colour } = rankMedal(entry.rank);
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isMe
                        ? "bg-[#f0fdf4] border-l-4 border-l-[#1a5c2a]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 text-center text-sm font-bold ${colour}`}>
                      {icon}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        isMe
                          ? "bg-[#1a5c2a] text-white"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {entry.initials}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMe ? "text-[#1a5c2a]" : "text-gray-800"}`}>
                        {isMe ? "You" : entry.initials}
                      </p>
                      <p className="text-xs text-gray-400">
                        {[entry.age_group, entry.gender ? (entry.gender === "male" ? "Male" : "Female") : ""].filter(Boolean).join(" · ") || "All categories"}
                      </p>
                    </div>

                    {/* Score */}
                    <div className={`px-2.5 py-1 rounded-full border text-sm font-bold ${scoreColour(entry.best_score)}`}>
                      {entry.best_score.toFixed(1)}
                    </div>
                  </div>
                );
              })}

              {/* My rank if outside top 10 */}
              {myRank !== null && !myEntryInTable && (
                <>
                  <div className="px-4 py-1 text-center">
                    <span className="text-xs text-gray-400">· · ·</span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#f0fdf4] border-l-4 border-l-[#1a5c2a]">
                    <div className="w-8 text-center text-sm font-bold text-gray-500">
                      #{myRank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#1a5c2a] flex items-center justify-center flex-shrink-0 text-sm font-bold text-white">
                      {user?.name
                        ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                        : "ME"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a5c2a]">You</p>
                      <p className="text-xs text-gray-400">Your current rank</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Improve CTA ── */}
        {!loading && entries.length > 0 && (
          <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#1a5c2a" }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp size={18} className="text-[#f0b429]" />
              <span className="text-white font-semibold text-sm">Want to climb higher?</span>
            </div>
            <p className="text-white/70 text-xs mb-3">
              Practice the THUTO-recommended exercises, then retest to improve your score and rank.
            </p>
            <button
              onClick={() => router.push(`/player/capture?drill=${drillId}`)}
              className="font-bold text-sm px-5 py-2.5 rounded-full text-[#1a5c2a] transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#f0b429" }}
            >
              Train &amp; Retest
            </button>
          </div>
        )}

        {/* ── Privacy note ── */}
        <p className="text-center text-xs text-gray-400 pb-6">
          Player names shown as initials only to protect privacy.
          <br />
          Scores are verified by THUTO AI analysis.
        </p>

      </div>
    </div>
  );
}
