"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, Camera, Video, RefreshCw,
  ChevronDown, ChevronUp, Download, CheckCircle2,
  AlertTriangle, Lightbulb, User, Send,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { uploadVideoInChunks } from "@/lib/upload-chunks";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

// ── 6 drills — simple English throughout ──────────────────────────────────

const DRILLS = [
  {
    id: "sprint_10m",
    name: "Short Sprint",
    emoji: "🏃",
    oneLiner: "Player sprints 10 metres as fast as they can.",
    cameraAngle: "Side view",
    cameraWhere: "Stand about 5 big steps to the side of the player, level with the halfway point of the sprint. The whole body must be visible — head to toe.",
    recordingSteps: [
      "Put 2 cones or stones 10 metres apart on flat ground.",
      "Player starts at one cone in a crouching position — one foot forward, knees bent.",
      "When you say 'Go', they sprint flat-out through the second cone.",
      "Film from the side. Hold your phone sideways (landscape). Keep it still.",
      "Do 3 sprints. Rest 2 minutes between each. Film all 3 from the same spot.",
    ],
    noEquipment: "No cones? Use two sticks, sandals, or scratch lines in the dirt. Any flat area works — a school courtyard, a road, or a field.",
    whatWeCheck: [
      { name: "Body lean", plain: "Is the player leaning forward enough in the first few steps? Leaning forward helps you go faster." },
      { name: "Knee drive", plain: "Is the player lifting their knees high when they run? High knees = more speed." },
      { name: "Heel pull-back", plain: "Does the heel snap up under the bum quickly, or swing out behind them? Snapping up under the bum is more efficient." },
    ],
    primaryScore: "Performance",
    metrics: ["trunk_lean", "knee_drive", "heel_recovery"],
    injuryFlag: false,
  },
  {
    id: "cut_505",
    name: "Change of Direction",
    emoji: "↩️",
    oneLiner: "Player sprints forward, plants their foot, and turns 180° as fast as possible.",
    cameraAngle: "Front view",
    cameraWhere: "Stand behind the turning cone, facing the player as they run toward you. They will turn right in front of the camera. Keep the whole body in frame.",
    recordingSteps: [
      "Put a cone 5 metres in front of the player — this is the turning point.",
      "Player sprints at full speed toward the cone.",
      "At the cone, they plant one foot hard and spin 180° back the way they came.",
      "Film from directly in front — the player runs straight at your camera.",
      "Do 3 turns off the left foot, then 3 off the right foot. Rest 90 seconds between.",
    ],
    noEquipment: "No cone? Use a stone, a sandal, or draw a line in the dirt. Any mark the player can aim for works.",
    whatWeCheck: [
      { name: "Knee cave", plain: "Does the knee bend inward when they plant their foot? Knee caving is a sign of injury risk — especially for girls." },
      { name: "Side balance", plain: "Does the player turn equally well off both feet, or are they much worse on one side? A big difference often means an old injury." },
      { name: "How fast they switch", plain: "How quickly do they stop and go again? Faster switch = better reactive power." },
    ],
    primaryScore: "Resilience",
    metrics: ["knee_valgus", "bilateral_asymmetry", "amortization_ms"],
    injuryFlag: true,
  },
  {
    id: "drop_jump",
    name: "Step-Off Jump",
    emoji: "⬇️",
    oneLiner: "Player steps off a raised surface and jumps as high as possible the moment they land.",
    cameraAngle: "Front view",
    cameraWhere: "Stand 3-5 metres in front of the player, facing them. Make sure you can see the top of the raised surface AND the ground in one shot.",
    recordingSteps: [
      "Find a step, low wall, or raised earth mound — about knee height (30 cm).",
      "Player stands on the edge with their toes hanging off.",
      "They step off (do NOT jump off — just step), and the moment both feet hit the ground, they jump up as high as they can.",
      "The goal: spend as little time on the ground as possible before jumping.",
      "Land softly with bent knees. Do 5 jumps. Rest 2 minutes between.",
    ],
    noEquipment: "No plyometric box? Use a low school step, a low wall, a pile of bricks, or a raised dirt mound. The height should be roughly knee-height.",
    whatWeCheck: [
      { name: "Landing softness", plain: "Do they absorb the landing well, or do they thud down stiffly? Too stiff puts stress on joints. Too soft means weak legs." },
      { name: "Knee cave on landing", plain: "Do the knees fall inward when they land? This is one of the top causes of knee injury in youth sport." },
      { name: "Equal landing", plain: "Do they put equal weight on both legs, or lean to one side? Favouring one side often hides an old injury." },
    ],
    primaryScore: "Resilience",
    metrics: ["landing_stiffness", "knee_valgus", "bilateral_asymmetry"],
    injuryFlag: true,
  },
  {
    id: "header",
    name: "Jump Header",
    emoji: "⚽",
    oneLiner: "Player jumps to head a ball tossed by the coach, then lands in control.",
    cameraAngle: "Front view",
    cameraWhere: "Stand directly in front of the player, 3-5 metres away. Full body must be in frame — including their highest point in the air. Step back if they go out of frame at the top.",
    recordingSteps: [
      "Player stands 1-2 metres from where you are filming.",
      "You (the coach) stand to the side and toss the ball gently to head height.",
      "Player takes one or two steps forward, jumps with both arms swinging up, and heads the ball with their forehead.",
      "After heading, they must land on both feet at the same time and stay balanced — no stumbling.",
      "Rest 60 seconds. Repeat 5 times. You film, someone else feeds the ball.",
    ],
    noEquipment: "No football? Use a mango, a balled-up piece of cloth, a plastic bag stuffed with rags, or any similar soft object they can safely head.",
    whatWeCheck: [
      { name: "Arm swing", plain: "Do they swing their arms upward to help them jump higher? Arms add extra height when used properly." },
      { name: "Equal landing", plain: "Do they land on both feet equally, or favour one side? Heading often causes rotation that shows up as uneven landings." },
      { name: "Landing control", plain: "Do they stick the landing cleanly in one movement, or take extra steps? Clean landings show good balance and reduce ankle injury risk." },
    ],
    primaryScore: "Performance",
    metrics: ["arm_swing", "bilateral_asymmetry", "landing_stiffness"],
    injuryFlag: false,
  },
  {
    id: "lateral_shuffle",
    name: "Side-Step Speed",
    emoji: "↔️",
    oneLiner: "Player shuffles sideways as fast as possible between two markers.",
    cameraAngle: "Front view",
    cameraWhere: "Stand directly in front of the player, 5 metres away. You need to see their full body including both feet touching the markers on each side.",
    recordingSteps: [
      "Put 2 markers 5 metres apart on a flat surface.",
      "Player stands in the middle with knees bent and weight on the balls of their feet.",
      "On your signal, they shuffle to the right until their foot touches the right marker, then immediately back to the left.",
      "They must NOT cross their feet — always shuffle (never step over).",
      "Do 5 full trips (right and left = 1 trip). Film all from the front.",
    ],
    noEquipment: "No cones? Use two sticks, stones, or scratch marks in the dirt. The distance between them should be 5 big steps apart.",
    whatWeCheck: [
      { name: "Hip level", plain: "Do they stay low (hips down, knees bent) the whole time, or do they stand up between shuffles? Staying low is faster." },
      { name: "Foot speed", plain: "How quickly do they move their feet side to side? Faster feet = better lateral quickness." },
      { name: "Balance", plain: "Do they wobble or lose their shape when they change direction? Good balance means they can move without wasting energy." },
    ],
    primaryScore: "Performance",
    metrics: ["trunk_lean", "bilateral_asymmetry", "heel_recovery"],
    injuryFlag: false,
  },
  {
    id: "dribble_sprint",
    name: "Dribble Sprint",
    emoji: "⚽🏃",
    oneLiner: "Player dribbles a ball at speed through 3 cones set in a straight line.",
    cameraAngle: "Side view",
    cameraWhere: "Stand about 5 metres to the side of the middle cone, holding the phone sideways. The full run — start to finish — must be visible.",
    recordingSteps: [
      "Set 3 cones in a straight line, each 3 metres apart.",
      "Player starts with the ball at the first cone.",
      "On your signal, they dribble through all 3 cones as fast as possible, using both feet.",
      "They should use small, quick touches — not big kicks.",
      "Rest 90 seconds. Repeat 3 times. Film all 3 from the side.",
    ],
    noEquipment: "No football? Use a plastic bottle filled with sand or water, a balled-up cloth, or any object they can dribble. No cones? Use stones or sticks to mark the gates.",
    whatWeCheck: [
      { name: "Body position over the ball", plain: "Are they leaning over the ball as they dribble, or standing upright? Leaning forward gives more control." },
      { name: "Touch frequency", plain: "Are they taking lots of small touches, or big kicks that take the ball too far? Small touches = more control at speed." },
      { name: "Run mechanics", plain: "Even with the ball, do they keep good sprint form — knees up, heels pulling under? Or does the ball completely change how they run?" },
    ],
    primaryScore: "Performance",
    metrics: ["trunk_lean", "knee_drive", "heel_recovery"],
    injuryFlag: false,
  },
];

