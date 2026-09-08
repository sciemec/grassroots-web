"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ClipboardList, ChevronDown, ChevronUp,
  RotateCcw, CheckCircle, History,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Mechanic {
  key:    string;
  label:  string;
  weight: number;
  color:  string;
  desc:   string;
  labels: [string, string, string, string, string];
}

interface SkillCfg {
  title:         string;
  skillCode:     string;
  activityLabel: string;
  activities:    string[];
  mechanics:     Mechanic[];
  hasFoot?:      boolean;
  hasPressure?:  boolean;
  aiRole:        string;
  tipKey:        string;
}

interface SquadPlayer {
  id:         string;
  name?:      string;
  first_name?: string;
  surname?:   string;
  position?:  string;
}

type AiFeedback = Record<string, string | string[] | { name: string; description: string }>;

interface DrillHistoryEntry {
  id:            string;
  player_id:     string;
  skill:         string;
  activity_type: string;
  mechanics:     Record<string, number>;
  overall_score: number;
  ai_feedback:   AiFeedback | null;
  created_at:    string;
}

// ─── Skill Config ─────────────────────────────────────────────────────────────

const SKILL_CONFIG: Record<string, SkillCfg> = {
  dribbling: {
    title: "Dribbling", skillCode: "dribbling",
    activityLabel: "Dribble Type",
    activities: ["Close Control", "Speed Dribbling", "1v1 Attacking", "Ball Carry", "Weaving / Agility", "Under Pressure"],
    mechanics: [
      {
        key: "ball_control", label: "Ball Control & Touch", weight: 0.30, color: "#1a5c2a",
        desc: "How close does the player keep the ball? How clean is each touch?",
        labels: ["Ball runs away, loses control constantly", "Often loses control", "Decent in open space", "Tight control most of the time", "Perfect touch, ball glued to foot"],
      },
      {
        key: "body_position", label: "Body Position & Shielding", weight: 0.25, color: "#2563eb",
        desc: "Does the player use a low centre of gravity and body to protect the ball?",
        labels: ["Upright, ball easily won by opponents", "Rarely shields effectively", "Sometimes gets low", "Good body shape, hard to dispossess", "Low, wide stance — almost unbeatable"],
      },
      {
        key: "change_of_direction", label: "Change of Direction", weight: 0.25, color: "#c8962a",
        desc: "How sharp and deceptive are their cuts, feints, and turns?",
        labels: ["Slow, telegraphed — easy to read", "Some deception but readable", "Effective in simple situations", "Sharp cuts, beats defenders often", "Explosive, unpredictable — elite level"],
      },
      {
        key: "awareness", label: "Head Up & Awareness", weight: 0.20, color: "#7c3aed",
        desc: "Does the player scan the field while dribbling, or watch only the ball?",
        labels: ["Eyes always on ball, no scanning", "Rarely looks up", "Sometimes scans", "Regularly checks surroundings", "Constant scanning — sees everything"],
      },
    ],
    aiRole: "elite dribbling coach", tipKey: "skill_tip",
  },

  "first-touch": {
    title: "First Touch", skillCode: "first_touch",
    activityLabel: "Receive Type",
    activities: ["Ground Pass", "Aerial Ball", "Crossed Ball", "Through Ball", "Long Ball", "Back Pass"],
    hasPressure: true,
    mechanics: [
      {
        key: "body_shape", label: "Body Shape Before Ball Arrives", weight: 0.25, color: "#2563eb",
        desc: "Does the player scan and get into position before the ball reaches them?",
        labels: ["Flat-footed, square-on — no preparation", "Some awareness but poor orientation", "Mostly side-on, occasional scan", "Good half-turn, scans before receiving", "Perfect — turned, scanned, ready to play forward"],
      },
      {
        key: "cushioning", label: "Cushioning & Softness", weight: 0.30, color: "#1a5c2a",
        desc: "How well does the player absorb the ball's pace to keep it under control?",
        labels: ["Ball bounces away — foot too rigid", "Some control but ball often bounces out", "Adequate, ball stays nearby most of the time", "Good foot withdrawal, ball dies near feet", "Perfect — ball dies at feet every time"],
      },
      {
        key: "touch_direction", label: "Touch Direction", weight: 0.25, color: "#c8962a",
        desc: "Does the player move the ball away from pressure into useful space?",
        labels: ["Random direction — no pressure awareness", "Takes touch toward defender unnecessarily", "Neutral — sometimes into space", "Usually takes ball away from pressure", "Perfect — always takes touch away and forward"],
      },
      {
        key: "speed_of_play", label: "Speed of Play After Touch", weight: 0.20, color: "#7c3aed",
        desc: "How quickly is the player ready for their next action after the first touch?",
        labels: ["Long pause before any next action", "Slow — 2+ extra touches to control", "Reasonable — ready but not quick", "Quick — next action begins immediately", "Instant — one-touch quality ready to play"],
      },
    ],
    aiRole: "elite technical coach focusing on first touch", tipKey: "pressure_tip",
  },

  passing: {
    title: "Passing", skillCode: "passing",
    activityLabel: "Pass Type",
    activities: ["Short Pass", "Long Ball / Switch", "Through Ball", "Cross", "Back Pass", "One-Touch Pass"],
    hasFoot: true,
    mechanics: [
      {
        key: "body_shape", label: "Body Shape & Stance", weight: 0.25, color: "#1a5c2a",
        desc: "Is the non-kicking foot beside the ball? Is body open to the target?",
        labels: ["Square on, no body shape", "Rarely open to target", "Sometimes gets sideways-on", "Consistent open body shape", "Perfect stance on every pass"],
      },
      {
        key: "weight_accuracy", label: "Pass Weight & Accuracy", weight: 0.35, color: "#2563eb",
        desc: "Are passes the right pace and landing on target?",
        labels: ["Often off-target or wrong weight", "Hits target sometimes", "Mostly accurate, weight varies", "Good accuracy and weight", "Consistently precise — laser passes"],
      },
      {
        key: "decision_making", label: "Decision Making", weight: 0.25, color: "#c8962a",
        desc: "Does the player pick the right pass at the right moment? Do they disguise it?",
        labels: ["Often passes into danger", "Slow to decide, telegraphed", "OK in simple situations", "Good choices, some disguise", "Always picks best option, impossible to read"],
      },
      {
        key: "follow_through", label: "Follow Through", weight: 0.15, color: "#7c3aed",
        desc: "Does the kicking foot follow through toward the target after contact?",
        labels: ["Stabbed — no follow through", "Short follow through", "Moderate follow through", "Good extension toward target", "Full follow through, locked ankle"],
      },
    ],
    aiRole: "elite passing coach", tipKey: "pass_tip",
  },

  tackling: {
    title: "Tackling", skillCode: "tackling",
    activityLabel: "Tackle Type",
    activities: ["Block Tackle", "Slide Tackle", "Shoulder Challenge", "Interception", "Press & Win", "Defensive Header"],
    mechanics: [
      {
        key: "approach", label: "Approach & Positioning", weight: 0.25, color: "#1a5c2a",
        desc: "Does the player close the attacker at the right angle and speed?",
        labels: ["Rushes straight — easily beaten", "Occasionally cuts off space", "Decent angle, speed sometimes wrong", "Good approach, limits attacker options", "Perfect angle, controlled press — attacker has nowhere to go"],
      },
      {
        key: "body_shape", label: "Body Shape & Balance", weight: 0.30, color: "#2563eb",
        desc: "Are knees bent, weight low, and feet shoulder-width apart when tackling?",
        labels: ["Upright, off balance, easily knocked off", "Sometimes gets low", "Moderate stance, moderate stability", "Good low centre of gravity", "Rock solid — balanced, wide, low every time"],
      },
      {
        key: "timing", label: "Timing", weight: 0.30, color: "#c8962a",
        desc: "Does the player wait for the right moment to commit rather than diving in early?",
        labels: ["Always dives in — easily bypassed", "Often commits too early", "Sometimes waits, sometimes dives", "Usually picks the right moment", "Ice-cold patience — commits only when guaranteed to win"],
      },
      {
        key: "recovery", label: "Recovery & Transition", weight: 0.15, color: "#7c3aed",
        desc: "After a tackle or interception, does the player get up quickly and transition?",
        labels: ["Slow to recover — team exposed", "Sometimes slow to get up", "Moderate recovery speed", "Gets up and contributes quickly", "Instant recovery — immediately dangerous in transition"],
      },
    ],
    aiRole: "elite defensive coach", tipKey: "tackle_tip",
  },

  shooting: {
    title: "Shooting", skillCode: "shooting",
    activityLabel: "Shot Type",
    activities: ["Power Shot", "Placed Shot", "Volley", "Header", "Penalty", "Chip"],
    hasFoot: true,
    mechanics: [
      {
        key: "plant_foot", label: "Plant Foot Position", weight: 0.25, color: "#2563eb",
        desc: "Where does the player place their non-kicking foot relative to the ball?",
        labels: ["Too close / too far — poor balance", "Slightly off, toes away from target", "Reasonable position, some control", "Good — beside ball, toes to target", "Perfect — precise placement every time"],
      },
      {
        key: "body_shape", label: "Body Shape Over Ball", weight: 0.30, color: "#1a5c2a",
        desc: "How well does the player lean over the ball for placed shots?",
        labels: ["Leaning far back — ball always balloons", "Slight backward lean", "Neutral — inconsistent height control", "Good body shape over ball", "Perfect — body over ball for accuracy"],
      },
      {
        key: "striking", label: "Striking Technique", weight: 0.30, color: "#c8962a",
        desc: "Contact point on the foot and ankle lock quality?",
        labels: ["Toe poke — no ankle lock at all", "Poor contact area, loose ankle", "Some ankle lock, inside foot contact", "Good laces contact with locked ankle", "Perfect — mid-laces, toes down, full lock"],
      },
      {
        key: "follow_through", label: "Follow Through", weight: 0.15, color: "#7c3aed",
        desc: "How complete is the swing arc after striking?",
        labels: ["Stopped swing — ball lacks power", "Limited follow through", "Partial arc, inconsistent", "Good swing arc toward target", "Full follow through — toe points to target"],
      },
    ],
    aiRole: "elite shooting coach", tipKey: "accuracy_tip",
  },

  sprint: {
    title: "Sprint Mechanics", skillCode: "sprint",
    activityLabel: "Sprint Distance",
    activities: ["30m", "40m", "60m", "100m"],
    mechanics: [
      {
        key: "arm_drive", label: "Arm Drive", weight: 0.25, color: "#2563eb",
        desc: "Power and direction of arm swing — elbows at 90°, driving forward not across",
        labels: ["Minimal arm swing, hunched shoulders", "Some movement, inconsistent", "Decent arm drive in straight lines", "Good arm pump, elbows at 90°", "Elite arm drive — drives forward lean and cadence"],
      },
      {
        key: "forward_lean", label: "Forward Lean", weight: 0.25, color: "#1a5c2a",
        desc: "Trunk angle into acceleration — player drives off the ground, not stands up",
        labels: ["Upright or backward lean — no drive", "Slight lean, breaks at waist", "Some forward lean in acceleration", "Good trunk angle maintained", "Perfect — full forward lean, efficient ground drive"],
      },
      {
        key: "knee_drive", label: "Knee Drive", weight: 0.25, color: "#c8962a",
        desc: "Knee lift height and drive — high knees create longer stride and more power",
        labels: ["Shuffling, very low knee lift", "Some knee drive, inconsistent", "Reasonable knee lift", "Good knee drive and hip extension", "Elite — high knee drive, full hip extension"],
      },
      {
        key: "stride_rhythm", label: "Stride Rhythm", weight: 0.25, color: "#7c3aed",
        desc: "Cadence consistency and left-right symmetry across the sprint",
        labels: ["Uneven, stuttering, asymmetric", "Some rhythm but highly inconsistent", "Reasonable cadence, some asymmetry", "Good rhythm, consistent cadence", "Perfect — metronomic, full symmetry"],
      },
    ],
    aiRole: "elite sprint mechanics coach", tipKey: "sprint_tip",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function scoreToBar(r: number) { return r * 20; }

function barColor(pct: number) {
  if (pct >= 80) return "#16a34a";
  if (pct >= 60) return "#d97706";
  if (pct >= 40) return "#ea580c";
  return "#dc2626";
}

function barLabel(pct: number) {
  if (pct >= 80) return "Excellent";
  if (pct >= 60) return "Good";
  if (pct >= 40) return "Needs work";
  return "Critical";
}

function playerName(p: SquadPlayer): string {
  if (p.name) return p.name;
  return [p.first_name, p.surname].filter(Boolean).join(" ") || p.id;
}

function computeScore(cfg: SkillCfg, ratings: Record<string, number>): number {
  return Math.round(cfg.mechanics.reduce((sum, m) => sum + scoreToBar(ratings[m.key] || 0) * m.weight, 0));
}

function extractJson(raw: string): AiFeedback | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as AiFeedback) : null;
  } catch { return null; }
}

