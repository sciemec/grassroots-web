"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, ChevronLeft, Plus, Trash2, Trophy, Loader2, Share2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const SPORTS = ["Football", "Rugby", "Netball", "Basketball", "Cricket", "Athletics", "Swimming", "Tennis", "Volleyball", "Hockey"];

const PROVINCES = [
  "Harare", "Bulawayo", "Manicaland", "Mashonaland Central",
  "Mashonaland East", "Mashonaland West", "Masvingo",
  "Matabeleland North", "Matabeleland South", "Midlands",
];

const POSITIONS: Record<string, string[]> = {
  Football: ["Goalkeeper", "Defender", "Midfielder", "Winger", "Striker"],
  Rugby: ["Prop", "Hooker", "Lock", "Flanker", "No. 8", "Scrum-half", "Fly-half", "Wing", "Centre", "Fullback"],
  Netball: ["Goal Shooter", "Goal Attack", "Wing Attack", "Centre", "Wing Defence", "Goal Defence", "Goal Keeper"],
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  default: ["Forward", "Midfielder", "Defender", "Goalkeeper"],
};

const FORMATIONS = ["4-3-3", "4-4-2", "3-5-2", "4-2-3-1", "5-3-2", "Other"];

interface Player {
  name: string;
  position: string;
}

interface MatchData {
  opponent: string;
  homeScore: string;
  awayScore: string;
  date: string;
  formation: string;
}

interface TeamData {
  name: string;
  sport: string;
  province: string;
}

