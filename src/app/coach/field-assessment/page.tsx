"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ChevronDown, ChevronUp, Loader2,
  TrendingUp, Zap, CheckCircle2, Bookmark, BookmarkCheck, ClipboardList,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { queryAI } from "@/lib/ai-query";
import { calcBenchmarkScore } from "@/lib/skill-scoring";
import { safeArray } from "@/lib/safe-array";
import api from "@/lib/api";
import {
  selectFocusGaps, resolveAgeGroup,
  type DomainScores, type TestPercentile, type Position,
} from "@/lib/grs-engine";
import { getDrillsForGaps, type DrillRecommendation } from "@/lib/drill-selector";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SquadMember {
  id: string;
  name: string;
  position: string;
  shirt_no: number;
  player_user_id: string | null;
}

// ── Test definitions (position-specific) ──────────────────────────────────────

const POSITIONS_TESTS: Record<string, {
  label: string;
  tests: { name: string; setup: string; run: string; record: string; benchmark: string; unit: string }[];
}> = {
  goalkeeper: {
    label: "Goalkeeper",
    tests: [
      {
        name: "Reaction save",
        setup: "Keeper on goal-line, central. Partner stands 7 m away with 10 balls.",
        run: "Partner shoots low or half-height to alternate sides — one ball every ~8 seconds. No warning of direction.",
        record: "Count saves made out of 10.",
        benchmark: "6", unit: "saves/10",
      },
      {
        name: "Distribution accuracy",
        setup: "Place 4 cones at 10 m, 20 m, and left/right at 15 m (~2 m diameter target zones).",
        run: "Keeper throws or rolls 10 balls trying to hit any cone target. Mix overarm and underarm.",
        record: "Count accurate deliveries (ball stops within 2 m of a cone) out of 10.",
        benchmark: "7", unit: "accurate/10",
      },
      {
        name: "Dive reach (left)",
        setup: "Keeper stands in ready position central. Mark the starting foot position.",
        run: "Keeper dives left as far as possible from standing, reaching with outstretched hands. 3 attempts.",
        record: "Measure from start mark to fingertip at landing. Best of 3.",
        benchmark: "2.3", unit: "metres",
      },
      {
        name: "Dive reach (right)",
        setup: "Same setup as Dive Reach Left.",
        run: "3 attempts diving right.",
        record: "Best of 3 in metres.",
        benchmark: "2.3", unit: "metres",
      },
    ],
  },
  defender: {
    label: "Defender",
    tests: [
      {
        name: "40m sprint",
        setup: "Mark start and 40 m finish lines on flat ground. Coach holds stopwatch at finish.",
        run: "Player starts from standing. Start timer on first movement. Two attempts with 3-minute rest.",
        record: "Best time in seconds.",
        benchmark: "5.2", unit: "seconds",
      },
      {
        name: "1v1 tackle success",
        setup: "10 m × 6 m channel. Attacker starts with ball at one end, defender at the other.",
        run: "Attacker tries to dribble past defender to far end. 10 attempts.",
        record: "Count successful defensive actions (tackle, block, or force ball out of channel) out of 10.",
        benchmark: "6", unit: "won/10",
      },
      {
        name: "Clearance distance",
        setup: "Ball placed 2 m inside the penalty area edge.",
        run: "Player clears the ball (kick or headed) 5 times. No run-up restriction.",
        record: "Measure where ball first lands. Average of best 3.",
        benchmark: "30", unit: "metres",
      },
      {
        name: "Pass accuracy",
        setup: "Three target zones at 5 m, 15 m, and 30 m — each a 2 m × 2 m square.",
        run: "10 passes to each zone (30 total). Player must attempt all three distances.",
        record: "Count passes landing within the target zone.",
        benchmark: "22", unit: "accurate/30",
      },
    ],
  },
  midfielder: {
    label: "Midfielder",
    tests: [
      {
        name: "20m sprint",
        setup: "Mark start and 20 m lines on flat ground.",
        run: "Standing start. Two attempts, 2-minute rest between.",
        record: "Best time in seconds.",
        benchmark: "3.0", unit: "seconds",
      },
      {
        name: "Passing accuracy",
        setup: "Three target squares at 5 m, 15 m, 30 m (2 m × 2 m each).",
        run: "10 passes to each distance (30 total). Player chooses foot and technique.",
        record: "Total accurate passes landing in target.",
        benchmark: "24", unit: "accurate/30",
      },
      {
        name: "Ball retention (1v1)",
        setup: "4 m × 4 m square. Midfielder has the ball; defender tries to win it.",
        run: "Midfielder keeps ball for 20 seconds per attempt. 5 attempts total. Reset after each.",
        record: "Count attempts where midfielder kept ball for full 20 s.",
        benchmark: "3", unit: "retained/5",
      },
      {
        name: "Yo-Yo endurance",
        setup: "Two cones 20 m apart. Use Yo-Yo Intermittent Recovery Test Level 1 audio track.",
        run: "Player runs 20 m and back in time to each beep. Rest 10 s between shuttles. Stop when they miss twice.",
        record: "Record the level/stage reached when they stopped.",
        benchmark: "14", unit: "level",
      },
    ],
  },
  forward: {
    label: "Forward",
    tests: [
      {
        name: "10m sprint",
        setup: "Mark start and 10 m lines. Tests explosive first-step acceleration.",
        run: "Standing start. Three attempts, 90-second rest between.",
        record: "Best time in seconds.",
        benchmark: "1.7", unit: "seconds",
      },
      {
        name: "Shooting accuracy",
        setup: "Ball placed 16 m from goal. Divide goal into 6 zones with cones. No goalkeeper.",
        run: "10 shots — any technique. At least 3 must be with weaker foot.",
        record: "Count shots on target (within goal frame).",
        benchmark: "5", unit: "on target/10",
      },
      {
        name: "Dribble + finish",
        setup: "Ball at start, 6 cones in slalom over 15 m, shooting zone at end 12 m from goal.",
        run: "Player dribbles through slalom then shoots. Start timer at first touch, stop when ball crosses goal-line. 3 attempts.",
        record: "Time from first touch to shot contact. Best of 3.",
        benchmark: "8.5", unit: "seconds",
      },
      {
        name: "Aerial duel wins",
        setup: "Deliver 10 crossed balls into the box from the flank (hand or kick).",
        run: "Forward attacks ball in the air. One defender applies passive pressure from behind.",
        record: "Count aerial contacts where forward gets clear contact. Out of 10.",
        benchmark: "4", unit: "won/10",
      },
    ],
  },
};

