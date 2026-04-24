"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, Play, Download, Loader2, CheckCircle2,
  AlertCircle, Eye, Crosshair, Shield, Zap, User, BookOpen,
  ChevronRight, BarChart3, Clock,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import jsPDF from "jspdf";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Frame { base64: string; timestamp: number; }

interface MatchEvent {
  time: string;
  team: "home" | "away" | "neutral";
  type: string;
  description: string;
}

interface MatchAnalysis {
  formation_home: string;
  formation_away: string;
  possession_home: number;
  possession_away: number;
  shots_home: number;
  shots_away: number;
  shots_on_target_home: number;
  shots_on_target_away: number;
  fouls_detected: number;
  key_events: MatchEvent[];
  tactical_patterns: string[];
  defensive_issues: string[];
  attacking_strengths: string[];
  man_of_match_candidate: string;
  halftime_recommendation: string;
  key_coaching_points: string[];
}

type Phase = "setup" | "extracting" | "analysing" | "report";
type Depth = "quick" | "standard" | "deep";

interface DepthOption { label: string; interval: number; desc: string; }

const DEPTH_CONFIG: Record<Depth, DepthOption> = {
  quick:    { label: "Quick",    interval: 600, desc: "1 frame / 10 min — fast overview" },
  standard: { label: "Standard", interval: 300, desc: "1 frame / 5 min — balanced analysis" },
  deep:     { label: "Deep",     interval: 120, desc: "1 frame / 2 min — full tactical detail" },
};

const EVENT_COLORS: Record<string, string> = {
  goal:         "text-green-400",
  shot:         "text-yellow-400",
  foul:         "text-red-400",
  corner:       "text-blue-400",
  "free kick":  "text-purple-400",
  offside:      "text-orange-400",
  card:         "text-red-500",
  substitution: "text-cyan-400",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function eventColor(type: string): string {
  const key = Object.keys(EVENT_COLORS).find((k) => type.toLowerCase().includes(k));
  return key ? EVENT_COLORS[key] : "text-white/80";
}

// ── Frame extraction using HTML5 Canvas ───────────────────────────────────────

async function extractFrames(
  videoFile: File,
  intervalSeconds: number,
  onProgress: (done: number, total: number) => void
): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.src = URL.createObjectURL(videoFile);

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      const timestamps: number[] = [];
      for (let t = 0; t < duration; t += intervalSeconds) {
        timestamps.push(Math.min(t, duration - 0.5));
      }

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d")!;
      const frames: Frame[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        await new Promise<void>((seekResolve, seekReject) => {
          const timeout = setTimeout(() => seekReject(new Error("Seek timeout")), 5000);
          video.onseeked = () => { clearTimeout(timeout); seekResolve(); };
          video.currentTime = timestamps[i];
        });

        ctx.drawImage(video, 0, 0, 640, 360);
        const base64 = canvas.toDataURL("image/jpeg", 0.75).split(",")[1];
        frames.push({ base64, timestamp: timestamps[i] });
        onProgress(i + 1, timestamps.length);
      }

      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = () => reject(new Error("Could not load video file"));
  });
}

// ── PDF Export ────────────────────────────────────────────────────────────────

