"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Brain, Loader2, Flag, Target, Sparkles,
  Upload, X, Film, CheckCircle2, AlertCircle, ChevronRight,
  Shield, Flame, RefreshCw, Video, ChevronDown, ChevronUp, RotateCcw,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const GRS_GREEN = "#1a5c2a";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ActiveTab = "analyse" | "lab";

// ═════════════════════════════════════════════════════════════════════════════
// ANALYSE TAB — types & constants
// ═════════════════════════════════════════════════════════════════════════════

type SetPieceType = "corner" | "free-kick" | "penalty" | "throw-in";
type TeamContext  = "attacking" | "defending";

interface AnalysisResult {
  type:      SetPieceType;
  context:   TeamContext;
  analysis:  string;
  hadVideo:  boolean;
  timestamp: string;
}

const ANALYSE_TYPES: {
  id: SetPieceType; label: string; icon: React.ElementType;
  desc: string; iconBg: string; iconColor: string;
}[] = [
  { id: "corner",    label: "Corner Kick", icon: Flag,      desc: "Delivery & box movement",     iconBg: "#dcfce7", iconColor: "#16a34a" },
  { id: "free-kick", label: "Free Kick",   icon: Target,    desc: "Direct, indirect & walls",    iconBg: "#dbeafe", iconColor: "#2563eb" },
  { id: "penalty",   label: "Penalty",     icon: Flame,     desc: "Spot-kick & keeper tactics",  iconBg: "#fee2e2", iconColor: "#dc2626" },
  { id: "throw-in",  label: "Throw-in",    icon: RefreshCw, desc: "Long & short throw patterns", iconBg: "#fef3c7", iconColor: "#d97706" },
];