const METRIC_LABELS: Record<string, string> = {
  trunk_lean:          "Body Lean",
  knee_drive:          "Knee Drive",
  heel_recovery:       "Heel Pull-Back",
  knee_valgus:         "Knee Cave",
  bilateral_asymmetry: "Left-Right Balance",
  amortization_ms:     "Switch Speed (ms)",
  landing_stiffness:   "Landing Control",
  arm_swing:           "Arm Swing",
};

const LOWER_IS_BETTER = new Set(["knee_valgus", "bilateral_asymmetry", "amortization_ms"]);

interface PlayerResult {
  id: number;
  metrics: Record<string, number>;
  performance_index: number;
  resilience_index: number;
  flags: string[];
}

interface AnalysisResult {
  players: PlayerResult[];
}

type Stage = "select" | "upload" | "processing" | "results" | "error";

function scoreColor(v: number, lower = false) {
  const good = lower ? v <= 30 : v >= 70;
  const ok   = lower ? v <= 55 : v >= 50;
  if (good) return "#10b981";
  if (ok)   return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(v: number, lower = false) {
  const good = lower ? v <= 30 : v >= 70;
  const ok   = lower ? v <= 55 : v >= 50;
  if (good) return "Good";
  if (ok)   return "OK";
  return "Needs work";
}

export default function CoachDrillAnalysisPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [stage,        setStage]        = useState<Stage>("select");
  const [drillId,      setDrillId]      = useState("sprint_10m");
  const [playerName,   setPlayerName]   = useState("");
  const [uploadPct,    setUploadPct]    = useState(0);
  const [result,       setResult]       = useState<AnalysisResult | null>(null);
  const [errMsg,       setErrMsg]       = useState("");
  const [showGuide,    setShowGuide]    = useState(false);
  const [thutoNote,    setThutoNote]    = useState("");
  const [thutoLoading, setThutoLoading] = useState(false);
  const [arenaPosted,  setArenaPosted]  = useState(false);
  const [expandedTips, setExpandedTips] = useState(false);
  const [r2VideoUrl,   setR2VideoUrl]   = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  const drill   = DRILLS.find((d) => d.id === drillId) ?? DRILLS[0];
  const players = result?.players ?? [];
  const primary = players[0] ?? null;

  // ── Upload + Analyse (3-step Gemini flow) ────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrMsg("Please choose a video file (mp4 or mov).");
      setStage("error");
      return;
    }
    setStage("upload");
    setUploadPct(0);
    setResult(null);
    setThutoNote("");
    setArenaPosted(false);
    setR2VideoUrl("");

    // ── Background: upload a copy to R2 for storage ───────────────────────
    const uploadToR2 = async () => {
      try {
        const presignRes = await fetch(`${APP_URL}/api/upload/presigned`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body:    JSON.stringify({
            filename:     `coach-drills/${drillId}/${Date.now()}.${file.name.split(".").pop() ?? "mp4"}`,
            content_type: file.type,
          }),
        });
        if (!presignRes.ok) return;
        const { upload_url, public_url } = await presignRes.json() as { upload_url: string; public_url: string };
        await new Promise<void>((resolve) => {
          const r2xhr = new XMLHttpRequest();
          r2xhr.open("PUT", upload_url);
          r2xhr.setRequestHeader("Content-Type", file.type);
          r2xhr.onload  = () => resolve();
          r2xhr.onerror = () => resolve();
          r2xhr.send(file);
        });
        setR2VideoUrl(public_url);
      } catch { /* best-effort — never blocks analysis */ }
    };
    uploadToR2();

    // ── Upload through proxy (avoids CORS & Render size limits) ─────────
    let fileUri: string;
    let fileName: string;
    let mimeType: string;
    try {
      const uploadData = await uploadVideoInChunks(file, (pct) => setUploadPct(pct));
      fileUri  = uploadData.fileUri;
      fileName = uploadData.fileName;
      mimeType = uploadData.mimeType;
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStage("error");
      return;
    }

    // ── Step 3: Analyse with Gemini ───────────────────────────────────────
    setStage("processing");
    try {
      const analysisRes = await fetch("/api/coach-drill-analysis", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fileUri, fileName, mimeType, drillId }),
      });
      if (!analysisRes.ok) {
        const errData = await analysisRes.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? `Analysis failed (${analysisRes.status}).`);
      }
      const data = await analysisRes.json() as PlayerResult;
      setResult({ players: [data] });
      setStage("results");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "AI could not process the video. Try a clearer, shorter clip.");
      setStage("error");
    }
  }, [drillId, token]);

  // ── THUTO coaching note ───────────────────────────────────────────────────

  const fetchThutoNote = useCallback(async (p: PlayerResult) => {
    if (!token) return;
    setThutoLoading(true);
    const prompt = [
      `A player just did the "${drill.name}" drill.`,
      `Performance score: ${p.performance_index}/100. Resilience score: ${p.resilience_index}/100.`,
      p.flags.length ? `The AI flagged: ${p.flags.join(", ")}.` : "",
      "Give a 3-sentence plain English coaching note for a 14-year-old athlete.",
      "Be specific and encouraging. No jargon. Start with a strength, then one thing to work on, then one simple thing to try at next training.",
    ].filter(Boolean).join(" ");

    try {
      const res = await fetch("/api/ai-coach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: prompt, system_prompt: "You are THUTO, a friendly sports coach for young athletes in Zimbabwe." }),
      });
      const data = await res.json() as { response?: string };
      setThutoNote(data.response ?? "");
    } catch {
      setThutoNote("");
    } finally {
      setThutoLoading(false);
    }
  }, [drill.name, token]);

  useEffect(() => {
    if (stage === "results" && primary) fetchThutoNote(primary);
  }, [stage, primary, fetchThutoNote]);

  // ── Write scores back to player profile ───────────────────────────────────

  const saveToProfile = useCallback(async (p: PlayerResult) => {
    if (!token || !playerName.trim()) return;
    try {
      await fetch(`${API_URL}/player/biometric-scores`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          player_name:       playerName.trim(),
          drill:             drill.id,
          performance_index: p.performance_index,
          resilience_index:  p.resilience_index,
          flags:             p.flags,
        }),
      });
    } catch { /* fire and forget */ }
  }, [token, playerName, drill.id]);

  // ── Arena post ────────────────────────────────────────────────────────────

  const postToArena = useCallback(async (p: PlayerResult) => {
    if (!token || arenaPosted) return;
    const name = playerName.trim() || "a player";
    const body = `Completed "${drill.name}" drill analysis for ${name}. Performance: ${p.performance_index}/100. Resilience: ${p.resilience_index}/100.`;
    try {
      await fetch(`${API_URL}/arena/posts`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({
          body,
          post_type:     "milestone",
          activity_type: "drill_completion",
          ...(r2VideoUrl ? { video_url: r2VideoUrl } : {}),
        }),
      });
      setArenaPosted(true);
    } catch { /* silent fail */ }
  }, [token, drill.name, playerName, arenaPosted, r2VideoUrl]);

  // ── PDF export ─────────────────────────────────────────────────────────────

  const exportPDF = useCallback(async () => {
    if (!primary) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const name = playerName.trim() || "Player";

    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("GrassRoots Sports — Player Drill Analysis", 14, 13);
    doc.setFontSize(8);
    doc.text(`${drill.name} · ${new Date().toLocaleDateString()}`, 14, 19);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(name, 14, 34);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Drill: ${drill.name}`, 14, 41);

    // Score boxes
    doc.setFillColor(240, 180, 41);
    doc.roundedRect(14, 48, 80, 20, 3, 3, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Performance Index: ${primary.performance_index}/100`, 18, 60);

    doc.setFillColor(34, 197, 94);
    doc.roundedRect(105, 48, 80, 20, 3, 3, "F");
    doc.text(`Resilience Index: ${primary.resilience_index}/100`, 109, 60);

    // Metrics
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Metric Results", 14, 80);
    doc.setFont("helvetica", "normal");
    let y = 87;
    for (const [key, val] of Object.entries(primary.metrics)) {
      const lower = LOWER_IS_BETTER.has(key);
      const label = METRIC_LABELS[key] ?? key;
      const lbl   = scoreLabel(val, lower);
      doc.text(`${label}: ${val}${key === "amortization_ms" ? " ms" : "/100"}  — ${lbl}`, 14, y);
      y += 7;
    }

    // Flags
    if (primary.flags.length > 0) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 30, 30);
      doc.text("Flags to watch:", 14, y);
      doc.setFont("helvetica", "normal");
      y += 7;
      for (const flag of primary.flags) {
        doc.text(`• ${flag.replace(/_/g, " ")}`, 16, y);
        y += 7;
      }
    }

    // THUTO note
    if (thutoNote) {
      y += 4;
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text("THUTO Coaching Note:", 14, y);
      y += 7;
      doc.setFont("helvetica", "italic");
      const lines = doc.splitTextToSize(thutoNote, 182);
      doc.text(lines, 14, y);
    }

    // Footer
    doc.setFillColor(26, 92, 42);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text("GrassRoots Sports · grassrootssports.live · Confidential", 105, 293, { align: "center" });

    doc.save(`${name.replace(/\s+/g, "-")}-${drill.id}-analysis.pdf`);

    if (primary) saveToProfile(primary);
  }, [primary, drill, playerName, thutoNote, saveToProfile]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const reset = () => {
    setStage("select");
    setResult(null);
    setThutoNote("");
    setArenaPosted(false);
    setErrMsg("");
    setUploadPct(0);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0f1a12" }}>
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/coach" className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ArrowLeft size={16} className="text-white" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-white uppercase tracking-tight">Player Drill Analysis</h1>
            <p className="text-[11px] text-white/50">Record one player · Upload · Get AI feedback</p>
          </div>
        </div>

        {/* ── Stage: Select drill ─────────────────────────────────────────── */}
        {stage === "select" && (
          <div className="space-y-5 max-w-2xl">

            {/* Drill cards */}
            <div>
              <h2 className="text-xs font-bold uppercase text-white/40 mb-2 tracking-wider">Choose a Drill</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DRILLS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDrillId(d.id)}
                    className="text-left p-4 rounded-2xl border transition-all"
                    style={{
                      backgroundColor: drillId === d.id ? "#1a5c2a" : "rgba(255,255,255,0.05)",
                      borderColor:     drillId === d.id ? "#f0b429" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{d.emoji}</span>
                      <span className="text-sm font-bold text-white">{d.name}</span>
                      {d.injuryFlag && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold ml-auto">
                          Injury screen
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{d.oneLiner}</p>
                    <p className="text-[10px] text-white/30 mt-1.5">Camera: {d.cameraAngle}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Player name */}
            <div>
              <label className="text-xs font-bold uppercase text-white/40 mb-1.5 block tracking-wider">
                Player Name (optional — for PDF label)
              </label>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                <User size={14} className="text-white/30" />
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Chipo Mutasa"
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                />
              </div>
            </div>

            {/* How-to guide */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setShowGuide((v) => !v)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2">
                  <Camera size={15} className="text-[#f0b429]" />
                  <span className="text-sm font-bold text-white">How to film this drill</span>
                </div>
                {showGuide ? <ChevronUp size={15} className="text-white/40" /> : <ChevronDown size={15} className="text-white/40" />}
              </button>

              {showGuide && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Camera position */}
                  <div className="bg-[#f0b429]/10 border border-[#f0b429]/30 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-[#f0b429] mb-1 uppercase">Where to stand with your phone</p>
                    <p className="text-sm text-white/80 leading-relaxed">{drill.cameraWhere}</p>
                    <p className="text-[11px] text-white/40 mt-2">Hold your phone <strong className="text-white/60">sideways (landscape)</strong>. Keep it still — prop it on something if you can.</p>
                  </div>

                  {/* Step by step */}
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase mb-2">Step by step</p>
                    <ol className="space-y-2">
                      {drill.recordingSteps.map((step, i) => (
                        <li key={i} className="flex gap-2.5 text-sm text-white/70 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-[#1a5c2a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* No equipment */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <p className="text-[11px] font-bold text-white/40 uppercase mb-1">No equipment? No problem</p>
                    <p className="text-sm text-white/70 leading-relaxed">{drill.noEquipment}</p>
                  </div>

                  {/* What we check */}
                  <div>
                    <p className="text-[11px] font-bold text-white/40 uppercase mb-2">What the AI looks for</p>
                    <div className="space-y-2">
                      {drill.whatWeCheck.map((w, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3">
                          <p className="text-xs font-bold text-white mb-0.5">{w.name}</p>
                          <p className="text-[12px] text-white/60 leading-relaxed">{w.plain}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload */}
            <div>
              <h2 className="text-xs font-bold uppercase text-white/40 mb-2 tracking-wider">Upload the Video</h2>
              <div
                className="rounded-2xl border-2 border-dashed border-white/20 p-8 text-center cursor-pointer hover:border-[#f0b429]/50 hover:bg-[#f0b429]/5 transition-all"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <Upload size={28} className="mx-auto mb-3 text-white/30" />
                <p className="text-sm font-semibold text-white/60">Tap to choose video or drag it here</p>
                <p className="text-[11px] text-white/30 mt-1">mp4 or mov · under 200MB · max 60 seconds</p>
                <button
                  className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: "#1a5c2a" }}
                >
                  Choose video file
                </button>
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </div>
        )}

        {/* ── Stage: Uploading ───────────────────────────────────────────── */}
        {stage === "upload" && (
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="text-4xl mb-4">📤</div>
            <h2 className="text-lg font-bold text-white mb-2">Uploading video...</h2>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#f0b429] transition-all duration-300 rounded-full" style={{ width: `${uploadPct}%` }} />
            </div>
            <p className="text-sm text-white/50">{uploadPct}% uploaded</p>
          </div>
        )}

        {/* ── Stage: Processing ──────────────────────────────────────────── */}
        {stage === "processing" && (
          <div className="max-w-md mx-auto mt-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#1a5c2a] border-t-[#f0b429] animate-spin" />
            <h2 className="text-lg font-bold text-white mb-2">AI is analysing the video...</h2>
            <p className="text-sm text-white/50">This takes 30–90 seconds. Don&apos;t close the page.</p>
          </div>
        )}

        {/* ── Stage: Error ───────────────────────────────────────────────── */}
        {stage === "error" && (
          <div className="max-w-md mx-auto mt-12">
            <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 text-center">
              <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
              <h2 className="text-base font-bold text-white mb-1">Something went wrong</h2>
              <p className="text-sm text-white/60 mb-4">{errMsg}</p>
              <button onClick={reset} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-white/10 hover:bg-white/20">
                Try again
              </button>
            </div>
          </div>
        )}

        {/* ── Stage: Results ──────────────────────────────────────────────── */}
        {stage === "results" && primary && (
          <div className="max-w-2xl space-y-5">

            {/* Player name input (if not already set) */}
            {!playerName.trim() && (
              <div className="rounded-2xl bg-[#f0b429]/10 border border-[#f0b429]/30 p-4">
                <p className="text-xs font-bold text-[#f0b429] mb-2 uppercase">Name this player (for PDF + Arena)</p>
                <div className="flex gap-2">
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Player name"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* Score header */}
            <div className="rounded-2xl bg-[#1a5c2a]/40 border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span className="text-sm font-bold text-white">
                  {playerName.trim() || "Player"} — {drill.name} Results
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Performance</p>
                  <p className="text-4xl font-black" style={{ color: scoreColor(primary.performance_index) }}>
                    {primary.performance_index}
                  </p>
                  <p className="text-[11px] text-white/40">/100</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Resilience</p>
                  <p className="text-4xl font-black" style={{ color: scoreColor(primary.resilience_index) }}>
                    {primary.resilience_index}
                  </p>
                  <p className="text-[11px] text-white/40">/100</p>
                </div>
              </div>
            </div>

            {/* Metric bars */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Breakdown</h3>
              {Object.entries(primary.metrics).map(([key, val]) => {
                const lower = LOWER_IS_BETTER.has(key);
                const color = scoreColor(val, lower);
                const barW  = lower ? Math.max(0, 100 - val) : Math.min(100, val);
                const label = METRIC_LABELS[key] ?? key;
                const unit  = key === "amortization_ms" ? " ms" : "/100";
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">{label}</span>
                      <span className="font-bold" style={{ color }}>{val}{unit} — {scoreLabel(val, lower)}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flags */}
            {primary.flags.length > 0 && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
                <p className="text-xs font-bold text-red-300 uppercase mb-2">Things to watch</p>
                <div className="flex flex-wrap gap-2">
                  {primary.flags.map((flag) => (
                    <span key={flag} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-500/20 text-red-300">
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* THUTO coaching note */}
            <div className="rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} className="text-[#f0b429]" />
                <p className="text-xs font-bold text-[#f0b429] uppercase">THUTO Coaching Note</p>
              </div>
              {thutoLoading ? (
                <div className="h-4 bg-white/10 rounded animate-pulse w-3/4" />
              ) : thutoNote ? (
                <p className="text-sm text-white/80 leading-relaxed italic">{thutoNote}</p>
              ) : (
                <p className="text-sm text-white/40 italic">Could not load coaching note. Check your internet connection.</p>
              )}
            </div>

            {/* Tips toggle */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedTips((v) => !v)}
                className="w-full flex items-center justify-between p-4"
              >
                <span className="text-sm text-white/70">View recording tips for next time</span>
                {expandedTips ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
              </button>
              {expandedTips && (
                <div className="px-4 pb-4 text-sm text-white/60 space-y-1.5">
                  {drill.recordingSteps.map((s, i) => (
                    <p key={i}><span className="text-[#f0b429] font-bold">{i + 1}.</span> {s}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportPDF}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Download size={15} />
                Download PDF
              </button>
              <button
                onClick={() => { if (primary) postToArena(primary); }}
                disabled={arenaPosted}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: arenaPosted ? "rgba(255,255,255,0.1)" : "#f0b429",
                  color: arenaPosted ? "rgba(255,255,255,0.4)" : "#1a3a1a",
                }}
              >
                <Send size={15} />
                {arenaPosted ? "Posted!" : "Post to Arena"}
              </button>
            </div>

            <button onClick={reset} className="w-full py-3 rounded-xl text-sm text-white/40 hover:text-white/70 flex items-center justify-center gap-2 transition-colors">
              <RefreshCw size={13} />
              Analyse another player
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
