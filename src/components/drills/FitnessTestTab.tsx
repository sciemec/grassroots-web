"use client";
// src/components/drills/FitnessTestTab.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Athletic Test Battery — 6 tests, automatic AI scoring
//
// Tests:
//   1. Jump        → video → MediaPipe (power, landing safety)
//   2. Sprint      → video → MediaPipe (pace, mechanics)
//   3. Balance     → video → MediaPipe (stability, symmetry)
//   4. Reaction    → browser tap test  (reaction time ms)
//   5. Endurance   → video → MediaPipe (fatigue resistance)
//   6. Ball Mastery→ video → Gemini    (technique, dominant foot) [optional]
//
// After all tests:
//   - Athletic profile radar saved to passport
//   - Football position automatically determined + saved to profile
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Upload, Loader2, CheckCircle2, AlertCircle,
  ChevronRight, RotateCcw, Trophy, Shield,
  Zap, Wind, Activity, Target, Star,
} from "lucide-react";
import ReactionTest from "./ReactionTest";

const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";
const AI_URL    = process.env.NEXT_PUBLIC_AI_URL ?? "https://ai.bhora-ai.onrender.com";

// ─── Types ────────────────────────────────────────────────────────────────────

type TestId = "jump" | "sprint" | "balance" | "reaction" | "endurance" | "ball_mastery";
type TestPhase = "idle" | "uploading" | "analysing" | "done" | "error";
type AgeGroup = "u13" | "u17" | "senior";
type BatteryPhase = "age_select" | "intro" | "testing" | "results";

interface TestScore {
  score: number;       // 0–100
  percentile: number;  // 0–100
  rating: string;
  key_metric: string;
  detail: string;
}

interface TestState {
  phase: TestPhase;
  score: TestScore | null;
  error: string;
  progress: number;
}

interface AthleticProfile {
  power:      number;  // from jump
  pace:       number;  // from sprint
  balance:    number;  // from balance
  reaction:   number;  // from reaction tap test
  endurance:  number;  // from endurance
  technique:  number;  // from ball mastery (or 50 if skipped)
}

// ─── Test config ──────────────────────────────────────────────────────────────

