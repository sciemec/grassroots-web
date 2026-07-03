"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Move, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    "body_shape" | "cushioning" | "touch_direction" | "speed_of_play";
  label:  string;
  desc:   string;
  color:  string;
  labels: string[];
}

interface AiFeedback {
  overall_score:              number;
  body_shape_feedback:        string;
  cushioning_feedback:        string;
  touch_direction_feedback:   string;
  speed_of_play_feedback:     string;
  biggest_issue:              string;
  strengths:                  string[];
  drill_1:                    { name: string; description: string };
  drill_2:                    { name: string; description: string };
  drill_3:                    { name: string; description: string };
  pressure_tip:               string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MECHANICS: MechanicRating[] = [
  {
    key:    "body_shape",
    label:  "Body Shape Before Ball Arrives",
    desc:   "Do you scan and get into position before the ball reaches you?",
    color:  "#2563eb",
    labels: [
      "Flat-footed, square-on — no scan before receiving",
      "Some awareness but poor body orientation",
      "Mostly side-on, occasional scan before ball arrives",
      "Good half-turn, scans before receiving",
      "Perfect — already turned, scanned twice, ready to play forward",
    ],
  },
  {
    key:    "cushioning",
    label:  "Cushioning & Softness",
    desc:   "How well do you absorb the ball's pace to keep it under control?",
    color:  "#1a5c2a",
    labels: [
      "Ball bounces away — foot too rigid, no withdrawal",
      "Some control but ball often bounces out of reach",
      "Adequate cushioning, ball stays nearby most of the time",
      "Good foot withdrawal, ball dies close to feet",
      "Perfect — ball dies at feet every time, instant control",
    ],
  },
  {
    key:    "touch_direction",
    label:  "Touch Direction",
    desc:   "Do you move the ball away from pressure and into useful space?",
    color:  "#c8962a",
    labels: [
      "Random direction — no awareness of where pressure is",
      "Takes touch toward defender or sideways unnecessarily",
      "Neutral touch, sometimes into space, sometimes not",
      "Usually takes ball into good space away from pressure",
      "Perfect — always takes touch away from pressure and forward",
    ],
  },
  {
    key:    "speed_of_play",
    label:  "Speed of Play After Touch",
    desc:   "How quickly are you ready for your next action after the first touch?",
    color:  "#7c3aed",
    labels: [
      "Long pause — ball settles before any next action",
      "Slow — takes 2+ extra touches to control",
      "Reasonable — ready in time but not quick",
      "Quick — next action begins immediately after touch",
      "Instant — one-touch quality, already in position mid-receive",
    ],
  },
];

const SPORTS         = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const RECEIVE_TYPES  = ["Ground Pass", "Aerial Ball", "Crossed Ball", "Through Ball", "Long Ball", "Back Pass"];
const PRESSURE_LEVELS = ["Low", "Medium", "High"];

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

export default function FirstTouchPage() {
  const token = useAuthStore((s) => s.token);

  const [phase,         setPhase]         = useState<"setup" | "assess" | "results">("setup");
  const [sport,         setSport]         = useState("Football");
  const [position,      setPosition]      = useState("");
  const [receiveType,   setReceiveType]   = useState("Ground Pass");
  const [pressureLevel, setPressureLevel] = useState("Medium");
  const [ratings,       setRatings]       = useState<Record<string, number>>({});
  const [feedback,      setFeedback]      = useState<AiFeedback | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [openDrill,     setOpenDrill]     = useState<string | null>(null);

  const allRated = MECHANICS.every((m) => ratings[m.key]);

  // ── Score calculations ────────────────────────────────────────────────────

  const scores = {
    body_shape:      scoreToBar(ratings.body_shape      || 0),
    cushioning:      scoreToBar(ratings.cushioning      || 0),
    touch_direction: scoreToBar(ratings.touch_direction || 0),
    speed_of_play:   scoreToBar(ratings.speed_of_play   || 0),
  };

  const overallScore = feedback?.overall_score
    ?? Math.round(
        scores.body_shape      * 0.25 +
        scores.cushioning      * 0.30 +
        scores.touch_direction * 0.30 +
        scores.speed_of_play   * 0.15
      );

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");

    const prompt = `You are a first touch and ball control coach. Analyse these self-assessed first touch mechanics and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Receiving type: ${receiveType}
Pressure level: ${pressureLevel}

Self-assessed mechanics (1=poor, 5=excellent):
- Body shape before ball arrives: ${ratings.body_shape}/5 (${MECHANICS[0].labels[(ratings.body_shape || 1) - 1]})
- Cushioning & softness: ${ratings.cushioning}/5 (${MECHANICS[1].labels[(ratings.cushioning || 1) - 1]})
- Touch direction: ${ratings.touch_direction}/5 (${MECHANICS[2].labels[(ratings.touch_direction || 1) - 1]})
- Speed of play after touch: ${ratings.speed_of_play}/5 (${MECHANICS[3].labels[(ratings.speed_of_play || 1) - 1]})

Return this exact JSON structure:
{
  "overall_score": <0-100 integer>,
  "body_shape_feedback": "<one specific sentence>",
  "cushioning_feedback": "<one specific sentence>",
  "touch_direction_feedback": "<one specific sentence>",
  "speed_of_play_feedback": "<one specific sentence>",
  "biggest_issue": "<the single most important mechanic to fix first>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no special equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "pressure_tip": "<one practical tip for receiving under ${pressureLevel.toLowerCase()} pressure with a ${receiveType.toLowerCase()}>"
}`;

    try {
      const r    = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are a professional ball control and first touch coach. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      const raw  = data.response || data.answer || "";
      const parsed = extractJson(raw);

      if (parsed) {
        setFeedback(parsed);
      } else {
        const worstKey = MECHANICS.reduce((a, b) =>
          (ratings[a.key] || 5) < (ratings[b.key] || 5) ? a : b
        ).label;
        setFeedback({
          overall_score: overallScore,
          body_shape_feedback:      "Get side-on before the ball arrives — scan twice, know what's behind you before you receive.",
          cushioning_feedback:      "Withdraw your foot as the ball makes contact, like catching an egg — the ball should drop dead at your feet.",
          touch_direction_feedback: "Always take your first touch away from the nearest defender and into the space you scanned before receiving.",
          speed_of_play_feedback:   "Decide what you're doing with the ball BEFORE it arrives — your first touch sets up your second action.",
          biggest_issue:            worstKey,
          strengths:                ["You are self-aware about your technique", "Deliberate practice of these mechanics will show rapid improvement"],
          drill_1: {
            name:        "Wall Rebound Control",
            description: "Stand 3m from a wall and throw the ball against it. Control each rebound with one touch, taking the ball into different directions. 3 sets of 20 reps per foot.",
          },
          drill_2: {
            name:        "Scan & Receive",
            description: "Ask a partner to hold up fingers (1-5) just before they pass. Call out the number as you receive — this forces you to lift your head and scan before the ball arrives. 3 sets of 10 passes.",
          },
          drill_3: {
            name:        "Directional First Touch",
            description: "Place 4 cones in a cross shape, 2m apart. Receive a pass in the centre, take your first touch toward one cone, then play the ball back. Rotate which cone you touch toward each rep. 5 reps × 4 directions.",
          },
          pressure_tip: `For a ${receiveType.toLowerCase()} under ${pressureLevel.toLowerCase()} pressure — get your body between the ball and the defender as you receive to shield immediately after the touch.`,
        });
      }
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(null);
    }

    // Save to backend (non-blocking)
    if (token) {
      fetch(`${API_URL}/player/first-touch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          position,
          receive_type:          receiveType,
          pressure_level:        pressureLevel,
          body_shape_score:      ratings.body_shape,
          cushioning_score:      ratings.cushioning,
          touch_direction_score: ratings.touch_direction,
          speed_of_play_score:   ratings.speed_of_play,
          overall_score:         overallScore,
          ai_feedback:           feedback,
        }),
      }).catch(() => {});
    }

    setPhase("results");
    setLoading(false);
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    border: "1px solid #e5e7eb",
    marginBottom: 20,
  };
  const nav: React.CSSProperties = {
    backgroundColor: "white",
    borderBottom: "1px solid #e5e5e5",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: 10,
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>First Touch Analyzer</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Move size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>First Touch Analyzer</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your ball control and get AI drill recommendations</p>
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

          {/* Receive Context */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Receiving Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Position (optional)
            </label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Midfielder, Striker, Wing…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Type of Ball You&apos;re Receiving
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {RECEIVE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setReceiveType(t)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${receiveType === t ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: receiveType === t ? "#1a5c2a" : "white",
                    color: receiveType === t ? "white" : "#374151",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Pressure Level When Receiving
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRESSURE_LEVELS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPressureLevel(p)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
                    border: `2px solid ${pressureLevel === p ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: pressureLevel === p ? "#1a5c2a" : "white",
                    color: pressureLevel === p ? "white" : "#374151",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase("assess")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Next: Rate Your First Touch →
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
          <button
            onClick={() => setPhase("setup")}
            style={{ color: "#6b7280", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Rate Your First Touch</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {receiveType} · {pressureLevel} pressure</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate each mechanic honestly based on how you receive the ball. 1 = needs major work, 5 = excellent.
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
            <Move size={18} />
            {loading ? "Analysing your first touch…" : allRated ? "Get AI Analysis" : `Rate all 4 mechanics (${Object.keys(ratings).length}/4)`}
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
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>First Touch Analysis</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
            Overall First Touch Score
          </p>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 8,
            color: scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171",
          }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} first touch
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {receiveType} · {pressureLevel} pressure
          </p>
        </div>

        {/* Mechanics breakdown */}
        <div style={card}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>First Touch Breakdown</h2>
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

        {/* Priority fix */}
        {feedback?.biggest_issue && (
          <div style={{ ...card, backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}>
              <strong>{feedback.biggest_issue}</strong> is the biggest thing holding back your first touch right now.
            </p>
          </div>
        )}

        {/* Pressure tip */}
        {feedback?.pressure_tip && (
          <div style={{ ...card, backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {pressureLevel} Pressure Tip
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.pressure_tip}</p>
          </div>
        )}

        {/* Strengths */}
        {feedback?.strengths?.length ? (
          <div style={{ ...card, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>What you&apos;re doing well</p>
            {feedback.strengths.map((s, i) => (
              <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#111", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span> {s}
              </p>
            ))}
          </div>
        ) : null}

        {/* Drills */}
        {feedback && (
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Improve Your First Touch</h2>
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
