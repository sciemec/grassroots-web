"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, Play, Download, Loader2, CheckCircle2,
  AlertCircle, Eye, Crosshair, Shield, Zap, User, BookOpen,
  ChevronRight, BarChart3, Clock, Activity,
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import jsPDF from "jspdf";
import TrackingDashboard, { type TrackingData } from "@/components/match-eye/TrackingDashboard";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type Phase = "setup" | "uploading" | "processing" | "report";
type TrackingPhase = "idle" | "uploading" | "processing" | "done" | "error";

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

function eventColor(type: string): string {
  const key = Object.keys(EVENT_COLORS).find((k) => type.toLowerCase().includes(k));
  return key ? EVENT_COLORS[key] : "text-white/80";
}

// ── PDF Export ────────────────────────────────────────────────────────────────

function exportPDF(
  homeTeam: string,
  awayTeam: string,
  competition: string,
  analysis: MatchAnalysis,
  narrative: string
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 0;

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
  doc.text("Full-match video analysis  |  Gemini 1.5 Pro + Claude", W / 2, 24, { align: "center" });
  y = 36;

  doc.setFillColor(240, 180, 41);
  doc.rect(10, y, W - 20, 0.5, "F");
  y += 6;

  const stats = [
    ["Formation",  analysis.formation_home,                  analysis.formation_away],
    ["Possession", `${analysis.possession_home}%`,           `${analysis.possession_away}%`],
    ["Shots",      String(analysis.shots_home),              String(analysis.shots_away)],
    ["On Target",  String(analysis.shots_on_target_home),    String(analysis.shots_on_target_away)],
    ["Fouls",      String(analysis.fouls_detected),          "—"],
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

  if (narrative) {
    section("TACTICAL NARRATIVE", [26, 92, 42]);
    const lines = doc.splitTextToSize(narrative, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
    if (y > 270) { doc.addPage(); y = 20; }
  }

  if (analysis.tactical_patterns?.length) {
    section("TACTICAL PATTERNS", [26, 92, 42]);
    for (const p of analysis.tactical_patterns) bullet(p);
    y += 2;
  }

  if (analysis.defensive_issues?.length) {
    section("DEFENSIVE ISSUES", [180, 30, 30]);
    for (const d of analysis.defensive_issues) bullet(d);
    y += 2;
  }

  if (analysis.attacking_strengths?.length) {
    section("ATTACKING STRENGTHS", [26, 130, 60]);
    for (const a of analysis.attacking_strengths) bullet(a);
    y += 2;
  }

  if (analysis.key_events?.length) {
    section("KEY EVENTS TIMELINE", [70, 50, 150]);
    for (const e of analysis.key_events) {
      bullet(`${e.time} [${e.team.toUpperCase()}] ${e.type} — ${e.description}`);
    }
    y += 2;
  }

  if (analysis.key_coaching_points?.length) {
    section("KEY COACHING POINTS", [26, 92, 42]);
    for (const p of analysis.key_coaching_points) bullet(p);
    y += 2;
  }

  if (analysis.man_of_match_candidate) {
    section("MAN OF THE MATCH CANDIDATE", [180, 130, 10]);
    const lines = doc.splitTextToSize(analysis.man_of_match_candidate, W - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

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

  const [phase, setPhase]             = useState<Phase>("setup");
  const [videoFile, setVideoFile]     = useState<File | null>(null);
  const [dragOver, setDragOver]       = useState(false);
  const [homeTeam, setHomeTeam]       = useState("");
  const [awayTeam, setAwayTeam]       = useState("");
  const [competition, setCompetition] = useState("");
  const [sport, setSport]             = useState("football");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusLog, setStatusLog]           = useState<string[]>([]);
  const [error, setError]                   = useState("");

  const [analysis, setAnalysis]   = useState<MatchAnalysis | null>(null);
  const [narrative, setNarrative] = useState("");

  const [activeTab, setActiveTab]         = useState<"report" | "tracking">("report");
  const [trackingPhase, setTrackingPhase] = useState<TrackingPhase>("idle");
  const [trackingData, setTrackingData]   = useState<TrackingData | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [trackingProgress, setTrackingProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const log = useCallback((msg: string) => {
    setStatusLog((prev) => [...prev, msg]);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      setError("Please upload a video file (mp4, mov, avi, mkv, webm)");
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
    setUploadProgress(0);
    setPhase("uploading");

    try {
      const mimeType = videoFile.type || "video/mp4";
      log(`Preparing upload for ${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)...`);

      // ── Upload via Python AI service (server-to-server to Google, bypasses CORS) ─
      // Gemini File API does not serve CORS headers — browsers cannot PUT directly.
      // The Python service on Render has no body-size limit and proxies to Google.
      const trackerUrl = process.env.NEXT_PUBLIC_TRACKER_URL;
      if (!trackerUrl) {
        throw new Error("NEXT_PUBLIC_TRACKER_URL not configured — cannot upload video");
      }

      log(`Uploading ${videoFile.name} via AI service...`);
      const uploadFormData = new FormData();
      uploadFormData.append("file", videoFile);

      const uploadResult = await new Promise<{
        fileUri: string;
        fileName: string;
        mimeType: string;
        state?: string;
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${trackerUrl}/gemini-upload`);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText) as {
                fileUri: string;
                fileName: string;
                mimeType: string;
              });
            } catch {
              reject(new Error("Failed to parse upload response"));
            }
          } else {
            try {
              const body = JSON.parse(xhr.responseText) as { detail?: string };
              reject(new Error(body.detail ?? `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error(
          "Cannot reach AI service. Check NEXT_PUBLIC_TRACKER_URL in Vercel env vars."
        ));
        xhr.send(uploadFormData);
      });

      log("Upload complete. Gemini is processing the video...");
      setPhase("processing");
      // ── Step 2: Analyse with Gemini + Claude ──────────────────────────────────
      log("Gemini 1.5 Pro is watching the full match...");
      const res = await fetch("/api/match-eye/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri:     uploadResult.fileUri,
          fileName:    uploadResult.fileName,
          mimeType:    uploadResult.mimeType,
          fileState:   uploadResult.state,
          homeTeam:    homeTeam.trim(),
          awayTeam:    awayTeam.trim(),
          competition: competition.trim(),
          sport,
        }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? `Server error ${res.status}`);
      }

      const data = await res.json() as { analysis: MatchAnalysis; narrative: string };

      log("Analysis complete. Claude is writing the tactical report...");
      setAnalysis(data.analysis);
      setNarrative(data.narrative);
      log("Report ready.");
      setPhase("report");

      // Save to localStorage so other analyst tools can import visually
      try {
        localStorage.setItem("gs_match_eye_last", JSON.stringify({
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          competition: competition.trim(),
          sport,
          savedAt: new Date().toISOString(),
          analysis: data.analysis,
          narrative: data.narrative,
          trackingData: null,
        }));
      } catch {}
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
    setUploadProgress(0);
    setTrackingData(null);
    setTrackingPhase("idle");
    setTrackingError("");
    setActiveTab("report");
  };

  const runTracking = async () => {
    if (!videoFile) return;

    const trackerUrl = process.env.NEXT_PUBLIC_TRACKER_URL;
    if (!trackerUrl) {
      setTrackingError("Player tracking service URL not configured. Add NEXT_PUBLIC_TRACKER_URL to Vercel env vars.");
      setTrackingPhase("error");
      return;
    }

    setTrackingError("");
    setTrackingProgress(0);
    setTrackingPhase("uploading");

    try {
      const formData = new FormData();
      formData.append("file", videoFile);

      const result = await new Promise<TrackingData>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${trackerUrl}/track`);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setTrackingProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText) as TrackingData);
          } else {
            try {
              const body = JSON.parse(xhr.responseText) as { detail?: string };
              reject(new Error(body.detail ?? `Tracker error ${xhr.status}`));
            } catch {
              reject(new Error(`Tracker error ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Cannot reach tracking service — check NEXT_PUBLIC_TRACKER_URL"));
        xhr.send(formData);
      });

      setTrackingData(result);
      setTrackingPhase("done");
      // Merge tracking data into gs_match_eye_last so other tools can read it
      try {
        const existing = JSON.parse(localStorage.getItem("gs_match_eye_last") ?? "{}");
        localStorage.setItem("gs_match_eye_last", JSON.stringify({ ...existing, trackingData: result }));
      } catch {}
    } catch (err) {
      setTrackingError(err instanceof Error ? err.message : "Tracking failed");
      setTrackingPhase("error");
    }
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
            Upload your full match video. Gemini 1.5 Pro watches every second. Claude writes the report.
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

              {/* What Gemini detects */}
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#4a1a8a]/30 to-transparent p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-purple-300">
                  What Gemini Watches (Full Match)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Every second of footage",
                    "Formations & team shape",
                    "Shots, goals & key events",
                    "Possession patterns",
                    "Defensive issues",
                    "Pressing triggers",
                    "Individual highlights",
                    "Set piece patterns",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-xs text-white/70">
                      <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-green-400" />
                      {item}
                    </div>
                  ))}
                </div>

                {/* Vs frame extraction callout */}
                <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                  <p className="text-xs font-semibold text-purple-300">
                    Native Video Analysis — Not Frame Extraction
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    Gemini receives your actual video file and watches it natively — the same way a professional
                    analyst watches a match. No screenshots. No missed minutes.
                  </p>
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
                      Full video will be uploaded to Gemini for native analysis
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-3 h-10 w-10 text-white/40" />
                    <p className="text-sm font-semibold text-white/70">Drop full match video here</p>
                    <p className="mt-1 text-xs text-white/40">or click to browse</p>
                    <p className="mt-3 text-xs text-white/30">mp4 · mov · avi · mkv · webm · up to 2 GB</p>
                  </>
                )}
              </div>

              {/* How it works */}
              <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">How It Works</p>
                {[
                  { icon: Upload,   label: "Upload",    desc: "Full video sent to Gemini File API" },
                  { icon: Eye,      label: "Watch",     desc: "Gemini 1.5 Pro watches every second" },
                  { icon: Zap,      label: "Analyse",   desc: "Detects formations, events, patterns" },
                  { icon: BookOpen, label: "Report",    desc: "Claude writes the tactical narrative" },
                  { icon: Download, label: "Export",    desc: "Download PDF — ready for team meeting" },
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
                Analyse Full Match with Gemini
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Uploading Phase ───────────────────────────────────────────────────────────

  if (phase === "uploading") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b429]/10">
              <Upload className="h-10 w-10 text-[#f0b429]" />
            </div>

            <div>
              <p className="text-lg font-bold text-white">Uploading to Gemini</p>
              <p className="mt-1 text-sm text-white/50">
                Sending your match video to Google&apos;s servers for native AI analysis
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/40">
                <span>{videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : ""}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#f0b429] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-white/30">
                Upload speed depends on your internet connection
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
              {statusLog.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                  <p className="text-xs text-white/70">{msg}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 py-0.5">
                <Loader2 className="h-3 w-3 animate-spin text-[#f0b429]" />
                <p className="text-xs text-white/50">Uploading {uploadProgress}%...</p>
              </div>
            </div>

            <p className="text-xs text-white/30">Do not close this tab during upload.</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Processing Phase ──────────────────────────────────────────────────────────

  if (phase === "processing") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10">
              <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
            </div>

            <div>
              <p className="text-lg font-bold text-white">Gemini Is Watching Your Match</p>
              <p className="mt-1 text-sm text-white/50">
                Gemini 1.5 Pro is analysing every second of the full video
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-left">
              <p className="mb-2 text-xs font-semibold text-purple-300">What&apos;s happening now:</p>
              {[
                "Video uploaded — Gemini is ingesting the file",
                "Detecting player positions and formations",
                "Identifying shots, goals, fouls, and key events",
                "Analysing tactical patterns across the full 90 minutes",
                "Claude writing the professional tactical report",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-purple-400" />
                  <p className="text-xs text-white/60">{step}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
              {statusLog.map((msg, i) => (
                <div key={i} className="flex items-start gap-2 py-0.5">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                  <p className="text-xs text-white/70">{msg}</p>
                </div>
              ))}
              <div className="flex items-center gap-2 py-0.5">
                <Loader2 className="h-3 w-3 animate-spin text-purple-400" />
                <p className="text-xs text-white/50">Processing with Gemini 1.5 Pro + Claude...</p>
              </div>
            </div>

            <p className="text-xs text-white/30">
              This takes 1–3 minutes depending on video length. Do not close this tab.
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

          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">Match Eye Report</p>
              <h1 className="mt-1 text-2xl font-bold text-white">
                {homeTeam} vs {awayTeam}
              </h1>
              <p className="mt-0.5 text-sm text-white/50">
                {competition && `${competition} · `}Full-match video analysis · Gemini 1.5 Pro + Claude
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
                onClick={() => exportPDF(homeTeam, awayTeam, competition, analysis, narrative)}
                className="flex items-center gap-2 rounded-xl bg-[#f0b429] px-4 py-2 text-sm font-bold text-[#1a3a1a] hover:bg-[#f5c542]"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab("report")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "report"
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "border border-white/20 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              AI Match Report
            </button>
            <button
              onClick={() => {
                setActiveTab("tracking");
                if (trackingPhase === "idle") runTracking();
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "tracking"
                  ? "bg-[#4a1a8a] text-white"
                  : "border border-white/20 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <Activity className="h-4 w-4" />
              Player Tracking
              <span className="rounded-full bg-[#4a1a8a]/40 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                YOLOv8
              </span>
            </button>
          </div>

          {/* Tracking panel */}
          {activeTab === "tracking" && (
            <div className="mb-6">
              {(trackingPhase === "uploading" || trackingPhase === "processing") && (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-10 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
                  <div>
                    <p className="font-semibold text-white">
                      {trackingPhase === "uploading"
                        ? `Uploading video to tracker... ${trackingProgress}%`
                        : "YOLOv8 is tracking every player..."}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      {trackingPhase === "uploading"
                        ? "Sending video directly to the Python tracking service"
                        : "Detecting players, assigning IDs, building heatmaps — this takes ~5 minutes for a full match"}
                    </p>
                  </div>
                  {trackingPhase === "uploading" && (
                    <div className="w-full max-w-xs">
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-purple-400 transition-all duration-300"
                          style={{ width: `${trackingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {trackingPhase === "error" && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
                  <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
                  <p className="font-semibold text-red-300">Tracking failed</p>
                  <p className="mt-1 text-sm text-red-200/70">{trackingError}</p>
                  <button
                    onClick={runTracking}
                    className="mt-4 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300 hover:bg-red-500/30"
                  >
                    Retry Tracking
                  </button>
                </div>
              )}

              {trackingPhase === "done" && trackingData && (
                <TrackingDashboard
                  data={trackingData}
                  homeTeam={homeTeam}
                  awayTeam={awayTeam}
                />
              )}
            </div>
          )}

          {/* Stats row + report columns — only shown on report tab */}
          {activeTab === "report" && <div className="mb-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-card/60 p-5 sm:grid-cols-5">
            {[
              { label: "Formation",  home: analysis.formation_home,              away: analysis.formation_away },
              { label: "Possession", home: `${analysis.possession_home}%`,       away: `${analysis.possession_away}%` },
              { label: "Shots",      home: analysis.shots_home,                  away: analysis.shots_away },
              { label: "On Target",  home: analysis.shots_on_target_home,        away: analysis.shots_on_target_away },
              { label: "Fouls",      home: analysis.fouls_detected,              away: "—" },
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
          </div>}

          {activeTab === "report" && <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* Left column */}
            <div className="space-y-5 lg:col-span-2">

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

              {analysis.tactical_patterns?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">Tactical Patterns</p>
                    <span className="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                      Gemini
                    </span>
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

              {analysis.key_events?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-card/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">Key Events</p>
                  </div>
                  <div className="space-y-2">
                    {analysis.key_events.map((e, i) => (
                      <div key={i} className="flex items-start gap-3 border-l-2 border-white/10 pl-3">
                        <span className="mt-0.5 w-10 flex-shrink-0 font-mono text-xs text-accent">{e.time}</span>
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

            {/* Right column */}
            <div className="space-y-4">

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

              {analysis.man_of_match_candidate && (
                <div className="rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#f0b429]" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#f0b429]">Man of the Match</p>
                  </div>
                  <p className="text-sm text-white/80">{analysis.man_of_match_candidate}</p>
                </div>
              )}

              {analysis.halftime_recommendation && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                    Halftime Recommendation
                  </p>
                  <p className="text-xs text-blue-200">{analysis.halftime_recommendation}</p>
                </div>
              )}
            </div>
          </div>}
        </main>
      </div>
    );
  }

  return null;
}
