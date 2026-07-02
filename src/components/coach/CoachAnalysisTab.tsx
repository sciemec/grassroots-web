"use client";
// src/components/coach/CoachAnalysisTab.tsx

import { useState, useRef, useCallback } from "react";
import {
  Upload, CheckCircle2, AlertCircle,
  ChevronRight, RotateCcw, Shield,
  Activity, Target, Wind, Trophy, Zap,
} from "lucide-react";

const GRS_GREEN = "#1a5c2a";
const GRS_GOLD  = "#c8962a";
const AI_URL    = process.env.NEXT_PUBLIC_AI_URL ?? "https://grassroots-ai-service.onrender.com";
const API_URL   = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolId = "fatigue" | "injury_risk" | "first_touch" | "sprint_mechanics" | "set_piece" | "match_readiness";
type Phase  = "select_tool" | "select_player" | "upload" | "analysing" | "results" | "error";

interface Player { id: string; name: string; position: string; }

interface Flag {
  flag?: string;
  name?: string;
  severity: string;
  detected: boolean;
  measurement: string;
  detail: string;
  fix?: string[];
  timeline?: string;
}

interface Metric {
  metric: string;
  value: string;
  percentile: number;
  rating: string;
  detail: string;
  fix?: string | null;
}

interface BreakdownDetail {
  metric: string;
  first_value: number;
  last_value: number;
  degradation: number;
  detail: string;
}

interface GeminiAnalysis {
  strengths?: string[];
  weaknesses?: string[];
  single_biggest_fix?: string;
  drill_recommendation?: string;
  coach_instruction?: string;
}

interface ComponentScore {
  score: number;
  rating: string;
  detail: string;
  weight: string;
}

interface ToolResult {
  // shared
  tool?: string;
  player_name?: string;
  age_group?: string;
  frames_analysed?: number;
  what_was_measured?: string;
  coach_action?: string;
  overall_rating?: string;
  overall_score?: number;
  rating?: string;
  // fatigue
  fatigue_index?: number;
  fatigue_rating?: string;
  fatigue_color?: string;
  substitution_recommendation?: string;
  recommended_match_minutes?: number;
  injury_risk?: boolean;
  injury_detail?: string | null;
  breakdown_details?: BreakdownDetail[];
  // injury risk
  risk_score?: number;
  risk_level?: string;
  risk_color?: string;
  play_decision?: string;
  flags?: Flag[];
  priority_fix?: string;
  // sprint
  metrics?: Metric[];
  // match readiness
  readiness_score?: number;
  readiness_label?: string;
  readiness_color?: string;
  recommended_minutes?: number;
  readiness_flags?: string[];
  components?: Record<string, ComponentScore>;
  // gemini tools
  analysis?: GeminiAnalysis;
  set_piece_type?: string;
}

// ─── Tool config ──────────────────────────────────────────────────────────────

