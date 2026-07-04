"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Upload, Activity, Zap, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Download, ArrowLeft, RefreshCw,
  Camera, User,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";

const AI_URL = process.env.NEXT_PUBLIC_AI_URL ?? "https://ai.bhora-ai.onrender.com";

// ── Drill battery definitions ──────────────────────────────────────────────

const DRILLS = [
  {
    id: "sprint_10m",
    name: "10m Sprint",
    fullName: "0–10 Metre Linear Acceleration",
    emoji: "🏃",
    view: "Lateral (Side)",
    primaryScore: "Performance",
    cameraSetup: "Position the camera 5–7 metres away from the track, pointing perfectly sideways (sagittal view) at the 0-to-5-metre mark — this is where acceleration forces are highest and joint angles are most visible.",
    athleteInstructions: [
      "Set up at the start line in a 3-point sprint stance — dominant foot forward, both knees bent, body weight over the balls of your feet.",
      "On the signal, explode out of your stance and sprint maximally through the 10-metre mark. Do not slow down before the line.",
      "During the first 3 strides: drive your knee hard forward and upward, lean your entire trunk forward at roughly 45°, and pull your heel up sharply under your glute rather than letting it swing behind you.",
      "Maintain that forward lean through stride 4–6, then gradually stand tall. Sprint through a marker 2m past the finish.",
      "Rest fully (2–3 min) and repeat 3 times for a reliable average. Film all 3 runs from the same side-on angle.",
    ],
    whatItMeasures: [
      { metric: "Trunk Lean Angle", why: "During the drive phase, a 40–50° forward lean maximises propulsive force. Players who stay too upright lose acceleration by pushing down instead of forward." },
      { metric: "Hip Flexion (Knee Drive)", why: "The maximum hip angle at the top of each stride reveals how much power the hip flexors are contributing. Low knee drive = wasted energy and reduced stride frequency." },
      { metric: "Heel Recovery Path", why: "Efficient accelerators pull the ankle straight up under the glute (tight loop). A lazy, wide loop behind the body adds dead weight on every stride." },
    ],
    metrics: ["trunk_lean", "knee_drive", "heel_recovery"],
    injuryFlag: false,
    drillDuration: "8–10 seconds per rep",
    reps: "3 × max sprint, full rest between",
    equipment: "Flat surface, 15m of clear space, 2 cones",
  },
  {
    id: "cut_505",
    name: "505 Agility Cut",
    fullName: "505 Agility Test — 180° Deceleration & Pivot",
    emoji: "↩️",
    view: "Frontal (Head-on)",
    primaryScore: "Resilience",
    cameraSetup: "Place the camera directly ON the turning line, facing the athlete head-on as they sprint toward it, plant their foot, and pivot back. The athlete should be running straight at the lens. This frontal angle is essential — it reveals the frontal-plane knee cave that a side view completely misses.",
    athleteInstructions: [
      "Set up a 5-metre sprint zone. Mark the turning line clearly with tape or a cone on the ground.",
      "Sprint at full speed toward the turning line. Your goal is to arrive at maximum velocity — do NOT slow down early.",
      "On the turning line, plant your outside foot firmly (the foot on the side you are turning toward), dig in, and pivot 180° as fast as possible.",
      "Immediately re-accelerate and sprint back through the start line.",
      "Test BOTH sides: perform left-foot-plant turns AND right-foot-plant turns. The system will compare the two to detect bilateral asymmetry.",
      "Rest 90 seconds between reps. Complete 3 reps each side.",
    ],
    whatItMeasures: [
      { metric: "Peak Plant-Foot Valgus Angle", why: "The frame where hip velocity drops to zero (the plant) is the highest-risk moment in football. If the knee caves inward under load, it signals a high ACL injury risk — especially in female athletes." },
      { metric: "Bilateral Deceleration Asymmetry", why: "Comparing left and right turns reveals if one side absorbs cutting forces differently. A >15% difference often indicates an unhealed prior injury or significant strength imbalance." },
      { metric: "Amortization Duration", why: "The milliseconds between end of deceleration and start of re-acceleration. Elite athletes: under 180ms. Over 250ms indicates poor eccentric leg power or fear-avoidance behaviour from a prior knock." },
    ],
    metrics: ["knee_valgus", "bilateral_asymmetry", "amortization_ms"],
    injuryFlag: true,
    drillDuration: "2–4 seconds per rep",
    reps: "3 left-foot cuts + 3 right-foot cuts",
    equipment: "Flat surface, 10m of space, tape/cones for the turning line",
  },
  {
    id: "drop_jump",
    name: "Drop Jump",
    fullName: "Drop Jump Reactive Strength Index (RSI)",
    emoji: "⬇️",
    view: "Frontal (Head-on)",
    primaryScore: "Resilience",
    cameraSetup: "Camera 3–5 metres from the box, facing the athlete head-on. The full height — top of the box to the ground — must be in frame. If the player disappears off the top of the frame at takeoff, step the camera back.",
    athleteInstructions: [
      "Stand on a 30 cm box (or 45 cm for advanced testing), toes at the edge. Arms relaxed at your sides.",
      "Step off the box — do NOT jump off. Simply step off with one foot and let gravity bring you down. This is not a standing jump; the box height generates the downward force.",
      "The instant both feet contact the ground, explode upward into a maximum vertical jump as quickly as possible. The goal is to spend the absolute minimum amount of time on the ground.",
      "Land softly, absorbing force through both legs equally. Do not favour one side.",
      "Rest 2 minutes. Repeat 5 times. Film all reps — the system averages ground contact time and knee angles across all five.",
    ],
    whatItMeasures: [
      { metric: "Landing Stiffness Score", why: "Calculated from the rate of deceleration of the bounding box centre point upon impact. Athletes who absorb too slowly (too soft) lack reactive strength. Athletes who are too stiff have high joint-load injury risk." },
      { metric: "Knee Valgus at Impact", why: "The highest valgus loading moment in football occurs at landing — not at cutting. This drill screens for athletes who cave their knees on every hard landing, indicating weak hip abductors and VMO." },
      { metric: "Bilateral Load Split", why: "Does the player land evenly on both legs, or does 60–70% of the force go through the dominant side? An uneven split is a major predictor of recurring hamstring or groin strain." },
    ],
    metrics: ["landing_stiffness", "knee_valgus", "bilateral_asymmetry"],
    injuryFlag: true,
    drillDuration: "< 1 second ground contact (ideal)",
    reps: "5 drop jumps, 2 min rest each",
    equipment: "Plyometric box (30 cm or 45 cm), flat non-slip surface",
  },
  {
    id: "header",
    name: "Dynamic Header",
    fullName: "Dynamic Header Jump & Landing",
    emoji: "⚽",
    view: "Frontal (Head-on)",
    primaryScore: "Performance",
    cameraSetup: "Camera directly facing the athlete, full height in frame including their peak jump height. A coach or feeder stands to the side, out of frame, to toss the ball. Ensure good lighting — the system needs to track the full arc of the jump.",
    athleteInstructions: [
      "Stand 1–2 metres from the camera target zone. The coach stands 3–4 metres to your side, holding the ball at head height.",
      "On the coach's signal, take one or two approach steps, plant both feet, and jump maximally — driving both arms upward to generate lift.",
      "At the peak of the jump, make controlled contact with the forehead (not the top of the head) to direct the ball forward.",
      "Land with both feet simultaneously, bending knees to 60–90° to absorb impact. Do not land stiff-legged.",
      "Hold the landing position for 1 second — do not step or stumble. The system scores the landing stability.",
      "Rest 60 seconds. Repeat 5 times.",
    ],
    whatItMeasures: [
      { metric: "Arm Swing Efficiency", why: "The arms create 10–15% of vertical jump height when used correctly. Players who jump with arms pinned to their sides are leaving centimetres of jump height on the floor. The system measures peak arm-swing velocity at takeoff." },
      { metric: "Bilateral Landing Symmetry", why: "Heading involves rotation and asymmetric contact force. The system checks whether the player consistently lands heavier on one side — a sign of rotational compensation often linked to a hip or groin problem." },
      { metric: "Landing Control Score", why: "Unstable, multiple-step landings after aerial challenges are the number-one cause of ankle sprains in youth football. This score rewards clean, single-frame landing stabilisation." },
    ],
    metrics: ["arm_swing", "bilateral_asymmetry", "landing_stiffness"],
    injuryFlag: false,
    drillDuration: "2–3 seconds per rep",
    reps: "5 headers, 60s rest each",
    equipment: "Football, open space 5m × 3m, a feeder/coach",
  },
];

