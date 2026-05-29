"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy, Star, MapPin, Zap, ChevronRight, Users, Calendar,
  CheckCircle2, ArrowRight, Shield, Target, Globe
} from "lucide-react";
import { safeArray } from "@/lib/safe-array";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

interface GUSelection {
  rank: number;
  user_id: string;
  name: string;
  initials: string;
  position: string;
  sport: string;
  province: string;
  club: string | null;
  projected_score: number;
  peak_level_label: string | null;
  avatar_url: string | null;
  potm_count: number;
  selected: boolean;
}

interface ShowcaseEvent {
  id: string;
  title: string;
  opponent: string;
  date: string;
  venue: string;
  sport: string;
  status: "upcoming" | "completed" | "cancelled";
}

interface QuarterSummary {
  quarter: string;
  year: number;
  label: string;
  selections_count: number;
  cutoff_score: number;
  event_date: string | null;
}

const PSL_CLUBS = [
  { name: "Dynamos FC", badge: "🦁", city: "Harare" },
  { name: "Highlanders FC", badge: "⚫", city: "Bulawayo" },
  { name: "CAPS United", badge: "🟢", city: "Harare" },
  { name: "FC Platinum", badge: "💎", city: "Zvishavane" },
];

const SPORTS = ["football", "netball", "rugby", "basketball", "cricket", "athletics"];

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
        <div className="w-12 h-6 bg-gray-100 rounded-full" />
      </div>
    </div>
  );
}

