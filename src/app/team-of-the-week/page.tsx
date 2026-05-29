"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Star, MapPin, Zap, ChevronRight, RefreshCw, Calendar } from "lucide-react";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface TOTWPlayer {
  rank: number;
  user_id: string;
  name: string;
  initials: string;
  position: string;
  sport: string;
  province: string;
  club: string | null;
  vote_count: number;
  potm_count: number;
  thuto_score: number | null;
  peak_level_label: string | null;
  avatar_url: string | null;
  week_label: string;
}

interface WeekSummary {
  week_start: string;
  week_end: string;
  week_label: string;
  total_votes: number;
  total_matches: number;
}

const POSITION_COLORS: Record<string, string> = {
  striker: "#dc2626",
  forward: "#dc2626",
  winger: "#ea580c",
  midfielder: "#2563eb",
  "centre-mid": "#2563eb",
  defender: "#16a34a",
  "centre-back": "#16a34a",
  goalkeeper: "#7c3aed",
  goalkeeper_female: "#7c3aed",
  default: "#1a5c2a",
};

function positionColor(pos: string) {
  const lower = (pos ?? "").toLowerCase();
  for (const [key, col] of Object.entries(POSITION_COLORS)) {
    if (lower.includes(key)) return col;
  }
  return POSITION_COLORS.default;
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

export default function TeamOfTheWeekPage() {
  const [players, setPlayers] = useState<TOTWPlayer[]>([]);
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sport, setSport] = useState("football");

  const SPORTS = ["football", "netball", "rugby", "basketball", "cricket", "athletics"];

  useEffect(() => {
    loadTOTW();
  }, [sport]);

  async function loadTOTW() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API}/team-of-the-week?sport=${sport}`);
      if (res.ok) {
        const json = await res.json();
        setPlayers(safeArray<TOTWPlayer>(json.data ?? json.players ?? json));
        if (json.week) setSummary(json.week);
      } else {
        throw new Error("API error");
      }
    } catch {
      // Fallback: compute from localStorage POTM votes
      const localVotes = JSON.parse(localStorage.getItem("gs_potm_votes") ?? "{}");
      const localMatches = JSON.parse(localStorage.getItem("coach_matches") ?? "[]");
      const voteMap: Record<string, number> = {};

      Object.values(localVotes).forEach((v: unknown) => {
        const vote = v as { voted_for_id: string };
        if (vote.voted_for_id) {
          voteMap[vote.voted_for_id] = (voteMap[vote.voted_for_id] ?? 0) + 1;
        }
      });

      // Build minimal player list from matches
      const fallbackPlayers: TOTWPlayer[] = Object.entries(voteMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 11)
        .map(([id, count], idx) => {
          const match = Array.isArray(localMatches) ? localMatches.find((m: { squad?: { id: string }[] }) =>
            Array.isArray(m.squad) && m.squad.some((p: { id: string }) => p.id === id)
          ) : null;
          const player = match?.squad?.find((p: { id: string; name?: string; position?: string }) => p.id === id);
          return {
            rank: idx + 1,
            user_id: id,
            name: player?.name ?? "Player",
            initials: (player?.name ?? "P").charAt(0),
            position: player?.position ?? "Player",
            sport,
            province: "",
            club: null,
            vote_count: count,
            potm_count: 1,
            thuto_score: null,
            peak_level_label: null,
            avatar_url: null,
            week_label: "This Week",
          };
        });

      if (fallbackPlayers.length > 0) {
        setPlayers(fallbackPlayers);
      } else {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const weekLabel = summary?.week_label ?? players[0]?.week_label ?? "This Week";
  const weekStart = summary?.week_start ? new Date(summary.week_start).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }) : null;
  const weekEnd = summary?.week_end ? new Date(summary.week_end).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }) : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)" }}
        className="px-4 pt-10 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={22} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-green-300">
              GrassRoots Sports
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Team of the Week</h1>
          <div className="flex items-center gap-2 text-green-200 text-sm">
            <Calendar size={14} />
            <span>
              {weekStart && weekEnd ? `${weekStart} – ${weekEnd}` : weekLabel}
            </span>
            {summary && (
              <span className="ml-2 text-xs">
                · {summary.total_votes} votes · {summary.total_matches} matches
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Sport filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPORTS.map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={{
                backgroundColor: sport === s ? "#1a5c2a" : "#fff",
                color: sport === s ? "#fff" : "#374151",
                border: sport === s ? "none" : "1px solid #e5e7eb",
              }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button onClick={loadTOTW}
            className="ml-auto p-2 rounded-full bg-white border border-gray-200 shrink-0">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Top 3 podium */}
        {!loading && !error && players.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {/* 2nd place */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3 text-center mt-6">
              <div className="text-2xl mb-1">🥈</div>
              <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-lg mb-2"
                style={{ backgroundColor: positionColor(players[1].position) }}>
                {players[1].avatar_url
                  ? <img src={players[1].avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                  : players[1].initials}
              </div>
              <p className="text-xs font-black text-gray-900 truncate">{players[1].name}</p>
              <p className="text-[10px] text-gray-400">{players[1].position}</p>
              <p className="text-xs font-black mt-1" style={{ color: "#c8962a" }}>
                {players[1].vote_count} vote{players[1].vote_count !== 1 ? "s" : ""}
              </p>
            </div>

            {/* 1st place */}
            <div className="rounded-2xl p-3 text-center shadow-md"
              style={{ background: "linear-gradient(135deg, #1a5c2a, #2d7a3a)" }}>
              <div className="text-2xl mb-1">🥇</div>
              <div className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-2 border-2 border-amber-400"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                {players[0].avatar_url
                  ? <img src={players[0].avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                  : players[0].initials}
              </div>
              <p className="text-xs font-black text-white truncate">{players[0].name}</p>
              <p className="text-[10px] text-green-200">{players[0].position}</p>
              <p className="text-xs font-black mt-1 text-amber-400">
                {players[0].vote_count} vote{players[0].vote_count !== 1 ? "s" : ""}
              </p>
              {players[0].peak_level_label && (
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-amber-900">
                  {players[0].peak_level_label}
                </span>
              )}
            </div>

            {/* 3rd place */}
            <div className="bg-white rounded-2xl border border-gray-200 p-3 text-center mt-6">
              <div className="text-2xl mb-1">🥉</div>
              <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center text-white font-bold text-lg mb-2"
                style={{ backgroundColor: positionColor(players[2].position) }}>
                {players[2].avatar_url
                  ? <img src={players[2].avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                  : players[2].initials}
              </div>
              <p className="text-xs font-black text-gray-900 truncate">{players[2].name}</p>
              <p className="text-[10px] text-gray-400">{players[2].position}</p>
              <p className="text-xs font-black mt-1" style={{ color: "#c8962a" }}>
                {players[2].vote_count} vote{players[2].vote_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Full squad list */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <Trophy size={32} className="text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-700 mb-1">No votes yet this week</h3>
            <p className="text-sm text-gray-400 mb-4">
              Team of the Week is built from Player of the Match votes after each fixture.
              Play a match and vote for your teammates!
            </p>
            <Link href="/coach/matches"
              className="inline-block px-5 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "#1a5c2a" }}>
              Log a Match
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500 px-1">
              Full Starting XI
            </h2>
            {players.map((player, idx) => (
              <Link
                key={player.user_id}
                href={`/arena/profile/${player.user_id}`}
                className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm">

                {/* Rank */}
                <div className="w-6 text-center shrink-0">
                  {idx < 3
                    ? <span className="text-base">{["🥇","🥈","🥉"][idx]}</span>
                    : <span className="text-xs font-black text-gray-400">{player.rank}</span>}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: positionColor(player.position) }}>
                  {player.avatar_url
                    ? <img src={player.avatar_url} className="w-full h-full object-cover rounded-xl" alt="" />
                    : player.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{player.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{player.position}</span>
                    {player.province && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin size={10} />
                          {player.province}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Votes + THUTO */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={12} style={{ color: "#c8962a" }} />
                    <span className="text-sm font-black text-gray-900">{player.vote_count}</span>
                  </div>
                  {player.thuto_score && (
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Zap size={10} className="text-green-600" />
                      <span className="text-[10px] font-bold text-green-700">{Math.round(player.thuto_score)}</span>
                    </div>
                  )}
                </div>

                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <p className="text-sm font-bold text-gray-700 mb-1">Want to appear here?</p>
          <p className="text-xs text-gray-400 mb-3">
            Play matches, get voted for by your teammates, and climb the team of the week rankings.
          </p>
          <Link href="/talent-leaderboard"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white text-sm"
            style={{ backgroundColor: "#1a5c2a" }}>
            <Zap size={14} /> View THUTO Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