const TOOLS: {
  id: ToolId;
  label: string;
  emoji: string;
  colour: string;
  icon: React.ReactNode;
  description: string;
  howToFilm: string[];
  whatAIMeasures: string[];
  expectedResult: string;
  endpoint: string;
  multiFile: boolean;
  hasSetType: boolean;
}[] = [
  {
    id: "fatigue", label: "Fatigue Tracker", emoji: "🔥", colour: "#dc2626",
    icon: <Activity size={18} />,
    description: "Compare technique in first vs last reps to measure fatigue index and substitution timing",
    howToFilm: [
      "Player does 10-15 reps of sprints, high knees, or any circuit",
      "Film sideways so full body is visible throughout",
      "Do NOT stop between reps — continuous movement only",
      "One continuous clip covering all repetitions",
    ],
    whatAIMeasures: ["Knee flexion degradation", "Trunk lean drop", "Arm drive deterioration", "Hip stability under fatigue"],
    expectedResult: "Fatigue index % + substitution recommendation (e.g. 'Substitute at 68 minutes')",
    endpoint: "/coach-analysis/fatigue",
    multiFile: false, hasSetType: false,
  },
  {
    id: "injury_risk", label: "Injury Risk Screener", emoji: "🛡️", colour: "#ea580c",
    icon: <Shield size={18} />,
    description: "Single-leg landing test detects ACL risk, hip drop, and landing stiffness",
    howToFilm: [
      "Player jumps off two feet and lands on ONE leg — 5 times each leg",
      "Film directly from the FRONT so knee alignment is clearly visible",
      "Full body from head to toe must be in frame",
      "Both legs in same clip — left 5 times then right 5 times",
    ],
    whatAIMeasures: ["Knee valgus (ACL risk)", "Hip drop (IT band risk)", "Landing stiffness", "Bilateral asymmetry"],
    expectedResult: "Traffic light 🟢🟡🔴 per risk factor + specific injury flags + exercises to fix",
    endpoint: "/coach-analysis/injury-risk",
    multiFile: false, hasSetType: false,
  },
  {
    id: "first_touch", label: "First Touch Analyser", emoji: "⚽", colour: GRS_GREEN,
    icon: <Target size={18} />,
    description: "Gemini scores each touch — foot surface, body shape, and ball control quality",
    howToFilm: [
      "Player receives 10 passes from different angles and distances",
      "Film from the SIDE so body shape and ball are both visible",
      "Include passes to both feet — mix left and right",
      "Vary heights — ground, waist, and chest passes",
    ],
    whatAIMeasures: ["Touch quality per rep (1-10)", "Foot surface used", "Body shape on receiving", "Dominant foot", "Ball control distance"],
    expectedResult: "Score per touch + average + dominant foot + specific weakness with drill to fix",
    endpoint: "/coach-analysis/first-touch",
    multiFile: false, hasSetType: false,
  },
  {
    id: "sprint_mechanics", label: "Sprint Mechanics", emoji: "💨", colour: "#2563eb",
    icon: <Wind size={18} />,
    description: "MediaPipe measures trunk lean, knee drive, arm drive, and stride symmetry",
    howToFilm: [
      "Player sprints PAST the camera 3 times at maximum effort",
      "Film from the SIDE at hip height for best landmark detection",
      "Camera stationary — do not follow the player",
      "All 3 sprints in one continuous clip",
    ],
    whatAIMeasures: ["Trunk lean angle", "Knee drive height", "Arm drive angle", "Left-right stride symmetry"],
    expectedResult: "Percentile score per mechanic + specific fix for each weakness found",
    endpoint: "/coach-analysis/sprint-mechanics",
    multiFile: false, hasSetType: false,
  },
  {
    id: "set_piece", label: "Set Piece Technique", emoji: "🎯", colour: "#7c3aed",
    icon: <Zap size={18} />,
    description: "Gemini analyses plant foot, hip rotation, ball contact point, and follow-through",
    howToFilm: [
      "Player takes 5-8 repetitions of the same set piece",
      "Film from the SIDE or slightly behind to see plant foot clearly",
      "Include the full run-up and follow-through in every rep",
      "Do NOT cut the clip before the ball has left foot or head",
    ],
    whatAIMeasures: ["Plant foot placement", "Hip rotation degree", "Contact point on ball", "Follow-through direction", "Ball flight"],
    expectedResult: "Score per rep + biggest technical weakness + drill to fix it",
    endpoint: "/coach-analysis/set-piece",
    multiFile: false, hasSetType: true,
  },
  {
    id: "match_readiness", label: "Match Readiness", emoji: "✅", colour: GRS_GOLD,
    icon: <Trophy size={18} />,
    description: "3 quick clips combined into one readiness % — ideal before matches or return from injury",
    howToFilm: [
      "CLIP 1 — Jump: 5 standing jumps, sideways view (30 seconds)",
      "CLIP 2 — Sprint: 3 sprints past camera, sideways view (20 seconds)",
      "CLIP 3 — Balance: single-leg 15 seconds each leg, front view (40 seconds)",
      "Upload all 3 clips separately below",
    ],
    whatAIMeasures: ["Jump power + landing safety (30%)", "Sprint mechanics (30%)", "Single-leg stability (40%)"],
    expectedResult: "Overall readiness % with 🟢🟡🔴 recommendation: Full 90 / Manage minutes / Do not play",
    endpoint: "/coach-analysis/match-readiness",
    multiFile: true, hasSetType: false,
  },
];

