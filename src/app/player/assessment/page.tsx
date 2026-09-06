"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, CheckCircle2, Loader2, TrendingUp,
  Zap, Bookmark, BookmarkCheck,
  ClipboardList, Send, Clock, MapPin, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { useAuthStore } from "@/lib/auth-store";
import { queryAI } from "@/lib/ai-query";
import { calcBenchmarkScore } from "@/lib/skill-scoring";
import api from "@/lib/api";
import { safeArray } from "@/lib/safe-array";
import {
  selectFocusGaps, resolveAgeGroup,
  type DomainScores, type TestPercentile, type Position, type AgeGroup,
} from "@/lib/grs-engine";
import { getDrillsForGaps, type DrillRecommendation } from "@/lib/drill-selector";

// ── Test definitions ──────────────────────────────────────────────────────────

const POSITIONS_TESTS: Record<string, {
  label: string;
  tests: { name: string; desc: string; benchmark: string; unit: string }[];
}> = {
  goalkeeper: {
    label: "Goalkeeper",
    tests: [
      { name: "Reaction save",        desc: "Partner shoots from 7m. Record saves out of 10",          benchmark: "6",   unit: "saves/10" },
      { name: "Distribution accuracy",desc: "Throw accurately to target zones (10 throws)",             benchmark: "7",   unit: "accurate/10" },
      { name: "Dive reach (left)",    desc: "Measure max reach on a diving save left side",             benchmark: "2.3", unit: "metres" },
      { name: "Dive reach (right)",   desc: "Measure max reach on a diving save right side",            benchmark: "2.3", unit: "metres" },
    ],
  },
  defender: {
    label: "Defender",
    tests: [
      { name: "40m sprint",           desc: "Sprint 40m from standing start",                          benchmark: "5.2", unit: "seconds" },
      { name: "1v1 tackle success",   desc: "10 1v1 defending attempts vs attacker",                   benchmark: "6",   unit: "won/10" },
      { name: "Clearance distance",   desc: "Head or kick clearance from penalty area",                benchmark: "30",  unit: "metres" },
      { name: "Pass accuracy",        desc: "5m, 15m, 30m passes (10 each). Count accurate",          benchmark: "22",  unit: "accurate/30" },
    ],
  },
  midfielder: {
    label: "Midfielder",
    tests: [
      { name: "20m sprint",           desc: "Sprint 20m from standing start (acceleration)",           benchmark: "3.0", unit: "seconds" },
      { name: "Passing accuracy",     desc: "Pass to targets at 5m, 15m, 30m. 10 per distance",       benchmark: "24",  unit: "accurate/30" },
      { name: "Ball retention (1v1)", desc: "Keep the ball vs defender for 20 seconds, 5 attempts",   benchmark: "3",   unit: "retained/5" },
      { name: "Yo-Yo endurance",      desc: "Intermittent recovery test — record level reached",       benchmark: "14",  unit: "level" },
    ],
  },
  forward: {
    label: "Forward",
    tests: [
      { name: "10m sprint",           desc: "Pure acceleration over 10m",                              benchmark: "1.7", unit: "seconds" },
      { name: "Shooting accuracy",    desc: "Shoot from edge of box, 10 attempts (5 zones)",          benchmark: "5",   unit: "on target/10" },
      { name: "Dribble + finish",     desc: "Cone dribble 20m then finish. Time to goal",             benchmark: "8.5", unit: "seconds" },
      { name: "Aerial duel wins",     desc: "10 crosses from wide — win duel or score",               benchmark: "4",   unit: "won/10" },
    ],
  },
};


// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 90) return "text-green-400";
  if (score >= 70) return "text-[#f0b429]";
  if (score >= 50) return "text-blue-400";
  return "text-red-400";
}