// ── Metric display config ──────────────────────────────────────────────────

const METRIC_META: Record<string, {
  label: string;
  unit: string;
  lowerIsBetter?: boolean;
  warnThreshold: number;
}> = {
  trunk_lean:          { label: "Trunk Lean",          unit: "/100", warnThreshold: 60 },
  knee_drive:          { label: "Knee Drive",           unit: "/100", warnThreshold: 55 },
  heel_recovery:       { label: "Heel Recovery",        unit: "/100", warnThreshold: 55 },
  knee_valgus:         { label: "Knee Valgus",          unit: "/100", lowerIsBetter: true, warnThreshold: 35 },
  bilateral_asymmetry: { label: "Bilateral Asymmetry",  unit: "%",    lowerIsBetter: true, warnThreshold: 30 },
  amortization_ms:     { label: "Amortization Time",    unit: "ms",   lowerIsBetter: true, warnThreshold: 240 },
  landing_stiffness:   { label: "Landing Stiffness",    unit: "/100", warnThreshold: 50 },
  arm_swing:           { label: "Arm Swing",            unit: "/100", warnThreshold: 50 },
};

const FLAG_META: Record<string, { label: string; bg: string; text: string; border: string }> = {
  knee_valgus_risk:   { label: "⚠ Valgus Risk",      bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  high_asymmetry:     { label: "⚠ High Asymmetry",   bg: "#fee2e2", text: "#b91c1c", border: "#fecaca" },
  trunk_lean_deficit: { label: "Lean Deficit",         bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  slow_amortization:  { label: "Slow Amortization",   bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  low_knee_drive:     { label: "Low Drive",            bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  poor_heel_recovery: { label: "Poor Recovery",        bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  low_arm_swing:      { label: "Low Arm Swing",        bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
};

// ── Types ──────────────────────────────────────────────────────────────────

interface PlayerResult {
  id: number;
  team: "home" | "away" | "referee";
  metrics: Record<string, number>;
  performance_index: number;
  resilience_index: number;
  flags: string[];
}

interface TeamStats {
  home_avg_performance: number;
  away_avg_performance: number;
  home_avg_resilience: number;
  away_avg_resilience: number;
  players_at_risk: number;
}

interface JobResult {
  status: "pending" | "running" | "complete" | "failed";
  error?: string;
  players?: PlayerResult[];
  team_stats?: TeamStats;
  frames_processed?: number;
  duration_seconds?: number;
}

type Stage = "select" | "upload" | "detecting" | "analysing" | "scoring" | "results" | "error";
type TeamFilter = "all" | "home" | "away";

// ── Helpers ────────────────────────────────────────────────────────────────

function scoreColour(v: number, lower = false) {
  const good = lower ? v <= 30 : v >= 70;
  const ok   = lower ? v <= 50 : v >= 50;
  if (good) return "#10b981";
  if (ok)   return "#f59e0b";
  return "#ef4444";
}

function barPct(v: number, lower = false) {
  return lower ? Math.max(0, 100 - v) : Math.min(100, v);
}

function barBg(v: number, lower = false) {
  const good = lower ? v <= 30 : v >= 70;
  const ok   = lower ? v <= 50 : v >= 50;
  if (good) return "#10b981";
  if (ok)   return "#f59e0b";
  return "#ef4444";
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TeamBiometricsPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [stage,      setStage]      = useState<Stage>("select");
  const [drillId,    setDrillId]    = useState("sprint_10m");
  const [uploadPct,  setUploadPct]  = useState(0);
  const [jobId,      setJobId]      = useState<string | null>(null);
  const [result,     setResult]     = useState<JobResult | null>(null);
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("all");
  const [expanded,   setExpanded]   = useState<Set<number>>(new Set());
  const [showGuide,  setShowGuide]  = useState<string | null>(null);
  const [errMsg,     setErrMsg]     = useState("");

  const fileRef  = useRef<HTMLInputElement>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const drill = DRILLS.find((d) => d.id === drillId) ?? DRILLS[0];

  // ── Upload via XHR (progress tracking) ────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrMsg("Please upload a video file (mp4, mov, avi, etc.)");
      setStage("error");
      return;
    }
    setStage("upload");
    setUploadPct(0);

    const form = new FormData();
    form.append("video", file);
    form.append("drill_type", drillId);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const { job_id } = JSON.parse(xhr.responseText) as { job_id: string };
          setJobId(job_id);
          setStage("detecting");
          startPolling(job_id);
        } catch {
          setErrMsg("Unexpected response from AI service.");
          setStage("error");
        }
      } else {
        setErrMsg(`Upload failed (HTTP ${xhr.status}). Is the AI service running?`);
        setStage("error");
      }
    };
    xhr.onerror = () => {
      setErrMsg("Network error. Check that the AI service at ai.bhora-ai.onrender.com is reachable.");
      setStage("error");
    };
    xhr.open("POST", `${AI_URL}/analyse-team-biomechanics`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(form);
  }, [drillId, token]);

  // ── Poll job status ────────────────────────────────────────────────────────

  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let tick = 0;
    pollRef.current = setInterval(async () => {
      tick++;
      try {
        const res  = await fetch(`${AI_URL}/job/${id}`);
        const data = await res.json() as JobResult;

        // Simulate progress stages while running
        if (data.status === "running") {
          if (tick === 2) setStage("analysing");
          if (tick === 4) setStage("scoring");
        }
        if (data.status === "complete") {
          clearInterval(pollRef.current!);
          setResult(data);
          setStage("results");
        }
        if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setErrMsg(data.error ?? "Analysis failed on the AI service.");
          setStage("error");
        }
      } catch {
        // Transient network error — keep polling
      }
    }, 5000);
  }, []);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── PDF export ─────────────────────────────────────────────────────────────

  const exportPDF = useCallback(async () => {
    if (!result?.players) return;
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("GrassRoots Sports — Team Biomechanics Report", 14, 14);
    doc.setFontSize(8);
    doc.setTextColor(240, 180, 41);
    doc.text(`Drill: ${drill.fullName} · View: ${drill.view} · ${new Date().toLocaleDateString()}`, 14, 20);

    let y = 32;
    doc.setTextColor(0, 0, 0);

    for (const p of (result.players ?? []).filter((p) => p.team !== "referee")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`Player #${p.id} — ${p.team === "home" ? "Home" : "Away"}`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Performance Index: ${p.performance_index}/100   Structural Resilience: ${p.resilience_index}/100`, 14, y + 6);
      if (p.flags.length) {
        doc.setTextColor(180, 0, 0);
        doc.text(`Risk Flags: ${p.flags.map((f) => FLAG_META[f]?.label ?? f).join(", ")}`, 14, y + 12);
        doc.setTextColor(0, 0, 0);
      }
      y += 22;
      if (y > 270) { doc.addPage(); y = 20; }
    }

    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text("GrassRoots Sports · Confidential · Not for public distribution", 14, 288);
    doc.save(`biomechanics-${drill.id}-${Date.now()}.pdf`);
  }, [result, drill]);

  // ── Toggle expand ──────────────────────────────────────────────────────────

  const toggleExpand = (id: number) =>
    setExpanded((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const players = (result?.players ?? []).filter((p) =>
    teamFilter === "all" ? p.team !== "referee" : p.team === teamFilter
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#f4f2ee]">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 py-6 max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <Link href="/analyst" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
            <ArrowLeft size={15} /> Analyst Hub
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Team Biomechanics</h1>
              <p className="text-sm text-gray-500 mt-0.5">YOLOv8 player detection · MediaPipe joint analysis · per-player scoring</p>
            </div>
            <span className="text-xs font-bold bg-purple-700 text-white px-3 py-1 rounded-full">HYBRID PIPELINE</span>
          </div>
        </div>

        {/* ── HOW THE PIPELINE WORKS ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">How the hybrid pipeline works</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "🎯", colour: "#7c3aed", title: "1 · YOLOv8 Detects", body: "Identifies every player in each frame. ByteTracker assigns persistent IDs across the full clip. K-means clusters jersey HSV colours into Home / Away / Referee." },
              { icon: "🦾", colour: "#0891b2", title: "2 · MediaPipe Analyses", body: "Each player bounding-box crop is passed to MediaPipe Pose (33 landmarks). Joint angles are computed frame-by-frame: knee flexion, hip angle, trunk vector, ankle position." },
              { icon: "📊", colour: "#1a5c2a", title: "3 · Two Scores Output", body: "Performance Index = Knee Drive + Trunk Lean + Heel Recovery. Structural Resilience Index = Valgus Risk + Bilateral Asymmetry + Amortization Duration." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl p-4" style={{ backgroundColor: `${s.colour}10`, border: `1px solid ${s.colour}30` }}>
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="font-bold text-sm mb-1" style={{ color: s.colour }}>{s.title}</div>
                <div className="text-xs text-gray-600 leading-relaxed">{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STAGE: Select & Upload ─────────────────────────────────────────── */}
        {stage === "select" && (
          <>
            {/* Drill selector */}
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Select a drill</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {DRILLS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDrillId(d.id)}
                  className="text-left rounded-2xl p-4 border-2 transition-all"
                  style={{
                    borderColor: drillId === d.id ? "#1a5c2a" : "#e5e5e5",
                    backgroundColor: drillId === d.id ? "#f0fdf4" : "#fff",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{d.emoji}</span>
                    <div className="flex gap-2">
                      {d.injuryFlag && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Injury Screen</span>
                      )}
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: d.primaryScore === "Performance" ? "#f0fdf4" : "#fef3c7", color: d.primaryScore === "Performance" ? "#166534" : "#92400e" }}>
                        {d.primaryScore}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-gray-900 text-sm">{d.name}</div>
                  <div className="text-xs text-gray-500 mb-3">{d.fullName}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">{d.view}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{d.drillDuration}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Drill guide card */}
            <div className="bg-white rounded-2xl border border-gray-200 mb-5 overflow-hidden">
              {/* Camera setup */}
              <div className="p-5 border-b border-gray-100 bg-amber-50">
                <div className="flex items-start gap-3">
                  <Camera size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm text-amber-800 mb-1">Camera Setup — {drill.view}</div>
                    <div className="text-xs text-amber-700 leading-relaxed">{drill.cameraSetup}</div>
                  </div>
                </div>
              </div>

              {/* Toggle: athlete instructions */}
              <button
                onClick={() => setShowGuide(showGuide === drill.id ? null : drill.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <span className="font-bold text-sm text-gray-700">How to perform — step-by-step athlete instructions</span>
                </div>
                {showGuide === drill.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {showGuide === drill.id && (
                <div className="px-5 pb-5">
                  <div className="space-y-3 mb-5">
                    {drill.athleteInstructions.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>

                  {/* Drill specs */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Duration", value: drill.drillDuration },
                      { label: "Reps",     value: drill.reps },
                      { label: "Equipment", value: drill.equipment },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                        <div className="text-xs text-gray-400 font-semibold uppercase mb-1">{s.label}</div>
                        <div className="text-xs text-gray-700 font-medium">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* What it measures */}
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">What the system measures & why</div>
                  <div className="space-y-3">
                    {drill.whatItMeasures.map((m) => (
                      <div key={m.metric} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="font-bold text-sm text-blue-800 mb-1">{m.metric}</div>
                        <div className="text-xs text-blue-700 leading-relaxed">{m.why}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-green-600 bg-green-50 p-10 text-center cursor-pointer hover:bg-green-100 transition-colors"
            >
              <Upload size={36} className="mx-auto mb-3 text-green-700" />
              <div className="font-bold text-green-800 text-base mb-1">Upload drill clip to analyse</div>
              <div className="text-sm text-gray-500">mp4, mov, avi · max 500 MB</div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          </>
        )}

        {/* ── STAGE: Uploading ─────────────────────────────────────────────── */}
        {stage === "upload" && (
          <ProcessingCard
            icon={<Upload size={40} className="text-green-700" />}
            title="Uploading video…"
            subtitle={`${uploadPct}% complete`}
            bar={uploadPct}
          />
        )}

        {/* ── STAGE: YOLOv8 detecting ────────────────────────────────────────── */}
        {stage === "detecting" && (
          <ProcessingCard
            icon={<Zap size={40} className="text-purple-600" />}
            title="YOLOv8 detecting players…"
            subtitle="ByteTracker assigning player IDs · classifying teams by jersey colour"
            spinning
          />
        )}

        {/* ── STAGE: MediaPipe analysing ─────────────────────────────────────── */}
        {stage === "analysing" && (
          <ProcessingCard
            icon={<Activity size={40} className="text-cyan-600" />}
            title="MediaPipe analysing joint angles…"
            subtitle="33-landmark pose computed per player crop · measuring trunk, knee, ankle vectors"
            spinning
          />
        )}

        {/* ── STAGE: Scoring ─────────────────────────────────────────────────── */}
        {stage === "scoring" && (
          <ProcessingCard
            icon={<CheckCircle2 size={40} className="text-emerald-500" />}
            title="Computing indices…"
            subtitle="Performance Index and Structural Resilience Index calculated per player"
            spinning
          />
        )}

        {/* ── STAGE: Error ───────────────────────────────────────────────────── */}
        {stage === "error" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center max-w-md mx-auto">
            <AlertTriangle size={40} className="mx-auto mb-3 text-red-500" />
            <div className="font-bold text-lg text-gray-900 mb-2">Analysis failed</div>
            <div className="text-sm text-gray-500 mb-6">{errMsg}</div>
            <button
              onClick={() => { setStage("select"); setErrMsg(""); }}
              className="bg-green-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── STAGE: Results ─────────────────────────────────────────────────── */}
        {stage === "results" && result?.players && (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div>
                <h2 className="font-black text-xl text-gray-900">Analysis Complete</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {drill.fullName} · {result.frames_processed ?? "—"} frames · {(result.players ?? []).length} players detected
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setStage("select"); setResult(null); setJobId(null); }}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-gray-100 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors">
                  <RefreshCw size={14} /> New scan
                </button>
                <button onClick={exportPDF}
                  className="flex items-center gap-1.5 text-sm font-bold bg-amber-600 text-white px-3 py-2 rounded-xl hover:bg-amber-500 transition-colors">
                  <Download size={14} /> PDF Report
                </button>
              </div>
            </div>

            {/* Score legend */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Score guide</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                  <div className="font-bold text-sm text-green-800 mb-1">Performance Index</div>
                  <div className="text-xs text-green-700">Combines Knee Drive + Trunk Lean + Heel Recovery. Grades raw athletic explosiveness and acceleration mechanics.</div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                  <div className="font-bold text-sm text-amber-800 mb-1">Structural Resilience Index</div>
                  <div className="text-xs text-amber-700">Combines Knee Valgus + Bilateral Asymmetry + Amortization. Maps injury risk profile and deceleration quality.</div>
                </div>
              </div>
            </div>

            {/* Team summary */}
            {result.team_stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
                {[
                  { label: "Home Performance",  value: result.team_stats.home_avg_performance },
                  { label: "Away Performance",  value: result.team_stats.away_avg_performance },
                  { label: "Home Resilience",   value: result.team_stats.home_avg_resilience },
                  { label: "Away Resilience",   value: result.team_stats.away_avg_resilience },
                  { label: "Players at Risk",   value: result.team_stats.players_at_risk, isCount: true },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase mb-1">{s.label}</div>
                    <div className="text-2xl font-black" style={{ color: s.isCount ? "#ef4444" : scoreColour(s.value) }}>
                      {s.value}{!s.isCount && "/100"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team filter */}
            <div className="flex gap-2 mb-4">
              {(["all", "home", "away"] as TeamFilter[]).map((f) => (
                <button key={f} onClick={() => setTeamFilter(f)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold border transition-all capitalize"
                  style={{
                    backgroundColor: teamFilter === f ? "#1a5c2a" : "#fff",
                    borderColor: teamFilter === f ? "#1a5c2a" : "#e5e5e5",
                    color: teamFilter === f ? "#fff" : "#374151",
                  }}>
                  {f === "all"
                    ? `All (${(result.players ?? []).filter((p) => p.team !== "referee").length})`
                    : `${f.charAt(0).toUpperCase() + f.slice(1)} (${(result.players ?? []).filter((p) => p.team === f).length})`}
                </button>
              ))}
            </div>

            {/* Player cards */}
            <div className="flex flex-col gap-3">
              {players.map((p) => {
                const isOpen  = expanded.has(p.id);
                const teamClr = p.team === "home" ? "#1a5c2a" : "#1e40af";
                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => toggleExpand(p.id)}
                    >
                      {/* Team avatar */}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-white text-sm"
                        style={{ backgroundColor: teamClr }}>
                        #{p.id}
                      </div>

                      {/* Score circles */}
                      <div className="flex gap-5 flex-1 flex-wrap">
                        <ScoreCircle label="Performance" value={p.performance_index} />
                        <ScoreCircle label="Resilience"  value={p.resilience_index}  />
                      </div>

                      {/* Flags */}
                      <div className="flex flex-wrap gap-1.5 max-w-48">
                        {p.flags.slice(0, 3).map((f) => {
                          const fm = FLAG_META[f] ?? { label: f, bg: "#f3f4f6", text: "#374151", border: "#e5e5e5" };
                          return (
                            <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{ backgroundColor: fm.bg, color: fm.text, border: `1px solid ${fm.border}` }}>
                              {fm.label}
                            </span>
                          );
                        })}
                      </div>

                      {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                          {drill.metrics.map((key) => {
                            const meta = METRIC_META[key];
                            if (!meta) return null;
                            const val  = p.metrics[key] ?? 0;
                            const pct  = barPct(val, meta.lowerIsBetter);
                            const bg   = barBg(val, meta.lowerIsBetter);
                            const col  = scoreColour(val, meta.lowerIsBetter);
                            return (
                              <div key={key}>
                                <div className="flex justify-between items-center mb-1.5">
                                  <span className="text-xs text-gray-500 font-semibold">{meta.label}</span>
                                  <span className="text-sm font-black" style={{ color: col }}>{val}{meta.unit}</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: bg }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {players.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <User size={40} className="mx-auto mb-3 opacity-30" />
                  <div className="font-semibold">No {teamFilter === "all" ? "" : teamFilter + " "}players detected</div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ProcessingCard({
  icon, title, subtitle, bar, spinning,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bar?: number;
  spinning?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto mt-10">
      <div className="flex justify-center mb-4" style={{ animation: spinning ? "spin 1.8s linear infinite" : undefined }}>
        {icon}
      </div>
      <div className="font-bold text-lg text-gray-900 mb-1.5">{title}</div>
      <div className="text-sm text-gray-500 mb-5">{subtitle}</div>
      {bar != null && (
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-700 rounded-full transition-all duration-300" style={{ width: `${bar}%` }} />
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ScoreCircle({ label, value }: { label: string; value: number }) {
  const colour = scoreColour(value);
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base"
        style={{ border: `3px solid ${colour}`, color: colour }}>
        {value}
      </div>
      <div>
        <div className="text-xs text-gray-500 font-semibold">{label}</div>
        <div className="text-[10px] text-gray-400">Index / 100</div>
      </div>
    </div>
  );
}
