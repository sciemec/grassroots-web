"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Zap, ChevronDown, ChevronUp, RotateCcw,
  Clock, History, Upload,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { postToArena } from "@/lib/arena-poster";
import { measureFromVideo, type VideoMeasurement } from "@/lib/super-engine";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AiFeedback {
  overall_score:             number;
  arm_drive_feedback:        string;
  forward_lean_feedback:     string;
  knee_drive_feedback:       string;
  stride_rhythm_feedback:    string;
  biggest_issue:             string;
  strengths:                 string[];
  drill_1:                   { name: string; description: string };
  drill_2:                   { name: string; description: string };
  drill_3:                   { name: string; description: string };
  time_improvement_estimate: string;
}

interface MeasuredScores {
  arm_drive:     number;   // 0–100
  forward_lean:  number;   // 0–100
  knee_drive:    number;   // 0–100
  stride_rhythm: number;   // 0–100 (inverted asymmetry — higher = more rhythmic)
  confidence:    number;   // 0–100
  engines:       string[];
  raw:           VideoMeasurement;
}

interface HistoryEntry {
  id:                  string;
  sport:               string;
  position:            string | null;
  distance_metres:     number;
  surface:             string;
  time_achieved:       number | null;
  arm_drive_score:     number;
  forward_lean_score:  number;
  knee_drive_score:    number;
  stride_rhythm_score: number;
  overall_score:       number;
  ai_feedback:         AiFeedback | null;
  created_at:          string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SPORTS    = ["Football","Rugby","Athletics","Netball","Basketball","Cricket","Swimming","Tennis","Volleyball","Hockey"];
const SURFACES  = ["Grass", "Track", "Artificial", "Sand", "Court"];
const DISTANCES = [30, 40, 60, 100];

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const MECHANIC_META = [
  { key: "arm_drive",    label: "Arm Drive",     color: "#2563eb", desc: "Arm swing power and straightness" },
  { key: "forward_lean", label: "Forward Lean",  color: "#1a5c2a", desc: "Trunk angle into acceleration" },
  { key: "knee_drive",   label: "Knee Drive",    color: "#c8962a", desc: "Knee lift height and drive" },
  { key: "stride_rhythm",label: "Stride Rhythm", color: "#7c3aed", desc: "Cadence consistency and symmetry" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function toScore5(pct: number): number {
  return Math.max(1, Math.min(5, Math.round(pct / 20)));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SprintMechanicsPage() {
  const token   = useAuthStore((s) => s.token);
  const fileRef = useRef<HTMLInputElement>(null);

  // Phase
  const [phase,        setPhase]        = useState<"setup" | "upload" | "results">("setup");

  // Setup fields
  const [sport,        setSport]        = useState("Football");
  const [position,     setPosition]     = useState("");
  const [distance,     setDistance]     = useState(40);
  const [surface,      setSurface]      = useState("Grass");
  const [timeAchieved, setTimeAchieved] = useState("");

  // Video / measurement
  const [videoLoading, setVideoLoading] = useState(false);
  const [uploadPct,    setUploadPct]    = useState(0);
  const [measured,     setMeasured]     = useState<MeasuredScores | null>(null);

  // Results
  const [feedback,     setFeedback]     = useState<AiFeedback | null>(null);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [error,        setError]        = useState("");
  const [openDrill,    setOpenDrill]    = useState<string | null>(null);

  // History
  const [history,      setHistory]      = useState<HistoryEntry[]>([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [openHist,     setOpenHist]     = useState<string | null>(null);

  // ── Fetch history ─────────────────────────────────────────────────────────

  const fetchHistory = async () => {
    if (!token) return;
    setHistLoading(true);
    try {
      const r = await fetch(`${API_URL}/player/sprint`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const json = await r.json();
        setHistory(Array.isArray(json.data) ? json.data : []);
      }
    } catch { /* silent */ } finally {
      setHistLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Video upload → measure ────────────────────────────────────────────────

  const handleVideoFile = async (file: File) => {
    setVideoLoading(true);
    setUploadPct(0);
    setMeasured(null);
    setError("");

    const vm = await measureFromVideo(file, "sprint", setUploadPct);

    setVideoLoading(false);

    if (!vm || vm.framesAnalysed === 0) {
      setError("No person detected in the video. Try a side-view clip with one sprinter in frame.");
      return;
    }

    const scores: MeasuredScores = {
      arm_drive:     Math.round(vm.sprintArmSwing     ?? 50),
      forward_lean:  Math.round(vm.sprintTrunkLean    ?? 50),
      knee_drive:    Math.round(vm.sprintKneeDrive    ?? 50),
      stride_rhythm: Math.round(100 - (vm.sprintAsymmetry ?? 50)),
      confidence:    Math.round(vm.confidence * 100),
      engines:       vm.enginesUsed,
      raw:           vm,
    };

    setMeasured(scores);
    runAnalysis(scores);
  };

  // ── AI analysis ──────────────────────────────────────────────────────────

  const runAnalysis = async (scores: MeasuredScores) => {
    setAiLoading(true);
    setFeedback(null);
    setPhase("results");

    const overall = Math.round(
      scores.arm_drive * 0.25 +
      scores.forward_lean * 0.25 +
      scores.knee_drive * 0.30 +
      scores.stride_rhythm * 0.20
    );

    const prompt = `You are a sprint coach. Analyse these AI-measured sprint mechanics and return ONLY valid JSON — no markdown, no text outside the JSON.

Sport: ${sport}${position ? `\nPosition: ${position}` : ""}
Distance: ${distance}m
Surface: ${surface}${timeAchieved ? `\nTime achieved: ${timeAchieved}s` : ""}
Measurement engines: ${scores.engines.join(", ")}
Measurement confidence: ${scores.confidence}%

AI-measured mechanics (0–100, higher is better):
- Arm drive: ${scores.arm_drive}/100
- Forward lean (trunk angle): ${scores.forward_lean}/100
- Knee drive height: ${scores.knee_drive}/100
- Stride rhythm / symmetry: ${scores.stride_rhythm}/100
- Overall composite: ${overall}/100

Return this exact JSON structure:
{
  "overall_score": <0-100 integer>,
  "arm_drive_feedback": "<one specific coaching sentence>",
  "forward_lean_feedback": "<one specific coaching sentence>",
  "knee_drive_feedback": "<one specific coaching sentence>",
  "stride_rhythm_feedback": "<one specific coaching sentence>",
  "biggest_issue": "<the single mechanic to fix first, as a full sentence>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "drill_1": { "name": "<drill name>", "description": "<2-sentence how-to, no equipment needed>" },
  "drill_2": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "drill_3": { "name": "<drill name>", "description": "<2-sentence how-to>" },
  "time_improvement_estimate": "<e.g. fixing arm drive could recover 0.2s over ${distance}m>"
}`;

    let parsed: AiFeedback | null = null;

    try {
      const r    = await fetch("/api/gemini-text", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:       prompt,
          system_prompt: "You are a professional sprint mechanics coach. Always return only valid JSON.",
        }),
      });
      const data = await r.json();
      parsed = extractJson(data.response || "");
    } catch { /* fall through to defaults */ }

    if (!parsed) {
      const weakest = (["arm_drive","forward_lean","knee_drive","stride_rhythm"] as const)
        .reduce((a, b) => (scores[a] < scores[b] ? a : b));
      parsed = {
        overall_score:             overall,
        arm_drive_feedback:        "Keep arms at 90° and drive straight — not across your body.",
        forward_lean_feedback:     "Lean from your ankles, not your waist — push the ground behind you.",
        knee_drive_feedback:       "Drive your front knee hard toward your chest in the acceleration phase.",
        stride_rhythm_feedback:    "Aim for quick, light contacts — think hot coals underfoot.",
        biggest_issue:             `${MECHANIC_META.find((m) => m.key === weakest)?.label} is your biggest limiter right now.`,
        strengths:                 ["Video captured — baseline now set for tracking progress", "Consistent measurement gives you real data to improve from"],
        drill_1: { name: "Wall Drive Holds",  description: "Stand arm's length from a wall. Drive one knee to 90° and hold 2 seconds. 3 sets of 10 reps each leg." },
        drill_2: { name: "A-Skip Drill",      description: "March forward lifting knees to hip height with an exaggerated skip. Focus on arm drive. 4 × 20m." },
        drill_3: { name: "Falling Starts",    description: "Stand tall, lean forward until you're about to fall, then sprint. Trains correct lean angle. 6 × 30m." },
        time_improvement_estimate: `Consistent mechanics work can recover 0.2–0.4s over ${distance}m within 4 weeks.`,
      };
    }

    setFeedback(parsed);
    setAiLoading(false);

    // Save to backend (non-blocking)
    if (token) {
      fetch(`${API_URL}/player/sprint`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          sport, position,
          distance_metres:     distance,
          surface,
          arm_drive_score:     toScore5(scores.arm_drive),
          forward_lean_score:  toScore5(scores.forward_lean),
          knee_drive_score:    toScore5(scores.knee_drive),
          stride_rhythm_score: toScore5(scores.stride_rhythm),
          overall_score:       overall,
          time_achieved:       timeAchieved ? parseFloat(timeAchieved) : null,
          ai_feedback:         parsed,
        }),
      }).catch(() => {});
    }

    postToArena(
      `Measured ${distance}m sprint mechanics with AI — scored ${parsed.overall_score}/100`,
      { postType: "milestone", activityType: "skill_analysis", activityData: { skill: "sprint", distance, score: parsed.overall_score, sport } },
    );
  };

  // ── Shared styles ─────────────────────────────────────────────────────────

  const card: React.CSSProperties = { backgroundColor: "white", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 };
  const nav:  React.CSSProperties = { backgroundColor: "white", borderBottom: "1px solid #e5e5e5", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 };

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
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Upload a sprint clip — AI measures your mechanics and coaches you</p>
            </div>
          </div>

          {/* Sport */}
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>Your Sport</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SPORTS.map((s) => (
                <button key={s} onClick={() => setSport(s)}
                  style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500,
                    border: `2px solid ${sport === s ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: sport === s ? "#1a5c2a" : "white",
                    color: sport === s ? "white" : "#374151" }}
                >{s}</button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#111" }}>Sprint Context</h2>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>Position (optional)</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Striker, Winger, Sprinter…"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none" }}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Sprint Distance</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {DISTANCES.map((d) => (
                <button key={d} onClick={() => setDistance(d)}
                  style={{ flex: 1, padding: "9px 0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500,
                    border: `2px solid ${distance === d ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: distance === d ? "#1a5c2a" : "white",
                    color: distance === d ? "white" : "#374151" }}
                >{d}m</button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 8 }}>Surface</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {SURFACES.map((s) => (
                <button key={s} onClick={() => setSurface(s)}
                  style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                    border: `2px solid ${surface === s ? "#1a5c2a" : "#e5e7eb"}`,
                    backgroundColor: surface === s ? "#1a5c2a" : "white",
                    color: surface === s ? "white" : "#374151" }}
                >{s}</button>
              ))}
            </div>

            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
              <Clock size={13} style={{ display: "inline", marginRight: 4 }} />
              Time achieved (seconds, optional)
            </label>
            <input type="number" step="0.01" value={timeAchieved} onChange={(e) => setTimeAchieved(e.target.value)}
              placeholder={`e.g. ${distance === 30 ? "4.1" : distance === 40 ? "5.2" : distance === 60 ? "7.8" : "11.9"}`}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <button onClick={() => setPhase("upload")}
            style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Next: Upload Sprint Video →
          </button>

          {/* History */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <History size={16} color="#6b7280" />
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111" }}>Past Sessions</h2>
            </div>

            {histLoading && (
              <p style={{ fontSize: 14, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Loading…</p>
            )}

            {!histLoading && history.length === 0 && (
              <div style={{ ...card, textAlign: "center", padding: "28px 16px" }}>
                <Zap size={28} color="#d1d5db" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>No sessions yet. Upload your first sprint clip above.</p>
              </div>
            )}

            {!histLoading && history.map((entry) => {
              const isOpen = openHist === entry.id;
              const clr    = barColor(entry.overall_score);
              const date   = new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
              return (
                <div key={entry.id} style={{ backgroundColor: "white", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10, overflow: "hidden" }}>
                  <button onClick={() => setOpenHist(isOpen ? null : entry.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: clr, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{entry.overall_score}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#111" }}>
                        {entry.sport} · {entry.distance_metres}m · {entry.surface}
                        {entry.time_achieved ? ` · ${entry.time_achieved}s` : ""}
                      </p>
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
                          { label: "Arm Drive",     score: entry.arm_drive_score * 20,     color: "#2563eb" },
                          { label: "Forward Lean",  score: entry.forward_lean_score * 20,  color: "#1a5c2a" },
                          { label: "Knee Drive",    score: entry.knee_drive_score * 20,    color: "#c8962a" },
                          { label: "Stride Rhythm", score: entry.stride_rhythm_score * 20, color: "#7c3aed" },
                        ].map((m) => (
                          <div key={m.label} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{m.label}</span>
                              <span style={{ fontSize: 12, color: barColor(m.score), fontWeight: 600 }}>{m.score}/100</span>
                            </div>
                            <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${m.score}%`, backgroundColor: m.color, borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {entry.ai_feedback?.biggest_issue && (
                        <div style={{ marginTop: 10, backgroundColor: "#fefce8", borderRadius: 8, padding: "10px 12px", border: "1px solid #fde68a" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
                          <p style={{ margin: 0, fontSize: 13, color: "#111" }}>{entry.ai_feedback.biggest_issue}</p>
                        </div>
                      )}
                      {entry.ai_feedback?.time_improvement_estimate && (
                        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#6b7280" }}>{entry.ai_feedback.time_improvement_estimate}</p>
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
  // UPLOAD PHASE
  // ══════════════════════════════════════════════════════════════════════════

  if (phase === "upload") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
        <div style={nav}>
          <button onClick={() => setPhase("setup")}
            style={{ color: "#6b7280", background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 14 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ color: "#d1d5db" }}>›</span>
          <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>Upload Sprint Clip</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{sport} · {distance}m · {surface}</span>
        </div>

        <div style={{ maxWidth: 540, margin: "0 auto", padding: "40px 16px" }}>

          {/* How-to tip */}
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Best results</p>
            <p style={{ margin: 0, fontSize: 13, color: "#78350f" }}>
              Film from the <strong>side</strong> (sagittal view), 5–10m away. One sprinter in frame.
              Good lighting helps — outdoors works great.
            </p>
          </div>

          {/* Upload zone */}
          {!videoLoading && (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f && f.type.startsWith("video/")) handleVideoFile(f);
              }}
              style={{
                width: "100%", border: "2px dashed #9ca3af", borderRadius: 20,
                padding: "52px 24px", background: "white", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: "#f0fdf4", border: "2px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={28} color="#1a5c2a" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#111" }}>Upload sprint video</p>
                <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Tap to choose · or drag and drop</p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: "#d1d5db" }}>MP4 · MOV · AVI · WebM</p>
              </div>
            </button>
          )}

          {/* Progress */}
          {videoLoading && (
            <div style={{ backgroundColor: "white", borderRadius: 20, padding: "40px 28px", border: "1px solid #e5e7eb", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Zap size={26} color="#f0b429" />
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#111" }}>Analysing your sprint…</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>
                {uploadPct < 30 ? "Extracting frames from video…" : uploadPct < 70 ? "Running MoveNet pose detection…" : "Calculating mechanics scores…"}
              </p>
              <div style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${uploadPct}%`, backgroundColor: "#1a5c2a", borderRadius: 4, transition: "width 0.3s ease" }} />
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{uploadPct}%</p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "12px 16px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#991b1b" }}>Could not detect sprint</p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#b91c1c" }}>{error}</p>
              <button onClick={() => { setError(""); fileRef.current?.click(); }}
                style={{ fontSize: 13, color: "#1a5c2a", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>
                Try another clip →
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoFile(f); e.target.value = ""; }} />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS PHASE
  // ══════════════════════════════════════════════════════════════════════════

  const overall = measured
    ? Math.round(
        measured.arm_drive * 0.25 +
        measured.forward_lean * 0.25 +
        measured.knee_drive * 0.30 +
        measured.stride_rhythm * 0.20
      )
    : feedback?.overall_score ?? 0;

  const scoreColor = barColor(overall);

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
          {aiLoading ? (
            <div style={{ padding: "28px 0" }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "#f0b429", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>AI is reviewing your mechanics…</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreColor === "#16a34a" ? "#4ade80" : scoreColor === "#d97706" ? "#fbbf24" : "#f87171", marginBottom: 8 }}>
                {overall}
              </div>
              <p style={{ margin: "0 0 4px", fontSize: 16, color: "rgba(255,255,255,0.85)" }}>
                {barLabel(overall)} sprint mechanics
              </p>
            </>
          )}
          <p style={{ margin: aiLoading ? "12px 0 0" : "0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
            {sport} · {distance}m · {surface}
            {timeAchieved ? ` · ${timeAchieved}s` : ""}
          </p>
          {measured && (
            <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              Measured by {measured.engines.join(" · ")} · {measured.confidence}% confidence
            </p>
          )}
        </div>

        {/* Mechanics breakdown */}
        {measured && (
          <div style={card}>
            <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#111" }}>Mechanics Breakdown</h2>
            {MECHANIC_META.map((m) => {
              const pct  = measured[m.key as keyof MeasuredScores] as number;
              const clr  = barColor(pct);
              const text = feedback ? (feedback[`${m.key}_feedback` as keyof AiFeedback] as string) : null;
              return (
                <div key={m.key} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{m.label}</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 6 }}>{m.desc}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: clr, flexShrink: 0, marginLeft: 12 }}>{pct}/100 · {barLabel(pct)}</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: m.color, borderRadius: 4, transition: "width 0.6s ease" }} />
                  </div>
                  {text && <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{text}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Biggest issue */}
        {!aiLoading && feedback?.biggest_issue && (
          <div style={{ ...card, backgroundColor: "#fefce8", border: "1px solid #fde68a" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Priority Fix</p>
            <p style={{ margin: 0, fontSize: 15, color: "#111" }}>{feedback.biggest_issue}</p>
          </div>
        )}

        {/* Strengths */}
        {!aiLoading && feedback?.strengths?.length ? (
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
        {!aiLoading && feedback && (
          <div style={card}>
            <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#111" }}>3 Drills to Fix Your Mechanics</h2>
            {[feedback.drill_1, feedback.drill_2, feedback.drill_3].map((drill, i) => {
              if (!drill?.name) return null;
              const key  = `drill_${i + 1}`;
              const open = openDrill === key;
              return (
                <div key={key} style={{ border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                  <button onClick={() => setOpenDrill(open ? null : key)}
                    style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: "white", border: "none", cursor: "pointer", textAlign: "left" }}>
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
        {!aiLoading && feedback?.time_improvement_estimate && (
          <div style={{ ...card, backgroundColor: "#f0f7ff", border: "1px solid #bfdbfe" }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase" }}>Potential Improvement</p>
            <p style={{ margin: 0, fontSize: 14, color: "#111" }}>{feedback.time_improvement_estimate}</p>
          </div>
        )}

        <button
          onClick={() => {
            setPhase("setup");
            setMeasured(null);
            setFeedback(null);
            setError("");
            setOpenDrill(null);
            setUploadPct(0);
            fetchHistory();
          }}
          style={{ width: "100%", padding: "14px", backgroundColor: "#1a5c2a", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <RotateCcw size={16} /> New Session
        </button>
      </div>
    </div>
  );
}
