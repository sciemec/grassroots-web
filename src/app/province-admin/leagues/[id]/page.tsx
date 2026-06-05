"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";
import {
  ArrowLeft,
  Users,
  Calendar,
  Trophy,
  Plus,
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Standing {
  club_id: number;
  club_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

interface Club {
  id: number;
  name: string;
  suburb: string;
}

interface Fixture {
  id: number;
  home_club_id: number;
  away_club_id: number;
  home_club_name: string;
  away_club_name: string;
  match_date: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "completed" | "postponed" | "cancelled";
}

interface League {
  id: number;
  name: string;
  sport: string;
  season: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  zone_name: string | null;
}

interface LeagueDetail {
  league: League;
  clubs: Club[];
  fixtures: Fixture[];
  standings: Standing[];
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const FIXTURE_STATUS_ICON: Record<string, React.ReactNode> = {
  scheduled:  <Clock className="w-4 h-4 text-amber-400" />,
  completed:  <CheckCircle2 className="w-4 h-4 text-green-400" />,
  postponed:  <XCircle className="w-4 h-4 text-orange-400" />,
  cancelled:  <XCircle className="w-4 h-4 text-red-400" />,
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function LeagueDetailPage() {
  const { id = "" } = useParams<{ id: string }>() ?? {};
  const { token } = useAuthStore();
  const router = useRouter();

  const [data, setData] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"standings" | "fixtures" | "clubs">("standings");

  // Add-club state
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [addClubId, setAddClubId] = useState("");
  const [addingClub, setAddingClub] = useState(false);
  const [showAddClub, setShowAddClub] = useState(false);

  // Schedule fixture state
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedForm, setSchedForm] = useState({
    home_club_id: "",
    away_club_id: "",
    match_date:   "",
    venue:        "",
  });
  const [scheduling, setScheduling] = useState(false);

  // Record result state — which fixture is being edited
  const [resultFixture, setResultFixture] = useState<Fixture | null>(null);
  const [resultScores, setResultScores] = useState({ home: "", away: "" });
  const [savingResult, setSavingResult] = useState(false);

  // WhatsApp state
  const [whatsappSending, setWhatsappSending] = useState<number | null>(null);
  const [whatsappMsg, setWhatsappMsg] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadData = async () => {
    try {
      const res = await fetch(`${API}/province-admin/leagues/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Failed to load league.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllClubs = async () => {
    try {
      const res = await fetch(`${API}/province-admin/clubs?status=active`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setAllClubs(safeArray<Club>(json));
    } catch { /* silent */ }
  };

  useEffect(() => { loadData(); }, [id, token]);
  useEffect(() => { if (tab === "clubs") loadAllClubs(); }, [tab]);

  // ── Add club to league ────────────────────────────────────────────────────
  const handleAddClub = async () => {
    if (!addClubId) return;
    setAddingClub(true);
    try {
      await fetch(`${API}/province-admin/leagues/${id}/clubs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ club_id: parseInt(addClubId) }),
      });
      setAddClubId("");
      setShowAddClub(false);
      await loadData();
    } finally {
      setAddingClub(false);
    }
  };

  const handleRemoveClub = async (clubId: number) => {
    if (!confirm("Remove this club from the league?")) return;
    await fetch(`${API}/province-admin/leagues/${id}/clubs/${clubId}`, { method: "DELETE", headers });
    await loadData();
  };

  // ── Schedule fixture ──────────────────────────────────────────────────────
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedForm.home_club_id || !schedForm.away_club_id) return;
    setScheduling(true);
    try {
      const body: Record<string, unknown> = {
        home_club_id: parseInt(schedForm.home_club_id),
        away_club_id: parseInt(schedForm.away_club_id),
      };
      if (schedForm.match_date) body.match_date = schedForm.match_date;
      if (schedForm.venue)      body.venue      = schedForm.venue;

      await fetch(`${API}/province-admin/leagues/${id}/fixtures`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      setSchedForm({ home_club_id: "", away_club_id: "", match_date: "", venue: "" });
      setShowSchedule(false);
      await loadData();
    } finally {
      setScheduling(false);
    }
  };

  // ── Record result ─────────────────────────────────────────────────────────
  const handleSaveResult = async () => {
    if (!resultFixture) return;
    setSavingResult(true);
    try {
      await fetch(`${API}/province-admin/fixtures/${resultFixture.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          home_score: parseInt(resultScores.home),
          away_score: parseInt(resultScores.away),
          status: "completed",
        }),
      });
      setResultFixture(null);
      await loadData();
    } finally {
      setSavingResult(false);
    }
  };

  // ── Send WhatsApp reminder ────────────────────────────────────────────────
  const handleWhatsApp = async (fixtureId: number) => {
    setWhatsappSending(fixtureId);
    setWhatsappMsg("");
    try {
      const res = await fetch(`${API}/province-admin/fixtures/${fixtureId}/whatsapp`, {
        method: "POST",
        headers,
      });
      const json = await res.json();
      setWhatsappMsg(json.message);
    } catch {
      setWhatsappMsg("Failed to send WhatsApp message.");
    } finally {
      setWhatsappSending(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="h-10 w-48 rounded-xl bg-white/10 animate-pulse mb-6" />
      <div className="h-64 rounded-2xl bg-white/5 animate-pulse" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <p className="text-red-300">{error || "League not found."}</p>
    </div>
  );

  const { league, clubs, fixtures, standings } = data;

  // Clubs not yet enrolled (for add-club dropdown)
  const enrolledIds = new Set(clubs.map((c) => c.id));
  const unenrolled = allClubs.filter((c) => !enrolledIds.has(c.id));

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/province-admin/leagues")}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{league.name}</h1>
          <p className="text-white/50 text-sm capitalize">
            {league.sport} · Season {league.season}
            {league.zone_name ? ` · ${league.zone_name}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
        {(["standings", "fixtures", "clubs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-[#f0b429] text-[#1a3a1a]"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── STANDINGS TAB ────────────────────────────────────────────────── */}
      {tab === "standings" && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {standings.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <p className="text-white/50 text-sm">No results yet. Record fixture results to see standings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="text-left px-4 py-3">#</th>
                    <th className="text-left px-4 py-3">Club</th>
                    <th className="px-3 py-3">P</th>
                    <th className="px-3 py-3">W</th>
                    <th className="px-3 py-3">D</th>
                    <th className="px-3 py-3">L</th>
                    <th className="px-3 py-3">GD</th>
                    <th className="px-3 py-3 font-bold text-[#f0b429]">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr
                      key={row.club_id}
                      className={`border-b border-white/5 ${i === 0 ? "bg-[#f0b429]/10" : ""}`}
                    >
                      <td className="px-4 py-3 text-white/40">{i + 1}</td>
                      <td className="px-4 py-3 text-white font-medium">{row.club_name}</td>
                      <td className="px-3 py-3 text-white/70 text-center">{row.played}</td>
                      <td className="px-3 py-3 text-green-400 text-center">{row.won}</td>
                      <td className="px-3 py-3 text-white/50 text-center">{row.drawn}</td>
                      <td className="px-3 py-3 text-red-400 text-center">{row.lost}</td>
                      <td className="px-3 py-3 text-white/70 text-center">
                        {row.gd > 0 ? `+${row.gd}` : row.gd}
                      </td>
                      <td className="px-3 py-3 text-[#f0b429] font-bold text-center">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── FIXTURES TAB ─────────────────────────────────────────────────── */}
      {tab === "fixtures" && (
        <div className="space-y-4">
          {/* Schedule new fixture */}
          <button
            onClick={() => setShowSchedule((v) => !v)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-3 text-white transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4 text-[#f0b429]" />
              Schedule Fixture
            </span>
            {showSchedule ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>

          {showSchedule && (
            <form onSubmit={handleSchedule} className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-xs mb-1">Home Club *</label>
                  <select
                    value={schedForm.home_club_id}
                    onChange={(e) => setSchedForm((f) => ({ ...f, home_club_id: e.target.value }))}
                    required
                    className="w-full bg-[#1a3d26] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b429]"
                  >
                    <option value="">Select club</option>
                    {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Away Club *</label>
                  <select
                    value={schedForm.away_club_id}
                    onChange={(e) => setSchedForm((f) => ({ ...f, away_club_id: e.target.value }))}
                    required
                    className="w-full bg-[#1a3d26] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b429]"
                  >
                    <option value="">Select club</option>
                    {clubs.filter((c) => c.id.toString() !== schedForm.home_club_id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-xs mb-1">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={schedForm.match_date}
                    onChange={(e) => setSchedForm((f) => ({ ...f, match_date: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b429]"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs mb-1">Venue</label>
                  <input
                    type="text"
                    value={schedForm.venue}
                    onChange={(e) => setSchedForm((f) => ({ ...f, venue: e.target.value }))}
                    placeholder="Ground name"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#f0b429]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={scheduling}
                className="w-full bg-[#f0b429] hover:bg-amber-400 disabled:opacity-50 text-[#1a3a1a] font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                {scheduling ? "Scheduling..." : "Schedule Fixture"}
              </button>
            </form>
          )}

          {/* WhatsApp feedback */}
          {whatsappMsg && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-green-300 text-sm">
              {whatsappMsg}
            </div>
          )}

          {/* Fixture list */}
          {fixtures.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Calendar className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No fixtures scheduled yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fixtures.map((f) => (
                <div key={f.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {FIXTURE_STATUS_ICON[f.status]}
                      <span className="text-white/40 text-xs capitalize">{f.status}</span>
                    </div>
                    {f.match_date && (
                      <span className="text-white/40 text-xs">
                        {new Date(f.match_date).toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Score display */}
                  <div className="flex items-center justify-center gap-4 my-3">
                    <span className="text-white font-semibold text-right flex-1 truncate">{f.home_club_name}</span>
                    <span className="text-[#f0b429] font-bold text-xl min-w-[3rem] text-center">
                      {f.status === "completed"
                        ? `${f.home_score} – ${f.away_score}`
                        : "vs"}
                    </span>
                    <span className="text-white font-semibold text-left flex-1 truncate">{f.away_club_name}</span>
                  </div>

                  {f.venue && (
                    <p className="text-white/40 text-xs text-center mb-2">📍 {f.venue}</p>
                  )}

                  {/* Actions */}
                  {f.status !== "completed" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setResultFixture(f);
                          setResultScores({
                            home: f.home_score?.toString() ?? "",
                            away: f.away_score?.toString() ?? "",
                          });
                        }}
                        className="flex-1 text-xs bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg transition-colors"
                      >
                        Record Result
                      </button>
                      <button
                        onClick={() => handleWhatsApp(f.id)}
                        disabled={whatsappSending === f.id}
                        className="flex items-center gap-1 text-xs bg-green-700/40 hover:bg-green-700/60 text-green-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {whatsappSending === f.id ? "Sending..." : "WhatsApp"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── CLUBS TAB ────────────────────────────────────────────────────── */}
      {tab === "clubs" && (
        <div className="space-y-4">
          {/* Add club */}
          <button
            onClick={() => setShowAddClub((v) => !v)}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-3 text-white transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Plus className="w-4 h-4 text-[#f0b429]" />
              Enrol Club
            </span>
            {showAddClub ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
          </button>

          {showAddClub && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex gap-2">
              <select
                value={addClubId}
                onChange={(e) => setAddClubId(e.target.value)}
                className="flex-1 bg-[#1a3d26] border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f0b429]"
              >
                <option value="">Select a club to enrol</option>
                {unenrolled.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.suburb}</option>
                ))}
              </select>
              <button
                onClick={handleAddClub}
                disabled={addingClub || !addClubId}
                className="bg-[#f0b429] hover:bg-amber-400 disabled:opacity-50 text-[#1a3a1a] font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {addingClub ? "Adding..." : "Add"}
              </button>
            </div>
          )}

          {clubs.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Users className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No clubs enrolled yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clubs.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div>
                    <p className="text-white font-medium">{c.name}</p>
                    <p className="text-white/40 text-xs">{c.suburb}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveClub(c.id)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Record Result Modal ───────────────────────────────────────────── */}
      {resultFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a3d26] border border-white/10 p-6">
            <h3 className="text-white font-bold text-lg mb-1">Record Result</h3>
            <p className="text-white/50 text-sm mb-5">
              {resultFixture.home_club_name} vs {resultFixture.away_club_name}
            </p>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1">
                <label className="block text-white/60 text-xs mb-1 truncate">{resultFixture.home_club_name}</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={resultScores.home}
                  onChange={(e) => setResultScores((s) => ({ ...s, home: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:outline-none focus:border-[#f0b429]"
                />
              </div>
              <span className="text-white/40 text-lg font-bold mt-4">–</span>
              <div className="flex-1">
                <label className="block text-white/60 text-xs mb-1 truncate">{resultFixture.away_club_name}</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={resultScores.away}
                  onChange={(e) => setResultScores((s) => ({ ...s, away: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-2xl font-bold text-center focus:outline-none focus:border-[#f0b429]"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setResultFixture(null)}
                className="flex-1 py-2 rounded-xl border border-white/20 text-white/60 text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResult}
                disabled={savingResult || resultScores.home === "" || resultScores.away === ""}
                className="flex-1 py-2 rounded-xl bg-[#f0b429] hover:bg-amber-400 disabled:opacity-50 text-[#1a3a1a] font-bold text-sm transition-colors"
              >
                {savingResult ? "Saving..." : "Save Result"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
