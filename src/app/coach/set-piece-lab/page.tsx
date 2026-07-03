"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MechanicRating {
  key:    string;
  label:  string;
  desc:   string;
  color:  string;
  weight: number;
  labels: string[];
}

interface AiFeedback {
  overall_score:            number;
  m1_feedback:              string;
  m2_feedback:              string;
  m3_feedback:              string;
  m4_feedback:              string;
  biggest_weakness:         string;
  tactical_recommendation:  string;
  strengths:                string[];
  routine_1:                { name: string; description: string };
  routine_2:                { name: string; description: string };
  routine_3:                { name: string; description: string };
  opponent_counter:         string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SET_PIECE_TYPES: Record<string, string[]> = {
  Football:    ["Corner", "Free Kick", "Penalty", "Throw-in", "Goal Kick"],
  Rugby:       ["Line-out", "Scrum", "Penalty", "Restart", "Drop-out"],
  Netball:     ["Centre Pass", "Penalty Pass", "Throw-in"],
  Basketball:  ["Jump Ball", "Free Throw", "Inbound Pass"],
  Cricket:     ["New Ball", "Powerplay", "Death Overs"],
  Athletics:   ["Sprint Start", "Relay Handoff"],
  Swimming:    ["Race Start", "Relay Takeover"],
  Tennis:      ["First Serve", "Second Serve", "Return"],
  Volleyball:  ["Serve", "First Ball Reception"],
  Hockey:      ["Short Corner", "Free Hit", "Penalty Corner"],
};

const SPORTS = Object.keys(SET_PIECE_TYPES);

const ATTACKING_MECHANICS: MechanicRating[] = [
  {
    key: "delivery", label: "Delivery Quality", weight: 0.30,
    desc: "How accurately and consistently is the ball delivered to the target zone?",
    color: "#2563eb",
    labels: [
      "Wildly inaccurate — ball rarely reaches any runner",
      "Inconsistent — good delivery 1 in 3 times",
      "Average — reaches the zone but pace and flight vary",
      "Good — consistent delivery with correct pace",
      "Excellent — precise delivery, correct curve and pace every time",
    ],
  },
  {
    key: "timing", label: "Runner Timing & Movement", weight: 0.30,
    desc: "How well do your runners time their runs relative to the delivery?",
    color: "#1a5c2a",
    labels: [
      "Runners move too early or too late — always offside or stationary",
      "Timing poor, runs rarely coordinated with delivery",
      "Some coordination, timing inconsistent",
      "Good movement — runners arrive with the ball most of the time",
      "Excellent — perfectly timed, layered runs with decoy movement",
    ],
  },
  {
    key: "blocking", label: "Blocking & Screening", weight: 0.20,
    desc: "How effectively do your players block, screen, and create space for attackers?",
    color: "#c8962a",
    labels: [
      "No deliberate blocking — defenders unimpeded",
      "Occasional block but not coordinated with runs",
      "Some screening but blocks hold too long or too short",
      "Good blocks that free the primary runner",
      "Excellent — blocks draw defenders then release at the right moment",
    ],
  },
  {
    key: "second_ball", label: "First & Second Ball", weight: 0.20,
    desc: "How well does your team contest and win the ball after the initial delivery?",
    color: "#7c3aed",
    labels: [
      "No second ball preparation — completely unprepared for rebounds",
      "One player positioned, others unprepared",
      "Some second ball presence but not systematic",
      "Good — 2-3 players prepared for rebounds and clearances",
      "Excellent — whole team structured to win first and second balls",
    ],
  },
];

const DEFENDING_MECHANICS: MechanicRating[] = [
  {
    key: "organization", label: "Organizational Shape", weight: 0.30,
    desc: "How quickly and correctly does your team get into defensive shape?",
    color: "#2563eb",
    labels: [
      "Disorganized — players slow to get into position",
      "Shape forms but too slowly and leaves gaps",
      "Reasonable organization most of the time",
      "Good — defensive shape set quickly with clear communication",
      "Excellent — instant, disciplined shape every time",
    ],
  },
  {
    key: "aerial", label: "Aerial Dominance", weight: 0.30,
    desc: "How well does your team win headers and aerial challenges?",
    color: "#1a5c2a",
    labels: [
      "Consistently beaten in the air — poor jump timing",
      "Win some aerial battles but often out-muscled",
      "Competitive in the air, inconsistent timing",
      "Good aerial ability — win more than you lose",
      "Dominant — command the air, win first ball consistently",
    ],
  },
  {
    key: "clearance", label: "Clearance Quality", weight: 0.25,
    desc: "When you win the ball, do you clear it to safety or into danger?",
    color: "#c8962a",
    labels: [
      "Clearances go straight to opposition — gifting second ball",
      "Clearances are short or sideways, no distance",
      "Clearances get some distance but direction inconsistent",
      "Good — clearances find space or a teammate most of the time",
      "Excellent — decisive clearances to wide areas or target player",
    ],
  },
  {
    key: "transition", label: "Transition Out", weight: 0.15,
    desc: "After winning the ball, how ready is your team to counter-attack?",
    color: "#7c3aed",
    labels: [
      "Ball won then immediately given back — no transition plan",
      "Occasionally holds ball but no forward threat",
      "Some counter potential but not systematic",
      "Good — one player always ready to receive and run at goal",
      "Excellent — instant counter-attack with clear runners and outlet",
    ],
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeScore(mechanics: MechanicRating[], ratings: Record<string, number>): number {
  return Math.round(
    mechanics.reduce((sum, m) => sum + (ratings[m.key] || 0) * 20 * m.weight, 0)
  );
}

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

export default function SetPieceLabPage() {
  const token = useAuthStore((s) => s.token);

  const [phase,        setPhase]        = useState<"setup" | "assess" | "results">("setup");
  const [sport,        setSport]        = useState("Football");
  const [setPieceType, setSetPieceType] = useState("Corner");
  const [situation,    setSituation]    = useState<"attacking" | "defending">("attacking");
  const [teamName,     setTeamName]     = useState("");
  const [oppTendency,  setOppTendency]  = useState("");
  const [ratings,      setRatings]      = useState<Record<string, number>>({});
  const [feedback,     setFeedback]     = useState<AiFeedback | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [openRoutine,  setOpenRoutine]  = useState<string | null>(null);

  const mechanics  = situation === "attacking" ? ATTACKING_MECHANICS : DEFENDING_MECHANICS;
  const allRated   = mechanics.every((m) => ratings[m.key]);
  const overallScore = feedback?.overall_score ?? computeScore(mechanics, ratings);
  const setPieceOptions = SET_PIECE_TYPES[sport] ?? SET_PIECE_TYPES.Football;

  // Keep set piece type valid when sport changes
  const handleSportChange = (s: string) => {
    setSport(s);
    const opts = SET_PIECE_TYPES[s] ?? SET_PIECE_TYPES.Football;
    if (!opts.includes(setPieceType)) setSetPieceType(opts[0]);
    setRatings({});
    setFeedback(null);
  };

  // Clear ratings when situation changes (different mechanic keys)
  const handleSituationChange = (s: "attacking" | "defending") => {
    setSituation(s);
    setRatings({});
    setFeedback(null);
  };

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    setLoading(true); setError("");

    const mechanicLines = mechanics.map((m, i) =>
      `- ${m.label}: ${ratings[m.key]}/5 (${m.labels[(ratings[m.key] || 1) - 1]})`
    ).join("\n");

    const prompt = `You are a professional set piece coach. Analyse this team's ${situation} ${setPieceType} and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${sport}
Set piece: ${setPieceType}
Situation: ${situation}${teamName ? `\nTeam: ${teamName}` : ""}${oppTendency ? `\nOpponent tendency: ${oppTendency}` : ""}

Self-assessed team mechanics (1=poor, 5=excellent):
${mechanicLines}

Return this exact JSON structure:
{
  "overall_score": <0-100 integer>,
  "m1_feedback": "<one specific tactical sentence for ${mechanics[0].label}>",
  "m2_feedback": "<one specific tactical sentence for ${mechanics[1].label}>",
  "m3_feedback": "<one specific tactical sentence for ${mechanics[2].label}>",
  "m4_feedback": "<one specific tactical sentence for ${mechanics[3].label}>",
  "biggest_weakness": "<the single most important area to fix first>",
  "tactical_recommendation": "<2 sentences: the key tactical change to make immediately>",
  "strengths": ["<tactical strength 1>", "<tactical strength 2>"],
  "routine_1": { "name": "<routine or drill name>", "description": "<2-sentence practical description for a coach to implement in training>" },
  "routine_2": { "name": "<routine or drill name>", "description": "<2-sentence practical description>" },
  "routine_3": { "name": "<routine or drill name>", "description": "<2-sentence practical description>" },
  "opponent_counter": "${oppTendency ? `<specific tactic to exploit the opponent tendency: ${oppTendency}>` : "N/A"}"
}`;

    try {
      const r    = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          system_prompt: "You are a professional set piece coach with UEFA A-licence experience. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      const raw  = data.response || data.answer || "";
      const parsed = extractJson(raw);

      if (parsed) {
        setFeedback(parsed);
      } else {
        const worstM = mechanics.reduce((a, b) => (ratings[a.key] || 5) < (ratings[b.key] || 5) ? a : b);
        setFeedback(situation === "attacking" ? {
          overall_score: overallScore,
          m1_feedback:   "Delivery consistency is the foundation — work on repeating the same run-up and contact point every time.",
          m2_feedback:   "Runners must move on a trigger signal (the kicker's plant foot), not the kick itself.",
          m3_feedback:   "Blockers should make contact then pivot — not hold static blocks that referees can penalise.",
          m4_feedback:   "Assign specific second ball roles in training so every player knows their position after the first delivery.",
          biggest_weakness: worstM.label,
          tactical_recommendation: `Focus on improving ${worstM.label.toLowerCase()} first — it has the highest impact on your ${setPieceType} conversion rate. Run a dedicated 15-minute set piece block at the end of every training session.`,
          strengths: ["You are actively analysing your set pieces — most teams at this level don't", "Deliberate set piece practice can add 2-3 goals per season"],
          routine_1: { name: "Delivery Repetition Block", description: "Kick 20 consecutive deliveries to a marked target zone with no defenders. Track how many land in the zone and aim for 80%+ before adding runners." },
          routine_2: { name: "Trigger Start Drill",        description: "Runners stand stationary. Coach signals when the kicker plants their foot — runners must move only on this trigger. Run 10 reps with correct triggers only." },
          routine_3: { name: "Second Ball Game",           description: "Deliver corners to 3 attackers vs 3 defenders in a 15×10m box. Award points only for winning the second ball cleanly. First to 5 wins." },
          opponent_counter: oppTendency ? `If the opposition ${oppTendency.toLowerCase()}, adjust your delivery target zone to exploit the gap this creates.` : "N/A",
        } : {
          overall_score: overallScore,
          m1_feedback:   "Call a clear organizing voice — one designated player should call the shape every time before the set piece is taken.",
          m2_feedback:   "Train jumping timing against a thrown ball at different heights before facing live corners.",
          m3_feedback:   "Clearances must go wide, not central — drill players to instinctively clear toward the touchlines.",
          m4_feedback:   "Designate one fast player to be the 'counter trigger' who sprints toward the opposition half the moment the ball is won.",
          biggest_weakness: worstM.label,
          tactical_recommendation: `${worstM.label} is giving away goals. Address this in training with isolated defensive set piece reps under pressure — 10 minutes at the end of every session until it's reliable.`,
          strengths: ["Analysing defensive set pieces proactively puts you ahead of most coaches at this level", "Consistent defensive shape can prevent 3-4 goals per season"],
          routine_1: { name: "Defensive Shape Freeze",   description: "Freeze your defensive shape the moment a set piece is signalled. Coach checks every player's position before the ball is played — correct it loudly. 10 reps." },
          routine_2: { name: "Aerial Battle Circuit",    description: "3 attackers take turns throwing balls into the box for 2 defenders to compete for. Track who wins each aerial — target 70%+ defensive wins." },
          routine_3: { name: "Clearance Direction Drill", description: "Deliver balls into the box. Defenders must clear to wide cones placed at the touchlines — central clearances are treated as goals conceded. 15 reps." },
          opponent_counter: oppTendency ? `Against a team that ${oppTendency.toLowerCase()}, overload the side they favour and clear aggressively to that side's wide areas.` : "N/A",
        });
      }
    } catch {
      setError("AI analysis unavailable. Showing score breakdown only.");
      setFeedback(null);
    }

    // Save to backend (non-blocking)
    if (token) {
      const ratingPayload: Record<string, number> = {};
      mechanics.forEach((m) => { ratingPayload[`${m.key}_score`] = ratings[m.key]; });
      fetch(`${API_URL}/coach/set-piece-lab`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          sport, set_piece_type: setPieceType, situation,
          team_name: teamName || null,
          opponent_tendency: oppTendency || null,
          overall_score: overallScore,
          ai_feedback: feedback,
          ...ratingPayload,
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
          <Link href="/coach" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
            <ArrowLeft size={15} /> Coach Hub
          </Link>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Set Piece Lab</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Flag size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Set Piece Lab</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your team&apos;s set piece execution and get AI tactical recommendations</p>
            </div>
          </div>

          {/* Sport */}
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Sport</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SPORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSportChange(s)}
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

          {/* Set piece config */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Set Piece Configuration</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Set Piece Type
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {setPieceOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setSetPieceType(t)}
                  style={{
                    padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${setPieceType === t ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: setPieceType === t ? "#1a5c2a" : "white",
                    color: setPieceType === t ? "white" : "#374151",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>
              Situation
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {(["attacking", "defending"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSituationChange(s)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700,
                    border: `2px solid ${situation === s ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: situation === s ? "#1a5c2a" : "white",
                    color: situation === s ? "white" : "#374151",
                    textTransform: "capitalize",
                  }}
                >
                  {s === "attacking" ? "⚔️  Attacking" : "🛡️  Defending"}
                </button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Team Name (optional)
            </label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Harare City U17s…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              Opponent Tendency (optional — get a targeted counter)
            </label>
            <input
              value={oppTendency}
              onChange={(e) => setOppTendency(e.target.value)}
              placeholder={situation === "attacking" ? "e.g. They play zonal marking, keeper stays on line…" : "e.g. They always target the back post runner…"}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <button
            onClick={() => setPhase("assess")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Next: Rate Your Team&apos;s Execution →
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Rate Your Team</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>
            {sport} · {setPieceType} · {situation}
          </span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate your team&apos;s execution of {situation} {setPieceType.toLowerCase()}s honestly. 1 = major weakness, 5 = team strength.
          </p>

          {mechanics.map((m) => {
            const current = ratings[m.key] || 0;
            return (
              <div key={m.key} style={{ ...card, borderLeft: `4px solid ${current ? m.color : "#e5e7eb"}` }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>{m.label}</h3>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{Math.round(m.weight * 100)}% weight</span>
                  </div>
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
            <Flag size={18} />
            {loading ? "Generating tactical report…" : allRated ? "Get AI Tactical Report" : `Rate all 4 areas (${Object.keys(ratings).filter(k => mechanics.some(m => m.key === k)).length}/4)`}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  const scoreColor = overallScore >= 80 ? "#16a34a" : overallScore >= 60 ? "#d97706" : overallScore >= 40 ? "#ea580c" : "#dc2626";
  const scoreLabel = overallScore >= 80 ? "Strong" : overallScore >= 60 ? "Developing" : overallScore >= 40 ? "Needs work" : "Critical gap";
  const feedbackKeys: Array<keyof AiFeedback> = ["m1_feedback", "m2_feedback", "m3_feedback", "m4_feedback"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={nav}>
        <Link href="/coach" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Coach Hub
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Set Piece Report</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
            Team Score — {situation === "attacking" ? "Attacking" : "Defending"} {setPieceType}
          </p>
          <div style={{
            fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 8,
            color: scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171",
          }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {scoreLabel} set piece execution
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {setPieceType}{teamName ? ` · ${teamName}` : ""}
          </p>
        </div>

        {/* Mechanics breakdown */}
        <div style={card}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Execution Breakdown</h2>
          {mechanics.map((m, i) => {
            const pct  = (ratings[m.key] || 0) * 20;
            const clr  = barColor(pct);
            const text = feedback ? (feedback[feedbackKeys[i]] as string) : null;
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

        {/* Biggest weakness */}
        {feedback?.biggest_weakness && (
          <div style={{ ...card, backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Biggest Weakness</p>
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}>
              <strong>{feedback.biggest_weakness}</strong> is the area costing your team the most on {setPieceType.toLowerCase()}s.
            </p>
          </div>
        )}

        {/* Tactical recommendation */}
        {feedback?.tactical_recommendation && (
          <div style={{ ...card, backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Tactical Recommendation</p>
            <p style={{ margin: 0, fontSize: 14, color: "#111", lineHeight: 1.6 }}>{feedback.tactical_recommendation}</p>
          </div>
        )}

        {/* Opponent counter */}
        {feedback?.opponent_counter && feedback.opponent_counter !== "N/A" && (
          <div style={{ ...card, backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff" }}>
            <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>Counter This Opponent</p>
            <p style={{ margin: 0, fontSize: 14, color: "#111", lineHeight: 1.6 }}>{feedback.opponent_counter}</p>
          </div>
        )}

        {/* Strengths */}
        {feedback?.strengths?.length ? (
          <div style={{ ...card, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>Team Strengths</p>
            {feedback.strengths.map((s, i) => (
              <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#111", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span> {s}
              </p>
            ))}
          </div>
        ) : null}

        {/* Routines */}
        {feedback && (
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>
              3 {situation === "attacking" ? "Routines" : "Drills"} to Implement in Training
            </h2>
            {[feedback.routine_1, feedback.routine_2, feedback.routine_3].map((routine, i) => {
              if (!routine?.name) return null;
              const key  = `routine_${i + 1}`;
              const open = openRoutine === key;
              return (
                <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenRoutine(open ? null : key)}
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "white", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                      <span style={{ marginRight: 8, color: "#1a5c2a", fontWeight: 700 }}>{i + 1}.</span>
                      {routine.name}
                    </span>
                    {open ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
                  </button>
                  {open && (
                    <div style={{ padding: "12px 16px 14px", backgroundColor: "#f9fafb", borderTop: "1px solid #f3f4f6" }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{routine.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <button
          onClick={() => { setPhase("setup"); setRatings({}); setFeedback(null); setError(""); setOpenRoutine(null); }}
          style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <RotateCcw size={16} /> New Assessment
        </button>
      </div>
    </div>
  );
}
