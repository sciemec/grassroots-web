"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, ChevronDown, ChevronUp, RotateCcw, History } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { postToArena } from "@/lib/arena-poster";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    "body_shape" | "weight_accuracy" | "decision_making" | "follow_through";
  label:  string;
  weight: number;
  desc:   string;
  color:  string;
  labels: [string, string, string, string, string];
}

interface AiFeedback {
  body_shape_feedback:        string;
  weight_accuracy_feedback:   string;
  decision_making_feedback:   string;
  follow_through_feedback:    string;
  biggest_issue:               string;
  strengths:                   string[];
  drill_1:                     { name: string; description: string };
  drill_2:                     { name: string; description: string };
  drill_3:                     { name: string; description: string };
  pass_tip:                    string;
}

interface HistoryEntry {
  id:                    string;
  sport:                 string;
  position:              string | null;
  pass_type:             string;
  foot:                  string;
  body_shape_score:      number;
  weight_accuracy_score: number;
  decision_making_score: number;
  follow_through_score:  number;
  overall_score:         number;
  ai_feedback:           AiFeedback | null;
  created_at:            string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MECHANICS: MechanicRating[] = [
  {
    key:    "body_shape",
    label:  "Body Shape & Stance",
    weight: 0.25,
    desc:   "Is your non-kicking foot beside the ball? Is your body open to the target?",
    color:  "#1a5c2a",
    labels: [
      "Square on, no body shape",
      "Rarely open to target",
      "Sometimes gets sideways-on",
      "Consistent open body shape",
      "Perfect stance every pass",
    ],
  },
  {
    key:    "weight_accuracy",
    label:  "Pass Weight & Accuracy",
    weight: 0.35,
    desc:   "Are your passes the right pace and landing on target?",
    color:  "#2563eb",
    labels: [
      "Often off-target or wrong weight",
      "Hits target sometimes",
      "Mostly accurate, weight varies",
      "Good accuracy and weight",
      "Consistently precise — like a laser",
    ],
  },
  {
    key:    "decision_making",
    label:  "Decision Making",
    weight: 0.25,
    desc:   "Do you pick the right pass at the right moment? Do you disguise it?",
    color:  "#c8962a",
    labels: [
      "Often pass into danger",
      "Slow to decide, telegraphed",
      "OK in simple situations",
      "Good choices, some disguise",
      "Always picks best option, impossible to read",
    ],
  },
  {
    key:    "follow_through",
    label:  "Follow Through",
    weight: 0.15,
    desc:   "Does your kicking foot follow through toward the target after contact?",
    color:  "#7c3aed",
    labels: [
      "Stabbed, no follow through",
      "Short follow through",
      "Moderate follow through",
      "Good extension toward target",
      "Full follow through, locked ankle",
    ],
  },
];

const SPORTS = ["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];

const PASS_TYPES = [
  "Short Pass",
  "Long Ball / Switch",
  "Through Ball",
  "Cross",
  "Back Pass",
  "One-Touch Pass",
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

export default function PassingAnalyzerPage() {
  const token = useAuthStore((s) => s.token);

  const [phase,     setPhase]     = useState<"setup" | "assess" | "results">("setup");
  const [sport,     setSport]     = useState("Football");
  const [position,  setPosition]  = useState("");
  const [passType,  setPassType]  = useState("Short Pass");
  const [foot,      setFoot]      = useState("Right");
  const [ratings,   setRatings]   = useState<Record<string, number>>({});
  const [feedback,  setFeedback]  = useState<AiFeedback | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [openDrill,   setOpenDrill]   = useState<string | null>(null);
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [openHist,    setOpenHist]    = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!token) return;
    setHistLoading(true);
    try {
      const r = await fetch(`${API_URL}/player/passing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const json = await r.json();
        const _r = json.data?.data ?? json.data;
        setHistory(Array.isArray(_r) ? _r : []);
      }
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  };
  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allRated    = MECHANICS.every((m) => ratings[m.key]);
  const overallScore = Math.round(
    MECHANICS.reduce((sum, m) => sum + scoreToBar(ratings[m.key] || 0) * m.weight, 0)
  );

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");

    const prompt = `You are an elite passing coach. Analyse these self-assessed passing mechanics and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Pass type focus: ${passType}
Kicking / throwing foot or hand: ${foot}

Self-assessed mechanics (1=poor, 5=excellent):
- Body Shape & Stance: ${ratings.body_shape}/5 (${MECHANICS[0].labels[(ratings.body_shape || 1) - 1]})
- Pass Weight & Accuracy: ${ratings.weight_accuracy}/5 (${MECHANICS[1].labels[(ratings.weight_accuracy || 1) - 1]})
- Decision Making: ${ratings.decision_making}/5 (${MECHANICS[2].labels[(ratings.decision_making || 1) - 1]})
- Follow Through: ${ratings.follow_through}/5 (${MECHANICS[3].labels[(ratings.follow_through || 1) - 1]})

Return this exact JSON structure:
{
  "body_shape_feedback": "<one specific coaching sentence>",
  "weight_accuracy_feedback": "<one specific coaching sentence>",
  "decision_making_feedback": "<one specific coaching sentence>",
  "follow_through_feedback": "<one specific coaching sentence>",
  "biggest_issue": "<the single most important thing to fix first>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "pass_tip": "<one tip specific to ${passType} passing>"
}`;

    try {
      const r    = await fetch("/api/gemini-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are a professional passing coach. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      const raw  = data.response || "";
      const parsed = extractJson(raw);
      setFeedback(parsed ?? buildFallback());
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(buildFallback());
    }

    if (token) {
      fetch(`${API_URL}/player/passing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          position:             position || null,
          pass_type:            passType,
          foot,
          body_shape_score:     ratings.body_shape,
          weight_accuracy_score: ratings.weight_accuracy,
          decision_making_score: ratings.decision_making,
          follow_through_score:  ratings.follow_through,
          overall_score:         overallScore,
          ai_feedback:           feedback,
        }),
      }).catch(() => {});
    }

    postToArena(`Analysed ${passType} passing — scored ${overallScore}/100`, {
      postType: "milestone",
      activityType: "skill_analysis",
      activityData: { skill: "passing", type: passType, score: overallScore, sport },
    });
    setPhase("results");
    setLoading(false);
  };

  function buildFallback(): AiFeedback {
    const weakest = MECHANICS.reduce((min, m) =>
      (ratings[m.key] || 5) < (ratings[min.key] || 5) ? m : min
    );
    return {
      body_shape_feedback:        "Plant your non-kicking foot beside the ball and open your hips to the target before every pass.",
      weight_accuracy_feedback:   "Pick a spot on your teammate — not just their general direction. Aim for their front foot.",
      decision_making_feedback:   "Scan before you receive the ball so your decision is already made when it arrives at your feet.",
      follow_through_feedback:    "Drive your foot through the ball and point your toes at the target after contact.",
      biggest_issue:              `${weakest.label} is your biggest limiter right now.`,
      strengths:                  ["You are actively working on your technique", "Honest self-assessment is the foundation of improvement"],
      drill_1: { name: "Wall Pass Accuracy",      description: "Mark a 30cm target on a wall. From 10m, pass to hit the target 10 times in a row. Move back 2m each time you succeed." },
      drill_2: { name: "Body Shape Gate Drill",   description: "Place two markers 1m apart. Receive the ball and pass through the gate, focusing on your body being open before you pass. 20 reps each foot." },
      drill_3: { name: "Scan & Pass Sequence",    description: "Before each pass, look away for 1 second to force a head-up habit. The pause trains your brain to process information before acting." },
      pass_tip: `For ${passType} passes, prioritise getting your body shape right first — accuracy follows naturally when your stance is correct.`,
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Passing Analyzer</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={22} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Passing Analyzer</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your passing mechanics and get AI drill recommendations</p>
            </div>
          </div>

          {/* Sport */}
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Your Sport</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SPORTS.map((s) => (
                <button key={s} onClick={() => setSport(s)} style={{
                  padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                  border: `2px solid ${sport === s ? "#1a5c2a" : "#e5e7eb"}`,
                  backgroundColor: sport === s ? "#1a5c2a" : "white",
                  color: sport === s ? "white" : "#374151",
                }}>{s}</button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Passing Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Position (optional)</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Centre Midfield, Playmaker, Point Guard…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Pass Type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {PASS_TYPES.map((t) => (
                <button key={t} onClick={() => setPassType(t)} style={{
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                  border: `2px solid ${passType === t ? "#1a5c2a" : "#e5e7eb"}`,
                  backgroundColor: passType === t ? "#1a5c2a" : "white",
                  color: passType === t ? "white" : "#374151",
                }}>{t}</button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Dominant Foot / Hand</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["Right", "Left", "Both"].map((f) => (
                <button key={f} onClick={() => setFoot(f)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500,
                  border: `2px solid ${foot === f ? "#1a5c2a" : "#e5e7eb"}`,
                  backgroundColor: foot === f ? "#1a5c2a" : "white",
                  color: foot === f ? "white" : "#374151",
                }}>{f}</button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase("assess")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Next: Rate Your Mechanics →
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
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111" }}>{entry.sport} · {entry.pass_type} · {entry.foot} foot</p>
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
                          { label: "Body Shape & Stance", score: entry.body_shape_score, color: "#1a5c2a" },
                          { label: "Weight & Accuracy", score: entry.weight_accuracy_score, color: "#2563eb" },
                          { label: "Decision Making", score: entry.decision_making_score, color: "#c8962a" },
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
                      {entry.ai_feedback?.pass_tip && (
                        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280" }}><strong>Pass tip:</strong> {entry.ai_feedback.pass_tip}</p>
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
          <button onClick={() => setPhase("setup")} style={{ color: "#6b7280", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Rate Your Mechanics</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {passType}</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate each mechanic honestly. 1 = needs major work, 5 = excellent.
          </p>

          {MECHANICS.map((m) => {
            const current = ratings[m.key] || 0;
            return (
              <div key={m.key} style={{ ...card, borderLeft: `4px solid ${current ? m.color : "#e5e7eb"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>{m.label}</h3>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{Math.round(m.weight * 100)}% weight</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>{m.desc}</p>
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
                    >{n}</button>
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
            <Send size={18} />
            {loading ? "Analysing your passing…" : allRated ? "Get AI Analysis" : `Rate all 4 mechanics (${Object.keys(ratings).length}/4)`}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  const scoreColorLight = overallScore >= 80 ? "#4ade80" : overallScore >= 60 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={nav}>
        <Link href="/player" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Player Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Passing Analysis</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>Overall Passing Score</p>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreColorLight, marginBottom: 8 }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} passing mechanics
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {passType} · {foot} foot{position ? ` · ${position}` : ""}
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

        {/* Pass tip */}
        {feedback?.pass_tip && (
          <div style={{ ...card, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {passType} Tip
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.pass_tip}</p>
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
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Sharpen Your Passing</h2>
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
          onClick={() => { setPhase("setup"); setRatings({}); setFeedback(null); setError(""); setOpenDrill(null); fetchHistory(); }}
          style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <RotateCcw size={16} /> New Assessment
        </button>
      </div>
    </div>
  );
}