const SET_PIECE_TYPES = [
  { value: "shooting", label: "Shooting" },
  { value: "freekick", label: "Free Kick" },
  { value: "corner",   label: "Corner" },
  { value: "header",   label: "Heading" },
  { value: "penalty",  label: "Penalty" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, score))}%`, background: color, borderRadius: 4, transition: "width 0.8s" }} />
    </div>
  );
}

function riskColor(level: string): string {
  const map: Record<string, string> = {
    Critical: "#dc2626", High: "#ea580c", Moderate: GRS_GOLD,
    Low: "#3b82f6", Excellent: "#059669", None: "#059669",
  };
  return map[level] ?? "#6b7280";
}

// ─── Results ─────────────────────────────────────────────────────────────────

function ResultsView({ tool, result, playerName, onReset }: {
  tool: typeof TOOLS[0];
  result: ToolResult;
  playerName: string;
  onReset: () => void;
}) {
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  const heroScore =
    result.readiness_score ??
    (result.fatigue_index !== undefined ? result.fatigue_index : undefined) ??
    result.risk_score ??
    result.overall_score;

  const heroLabel =
    result.readiness_label ??
    result.fatigue_rating ??
    result.risk_level ??
    result.overall_rating ??
    result.rating;

  const heroCta = result.coach_action ?? result.play_decision ?? result.substitution_recommendation;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Hero */}
      <div style={{ background: tool.colour, borderRadius: 12, padding: "16px 20px", color: "#fff" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
          {tool.label} — {playerName}
        </div>
        {heroScore !== undefined && (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{Math.round(heroScore)}</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
              {result.readiness_score !== undefined ? "% readiness" :
               result.fatigue_index  !== undefined ? "% fatigue" :
               result.risk_score     !== undefined ? "/ 100 risk" : "/ 10"}
            </div>
          </div>
        )}
        {heroLabel && (
          <div style={{ display: "inline-block", marginTop: 8, padding: "4px 14px", borderRadius: 20, background: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 800 }}>
            {heroLabel}
          </div>
        )}
      </div>

      {/* Coach action */}
      {heroCta && (
        <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: GRS_GREEN, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Coach Action</div>
          <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.7 }}>{heroCta}</div>
          {result.recommended_match_minutes !== undefined && (
            <div style={{ fontSize: 12, fontWeight: 800, color: GRS_GOLD, marginTop: 6 }}>
              Recommended: {result.recommended_match_minutes} minutes
            </div>
          )}
        </div>
      )}

      {/* Match readiness components */}
      {result.components && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 12 }}>Component Scores</div>
          {Object.entries(result.components).map(([key, comp]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#333", textTransform: "capitalize" }}>
                  {key} <span style={{ fontSize: 10, color: "#aaa" }}>({comp.weight})</span>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: GRS_GREEN }}>{comp.score}/100 · {comp.rating}</span>
              </div>
              <ScoreBar score={comp.score} color={GRS_GREEN} />
              <div style={{ fontSize: 11, color: "#666", marginTop: 4, lineHeight: 1.5 }}>{comp.detail}</div>
            </div>
          ))}
        </div>
      )}

      {/* Readiness flags */}
      {result.readiness_flags && result.readiness_flags.length > 0 && (
        <div style={{ background: "#fef2f2", borderRadius: 12, padding: "12px 16px", border: "1px solid #fecaca" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", marginBottom: 8 }}>⚠️ Flags</div>
          {result.readiness_flags.map((f, i) => (
            <div key={i} style={{ fontSize: 12, color: "#991b1b", marginBottom: 4 }}>• {f}</div>
          ))}
        </div>
      )}

      {/* Sprint metrics */}
      {result.metrics && result.metrics.map(m => (
        <div key={m.metric} style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e5e5" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#111" }}>{m.metric}</span>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: GRS_GREEN + "15", color: GRS_GREEN }}>
              {m.rating} · {m.percentile}%ile
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Measured: {m.value}</div>
          <ScoreBar score={m.percentile} color={GRS_GREEN} />
          <div style={{ fontSize: 12, color: "#555", marginTop: 8, lineHeight: 1.6 }}>{m.detail}</div>
          {m.fix && (
            <div style={{ marginTop: 8, padding: "8px 12px", background: "#eaf3de", borderRadius: 8, fontSize: 11, color: "#3a6b2a", lineHeight: 1.5 }}>
              🔧 {m.fix}
            </div>
          )}
        </div>
      ))}

      {/* Injury / risk flags */}
      {result.flags && result.flags.map((flag) => {
        const flagName = flag.flag ?? flag.name ?? "Flag";
        return (
          <div key={flagName} style={{ borderRadius: 12, border: `1px solid ${riskColor(flag.severity)}30`, background: riskColor(flag.severity) + "08", overflow: "hidden" }}>
            <button
              onClick={() => setExpandedFlag(expandedFlag === flagName ? null : flagName)}
              style={{ width: "100%", background: "none", border: "none", padding: "12px 16px", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: flag.detected ? riskColor(flag.severity) : "#10b981", flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111", flex: 1 }}>{flagName}</span>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: flag.detected ? riskColor(flag.severity) : "#10b981", color: "#fff" }}>
                  {flag.detected ? flag.severity : "✓ Clear"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#777", marginTop: 4, marginLeft: 20 }}>{flag.measurement}</div>
            </button>
            {expandedFlag === flagName && (
              <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${riskColor(flag.severity)}20` }}>
                <div style={{ fontSize: 12, color: "#444", lineHeight: 1.7, marginTop: 10 }}>{flag.detail}</div>
                {flag.fix && flag.fix.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: GRS_GREEN, textTransform: "uppercase", marginBottom: 6 }}>Exercises to fix this</div>
                    {flag.fix.map((f, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={{ color: GRS_GREEN, fontWeight: 800, fontSize: 11 }}>→</span>
                        <span style={{ fontSize: 11, color: "#444" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                )}
                {flag.timeline && <div style={{ fontSize: 10, color: "#aaa", marginTop: 8, fontStyle: "italic" }}>⏱ {flag.timeline}</div>}
              </div>
            )}
          </div>
        );
      })}

      {/* Fatigue breakdown */}
      {result.breakdown_details && result.breakdown_details.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e5e5" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#111", marginBottom: 12 }}>Technique Breakdown</div>
          {result.breakdown_details.map(b => (
            <div key={b.metric} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{b.metric}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: b.degradation > 15 ? "#dc2626" : GRS_GOLD }}>
                  -{Math.round(b.degradation * 10) / 10}% degradation
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#aaa" }}>First reps: {b.first_value}° → Last reps: {b.last_value}°</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 4, lineHeight: 1.5 }}>{b.detail}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gemini analysis (first touch / set piece) */}
      {result.analysis && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 16, border: "1px solid #e5e5e5" }}>
          {result.analysis.strengths && result.analysis.strengths.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: GRS_GREEN, textTransform: "uppercase", marginBottom: 6 }}>Strengths</div>
              {result.analysis.strengths.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: GRS_GREEN, fontWeight: 800 }}>✓</span>
                  <span style={{ fontSize: 12, color: "#444" }}>{s}</span>
                </div>
              ))}
            </div>
          )}
          {result.analysis.weaknesses && result.analysis.weaknesses.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", marginBottom: 6 }}>Weaknesses</div>
              {result.analysis.weaknesses.map((w, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <span style={{ color: "#dc2626", fontWeight: 800 }}>→</span>
                  <span style={{ fontSize: 12, color: "#444" }}>{w}</span>
                </div>
              ))}
            </div>
          )}
          {result.analysis.single_biggest_fix && (
            <div style={{ padding: "10px 14px", background: "#eaf3de", borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: GRS_GREEN, marginBottom: 4 }}>Priority Fix</div>
              <div style={{ fontSize: 12, color: "#3a6b2a" }}>{result.analysis.single_biggest_fix}</div>
            </div>
          )}
          {result.analysis.drill_recommendation && (
            <div style={{ padding: "10px 14px", background: "#fffbeb", borderRadius: 10, marginTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>Drill Recommendation</div>
              <div style={{ fontSize: 12, color: "#78350f" }}>{result.analysis.drill_recommendation}</div>
            </div>
          )}
        </div>
      )}

      {/* What was measured */}
      {result.what_was_measured && (
        <div style={{ padding: "10px 14px", background: "#f5f5f5", borderRadius: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>What was measured</div>
          <div style={{ fontSize: 11, color: "#999", lineHeight: 1.6 }}>{result.what_was_measured}</div>
        </div>
      )}

      <button
        onClick={onReset}
        style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#fff", color: GRS_GREEN, fontWeight: 700, fontSize: 13, border: `2px solid ${GRS_GREEN}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        <RotateCcw size={14} /> Analyse Another Player
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CoachAnalysisTab({ token }: { token: string | null }) {
  const [phase,          setPhase]          = useState<Phase>("select_tool");
  const [selectedTool,   setSelectedTool]   = useState<typeof TOOLS[0] | null>(null);
  const [players,        setPlayers]        = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [setType,        setSetType]        = useState("shooting");
  const [progress,       setProgress]       = useState(0);
  const [statusMsg,      setStatusMsg]      = useState("");
  const [result,         setResult]         = useState<ToolResult | null>(null);
  const [error,          setError]          = useState("");
  const [jumpFile,       setJumpFile]       = useState<File | null>(null);
  const [sprintFile,     setSprintFile]     = useState<File | null>(null);
  const [balanceFile,    setBalanceFile]    = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const loadPlayers = useCallback(async () => {
    setLoadingPlayers(true);
    try {
      const res = await fetch(`${API_URL}/players`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json() as { data?: unknown[] } | unknown[];
        const list = Array.isArray(data) ? data : (data as { data?: unknown[] }).data ?? [];
        setPlayers((list as Record<string, string>[]).map(p => ({
          id:       String(p.id ?? ""),
          name:     String(p.name ?? p.full_name ?? `${p.first_name ?? ""} ${p.surname ?? ""}`.trim() || "Player"),
          position: String(p.position ?? p.position_primary ?? "—"),
        })));
      }
    } catch { /* silent */ }
    setLoadingPlayers(false);
  }, [token]);

  const handleToolSelect = (tool: typeof TOOLS[0]) => {
    setSelectedTool(tool);
    setPhase("select_player");
    loadPlayers();
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setPhase("upload");
    setJumpFile(null); setSprintFile(null); setBalanceFile(null);
  };

  const runAnalysis = useCallback(async (formData: FormData, endpoint: string) => {
    setPhase("analysing"); setProgress(0); setError("");
    const msgs = ["Uploading video…", "Detecting body landmarks…", "Measuring joint angles…", "Calculating scores…", "Building report…"];
    let mi = 0;
    setStatusMsg(msgs[0]);
    const ticker = setInterval(() => {
      setProgress(p => Math.min(92, p + 1.5));
      if (mi < msgs.length - 1) setStatusMsg(msgs[++mi]);
    }, 700);

    try {
      const res = await fetch(`${AI_URL}${endpoint}`, { method: "POST", body: formData });
      clearInterval(ticker);
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(err.detail ?? `Analysis failed (${res.status})`);
      }
      const data = await res.json() as ToolResult;
      setProgress(100); setResult(data); setPhase("results");

      if (token && selectedPlayer) {
        fetch(`${API_URL}/coach/player-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ player_id: selectedPlayer.id, tool: selectedTool?.id, result_json: JSON.stringify(data) }),
        }).catch(() => {});
      }
    } catch (err) {
      clearInterval(ticker);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }, [token, selectedPlayer, selectedTool]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTool || !selectedPlayer) return;
    e.target.value = "";
    const form = new FormData();
    form.append("file", file);
    form.append("player_name", selectedPlayer.name);
    form.append("age_group", "u17");
    if (selectedTool.hasSetType) form.append("set_piece_type", setType);
    runAnalysis(form, selectedTool.endpoint);
  }, [selectedTool, selectedPlayer, setType, runAnalysis]);

  const handleMatchReadiness = useCallback(() => {
    if (!jumpFile || !sprintFile || !balanceFile || !selectedPlayer) return;
    const form = new FormData();
    form.append("jump_file",    jumpFile);
    form.append("sprint_file",  sprintFile);
    form.append("balance_file", balanceFile);
    form.append("player_name",  selectedPlayer.name);
    form.append("age_group",    "u17");
    runAnalysis(form, "/coach-analysis/match-readiness");
  }, [jumpFile, sprintFile, balanceFile, selectedPlayer, runAnalysis]);

  const reset = () => {
    setPhase("select_tool"); setSelectedTool(null); setSelectedPlayer(null);
    setResult(null); setError(""); setProgress(0); setStatusMsg("");
    setJumpFile(null); setSprintFile(null); setBalanceFile(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>

      {/* Progress dots */}
      {phase !== "select_tool" && phase !== "results" && (
        <div style={{ display: "flex", gap: 4 }}>
          {(["select_tool","select_player","upload","analysing"] as Phase[]).map((p, i) => (
            <div key={p} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= (["select_tool","select_player","upload","analysing"] as Phase[]).indexOf(phase) ? GRS_GREEN : "#e5e7eb", transition: "background 0.3s" }} />
          ))}
        </div>
      )}

      {/* SELECT TOOL */}
      {phase === "select_tool" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 4 }}>AI Analysis Toolkit</div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            Select a tool, choose a player, upload a training video. AI does the rest — no manual input needed.
          </div>
          {TOOLS.map(tool => (
            <button key={tool.id} onClick={() => handleToolSelect(tool)}
              style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 14 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tool.colour; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e5e5e5"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: tool.colour + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {tool.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#111", marginBottom: 3 }}>{tool.label}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, marginBottom: 6 }}>{tool.description}</div>
                <div style={{ fontSize: 10, color: tool.colour, fontWeight: 700 }}>{tool.expectedResult}</div>
              </div>
              <ChevronRight size={16} color="#d1d5db" style={{ flexShrink: 0, marginTop: 4 }} />
            </button>
          ))}
        </div>
      )}

      {/* SELECT PLAYER */}
      {phase === "select_player" && selectedTool && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setPhase("select_tool")} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 20 }}>←</button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{selectedTool.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Select a player to analyse</div>
            </div>
          </div>
          {loadingPlayers ? (
            <div style={{ textAlign: "center", padding: 24, color: "#888" }}>Loading players…</div>
          ) : players.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#888" }}>No players found on the platform.</div>
          ) : players.map(p => (
            <button key={p.id} onClick={() => handlePlayerSelect(p)}
              style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: GRS_GREEN + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: GRS_GREEN, flexShrink: 0 }}>
                {p.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{p.position}</div>
              </div>
              <ChevronRight size={14} color="#d1d5db" />
            </button>
          ))}
        </div>
      )}

      {/* UPLOAD */}
      {phase === "upload" && selectedTool && selectedPlayer && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setPhase("select_player")} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 20 }}>←</button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{selectedTool.label}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Player: {selectedPlayer.name}</div>
            </div>
          </div>

          {/* How to film */}
          <div style={{ background: "#eaf3de", borderRadius: 12, padding: "14px 16px", border: "1px solid #c3dfa0" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: GRS_GREEN, marginBottom: 8 }}>📱 How to film</div>
            {selectedTool.howToFilm.map((tip, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: GRS_GREEN, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 11, color: "#3a6b2a", lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>

          {/* What AI measures */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedTool.whatAIMeasures.map(m => (
              <span key={m} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: selectedTool.colour + "12", color: selectedTool.colour, border: `1px solid ${selectedTool.colour}25`, fontWeight: 600 }}>
                {m}
              </span>
            ))}
          </div>

          {/* Set piece type */}
          {selectedTool.hasSetType && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 8 }}>Type of set piece</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SET_PIECE_TYPES.map(st => (
                  <button key={st.value} onClick={() => setSetType(st.value)}
                    style={{ padding: "8px 14px", borderRadius: 20, border: `2px solid ${setType === st.value ? GRS_GREEN : "#e5e7eb"}`, background: setType === st.value ? GRS_GREEN : "#fff", color: setType === st.value ? "#fff" : "#555", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Match readiness — 3 files */}
          {selectedTool.multiFile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { label: "Clip 1 — Jump Test (30s)",    file: jumpFile,    setter: setJumpFile },
                { label: "Clip 2 — Sprint Test (20s)",  file: sprintFile,  setter: setSprintFile },
                { label: "Clip 3 — Balance Test (40s)", file: balanceFile, setter: setBalanceFile },
              ] as const).map(clip => (
                <div key={clip.label}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>{clip.label}</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 10, border: `2px dashed ${clip.file ? GRS_GREEN : "#e5e7eb"}`, background: clip.file ? "#f0fdf4" : "#f9fafb", cursor: "pointer" }}>
                    <input type="file" accept="video/*" style={{ display: "none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) clip.setter(f); e.target.value = ""; }} />
                    {clip.file
                      ? <><CheckCircle2 size={16} color={GRS_GREEN} /><span style={{ fontSize: 12, color: GRS_GREEN, fontWeight: 700 }}>{clip.file.name}</span></>
                      : <><Upload size={16} color="#9ca3af" /><span style={{ fontSize: 12, color: "#9ca3af" }}>Tap to upload {clip.label}</span></>
                    }
                  </label>
                </div>
              ))}
              <button onClick={handleMatchReadiness}
                disabled={!jumpFile || !sprintFile || !balanceFile}
                style={{ width: "100%", padding: "16px", borderRadius: 12, background: (jumpFile && sprintFile && balanceFile) ? GRS_GREEN : "#9ca3af", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: (jumpFile && sprintFile && balanceFile) ? "pointer" : "not-allowed" }}>
                {(jumpFile && sprintFile && balanceFile) ? "Analyse Match Readiness →" : "Upload all 3 clips to continue"}
              </button>
            </div>
          ) : (
            <>
              <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleFileChange} />
              <button onClick={() => fileRef.current?.click()}
                style={{ width: "100%", padding: "18px", borderRadius: 14, background: selectedTool.colour, color: "#fff", fontWeight: 800, fontSize: 15, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <Upload size={18} /> Upload Video for Analysis
              </button>
            </>
          )}
        </div>
      )}

      {/* ANALYSING */}
      {phase === "analysing" && selectedTool && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e5e5e5", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, margin: "0 auto 16px", position: "relative" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `4px solid ${selectedTool.colour}20`, borderTopColor: selectedTool.colour, animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{selectedTool.emoji}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#111", marginBottom: 6 }}>Analysing {selectedPlayer?.name}</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>{statusMsg}</div>
          <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${progress}%`, background: selectedTool.colour, borderRadius: 4, transition: "width 0.5s" }} />
          </div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{progress}% · Takes 30–90 seconds</div>
        </div>
      )}

      {/* ERROR */}
      {phase === "error" && (
        <div style={{ background: "#fef2f2", borderRadius: 16, padding: 24, border: "1px solid #fecaca" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#dc2626", marginBottom: 4 }}>Analysis failed</div>
              <div style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6 }}>{error}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPhase("upload")} style={{ flex: 1, padding: "10px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Try Again</button>
            <button onClick={reset} style={{ flex: 1, padding: "10px", background: "#fff", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Start Over</button>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === "results" && selectedTool && result && (
        <ResultsView tool={selectedTool} result={result} playerName={selectedPlayer?.name ?? "Player"} onReset={reset} />
      )}
    </div>
  );
}