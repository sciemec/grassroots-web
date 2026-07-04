"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Target, ChevronDown, ChevronUp, RotateCcw, History } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { postToArena } from "@/lib/arena-poster";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    "plant_foot" | "body_shape" | "striking" | "follow_through";
  label:  string;
  desc:   string;
  color:  string;
  labels: string[];
}

interface AiFeedback {
  overall_score:             number;
  plant_foot_feedback:       string;
  body_shape_feedback:       string;
  striking_feedback:         string;
  follow_through_feedback:   string;
  biggest_issue:             string;
  strengths:                 string[];
  drill_1:                   { name: string; description: string };
  drill_2:                   { name: string; description: string };
  drill_3:                   { name: string; description: string };
  accuracy_tip:              string;
}

interface HistoryEntry {
  id:                   string;
  sport:                string;
  position:             string | null;
  shot_type:            string;
  foot:                 string;
  plant_foot_score:     number;
  body_shape_score:     number;
  striking_score:       number;
  follow_through_score: number;
  overall_score:        number;
  ai_feedback:          AiFeedback | null;
  created_at:           string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MECHANICS: MechanicRating[] = [
  {
    key:    "plant_foot",
    label:  "Plant Foot Position",
    desc:   "Where do you place your non-kicking foot relative to the ball?",
    color:  "#2563eb",
    labels: [
      "Too close / too far — poor balance",
      "Slightly off, toes away from target",
      "Reasonable position, some control",
      "Good — beside ball, toes to target",
      "Perfect — precise placement every time",
    ],
  },
  {
    key:    "body_shape",
    label:  "Body Shape Over Ball",
    desc:   "How well do you lean over the ball for placement shots?",
    color:  "#1a5c2a",
    labels: [
      "Leaning far back — ball always balloons",
      "Slight backward lean",
      "Neutral — inconsistent height control",
      "Good body shape over ball",
      "Perfect — body over ball for accuracy",
    ],
  },
  {
    key:    "striking",
    label:  "Striking Technique",
    desc:   "Contact point on the foot and ankle lock quality?",
    color:  "#c8962a",
    labels: [
      "Toe poke — no ankle lock at all",
      "Poor contact area, loose ankle",
      "Some ankle lock, inside foot contact",
      "Good laces contact with locked ankle",
      "Perfect — mid-laces, toes down, full lock",
    ],
  },
  {
    key:    "follow_through",
    label:  "Follow Through",
    desc:   "How complete is your swing arc after striking?",
    color:  "#7c3aed",
    labels: [
      "Stopped swing — ball lacks power",
      "Limited follow through",
      "Partial arc, inconsistent",
      "Good swing arc toward target",
      "Full follow through — toe points to target",
    ],
  },
];

const SPORTS    = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const SHOT_TYPES = ["Power Shot", "Placed Shot", "Volley", "Header", "Penalty", "Chip"];
const FEET       = ["Right", "Left"];

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

export default function ShootingTechniquePage() {
  const token = useAuthStore((s) => s.token);

  const [phase,      setPhase]      = useState<"setup" | "assess" | "results">("setup");
  const [sport,      setSport]      = useState("Football");
  const [position,   setPosition]   = useState("");
  const [shotType,   setShotType]   = useState("Power Shot");
  const [foot,       setFoot]       = useState("Right");
  const [ratings,    setRatings]    = useState<Record<string, number>>({});
  const [feedback,   setFeedback]   = useState<AiFeedback | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [openDrill,  setOpenDrill]  = useState<string | null>(null);
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [openHist,    setOpenHist]    = useState<string | null>(null);

  const allRated = MECHANICS.every((m) => ratings[m.key]);


  const fetchHistory = async () => {
    if (!token) return;
    setHistLoading(true);
    try {
      const r = await fetch(`${API_URL}/player/shooting`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const json = await r.json(); setHistory(Array.isArray(json.data) ? json.data : []); }
    } catch { /* silent */ } finally { setHistLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Score calculations ────────────────────────────────────────────────────

  const scores = {
    plant_foot:     scoreToBar(ratings.plant_foot     || 0),
    body_shape:     scoreToBar(ratings.body_shape     || 0),
    striking:       scoreToBar(ratings.striking       || 0),
    follow_through: scoreToBar(ratings.follow_through || 0),
  };

  const overallScore = feedback?.overall_score
    ?? Math.round(
        scores.plant_foot     * 0.20 +
        scores.body_shape     * 0.25 +
        scores.striking       * 0.35 +
        scores.follow_through * 0.20
      );

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");

    const prompt = `You are a shooting technique coach. Analyse these self-assessed shooting mechanics and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Shot type: ${shotType}
Kicking foot: ${foot}

Self-assessed mechanics (1=poor, 5=excellent):
- Plant foot position: ${ratings.plant_foot}/5 (${MECHANICS[0].labels[(ratings.plant_foot || 1) - 1]})
- Body shape over ball: ${ratings.body_shape}/5 (${MECHANICS[1].labels[(ratings.body_shape || 1) - 1]})
- Striking technique: ${ratings.striking}/5 (${MECHANICS[2].labels[(ratings.striking || 1) - 1]})
- Follow through: ${ratings.follow_through}/5 (${MECHANICS[3].labels[(ratings.follow_through || 1) - 1]})

Return this exact JSON structure:
{
  "overall_score": <0-100 integer>,
  "plant_foot_feedback": "<one specific sentence>",
  "body_shape_feedback": "<one specific sentence>",
  "striking_feedback": "<one specific sentence>",
  "follow_through_feedback": "<one specific sentence>",
  "biggest_issue": "<the single most important mechanic to fix first>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no special equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "accuracy_tip": "<one practical tip to immediately improve shot accuracy for ${shotType}>"
}`;

    try {
      const r    = await fetch("/api/gemini-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are a professional shooting technique coach. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      const raw  = data.response || "";
      const parsed = extractJson(raw);

      if (parsed) {
        setFeedback(parsed);
      } else {
        // Hardcoded fallback — always shows a useful result even if AI fails
        const worstKey = MECHANICS.reduce((a, b) => (ratings[a.key] || 5) < (ratings[b.key] || 5) ? a : b).label;
        setFeedback({
          overall_score: overallScore,
          plant_foot_feedback:     "Place your plant foot beside the ball with toes pointing toward your target for maximum accuracy.",
          body_shape_feedback:     "Get your body over the ball — lean forward from your ankle, not your waist.",
          striking_feedback:       "Lock your ankle and point your toes down. Strike with the mid-laces for power, inside foot for placement.",
          follow_through_feedback: "Let your kicking leg swing fully through — your toe should point toward the target at the end.",
          biggest_issue:           worstKey,
          strengths:               ["Consistency improves with deliberate practice", "Self-awareness of technique is the first step to improvement"],
          drill_1: { name: "Wall Pass Accuracy",   description: "Mark a 30cm square on a wall. From 5m, pass the ball into the square using your instep 20 times. Focus on ankle lock and follow through." },
          drill_2: { name: "Plant Foot Cones",     description: "Place a cone where your plant foot should land. Practice running up and planting beside the cone before striking. 15 repetitions each foot." },
          drill_3: { name: "Slow-Motion Strike",   description: "From a standing position, slowly rehearse the full kicking motion in slow motion — plant, shape, contact, follow through. 10 reps each foot." },
          accuracy_tip: `For ${shotType}, focus on keeping your head down and eyes on the ball through contact — looking up early is the #1 cause of poor connection.`,
        });
      }
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(null);
    }

    // Save to backend (non-blocking)
    if (token) {
      fetch(`${API_URL}/player/shooting`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          position,
          shot_type:             shotType,
          foot,
          plant_foot_score:      ratings.plant_foot,
          body_shape_score:      ratings.body_shape,
          striking_score:        ratings.striking,
          follow_through_score:  ratings.follow_through,
          overall_score:         overallScore,
          ai_feedback:           feedback,
        }),
      }).catch(() => {});
    }

    postToArena(`Analysed ${shotType} shooting — scored ${overallScore}/100`, {
      postType: "milestone",
      activityType: "skill_analysis",
      activityData: { skill: "shooting", type: shotType, score: overallScore, sport },
    });
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Shooting Analyzer</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Shooting Technique Analyzer</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your shooting mechanics and get AI drill recommendations</p>
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

          {/* Shot Context */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Shot Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Position (optional)
            </label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Striker, Winger, Forward…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Shot Type
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {SHOT_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setShotType(t)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${shotType === t ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: shotType === t ? "#1a5c2a" : "white",
                    color: shotType === t ? "white" : "#374151",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Kicking Foot
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {FEET.map((f) => (
                <button
                  key={f}
                  onClick={() => setFoot(f)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600,
                    border: `2px solid ${foot === f ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: foot === f ? "#1a5c2a" : "white",
                    color: foot === f ? "white" : "#374151",
                  }}
                >
                  {f} Foot
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase("assess")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Next: Rate Your Technique →
          </button>
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <History size={16} color="#6b7280" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>Past Assessments</h2>
            </div>
            {histLoading && <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Loading history…</p>}
            {!histLoading && history.length === 0 && (
              <div style={{ ...card, textAlign: "center", padding: "28px 16px" }}>
                <History size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No sessions yet. Complete your first assessment above.</p>
              </div>
            )}
            {!histLoading && history.map((entry) => {
              const isOpen = openHist === entry.id;
              const clr    = barColor(entry.overall_score);
              const date   = new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              return (
                <div key={entry.id} style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10, overflow: "hidden" }}>
                  <button onClick={() => setOpenHist(isOpen ? null : entry.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: clr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{entry.overall_score}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111" }}>{entry.sport} · {entry.shot_type} · {entry.foot} foot</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{date}{entry.position ? ` · ${entry.position}` : ""}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: clr }}>{barLabel(entry.overall_score)}</span>
                      {isOpen ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ paddingTop: 14 }}>
                        {[
                          { label: "Plant Foot", score: entry.plant_foot_score, color: "#2563eb" },
                          { label: "Body Shape", score: entry.body_shape_score, color: "#1a5c2a" },
                          { label: "Striking", score: entry.striking_score, color: "#c8962a" },
                          { label: "Follow Through", score: entry.follow_through_score, color: "#7c3aed" },
                        ].map((m) => {
                          const pct = scoreToBar(m.score);
                          return (
                            <div key={m.label} style={{ marginBottom: 10 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{m.label}</span>
                                <span style={{ fontSize: 12, color: barColor(pct), fontWeight: 600 }}>{pct}/100</span>
                              </div>
                              <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, backgroundColor: m.color, borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {entry.ai_feedback?.biggest_issue && (
                        <div style={{ marginTop: 10, backgroundColor: "#fefce8", borderRadius: 8, padding: "10px 12px", border: "1px solid #fde68a" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
                          <p style={{ margin: 0, fontSize: 13, color: "#111" }}>{entry.ai_feedback.biggest_issue}</p>
                        </div>
                      )}
                      {entry.ai_feedback?.accuracy_tip && (
                        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280" }}><strong>Accuracy tip:</strong> {entry.ai_feedback.accuracy_tip}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Rate Your Technique</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {shotType} · {foot} foot</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate each mechanic honestly based on how you shoot. 1 = needs major work, 5 = excellent.
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
            <Target size={18} />
            {loading ? "Analysing your technique…" : allRated ? "Get AI Analysis" : `Rate all 4 mechanics (${Object.keys(ratings).length}/4)`}
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
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Shooting Analysis</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
            Overall Shooting Score
          </p>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 8,
            color: scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171",
          }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} shooting technique
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {shotType} · {foot} foot
          </p>
        </div>

        {/* Mechanics breakdown */}
        <div style={card}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Technique Breakdown</h2>
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
              <strong>{feedback.biggest_issue}</strong> is the biggest limiter of your shooting quality right now.
            </p>
          </div>
        )}

        {/* Accuracy tip */}
        {feedback?.accuracy_tip && (
          <div style={{ ...card, backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {shotType} Tip
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.accuracy_tip}</p>
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
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Fix Your Technique</h2>
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
          onClick={() => { setPhase("setup"); setRatings({}); setFeedback(null); setError(""); setOpenDrill(null); fetchHistory(); }}
          style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <RotateCcw size={16} /> New Assessment
        </button>
      </div>
    </div>
  );
}