const AI_PROMPTS: Record<SetPieceType, Record<TeamContext, string>> = {
  corner: {
    attacking: `Analyse this attacking corner kick and provide tactical coaching feedback. Cover:
1. DELIVERY RECOMMENDATIONS — near post, far post, or penalty spot: which is most effective and why
2. MOVEMENT PATTERNS — runs to make, blocking and screening tactics
3. FIRST BALL THREATS — who attacks the ball and from where
4. SECOND BALL PLAN — midfielder positioning for knockdowns and rebounds
5. DRILL TO PRACTICE — one specific training exercise
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Analyse this defending corner kick and provide tactical coaching feedback. Cover:
1. MARKING SETUP — zonal vs man-marking recommendations
2. NEAR POST PROTECTION — who covers it and how
3. AERIAL THREATS — how to win the first ball
4. CLEARANCE DIRECTION — where to clear and why
5. TRANSITION TRIGGER — how to launch the counter-attack from a clearance
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
  "free-kick": {
    attacking: `Analyse this attacking free kick and provide tactical coaching feedback. Cover:
1. SHOT SELECTION — direct shot vs played in: when to choose each
2. WALL DECOY RUNS — how to use runners to disrupt the wall
3. DELIVERY CURVE — inswinger vs outswinger: which and why
4. SECOND PHASE PLAN — positioning for rebounds and deflections
5. TRAINING DRILL — one exercise to rehearse this routine
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Analyse this defending free kick and provide tactical coaching feedback. Cover:
1. WALL SETUP — how many in the wall, who, and exact positioning
2. KEEPER POSITIONING — where the keeper should stand and why
3. RUNNERS TO TRACK — how to pick up runners from the free kick
4. PRESSING TRIGGER — when to press after the kick
5. RECOVERY SHAPE — how to reset defensive shape quickly
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
  penalty: {
    attacking: `Provide penalty kick coaching guidance covering:
1. SPOT-KICK TECHNIQUE — approach angle, placement vs power, body shape
2. MENTAL PREPARATION — pre-kick routine and staying composed under pressure
3. READING THE KEEPER — when and how to change your mind
4. TARGET SELECTION — top corners vs low: pros and cons
5. PRACTICE ROUTINE — how to train penalties under pressure
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Provide penalty kick defensive coaching guidance covering:
1. KEEPER TACTICS — which way to dive, how to read the taker's body shape
2. PRE-KICK POSITIONING — legal ways to gain an edge
3. REBOUND POSITIONING — where outfield players should stand
4. POST-SAVE MOMENTUM — how to capitalise on a saved penalty
5. TRAINING DRILL — how to practice penalty saves effectively
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
  "throw-in": {
    attacking: `Analyse this attacking throw-in and provide tactical coaching feedback. Cover:
1. SHORT VS LONG THROW — when to use each option
2. MOVEMENT TO RECEIVE — runs to create space for the receiver
3. FLICK-ON PATTERNS — using a target man to redirect play
4. THIRD MAN RUNS — creating overloads with indirect movement
5. TRAINING DRILL — one exercise to rehearse throw-in routines
Be specific and practical for a grassroots team in Zimbabwe.`,
    defending: `Analyse this defending throw-in and provide tactical coaching feedback. Cover:
1. PRESSURE ON THROWER — how close to stand legally
2. MARKING SHAPE — how to prevent easy receipt
3. LONG THROW DANGER — positioning against a player with a long throw
4. WINNING THE SECOND BALL — midfield positioning after the throw-in
5. TRANSITION — how to press and win possession from a throw-in
Be specific and practical for a grassroots team in Zimbabwe.`,
  },
};

async function extractFrames(file: File, count = 6): Promise<string[]> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url   = URL.createObjectURL(file);
    video.src       = url;
    video.muted     = true;
    video.playsInline = true;

    const frames: string[] = [];
    const canvas = document.createElement("canvas");
    canvas.width  = 480;
    canvas.height = 270;
    const ctx = canvas.getContext("2d");
    if (!ctx) { URL.revokeObjectURL(url); resolve([]); return; }

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration <= 0) { URL.revokeObjectURL(url); resolve([]); return; }
      const step       = duration / (count + 1);
      const timestamps = Array.from({ length: count }, (_, i) => step * (i + 1));
      let idx = 0;

      const seekNext = () => {
        if (idx >= timestamps.length) { URL.revokeObjectURL(url); resolve(frames); return; }
        video.currentTime = timestamps[idx];
      };

      video.addEventListener("seeked", () => {
        try {
          ctx.drawImage(video, 0, 0, 480, 270);
          const data = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
          if (data) frames.push(data);
        } catch { /* skip unreadable frames */ }
        idx++;
        seekNext();
      });

      seekNext();
    });

    video.addEventListener("error", () => { URL.revokeObjectURL(url); resolve([]); });
    video.load();
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// LAB TAB — types & constants
// ═════════════════════════════════════════════════════════════════════════════

interface MechanicRating {
  key:    string;
  label:  string;
  desc:   string;
  color:  string;
  weight: number;
  labels: string[];
}

interface AiFeedback {
  overall_score:           number;
  m1_feedback:             string;
  m2_feedback:             string;
  m3_feedback:             string;
  m4_feedback:             string;
  biggest_weakness:        string;
  tactical_recommendation: string;
  strengths:               string[];
  routine_1: { name: string; description: string };
  routine_2: { name: string; description: string };
  routine_3: { name: string; description: string };
  opponent_counter:        string;
}

const LAB_SPORT_TYPES: Record<string, string[]> = {
  Football:   ["Corner", "Free Kick", "Penalty", "Throw-in", "Goal Kick"],
  Rugby:      ["Line-out", "Scrum", "Penalty", "Restart", "Drop-out"],
  Netball:    ["Centre Pass", "Penalty Pass", "Throw-in"],
  Basketball: ["Jump Ball", "Free Throw", "Inbound Pass"],
  Cricket:    ["New Ball", "Powerplay", "Death Overs"],
  Athletics:  ["Sprint Start", "Relay Handoff"],
  Swimming:   ["Race Start", "Relay Takeover"],
  Tennis:     ["First Serve", "Second Serve", "Return"],
  Volleyball: ["Serve", "First Ball Reception"],
  Hockey:     ["Short Corner", "Free Hit", "Penalty Corner"],
};

const LAB_SPORTS = Object.keys(LAB_SPORT_TYPES);

const ATTACKING_MECHANICS: MechanicRating[] = [
  { key: "delivery",    label: "Delivery Quality",       weight: 0.30, desc: "How accurately and consistently is the ball delivered to the target zone?", color: "#2563eb",
    labels: ["Wildly inaccurate — ball rarely reaches any runner", "Inconsistent — good delivery 1 in 3 times", "Average — reaches the zone but pace and flight vary", "Good — consistent delivery with correct pace", "Excellent — precise delivery, correct curve and pace every time"] },
  { key: "timing",      label: "Runner Timing & Movement", weight: 0.30, desc: "How well do your runners time their runs relative to the delivery?", color: "#1a5c2a",
    labels: ["Runners move too early or too late — always offside or stationary", "Timing poor, runs rarely coordinated with delivery", "Some coordination, timing inconsistent", "Good movement — runners arrive with the ball most of the time", "Excellent — perfectly timed, layered runs with decoy movement"] },
  { key: "blocking",    label: "Blocking & Screening",     weight: 0.20, desc: "How effectively do your players block, screen, and create space for attackers?", color: "#c8962a",
    labels: ["No deliberate blocking — defenders unimpeded", "Occasional block but not coordinated with runs", "Some screening but blocks hold too long or too short", "Good blocks that free the primary runner", "Excellent — blocks draw defenders then release at the right moment"] },
  { key: "second_ball", label: "First & Second Ball",      weight: 0.20, desc: "How well does your team contest and win the ball after the initial delivery?", color: "#7c3aed",
    labels: ["No second ball preparation — completely unprepared for rebounds", "One player positioned, others unprepared", "Some second ball presence but not systematic", "Good — 2-3 players prepared for rebounds and clearances", "Excellent — whole team structured to win first and second balls"] },
];

const DEFENDING_MECHANICS: MechanicRating[] = [
  { key: "organization", label: "Organizational Shape", weight: 0.30, desc: "How quickly and correctly does your team get into defensive shape?", color: "#2563eb",
    labels: ["Disorganized — players slow to get into position", "Shape forms but too slowly and leaves gaps", "Reasonable organization most of the time", "Good — defensive shape set quickly with clear communication", "Excellent — instant, disciplined shape every time"] },
  { key: "aerial",       label: "Aerial Dominance",     weight: 0.30, desc: "How well does your team win headers and aerial challenges?", color: "#1a5c2a",
    labels: ["Consistently beaten in the air — poor jump timing", "Win some aerial battles but often out-muscled", "Competitive in the air, inconsistent timing", "Good aerial ability — win more than you lose", "Dominant — command the air, win first ball consistently"] },
  { key: "clearance",    label: "Clearance Quality",    weight: 0.25, desc: "When you win the ball, do you clear it to safety or into danger?", color: "#c8962a",
    labels: ["Clearances go straight to opposition — gifting second ball", "Clearances are short or sideways, no distance", "Clearances get some distance but direction inconsistent", "Good — clearances find space or a teammate most of the time", "Excellent — decisive clearances to wide areas or target player"] },
  { key: "transition",   label: "Transition Out",       weight: 0.15, desc: "After winning the ball, how ready is your team to counter-attack?", color: "#7c3aed",
    labels: ["Ball won then immediately given back — no transition plan", "Occasionally holds ball but no forward threat", "Some counter potential but not systematic", "Good — one player always ready to receive and run at goal", "Excellent — instant counter-attack with clear runners and outlet"] },
];

function computeScore(mechanics: MechanicRating[], ratings: Record<string, number>): number {
  return Math.round(mechanics.reduce((sum, m) => sum + (ratings[m.key] || 0) * 20 * m.weight, 0));
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

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════

export default function SetPiecesPage() {
  const router       = useRouter();
  const user         = useAuthStore((s) => s.user);
  const token        = useAuthStore((s) => s.token);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [tab, setTab] = useState<ActiveTab>("analyse");

  // ── ANALYSE TAB state ──────────────────────────────────────────────────────
  const [selectedType, setSelectedType] = useState<SetPieceType | null>(null);
  const [teamContext,  setTeamContext]   = useState<TeamContext>("attacking");
  const [notes,        setNotes]         = useState("");
  const [videoFile,    setVideoFile]     = useState<File | null>(null);
  const [isDragging,   setIsDragging]    = useState(false);
  const [extracting,   setExtracting]    = useState(false);
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [analyseResult,  setAnalyseResult]  = useState<AnalysisResult | null>(null);
  const [analyseError,   setAnalyseError]   = useState("");
  const [history,        setHistory]        = useState<AnalysisResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── LAB TAB state ──────────────────────────────────────────────────────────
  const [labPhase,      setLabPhase]      = useState<"setup" | "assess" | "results">("setup");
  const [labSport,      setLabSport]      = useState("Football");
  const [labSetPiece,   setLabSetPiece]   = useState("Corner");
  const [labSituation,  setLabSituation]  = useState<"attacking" | "defending">("attacking");
  const [labTeamName,   setLabTeamName]   = useState("");
  const [labOppTendency,setLabOppTendency]= useState("");
  const [labRatings,    setLabRatings]    = useState<Record<string, number>>({});
  const [labFeedback,   setLabFeedback]   = useState<AiFeedback | null>(null);
  const [labLoading,    setLabLoading]    = useState(false);
  const [labError,      setLabError]      = useState("");
  const [openRoutine,   setOpenRoutine]   = useState<string | null>(null);

  // auth guard
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return;
    if (user.role !== "coach" && user.role !== "admin") router.push("/dashboard");
  }, [_hasHydrated, user, router]);

  // ── drag handlers (analyse tab) ───────────────────────────────────────────
  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) setVideoFile(file);
  }, []);
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  // ── Analyse tab: run analysis ─────────────────────────────────────────────
  async function runAnalyse() {
    if (!selectedType) return;
    setAnalyseLoading(true); setAnalyseError(""); setAnalyseResult(null);
    try {
      let frames: string[] = [];
      if (videoFile) { setExtracting(true); frames = await extractFrames(videoFile, 6); setExtracting(false); }
      const prompt = AI_PROMPTS[selectedType][teamContext];
      const res = await fetch("/api/analyse-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, type: selectedType, context: teamContext, notes: notes.trim(), prompt }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || "Analysis failed. Try again.");
      }
      const data = await res.json() as { analysis?: string };
      const newResult: AnalysisResult = {
        type: selectedType, context: teamContext,
        analysis: data.analysis || "No feedback returned.",
        hadVideo: frames.length > 0, timestamp: new Date().toLocaleTimeString(),
      };
      setAnalyseResult(newResult);
      setHistory((h) => [newResult, ...h.slice(0, 3)]);
    } catch (err: unknown) {
      setExtracting(false);
      setAnalyseError(err instanceof Error ? err.message : "Analysis failed. Check your connection and try again.");
    } finally { setAnalyseLoading(false); setExtracting(false); }
  }

  // ── Lab tab: helpers ──────────────────────────────────────────────────────
  const labMechanics   = labSituation === "attacking" ? ATTACKING_MECHANICS : DEFENDING_MECHANICS;
  const labAllRated    = labMechanics.every((m) => labRatings[m.key]);
  const labOverallScore = labFeedback?.overall_score ?? computeScore(labMechanics, labRatings);
  const labSetPieceOptions = LAB_SPORT_TYPES[labSport] ?? LAB_SPORT_TYPES.Football;

  const handleLabSportChange = (s: string) => {
    setLabSport(s);
    const opts = LAB_SPORT_TYPES[s] ?? LAB_SPORT_TYPES.Football;
    if (!opts.includes(labSetPiece)) setLabSetPiece(opts[0]);
    setLabRatings({}); setLabFeedback(null);
  };
  const handleLabSituationChange = (s: "attacking" | "defending") => {
    setLabSituation(s); setLabRatings({}); setLabFeedback(null);
  };

  async function runLabAnalysis() {
    setLabLoading(true); setLabError("");
    const mechanicLines = labMechanics.map((m) =>
      `- ${m.label}: ${labRatings[m.key]}/5 (${m.labels[(labRatings[m.key] || 1) - 1]})`
    ).join("\n");

    const prompt = `You are a professional set piece coach. Analyse this team's ${labSituation} ${labSetPiece} and return ONLY valid JSON — no markdown, no explanation outside the JSON.

Sport: ${labSport}
Set piece: ${labSetPiece}
Situation: ${labSituation}${labTeamName ? `\nTeam: ${labTeamName}` : ""}${labOppTendency ? `\nOpponent tendency: ${labOppTendency}` : ""}

Self-assessed team mechanics (1=poor, 5=excellent):
${mechanicLines}

Return this exact JSON structure:
{
  "overall_score": <0-100 integer>,
  "m1_feedback": "<one specific tactical sentence for ${labMechanics[0].label}>",
  "m2_feedback": "<one specific tactical sentence for ${labMechanics[1].label}>",
  "m3_feedback": "<one specific tactical sentence for ${labMechanics[2].label}>",
  "m4_feedback": "<one specific tactical sentence for ${labMechanics[3].label}>",
  "biggest_weakness": "<the single most important area to fix first>",
  "tactical_recommendation": "<2 sentences: the key tactical change to make immediately>",
  "strengths": ["<tactical strength 1>", "<tactical strength 2>"],
  "routine_1": { "name": "<routine or drill name>", "description": "<2-sentence practical description for a coach to implement in training>" },
  "routine_2": { "name": "<routine or drill name>", "description": "<2-sentence practical description>" },
  "routine_3": { "name": "<routine or drill name>", "description": "<2-sentence practical description>" },
  "opponent_counter": "${labOppTendency ? `<specific tactic to exploit the opponent tendency: ${labOppTendency}>` : "N/A"}"
}`;

    try {
      const r    = await fetch("/api/ai-coach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: prompt, system_prompt: "You are a professional set piece coach with UEFA A-licence experience. Always return only valid JSON." }) });
      const data = await r.json();
      const raw  = data.response || data.answer || "";
      const parsed = extractJson(raw);

      if (parsed) {
        setLabFeedback(parsed);
      } else {
        const worstM = labMechanics.reduce((a, b) => (labRatings[a.key] || 5) < (labRatings[b.key] || 5) ? a : b);
        setLabFeedback(labSituation === "attacking" ? {
          overall_score: labOverallScore,
          m1_feedback:   "Delivery consistency is the foundation — work on repeating the same run-up and contact point every time.",
          m2_feedback:   "Runners must move on a trigger signal (the kicker's plant foot), not the kick itself.",
          m3_feedback:   "Blockers should make contact then pivot — not hold static blocks that referees can penalise.",
          m4_feedback:   "Assign specific second ball roles in training so every player knows their position after the first delivery.",
          biggest_weakness: worstM.label,
          tactical_recommendation: `Focus on improving ${worstM.label.toLowerCase()} first — it has the highest impact on your ${labSetPiece} conversion rate. Run a dedicated 15-minute set piece block at the end of every training session.`,
          strengths: ["You are actively analysing your set pieces — most teams at this level don't", "Deliberate set piece practice can add 2-3 goals per season"],
          routine_1: { name: "Delivery Repetition Block", description: "Kick 20 consecutive deliveries to a marked target zone with no defenders. Track how many land in the zone and aim for 80%+ before adding runners." },
          routine_2: { name: "Trigger Start Drill", description: "Runners stand stationary. Coach signals when the kicker plants their foot — runners must move only on this trigger. Run 10 reps with correct triggers only." },
          routine_3: { name: "Second Ball Game", description: "Deliver corners to 3 attackers vs 3 defenders in a 15×10m box. Award points only for winning the second ball cleanly. First to 5 wins." },
          opponent_counter: labOppTendency ? `If the opposition ${labOppTendency.toLowerCase()}, adjust your delivery target zone to exploit the gap this creates.` : "N/A",
        } : {
          overall_score: labOverallScore,
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
          opponent_counter: labOppTendency ? `Against a team that ${labOppTendency.toLowerCase()}, overload the side they favour and clear aggressively to that side's wide areas.` : "N/A",
        });
      }
    } catch {
      setLabError("AI analysis unavailable. Showing score breakdown only.");
    }

    // save to backend (non-blocking)
    if (token) {
      const ratingPayload: Record<string, number> = {};
      labMechanics.forEach((m) => { ratingPayload[`${m.key}_score`] = labRatings[m.key]; });
      fetch(`${API_URL}/coach/set-piece-lab`, {
        method: "POST",
        headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sport: labSport, set_piece_type: labSetPiece, situation: labSituation, team_name: labTeamName || null, opponent_tendency: labOppTendency || null, overall_score: labOverallScore, ai_feedback: labFeedback, ...ratingPayload }),
      }).catch(() => {});
    }

    setLabPhase("results");
    setLabLoading(false);
  }

  if (!_hasHydrated || !user) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // Shared lab card style
  const labCard: React.CSSProperties = { backgroundColor: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 };
  const canAnalyse = selectedType !== null && !analyseLoading;
  const labScoreColor = labOverallScore >= 80 ? "#16a34a" : labOverallScore >= 60 ? "#d97706" : labOverallScore >= 40 ? "#ea580c" : "#dc2626";
  const labScoreLabel = labOverallScore >= 80 ? "Strong" : labOverallScore >= 60 ? "Developing" : labOverallScore >= 40 ? "Needs work" : "Critical gap";
  const feedbackKeys: Array<keyof AiFeedback> = ["m1_feedback", "m2_feedback", "m3_feedback", "m4_feedback"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* ── Header ── */}
      <header style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <Link href="/coach" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, backgroundColor: "#f3f4f6", color: "#6b7280", textDecoration: "none" }}>
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111" }}>Set Pieces</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>AI video analysis & multi-sport scoring lab</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tab switcher ── */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px", display: "flex", gap: 0 }}>
          {(["analyse", "lab"] as ActiveTab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "12px 20px", fontSize: 13, fontWeight: 700, border: "none",
                  borderBottom: active ? `2px solid ${GRS_GREEN}` : "2px solid transparent",
                  backgroundColor: "transparent", cursor: "pointer",
                  color: active ? GRS_GREEN : "#6b7280",
                }}
              >
                {t === "analyse" ? "Analyse Clip" : "Scoring Lab"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ANALYSE TAB                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "analyse" && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 56px" }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* LEFT: Config + Upload */}
            <div className="lg:col-span-3 space-y-4">

              {/* 1. Set piece type */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">1 · Select Set Piece Type</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ANALYSE_TYPES.map((sp) => {
                    const Icon = sp.icon;
                    const active = selectedType === sp.id;
                    return (
                      <button key={sp.id} onClick={() => setSelectedType(sp.id)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center"
                        style={{ borderColor: active ? GRS_GREEN : "#e5e5e5", backgroundColor: active ? "#f0fdf4" : "#fff", boxShadow: active ? `0 0 0 2px ${GRS_GREEN}` : "none" }}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: active ? sp.iconBg : "#f3f4f6" }}>
                          <Icon size={16} style={{ color: active ? sp.iconColor : "#9ca3af" }} />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-gray-800 leading-tight">{sp.label}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sp.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Team context */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">2 · Your Team Context</p>
                <div className="flex gap-3">
                  {(["attacking", "defending"] as TeamContext[]).map((ctx) => (
                    <button key={ctx} onClick={() => setTeamContext(ctx)}
                      className="flex-1 py-3 rounded-xl border font-bold text-sm transition-all"
                      style={{ borderColor: teamContext === ctx ? GRS_GREEN : "#e5e5e5", backgroundColor: teamContext === ctx ? GRS_GREEN : "#f9fafb", color: teamContext === ctx ? "#fff" : "#6b7280" }}
                    >
                      {ctx === "attacking" ? "⚡ Attacking" : "🛡 Defending"}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Video upload */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                  3 · Upload Set Piece Clip
                  <span className="ml-2 font-medium text-gray-300 normal-case tracking-normal">— Gemini analyses every frame</span>
                </p>
                {!videoFile ? (
                  <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-xl border-2 border-dashed transition-colors p-8 text-center"
                    style={{ borderColor: isDragging ? GRS_GREEN : "#d1d5db", backgroundColor: isDragging ? "#f0fdf4" : "#fafafa" }}
                  >
                    <Upload size={28} className="mx-auto mb-3" style={{ color: isDragging ? GRS_GREEN : "#9ca3af" }} />
                    <p className="text-sm font-semibold text-gray-600">Drag & drop a clip, or <span style={{ color: GRS_GREEN }} className="font-bold">browse</span></p>
                    <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI — max 500MB</p>
                    <p className="text-[10px] text-gray-300 mt-3">6 frames extracted · sent to Gemini Vision for analysis</p>
                    <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border p-4" style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#dcfce7" }}>
                        <Film size={18} style={{ color: GRS_GREEN }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{videoFile.name}</p>
                        <p className="text-xs text-gray-500">{(videoFile.size / 1024 / 1024).toFixed(1)} MB · <span style={{ color: GRS_GREEN }} className="font-semibold">6 frames will be extracted</span></p>
                      </div>
                      <button onClick={() => setVideoFile(null)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50">
                        <X size={14} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5"><Video size={10} />Gemini Vision will analyse player positions, delivery quality, and movement patterns</p>
                  </div>
                )}
              </div>

              {/* 4. Notes */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">4 · Coach Notes (Optional)</p>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Describe what to focus on — e.g. "Our near post delivery keeps getting cleared" or "The wall breaks too early on free kicks"`}
                  rows={3} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:border-[#1a5c2a] transition-colors"
                  style={{ backgroundColor: "#fafafa" }} />
              </div>

              <button onClick={runAnalyse} disabled={!canAnalyse}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
                style={{ backgroundColor: canAnalyse ? GRS_GREEN : "#d1d5db", color: canAnalyse ? "#fff" : "#9ca3af", cursor: canAnalyse ? "pointer" : "not-allowed" }}
              >
                {extracting ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Extracting video frames...</span>
                  : analyseLoading ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" />Gemini is analysing{videoFile ? " your clip" : ""}...</span>
                  : <span className="flex items-center justify-center gap-2"><Brain size={16} />{selectedType ? `Analyse ${ANALYSE_TYPES.find((s) => s.id === selectedType)?.label}${videoFile ? " (with video)" : ""}` : "Select a set piece type first"}</span>}
              </button>
              {!selectedType && <p className="text-center text-xs text-gray-400">Select a set piece type above to enable analysis</p>}
            </div>

            {/* RIGHT: Results + History */}
            <div className="lg:col-span-2 space-y-4">
              {(analyseLoading || extracting) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                  <Loader2 size={28} className="mx-auto mb-3 animate-spin" style={{ color: GRS_GREEN }} />
                  <p className="text-sm font-bold text-gray-600">{extracting ? "Extracting frames from clip..." : "Gemini is analysing your set piece..."}</p>
                  <p className="text-xs text-gray-400 mt-1">{extracting ? "Reading key moments from the video" : "This takes a few seconds"}</p>
                </div>
              )}
              {analyseError && !analyseLoading && (
                <div className="bg-white rounded-2xl border border-red-200 p-4 flex items-start gap-3">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{analyseError}</p>
                </div>
              )}
              {analyseResult && !analyseLoading && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 flex items-center gap-3" style={{ backgroundColor: GRS_GREEN }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                      {analyseResult.hadVideo ? <Film size={16} className="text-yellow-300" /> : <Sparkles size={16} className="text-yellow-300" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-wide">{ANALYSE_TYPES.find((s) => s.id === analyseResult.type)?.label} · {analyseResult.context}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{analyseResult.hadVideo ? "Gemini Vision · video analysed" : "Gemini · text analysis"} · {analyseResult.timestamp}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analyseResult.analysis}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2" style={{ backgroundColor: "#f0fdf4", color: GRS_GREEN }}>
                      <CheckCircle2 size={12} />
                      {analyseResult.hadVideo ? "Video analysed — share this with your players before training" : "Tactical analysis complete — upload a clip for visual feedback"}
                    </div>
                  </div>
                </div>
              )}
              {!analyseResult && !analyseLoading && !analyseError && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <Brain size={32} className="mx-auto mb-3" style={{ color: "#d1d5db" }} />
                  <p className="text-sm font-semibold text-gray-500">AI feedback will appear here</p>
                  <p className="text-xs text-gray-400 mt-1">Select a type, upload a clip, and tap Analyse</p>
                </div>
              )}

              {/* Quick reference */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">Quick Reference</p>
                <div className="space-y-2">
                  {[
                    { icon: Flag,   label: "Corner",    tip: "Target far post with late-arriving runs" },
                    { icon: Target, label: "Free Kick", tip: "Vary delivery to beat the wall" },
                    { icon: Flame,  label: "Penalty",   tip: "Pick a spot and commit to it" },
                    { icon: Shield, label: "Defending", tip: "First man always covers near post" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                        <Icon size={13} style={{ color: GRS_GREEN }} className="shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-800">{item.label}</p>
                          <p className="text-[11px] text-gray-400">{item.tip}</p>
                        </div>
                        <ChevronRight size={12} className="ml-auto text-gray-300" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History */}
              {history.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">Previous Analyses</p>
                  <div className="space-y-2">
                    {history.slice(1).map((h, i) => (
                      <button key={i} onClick={() => setAnalyseResult(h)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#1a5c2a] hover:bg-[#f0fdf4] transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#f3f4f6" }}>
                          {h.hadVideo ? <Film size={13} style={{ color: GRS_GREEN }} /> : <Brain size={13} style={{ color: GRS_GREEN }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800">{ANALYSE_TYPES.find((s) => s.id === h.type)?.label} · {h.context}</p>
                          <p className="text-[10px] text-gray-400">{h.hadVideo ? "Video" : "Text"} · {h.timestamp}</p>
                        </div>
                        <ChevronRight size={12} className="text-gray-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* LAB TAB                                                             */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "lab" && (
        <div style={{ maxWidth: labPhase === "results" ? 680 : 640, margin: "0 auto", padding: "32px 16px 56px" }}>

          {/* ── SETUP PHASE ── */}
          {labPhase === "setup" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: GRS_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Flag size={24} color="#f0b429" />
                </div>
                <div>
                  <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>Scoring Lab</h1>
                  <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Assess your team&apos;s set piece execution and get AI tactical recommendations</p>
                </div>
              </div>

              {/* Sport */}
              <div style={labCard}>
                <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Sport</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {LAB_SPORTS.map((s) => (
                    <button key={s} onClick={() => handleLabSportChange(s)}
                      style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, border: `2px solid ${labSport === s ? GRS_GREEN : "#e5e7eb"}`, backgroundColor: labSport === s ? GRS_GREEN : "white", color: labSport === s ? "white" : "#374151" }}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Set piece config */}
              <div style={labCard}>
                <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Set Piece Configuration</h2>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Set Piece Type</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                  {labSetPieceOptions.map((t) => (
                    <button key={t} onClick={() => setLabSetPiece(t)}
                      style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, border: `2px solid ${labSetPiece === t ? GRS_GREEN : "#e5e7eb"}`, backgroundColor: labSetPiece === t ? GRS_GREEN : "white", color: labSetPiece === t ? "white" : "#374151" }}
                    >{t}</button>
                  ))}
                </div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Situation</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                  {(["attacking", "defending"] as const).map((s) => (
                    <button key={s} onClick={() => handleLabSituationChange(s)}
                      style={{ flex: 1, padding: "11px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, border: `2px solid ${labSituation === s ? GRS_GREEN : "#e5e7eb"}`, backgroundColor: labSituation === s ? GRS_GREEN : "white", color: labSituation === s ? "white" : "#374151", textTransform: "capitalize" }}
                    >{s === "attacking" ? "⚔️  Attacking" : "🛡️  Defending"}</button>
                  ))}
                </div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Team Name (optional)</label>
                <input value={labTeamName} onChange={(e) => setLabTeamName(e.target.value)} placeholder="e.g. Harare City U17s…"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none" }} />
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Opponent Tendency (optional)</label>
                <input value={labOppTendency} onChange={(e) => setLabOppTendency(e.target.value)}
                  placeholder={labSituation === "attacking" ? "e.g. They play zonal marking, keeper stays on line…" : "e.g. They always target the back post runner…"}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              </div>

              <button onClick={() => setLabPhase("assess")}
                style={{ width: "100%", padding: "14px", backgroundColor: GRS_GREEN, color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}
              >Next: Rate Your Team&apos;s Execution →</button>
            </>
          )}

          {/* ── ASSESS PHASE ── */}
          {labPhase === "assess" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #e5e7eb" }}>
                <button onClick={() => setLabPhase("setup")} style={{ color: "#6b7280", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <span style={{ color: "#d1d5db" }}>›</span>
                <span style={{ fontWeight: 600, color: GRS_GREEN, fontSize: 14 }}>Rate Your Team</span>
                <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{labSport} · {labSetPiece} · {labSituation}</span>
              </div>
              <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
                Rate your team&apos;s execution of {labSituation} {labSetPiece.toLowerCase()}s honestly. 1 = major weakness, 5 = team strength.
              </p>
              {labMechanics.map((m) => {
                const current = labRatings[m.key] || 0;
                return (
                  <div key={m.key} style={{ ...labCard, borderLeft: `4px solid ${current ? m.color : "#e5e7eb"}` }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>{m.label}</h3>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>{Math.round(m.weight * 100)}% weight</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{m.desc}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setLabRatings((prev) => ({ ...prev, [m.key]: n }))}
                          style={{ flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, border: `2px solid ${current === n ? m.color : "#e5e7eb"}`, backgroundColor: current === n ? m.color : "white", color: current === n ? "white" : "#374151", transition: "all 0.15s" }}
                        >{n}</button>
                      ))}
                    </div>
                    {current > 0 && <p style={{ margin: "10px 0 0", fontSize: 12, color: m.color, fontWeight: 500 }}>{m.labels[current - 1]}</p>}
                  </div>
                );
              })}
              {labError && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{labError}</p>}
              <button onClick={runLabAnalysis} disabled={!labAllRated || labLoading}
                style={{ width: "100%", padding: "14px", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: labAllRated && !labLoading ? "pointer" : "not-allowed", backgroundColor: labAllRated && !labLoading ? GRS_GREEN : "#d1d5db", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Flag size={18} />
                {labLoading ? "Generating tactical report…" : labAllRated ? "Get AI Tactical Report" : `Rate all 4 areas (${Object.keys(labRatings).filter(k => labMechanics.some(m => m.key === k)).length}/4)`}
              </button>
            </>
          )}

          {/* ── RESULTS PHASE ── */}
          {labPhase === "results" && (
            <>
              {/* Score hero */}
              <div style={{ ...labCard, textAlign: "center", background: "linear-gradient(135deg, #1a5c2a 0%, #0f3318 100%)", color: "white" }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Team Score — {labSituation === "attacking" ? "Attacking" : "Defending"} {labSetPiece}
                </p>
                <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, marginBottom: 8, color: labScoreColor === "#16a34a" ? "#4ade80" : labScoreColor === "#d97706" ? "#fbbf24" : "#f87171" }}>
                  {labOverallScore}
                </div>
                <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>{labScoreLabel} set piece execution</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{labSport} · {labSetPiece}{labTeamName ? ` · ${labTeamName}` : ""}</p>
              </div>

              {/* Mechanics breakdown */}
              <div style={labCard}>
                <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Execution Breakdown</h2>
                {labMechanics.map((m, i) => {
                  const pct  = (labRatings[m.key] || 0) * 20;
                  const clr  = barColor(pct);
                  const text = labFeedback ? (labFeedback[feedbackKeys[i]] as string) : null;
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

              {labFeedback?.biggest_weakness && (
                <div style={{ ...labCard, backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
                  <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Biggest Weakness</p>
                  <p style={{ margin: 0, fontSize: 15, color: "#111" }}><strong>{labFeedback.biggest_weakness}</strong> is the area costing your team the most on {labSetPiece.toLowerCase()}s.</p>
                </div>
              )}
              {labFeedback?.tactical_recommendation && (
                <div style={{ ...labCard, backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Tactical Recommendation</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#111", lineHeight: 1.6 }}>{labFeedback.tactical_recommendation}</p>
                </div>
              )}
              {labFeedback?.opponent_counter && labFeedback.opponent_counter !== "N/A" && (
                <div style={{ ...labCard, backgroundColor: "#fdf4ff", border: "1px solid #e9d5ff" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>Counter This Opponent</p>
                  <p style={{ margin: 0, fontSize: 14, color: "#111", lineHeight: 1.6 }}>{labFeedback.opponent_counter}</p>
                </div>
              )}
              {labFeedback?.strengths?.length ? (
                <div style={{ ...labCard, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>Team Strengths</p>
                  {labFeedback.strengths.map((s, i) => (
                    <p key={i} style={{ margin: "0 0 4px", fontSize: 14, color: "#111", display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ color: "#16a34a", marginTop: 2 }}>✓</span> {s}
                    </p>
                  ))}
                </div>
              ) : null}
              {labFeedback && (
                <div style={labCard}>
                  <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 {labSituation === "attacking" ? "Routines" : "Drills"} to Implement in Training</h2>
                  {[labFeedback.routine_1, labFeedback.routine_2, labFeedback.routine_3].map((routine, i) => {
                    if (!routine?.name) return null;
                    const key  = `routine_${i + 1}`;
                    const open = openRoutine === key;
                    return (
                      <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                        <button onClick={() => setOpenRoutine(open ? null : key)}
                          style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "white", border: "none", cursor: "pointer", textAlign: "left" }}
                        >
                          <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>
                            <span style={{ marginRight: 8, color: GRS_GREEN, fontWeight: 700 }}>{i + 1}.</span>{routine.name}
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
              {labError && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{labError}</p>}
              <button onClick={() => { setLabPhase("setup"); setLabRatings({}); setLabFeedback(null); setLabError(""); setOpenRoutine(null); }}
                style={{ width: "100%", padding: "14px", backgroundColor: GRS_GREEN, color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              ><RotateCcw size={16} /> New Assessment</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