export default function GrassrootsUnitedPage() {
  const [selections, setSelections] = useState<GUSelection[]>([]);
  const [quarter, setQuarter] = useState<QuarterSummary | null>(null);
  const [events, setEvents] = useState<ShowcaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState("football");
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ player_name: "", coach_name: "", club: "", province: "", position: "", sport: "football", message: "" });
  const [applyStatus, setApplyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  useEffect(() => {
    loadData();
  }, [sport]);

  async function loadData() {
    setLoading(true);
    try {
      const [selectionsRes, eventsRes] = await Promise.allSettled([
        fetch(`${API}/grassroots-united/selections?sport=${sport}`),
        fetch(`${API}/grassroots-united/events`),
      ]);

      if (selectionsRes.status === "fulfilled" && selectionsRes.value.ok) {
        const json = await selectionsRes.value.json();
        setSelections(safeArray<GUSelection>(json.data ?? json));
        if (json.quarter) setQuarter(json.quarter);
      } else {
        // Fallback: use THUTO leaderboard
        const lbRes = await fetch(`${API}/talent-leaderboard?sport=${sport}&per_page=20`);
        if (lbRes.ok) {
          const lbJson = await lbRes.json();
          const entries = safeArray<{
            id?: string; user_id?: string; initials?: string; sport?: string;
            province?: string; projected_score?: number; peak_level_label?: string;
            position?: string;
          }>(lbJson.data ?? lbJson);
          setSelections(entries.slice(0, 20).map((e, idx) => ({
            rank: idx + 1,
            user_id: e.id ?? e.user_id ?? `fallback-${idx}`,
            name: e.initials ?? "Player",
            initials: e.initials ?? "P",
            position: e.position ?? "Player",
            sport: e.sport ?? sport,
            province: e.province ?? "",
            club: null,
            projected_score: e.projected_score ?? 0,
            peak_level_label: e.peak_level_label ?? null,
            avatar_url: null,
            potm_count: 0,
            selected: true,
          })));
        }
      }

      if (eventsRes.status === "fulfilled" && eventsRes.value.ok) {
        const evJson = await eventsRes.value.json();
        setEvents(safeArray<ShowcaseEvent>(evJson.data ?? evJson));
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault();
    setApplyStatus("submitting");
    try {
      const res = await fetch(`${API}/grassroots-united/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applyForm),
      });
      if (res.ok || res.status === 201) {
        setApplyStatus("success");
      } else {
        setApplyStatus("error");
      }
    } catch {
      setApplyStatus("error");
    }
  }

  const nextEvent = events.find((ev) => ev.status === "upcoming");
  const pastEvents = events.filter((ev) => ev.status === "completed");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Hero Header */}
      <div style={{ background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)" }}
        className="px-4 pt-10 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={20} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-green-300">
              GrassRoots Sports
            </span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">
            GrassRoots United
          </h1>
          <p className="text-green-200 text-sm leading-relaxed mb-4">
            Every quarter, the top 20 players on the THUTO leaderboard earn selection
            to GrassRoots United — our national showcase squad. Selected players compete
            in showcase events against Zimbabwe Premier Soccer League clubs.
          </p>

          <div className="flex flex-wrap gap-3 mt-2">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <Trophy size={14} className="text-amber-400" />
              <span className="text-xs font-bold text-white">Top 20 by THUTO Score</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <Calendar size={14} className="text-green-300" />
              <span className="text-xs font-bold text-white">Quarterly Selection</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 rounded-xl px-3 py-1.5">
              <Globe size={14} className="text-blue-300" />
              <span className="text-xs font-bold text-white">PSL Showcase Events</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* PSL opponents */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
            Showcase Opponents
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PSL_CLUBS.map((club) => (
              <div key={club.name}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <span className="text-xl">{club.badge}</span>
                <div>
                  <p className="text-xs font-black text-gray-900">{club.name}</p>
                  <p className="text-[10px] text-gray-400">{club.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next event banner */}
        {nextEvent && (
          <div className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #c8962a, #a07020)" }}>
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-100 mb-1">
              Next Showcase Event
            </p>
            <h3 className="font-black text-white text-base">{nextEvent.title}</h3>
            <div className="flex items-center gap-4 mt-2 text-amber-100 text-xs">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {new Date(nextEvent.date).toLocaleDateString("en-ZW", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {nextEvent.venue}
              </span>
            </div>
          </div>
        )}

        {/* Quarter summary */}
        {quarter && (
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-4 py-3">
            <div>
              <p className="text-xs font-black text-gray-900">{quarter.label}</p>
              <p className="text-[11px] text-gray-500">{quarter.selections_count} players selected</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Min. THUTO score</p>
              <p className="text-sm font-black" style={{ color: "#1a5c2a" }}>{quarter.cutoff_score}</p>
            </div>
          </div>
        )}

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
        </div>

        {/* Selections list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-500">
              Current Quarter Selections
            </h2>
            <span className="text-xs text-gray-400">{selections.length} / 20</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : selections.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <Trophy size={32} className="text-gray-300 mx-auto mb-3" />
              <h3 className="font-bold text-gray-700 mb-1">No selections yet</h3>
              <p className="text-sm text-gray-400 mb-4">
                Selections are announced at the start of each quarter based on THUTO leaderboard rankings.
              </p>
              <Link href="/talent-leaderboard"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white text-sm"
                style={{ backgroundColor: "#1a5c2a" }}>
                <Zap size={14} /> View Leaderboard
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {selections.map((player, idx) => (
                <Link
                  key={player.user_id}
                  href={`/arena/profile/${player.user_id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 p-4 transition-all hover:border-gray-300 hover:shadow-sm">

                  {/* Rank */}
                  <div className="w-6 text-center shrink-0">
                    {idx < 3
                      ? <span className="text-base">{["🥇", "🥈", "🥉"][idx]}</span>
                      : <span className="text-xs font-black text-gray-400">{player.rank}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: "#1a5c2a" }}>
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

                  {/* Score + peak */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap size={12} className="text-green-600" />
                      <span className="text-sm font-black text-gray-900">
                        {Math.round(player.projected_score)}
                      </span>
                    </div>
                    {player.peak_level_label && (
                      <p className="text-[10px] text-gray-400 mt-0.5 max-w-[90px] text-right truncate">
                        {player.peak_level_label}
                      </p>
                    )}
                  </div>

                  {/* Selected badge */}
                  {player.selected && (
                    <CheckCircle2 size={16} style={{ color: "#1a5c2a" }} className="shrink-0" />
                  )}

                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* How selection works */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-black text-gray-900">How Selection Works</h3>
          <div className="space-y-3">
            {[
              { icon: Zap, label: "Train & Log Sessions", desc: "Every training session logged in the app builds your THUTO AI score through biomechanics analysis." },
              { icon: Star, label: "Get Player of the Match Votes", desc: "Earn POTM votes from teammates after each fixture to boost your weekly ranking." },
              { icon: Trophy, label: "Reach the Top 20", desc: "The 20 highest-ranked players on the THUTO leaderboard each quarter earn automatic selection." },
              { icon: Shield, label: "Compete at the Showcase", desc: "Selected players represent GrassRoots United in showcase events against PSL clubs." },
              { icon: Target, label: "Earn Recognition", desc: "Strong performances are reported directly to PSL club academies and national selectors." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#f0fdf4" }}>
                  <Icon size={16} style={{ color: "#1a5c2a" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past events */}
        {pastEvents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
              Past Showcase Events
            </h3>
            <div className="space-y-2">
              {pastEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                    <p className="text-xs text-gray-400">{ev.venue}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-500">
                      {new Date(ev.date).toLocaleDateString("en-ZW", { month: "short", year: "numeric" })}
                    </span>
                    <div className="mt-0.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coach nomination form */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setApplyOpen((v) => !v)}
            className="w-full flex items-center justify-between p-5 text-left">
            <div>
              <p className="text-sm font-black text-gray-900">Nominate a Player</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Coaches can nominate promising players for consideration
              </p>
            </div>
            <div className="p-2 rounded-xl border border-gray-200">
              <ArrowRight size={16} className={`text-gray-400 transition-transform ${applyOpen ? "rotate-90" : ""}`} />
            </div>
          </button>

          {applyOpen && (
            <div className="px-5 pb-5 border-t border-gray-100">
              {applyStatus === "success" ? (
                <div className="py-6 text-center">
                  <CheckCircle2 size={32} className="mx-auto mb-2" style={{ color: "#1a5c2a" }} />
                  <p className="font-bold text-gray-900">Nomination Submitted!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    We will review your nomination and follow up within 5 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={submitApplication} className="space-y-3 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Player Name</label>
                      <input
                        required
                        type="text"
                        value={applyForm.player_name}
                        onChange={(e) => setApplyForm((f) => ({ ...f, player_name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Your Name (Coach)</label>
                      <input
                        required
                        type="text"
                        value={applyForm.coach_name}
                        onChange={(e) => setApplyForm((f) => ({ ...f, coach_name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Coach name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Club / School</label>
                      <input
                        type="text"
                        value={applyForm.club}
                        onChange={(e) => setApplyForm((f) => ({ ...f, club: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Club or school"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Province</label>
                      <select
                        required
                        value={applyForm.province}
                        onChange={(e) => setApplyForm((f) => ({ ...f, province: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="">Select province</option>
                        {["Harare", "Bulawayo", "Manicaland", "Midlands", "Masvingo",
                          "Matabeleland North", "Matabeleland South", "Mashonaland Central",
                          "Mashonaland East", "Mashonaland West"].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        value={applyForm.position}
                        onChange={(e) => setApplyForm((f) => ({ ...f, position: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g. Striker"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Sport</label>
                      <select
                        value={applyForm.sport}
                        onChange={(e) => setApplyForm((f) => ({ ...f, sport: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        {SPORTS.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Why should this player be selected?
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={applyForm.message}
                      onChange={(e) => setApplyForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      placeholder="Describe the player's strengths, achievements, and potential..."
                    />
                  </div>
                  {applyStatus === "error" && (
                    <p className="text-xs text-red-600 font-medium">
                      Submission failed. Please try again or email us at info@grassrootssports.live
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={applyStatus === "submitting"}
                    className="w-full py-3 rounded-xl font-black text-white text-sm"
                    style={{ backgroundColor: applyStatus === "submitting" ? "#d1d5db" : "#1a5c2a" }}>
                    {applyStatus === "submitting" ? "Submitting..." : "Submit Nomination"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* CTA to leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "#f0fdf4" }}>
            <Users size={24} style={{ color: "#1a5c2a" }} />
          </div>
          <p className="text-sm font-black text-gray-900 mb-1">Want to be selected?</p>
          <p className="text-xs text-gray-400 mb-4">
            Train consistently, log your sessions, and climb the THUTO leaderboard.
            The top 20 earn automatic selection each quarter.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/talent-leaderboard"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-white text-sm"
              style={{ backgroundColor: "#1a5c2a" }}>
              <Zap size={14} /> THUTO Leaderboard
            </Link>
            <Link href="/team-of-the-week"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold text-sm border border-gray-200 text-gray-700 bg-white">
              <Trophy size={14} /> Team of the Week
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