function scoreLabel(score: number) {
  if (score >= 90) return "Elite";
  if (score >= 75) return "Advanced";
  if (score >= 60) return "Developing";
  if (score >= 45) return "Beginner";
  return "Needs Work";
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Coach field test type ─────────────────────────────────────────────────────

interface CoachFieldTest {
  id: string;
  position: string;
  test_name: string;
  raw_value: string;
  unit: string;
  benchmark: string;
  domain: string;
  recorded_at: string;
}

const POSITION_GROUP_LABELS: Record<string, string> = {
  goalkeeper: "Goalkeeper",
  defender:   "Defender",
  midfielder: "Midfielder",
  forward:    "Forward",
};

// ── Drill recommendation bridge ───────────────────────────────────────────────
// Maps each field test name → the GRS domain it exercises.

const TEST_DOMAIN_MAP: Record<string, keyof DomainScores> = {
  // Goalkeeper
  "Reaction save":         "cognitiveSpeed",
  "Distribution accuracy": "ballMastery",
  "Dive reach left":        "explosivePower",
  "Dive reach right":       "explosivePower",
  // Defender
  "40m sprint":            "linearSpeed",
  "1v1 tackle success":    "cognitiveSpeed",
  "Clearance distance":    "explosivePower",
  "Pass accuracy":         "ballMastery",
  // Midfielder
  "20m sprint":            "linearSpeed",
  "Passing accuracy":      "ballMastery",
  "Ball retention 1v1":    "cognitiveSpeed",
  "Yo-Yo endurance":       "endurance",
  // Forward
  "10m sprint":            "linearSpeed",
  "Shooting accuracy":     "ballMastery",
  "Dribble + finish":      "cognitiveSpeed",
  "Aerial duel wins":      "explosivePower",
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
      // Multiple tests mapping to the same domain — average them
      domains[domain].percentile = Math.round((domains[domain].percentile + pct) / 2);
    } else {
      domains[domain].percentile = pct;
      domains[domain].tested     = true;
    }
  }
  return domains;
}