const TESTS: {
  id: TestId;
  label: string;
  icon: React.ReactNode;
  emoji: string;
  colour: string;
  optional: boolean;
  videoTest: boolean;
  drillType: string;
  duration: string;
  whatToDo: string;
  howToRecord: string[];
  whatAIMeasures: string[];
} [] = [
  {
    id: "jump", label: "Jump Test", emoji: "🦘",
    icon: <Zap size={18} />, colour: "#7c3aed", optional: false, videoTest: true,
    drillType: "jump",
    duration: "30 seconds",
    whatToDo: "Stand still, then jump as high as you can 5 times. Rest 3 seconds between each jump. Do NOT run up — standing jumps only.",
    howToRecord: [
      "Place phone sideways showing your full body from head to toe",
      "Stand 2 metres from the phone",
      "Make sure your feet and head are both visible at all times",
      "Jump straight up — do not lean forward or backward",
    ],
    whatAIMeasures: ["Jump height estimate", "Takeoff knee drive", "Landing knee flexion", "Hip symmetry on landing", "Power score"],
  },
  {
    id: "sprint", label: "Sprint Test", emoji: "💨",
    icon: <Wind size={18} />, colour: "#2563eb", optional: false, videoTest: true,
    drillType: "sprinting",
    duration: "20 seconds",
    whatToDo: "Sprint in a straight line as fast as you can for 20 metres, 3 times. Walk back between each run. Give maximum effort on every sprint.",
    howToRecord: [
      "Place phone sideways at the START of your sprint line",
      "Sprint PAST the phone — it should capture your full acceleration",
      "Run directly toward or past the camera — not sideways",
      "Make sure nothing blocks the view of your legs",
    ],
    whatAIMeasures: ["Stride symmetry", "Trunk lean angle", "Arm drive mechanics", "Acceleration pattern", "Pace score"],
  },
  {
    id: "balance", label: "Balance Test", emoji: "⚖️",
    icon: <Activity size={18} />, colour: "#059669", optional: false, videoTest: true,
    drillType: "balance",
    duration: "40 seconds",
    whatToDo: "Stand on ONE leg for 15 seconds, then switch to the other leg for 15 seconds. Keep your arms at your sides. Repeat twice.",
    howToRecord: [
      "Place phone sideways showing your full body",
      "Stand 2 metres from the phone",
      "Keep your arms at your sides throughout — no balancing with arms",
      "Look straight ahead at a fixed point",
    ],
    whatAIMeasures: ["Ankle wobble amplitude", "Hip drop detection", "Centre of mass stability", "Left vs right difference", "Balance score"],
  },
  {
    id: "reaction", label: "Reaction Test", emoji: "⚡",
    icon: <Zap size={18} />, colour: "#c8962a", optional: false, videoTest: false,
    drillType: "reaction",
    duration: "60 seconds",
    whatToDo: "Tap the screen as fast as possible when the colour appears. 5 rounds. NO video needed — this is a screen test.",
    howToRecord: [],
    whatAIMeasures: ["Average reaction time (ms)", "Consistency across rounds", "Reaction score"],
  },
  {
    id: "endurance", label: "Endurance Circuit", emoji: "🔥",
    icon: <Activity size={18} />, colour: "#dc2626", optional: false, videoTest: true,
    drillType: "endurance",
    duration: "60 seconds",
    whatToDo: "Do 20 high knees (counting each leg), then 10 squat jumps, then 20 high knees again — without stopping. Keep going until you finish.",
    howToRecord: [
      "Place phone sideways showing your full body",
      "Do NOT stop to adjust the camera — keep moving",
      "Go at your maximum effort — the AI measures how your technique changes when you get tired",
      "Stay in one spot so your full body stays in frame",
    ],
    whatAIMeasures: ["Fatigue degradation (first vs last reps)", "Knee alignment under fatigue", "Trunk stability", "Endurance score"],
  },
  {
    id: "ball_mastery", label: "Ball Mastery", emoji: "⚽",
    icon: <Target size={18} />, colour: GRS_GREEN, optional: true, videoTest: true,
    drillType: "ball_mastery",
    duration: "45 seconds",
    whatToDo: "Juggle the ball as many times as you can. If you can't juggle yet, do 10 toe taps (alternating feet on top of the ball) then kick the ball against a wall and control it 5 times.",
    howToRecord: [
      "Place phone sideways so your full body AND the ball are visible",
      "Do NOT hold the ball — drop it from your hands and start juggling",
      "If the ball goes away from camera, bring it back quickly",
      "Do your best — Gemini can see your body shape even if you lose the ball",
    ],
    whatAIMeasures: ["Touch quality", "Body shape on receiving", "Dominant foot", "Consistency", "Technique score"],
  },
];

// ─── Position determination ───────────────────────────────────────────────────