function exportPDF(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  analysis: MatchAnalysis,
  narrative: string,
  framesCount: number
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

  // Header bar
  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(240, 180, 41);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("MATCH EYE — AI VISION REPORT", W / 2, 10, { align: "center" });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`${homeTeam} vs ${awayTeam}${competition ? `  |  ${competition}` : ""}`, W / 2, 18, { align: "center" });
  doc.setFontSize(8);
  doc.text(`Analysed from ${framesCount} video frames  |  Powered by Gemini + Claude`, W / 2, 24, { align: "center" });
  y = 36;

  // Stats row
  doc.setFillColor(240, 180, 41);
  doc.rect(10, y, W - 20, 0.5, "F");
  y += 6;

  const stats = [
    [`Formation`, analysis.formation_home, analysis.formation_away],
    [`Possession`, `${analysis.possession_home}%`, `${analysis.possession_away}%`],
    [`Shots`, String(analysis.shots_home), String(analysis.shots_away)],
    [`On Target`, String(analysis.shots_on_target_home), String(analysis.shots_on_target_away)],
    [`Fouls`, String(analysis.fouls_detected), "—"],
  ];

  doc.setFontSize(8);
  doc.setTextColor(26, 92, 42);
  doc.setFont("helvetica", "bold");
  doc.text(homeTeam, 65, y, { align: "center" });
  doc.text(awayTeam, 145, y, { align: "center" });
  y += 5;

  for (const [label, home, away] of stats) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(label, 105, y, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 92, 42);
    doc.text(home, 65, y, { align: "center" });
    doc.text(away, 145, y, { align: "center" });
    y += 6;
  }

  y += 4;
  doc.setFillColor(240, 180, 41);
  doc.rect(10, y, W - 20, 0.5, "F");
  y += 8;

  const section = (title: string, color: [number, number, number]) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(title, 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
  };

  const bullet = (text: string) => {
    const lines = doc.splitTextToSize(`• ${text}`, W - 30);
    doc.text(lines, 16, y);
    y += lines.length * 5 + 1;
    if (y > 270) { doc.addPage(); y = 20; }
  };

  // Tactical Narrative
  if (narrative) {
    section("TACTICAL NARRATIVE", [26, 92, 42]);
    const lines = doc.splitTextToSize(narrative, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
    if (y > 270) { doc.addPage(); y = 20; }
  }

  // Tactical Patterns
  if (analysis.tactical_patterns?.length) {
    section("TACTICAL PATTERNS", [26, 92, 42]);
    for (const p of analysis.tactical_patterns) bullet(p);
    y += 2;
  }

  // Defensive Issues
  if (analysis.defensive_issues?.length) {
    section("DEFENSIVE ISSUES", [180, 30, 30]);
    for (const d of analysis.defensive_issues) bullet(d);
    y += 2;
  }

  // Attacking Strengths
  if (analysis.attacking_strengths?.length) {
    section("ATTACKING STRENGTHS", [26, 130, 60]);
    for (const a of analysis.attacking_strengths) bullet(a);
    y += 2;
  }

  // Key Events
  if (analysis.key_events?.length) {
    section("KEY EVENTS TIMELINE", [70, 50, 150]);
    for (const e of analysis.key_events) {
      bullet(`${e.time} [${e.team.toUpperCase()}] ${e.type} — ${e.description}`);
    }
    y += 2;
  }

  // Coaching Points
  if (analysis.key_coaching_points?.length) {
    section("KEY COACHING POINTS", [26, 92, 42]);
    for (const p of analysis.key_coaching_points) bullet(p);
    y += 2;
  }

  // Man of Match
  if (analysis.man_of_match_candidate) {
    section("MAN OF THE MATCH CANDIDATE", [180, 130, 10]);
    const lines = doc.splitTextToSize(analysis.man_of_match_candidate, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `GrassRoots Sports — Match Eye AI Vision  |  Page ${i} of ${pageCount}  |  Confidential`,
      W / 2, 292, { align: "center" }
    );
  }

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`match-eye-${homeTeam}-vs-${awayTeam}-${date}.pdf`);
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function MatchEyePage() {
  const { user } = useAuthStore();

  const [phase, setPhase]           = useState<Phase>("setup");
  const [videoFile, setVideoFile]   = useState<File | null>(null);
  const [dragOver, setDragOver]     = useState(false);
  const [homeTeam, setHomeTeam]     = useState("");
  const [awayTeam, setAwayTeam]     = useState("");
  const [competition, setCompetition] = useState("");
  const [sport, setSport]           = useState("football");
  const [depth, setDepth]           = useState<Depth>("standard");

  const [extractProgress, setExtractProgress] = useState({ done: 0, total: 0 });
  const [statusLog, setStatusLog]   = useState<string[]>([]);
  const [error, setError]           = useState("");

  const [analysis, setAnalysis]     = useState<MatchAnalysis | null>(null);
  const [narrative, setNarrative]   = useState("");
  const [framesCount, setFramesCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const log = useCallback((msg: string) => {
    setStatusLog((prev) => [...prev, msg]);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file (mp4, mov, avi, mkv)");
      return;
    }
    setVideoFile(file);
    setError("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const runAnalysis = async () => {
    if (!videoFile || !homeTeam.trim() || !awayTeam.trim()) {
      setError("Enter team names and select a video file before analysing.");
      return;
    }

    setError("");
    setStatusLog([]);
    setPhase("extracting");

    try {
      // Step 1: Extract frames
      log(`Extracting frames from video (${DEPTH_CONFIG[depth].desc})...`);
      const interval = DEPTH_CONFIG[depth].interval;
      const frames = await extractFrames(videoFile, interval, (done, total) => {
        setExtractProgress({ done, total });
      });

      log(`Extracted ${frames.length} frames. Sending to Gemini Vision AI...`);
      setPhase("analysing");

      // Step 2: Send to API
      const res = await fetch("/api/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frames,
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          competition: competition.trim(),
          sport,
        }),
      });

      log("Gemini analysis complete. Generating tactical narrative with Claude...");

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as {
        analysis: MatchAnalysis;
        narrative: string;
        framesAnalysed: number;
      };

      setAnalysis(data.analysis);
      setNarrative(data.narrative);
      setFramesCount(data.framesAnalysed);
      log("Report ready.");
      setPhase("report");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setPhase("setup");
    }
  };

  const resetAll = () => {
    setPhase("setup");
    setVideoFile(null);
    setAnalysis(null);
    setNarrative("");
    setStatusLog([]);
    setError("");
    setExtractProgress({ done: 0, total: 0 });
  };

  // ── Setup Phase ──────────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Match Eye</p>
          <h1 className="mt-1 text-2xl font-bold text-white">AI Vision Match Analysis</h1>
          <p className="mt-0.5 text-sm text-white/60">
            Upload a match video. Gemini watches it. Claude writes the report.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Left — Match setup */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-accent">Match Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Home Team *</label>
                    <input
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      placeholder="e.g. Dynamos FC"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Away Team *</label>
                    <input
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      placeholder="e.g. Highlanders FC"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Competition</label>
                    <input
                      value={competition}
                      onChange={(e) => setCompetition(e.target.value)}
                      placeholder="e.g. Premier League"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-white/60">Sport</label>
                    <select
                      value={sport}
                      onChange={(e) => setSport(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#1a3d26] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      {["football", "rugby", "netball", "basketball", "cricket", "hockey"].map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Analysis depth */}
              <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-accent">Analysis Depth</p>
                <div className="space-y-2">
                  {(Object.entries(DEPTH_CONFIG) as [Depth, DepthOption][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDepth(key)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        depth === key
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                      }`}
                    >
                      <span className="text-sm font-semibold">{cfg.label}</span>
                      <span className="text-xs opacity-70">{cfg.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* What Gemini detects */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#4a1a8a]/30 to-transparent p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-300">What Gemini Detects</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Formations & shapes",
                    "Shots & goals",
                    "Possession patterns",
                    "Defensive issues",
                    "Pressing triggers",
                    "Individual highlights",
                    "Set piece patterns",
                    "Tactical trends",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-white/70">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Video upload */}
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex min-h-[240px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all ${
                  dragOver
                    ? "border-accent bg-accent/10"
                    : videoFile
                    ? "border-green-500 bg-green-500/10"
                    : "border-white/20 bg-white/5 hover:border-accent/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />

                {videoFile ? (
                  <>
                    <CheckCircle2 className="mb-3 h-10 w-10 text-green-400" />
                    <p className="text-sm font-semibold text-green-400">{videoFile.name}</p>
                    <p className="mt-1 text-xs text-white/50">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB — click to change
                    </p>
                    <p className="mt-3 text-xs text-white/40">
                      Estimated frames: ~{Math.ceil(videoFile.size / (1024 * 1024 * 0.5) / DEPTH_CONFIG[depth].interval * 60)} frames
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-3 h-10 w-10 text-white/40" />
                    <p className="text-sm font-semibold text-white/70">Drop match video here</p>
                    <p className="mt-1 text-xs text-white/40">or click to browse</p>
                    <p className="mt-3 text-xs text-white/30">mp4 · mov · avi · mkv · webm</p>
                  </>
                )}
              </div>

              {/* Processing info */}
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">How It Works</p>
                {[
                  { icon: Upload,    label: "Upload",   desc: "Your video stays in your browser" },
                  { icon: Eye,       label: "Extract",  desc: "Frames captured at your chosen interval" },
                  { icon: Zap,       label: "Gemini",   desc: "Google AI watches every frame, detects events" },
                  { icon: BookOpen,  label: "Claude",   desc: "Writes a professional tactical report" },
                  { icon: Download,  label: "Export",   desc: "Download as PDF — ready for team meeting" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 py-1.5">
                    <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
                    <div>
                      <span className="text-xs font-semibold text-white">{label}</span>
                      <span className="ml-2 text-xs text-white/50">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={runAnalysis}
                disabled={!videoFile || !homeTeam.trim() || !awayTeam.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] transition-all hover:bg-[#f5c542] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                Analyse Match with AI
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Processing Phase ──────────────────────────────────────────────────────────

  if (phase === "extracting" || phase === "analysing") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b429]/10">
              <Loader2 className="h-10 w-10 animate-spin text-[#f0b429]" />
            </div>

            <div>
              <p className="text-lg font-bold text-white">
                {phase === "extracting" ? "Extracting Match Frames" : "Gemini is Watching..."}
              </p>
              <p className="mt-1 text-sm text-white/50">
                {phase === "extracting"
                  ? `Capturing frame ${extractProgress.done} of ${extractProgress.total}`
                  : "Google AI is analysing every frame for tactical patterns"}
              </p>
            </div>

            {phase === "extracting" && extractProgress.total > 0 && (
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#f0b429] transition-all"
                    style={{ width: `${(extractProgress.done / extractProgress.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-white/40">
                  {Math.round((extractProgress.done / extractProgress.total) * 100)}% complete
                </p>
              </div>
            )}

            {/* Status log */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
              {statusLog.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                  <p className="text-xs text-white/70">{msg}</p>
                </div>
              ))}
              {phase === "analysing" && (
                <div className="flex items-center gap-2 py-0.5">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" />
                  <p className="text-xs text-white/50">Processing with Gemini 1.5 Pro + Claude...</p>
                </div>
              )}
            </div>

            <p className="text-xs text-white/30">
              This takes 30–90 seconds depending on analysis depth. Do not close this tab.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // ── Report Phase ──────────────────────────────────────────────────────────────

  if (phase === "report" && analysis) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">

          {/* Report header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Match Eye Report</p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                {homeTeam} vs {awayTeam}
              </h1>
              <p className="mt-0.5 text-sm text-white/50">
                {competition && `${competition} · `}Analysed from {framesCount} frames · Gemini 1.5 Pro + Claude
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetAll}
                className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                New Match
              </button>
              <button
                onClick={() => exportPDF(homeTeam, awayTeam, competition, analysis, narrative, framesCount)}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-sm font-bold text-[#1a3a1a] hover:bg-[#f5c542]"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-card/60 p-5 sm:grid-cols-5">
            {[
              { label: "Formation", home: analysis.formation_home, away: analysis.formation_away },
              { label: "Possession", home: `${analysis.possession_home}%`, away: `${analysis.possession_away}%` },
              { label: "Shots", home: analysis.shots_home, away: analysis.shots_away },
              { label: "On Target", home: analysis.shots_on_target_home, away: analysis.shots_on_target_away },
              { label: "Fouls", home: analysis.fouls_detected, away: "—" },
            ].map(({ label, home, away }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-white/40">{label}</p>
                <div className="mt-1 flex items-center justify-center gap-3">
                  <span className="text-sm font-bold text-green-400">{home}</span>
                  <span className="text-[10px] text-white/20">vs</span>
                  <span className="text-sm font-bold text-blue-400">{away}</span>
                </div>
                <div className="mt-1 flex justify-between px-2 text-[9px] text-white/30">
                  <span>{homeTeam.split(" ")[0]}</span>
                  <span>{awayTeam.split(" ")[0]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Left column — narrative + patterns */}
            <div className="space-y-5 lg:col-span-2">

              {/* Tactical Narrative */}
              {narrative && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">Tactical Narrative</p>
                    <span className="ml-auto rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                      Claude
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/80 whitespace-pre-line">{narrative}</p>
                </div>
              )}

              {/* Tactical Patterns */}
              {analysis.tactical_patterns?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">Tactical Patterns</p>
                  </div>
                  <div className="space-y-2">
                    {analysis.tactical_patterns.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg bg-white/5 p-2.5">
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent" />
                        <p className="text-sm text-white/80">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Timeline */}
              {analysis.key_events?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">Key Events</p>
                  </div>
                  <div className="space-y-2">
                    {analysis.key_events.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 border-l-2 border-white/10 pl-3">
                        <span className="mt-0.5 w-10 flex-shrink-0 text-xs font-mono text-accent">{e.time}</span>
                        <div>
                          <span className={`text-xs font-bold uppercase ${eventColor(e.type)}`}>{e.type}</span>
                          <span className="ml-2 text-xs text-white/40">
                            [{e.team === "home" ? homeTeam : e.team === "away" ? awayTeam : "Neutral"}]
                          </span>
                          <p className="text-xs text-white/70">{e.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column — intel cards */}
            <div className="space-y-4">

              {/* Defensive Issues */}
              {analysis.defensive_issues?.length > 0 && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400">Defensive Issues</p>
                  </div>
                  {analysis.defensive_issues.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-400" />
                      <p className="text-xs text-red-200">{d}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Attacking Strengths */}
              {analysis.attacking_strengths?.length > 0 && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-green-400" />
                    <p className="text-xs font-bold uppercase tracking-widest text-green-400">Attacking Strengths</p>
                  </div>
                  {analysis.attacking_strengths.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-400" />
                      <p className="text-xs text-green-200">{a}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Key Coaching Points */}
              {analysis.key_coaching_points?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Coaching Points</p>
                  {analysis.key_coaching_points.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 py-1">
                      <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                      <p className="text-xs text-white/70">{p}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Man of Match */}
              {analysis.man_of_match_candidate && (
                <div className="rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#f0b429]" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">Man of the Match</p>
                  </div>
                  <p className="text-sm text-white/80">{analysis.man_of_match_candidate}</p>
                </div>
              )}

              {/* Halftime Recommendation */}
              {analysis.halftime_recommendation && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                    Halftime Recommendation
                  </p>
                  <p className="text-xs text-blue-200">{analysis.halftime_recommendation}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
