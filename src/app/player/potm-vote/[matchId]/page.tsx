"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, CheckCircle2, Star, Loader2, Users, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface SquadPlayer {
  id: string;
  name: string;
  position: string;
  avatar_url: string | null;
}

interface MatchInfo {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  sport: string;
  match_date: string;
}

type Phase = "loading" | "vote" | "already_voted" | "submitted" | "closed" | "error";

export default function PotmVotePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [phase, setPhase] = useState<Phase>("loading");
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    loadData();
  }, [hasHydrated, user]);

  async function loadData() {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Fetch match info + existing vote status + squad in parallel
      const [matchRes, voteRes, squadRes] = await Promise.allSettled([
        fetch(`${API}/matches/${matchId}`, { headers }),
        fetch(`${API}/matches/${matchId}/potm-vote/status`, { headers }),
        fetch(`${API}/coach/squad`, { headers }),
      ]);

      // Match info
      if (matchRes.status === "fulfilled" && matchRes.value.ok) {
        const mj = await matchRes.value.json();
        setMatch(mj.data ?? mj);
      } else {
        // Use localStorage fallback
        const stored = localStorage.getItem("coach_matches");
        if (stored) {
          const matches = JSON.parse(stored);
          const m = Array.isArray(matches) ? matches.find((x: MatchInfo) => String(x.id) === String(matchId)) : null;
          if (m) setMatch(m);
        }
      }

      // Vote status
      if (voteRes.status === "fulfilled" && voteRes.value.ok) {
        const vj = await voteRes.value.json();
        if (vj.already_voted) {
          setWinnerName(vj.current_leader ?? null);
          setPhase("already_voted");
          return;
        }
        if (vj.closed) {
          setWinnerName(vj.winner ?? null);
          setPhase("closed");
          return;
        }
      }

      // Squad
      if (squadRes.status === "fulfilled" && squadRes.value.ok) {
        const sj = await squadRes.value.json();
        const raw = sj.data?.data ?? sj.data ?? sj;
        const players = safeArray<SquadPlayer>(raw).filter((p) => String(p.id) !== String(user?.id));
        setSquad(players);
      } else {
        // Fallback squad from localStorage
        const ls = localStorage.getItem("gs_squad_cache");
        if (ls) {
          const parsed = JSON.parse(ls);
          if (Array.isArray(parsed)) {
            setSquad(parsed.filter((p: SquadPlayer) => String(p.id) !== String(user?.id)));
          }
        }
      }

      setPhase("vote");
    } catch {
      setPhase("error");
    }
  }

  async function submitVote() {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/matches/${matchId}/potm-vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ voted_for_id: selected }),
      });

      if (res.ok || res.status === 422) {
        // 422 = already voted — treat as success
        const votedPlayer = squad.find((p) => p.id === selected);
        setWinnerName(votedPlayer?.name ?? null);
        setPhase("submitted");
      } else {
        // Save to localStorage as fallback
        const votes = JSON.parse(localStorage.getItem("gs_potm_votes") ?? "{}");
        votes[matchId] = { voted_for_id: selected, voted_at: new Date().toISOString() };
        localStorage.setItem("gs_potm_votes", JSON.stringify(votes));
        const votedPlayer = squad.find((p) => p.id === selected);
        setWinnerName(votedPlayer?.name ?? null);
        setPhase("submitted");
      }
    } catch {
      // Offline fallback
      const votes = JSON.parse(localStorage.getItem("gs_potm_votes") ?? "{}");
      votes[matchId] = { voted_for_id: selected, voted_at: new Date().toISOString() };
      localStorage.setItem("gs_potm_votes", JSON.stringify(votes));
      const votedPlayer = squad.find((p) => p.id === selected);
      setWinnerName(votedPlayer?.name ?? null);
      setPhase("submitted");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasHydrated) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}
        className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3">
        <Link href="/player" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#1a5c2a" }}>
            <Trophy size={14} className="text-amber-400" />
          </div>
          <span className="font-bold text-gray-900">Player of the Match</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Match banner */}
        {match && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              {match.sport?.toUpperCase() ?? "MATCH"} · {new Date(match.match_date).toLocaleDateString("en-ZW", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-base font-black text-gray-900">{match.home_team}</span>
              <span className="text-2xl font-black" style={{ color: "#1a5c2a" }}>
                {match.home_score} – {match.away_score}
              </span>
              <span className="text-base font-black text-gray-900">{match.away_team}</span>
            </div>
          </div>
        )}

        {/* ── Phase: loading ── */}
        {phase === "loading" && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: "#1a5c2a" }} />
            <p className="text-sm text-gray-500 font-medium">Loading squad...</p>
          </div>
        )}

        {/* ── Phase: error ── */}
        {phase === "error" && (
          <div className="bg-white rounded-2xl border border-red-200 p-6 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Could not load vote</p>
            <p className="text-sm text-gray-500 mt-1">Check your connection and try again.</p>
            <button onClick={loadData}
              className="mt-4 px-5 py-2 rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "#1a5c2a" }}>
              Retry
            </button>
          </div>
        )}

        {/* ── Phase: vote ── */}
        {phase === "vote" && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Star size={16} style={{ color: "#c8962a" }} />
                <p className="font-bold text-gray-900">Who deserves Man of the Match?</p>
              </div>
              <p className="text-xs text-gray-500">Vote for one teammate. Votes close when the coach closes the poll.</p>
            </div>

            {squad.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Users size={28} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No squad members found.</p>
                <p className="text-xs text-gray-400 mt-1">Ask your coach to add players to the squad first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {squad.map((player) => {
                  const isSelected = selected === player.id;
                  return (
                    <button
                      key={player.id}
                      onClick={() => setSelected(player.id)}
                      className="w-full flex items-center gap-3 bg-white rounded-2xl border p-4 transition-all"
                      style={{
                        borderColor: isSelected ? "#1a5c2a" : "#e5e7eb",
                        backgroundColor: isSelected ? "#f0fdf4" : "#fff",
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: isSelected ? "#1a5c2a" : "#6b7280" }}>
                        {player.avatar_url
                          ? <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover rounded-xl" />
                          : player.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-gray-900 text-sm">{player.name}</p>
                        <p className="text-xs text-gray-500">{player.position || "Player"}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={20} style={{ color: "#1a5c2a" }} className="shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={submitVote}
              disabled={!selected || submitting}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm tracking-wide transition-all"
              style={{
                backgroundColor: selected ? "#1a5c2a" : "#d1d5db",
                cursor: selected ? "pointer" : "not-allowed",
              }}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </span>
              ) : "Cast My Vote"}
            </button>
          </>
        )}

        {/* ── Phase: submitted ── */}
        {(phase === "submitted" || phase === "already_voted") && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#f0fdf4" }}>
              <Trophy size={32} style={{ color: "#1a5c2a" }} />
            </div>
            <h2 className="text-lg font-black text-gray-900 mb-1">
              {phase === "already_voted" ? "Already Voted!" : "Vote Cast!"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {winnerName
                ? `You voted for ${winnerName}. Results will be announced when all votes are in.`
                : "Your vote has been recorded. Results coming soon!"}
            </p>
            <Link href="/player"
              className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "#1a5c2a" }}>
              Back to Hub
            </Link>
          </div>
        )}

        {/* ── Phase: closed / results ── */}
        {phase === "closed" && (
          <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center"
            style={{ backgroundColor: "#fffbeb" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#fef3c7" }}>
              <Trophy size={32} style={{ color: "#c8962a" }} />
            </div>
            <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "#c8962a" }}>
              Player of the Match
            </p>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              {winnerName ?? "Results Pending"}
            </h2>
            <p className="text-sm text-gray-500">Voted by their teammates.</p>
            <Link href="/arena"
              className="inline-block mt-4 px-6 py-2.5 rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "#1a5c2a" }}>
              See Arena Feed
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