// ── Domain map (test name → GRS domain) ──────────────────────────────────────

const TEST_DOMAIN_MAP: Record<string, keyof DomainScores> = {
  "Reaction save":        "cognitiveSpeed",
  "Distribution accuracy":"ballMastery",
  "Dive reach (left)":   "explosivePower",
  "Dive reach (right)":  "explosivePower",
  "40m sprint":          "linearSpeed",
  "1v1 tackle success":  "cognitiveSpeed",
  "Clearance distance":  "explosivePower",
  "Pass accuracy":       "ballMastery",
  "20m sprint":          "linearSpeed",
  "Passing accuracy":    "ballMastery",
  "Ball retention (1v1)":"cognitiveSpeed",
  "Yo-Yo endurance":     "endurance",
  "10m sprint":          "linearSpeed",
  "Shooting accuracy":   "ballMastery",
  "Dribble + finish":    "cognitiveSpeed",
  "Aerial duel wins":    "explosivePower",
};

function buildDomainScoresFromTests(
  tests: { name: string; benchmark: string; unit: string }[],
  testResults: Record<string, string>,
): DomainScores {
  const blank = (): TestPercentile => ({ raw: 0, rawScore: "", percentile: 50, label: "", tested: false });
  const domains: DomainScores = {
    explosivePower: blank(),
    linearSpeed:    blank(),
    balance:        blank(),
    cognitiveSpeed: blank(),
    endurance:      blank(),
    ballMastery:    blank(),
  };
  for (const test of tests) {
    const val = testResults[test.name];
    if (!val?.trim()) continue;
    const domain = TEST_DOMAIN_MAP[test.name];
    if (!domain) continue;
    const pct = calcBenchmarkScore(test.benchmark, val, test.unit);
    if (domains[domain].tested) {
      domains[domain].percentile = Math.round((domains[domain].percentile + pct) / 2);
    } else {
      domains[domain].percentile = pct;
      domains[domain].tested     = true;
    }
  }
  return domains;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return "#16a34a";
  if (score >= 70) return "#d97706";
  if (score >= 50) return "#2563eb";
  return "#dc2626";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Elite";
  if (score >= 75) return "Advanced";
  if (score >= 60) return "Developing";
  if (score >= 45) return "Beginner";
  return "Needs Work";
}

