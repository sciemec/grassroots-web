"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Brain, Loader2, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { SPORTS, SPORT_STATS, SportKey } from "@/config/sports";
import { queryAI } from "@/lib/ai-query";
import { useGuestGate } from "@/components/ui/register-modal";
import api from "@/lib/api";

// Human-readable labels + field types for every stat key
const FIELD_META: Record<string, { label: string; type: "number" | "text"; placeholder: string; unit?: string }> = {
  // Common
  minutesPlayed:      { label: "Minutes Played",        type: "number", placeholder: "90",    unit: "min" },
  // Football
  goals:              { label: "Goals",                  type: "number", placeholder: "0" },
  assists:            { label: "Assists",                type: "number", placeholder: "0" },
  passes:             { label: "Passes",                 type: "number", placeholder: "0" },
  passAccuracy:       { label: "Pass Accuracy",          type: "number", placeholder: "85",   unit: "%" },
  tackles:            { label: "Tackles",                type: "number", placeholder: "0" },
  interceptions:      { label: "Interceptions",          type: "number", placeholder: "0" },
  distanceCovered:    { label: "Distance Covered",       type: "number", placeholder: "9.5",  unit: "km" },
  saves:              { label: "Saves",                  type: "number", placeholder: "0" },
  cleanSheets:        { label: "Clean Sheet (1=yes)",    type: "number", placeholder: "0" },
  goalsAllowed:       { label: "Goals Allowed",          type: "number", placeholder: "0" },
  distribution:       { label: "Distribution Accuracy",  type: "number", placeholder: "80",   unit: "%" },
  // Rugby
  tries:              { label: "Tries",                  type: "number", placeholder: "0" },
  carries:            { label: "Carries",                type: "number", placeholder: "0" },
  metresGained:       { label: "Metres Gained",          type: "number", placeholder: "0",    unit: "m" },
  lineoutsWon:        { label: "Lineouts Won",           type: "number", placeholder: "0" },
  scrumPenalties:     { label: "Scrum Penalties",        type: "number", placeholder: "0" },
  turnoversWon:       { label: "Turnovers Won",          type: "number", placeholder: "0" },
  conversions:        { label: "Conversions",            type: "number", placeholder: "0" },
  penaltyGoals:       { label: "Penalty Goals",          type: "number", placeholder: "0" },
  dropGoals:          { label: "Drop Goals",             type: "number", placeholder: "0" },
  kickingAccuracy:    { label: "Kicking Accuracy",       type: "number", placeholder: "0",    unit: "%" },
  // Athletics
  eventType:          { label: "Event",                  type: "text",   placeholder: "e.g. 100m, Long Jump" },
  personalBest:       { label: "Personal Best",          type: "text",   placeholder: "e.g. 10.8s or 7.2m" },
  seasonBest:         { label: "Season Best",            type: "text",   placeholder: "e.g. 11.0s or 6.9m" },
  nationalRanking:    { label: "National Ranking",       type: "number", placeholder: "e.g. 5" },
  reactionTime:       { label: "Reaction Time",          type: "text",   placeholder: "e.g. 0.14s" },
  splits:             { label: "Splits",                 type: "text",   placeholder: "e.g. 10m: 1.8s, 50m: 6.1s" },
  attempts:           { label: "Attempts",               type: "number", placeholder: "6" },
  fouls:              { label: "Fouls / No-jumps",       type: "number", placeholder: "0" },
  // Netball
  goalAccuracy:       { label: "Goal Accuracy",          type: "number", placeholder: "0",    unit: "%" },
  centerPassReceives: { label: "Centre Pass Receives",   type: "number", placeholder: "0" },
  feeds:              { label: "Feeds into Circle",      type: "number", placeholder: "0" },
  rebounds:           { label: "Rebounds",               type: "number", placeholder: "0" },
  contacts:           { label: "Contacts",               type: "number", placeholder: "0" },
  deflections:        { label: "Deflections",            type: "number", placeholder: "0" },
  obstructions:       { label: "Obstructions",           type: "number", placeholder: "0" },
  intercepts:         { label: "Intercepts",             type: "number", placeholder: "0" },
  // Basketball
  points:             { label: "Points",                 type: "number", placeholder: "0" },
  steals:             { label: "Steals",                 type: "number", placeholder: "0" },
  blocks:             { label: "Blocks",                 type: "number", placeholder: "0" },
  turnovers:          { label: "Turnovers",              type: "number", placeholder: "0" },
  fieldGoalPct:       { label: "Field Goal %",           type: "number", placeholder: "0",    unit: "%" },
  threePointPct:      { label: "3-Point %",              type: "number", placeholder: "0",    unit: "%" },
  ftPct:              { label: "Free Throw %",           type: "number", placeholder: "0",    unit: "%" },
  // Cricket
  runs:               { label: "Runs",                   type: "number", placeholder: "0" },
  balls:              { label: "Balls Faced",            type: "number", placeholder: "0" },
  fours:              { label: "Fours",                  type: "number", placeholder: "0" },
  sixes:              { label: "Sixes",                  type: "number", placeholder: "0" },
  strikeRate:         { label: "Strike Rate",            type: "number", placeholder: "0" },
  average:            { label: "Average",                type: "number", placeholder: "0" },
  highScore:          { label: "High Score",             type: "number", placeholder: "0" },
  wickets:            { label: "Wickets",                type: "number", placeholder: "0" },
  overs:              { label: "Overs Bowled",           type: "number", placeholder: "0" },
  economy:            { label: "Economy Rate",           type: "number", placeholder: "0" },
  bestFigures:        { label: "Best Figures",           type: "text",   placeholder: "e.g. 3/25" },
  // Swimming
  stroke:             { label: "Stroke",                 type: "text",   placeholder: "e.g. Freestyle, Butterfly" },
  distance:           { label: "Distance",               type: "text",   placeholder: "e.g. 100m, 200m" },
  // Tennis
  wins:               { label: "Wins",                   type: "number", placeholder: "0" },
  losses:             { label: "Losses",                 type: "number", placeholder: "0" },
  sets:               { label: "Sets Won",               type: "number", placeholder: "0" },
  serveAccuracy:      { label: "Serve Accuracy",         type: "number", placeholder: "0",    unit: "%" },
  breakPoints:        { label: "Break Points Won",       type: "number", placeholder: "0" },
  aces:               { label: "Aces",                   type: "number", placeholder: "0" },
  doubleFaults:       { label: "Double Faults",          type: "number", placeholder: "0" },
  // Volleyball
  kills:              { label: "Kills",                  type: "number", placeholder: "0" },
  digs:               { label: "Digs",                   type: "number", placeholder: "0" },
  errors:             { label: "Errors",                 type: "number", placeholder: "0" },
  // Hockey
  shotsOnGoal:        { label: "Shots on Goal",          type: "number", placeholder: "0" },
};

