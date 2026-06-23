"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trophy, Filter, Share2, ChevronUp, Star, MapPin, Zap } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_id: string | null;
  initials: string;
  position: string | null;
  sport: string | null;
  province: string | null;
  age_group: string | null;
  peak_level: string;
  peak_level_label: string;
  projected_score: number;
  upside_rating: number;
  upside_label: string;
  percentile: number;
  comparable_name: string | null;
  data_quality: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const AGE_GROUPS: Record<string, string> = {
  under_13: "Under 13",
  "13_17":  "13 – 17",
  "18_25":  "18 – 25",
  "26_plus": "26+",
};

const SPORTS = [
  "football", "rugby", "athletics", "netball", "basketball",
  "cricket", "swimming", "tennis", "volleyball", "hockey",
];

const PEAK_COLOURS: Record<string, string> = {
  continental:        "bg-amber-500 text-amber-950",
  sadc_international: "bg-green-600 text-white",
  premier_league:     "bg-emerald-700 text-white",
  division_1:         "bg-blue-700 text-white",
  division_2:         "bg-slate-600 text-white",
  amateur:            "bg-gray-500 text-white",
};

const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= rating ? "fill-amber-400 text-amber-400" : "fill-transparent text-gray-600"}`}
        />
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}

// ── WhatsApp share helper ─────────────────────────────────────────────────────

function shareToWhatsApp(entry: LeaderboardEntry) {
  const text = encodeURIComponent(
    `🏆 Zimbabwe Talent Leaderboard\n\n` +
    `Rank #${entry.rank}: ${entry.initials}\n` +
    `${entry.position ?? "Player"} · ${entry.sport ?? "Football"}\n` +
    `${entry.province ?? "Zimbabwe"}\n` +
    `Peak Level: ${entry.peak_level_label}\n` +
    `THUTO Score: ${Number(entry.projected_score).toFixed(1)}/100\n\n` +
    `Discovered on GrassRoots Sports 🇿🇼\n` +
    `grassrootssports.live/talent-leaderboard`
  );
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TalentLeaderboardPage() {
  const [entries, setEntries]       = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Filters
  const [province, setProvince]     = useState("");
  const [position, setPosition]     = useState("");
  const [sport, setSport]           = useState("");
  const [ageGroup, setAgeGroup]     = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (province) params.set("province", province);
      if (position) params.set("position", position);
      if (sport)    params.set("sport", sport);
      if (ageGroup) params.set("age_group", ageGroup);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/talent-leaderboard?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const json = await res.json();
      setEntries(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [province, position, sport, ageGroup]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const activeFilters = [province, position, sport, ageGroup].filter(Boolean).length;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#1a5c2a",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b429]/20 border border-[#f0b429]/30">
              <Trophy className="h-7 w-7 text-[#f0b429]" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]/80">
            GrassRoots Sports
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">
            🏆 Talent Leaderboard
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Zimbabwe&apos;s top THUTO-predicted talents · Ranked by AI score
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              showFilters
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-[#f0b429] px-1.5 py-0.5 text-[10px] font-bold text-[#1a3a1a]">
                {activeFilters}
              </span>
            )}
          </button>

          {activeFilters > 0 && (
            <button
              onClick={() => { setProvince(""); setPosition(""); setSport(""); setAgeGroup(""); }}
              className="text-xs text-white/40 hover:text-white/70 underline"
            >
              Clear all
            </button>
          )}

          <span className="ml-auto text-xs text-white/30">
            {!loading && `${entries.length} talent${entries.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-5 rounded-2xl border border-[#f0b429]/10 bg-white/5 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Province */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">
                  Province
                </label>
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

              {/* Age Group */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">
                  Age Group
                </label>
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

              {/* Sport */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">
                  Sport
                </label>
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

              {/* Position */}
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-white/50">
                  Position
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value.toUpperCase())}
                  placeholder="e.g. ST, CM, CB"
                  maxLength={5}
                  className="w-full rounded-lg bg-white/10 border border-[#f0b429]/10 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f0b429]/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && <Skeleton />}

        {!loading && error && (
          <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-8 text-center">
            <p className="text-sm text-white/50 mb-4">Could not load leaderboard.</p>
            <button
              onClick={fetchLeaderboard}
              className="rounded-xl bg-[#f0b429] px-5 py-2 text-sm font-bold text-[#1a3a1a]"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="rounded-2xl bg-white/5 border border-[#f0b429]/10 p-10 text-center">
            <div className="text-4xl mb-3">🔮</div>
            <h3 className="font-semibold text-white mb-1">No results yet</h3>
            <p className="text-sm text-white/50 max-w-xs mx-auto">
              {activeFilters > 0
                ? "Try removing some filters — no players match all criteria yet."
                : "Players need at least 3 training sessions for THUTO to generate a prediction."}
            </p>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="space-y-3">
            {entries.map((entry) => (
              <LeaderboardCard
                key={entry.user_id}
                entry={entry}
              />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-10 text-center space-y-4">
          <p className="text-xs text-white/30">
            Rankings update every 6 hours · Powered by the THUTO Prediction Engine
          </p>
          <a
            href="https://grassrootssports.live"
            className="inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
          >
            Join GrassRoots Sports
          </a>
          <p className="text-xs text-white/30">Free for all Zimbabwean athletes</p>
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard Card ──────────────────────────────────────────────────────────

function LeaderboardCard({ entry }: { entry: LeaderboardEntry }) {
  const [expanded, setExpanded] = useState(false);
  const medalOrRank = RANK_MEDALS[entry.rank] ?? `#${entry.rank}`;
  const badgeClass = PEAK_COLOURS[entry.peak_level] ?? PEAK_COLOURS["amateur"];
  const score = Number(entry.projected_score).toFixed(1);

  return (
    <div className="rounded-2xl border border-[#f0b429]/10 bg-white/5 backdrop-blur-sm overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
      >
        {/* Rank */}
        <div className="w-10 text-center flex-shrink-0">
          <span className="text-lg">{medalOrRank}</span>
        </div>

        {/* Avatar placeholder */}
        <div className="h-11 w-11 flex-shrink-0 rounded-full bg-white/10 border border-[#f0b429]/20 flex items-center justify-center">
          <span className="text-sm font-bold text-white/70">{entry.initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">{entry.initials}</span>
            {entry.position && (
              <span className="text-xs font-semibold text-[#f0b429] bg-[#f0b429]/10 px-1.5 py-0.5 rounded">
                {entry.position}
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeClass}`}
            >
              {entry.peak_level_label}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-white/50">
            {entry.province && (
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" /> {entry.province}
              </span>
            )}
            {entry.sport && (
              <span className="capitalize">{entry.sport}</span>
            )}
            {entry.age_group && AGE_GROUPS[entry.age_group] && (
              <span>{AGE_GROUPS[entry.age_group]}</span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xl font-extrabold text-[#f0b429]">{score}</div>
          <div className="text-[10px] text-white/40">/ 100</div>
        </div>

        {/* Expand chevron */}
        <ChevronUp
          className={`h-4 w-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${
            expanded ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#f0b429]/10 px-4 py-4 space-y-3">
          {/* Stars + percentile */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 mb-1">Upside Rating</p>
              <StarRow rating={entry.upside_rating} />
              <p className="text-xs text-amber-400 mt-0.5">{entry.upside_label}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 mb-1">Platform Percentile</p>
              <p className="text-lg font-extrabold text-white">{entry.percentile}<span className="text-xs text-white/40">th</span></p>
            </div>
          </div>

          {/* Score bar */}
          <div>
            <div className="flex justify-between text-[10px] text-white/40 mb-1">
              <span>THUTO Score</span>
              <span>{score} / 100</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f0b429] to-green-400 transition-all duration-700"
                style={{ width: `${Math.min(Number(entry.projected_score), 100)}%` }}
              />
            </div>
          </div>

          {/* Comparable */}
          {entry.comparable_name && (
            <div className="rounded-xl bg-green-950/30 border border-green-800/30 px-3 py-2.5">
              <p className="text-[10px] text-green-400 uppercase tracking-wide mb-0.5">
                <Zap className="inline h-3 w-3 mr-0.5" /> Comparable Player
              </p>
              <p className="text-sm font-semibold text-white">{entry.comparable_name}</p>
              <p className="text-[10px] text-green-400 italic">(Developmental comparison)</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Link
              href={`/player/public/${entry.user_id}`}
              className="flex-1 text-center rounded-xl bg-[#f0b429] px-3 py-2 text-xs font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
            >
              View Profile
            </Link>
            <button
              onClick={() => shareToWhatsApp(entry)}
              className="flex items-center gap-1.5 rounded-xl bg-[#25d366] px-3 py-2 text-xs font-bold text-white hover:bg-[#25d366]/90 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