function passesBenchmark(benchmark: string, value: string, unit: string): boolean {
  const v = parseFloat(value);
  const b = parseFloat(benchmark);
  if (isNaN(v) || isNaN(b)) return false;
  return unit === "seconds" ? v <= b : v >= b;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoachFieldAssessmentPage() {
  const user = useAuthStore((s) => s.user);

  // Squad
  const [squad, setSquad]           = useState<SquadMember[]>([]);
  const [squadLoading, setSquadLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<SquadMember | null>(null);

  // Assessment flow
  const [positionGroup, setPositionGroup] = useState("");
  const [results, setResults]             = useState<Record<string, string>>({});
  const [expandedTest, setExpandedTest]   = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [submitError, setSubmitError] = useState("");

  // AI
  const [aiReport, setAiReport]       = useState("");
  const [loadingReport, setLoadingReport] = useState(false);

  // Drill plan
  const [drillPlanSaved, setDrillPlanSaved] = useState(false);

  // Load squad on mount
  useEffect(() => {
    api.get("/coach/squad")
      .then((res) => {
        const members = safeArray<SquadMember>(res.data?.data ?? res.data);
        setSquad(members);
      })
      .catch(() => {})
      .finally(() => setSquadLoading(false));
  }, []);

  // Reset test results when position changes
  useEffect(() => {
    setResults({});
    setAiReport("");
    setSubmitted(false);
    setSubmitError("");
    setDrillPlanSaved(false);
  }, [positionGroup, selectedMember]);

  const currentTests = positionGroup ? (POSITIONS_TESTS[positionGroup]?.tests ?? []) : [];
  const allFilled    = currentTests.length > 0 && currentTests.every((t) => results[t.name]?.trim());

  // Live radar data
  const radarData = currentTests.map((t) => ({
    subject:  t.name.length > 14 ? t.name.slice(0, 14) + "…" : t.name,
    score:    results[t.name] ? calcBenchmarkScore(t.benchmark, results[t.name], t.unit) : 0,
    fullMark: 100,
  }));

  const overallScore = radarData.length
    ? Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length)
    : 0;

  // Drill recommendations
  const drillRecs: DrillRecommendation[] = (() => {
    if (!positionGroup || !allFilled) return [];
    const pos     = (positionGroup === "forward" ? "striker" : positionGroup) as Position;
    const ageGrp  = resolveAgeGroup(16); // default age — no DOB on squad member
    const domains = buildDomainScoresFromTests(currentTests, results);
    const gaps    = selectFocusGaps(domains, pos, ageGrp, 4);
    return getDrillsForGaps(gaps, pos, ageGrp);
  })();

  const handleSubmit = async () => {
    if (!selectedMember || !positionGroup || !allFilled) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.post("/coach/field-tests", {
        squad_member_id: selectedMember.id,
        player_user_id:  selectedMember.player_user_id ?? undefined,
        position:        positionGroup,
        tests: currentTests.map((t) => ({
          test_name: t.name,
          raw_value: results[t.name],
          unit:      t.unit,
          benchmark: t.benchmark,
        })),
      });
      setSubmitted(true);
    } catch {
      setSubmitError("Could not save results. They are stored locally as a backup.");
      // localStorage fallback
      const key  = `gs_field_tests_${selectedMember.id}`;
      const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
      localStorage.setItem(key, JSON.stringify([{
        position: positionGroup,
        recorded_at: new Date().toISOString(),
        tests: currentTests.map((t) => ({ test_name: t.name, raw_value: results[t.name], unit: t.unit, benchmark: t.benchmark })),
      }, ...prev]));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const getAiReport = async () => {
    if (!positionGroup || !allFilled) return;
    setLoadingReport(true);
    const summary = currentTests
      .map((t) => `${t.name}: ${results[t.name]} ${t.unit} (benchmark: ${t.benchmark})`)
      .join(", ");
    try {
      const reply = await queryAI(
        `Position assessment for ${selectedMember?.name ?? "player"} (${positionGroup}): ${summary}.
Brief analysis: overall rating out of 10, 2 key strengths, 2 areas to improve, 4-week training focus. Be specific and encouraging.`,
        "coach",
      );
      setAiReport(reply);
    } catch {
      setAiReport("Unable to connect to AI. Please try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const saveDrillPlan = () => {
    const plan = {
      savedAt:  new Date().toISOString(),
      player:   selectedMember?.name ?? "Player",
      position: positionGroup,
      drills:   drillRecs.map(({ gap, drill, targetPhase }) => ({
        domain:         gap.domain,
        percentile:     gap.percentile,
        targetPhase,
        name:           drill.name,
        description:    drill.description,
        duration:       drill.duration,
        equipment:      drill.requiresEquipment ?? [],
        coachingPoints: drill.coachingPoints,
      })),
    };
    const existing = JSON.parse(localStorage.getItem("gs_saved_drill_plans") ?? "[]");
    localStorage.setItem("gs_saved_drill_plans", JSON.stringify([plan, ...existing]));
    setDrillPlanSaved(true);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Header */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/coach" style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a5c2a", fontWeight: 700, fontSize: 13 }}>
              <ArrowLeft size={15} /> Coach Hub
            </Link>
            <div style={{ width: 1, height: 20, backgroundColor: "#e5e5e5" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Field Assessment</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Position-specific tests · Benchmarks · Radar</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 56px" }}>

        {/* ── Step 1: Player selector ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={16} color="#1a5c2a" />
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">Step 1 — Select Player</h2>
          </div>
          {squadLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={15} className="animate-spin" /> Loading squad…
            </div>
          ) : squad.length === 0 ? (
            <p className="text-sm text-gray-500">No players in your squad yet. <Link href="/coach/squad" className="text-[#1a5c2a] font-semibold">Add players</Link> first.</p>
          ) : (
            <select
              value={selectedMember?.id ?? ""}
              onChange={(e) => {
                const m = squad.find((s) => s.id === e.target.value) ?? null;
                setSelectedMember(m);
                setPositionGroup("");
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#1a5c2a]"
            >
              <option value="">Choose a player…</option>
              {squad.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.shirt_no} {m.name} — {m.position}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ── Step 2: Position selector ── */}
        {selectedMember && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-4">
              Step 2 — Select Position to Test
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(POSITIONS_TESTS).map(([key, pos]) => (
                <button
                  key={key}
                  onClick={() => setPositionGroup(key)}
                  className="rounded-xl border-2 py-3 px-4 text-left transition-all"
                  style={{
                    borderColor:     positionGroup === key ? "#1a5c2a" : "#e5e5e5",
                    backgroundColor: positionGroup === key ? "#f0fdf4" : "#fafafa",
                  }}
                >
                  <div className="text-xs font-black uppercase tracking-wide" style={{ color: positionGroup === key ? "#1a5c2a" : "#374151" }}>
                    {pos.label}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{pos.tests.length} tests</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Enter test results ── */}
        {selectedMember && positionGroup && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wide text-gray-900 mb-1">
              Step 3 — Enter Test Results
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Run each test with {selectedMember.name} and enter the measured value.
            </p>

            <div className="space-y-3">
              {currentTests.map((t) => {
                const val    = results[t.name] ?? "";
                const filled = val.trim() !== "";
                const passes = filled && passesBenchmark(t.benchmark, val, t.unit);
                const score  = filled ? calcBenchmarkScore(t.benchmark, val, t.unit) : null;
                const open   = expandedTest === t.name;

                return (
                  <div
                    key={t.name}
                    className="rounded-xl border transition-colors"
                    style={{ borderColor: filled ? (passes ? "#bbf7d0" : "#fed7aa") : "#e5e5e5" }}
                  >
                    {/* Test header */}
                    <div className="px-4 pt-3 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {filled && passes && <CheckCircle2 size={14} color="#16a34a" />}
                          <span className="text-sm font-bold text-gray-900">{t.name}</span>
                        </div>
                        {score !== null && (
                          <span className="text-sm font-black" style={{ color: scoreColor(score) }}>{score}%</span>
                        )}
                      </div>

                      {/* Input row */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Enter value…"
                          value={val}
                          onChange={(e) => setResults((prev) => ({ ...prev, [t.name]: e.target.value }))}
                          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1a5c2a]"
                        />
                        <span className="text-xs text-gray-500 shrink-0 w-20 text-right">{t.unit}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-gray-400">Benchmark: {t.benchmark} {t.unit}</span>
                        <button
                          onClick={() => setExpandedTest(open ? null : t.name)}
                          className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600"
                        >
                          Protocol {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </div>

                      {/* Progress bar */}
                      {score !== null && (
                        <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${score}%`, backgroundColor: scoreColor(score) }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Protocol dropdown */}
                    {open && (
                      <div className="border-t border-gray-100 px-4 py-3 space-y-1.5 bg-gray-50 rounded-b-xl">
                        <p className="text-[11px]"><span className="font-semibold text-gray-600">Setup: </span><span className="text-gray-500">{t.setup}</span></p>
                        <p className="text-[11px]"><span className="font-semibold text-gray-600">Run: </span><span className="text-gray-500">{t.run}</span></p>
                        <p className="text-[11px]"><span className="font-semibold text-gray-600">Record: </span><span className="text-gray-500">{t.record}</span></p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Live radar + score (shows as values are entered) ── */}
        {selectedMember && positionGroup && radarData.some((d) => d.score > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} color="#1a5c2a" />
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Live Results</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black" style={{ color: scoreColor(overallScore) }}>{overallScore}</div>
                <div className="text-[10px] font-semibold" style={{ color: scoreColor(overallScore) }}>{scoreLabel(overallScore)}</div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(26,92,42,0.12)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#374151", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#1a5c2a" fill="#1a5c2a" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <p className="text-center text-[10px] text-gray-400 mt-1">% of benchmark achieved per test</p>

            {/* Per-test breakdown */}
            <div className="mt-4 space-y-2">
              {currentTests.map((t) => {
                const val   = results[t.name];
                const score = val?.trim() ? calcBenchmarkScore(t.benchmark, val, t.unit) : null;
                const passes = score !== null && passesBenchmark(t.benchmark, val, t.unit);
                return (
                  <div key={t.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 shrink-0 w-36 truncate">{t.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${score ?? 0}%`, backgroundColor: score ? scoreColor(score) : "#e5e5e5" }}
                      />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ color: score ? scoreColor(score) : "#9ca3af" }}>
                      {score !== null ? `${score}%` : "—"}
                    </span>
                    {passes && <CheckCircle2 size={12} color="#16a34a" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Submit + AI report ── */}
        {selectedMember && positionGroup && allFilled && (
          <div className="space-y-3 mb-4">

            {submitError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {submitError}
              </div>
            )}

            {submitted ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
                <CheckCircle2 size={16} color="#16a34a" />
                <span className="text-sm font-semibold text-green-800">
                  Results saved for {selectedMember.name}
                </span>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#1a5c2a", color: "#fff" }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {submitting ? "Saving…" : `Save Results for ${selectedMember.name}`}
              </button>
            )}

            <button
              onClick={getAiReport}
              disabled={loadingReport}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#f0b429] py-3 text-sm font-bold transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#fffbeb", color: "#92400e" }}
            >
              {loadingReport ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
              {loadingReport ? "Generating AI Report…" : "Get AI Coaching Report"}
            </button>
          </div>
        )}

        {/* ── AI Report ── */}
        {aiReport && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} color="#d97706" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">AI Coaching Report</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiReport}</p>
          </div>
        )}

        {/* ── Drill recommendations ── */}
        {drillRecs.length > 0 && (
          <div className="bg-white rounded-2xl border border-green-200 p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={15} color="#16a34a" />
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-900">Drill Recommendations</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Based on gaps</span>
            </div>

            <div className="space-y-3">
              {drillRecs.map(({ gap, drill, targetPhase }, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="rounded-full text-[10px] font-bold uppercase px-2 py-0.5"
                      style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                      {gap.domain.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="rounded-full text-[10px] font-medium px-2 py-0.5"
                      style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                      {targetPhase} phase
                    </span>
                    <span className="ml-auto text-[10px] text-gray-400">{gap.percentile}% vs benchmark</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">{drill.name}</h4>
                  <p className="text-xs text-gray-600 mb-2">{drill.description}</p>
                  <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mb-2">
                    <span>⏱ {drill.duration}</span>
                    {(!drill.requiresEquipment || drill.requiresEquipment.length === 0)
                      ? <span>No equipment needed</span>
                      : <span>{drill.requiresEquipment.join(", ")}</span>
                    }
                  </div>
                  {drill.coachingPoints.length > 0 && (
                    <ul className="space-y-0.5">
                      {drill.coachingPoints.map((pt, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                          <span className="mt-0.5 shrink-0 text-green-500">›</span>{pt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveDrillPlan}
              disabled={drillPlanSaved}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
              style={{ backgroundColor: drillPlanSaved ? "#dcfce7" : "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}
            >
              {drillPlanSaved
                ? <><BookmarkCheck size={14} /> Drill plan saved!</>
                : <><Bookmark size={14} /> Save drill plan for {selectedMember?.name}</>
              }
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