// Which sports need a sub-role picker, and what the options are
const ROLE_OPTIONS: Partial<Record<SportKey, { value: string; label: string }[]>> = {
  football:  [{ value: "outfield", label: "Outfield Player" }, { value: "goalkeeper", label: "Goalkeeper" }],
  rugby:     [{ value: "all", label: "General Player" }, { value: "kicker", label: "Kicker (add kicking stats)" }],
  athletics: [{ value: "track", label: "Track Event" }, { value: "field", label: "Field Event" }],
  netball:   [{ value: "shooter", label: "Shooter (GS/GA)" }, { value: "midcourt", label: "Mid-court (WA/C/WD)" }, { value: "defender", label: "Defender (GD/GK)" }],
  cricket:   [{ value: "batting", label: "Batting" }, { value: "bowling", label: "Bowling" }],
  hockey:    [{ value: "outfield", label: "Outfield Player" }, { value: "goalkeeper", label: "Goalkeeper" }],
};

const MATCH_RESULTS = ["Win", "Draw", "Loss", "N/A"];
const MATCH_TYPES   = [
  { value: "match",    label: "Match",          desc: "Official or friendly game" },
  { value: "training", label: "Training",       desc: "Practice session stats" },
  { value: "trial",    label: "Trial",          desc: "Trial or scouting event" },
];

// Get the stat fields for a given sport + role
function getStatFields(sport: SportKey, role: string): string[] {
  const sportStats = SPORT_STATS[sport];
  if (!sportStats) return [];
  // For rugby kicker — combine all + kicker fields (deduplicated)
  if (sport === "rugby" && role === "kicker") {
    return Array.from(new Set([...(sportStats.all ?? []), ...(sportStats.kicker ?? [])]));
  }
  return sportStats[role] ?? sportStats.all ?? Object.values(sportStats)[0] ?? [];
}

type Step = "sport" | "details" | "stats";

