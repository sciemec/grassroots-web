"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, ChevronDown, ChevronUp, RotateCcw, History } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    "approach" | "body_shape" | "timing" | "recovery";
  label:  string;
  weight: number;
  desc:   string;
  color:  string;
  labels: [string, string, string, string, string];
}

interface AiFeedback {
  approach_feedback:    string;
  body_shape_feedback:  string;
  timing_feedback:      string;
  recovery_feedback:    string;
  biggest_issue:         string;
  strengths:             string[];
  drill_1:               { name: string; description: string };
  drill_2:               { name: string; description: string };
  drill_3:               { name: string; description: string };
  tackle_tip:            string;
}

interface HistoryEntry {
  id:                string;
  sport:             string;
  position:          string | null;
  tackle_type:       string;
  approach_score:    number;
  body_shape_score:  number;
  timing_score:      number;
  recovery_score:    number;
  overall_score:     number;
  ai_feedback:       AiFeedback | null;
  created_at:        string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MECHANICS: MechanicRating[] = [
  {
    key:    "approach",
    label:  "Approach & Positioning",
    weight: 0.25,
    desc:   "Do you close the attacker at the right angle and speed, cutting off options?",
    color:  "#1a5c2a",
    labels: [
      "Rush in straight — easily beaten",
      "Occasionally cuts off space",
      "Decent angle, speed sometimes wrong",
      "Good approach, limits attacker options",
      "Perfect angle, controlled press — attacker has nowhere to go",
    ],
  },
  {
    key:    "body_shape",
    label:  "Body Shape & Balance",
    weight: 0.30,
    desc:   "Are your knees bent, weight low, and feet shoulder-width apart when tackling?",
    color:  "#2563eb",
    labels: [
      "Upright, off balance, easily knocked off",
      "Sometimes gets low",
      "Moderate stance, moderate stability",
      "Good low centre of gravity",
      "Rock solid — balanced, wide, low every time",
    ],
  },
  {
    key:    "timing",
    label:  "Timing",
    weight: 0.30,
    desc:   "Do you wait for the right moment to commit, rather than diving in early?",
    color:  "#c8962a",
    labels: [
      "Always dives in — easily bypassed",
      "Often commits too early",
      "Sometimes waits, sometimes dives",
      "Usually picks the right moment",
      "Ice-cold patience — commits only when guaranteed to win",
    ],
  },
  {
    key:    "recovery",
    label:  "Recovery & Transition",
    weight: 0.15,
    desc:   "After a tackle or interception, do you get up quickly and transition to attack?",
    color:  "#7c3aed",
    labels: [
      "Slow to recover — team exposed",
      "Sometimes slow to get up",
      "Moderate recovery speed",
      "Gets up and contributes quickly",
      "Instant recovery — immediately dangerous in transition",
    ],
  },
];

const SPORTS = ["Football", "Rugby", "Athletics", "Netball", "Basketball", "Cricket", "Swimming", "Tennis", "Volleyball", "Hockey"];

const TACKLE_TYPES = [
  "Block Tackle",
  "Slide Tackle",
  "Shoulder Challenge",
  "Interception",
  "Press & Win",
  "Defensive Header",
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

export default function TacklingAnalyzerPage() {
  const token = useAuthStore((s) => s.token);

  const [phase,       setPhase]       = useState<"setup" | "assess" | "results">("setup");
  const [sport,       setSport]       = useState("Football");
  const [position,    setPosition]    = useState("");
  const [tackleType,  setTackleType]  = useState("Block Tackle");
  const [ratings,     setRatings]     = useState<Record<string, number>>({});
  const [feedback,    setFeedback]    = useState<AiFeedback | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [openDrill,   setOpenDrill]   = useState<string | null>(null);
  const [history,     setHistory]     = useState<HistoryEntry[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [openHist,    setOpenHist]    = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!token) return;
    setHistLoading(true);
    try {
      const r = await fetch(`${API_URL}/player/tackling`, {
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

  const allRated     = MECHANICS.every((m) => ratings[m.key]);
  const overallScore = Math.round(
    MECHANICS.reduce((sum, m) => sum + scoreToBar(ratings[m.key] || 0) * m.weight, 0)
  );

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");

    const prompt = `You are an elite defensive coach. Analyse these self-assessed tackling mechanics and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Tackle type focus: ${tackleType}

Self-assessed mechanics (1=poor, 5=excellent):
- Approach & Positioning: ${ratings.approach}/5 (${MECHANICS[0].labels[(ratings.approach || 1) - 1]})
- Body Shape & Balance: ${ratings.body_shape}/5 (${MECHANICS[1].labels[(ratings.body_shape || 1) - 1]})
- Timing: ${ratings.timing}/5 (${MECHANICS[2].labels[(ratings.timing || 1) - 1]})
- Recovery & Transition: ${ratings.recovery}/5 (${MECHANICS[3].labels[(ratings.recovery || 1) - 1]})

Return this exact JSON structure:
{
  "approach_feedback": "<one specific coaching sentence>",
  "body_shape_feedback": "<one specific coaching sentence>",
  "timing_feedback": "<one specific coaching sentence>",
  "recovery_feedback": "<one specific coaching sentence>",
  "biggest_issue": "<the single most important thing to fix first>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "tackle_tip": "<one tip specific to ${tackleType}>"
}`;

    try {
      const r    = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are a professional defensive and tackling coach. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      const raw  = data.response || data.answer || "";
      const parsed = extractJson(raw);
      setFeedback(parsed ?? buildFallback());
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(buildFallback());
    }

    if (token) {
      fetch(`${API_URL}/player/tackling`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport,
          position:          position || null,
          tackle_type:       tackleType,
          approach_score:    ratings.approach,
          body_shape_score:  ratings.body_shape,
          timing_score:      ratings.timing,
          recovery_score:    ratings.recovery,
          overall_score:     overallScore,
          ai_feedback:       feedback,
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
      approach_feedback:   "Close the attacker on a slight diagonal — never straight on — to funnel them toward the touchline or away from goal.",
      body_shape_feedback: "Bend your knees and drop your hips before every tackle attempt. A low centre of gravity makes you almost impossible to knock off the ball.",
      timing_feedback:     "Let the attacker commit to a touch before you commit to the tackle. The ball moving away from their body is your trigger.",
      recovery_feedback:   "The moment the tackle is made, sprint 5m in the direction of the next threat. Don't watch to see if you won — assume you did and move.",
      biggest_issue:       `${weakest.label} is your biggest limiter right now.`,
      strengths:           ["Your willingness to defend is an asset", "Defensive intelligence improves with deliberate practice"],
      drill_1: { name: "Shadow Defending",      description: "Work with a partner who dribbles slowly. Stay 1m away, mirroring their movement without committing. 4 × 30-second rounds." },
      drill_2: { name: "Bounce & Block",         description: "Stand 3m from a wall. Drop into a low defensive stance, shuffle sideways 2m, then shuffle back. Keeps knees bent throughout. 3 sets of 10." },
      drill_3: { name: "Delayed Tackle Gates",   description: "Set 2 cones 2m apart. Partner dribbles through — you must let them reach the first cone before you can engage. Trains patience and timing." },
      tackle_tip: `For a ${tackleType}, always be on the balls of your feet so you can shift your weight instantly when the attacker makes their move.`,
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Tackling Analyzer</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Tackling Analyzer</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your defensive tackling and get AI coaching feedback</p>
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
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Tackling Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Position (optional)</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Centre Back, Defensive Mid, Flanker…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Tackle Type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TACKLE_TYPES.map((t) => (
                <button key={t} onClick={() => setTackleType(t)} style={{
                  padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                  border: `2px solid ${tackleType === t ? "#1a5c2a" : "#e5e7eb"}`,
                  backgroundColor: tackleType === t ? "#1a5c2a" : "white",
                  color: tackleType === t ? "white" : "#374151",
                }}>{t}</button>
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
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111" }}>{entry.sport} · {entry.tackle_type}</p>
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
                          { label: "Approach & Positioning", score: entry.approach_score, color: "#1a5c2a" },
                          { label: "Body Shape & Balance", score: entry.body_shape_score, color: "#2563eb" },
                          { label: "Timing", score: entry.timing_score, color: "#c8962a" },
                          { label: "Recovery & Transition", score: entry.recovery_score, color: "#7c3aed" },
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
                      {entry.ai_feedback?.tackle_tip && (
                        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280" }}><strong>Tackling tip:</strong> {entry.ai_feedback.tackle_tip}</p>
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
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {tackleType}</span>
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
            <Shield size={18} />
            {loading ? "Analysing your tackling…" : allRated ? "Get AI Analysis" : `Rate all 4 mechanics (${Object.keys(ratings).length}/4)`}
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
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Tackling Analysis</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>Overall Tackling Score</p>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreColorLight, marginBottom: 8 }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} tackling mechanics
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {tackleType}{position ? ` · ${position}` : ""}
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
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}><strong>{feedback.biggest_issue}</strong></p>
          </div>
        )}

        {/* Tackle tip */}
        {feedback?.tackle_tip && (
          <div style={{ ...card, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {tackleType} Tip
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.tackle_tip}</p>
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
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Sharpen Your Tackling</h2>
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