const POSITIONS = [
  {
    id: "striker", label: "Striker", emoji: "⚽",
    weights: { power: 0.30, pace: 0.30, technique: 0.25, reaction: 0.15 },
    description: "Your explosive power and pace make you a natural goal threat. You have the physical profile to beat defenders and finish chances.",
  },
  {
    id: "winger", label: "Winger", emoji: "💨",
    weights: { pace: 0.35, reaction: 0.25, balance: 0.20, power: 0.20 },
    description: "Your pace and reaction speed are your biggest weapons. You can beat defenders on the outside and deliver crosses or cut inside.",
  },
  {
    id: "attacking_mid", label: "Attacking Midfielder", emoji: "🎯",
    weights: { reaction: 0.30, technique: 0.30, balance: 0.20, endurance: 0.20 },
    description: "Your sharp reactions and technical ability make you a creative force. You can play between the lines and create chances for teammates.",
  },
  {
    id: "central_mid", label: "Central Midfielder", emoji: "🔄",
    weights: { endurance: 0.35, reaction: 0.25, balance: 0.20, technique: 0.20 },
    description: "Your endurance and intelligence let you dominate the middle of the pitch. You can cover ground, win the ball, and distribute effectively.",
  },
  {
    id: "defensive_mid", label: "Defensive Midfielder", emoji: "🛡️",
    weights: { endurance: 0.30, balance: 0.30, reaction: 0.20, pace: 0.20 },
    description: "Your stability and work rate make you the engine room of the team. You protect the defence and win the ball back quickly.",
  },
  {
    id: "full_back", label: "Full-back", emoji: "↔️",
    weights: { pace: 0.30, endurance: 0.25, reaction: 0.25, balance: 0.20 },
    description: "Your pace and stamina let you cover the full length of the pitch. You can defend against wingers and support attacks effectively.",
  },
  {
    id: "centre_back", label: "Centre-back", emoji: "🧱",
    weights: { balance: 0.30, power: 0.25, endurance: 0.25, reaction: 0.20 },
    description: "Your physical presence and stability make you a commanding defender. You win aerial duels, make last-ditch tackles, and organise the defence.",
  },
  {
    id: "goalkeeper", label: "Goalkeeper", emoji: "🧤",
    weights: { reaction: 0.40, balance: 0.25, power: 0.20, endurance: 0.15 },
    description: "Your lightning-fast reflexes and balance give you a natural goalkeeping instinct. You can command the penalty area and make reflex saves.",
  },
];

function determinePositions(profile: AthleticProfile): typeof POSITIONS {
  const scored = POSITIONS.map(pos => {
    const score = Object.entries(pos.weights).reduce((total, [key, weight]) => {
      return total + (profile[key as keyof AthleticProfile] ?? 50) * weight;
    }, 0);
    return { ...pos, score };
  });
  return scored.sort((a, b) => b.score - a.score);
}

// ─── Radar chart (SVG) ────────────────────────────────────────────────────────