const STEPS = ["Welcome", "Your Team", "Squad", "Match", "Done"];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                i < step
                  ? "bg-[#1a5c2a] text-white"
                  : i === step
                  ? "bg-[#c8962a] text-white"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {i < step ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${i === step ? "text-[#c8962a]" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-8 sm:w-12 transition-all ${i < step ? "bg-[#1a5c2a]" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [step, setStep] = useState(0);
  const [team, setTeam] = useState<TeamData>({ name: "", sport: "Football", province: "Harare" });
  const [players, setPlayers] = useState<Player[]>([
    { name: "", position: "Midfielder" },
    { name: "", position: "Striker" },
    { name: "", position: "Defender" },
  ]);
  const [match, setMatch] = useState<MatchData>({
    opponent: "",
    homeScore: "",
    awayScore: "",
    date: new Date().toISOString().slice(0, 10),
    formation: "4-3-3",
  });
  const [aiInsight, setAiInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill team name from user profile
  useEffect(() => {
    if (user?.name) {
      setTeam((t) => ({ ...t, name: t.name || `${user.name}'s Team` }));
    }
  }, [user]);

  const positions = POSITIONS[team.sport] ?? POSITIONS.default;

  // ── Step validators ──────────────────────────────────────────────
  const teamValid = team.name.trim().length >= 2 && team.sport && team.province;
  const matchValid = match.opponent.trim().length >= 2 && match.homeScore !== "" && match.awayScore !== "";

  // ── Helpers ──────────────────────────────────────────────────────
  const addPlayer = () => setPlayers((p) => [...p, { name: "", position: positions[0] }]);
  const removePlayer = (i: number) => setPlayers((p) => p.filter((_, idx) => idx !== i));
  const updatePlayer = (i: number, field: keyof Player, value: string) =>
    setPlayers((p) => p.map((pl, idx) => (idx === i ? { ...pl, [field]: value } : pl)));

  // ── Save + generate insight ──────────────────────────────────────
  async function finishOnboarding() {
    setSaving(true);
    setError("");

    // Save to localStorage regardless of API success
    const onboardingData = { team, players: players.filter((p) => p.name.trim()), match };
    localStorage.setItem("gs_onboarding", JSON.stringify(onboardingData));
    localStorage.setItem("gs_coach_team", JSON.stringify(team));

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token && token !== "dev-token") headers["Authorization"] = `Bearer ${token}`;

    // Try to save squad + match to API — fire and forget
    try {
      const hs = parseInt(match.homeScore) || 0;
      const as = parseInt(match.awayScore) || 0;
      await fetch(`${API}/matches`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          home_team: team.name,
          away_team: match.opponent,
          home_score: hs,
          away_score: as,
          date: match.date,
          sport: team.sport,
          formation: match.formation,
          status: "completed",
        }),
      });
    } catch {
      // silent — not a blocker
    }

    // Generate AI insight
    setLoadingInsight(true);
    try {
      const hs = parseInt(match.homeScore) || 0;
      const as = parseInt(match.awayScore) || 0;
      const result = hs > as ? "won" : hs < as ? "lost" : "drew";
      const prompt = `A ${team.sport} coach's team "${team.name}" just ${result} ${hs}-${as} against ${match.opponent}. Formation: ${match.formation}. Give ONE sharp coaching insight (2 sentences max). Be specific and actionable, not generic.`;

      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, system_prompt: "You are THUTO, a sharp African football coach. One insight, two sentences max. No fluff." }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data.response ?? data.answer ?? "");
      }
    } catch {
      // silent
    } finally {
      setLoadingInsight(false);
      setSaving(false);
      setStep(4);
    }
  }

  // ── Render steps ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a5c2a] flex items-center justify-center">
              <span className="text-white font-black text-sm">G</span>
            </div>
            <span className="font-black text-[#1a5c2a] text-lg">GrassRoots Sports</span>
          </div>
        </div>

        <ProgressBar step={step} />

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">

          {/* ── STEP 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#1a5c2a] flex items-center justify-center mx-auto">
                <Trophy size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                  Your AI coaching<br />assistant is ready.
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Log your first match in 4 quick steps and get an instant AI coaching report — in under 5 minutes.
                </p>
              </div>
              <div className="space-y-2 text-left bg-gray-50 rounded-xl p-4">
                {["Set up your team name and sport", "Add 3 players to your squad", "Log today's match score", "Get your AI coaching insight"].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-[#1a5c2a] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    {s}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all"
                style={{ background: "#c8962a" }}
              >
                Let's Go <ChevronRight size={16} className="inline" />
              </button>
              {user && (
                <button onClick={() => router.push("/coach")} className="text-xs text-gray-400 underline">
                  Skip — take me to the dashboard
                </button>
              )}
            </div>
          )}

          {/* ── STEP 1: Team ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">Your team</h2>
                <p className="text-sm text-gray-500">What are you called and what sport do you play?</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Name</label>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => setTeam((t) => ({ ...t, name: e.target.value }))}
                  placeholder="e.g. Harare United FC"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1a5c2a] focus:ring-1 focus:ring-[#1a5c2a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sport</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {SPORTS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setTeam((t) => ({ ...t, sport: s }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        team.sport === s
                          ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Province</label>
                <select
                  value={team.province}
                  onChange={(e) => setTeam((t) => ({ ...t, province: e.target.value }))}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1a5c2a] focus:ring-1 focus:ring-[#1a5c2a] bg-white"
                >
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-3 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-all">
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!teamValid}
                  className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all disabled:opacity-40"
                  style={{ background: teamValid ? "#c8962a" : "#d1d5db" }}
                >
                  Next: Add Players <ChevronRight size={15} className="inline" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Squad ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">Quick squad</h2>
                <p className="text-sm text-gray-500">Add at least 1 player name — you can complete the squad later.</p>
              </div>

              <div className="space-y-3">
                {players.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[10px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => updatePlayer(i, "name", e.target.value)}
                      placeholder={`Player ${i + 1} name`}
                      className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1a5c2a] focus:ring-1 focus:ring-[#1a5c2a]"
                    />
                    <select
                      value={p.position}
                      onChange={(e) => updatePlayer(i, "position", e.target.value)}
                      className="w-32 rounded-xl border border-gray-200 px-2 py-2.5 text-xs text-gray-700 outline-none focus:border-[#1a5c2a] bg-white"
                    >
                      {positions.map((pos) => <option key={pos}>{pos}</option>)}
                    </select>
                    {players.length > 1 && (
                      <button onClick={() => removePlayer(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {players.length < 11 && (
                <button onClick={addPlayer} className="flex items-center gap-1.5 text-xs font-bold text-[#1a5c2a] hover:underline">
                  <Plus size={14} /> Add another player
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-3 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-all">
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all"
                  style={{ background: "#c8962a" }}
                >
                  Next: Log Match <ChevronRight size={15} className="inline" />
                </button>
              </div>
              <button onClick={() => setStep(3)} className="w-full text-xs text-gray-400 underline">
                Skip — I'll add players later
              </button>
            </div>
          )}

          {/* ── STEP 3: Match ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 mb-1">Log your match</h2>
                <p className="text-sm text-gray-500">Enter the result — that's all we need for your first AI report.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opponent</label>
                <input
                  type="text"
                  value={match.opponent}
                  onChange={(e) => setMatch((m) => ({ ...m, opponent: e.target.value }))}
                  placeholder="e.g. Dynamos FC"
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1a5c2a] focus:ring-1 focus:ring-[#1a5c2a]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Score</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-gray-400 mb-1 font-bold">{team.name || "Your Team"}</p>
                    <input
                      type="number"
                      min="0"
                      value={match.homeScore}
                      onChange={(e) => setMatch((m) => ({ ...m, homeScore: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-200 px-4 py-4 text-2xl font-black text-center text-gray-900 outline-none focus:border-[#1a5c2a] focus:ring-1 focus:ring-[#1a5c2a]"
                    />
                  </div>
                  <span className="text-2xl font-black text-gray-300">—</span>
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-gray-400 mb-1 font-bold">{match.opponent || "Opponent"}</p>
                    <input
                      type="number"
                      min="0"
                      value={match.awayScore}
                      onChange={(e) => setMatch((m) => ({ ...m, awayScore: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-xl border border-gray-200 px-4 py-4 text-2xl font-black text-center text-gray-900 outline-none focus:border-[#1a5c2a] focus:ring-1 focus:ring-[#1a5c2a]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Match Date</label>
                  <input
                    type="date"
                    value={match.date}
                    onChange={(e) => setMatch((m) => ({ ...m, date: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1a5c2a] bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Formation</label>
                  <select
                    value={match.formation}
                    onChange={(e) => setMatch((m) => ({ ...m, formation: e.target.value }))}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#1a5c2a] bg-white"
                  >
                    {FORMATIONS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-3 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-all">
                  <ChevronLeft size={15} /> Back
                </button>
                <button
                  onClick={finishOnboarding}
                  disabled={!matchValid || saving}
                  className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: matchValid ? "#1a5c2a" : "#d1d5db" }}
                >
                  {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <>Get My AI Report <ChevronRight size={15} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Done ── */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Result card */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#1a5c2a] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Match logged!</h2>
                <p className="text-sm text-gray-500 mt-1">Here's your first AI coaching report.</p>
              </div>

              {/* Score summary */}
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 text-center">
                <p className="text-xs font-bold text-[#1a5c2a] uppercase tracking-wider mb-2">{team.sport} · {new Date(match.date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })}</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-bold mb-1">{team.name}</p>
                    <p className="text-4xl font-black text-[#1a5c2a]">{match.homeScore}</p>
                  </div>
                  <span className="text-2xl font-black text-gray-300">—</span>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 font-bold mb-1">{match.opponent}</p>
                    <p className="text-4xl font-black text-gray-400">{match.awayScore}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs font-bold text-gray-500 uppercase">
                  {parseInt(match.homeScore) > parseInt(match.awayScore) ? "Win" :
                   parseInt(match.homeScore) < parseInt(match.awayScore) ? "Loss" : "Draw"}
                  {" · "}{match.formation}
                </p>
              </div>

              {/* AI Insight */}
              <div className="rounded-xl border border-[#c8962a]/30 bg-[#fffbeb] p-4">
                <p className="text-[10px] font-black text-[#92400e] uppercase tracking-wider mb-2">THUTO AI Insight</p>
                {loadingInsight ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <Loader2 size={14} className="animate-spin" /> Generating your coaching insight…
                  </div>
                ) : aiInsight ? (
                  <p className="text-sm text-amber-900 leading-relaxed italic">"{aiInsight}"</p>
                ) : (
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Log more matches and add player stats to unlock deeper AI insights. Your data builds your coaching intelligence.
                  </p>
                )}
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/coach")}
                  className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-white"
                  style={{ background: "#1a5c2a" }}
                >
                  Open My Coach Dashboard
                </button>
                <button
                  onClick={() => {
                    const hs = match.homeScore;
                    const as = match.awayScore;
                    const result = parseInt(hs) > parseInt(as) ? "Won" : parseInt(hs) < parseInt(as) ? "Lost" : "Drew";
                    const text = `${result} ${hs}-${as} vs ${match.opponent} today! Tracking everything with GrassRoots Sports AI 🏆 grassrootssports.live`;
                    if (navigator.share) {
                      navigator.share({ text, url: "https://grassrootssports.live" }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(text);
                    }
                  }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-[#1a5c2a] border-2 border-[#1a5c2a] flex items-center justify-center gap-2 hover:bg-[#f0fdf4] transition-all"
                >
                  <Share2 size={15} /> Share Result
                </button>
                <button
                  onClick={() => { setStep(3); setMatch({ opponent: "", homeScore: "", awayScore: "", date: new Date().toISOString().slice(0, 10), formation: "4-3-3" }); }}
                  className="w-full text-xs text-gray-400 underline py-1"
                >
                  Log another match
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          GrassRoots Sports · Zimbabwe's AI Coaching Platform
        </p>
      </div>
    </div>
  );
}