export default function LogStatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { requireAuth } = useGuestGate();

  const [step, setStep]             = useState<Step>("sport");
  const [sport, setSport]           = useState<SportKey>("football");
  const [role, setRole]             = useState<string>("");
  const [matchType, setMatchType]   = useState("match");
  const [opponent, setOpponent]     = useState("");
  const [matchDate, setMatchDate]   = useState(new Date().toISOString().split("T")[0]);
  const [competition, setCompetition] = useState("");
  const [result, setResult]         = useState("Win");
  const [score, setScore]           = useState("");
  const [statValues, setStatValues] = useState<Record<string, string>>({});
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [saved, setSaved]           = useState(false);
  const [aiReport, setAiReport]     = useState("");
  const [loadingAI, setLoadingAI]   = useState(false);

  // Reset role when sport changes
  useEffect(() => {
    const roles = ROLE_OPTIONS[sport];
    setRole(roles ? roles[0].value : "all");
    setStatValues({});
  }, [sport]);

  const roleOptions = ROLE_OPTIONS[sport];
  const statFields  = getStatFields(sport, role || "all");
  const sportConfig = SPORTS.find((s) => s.key === sport);

  const setStat = (key: string, val: string) =>
    setStatValues((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!user) { requireAuth("save your stats"); return; }
    setSaving(true);
    setSaveError("");
    try {
      await api.post("/player/stats", {
        sport, role, match_type: matchType,
        opponent, match_date: matchDate,
        competition, result, score,
        stats: statValues, notes,
      });
      setSaved(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setSaveError(msg ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getAIFeedback = async () => {
    setLoadingAI(true);
    const statSummary = statFields
      .map((k) => `${FIELD_META[k]?.label ?? k}: ${statValues[k] || "—"}`)
      .join(", ");
    const context = `Sport: ${sport}. Match type: ${matchType}. Opponent: ${opponent || "unknown"}. Result: ${result} ${score}. Stats: ${statSummary}. Notes: ${notes || "none"}.`;
    try {
      const reply = await queryAI(
        `Analyse these player stats and give specific, actionable feedback:\n${context}`,
        "player"
      );
      setAiReport(reply);
    } catch {
      setAiReport("Unable to reach AI Coach. Please check your connection.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-xl">

          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <Link href="/player/stats" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Log Match Stats</h1>
              <p className="text-sm text-muted-foreground">Record your performance for scouts to see</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="mb-8 flex items-center gap-2">
            {(["sport", "details", "stats"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" :
                  (["sport", "details", "stats"].indexOf(step) > i) ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {(["sport", "details", "stats"].indexOf(step) > i) ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium capitalize ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                  {s === "sport" ? "Sport & Role" : s === "details" ? "Match Details" : "Stats"}
                </span>
                {i < 2 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Sport & Role ── */}
          {step === "sport" && (
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-sm font-semibold">Select sport</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SPORTS.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSport(s.key)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                        sport === s.key ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"
                      }`}
                    >
                      <span className="text-xl">{s.emoji}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {roleOptions && (
                <div>
                  <label className="mb-3 block text-sm font-semibold">Your role</label>
                  <div className="space-y-2">
                    {roleOptions.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${
                          role === r.value ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setStep("details")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Next — Match Details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2: Match Details ── */}
          {step === "details" && (
            <div className="space-y-5">
              {/* Match type */}
              <div>
                <label className="mb-3 block text-sm font-semibold">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {MATCH_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setMatchType(t.value)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        matchType === t.value ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/40"
                      }`}
                    >
                      <p className="text-sm font-medium">{t.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Result</label>
                  <div className="flex gap-1.5">
                    {MATCH_RESULTS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setResult(r)}
                        className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                          result === r
                            ? r === "Win" ? "border-green-500 bg-green-500/10 text-green-700"
                            : r === "Loss" ? "border-red-500 bg-red-500/10 text-red-700"
                            : "border-primary bg-primary/5 text-primary"
                            : "bg-card hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Opponent <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="e.g. Highlanders FC"
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Score <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="e.g. 2-1"
                    className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Competition <span className="font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={competition}
                    onChange={(e) => setCompetition(e.target.value)}
                    placeholder={sportConfig?.competitions[0] ?? "e.g. Division 1"}
                    className="w-full rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("sport")}
                  className="flex-1 rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep("stats")}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Next — Enter Stats <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Stats Entry ── */}
          {step === "stats" && (
            <div className="space-y-5">
              {/* Summary pill */}
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5">
                <span className="text-lg">{sportConfig?.emoji}</span>
                <span className="text-sm font-medium capitalize">{sport} · {role}</span>
                <span className="mx-1 text-muted-foreground">·</span>
                <span className={`text-xs font-bold ${result === "Win" ? "text-green-600" : result === "Loss" ? "text-red-600" : "text-muted-foreground"}`}>
                  {result} {score}
                </span>
                {opponent && <span className="text-xs text-muted-foreground">vs {opponent}</span>}
              </div>

              {/* Stat inputs */}
              <div className="rounded-xl border bg-card p-5">
                <h2 className="mb-4 font-semibold">Your stats</h2>
                <div className="grid grid-cols-2 gap-3">
                  {statFields.map((key) => {
                    const meta = FIELD_META[key];
                    if (!meta) return null;
                    return (
                      <div key={key}>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          {meta.label}{meta.unit ? ` (${meta.unit})` : ""}
                        </label>
                        <input
                          type={meta.type}
                          step={meta.type === "number" ? "0.1" : undefined}
                          value={statValues[key] ?? ""}
                          onChange={(e) => setStat(key, e.target.value)}
                          placeholder={meta.placeholder}
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Notes <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Felt strong in the first half, struggled with stamina in the second…"
                  className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>

              {saveError && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {saveError}
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Stats saved! They now appear on your profile.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Stats</>}
                </button>
              </div>

              {/* AI Feedback — available after saving */}
              {saved && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold text-purple-700">AI Performance Feedback</h3>
                    </div>
                    {!aiReport && (
                      <button
                        type="button"
                        onClick={getAIFeedback}
                        disabled={loadingAI}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
                      >
                        {loadingAI ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing…</> : "Analyse my stats"}
                      </button>
                    )}
                  </div>
                  {aiReport ? (
                    <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">{aiReport}</div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Get instant AI feedback on your performance — strengths, weaknesses, and what to work on next.
                    </p>
                  )}
                </div>
              )}

              {saved && (
                <Link
                  href="/player/stats"
                  className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors"
                >
                  View all my stats
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