function buildFallback(cfg: SkillCfg, activityType: string): AiFeedback {
  const fb: AiFeedback = {
    biggest_issue: "Focus on consistent mechanics before adding speed — quality first.",
    strengths: ["Coach assessment shows clear areas to develop", "Structured drill testing identifies the right focus"],
    drill_1: { name: "Slow Repetition", description: "Perform the skill at 50% speed, focusing only on correct mechanics. 3 sets of 10 reps." },
    drill_2: { name: "Mirrored Pairs", description: "Pair the player with a strong performer and have them mirror the technique. 5 minutes focused observation and imitation." },
    drill_3: { name: "Progressive Load", description: "Start with no opposition, add passive resistance, then full resistance. Reset mechanics at each stage." },
    [cfg.tipKey]: `For ${activityType}, focus on the weakest mechanic first — one thing at a time leads to lasting improvement.`,
  };
  cfg.mechanics.forEach(m => { fb[`${m.key}_feedback`] = "Work on this mechanic with isolated drills before integrating into full practice."; });
  return fb;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CoachSkillDrillPage() {
  const { skill } = useParams<{ skill: string }>();
  const token    = useAuthStore((s) => s.token);
  const cfg      = skill ? SKILL_CONFIG[skill] : null;

  const [phase,        setPhase]        = useState<"setup" | "assess" | "results">("setup");
  const [squad,        setSquad]        = useState<SquadPlayer[]>([]);
  const [squadLoading, setSquadLoading] = useState(true);
  const [selectedId,   setSelectedId]   = useState("");
  const [activityType, setActivityType] = useState(cfg?.activities[0] ?? "");
  const [foot,         setFoot]         = useState("Right");
  const [pressure,     setPressure]     = useState("Medium");
  const [ratings,      setRatings]      = useState<Record<string, number>>({});
  const [feedback,     setFeedback]     = useState<AiFeedback | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [saved,        setSaved]        = useState(false);
  const [openDrill,    setOpenDrill]    = useState<string | null>(null);
  const [history,      setHistory]      = useState<DrillHistoryEntry[]>([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [openHist,     setOpenHist]     = useState<string | null>(null);

  // Reset activity type when skill changes
  useEffect(() => {
    if (cfg) setActivityType(cfg.activities[0]);
  }, [cfg]);

  // Load squad
  useEffect(() => {
    if (!token) return;
    setSquadLoading(true);
    fetch(`${API_URL}/coach/squad`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(j => {
        const list = Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : [];
        setSquad(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setSquadLoading(false));
  }, [token]);

  // Load history when player changes
  useEffect(() => {
    if (!token || !selectedId || !cfg) return;
    setHistLoading(true);
    fetch(`${API_URL}/coach/skill-drills?player_id=${selectedId}&skill=${cfg.skillCode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j) {
          const list = j.data?.data ?? j.data ?? j;
          setHistory(Array.isArray(list) ? list : []);
        }
      })
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [token, selectedId, cfg]);

  if (!cfg) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "#6b7280" }}>Unknown skill. <Link href="/coach/skill-drills">Go back</Link></p>
        </div>
      </div>
    );
  }

  const selectedPlayer = squad.find(p => p.id === selectedId);
  const allRated       = cfg.mechanics.every(m => ratings[m.key]);
  const overallScore   = computeScore(cfg, ratings);

  // ── AI analysis ────────────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!selectedPlayer) return;
    setLoading(true); setError("");

    const name       = playerName(selectedPlayer);
    const mechLines  = cfg.mechanics.map(m => `- ${m.label}: ${ratings[m.key] || 0}/5 (${m.labels[(ratings[m.key] || 1) - 1]})`).join("\n");
    const fbKeys     = cfg.mechanics.map(m => `  "${m.key}_feedback": "<one coaching sentence>"`).join(",\n");
    const extraCtx   = [
      cfg.hasFoot     ? `Foot used: ${foot}` : "",
      cfg.hasPressure ? `Pressure level: ${pressure}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `You are an ${cfg.aiRole}. You have just observed and assessed a player's ${cfg.title.toLowerCase()} mechanics. Return ONLY valid JSON — no markdown.

Player: ${name}
Drill type: ${activityType}${extraCtx ? `\n${extraCtx}` : ""}

Coach-assessed mechanics (1=poor, 5=excellent):
${mechLines}

Return this exact JSON:
{
${fbKeys},
  "biggest_issue": "<single most important mechanic to fix>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, minimal equipment>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "${cfg.tipKey}": "<one coaching tip specific to ${activityType}>"
}`;

    let parsed: AiFeedback | null = null;
    try {
      const r    = await fetch("/api/gemini-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, system_prompt: `You are a professional ${cfg.title.toLowerCase()} coach. Return only valid JSON.` }),
      });
      const data = await r.json();
      parsed     = extractJson(data.response || "");
    } catch { /* silent */ }

    if (!parsed) parsed = buildFallback(cfg, activityType);
    setFeedback(parsed);

    const computed = computeScore(cfg, ratings);

    // Save to backend
    if (token && selectedId) {
      const mechanicsPayload: Record<string, number> = {};
      cfg.mechanics.forEach(m => { mechanicsPayload[m.key] = ratings[m.key] || 0; });

      fetch(`${API_URL}/coach/skill-drills`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id:     selectedId,
          skill:         cfg.skillCode,
          activity_type: activityType,
          mechanics:     mechanicsPayload,
          overall_score: computed,
          ai_feedback:   parsed,
          ...(cfg.hasFoot     ? { foot }     : {}),
          ...(cfg.hasPressure ? { pressure } : {}),
        }),
      })
        .then(r => { if (r.ok) setSaved(true); })
        .catch(() => {});
    }

    setPhase("results");
    setLoading(false);
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
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
          <Link href="/coach/skill-drills" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
            <ArrowLeft size={15} /> Skill Drills
          </Link>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>{cfg.title} Assessment</span>
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={24} color="#f0b429" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>{cfg.title} Assessment</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Coach-recorded skill drill test · Football</p>
            </div>
          </div>

          {/* Player selector */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClipboardList size={14} color="#1a5c2a" />
              </div>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111", flex: 1 }}>Select Player</h2>
              <Link
                href="/coach/registered-players"
                style={{ fontSize: 12, fontWeight: 600, color: "#1a5c2a", textDecoration: "none", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px" }}
              >
                + Add Player
              </Link>
            </div>

            {squadLoading ? (
              <p style={{ fontSize: 14, color: "#9ca3af" }}>Loading squad…</p>
            ) : squad.length === 0 ? (
              <div style={{ backgroundColor: "#fef2f2", borderRadius: 8, padding: "12px 16px", border: "1px solid #fecaca" }}>
                <p style={{ margin: 0, fontSize: 14, color: "#dc2626" }}>
                  No squad players found. <Link href="/coach/registered-players" style={{ color: "#dc2626", fontWeight: 600 }}>Register a player</Link> first.
                </p>
              </div>
            ) : (
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, backgroundColor: "white", outline: "none", boxSizing: "border-box" }}
              >
                {squad.map(p => (
                  <option key={p.id} value={p.id}>
                    {playerName(p)}{p.position ? ` — ${p.position}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Activity type */}
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>{cfg.activityLabel}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cfg.activities.map(t => (
                <button
                  key={t}
                  onClick={() => setActivityType(t)}
                  style={{
                    padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${activityType === t ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: activityType === t ? "#1a5c2a" : "white",
                    color: activityType === t ? "white" : "#374151",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Extra fields */}
            {cfg.hasFoot && (
              <div style={{ marginTop: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Foot Used</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Right", "Left"].map(f => (
                    <button
                      key={f}
                      onClick={() => setFoot(f)}
                      style={{
                        padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
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
            )}

            {cfg.hasPressure && (
              <div style={{ marginTop: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Pressure Level</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Low", "Medium", "High"].map(lv => (
                    <button
                      key={lv}
                      onClick={() => setPressure(lv)}
                      style={{
                        padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                        border: `2px solid ${pressure === lv ? "#1a5c2a" : "#e5e7eb"}`,
                        backgroundColor: pressure === lv ? "#1a5c2a" : "white",
                        color: pressure === lv ? "white" : "#374151",
                      }}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setPhase("assess")}
            disabled={!selectedId || squad.length === 0}
            style={{
              width: "100%", padding: 14, border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: selectedId && squad.length > 0 ? "pointer" : "not-allowed",
              backgroundColor: selectedId && squad.length > 0 ? "#1a5c2a" : "#d1d5db",
              color: "white",
            }}
          >
            Next: Rate Mechanics →
          </button>

          {/* History */}
          {selectedId && (
            <div style={{ marginTop: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <History size={16} color="#6b7280" />
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>
                  Past Sessions{selectedPlayer ? ` — ${playerName(selectedPlayer)}` : ""}
                </h2>
              </div>
              {histLoading && <p style={{ fontSize: 14, color: "#9ca3af" }}>Loading…</p>}
              {!histLoading && history.length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: "24px 16px" }}>
                  <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No sessions yet for this player &amp; skill.</p>
                </div>
              )}
              {!histLoading && history.map(entry => {
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
                        <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111" }}>{entry.activity_type}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{date}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: clr }}>{barLabel(entry.overall_score)}</span>
                        {isOpen ? <ChevronUp size={15} color="#9ca3af" /> : <ChevronDown size={15} color="#9ca3af" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                        {cfg.mechanics.map(m => {
                          const score = (entry.mechanics?.[m.key] ?? 0);
                          const pct   = scoreToBar(score);
                          return (
                            <div key={m.key} style={{ marginBottom: 10 }}>
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
                        {typeof entry.ai_feedback?.biggest_issue === "string" && (
                          <div style={{ marginTop: 10, backgroundColor: "#fefce8", borderRadius: 8, padding: "10px 12px", border: "1px solid #fde68a" }}>
                            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
                            <p style={{ margin: 0, fontSize: 13, color: "#111" }}>{entry.ai_feedback.biggest_issue as string}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Rate Mechanics</span>
          {selectedPlayer && <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{playerName(selectedPlayer)} · {activityType}</span>}
        </div>

        <div style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Rate each mechanic as you observe the player. 1 = needs major work, 5 = excellent.
          </p>

          {/* Live score preview */}
          {Object.keys(ratings).length > 0 && (
            <div style={{ backgroundColor: "white", borderRadius: 12, padding: "14px 20px", border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Current score</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: barColor(overallScore) }}>{overallScore}<span style={{ fontSize: 13, fontWeight: 400, color: "#9ca3af" }}>/100</span></span>
            </div>
          )}

          {cfg.mechanics.map(m => {
            const current = ratings[m.key] || 0;
            return (
              <div key={m.key} style={{ ...card, borderLeft: `4px solid ${current ? m.color : "#e5e7eb"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#111" }}>{m.label}</h3>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{Math.round(m.weight * 100)}% weight</span>
                </div>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6b7280" }}>{m.desc}</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setRatings(prev => ({ ...prev, [m.key]: n }))}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                        border: `2px solid ${current === n ? m.color : "#e5e7eb"}`,
                        backgroundColor: current === n ? m.color : "white",
                        color: current === n ? "white" : "#374151",
                        transition: "all 0.12s",
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
              width: "100%", padding: 14, border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
              cursor: allRated && !loading ? "pointer" : "not-allowed",
              backgroundColor: allRated && !loading ? "#1a5c2a" : "#d1d5db",
              color: "white",
            }}
          >
            {loading ? "Analysing…" : allRated ? "Get AI Analysis & Save →" : `Rate all ${cfg.mechanics.length} mechanics (${Object.keys(ratings).length}/${cfg.mechanics.length})`}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  const scoreColor      = barColor(overallScore);
  const scoreColorLight = scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <div style={nav}>
        <Link href="/coach/skill-drills" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Skill Drills
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>{cfg.title} Results</span>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px" }}>
        {/* Score hero */}
        <div style={{ ...card, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
          {selectedPlayer && (
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{playerName(selectedPlayer)}</p>
          )}
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
            Overall {cfg.title} Score
          </p>
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreColorLight, marginBottom: 8 }}>
            {overallScore}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
            {barLabel(overallScore)} mechanics
          </p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            Football · {activityType}
            {cfg.hasFoot ? ` · ${foot} Foot` : ""}
            {cfg.hasPressure ? ` · ${pressure} Pressure` : ""}
          </p>
        </div>

        {/* Radar updated banner */}
        {saved && (
          <div style={{ backgroundColor: "#f0fdf4", borderRadius: 12, padding: "14px 18px", border: "1px solid #bbf7d0", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <CheckCircle size={18} color="#16a34a" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#15803d" }}>Radar chart updated</p>
              <p style={{ margin: 0, fontSize: 12, color: "#4ade80" }}>
                {selectedPlayer && playerName(selectedPlayer)}&apos;s {cfg.title.toLowerCase()} score has been averaged across all drill sessions and the radar reflects this result.
              </p>
            </div>
          </div>
        )}

        {/* Mechanics breakdown */}
        <div style={card}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Mechanics Breakdown</h2>
          {cfg.mechanics.map(m => {
            const pct   = scoreToBar(ratings[m.key] || 0);
            const clr   = barColor(pct);
            const fbKey = `${m.key}_feedback`;
            const text  = typeof feedback?.[fbKey] === "string" ? (feedback[fbKey] as string) : undefined;
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
        {typeof feedback?.biggest_issue === "string" && (
          <div style={{ ...card, backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}><strong>{feedback.biggest_issue as string}</strong></p>
          </div>
        )}

        {/* Skill tip */}
        {typeof feedback?.[cfg.tipKey] === "string" && (
          <div style={{ ...card, backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>
              {activityType} Tip
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback[cfg.tipKey] as string}</p>
          </div>
        )}

        {/* Strengths */}
        {Array.isArray(feedback?.strengths) && (feedback.strengths as string[]).length > 0 && (
          <div style={{ ...card, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>What the player does well</p>
            {(feedback.strengths as string[]).map((s, i) => (
              <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#111", display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span> {s}
              </p>
            ))}
          </div>
        )}

        {/* Drills */}
        {feedback && (
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Assign This Player</h2>
            {([feedback.drill_1, feedback.drill_2, feedback.drill_3] as Array<{ name: string; description: string } | undefined>).map((drill, i) => {
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
                      <span style={{ marginRight: 8, color: "#1a5c2a", fontWeight: 700 }}>{i + 1}.</span>{drill.name}
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

        <button
          onClick={() => { setPhase("setup"); setRatings({}); setFeedback(null); setError(""); setOpenDrill(null); setSaved(false); }}
          style={{ width: "100%", padding: 14, backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <RotateCcw size={16} /> New Assessment
        </button>
      </div>
    </div>
  );
}