function RadarChart({ profile }: { profile: AthleticProfile }) {
  const cx = 120; const cy = 120; const r = 90;
  const dims = [
    { key: "power",     label: "Power",     angle: -90 },
    { key: "pace",      label: "Pace",      angle: -30 },
    { key: "balance",   label: "Balance",   angle: 30  },
    { key: "reaction",  label: "Reaction",  angle: 90  },
    { key: "endurance", label: "Endurance", angle: 150 },
    { key: "technique", label: "Skill",     angle: 210 },
  ];

  const toXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos((angle - 90) * Math.PI / 180),
    y: cy + radius * Math.sin((angle - 90) * Math.PI / 180),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = dims.map(d => {
    const val = (profile[d.key as keyof AthleticProfile] ?? 50) / 100;
    return toXY(d.angle, val * r);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 240 240" style={{ width: "100%", maxWidth: 240 }}>
      {/* Grid rings */}
      {gridLevels.map(level => {
        const pts = dims.map(d => toXY(d.angle, level * r));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
        return <path key={level} d={path} fill="none" stroke="#e5e7eb" strokeWidth={1} />;
      })}
      {/* Spokes */}
      {dims.map(d => {
        const end = toXY(d.angle, r);
        return <line key={d.key} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e5e7eb" strokeWidth={1} />;
      })}
      {/* Data area */}
      <path d={dataPath} fill={`${GRS_GREEN}30`} stroke={GRS_GREEN} strokeWidth={2} />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={GRS_GREEN} />
      ))}
      {/* Labels */}
      {dims.map(d => {
        const pos = toXY(d.angle, r + 18);
        const val = profile[d.key as keyof AthleticProfile] ?? 50;
        return (
          <g key={d.key}>
            <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#374151">
              {d.label}
            </text>
            <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize={9} fill={GRS_GREEN} fontWeight={800}>
              {val}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FitnessTestTabProps {
  user: { id?: string; name?: string; email?: string } | null;
}

export default function FitnessTestTab({ user }: FitnessTestTabProps) {
  const [batteryPhase, setBatteryPhase] = useState<BatteryPhase>("age_select");
  const [ageGroup,     setAgeGroup]     = useState<AgeGroup>("u17");
  const [currentTest,  setCurrentTest]  = useState(0);
  const [testStates,   setTestStates]   = useState<Record<TestId, TestState>>(
    Object.fromEntries(TESTS.map(t => [t.id, { phase: "idle", score: null, error: "", progress: 0 }])) as Record<TestId, TestState>
  );
  const [profile,      setProfile]      = useState<AthleticProfile | null>(null);
  const [positions,    setPositions]    = useState<typeof POSITIONS>([]);
  const [saving,       setSaving]       = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const xhrRef  = useRef<XMLHttpRequest | null>(null);

  const updateTest = useCallback((id: TestId, update: Partial<TestState>) => {
    setTestStates(prev => ({ ...prev, [id]: { ...prev[id], ...update } }));
  }, []);

  // ── Upload + analyse a video test ─────────────────────────────────────────

  const handleVideoUpload = useCallback(async (
    file: File,
    test: typeof TESTS[0],
  ) => {
    updateTest(test.id, { phase: "uploading", progress: 0, error: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Ball mastery → Gemini, others → MediaPipe
      const endpoint = test.id === "ball_mastery"
        ? `${AI_URL}/analyse-drill?drill_type=general&age_group=${ageGroup}&mode=gemini`
        : `${AI_URL}/athletic-test?test_type=${test.drillType}&age_group=${ageGroup}`;

      const result = await new Promise<TestScore>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            updateTest(test.id, {
              phase: "uploading",
              progress: Math.round((ev.loaded / ev.total) * 40),
            });
          }
        };

        // Fake progress during server processing
        let fakePct = 40;
        const ticker = setInterval(() => {
          fakePct = Math.min(95, fakePct + 1.2);
          updateTest(test.id, { phase: "analysing", progress: Math.round(fakePct) });
        }, 600);

        xhr.onload = () => {
          clearInterval(ticker);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              // Normalise response from either endpoint
              const score: TestScore = {
                score:      data.test_score   ?? data.overall_percentile ?? 50,
                percentile: data.percentile   ?? data.overall_percentile ?? 50,
                rating:     data.rating       ?? data.overall_rating     ?? "Developing",
                key_metric: data.key_metric   ?? data.drill_description  ?? test.label,
                detail:     data.detail       ?? data.scout_summary      ?? "Analysis complete.",
              };
              resolve(score);
            } catch {
              reject(new Error("Invalid response from AI service"));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail ?? `Analysis failed (${xhr.status})`));
            } catch {
              reject(new Error(`Analysis failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => { clearInterval(ticker); reject(new Error("Network error")); };
        xhr.open("POST", endpoint);
        xhr.send(formData);
      });

      updateTest(test.id, { phase: "done", score: result, progress: 100 });

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      updateTest(test.id, { phase: "error", error: msg, progress: 0 });
    }
  }, [ageGroup, updateTest]);

  // ── File input handler ────────────────────────────────────────────────────

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const test = TESTS[currentTest];
    if (test.videoTest) handleVideoUpload(file, test);
  }, [currentTest, handleVideoUpload]);

  // ── Reaction test complete ────────────────────────────────────────────────

  const handleReactionComplete = useCallback((result: { avg_ms: number; score: number; rounds: number[] }) => {
    const rating =
      result.score >= 85 ? "Elite" :
      result.score >= 70 ? "Advanced" :
      result.score >= 55 ? "Developing" :
      result.score >= 40 ? "Foundation" : "Beginner";

    updateTest("reaction", {
      phase: "done",
      score: {
        score:      result.score,
        percentile: result.score,
        rating,
        key_metric: `${result.avg_ms}ms average`,
        detail: `Your average reaction time was ${result.avg_ms}ms across ${result.rounds.length} rounds. ${
          result.avg_ms < 200 ? "Elite reflexes — top 15% of tested players." :
          result.avg_ms < 250 ? "Excellent reactions — well above average." :
          result.avg_ms < 300 ? "Good reactions — around average for your level." :
          "Developing reactions — can be significantly improved with training."
        }`,
      },
      progress: 100,
    });
  }, [updateTest]);

  // ── Build athletic profile from completed tests ───────────────────────────

  const buildProfile = useCallback((): AthleticProfile => {
    const get = (id: TestId) => testStates[id].score?.score ?? 50;
    return {
      power:     get("jump"),
      pace:      get("sprint"),
      balance:   get("balance"),
      reaction:  get("reaction"),
      endurance: get("endurance"),
      technique: testStates["ball_mastery"].score?.score ?? 50,
    };
  }, [testStates]);

  // ── Save results and update position ─────────────────────────────────────

  const finaliseResults = useCallback(async () => {
    setSaving(true);
    const prof = buildProfile();
    const rankedPositions = determinePositions(prof);
    setProfile(prof);
    setPositions(rankedPositions);

    const token = localStorage.getItem("auth_token");
    if (token && token !== "dev-token") {
      try {
        // Save athletic profile
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/athletic-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            age_group:          ageGroup,
            profile:            prof,
            recommended_position: rankedPositions[0].id,
            test_scores:        Object.fromEntries(
              TESTS.map(t => [t.id, testStates[t.id].score])
            ),
          }),
        });

        // Auto-update player position
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/profile`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ position: rankedPositions[0].id }),
        });
      } catch { /* silent — results are shown regardless */ }
    }

    setSaving(false);
    setBatteryPhase("results");
  }, [ageGroup, buildProfile, testStates]);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    const nextIdx = currentTest + 1;
    if (nextIdx >= TESTS.length) {
      finaliseResults();
    } else {
      setCurrentTest(nextIdx);
    }
  }, [currentTest, finaliseResults]);

  const skipCurrentTest = useCallback(() => {
    const test = TESTS[currentTest];
    if (test.optional) {
      updateTest(test.id, {
        phase: "done",
        score: { score: 50, percentile: 50, rating: "Skipped", key_metric: "Skipped", detail: "Ball mastery test was skipped." },
        progress: 100,
      });
    }
    goNext();
  }, [currentTest, updateTest, goNext]);

  const restartBattery = () => {
    setTestStates(
      Object.fromEntries(TESTS.map(t => [t.id, { phase: "idle", score: null, error: "", progress: 0 }]))
      as Record<TestId, TestState>
    );
    setCurrentTest(0);
    setProfile(null);
    setPositions([]);
    setBatteryPhase("intro");
  };

  const test       = TESTS[currentTest];
  const testState  = testStates[test?.id];
  const allRequiredDone = TESTS.filter(t => !t.optional).every(t => testStates[t.id].phase === "done");

  // ── RENDER ────────────────────────────────────────────────────────────────

  // Age select
  if (batteryPhase === "age_select") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 6 }}>
            GRS Athletic Test Battery
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>
            Complete 6 athletic tests. Our AI measures your real physical abilities and determines your best football position — automatically, no coach needed.
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12 }}>
            Which age group are you?
          </div>
          {([
            { value: "u13" as AgeGroup, label: "Under 13",     sub: "Ages 10–13 · Youth development benchmarks" },
            { value: "u17" as AgeGroup, label: "Under 17",     sub: "Ages 14–17 · Academy-level benchmarks" },
            { value: "senior" as AgeGroup, label: "Senior / Adult", sub: "Ages 18+ · Professional benchmarks" },
          ]).map(ag => (
            <button key={ag.value}
              onClick={() => { setAgeGroup(ag.value); setBatteryPhase("intro"); localStorage.setItem("player_age_group", ag.value); }}
              style={{
                width: "100%", padding: "16px 18px", borderRadius: 12, marginBottom: 8,
                background: "#f9fafb", border: "2px solid #e5e7eb",
                cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GRS_GREEN; e.currentTarget.style.background = "#f0fdf4"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#f9fafb"; }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{ag.label}</div>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{ag.sub}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Intro
  if (batteryPhase === "intro") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: GRS_GREEN, borderRadius: 16, padding: 24, color: "#fff" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            GRS Athletic Battery
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
            Discover Your Best Position
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
            6 tests. AI scores your physical abilities automatically. Your ideal football position is determined from your real athletic profile — not guesswork.
          </div>
        </div>

        {/* Test overview */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>What you&apos;ll do</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TESTS.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: t.colour + "18", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}>
                  {t.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#111" }}>
                    {i + 1}. {t.label}
                    {t.optional && <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginLeft: 6 }}>Optional</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#666" }}>
                    {t.videoTest ? "📹 Video upload" : "📱 Screen test"} · {t.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div style={{ background: "#eaf3de", borderRadius: 12, padding: "14px 16px", border: "1px solid #c3dfa0" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: GRS_GREEN, marginBottom: 8 }}>Before you start</div>
          {[
            "Find a flat open space with good lighting (outdoors is best)",
            "Ask a teammate or family member to hold the phone for you — or prop it up",
            "Wear your normal training kit",
            "Warm up for 5 minutes first",
            "You can do all 6 tests in one session or come back and complete them over time",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: GRS_GREEN, fontWeight: 800, flexShrink: 0 }}>→</span>
              <span style={{ fontSize: 11, color: "#3a6b2a", lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => setBatteryPhase("testing")}
          style={{
            width: "100%", padding: "18px", borderRadius: 14,
            background: GRS_GREEN, color: "#fff", fontWeight: 800, fontSize: 16,
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          Start Test Battery <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // Testing
  if (batteryPhase === "testing") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Progress bar */}
        <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>
              Test {currentTest + 1} of {TESTS.length}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              {TESTS.filter(t => testStates[t.id].phase === "done").length} complete
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {TESTS.map((t, i) => (
              <div key={t.id} style={{
                flex: 1, height: 6, borderRadius: 3,
                background:
                  testStates[t.id].phase === "done" ? GRS_GREEN :
                  i === currentTest ? GRS_GOLD : "#e5e7eb",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {TESTS.map((t, i) => (
              <div key={t.id} style={{
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 8,
                background:
                  testStates[t.id].phase === "done" ? "#f0fdf4" :
                  i === currentTest ? "#fffbeb" : "#f9fafb",
                color:
                  testStates[t.id].phase === "done" ? GRS_GREEN :
                  i === currentTest ? GRS_GOLD : "#9ca3af",
                border: `1px solid ${
                  testStates[t.id].phase === "done" ? "#bbf7d0" :
                  i === currentTest ? "#fde68a" : "#e5e7eb"
                }`,
              }}>
                {testStates[t.id].phase === "done" ? "✓" : t.emoji} {t.label}
              </div>
            ))}
          </div>
        </div>

        {/* Current test */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: test.colour + "18",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>
              {test.emoji}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>{test.label}</div>
              <div style={{ fontSize: 11, color: "#666" }}>
                {test.videoTest ? "📹 Video upload" : "📱 Screen test"} · {test.duration}
                {test.optional && <span style={{ marginLeft: 6, color: "#9ca3af" }}>(Optional)</span>}
              </div>
            </div>
          </div>

          {/* What to do */}
          {testState.phase === "idle" && (
            <>
              <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                  What to do
                </div>
                <p style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>{test.whatToDo}</p>
              </div>

              {/* Recording tips (video tests only) */}
              {test.videoTest && test.howToRecord.length > 0 && (
                <div style={{ background: "#eaf3de", borderRadius: 10, padding: "12px 14px", marginBottom: 14, border: "1px solid #c3dfa0" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: GRS_GREEN, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                    📱 How to record
                  </div>
                  {test.howToRecord.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: GRS_GREEN, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 11, color: "#3a6b2a", lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* What AI measures */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                  What the AI measures
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {test.whatAIMeasures.map(m => (
                    <span key={m} style={{
                      fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: test.colour + "12", color: test.colour, border: `1px solid ${test.colour}30`,
                    }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action button */}
              {test.videoTest ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: "100%", padding: "18px", borderRadius: 14,
                      background: test.colour, color: "#fff", fontWeight: 800, fontSize: 15,
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                  >
                    <Upload size={18} /> Upload Video
                  </button>
                </>
              ) : (
                // Reaction test — render inline
                <ReactionTest
                  onComplete={handleReactionComplete}
                  onSkip={test.optional ? skipCurrentTest : undefined}
                />
              )}

              {test.optional && test.videoTest && (
                <button
                  onClick={skipCurrentTest}
                  style={{ marginTop: 12, width: "100%", fontSize: 12, color: "#9ca3af", background: "none", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px", cursor: "pointer" }}
                >
                  Skip Ball Mastery (optional)
                </button>
              )}
            </>
          )}

          {/* Uploading / Analysing */}
          {(testState.phase === "uploading" || testState.phase === "analysing") && (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Loader2 size={36} color={test.colour} style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#333", marginBottom: 6 }}>
                {testState.phase === "uploading" ? "Uploading your video…" : "AI is analysing your movement…"}
              </div>
              <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden", margin: "12px 0" }}>
                <div style={{
                  height: "100%", width: `${testState.progress}%`,
                  background: test.colour, borderRadius: 4, transition: "width 0.5s ease",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{testState.progress}%</div>
            </div>
          )}

          {/* Done */}
          {testState.phase === "done" && testState.score && (
            <div>
              <div style={{
                background: test.colour + "10", borderRadius: 12, padding: 20,
                border: `1px solid ${test.colour}30`, marginBottom: 14, textAlign: "center",
              }}>
                <CheckCircle2 size={28} color={test.colour} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                  {test.label} Score
                </div>
                <div style={{ fontSize: 52, fontWeight: 900, color: test.colour, lineHeight: 1 }}>
                  {testState.score.score}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>out of 100</div>
                <div style={{
                  display: "inline-block", marginTop: 8, padding: "4px 14px", borderRadius: 20,
                  background: test.colour, color: "#fff", fontSize: 11, fontWeight: 800,
                }}>
                  {testState.score.rating}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 10, lineHeight: 1.6 }}>
                  {testState.score.detail}
                </div>
              </div>

              <button
                onClick={goNext}
                style={{
                  width: "100%", padding: "16px", borderRadius: 12,
                  background: currentTest + 1 >= TESTS.length ? GRS_GOLD : GRS_GREEN,
                  color: "#fff", fontWeight: 800, fontSize: 15,
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
              >
                {currentTest + 1 >= TESTS.length ? (
                  <><Trophy size={18} /> See My Results</>
                ) : (
                  <>Next: {TESTS[currentTest + 1]?.label} <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {testState.phase === "error" && (
            <div style={{ background: "#fef2f2", borderRadius: 12, padding: 16, border: "1px solid #fecaca" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
                <AlertCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dc2626" }}>Analysis failed</div>
              </div>
              <div style={{ fontSize: 12, color: "#991b1b", marginBottom: 12, lineHeight: 1.6 }}>
                {testState.error}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => updateTest(test.id, { phase: "idle", error: "", progress: 0 })}
                  style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <RotateCcw size={12} /> Try Again
                </button>
                {test.optional && (
                  <button
                    onClick={skipCurrentTest}
                    style={{ flex: 1, padding: "10px", background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                  >
                    Skip
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Complete battery early if all required tests done */}
        {allRequiredDone && batteryPhase === "testing" && testState.phase !== "done" && (
          <button
            onClick={finaliseResults}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              background: GRS_GOLD, color: "#1a5c2a", fontWeight: 800, fontSize: 14,
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Trophy size={16} /> View My Athletic Profile
          </button>
        )}
      </div>
    );
  }

  // Results
  if (batteryPhase === "results" && profile && positions.length > 0) {
    const top    = positions[0];
    const second = positions[1];
    const third  = positions[2];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Hero */}
        <div style={{ background: GRS_GREEN, borderRadius: 16, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Your Best Football Position
          </div>
          <div style={{ fontSize: 52 }}>{top.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 6 }}>{top.label}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 10, lineHeight: 1.7, maxWidth: 320, margin: "10px auto 0" }}>
            {top.description}
          </div>
        </div>

        {/* Radar chart */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5", textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>Your Athletic Profile</div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart profile={profile} />
          </div>
          {/* Score grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
            {([
              { key: "power",     label: "Power",     emoji: "🦘", test: "jump" },
              { key: "pace",      label: "Pace",      emoji: "💨", test: "sprint" },
              { key: "balance",   label: "Balance",   emoji: "⚖️", test: "balance" },
              { key: "reaction",  label: "Reaction",  emoji: "⚡", test: "reaction" },
              { key: "endurance", label: "Endurance", emoji: "🔥", test: "endurance" },
              { key: "technique", label: "Technique", emoji: "⚽", test: "ball_mastery" },
            ] as const).map(dim => (
              <div key={dim.key} style={{ background: "#f9fafb", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>{dim.emoji}</div>
                <div style={{ fontSize: 9, color: "#888", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{dim.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: GRS_GREEN }}>{profile[dim.key]}</div>
                <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ height: "100%", width: `${profile[dim.key]}%`, background: GRS_GREEN, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary positions */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>
            You can also play
          </div>
          {[second, third].map((pos, i) => (
            <div key={pos.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
              borderBottom: i === 0 ? "1px solid #f0f0f0" : "none",
            }}>
              <div style={{ fontSize: 24, width: 36, textAlign: "center" }}>{pos.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>
                  {i === 0 ? "2nd" : "3rd"} — {pos.label}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 2, lineHeight: 1.5 }}>
                  {pos.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Individual test scores */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 14 }}>
            Test Results Breakdown
          </div>
          {TESTS.map(t => {
            const ts = testStates[t.id];
            if (ts.phase !== "done" || !ts.score) return null;
            return (
              <div key={t.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{t.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#333", flex: 1 }}>{t.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                    background: t.colour + "15", color: t.colour,
                  }}>
                    {ts.score.rating}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: t.colour, minWidth: 36, textAlign: "right" }}>
                    {ts.score.score}
                  </span>
                </div>
                <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${ts.score.score}%`, background: t.colour, borderRadius: 3, transition: "width 0.8s" }} />
                </div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 3 }}>{ts.score.key_metric}</div>
              </div>
            );
          })}
        </div>

        {/* Saved notice */}
        <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "12px 16px", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle2 size={16} color="#059669" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>
              Profile saved · Position updated to {top.label}
            </div>
            <div style={{ fontSize: 11, color: "#166534" }}>
              Your athletic profile has been saved to your Talent Passport
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={restartBattery}
            style={{
              flex: 1, padding: "14px", borderRadius: 12,
              background: "#fff", color: GRS_GREEN, fontWeight: 700, fontSize: 13,
              border: `2px solid ${GRS_GREEN}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <RotateCcw size={14} /> Retest
          </button>
          <Link
            href="/player"
            style={{
              flex: 1, padding: "14px", borderRadius: 12, textDecoration: "none",
              background: GRS_GREEN, color: "#fff", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Star size={14} /> Back to Hub
          </Link>
        </div>

        <div style={{ height: 32 }} />
      </div>
    );
  }

  return null;
}