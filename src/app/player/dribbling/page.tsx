"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shuffle, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    "ball_control" | "body_position" | "change_of_direction" | "awareness";
  label:  string;
  weight: number;
  desc:   string;
  color:  string;
  labels: [string, string, string, string, string];
}

interface AiFeedback {
  ball_control_feedback:          string;
  body_position_feedback:         string;
  change_of_direction_feedback:   string;
  awareness_feedback:              string;
  biggest_issue:                   string;
  strengths:                       string[];
  drill_1:                         { name: string; description: string };
  drill_2:                         { name: string; description: string };
  drill_3:                         { name: string; description: string };
  skill_tip:                       string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MECHANICS: MechanicRating[] = [
  {
    key:    "ball_control",
    label:  "Ball Control & Touch",
    weight: 0.30,
    desc:   "How close do you keep the ball? How clean is each touch?",
    color:  "#1a5c2a",
    labels: [
      "Ball runs away from me",
      "Often lose control",
      "Decent in open space",
      "Tight control most of the time",
      "Perfect touch, ball glued to foot",
    ],
  },
  {
    key:    "body_position",
    label:  "Body Position & Shielding",
    weight: 0.25,
    desc:   "Do you use a low centre of gravity and your body to protect the ball?",
    color:  "#2563eb",
    labels: [
      "Upright, ball easily won",
      "Rarely shield effectively",
      "Sometimes gets low",
      "Good body shape, hard to dispossess",
      "Low, wide stance — almost unbeatable",
    ],
  },
  {
    key:    "change_of_direction",
    label:  "Change of Direction",
    weight: 0.25,
    desc:   "How sharp and deceptive are your cuts, feints, and turns?",
    color:  "#c8962a",
    labels: [
      "Slow, telegraphed changes",
      "Some deception but easy to read",
      "Effective in simple situations",
      "Sharp cuts, beats defenders often",
      "Explosive, unpredictable — elite level",
    ],
  },
  {
    key:    "awareness",
    label:  "Head Up & Awareness",
    weight: 0.20,
    desc:   "Do you scan the field while dribbling, or do you watch the ball only?",
    color:  "#7c3aed",
    labels: [
      "Eyes always on ball",
      "Rarely looks up",
      "Sometimes scans",
      "Regularly checks surroundings",
      "Constant scanning — sees everything",
    ],
  },
];

const SPORTS = ["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];

const DRIBBLE_TYPES = [
  "Close Control",
  "Speed Dribbling",
  "1v1 Attacking",
  "Ball Carry",
  "Weaving / Agility",
  "Under Pressure",
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToBar(rating: number): number { return rating * 20; }

function barColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "#d97706";
  if (pct >= 40) return "#ea580c";
  return "#dc2626";
}

function barLabel(pct: number): string {
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Needs work";
  return "Critical";
}

function extractJson(raw: string): AiFeedback | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as AiFeedback) : null;
  } catch { return null; }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DribblingAnalyzerPage() {
  const token = useAuthStore((s) => s.token);

  const [phase,       setPhase]       = useState<"setup" | "assess" | "results">("setup");
  const [sport,       setSport]       = useState("Football");
  const [position,    setPosition]    = useState("");
  const [dribbleType, setDribbleType] = useState("Close Control");
  const [ratings,     setRatings]     = useState<Record<string, number>>({});
  const [feedback,    setFeedback]    = useState<AiFeedback | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [openDrill,   setOpenDrill]   = useState<string | null>(null);

  const allRated = MECHANICS.every((m) => ratings[m.key]);

  const overallScore = feedback
    ? Math.round(
        MECHANICS.reduce((sum, m) => sum + scoreToBar(ratings[m.key] || 0) * m.weight, 0)
      )
    : Math.round(
        MECHANICS.reduce((sum, m) => sum + scoreToBar(ratings[m.key] || 0) * m.weight, 0)
      );

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");

    const prompt = `You are an elite dribbling coach. Analyse these self-assessed dribbling mechanics and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Dribble type focus: ${dribbleType}

Self-assessed mechanics (1=poor, 5=excellent):
- Ball Control & Touch: ${ratings.ball_control}/5 (${MECHANICS[0].labels[(ratings.ball_control || 1) - 1]})
- Body Position & Shielding: ${ratings.body_position}/5 (${MECHANICS[1].labels[(ratings.body_position || 1) - 1]})
- Change of Direction: ${ratings.change_of_direction}/5 (${MECHANICS[2].labels[(ratings.change_of_direction || 1) - 1]})
- Head Up & Awareness: ${ratings.awareness}/5 (${MECHANICS[3].labels[(ratings.awareness || 1) - 1]})

Return this exact JSON structure:
{
  "ball_control_feedback": "<one specific coaching sentence>",
  "body_position_feedback": "<one specific coaching sentence>",
  "change_of_direction_feedback": "<one specific coaching sentence>",
  "awareness_feedback": "<one specific coaching sentence>",
  "biggest_issue": "<the single most important mechanic to fix first>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "skill_tip": "<one tip specific to ${dribbleType} dribbling>"
}`;

    try {
      const r    = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are a professional dribbling coach. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      const raw  = data.response || data.answer || "";
      const parsed = extractJson(raw);
      if (parsed) {
        setFeedback(parsed);
      } else {
        setFeedback(buildFallback());
      }
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(buildFallback());
    }

    const computed = Math.round(
      MECHANICS.reduce((sum, m) => sum + scoreToBar(ratings[m.key] || 0) * m.weight, 0)
    );

    if (token) {
      fetch(`${API_URL}/player/dribbling`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          position: position || null,
          dribble_type:               dribbleType,
          ball_control_score:         ratings.ball_control,
          body_position_score:        ratings.body_position,
          change_of_direction_score:  ratings.change_of_direction,
          awareness_score:            ratings.awareness,
          overall_score:              computed,
          ai_feedback:                feedback,
        }),
      }).catch(() => {});
    }

    setPhase("results");
    setLoading(false);
  };

  function buildFallback(): AiFeedback {
    const weakest = MECHANICS.reduce((min, m) =>
      (ratings[m.key] || 5) < (ratings[min.key] || 5) ? m : min
    );
    return {
      ball_control_feedback:         "Practice touching the ball with every step — it should never roll more than a foot from your body in tight spaces.",
      body_position_feedback:        "Get your knees bent and your arms out wide to create a protective frame around the ball when under pressure.",
      change_of_direction_feedback:  "Use a shoulder drop or head fake before every cut — make the defender commit before you change direction.",
      awareness_feedback:            "Pick a spot on the wall to look at while dribbling in practice. Force yourself to see the space, not just the ball.",
      biggest_issue:                 `${weakest.label} is your biggest limiter right now.`,
      strengths:                     ["You have a foundation to build on", "Consistent self-assessment is the first step to elite skill"],
      drill_1: { name: "Cone Box Control",         description: "Set up 4 markers in a 2m × 2m square. Dribble around all 4 corners with your weaker foot only. 5 sets of 60 seconds." },
      drill_2: { name: "Shield & Turn Drill",       description: "Stand with a friend or wall behind you. Receive the ball, shield it with your body for 3 seconds, then turn and accelerate. 10 reps each side." },
      drill_3: { name: "Scan & Go",                 description: "Dribble freely in a 10m space. Every 3 seconds call out how many fingers a partner holds up. Trains head-up habit under ball pressure." },
      skill_tip: `For ${dribbleType} dribbling, keep your weight on the balls of your feet so you can change direction instantly without resetting.`,
    };
  }

  const card: React.CSSProperties = {
    backgroundColor: "white", borderRadius: 16, padding: 24,
    border: "1px solid #e5e7eb", marginBottom: 20,
  };
  const nav: React.CSSProperties = {
    backgroundColor: "white", borderBottom: "1px solid #e5e5e5",
    padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // SETUP PHASE
  // ══════════════════════════════════════════════════════════════════════════

  if (phase === "setup") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div style={nav}>
          <Link href="/player" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
            <ArrowLeft size={15} /> Player Hub
          </Link>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Dribbling Analyzer</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shuffle size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Dribbling Analyzer</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your dribbling mechanics and get AI drill recommendations</p>
            </div>
          </div>

          {/* Sport */}
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Your Sport</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SPORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSport(s)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${sport === s ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: sport === s ? "#1a5c2a" : "white",
                    color: sport === s ? "white" : "#374151",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Dribbling Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Position (optional)</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Winger, Point Guard, Centre Forward…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Dribble Type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DRIBBLE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setDribbleType(t)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${dribbleType === t ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: dribbleType === t ? "#1a5c2a" : "white",
                    color: dribbleType === t ? "white" : "#374151",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase("assess")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Next: Rate Your Mechanics →
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ASSESS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  if (phase === "assess") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div style={nav}>
          <button onClick={() => setPhase("setup")} style={{ color: "#6b7280", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Rate Your Mechanics</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {dribbleType}</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate each mechanic honestly. 1 = needs major work, 5 = excellent.
          </p>

          {MECHANICS.map((m) => {
            const current = ratings[m.key] || 0;
            return (
              <div key={m.key} style={{ ...card, borderLeft: `4px solid ${current ? m.color : "#e5e7eb"}` }}>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#111" }}>{m.label}</h3>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{Math.round(m.weight * 100)}% weight</span>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>{m.desc}</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setRatings((prev) => ({ ...prev, [m.key]: n }))}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                        border: `2px solid ${current === n ? m.color : "#e5e7eb"}`,
                        backgroundColor: current === n ? m.color : "white",
                        color: current === n ? "white" : "#374151",
                        transition: "all 0.15s",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {current > 0 && (
                  <p style={{ margin: "10px 0 0", fontSize: 12, color: m.color, fontWeight: 500 }}>
                    {m.labels[current - 1]}
                  </p>
                )}
              </div>
            );
          })}

          {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            onClick={runAnalysis}
            disabled={!allRated || loading}
            style={{
              width: "100%", padding: "14px", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: allRated && !loading ? "pointer" : "not-allowed",
              backgroundColor: allRated && !loading ? "#1a5c2a" : "#d1d5db",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Shuffle size={18} />
            {loading ? "Analysing your dribbling…" : allRated ? "Get AI Analysis" : `Rate all 4 mechanics (${Object.keys(ratings).length}/4)`}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  const scoreColor = barColor(overallScore);
  const scoreColorLight = scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={nav}>
        <Link href="/player" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Player Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Dribbling Analysis</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>Overall Dribbling Score</p>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreColorLight, marginBottom: 8 }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} dribbling mechanics
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {dribbleType}{position ? ` · ${position}` : ""}
          </p>
        </div>

        {/* Mechanics breakdown */}
        <div style={card}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Mechanics Breakdown</h2>
          {MECHANICS.map((m) => {
            const pct  = scoreToBar(ratings[m.key] || 0);
            const clr  = barColor(pct);
            const text = feedback?.[`${m.key}_feedback` as keyof AiFeedback] as string | undefined;
            return (
              <div key={m.key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: clr }}>{pct}/100 · {barLabel(pct)}</span>
                </div>
                <div style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: clr, borderRadius: 4, transition: "width 0.6s ease" }} />
                </div>
                {text && <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{text}</p>}
              </div>
            );
          })}
        </div>

        {/* Biggest issue */}
        {feedback?.biggest_issue && (
          <div style={{ ...card, backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}>
              <strong>{feedback.biggest_issue}</strong>
            </p>
          </div>
        )}

        {/* Skill tip */}
        {feedback?.skill_tip && (
          <div style={{ ...card, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {dribbleType} Tip
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.skill_tip}</p>
          </div>
        )}

        {/* Strengths */}
        {(feedback?.strengths?.length ?? 0) > 0 && (
          <div style={{ ...card, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>What you&apos;re doing well</p>
            {feedback!.strengths.map((s, i) => (
              <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#111", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span> {s}
              </p>
            ))}
          </div>
        )}

        {/* Drills */}
        {feedback && (
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Sharpen Your Dribbling</h2>
            {([feedback.drill_1, feedback.drill_2, feedback.drill_3] as Array<{ name: string; description: string }>).map((drill, i) => {
              if (!drill?.name) return null;
              const key  = `drill_${i + 1}`;
              const open = openDrill === key;
              return (
                <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenDrill(open ? null : key)}
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "white", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                      <span style={{ marginRight: 8, color: "#1a5c2a", fontWeight: 700 }}>{i + 1}.</span>
                      {drill.name}
                    </span>
                    {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                  </button>
                  {open && (
                    <div style={{ padding: "12px 16px 14px", backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{drill.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <button
          onClick={() => { setPhase("setup"); setRatings({}); setFeedback(null); setError(""); setOpenDrill(null); }}
          style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <RotateCcw size={16} /> New Assessment
        </button>
      </div>
    </div>
  );
}