export default function AssessmentPage() {
  const user = useAuthStore((s) => s.user);
  // Field tests state
  const [positionGroup, setPositionGroup] = useState("");
  const [started, setStarted]             = useState(false);
  const [results, setResults]             = useState<Record<string, string>>({});
  const [aiReport, setAiReport]           = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [drillPlanSaved, setDrillPlanSaved] = useState(false);

  // Coach field tests (read-only — submitted by coach on player's behalf)
  const [coachFieldTests, setCoachFieldTests]         = useState<CoachFieldTest[]>([]);
  const [coachFieldTestsLoading, setCoachFieldTestsLoading] = useState(false);
  const [coachFieldTestsLoaded, setCoachFieldTestsLoaded]   = useState(false);

  // Profile-derived values (sport for stats endpoint, age for drill tier)
  const [playerSport,    setPlayerSport]    = useState("football");
  const [playerAge,      setPlayerAge]      = useState(15);
  const [playerProvince, setPlayerProvince] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");

  // Assessment request state (request a coach to run field tests)
  const [existingRequest,      setExistingRequest]      = useState<{
    id: string; status: string; position: string | null; province: string | null;
    preferred_time: string | null; created_at: string;
  } | null>(null);
  const [reqLoaded,            setReqLoaded]            = useState(false);
  const [reqPosition,          setReqPosition]          = useState("");
  const [reqProvince,          setReqProvince]          = useState("");
  const [reqPreferredTime,     setReqPreferredTime]     = useState("");
  const [reqNote,              setReqNote]              = useState("");
  const [reqSubmitting,        setReqSubmitting]        = useState(false);
  const [reqSuccess,           setReqSuccess]           = useState(false);
  const [reqError,             setReqError]             = useState("");
  const [expandedProtocol,     setExpandedProtocol]     = useState<string | null>(null);


  useEffect(() => { /* auth handled by layout.tsx */ }, [user]);

  // Fetch profile once on mount to get sport + DOB + province + position
  useEffect(() => {
    api.get("/profile")
      .then((res) => {
        const p = res.data?.data ?? res.data ?? {};
        if (p.sport)     setPlayerSport(p.sport);
        if (p.province)  { setPlayerProvince(p.province); setReqProvince(p.province); }
        if (p.position_primary ?? p.position) {
          const pos = p.position_primary ?? p.position ?? "";
          setPlayerPosition(pos);
          // Map to position group for the request form
          const grp = pos.toLowerCase().includes("keeper") || pos.toLowerCase().includes("goal")
            ? "goalkeeper"
            : pos.toLowerCase().includes("defend") || pos.toLowerCase().includes("back")
            ? "defender"
            : pos.toLowerCase().includes("mid")
            ? "midfielder"
            : pos.toLowerCase().includes("forward") || pos.toLowerCase().includes("striker") || pos.toLowerCase().includes("winger")
            ? "forward"
            : "";
          if (grp) setReqPosition(grp);
        }
        const dobStr = p.date_of_birth ?? p.dob;
        if (dobStr) {
          const age = Math.floor((Date.now() - new Date(dobStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age > 0 && age < 60) setPlayerAge(age);
        }
      })
      .catch(() => {});
  }, []);


  // Load coach-submitted field tests + existing request on mount
  useEffect(() => {
    if (coachFieldTestsLoaded) return;
    setCoachFieldTestsLoading(true);
    Promise.allSettled([
      api.get("/player/field-tests"),
      api.get("/player/field-test-requests"),
    ]).then(([testsResult, reqResult]) => {
      if (testsResult.status === "fulfilled") {
        setCoachFieldTests(safeArray<CoachFieldTest>(testsResult.value.data?.data ?? testsResult.value.data));
      }
      if (reqResult.status === "fulfilled") {
        const rows = safeArray<{ id: string; status: string; position: string | null; province: string | null; preferred_time: string | null; created_at: string }>(reqResult.value.data?.data ?? reqResult.value.data);
        const open = rows.find((r) => r.status === "open" || r.status === "accepted");
        setExistingRequest(open ?? null);
      }
    }).finally(() => {
      setCoachFieldTestsLoading(false);
      setCoachFieldTestsLoaded(true);
    });
  }, [coachFieldTestsLoaded]);

  const submitFieldTestRequest = async () => {
    setReqSubmitting(true);
    setReqError("");
    try {
      const res = await api.post("/player/field-test-request", {
        position:       reqPosition || undefined,
        province:       reqProvince || undefined,
        preferred_time: reqPreferredTime || undefined,
        note:           reqNote || undefined,
      });
      setExistingRequest(res.data?.data ?? null);
      setReqSuccess(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setReqError(msg ?? "Could not submit request. Please try again.");
    } finally {
      setReqSubmitting(false);
    }
  };


  const currentTests = positionGroup ? (POSITIONS_TESTS[positionGroup]?.tests ?? []) : [];
  const allFilled    = currentTests.length > 0 && currentTests.every((t) => results[t.name]?.trim());

  // Build radar data from benchmark scores
  const radarData = currentTests.map((t) => ({
    subject: t.name.length > 12 ? t.name.slice(0, 12) + "…" : t.name,
    score:   results[t.name] ? calcBenchmarkScore(t.benchmark, results[t.name], t.unit) : 0,
    fullMark: 100,
  }));

  const overallScore = radarData.length
    ? Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length)
    : 0;

  // Drill recommendations — recomputed when self-assessment results change
  const drillRecs: DrillRecommendation[] = (() => {
    if (!positionGroup || !allFilled) return [];
    const pos    = (positionGroup === "forward" ? "striker" : positionGroup) as Position;
    const ageGrp = resolveAgeGroup(playerAge);
    const domains = buildDomainScoresFromTests(currentTests, results);
    const gaps   = selectFocusGaps(domains, pos, ageGrp, 4);
    return getDrillsForGaps(gaps, pos, ageGrp);
  })();

  const saveDrillPlan = () => {
    const plan = {
      savedAt:   new Date().toISOString(),
      position:  positionGroup,
      drills:    drillRecs.map(({ gap, drill, targetPhase }) => ({
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
    // Backend route not yet built — store locally so data is never lost
    const existing = JSON.parse(localStorage.getItem("gs_saved_drill_plans") ?? "[]");
    localStorage.setItem("gs_saved_drill_plans", JSON.stringify([plan, ...existing]));
    setDrillPlanSaved(true);
  };

  const saveCoachDrillPlan = (drills: DrillRecommendation[], pos: string) => {
    const plan = {
      savedAt:  new Date().toISOString(),
      position: pos,
      drills:   drills.map(({ gap, drill, targetPhase }) => ({
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

  const getReport = async () => {
    setLoadingReport(true);
    const summary = currentTests
      .map((t) => `${t.name}: ${results[t.name]} ${t.unit} (benchmark: ${t.benchmark})`)
      .join(", ");
    try {
      const reply = await queryAI(
        `Position assessment results for ${positionGroup}: ${summary}.
Provide a brief analysis: overall rating out of 10, 2 key strengths, 2 areas to improve, and a 4-week training focus. Be specific and encouraging.`,
        "player",
      );
      setAiReport(reply);
    } catch {
      setAiReport("Unable to connect to AI Coach. Please check your connection and try again.");
    } finally {
      setLoadingReport(false);
    }
  };

  const compareToChampionship = (test: { benchmark: string; unit: string }, value: string): boolean => {
    const numVal   = parseFloat(value);
    const numBench = parseFloat(test.benchmark);
    if (isNaN(numVal) || isNaN(numBench)) return false;
    return test.unit === "seconds" ? numVal <= numBench : numVal >= numBench;
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-6">

        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors text-sm font-semibold" style={{ color: "#f0b429" }}>
            <ArrowLeft className="h-4 w-4" />
            Player Hub
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#f0b429" }}>Assessment</h1>
            <p className="text-sm font-bold text-white">Coach-verified field tests &amp; position benchmarks</p>
          </div>
        </div>


        {/* ── FIELD TESTS — read-only coach results ── */}
        {(() => {
          if (coachFieldTestsLoading) {
            return (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-[#f0b429]" />
              </div>
            );
          }

          if (coachFieldTests.length === 0) {
            /* ── PROTOCOL DEFINITIONS — shown as collapsible cards ── */
            const PROTOCOLS: Record<string, { label: string; tests: { name: string; setup: string; run: string; record: string }[] }> = {
              goalkeeper: {
                label: "Goalkeeper",
                tests: [
                  {
                    name: "Reaction Save",
                    setup: "Keeper on goal-line, central. Partner stands 7 m away with 10 balls.",
                    run: "Partner shoots low or half-height to alternate sides — one ball every ~8 seconds. No warning of direction.",
                    record: "Count saves made out of 10. Benchmark: 6/10.",
                  },
                  {
                    name: "Distribution Accuracy",
                    setup: "Place 4 cones at 10 m, 20 m, and left/right at 15 m to mark target zones (~2 m diameter).",
                    run: "Keeper throws or rolls 10 balls trying to hit any cone target. Mix overarm and underarm.",
                    record: "Count accurate deliveries (ball stops within 2 m of a cone) out of 10. Benchmark: 7/10.",
                  },
                  {
                    name: "Dive Reach — Left",
                    setup: "Keeper stands in ready position central. Mark the starting foot position.",
                    run: "Keeper dives left as far as possible from standing, reaching with outstretched hands. 3 attempts.",
                    record: "Measure from start mark to fingertip at landing. Best of 3. Benchmark: 2.3 m.",
                  },
                  {
                    name: "Dive Reach — Right",
                    setup: "Same as above, dive right.",
                    run: "3 attempts diving right.",
                    record: "Best of 3 in metres. Benchmark: 2.3 m.",
                  },
                ],
              },
              defender: {
                label: "Defender",
                tests: [
                  {
                    name: "40m Sprint",
                    setup: "Mark start and 40 m finish lines on flat ground. Coach holds stopwatch at finish line.",
                    run: "Player starts from standing. Coach starts timer on first movement. Two attempts with 3-minute rest between.",
                    record: "Best time in seconds. Benchmark: 5.2 s.",
                  },
                  {
                    name: "1v1 Tackle Success",
                    setup: "10 m × 6 m channel. Attacker starts with ball at one end, defender at the other.",
                    run: "Attacker tries to dribble past defender to the far end. 10 attempts. Rotate roles between rounds.",
                    record: "Count successful defensive actions (tackle, block, or force ball out of channel) out of 10. Benchmark: 6/10.",
                  },
                  {
                    name: "Clearance Distance",
                    setup: "Ball placed 2 m inside the penalty area edge. Measure from that point outward.",
                    run: "Player clears the ball (kick or headed) 5 times. No run-up restriction.",
                    record: "Measure where the ball first lands. Average of best 3. Benchmark: 30 m.",
                  },
                  {
                    name: "Pass Accuracy",
                    setup: "Three target zones at 5 m, 15 m, and 30 m — each a 2 m × 2 m square marked with cones.",
                    run: "10 passes to each zone (30 total). Player can choose which zone each pass goes to, but must attempt all three distances.",
                    record: "Count passes landing within the target zone. Benchmark: 22/30.",
                  },
                ],
              },
              midfielder: {
                label: "Midfielder",
                tests: [
                  {
                    name: "20m Sprint",
                    setup: "Mark start and 20 m lines on flat ground.",
                    run: "Standing start. Two attempts, 2-minute rest between.",
                    record: "Best time in seconds. Benchmark: 3.0 s.",
                  },
                  {
                    name: "Passing Accuracy",
                    setup: "Three target squares at 5 m, 15 m, 30 m (2 m × 2 m each).",
                    run: "10 passes to each distance (30 total). Player chooses foot and technique.",
                    record: "Total accurate passes landing in target. Benchmark: 24/30.",
                  },
                  {
                    name: "Ball Retention 1v1",
                    setup: "4 m × 4 m square. Midfielder has the ball; defender tries to win it.",
                    run: "Midfielder keeps ball for 20 seconds per attempt. 5 attempts total. Reset after each.",
                    record: "Count attempts where midfielder kept ball for full 20 s. Benchmark: 3/5.",
                  },
                  {
                    name: "Yo-Yo Endurance",
                    setup: "Two cones 20 m apart. Use the standard Yo-Yo Intermittent Recovery Test Level 1 audio track (available free online).",
                    run: "Player runs 20 m and back in time to each beep. Rest 10 s between shuttles. Continue until they fail to reach the cone twice.",
                    record: "Record the level/stage reached when they stopped. Benchmark: Level 14.",
                  },
                ],
              },
              forward: {
                label: "Forward",
                tests: [
                  {
                    name: "10m Sprint",
                    setup: "Mark start and 10 m lines. This tests explosive first-step acceleration.",
                    run: "Standing start. Three attempts, 90-second rest between.",
                    record: "Best time in seconds. Benchmark: 1.7 s.",
                  },
                  {
                    name: "Shooting Accuracy",
                    setup: "Ball placed 16 m from goal. Divide goal into 6 zones with cones or bibs. No goalkeeper.",
                    run: "10 shots — player may use any technique. At least 3 must be with weaker foot.",
                    record: "Count shots on target (within the goal frame). Benchmark: 5/10.",
                  },
                  {
                    name: "Dribble + Finish",
                    setup: "Ball at start, 6 cones in slalom pattern over 15 m, shooting zone at end 12 m from goal.",
                    run: "Player dribbles through slalom then shoots. Coach starts timer at first touch, stops when ball crosses goal-line or goes wide. 3 attempts.",
                    record: "Time from first touch to shot contact. Best of 3. Benchmark: 8.5 s.",
                  },
                  {
                    name: "Aerial Duel Wins",
                    setup: "Coach or partner delivers 10 crossed balls into the box by hand or kick from the flank.",
                    run: "Forward attacks the ball in the air and attempts to head/chest it toward goal. One defender applies passive pressure from behind.",
                    record: "Count aerial contacts where forward gets clear contact (not deflected). Benchmark: 4/10.",
                  },
                ],
              },
            };

            /* ── Pending/accepted request banner ── */
            const pendingBanner = existingRequest ? (
              <div className="mx-auto mb-6 max-w-lg rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                  <div>
                    <p className="text-sm font-bold text-green-300">
                      {existingRequest.status === "accepted"
                        ? "A coach has accepted your request!"
                        : "Assessment request submitted"}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      {existingRequest.status === "accepted"
                        ? "Your coach will be in touch to arrange the session. Check your notifications."
                        : `Open request for ${existingRequest.position ?? "any position"} in ${existingRequest.province ?? "your area"} — waiting for a coach to accept.`}
                    </p>
                    {existingRequest.status === "open" && (
                      <button
                        className="mt-2 text-xs text-white/40 underline"
                        onClick={async () => {
                          // re-submit clears old request (server cancels it)
                          setExistingRequest(null);
                          setReqSuccess(false);
                        }}
                      >
                        Cancel and submit a new request
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null;

            /* ── Request form ── */
            const requestForm = !existingRequest && !reqSuccess ? (
              <div className="mx-auto mb-8 max-w-lg rounded-2xl border border-[#f0b429]/20 bg-[#f0b429]/5 p-6">
                <div className="mb-4 flex items-center gap-3">
                  <ClipboardList className="h-6 w-6 text-[#f0b429]" />
                  <div>
                    <h2 className="text-base font-bold" style={{ color: "#f0b429" }}>Request a Coach Assessment</h2>
                    <p className="text-xs text-white/60">A verified coach in your area will run the 4 position tests and enter your results.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/70">Your Position</label>
                    <select
                      value={reqPosition}
                      onChange={(e) => setReqPosition(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select position group…</option>
                      <option value="goalkeeper">Goalkeeper</option>
                      <option value="defender">Defender</option>
                      <option value="midfielder">Midfielder</option>
                      <option value="forward">Forward / Striker</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/70">Province</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                      <select
                        value={reqProvince}
                        onChange={(e) => setReqProvince(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white"
                      >
                        <option value="">Any province</option>
                        {["Harare","Bulawayo","Manicaland","Mashonaland Central","Mashonaland East","Mashonaland West","Masvingo","Matabeleland North","Matabeleland South","Midlands"].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/70">Preferred Time</label>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                      <select
                        value={reqPreferredTime}
                        onChange={(e) => setReqPreferredTime(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white"
                      >
                        <option value="">Any time</option>
                        <option value="Weekday morning">Weekday morning</option>
                        <option value="Weekday afternoon">Weekday afternoon</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Any">Any time</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/70">Note to coach <span className="font-normal text-white/40">(optional)</span></label>
                    <textarea
                      value={reqNote}
                      onChange={(e) => setReqNote(e.target.value)}
                      maxLength={300}
                      rows={2}
                      placeholder="e.g. I train at Rufaro Stadium on Saturdays…"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 resize-none"
                    />
                  </div>

                  {reqError && (
                    <p className="rounded-lg bg-red-900/40 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                      {reqError}
                    </p>
                  )}

                  <button
                    onClick={submitFieldTestRequest}
                    disabled={reqSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                    style={{ background: "#f0b429", color: "#1a1a1a" }}
                  >
                    {reqSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {reqSubmitting ? "Submitting…" : "Request Field Test Session"}
                  </button>
                </div>
              </div>
            ) : null;

            /* ── Protocol reference cards ── */
            const protocolCards = (
              <div className="mx-auto max-w-lg">
                <p className="mb-3 text-center text-xs text-white/50">
                  Once a coach accepts your request, they will run these 4 tests based on your position:
                </p>
                {Object.entries(PROTOCOLS).map(([posKey, posDef]) => (
                  <div key={posKey} className="mb-3 rounded-xl border border-white/10 bg-white/3 overflow-hidden">
                    <button
                      className="flex w-full items-center justify-between px-4 py-3 text-left"
                      onClick={() => setExpandedProtocol(expandedProtocol === posKey ? null : posKey)}
                    >
                      <span className="text-sm font-bold text-white">{posDef.label} Protocol</span>
                      {expandedProtocol === posKey
                        ? <ChevronUp className="h-4 w-4 text-white/40" />
                        : <ChevronDown className="h-4 w-4 text-white/40" />}
                    </button>
                    {expandedProtocol === posKey && (
                      <div className="border-t border-white/10 px-4 pb-4 pt-3 space-y-4">
                        {posDef.tests.map((t) => (
                          <div key={t.name} className="rounded-lg border border-white/8 bg-white/3 p-3">
                            <p className="mb-2 text-xs font-bold" style={{ color: "#f0b429" }}>{t.name}</p>
                            <div className="space-y-1 text-xs text-white/70">
                              <p><span className="font-semibold text-white/50">Setup: </span>{t.setup}</p>
                              <p><span className="font-semibold text-white/50">Run: </span>{t.run}</p>
                              <p><span className="font-semibold text-white/50">Record: </span>{t.record}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );

            return (
              <div>
                {pendingBanner}
                {requestForm}
                {protocolCards}
              </div>
            );
          }

          // Group tests by position (preserving insertion order = most recent first)
          const byPosition: Record<string, CoachFieldTest[]> = {};
          for (const t of coachFieldTests) {
            (byPosition[t.position] ??= []).push(t);
          }

          // Build drill recommendations from the most-recent position's data
          const latestPos    = coachFieldTests[0]?.position ?? "";
          const latestTests  = byPosition[latestPos] ?? [];
          const testsArg     = latestTests.map((t) => ({ name: t.test_name, benchmark: t.benchmark, unit: t.unit }));
          const resultsArg   = Object.fromEntries(latestTests.map((t) => [t.test_name, t.raw_value]));
          const domains      = buildDomainScoresFromTests(testsArg, resultsArg);
          const ageGrp       = resolveAgeGroup(playerAge);
          const posLabel     = (latestPos === "forward" ? "striker" : latestPos) as Position;
          const gaps         = selectFocusGaps(domains, posLabel, ageGrp, 4);
          const coachDrillRecs = getDrillsForGaps(gaps, posLabel, ageGrp);

          return (
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 rounded-xl border border-[#f0b429]/20 bg-[#f0b429]/5 px-4 py-3">
                <p className="text-xs font-bold text-white">
                  ✅ Coach-verified results — submitted by your coach after running position field tests with you.
                </p>
              </div>

              {/* One card per position group */}
              {Object.entries(byPosition).map(([pos, tests]) => {
                const posRadar = tests.map((t) => {
                  const pct   = calcBenchmarkScore(t.benchmark, t.raw_value, t.unit);
                  const label = t.test_name.length > 12 ? t.test_name.slice(0, 12) + "…" : t.test_name;
                  return { subject: label, score: pct, fullMark: 100 };
                });
                const posOverall = posRadar.length
                  ? Math.round(posRadar.reduce((s, d) => s + d.score, 0) / posRadar.length)
                  : 0;
                const recordedAt = tests[0]?.recorded_at;

                return (
                  <div key={pos} className="mb-6 rounded-2xl border border-[#f0b429]/15 bg-card/60 p-5 backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-bold" style={{ color: "#f0b429" }}>
                          {POSITION_GROUP_LABELS[pos] ?? pos} Tests
                        </h2>
                        {recordedAt && (
                          <p className="text-xs text-white/50">
                            Recorded {new Date(recordedAt).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-3xl font-black ${scoreColor(posOverall)}`}>{posOverall}</p>
                        <p className={`text-xs font-medium ${scoreColor(posOverall)}`}>{scoreLabel(posOverall)}</p>
                      </div>
                    </div>

                    {/* Test result rows */}
                    <div className="mb-5 space-y-3">
                      {tests.map((t) => {
                        const pct    = calcBenchmarkScore(t.benchmark, t.raw_value, t.unit);
                        const passed = t.unit === "seconds"
                          ? parseFloat(t.raw_value) <= parseFloat(t.benchmark)
                          : parseFloat(t.raw_value) >= parseFloat(t.benchmark);
                        return (
                          <div
                            key={t.id}
                            className={`rounded-xl border p-4 ${
                              passed ? "border-green-500/40 bg-green-500/5" : "border-[#f0b429]/15 bg-[#f0b429]/5"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-[#f0b429]">{t.test_name}</p>
                                <p className="mt-0.5 text-sm text-white">
                                  {t.raw_value}{" "}
                                  <span className="text-xs text-white/50">{t.unit}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-lg font-black ${scoreColor(pct)}`}>{pct}%</span>
                                {passed && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                              </div>
                            </div>
                            <div className="mt-2 h-1.5 rounded-full bg-white/10">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  pct >= 90 ? "bg-green-400" :
                                  pct >= 70 ? "bg-[#f0b429]" :
                                  pct >= 50 ? "bg-blue-400"  : "bg-red-400"
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-white/40">Benchmark: {t.benchmark} {t.unit}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Radar chart (only when ≥2 tests) */}
                    {posRadar.length >= 2 && (
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-[#f0b429]" />
                          <h3 className="text-sm font-semibold" style={{ color: "#f0b429" }}>Skill Radar</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={posRadar}>
                            <PolarGrid stroke="rgba(240,180,41,0.15)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: "#c8edd0", fontSize: 11 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Score" dataKey="score" stroke="#f0b429" fill="#f0b429" fillOpacity={0.25} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs font-bold text-white">% of benchmark achieved per test</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Drill recommendations from most-recent position */}
              {coachDrillRecs.length > 0 && (
                <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/5 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-400" />
                    <h3 className="font-semibold text-green-400">Recommended Drills</h3>
                    <span className="ml-auto rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-300">
                      Based on your gaps
                    </span>
                  </div>
                  <div className="space-y-4">
                    {coachDrillRecs.map(({ gap, drill, targetPhase }, i) => (
                      <div key={i} className="rounded-lg border border-green-500/20 bg-black/20 p-4">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[#f0b429]/15 px-2 py-0.5 text-xs font-bold text-[#f0b429] capitalize">
                            {gap.domain.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-300 capitalize">
                            {targetPhase} phase
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">{gap.percentile}% vs benchmark</span>
                        </div>
                        <h4 className="mb-1 font-semibold text-white">{drill.name}</h4>
                        <p className="mb-2 text-sm text-muted-foreground">{drill.description}</p>
                        <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>⏱ {drill.duration}</span>
                          {(!drill.requiresEquipment || drill.requiresEquipment.length === 0)
                            ? <span>🎽 No equipment needed</span>
                            : <span>🎽 {drill.requiresEquipment.join(", ")}</span>
                          }
                        </div>
                        {drill.coachingPoints.length > 0 && (
                          <ul className="space-y-0.5">
                            {drill.coachingPoints.map((pt, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-xs text-white/70">
                                <span className="mt-0.5 shrink-0 text-green-400">›</span>{pt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => saveCoachDrillPlan(coachDrillRecs, latestPos)}
                    disabled={drillPlanSaved}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                      drillPlanSaved
                        ? "bg-green-500/20 text-green-300 cursor-default"
                        : "bg-green-500/15 text-green-300 hover:bg-green-500/25"
                    }`}
                  >
                    {drillPlanSaved
                      ? <><BookmarkCheck className="h-4 w-4" /> Drill plan saved!</>
                      : <><Bookmark className="h-4 w-4" /> Save this drill plan</>
                    }
                  </button>
                </div>
              )}
            </div>
          );
        })()}

    </div>
  );
}
