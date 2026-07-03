"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, ChevronDown, ChevronUp, RotateCcw, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    "arm_drive" | "forward_lean" | "knee_drive" | "stride_rhythm";
  label:  string;
  desc:   string;
  color:  string;
  labels: string[];
}

interface AiFeedback {
  overall_score:            number;
  arm_drive_feedback:       string;
  forward_lean_feedback:    string;
  knee_drive_feedback:      string;
  stride_rhythm_feedback:   string;
  biggest_issue:            string;
  strengths:                string[];
  drill_1:                  { name: string; description: string };
  drill_2:                  { name: string; description: string };
  drill_3:                  { name: string; description: string };
  time_improvement_estimate: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MECHANICS: MechanicRating[] = [
  {
    key:    "arm_drive",
    label:  "Arm Drive",
    desc:   "How straight and powerful are your arm swings?",
    color:  "#2563eb",
    labels: ["Arms crossing body", "Inconsistent", "Mostly straight", "Good drive", "Perfect mechanics"],
  },
  {
    key:    "forward_lean",
    label:  "Forward Lean",
    desc:   "How well do you lean into acceleration?",
    color:  "#1a5c2a",
    labels: ["Upright / leaning back", "Slight lean", "Moderate lean", "Good lean through 10m", "Optimal drive angle"],
  },
  {
    key:    "knee_drive",
    label:  "Knee Drive",
    desc:   "How high do you lift your knees when sprinting?",
    color:  "#c8962a",
    labels: ["Low shuffle", "Below hip height", "At hip height", "Above hip height", "High & powerful"],
  },
  {
    key:    "stride_rhythm",
    label:  "Stride Rhythm",
    desc:   "How smooth and consistent is your stride cadence?",
    color:  "#7c3aed",
    labels: ["Heavy / jerky", "Some rhythm", "Moderate cadence", "Good cadence", "Light & fluid"],
  },
];

const SPORTS   = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const SURFACES = ["Grass", "Track", "Artificial", "Sand", "Court"];
const DISTANCES = [30, 40, 60, 100];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToBar(rating: number): number { return rating * 20; }   // 1-5 → 20-100

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

export default function SprintMechanicsPage() {
  const token = useAuthStore((s) => s.token);

  const [phase,       setPhase]       = useState<"setup" | "assess" | "results">("setup");
  const [sport,       setSport]       = useState("Football");
  const [position,    setPosition]    = useState("");
  const [distance,    setDistance]    = useState(40);
  const [surface,     setSurface]     = useState("Grass");
  const [timeAchieved, setTimeAchieved] = useState("");
  const [ratings,     setRatings]     = useState<Record<string, number>>({});
  const [feedback,    setFeedback]    = useState<AiFeedback | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [openDrill,   setOpenDrill]   = useState<string | null>(null);

  const allRated = MECHANICS.every((m) => ratings[m.key]);

  // ── Score calculations ────────────────────────────────────────────────────

  const scores = {
    arm_drive:      scoreToBar(ratings.arm_drive      || 0),
    forward_lean:   scoreToBar(ratings.forward_lean   || 0),
    knee_drive:     scoreToBar(ratings.knee_drive     || 0),
    stride_rhythm:  scoreToBar(ratings.stride_rhythm  || 0),
  };

  const overallScore = feedback?.overall_score
    ?? Math.round(scores.arm_drive * 0.25 + scores.forward_lean * 0.25 + scores.knee_drive * 0.30 + scores.stride_rhythm * 0.20);

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");
    const prompt = `You are a sprint coach. Analyse these self-assessed sprint mechanics and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Distance: ${distance}m
Surface: ${surface}${timeAchieved ? `\nTime achieved: ${timeAchieved}s` : ""}

Self-assessed mechanics (1=poor, 5=excellent):
- Arm drive: ${ratings.arm_drive}/5 (${MECHANICS[0].labels[(ratings.arm_drive || 1) - 1]})
- Forward lean: ${ratings.forward_lean}/5 (${MECHANICS[1].labels[(ratings.forward_lean || 1) - 1]})
- Knee drive: ${ratings.knee_drive}/5 (${MECHANICS[2].labels[(ratings.knee_drive || 1) - 1]})
- Stride rhythm: ${ratings.stride_rhythm}/5 (${MECHANICS[3].labels[(ratings.stride_rhythm || 1) - 1]})

Return this exact JSON structure:
{
  "overall_score": <0-100 integer>,
  "arm_drive_feedback": "<one specific sentence>",
  "forward_lean_feedback": "<one specific sentence>",
  "knee_drive_feedback": "<one specific sentence>",
  "stride_rhythm_feedback": "<one specific sentence>",
  "biggest_issue": "<the single most important mechanic to fix first>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "time_improvement_estimate": "<e.g. 0.2s improvement in ${distance}m is realistic>"
}`;

    try {
      const r    = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, system_prompt: "You are a professional sprint mechanics coach. Always return only valid JSON." }),
      });
      const data = await r.json();
      const raw  = data.response || data.answer || "";
      const parsed = extractJson(raw);
      if (parsed) {
        setFeedback(parsed);
      } else {
        setFeedback({
          overall_score: overallScore,
          arm_drive_feedback:     "Focus on keeping arms at 90° and driving straight, not across your body.",
          forward_lean_feedback:  "Lean from your ankles, not your waist. Push the ground behind you.",
          knee_drive_feedback:    "Drive your front knee up toward your chest in the acceleration phase.",
          stride_rhythm_feedback: "Aim for quick, light foot contacts — think 'hot coals' underfoot.",
          biggest_issue:          MECHANICS.find((m) => ratings[m.key] === Math.min(...MECHANICS.map((mm) => ratings[mm.key] || 5)))?.label || "Arm Drive",
          strengths:              ["You have a base to build on", "Consistent self-awareness is key to improvement"],
          drill_1: { name: "Wall Drive Holds",        description: "Stand arm's length from a wall. Drive one knee up to 90° and hold 2 seconds. 3 sets of 10 reps each leg." },
          drill_2: { name: "A-Skip Drill",            description: "March forward lifting knees to hip height with an exaggerated skip. Focus on arm drive. 4 × 20m." },
          drill_3: { name: "Falling Starts",          description: "Stand tall, lean forward until you're about to fall, then sprint. Trains correct lean angle. 6 × 30m." },
          time_improvement_estimate: `Consistent mechanics work can shave 0.2–0.4s off your ${distance}m time over 4 weeks.`,
        });
      }
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(null);
    }

    // Save to backend (non-blocking)
    if (token) {
      fetch(`${API_URL}/player/sprint`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport, position, distance_metres: distance, surface,
          arm_drive_score:    ratings.arm_drive,
          forward_lean_score: ratings.forward_lean,
          knee_drive_score:   ratings.knee_drive,
          stride_rhythm_score: ratings.stride_rhythm,
          overall_score:      overallScore,
          time_achieved:      timeAchieved ? parseFloat(timeAchieved) : null,
          ai_feedback:        feedback,
        }),
      }).catch(() => {});
    }

    setPhase("results");
    setLoading(false);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = { backgroundColor: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 };
  const nav: React.CSSProperties  = { backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 };

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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Sprint Mechanics</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Sprint Mechanics Analyzer</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your sprint technique and get AI drill recommendations</p>
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
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Sprint Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Position (optional)</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Striker, Winger, Sprinter…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Sprint Distance</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {DISTANCES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDistance(d)}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500,
                    border: `2px solid ${distance === d ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: distance === d ? "#1a5c2a" : "white",
                    color: distance === d ? "white" : "#374151",
                  }}
                >
                  {d}m
                </button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Surface</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {SURFACES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSurface(s)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    border: `2px solid ${surface === s ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: surface === s ? "#1a5c2a" : "white",
                    color: surface === s ? "white" : "#374151",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              <Clock size={13} style={{ display: "inline", marginRight: 4 }} />
              Time achieved (seconds, optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={timeAchieved}
              onChange={(e) => setTimeAchieved(e.target.value)}
              placeholder={`e.g. ${distance === 30 ? "4.1" : distance === 40 ? "5.2" : distance === 60 ? "7.8" : "11.9"}`}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
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
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {distance}m · {surface}</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate each mechanic honestly based on how you sprint. 1 = needs major work, 5 = excellent.
          </p>

          {MECHANICS.map((m) => {
            const current = ratings[m.key] || 0;
            return (
              <div key={m.key} style={{ ...card, borderLeft: `4px solid ${current ? m.color : "#e5e7eb"}` }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#111" }}>{m.label}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{m.desc}</p>
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
            <Zap size={18} />
            {loading ? "Analysing your sprint…" : allRated ? "Get AI Analysis" : `Rate all 4 mechanics (${Object.keys(ratings).length}/4)`}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  const scoreColor = barColor(overallScore);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={nav}>
        <Link href="/player" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Player Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Sprint Analysis</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>Overall Sprint Score</p>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171", marginBottom: 8 }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} sprint mechanics
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {distance}m · {surface}
            {timeAchieved ? ` · ${timeAchieved}s` : ""}
          </p>
        </div>

        {/* Mechanics breakdown */}
        <div style={card}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Mechanics Breakdown</h2>
          {MECHANICS.map((m) => {
            const pct  = scoreToBar(ratings[m.key] || 0);
            const clr  = barColor(pct);
            const text = feedback ? (feedback[`${m.key}_feedback` as keyof AiFeedback] as string) : null;
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
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}><strong>{feedback.biggest_issue}</strong> is the biggest limiter of your sprint speed right now.</p>
          </div>
        )}

        {/* Strengths */}
        {feedback?.strengths?.length && (
          <div style={{ ...card, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>What you&apos;re doing well</p>
            {feedback.strengths.map((s, i) => (
              <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#111", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span> {s}
              </p>
            ))}
          </div>
        )}

        {/* Drills */}
        {feedback && (
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Fix Your Mechanics</h2>
            {[feedback.drill_1, feedback.drill_2, feedback.drill_3].map((drill, i) => {
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

        {/* Time improvement */}
        {feedback?.time_improvement_estimate && (
          <div style={{ ...card, backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Potential Improvement</p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.time_improvement_estimate}</p>
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
