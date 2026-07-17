"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, Camera, RefreshCw, CheckCircle2,
  AlertTriangle, Lightbulb, User, Send, Download,
  ChevronDown, ChevronUp, History, X, StopCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
const HISTORY_KEY = "gs_player_analysis_history";
const HISTORY_MAX = 50;

// ── Analysis types ────────────────────────────────────────────────────────────

const ANALYSIS_TYPES = [
  {
    id:          "movement",
    label:       "Movement & Sprint",
    emoji:       "🏃",
    desc:        "Body lean, knee drive, heel mechanics",
    metrics:     ["trunk_lean", "knee_drive", "heel_recovery"],
    injuryScreen: false,
  },
  {
    id:          "technique",
    label:       "Ball Technique",
    emoji:       "⚽",
    desc:        "Ball control, body shape, bilateral balance",
    metrics:     ["trunk_lean", "heel_recovery", "bilateral_asymmetry"],
    injuryScreen: false,
  },
  {
    id:          "resilience",
    label:       "Resilience & Landing",
    emoji:       "💪",
    desc:        "Knee control, landing quality, asymmetry",
    metrics:     ["knee_valgus", "bilateral_asymmetry", "landing_stiffness"],
    injuryScreen: true,
  },
  {
    id:          "posture",
    label:       "Posture & Balance",
    emoji:       "⚖️",
    desc:        "Trunk alignment, arm use, symmetry",
    metrics:     ["trunk_lean", "bilateral_asymmetry", "arm_swing"],
    injuryScreen: false,
  },
] as const;

type AnalysisId = typeof ANALYSIS_TYPES[number]["id"];

const METRIC_LABELS: Record<string, string> = {
  trunk_lean:          "Body Lean",
  knee_drive:          "Knee Drive",
  heel_recovery:       "Heel Pull-Back",
  knee_valgus:         "Knee Cave",
  bilateral_asymmetry: "Left-Right Balance",
  landing_stiffness:   "Landing Control",
  arm_swing:           "Arm Swing",
};

const LOWER_IS_BETTER = new Set(["knee_valgus", "bilateral_asymmetry"]);

// ── Types ─────────────────────────────────────────────────────────────────────

interface SquadPlayer {
  id: string;
  name: string;
  position?: string;
}

interface AnalysisResult {
  metrics:           Record<string, number>;
  performance_index: number;
  resilience_index:  number;
  flags:             string[];
}

interface HistoryEntry {
  id:                string;
  timestamp:         string;
  playerName:        string;
  analysisType:      string;
  analysisLabel:     string;
  performance_index: number;
  resilience_index:  number;
  flags:             string[];
  metrics:           Record<string, number>;
}

type Stage = "setup" | "source" | "uploading" | "processing" | "results" | "error";
type Source = "upload" | "camera";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(v: number, lower = false) {
  const good = lower ? v <= 30 : v >= 70;
  const ok   = lower ? v <= 55 : v >= 50;
  if (good) return "#10b981";
  if (ok)   return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(v: number, lower = false) {
  if (lower ? v <= 30 : v >= 70) return "Good";
  if (lower ? v <= 55 : v >= 50) return "OK";
  return "Needs work";
}

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[]; }
  catch { return []; }
}

function saveHistory(entry: HistoryEntry) {
  const list = loadHistory();
  list.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PlayerAnalysisPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // ── State ─────────────────────────────────────────────────────────────────
  const [stage,         setStage]         = useState<Stage>("setup");
  const [source,        setSource]        = useState<Source>("upload");
  const [analysisId,    setAnalysisId]    = useState<AnalysisId>("movement");
  const [playerName,    setPlayerName]    = useState("");
  const [squad,         setSquad]         = useState<SquadPlayer[]>([]);
  const [uploadPct,     setUploadPct]     = useState(0);
  const [result,        setResult]        = useState<AnalysisResult | null>(null);
  const [errMsg,        setErrMsg]        = useState("");
  const [thutoNote,     setThutoNote]     = useState("");
  const [thutoLoading,  setThutoLoading]  = useState(false);
  const [arenaPosted,   setArenaPosted]   = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [history,       setHistory]       = useState<HistoryEntry[]>([]);
  const [isRecording,   setIsRecording]   = useState(false);
  const [cameraReady,   setCameraReady]   = useState(false);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const fileRef      = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const mediaRef     = useRef<MediaRecorder | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const chunksRef    = useRef<Blob[]>([]);

  const analysisType = ANALYSIS_TYPES.find((a) => a.id === analysisId) ?? ANALYSIS_TYPES[0];

  // ── Load squad + history on mount ─────────────────────────────────────────
  useEffect(() => {
    setHistory(loadHistory());
    if (!token) return;
    fetch(`${API_URL}/coach/squad`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: unknown) => {
        const raw = (data as { data?: SquadPlayer[] }).data ?? (Array.isArray(data) ? (data as SquadPlayer[]) : []);
        setSquad(raw);
      })
      .catch(() => { /* squad unavailable — user can type name */ });
  }, [token]);

  // ── Cleanup camera on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Core: run 3-step Gemini pipeline ──────────────────────────────────────
  const runAnalysis = useCallback(async (file: File) => {
    if (!file.type.startsWith("video/")) {
      setErrMsg("Please choose a video file (mp4 or mov).");
      setStage("error");
      return;
    }

    setStage("uploading");
    setUploadPct(0);
    setResult(null);
    setThutoNote("");
    setArenaPosted(false);

    // Step 1 — get Google resumable session URL
    let uploadUrl: string;
    let mimeType: string;
    try {
      const initRes = await fetch("/api/match-eye/upload", {
        method:  "POST",
        headers: { "content-type": file.type, "x-content-length": String(file.size) },
      });
      if (!initRes.ok) throw new Error(`Upload init failed (${initRes.status}).`);
      const init = await initRes.json() as { uploadUrl: string; mimeType: string };
      uploadUrl = init.uploadUrl;
      mimeType  = init.mimeType;
    } catch {
      setErrMsg("Could not start upload. Check your internet and try again.");
      setStage("error");
      return;
    }

    // Step 2 — upload to Google directly (XHR for progress)
    let fileUri: string;
    let fileName: string;
    try {
      const googleRes = await new Promise<{ file: { uri: string; name: string } }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText) as { file: { uri: string; name: string } }); }
            catch { reject(new Error("Unexpected upload response.")); }
          } else {
            reject(new Error(`Upload failed (${xhr.status}). Try a shorter clip.`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload."));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", mimeType);
        xhr.send(file);
      });
      fileUri  = googleRes.file.uri;
      fileName = googleRes.file.name;
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setStage("error");
      return;
    }

    // Step 3 — Gemini analysis
    setStage("processing");
    try {
      const analysisRes = await fetch("/api/coach-drill-analysis", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fileUri, fileName, mimeType, drillId: analysisId }),
      });
      if (!analysisRes.ok) {
        const errData = await analysisRes.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? `Analysis failed (${analysisRes.status}).`);
      }
      const data = await analysisRes.json() as AnalysisResult;
      setResult(data);
      setStage("results");

      // Persist to history
      const entry: HistoryEntry = {
        id:                `${Date.now()}`,
        timestamp:         new Date().toISOString(),
        playerName:        playerName.trim() || "Unknown",
        analysisType:      analysisId,
        analysisLabel:     analysisType.label,
        performance_index: data.performance_index,
        resilience_index:  data.resilience_index,
        flags:             data.flags,
        metrics:           data.metrics,
      };
      saveHistory(entry);
      setHistory(loadHistory());
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "AI could not process the video. Try a clearer, shorter clip.");
      setStage("error");
    }
  }, [analysisId, analysisType.label, playerName]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
    } catch {
      setErrMsg("Camera access denied. Please allow camera access in your browser settings.");
      setStage("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      stopCamera();
      void runAnalysis(new File([blob], "recording.webm", { type: "video/webm" }));
    };
    mr.start();
    mediaRef.current = mr;
    setIsRecording(true);
  }, [runAnalysis, stopCamera]);

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
    setIsRecording(false);
  }, []);

  // ── THUTO coaching note ───────────────────────────────────────────────────
  const fetchThutoNote = useCallback(async (r: AnalysisResult) => {
    setThutoLoading(true);
    const prompt = [
      `A player just had a "${analysisType.label}" movement analysis.`,
      `Performance score: ${r.performance_index}/100. Resilience score: ${r.resilience_index}/100.`,
      r.flags.length ? `The AI flagged: ${r.flags.join(", ")}.` : "",
      "Give a 3-sentence plain English coaching note for a grassroots coach in Zimbabwe.",
      "Start with one strength, then one improvement, then one simple drill to try.",
    ].filter(Boolean).join(" ");

    try {
      const res = await fetch("/api/ai-coach", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:       prompt,
          system_prompt: "You are THUTO, a supportive sports coach helping grassroots athletes in Zimbabwe. Be specific, encouraging, and practical.",
        }),
      });
      const data = await res.json() as { response?: string };
      setThutoNote(data.response ?? "");
    } catch {
      setThutoNote("");
    } finally {
      setThutoLoading(false);
    }
  }, [analysisType.label]);

  useEffect(() => {
    if (stage === "results" && result) void fetchThutoNote(result);
  }, [stage, result, fetchThutoNote]);

  // ── Share to Arena ────────────────────────────────────────────────────────
  const postToArena = useCallback(async () => {
    if (!token || !result || arenaPosted) return;
    const name = playerName.trim() || "a player";
    const body = `Player Analysis: ${analysisType.label} for ${name}. Performance: ${result.performance_index}/100. Resilience: ${result.resilience_index}/100.${result.flags.length ? ` Flags: ${result.flags.join(", ")}.` : ""}`;
    try {
      await fetch(`${API_URL}/arena/posts`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ body, post_type: "milestone", activity_type: "player_analysis" }),
      });
      setArenaPosted(true);
    } catch { /* silent */ }
  }, [token, result, arenaPosted, analysisType.label, playerName]);

  // ── Export JSON ───────────────────────────────────────────────────────────
  const exportJSON = useCallback(() => {
    if (!result) return;
    const payload = {
      exported_at:       new Date().toISOString(),
      player:            playerName.trim() || "Unknown",
      analysis_type:     analysisType.label,
      performance_index: result.performance_index,
      resilience_index:  result.resilience_index,
      flags:             result.flags,
      metrics:           result.metrics,
      thuto_note:        thutoNote || null,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${(playerName.trim() || "player").replace(/\s+/g, "-")}-${analysisId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, playerName, analysisType.label, analysisId, thutoNote]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    stopCamera();
    setStage("setup");
    setResult(null);
    setThutoNote("");
    setArenaPosted(false);
    setErrMsg("");
    setUploadPct(0);
  };

  // ── Move to source selection ───────────────────────────────────────────────
  const goToSource = () => {
    if (source === "camera") void startCamera();
    setStage("source");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/coach"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Coach Hub
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">Player Analysis</span>
          </div>
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
          >
            <History size={12} />
            History{history.length > 0 ? ` (${history.length})` : ""}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-20 space-y-5">

        {/* ── History panel ──────────────────────────────────────────────── */}
        {showHistory && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
                Analysis History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">No analyses yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                {history.slice(0, 20).map((h) => (
                  <div key={h.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{h.playerName}</p>
                      <p className="text-[11px] text-gray-500">{h.analysisLabel} · {new Date(h.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-xs font-black" style={{ color: scoreColor(h.performance_index) }}>
                          {h.performance_index}
                        </span>
                        <span className="text-[10px] text-gray-400"> perf</span>
                      </div>
                      <div>
                        <span className="text-xs font-black" style={{ color: scoreColor(h.resilience_index) }}>
                          {h.resilience_index}
                        </span>
                        <span className="text-[10px] text-gray-400"> res</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Stage: Setup ───────────────────────────────────────────────── */}
        {stage === "setup" && (
          <>
            {/* Player selection */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
                Player
              </p>
              {squad.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white outline-none focus:border-[#1a5c2a]"
                  >
                    <option value="">— select squad player —</option>
                    {squad.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}{p.position ? ` · ${p.position}` : ""}</option>
                    ))}
                    <option value="">— type name instead —</option>
                  </select>
                  {!playerName && (
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                      <User size={14} className="text-gray-400 shrink-0" />
                      <input
                        placeholder="Or type player name"
                        className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-300"
                        onChange={(e) => setPlayerName(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Player name (optional)"
                    className="flex-1 text-sm text-gray-800 outline-none placeholder-gray-300"
                  />
                </div>
              )}
              {!user && (
                <p className="text-[11px] text-gray-400 mt-2">
                  Guest mode — analysis works without login. <Link href="/login" className="text-[#1a5c2a] font-semibold">Sign in</Link> to save history.
                </p>
              )}
            </div>

            {/* Analysis type */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
                Analysis Type
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ANALYSIS_TYPES.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setAnalysisId(a.id)}
                    className="text-left p-3.5 rounded-xl border-2 transition-all"
                    style={{
                      borderColor:     analysisId === a.id ? "#1a5c2a" : "#e5e7eb",
                      backgroundColor: analysisId === a.id ? "#f0fdf4" : "#fff",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{a.emoji}</span>
                      <span className="text-xs font-bold text-gray-900 leading-tight">{a.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-snug">{a.desc}</p>
                    {a.injuryScreen && (
                      <span className="inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                        Injury screen
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Source selection */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
                Video Source
              </p>
              <div className="grid grid-cols-2 gap-3">
                {(["upload", "camera"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor:     source === s ? "#1a5c2a" : "#e5e7eb",
                      backgroundColor: source === s ? "#f0fdf4" : "#fff",
                    }}
                  >
                    {s === "upload"
                      ? <Upload size={20} style={{ color: source === s ? "#1a5c2a" : "#9ca3af" }} />
                      : <Camera size={20} style={{ color: source === s ? "#1a5c2a" : "#9ca3af" }} />}
                    <span className="text-xs font-semibold text-gray-700">{s === "upload" ? "Upload video" : "Use camera"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={goToSource}
              className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-colors"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Continue → {source === "upload" ? "Upload Video" : "Open Camera"}
            </button>
          </>
        )}

        {/* ── Stage: Source (upload or camera) ───────────────────────────── */}
        {stage === "source" && (
          <>
            {/* Back + analysis type label */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { stopCamera(); setStage("setup"); setCameraReady(false); }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
              >
                <ArrowLeft size={15} /> Back
              </button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                {analysisType.emoji} {analysisType.label}
              </span>
            </div>

            {source === "upload" ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div
                  className="rounded-xl border-2 border-dashed border-gray-300 p-10 text-center cursor-pointer hover:border-[#1a5c2a] hover:bg-[#f0fdf4] transition-all"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void runAnalysis(f); }}
                >
                  <Upload size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">Tap to choose video or drag it here</p>
                  <p className="text-[11px] text-gray-400 mt-1">mp4 or mov · under 200MB · max 60 seconds</p>
                  <button
                    className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    Choose video file
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) void runAnalysis(f); }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full rounded-xl bg-gray-900 aspect-video object-cover"
                />
                {!cameraReady ? (
                  <button
                    onClick={() => void startCamera()}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    <Camera size={15} className="inline mr-2" />
                    Start Camera
                  </button>
                ) : isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 animate-pulse"
                    style={{ backgroundColor: "#dc2626" }}
                  >
                    <StopCircle size={16} />
                    Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#1a5c2a" }}
                  >
                    <Camera size={15} />
                    Start Recording
                  </button>
                )}
                <p className="text-[11px] text-gray-400 text-center">
                  Record the movement, then tap Stop. Video is analysed immediately.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Stage: Uploading ───────────────────────────────────────────── */}
        {stage === "uploading" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">📤</div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Uploading video...</h2>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2 max-w-xs mx-auto">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadPct}%`, backgroundColor: "#1a5c2a" }}
              />
            </div>
            <p className="text-sm text-gray-500">{uploadPct}% uploaded</p>
          </div>
        )}

        {/* ── Stage: Processing ──────────────────────────────────────────── */}
        {stage === "processing" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <div
              className="w-14 h-14 mx-auto mb-4 rounded-full border-4 border-gray-100 animate-spin"
              style={{ borderTopColor: "#1a5c2a" }}
            />
            <h2 className="text-base font-bold text-gray-900 mb-1">
              AI is analysing the video...
            </h2>
            <p className="text-sm text-gray-500">
              This takes 30–90 seconds. Don&apos;t close the page.
            </p>
          </div>
        )}

        {/* ── Stage: Error ───────────────────────────────────────────────── */}
        {stage === "error" && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 text-center">
            <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
            <h2 className="text-base font-bold text-gray-900 mb-1">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-5">{errMsg}</p>
            <button
              onClick={reset}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Stage: Results ─────────────────────────────────────────────── */}
        {stage === "results" && result && (
          <>
            {/* Score header */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-bold text-gray-900">
                  {playerName.trim() || "Player"} — {analysisType.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Performance</p>
                  <p className="text-4xl font-black" style={{ color: scoreColor(result.performance_index) }}>
                    {result.performance_index}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">/100</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Resilience</p>
                  <p className="text-4xl font-black" style={{ color: scoreColor(result.resilience_index) }}>
                    {result.resilience_index}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">/100</p>
                </div>
              </div>
            </div>

            {/* Metric bars */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Breakdown</p>
              {Object.entries(result.metrics).map(([key, val]) => {
                const lower = LOWER_IS_BETTER.has(key);
                const color = scoreColor(val, lower);
                const barW  = lower ? Math.max(0, 100 - val) : Math.min(100, val);
                const label = METRIC_LABELS[key] ?? key.replace(/_/g, " ");
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-700 font-medium">{label}</span>
                      <span className="font-bold" style={{ color }}>
                        {val}/100 — {scoreLabel(val, lower)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${barW}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-red-500 mb-2">Things to watch</p>
                <div className="flex flex-wrap gap-2">
                  {result.flags.map((flag) => (
                    <span
                      key={flag}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-red-200 text-red-600"
                    >
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* THUTO coaching note */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={15} style={{ color: "#f0b429" }} />
                <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#c8962a" }}>
                  THUTO Coaching Note
                </p>
              </div>
              {thutoLoading ? (
                <div className="space-y-2">
                  <div className="h-3.5 bg-amber-100 rounded animate-pulse w-full" />
                  <div className="h-3.5 bg-amber-100 rounded animate-pulse w-4/5" />
                </div>
              ) : thutoNote ? (
                <p className="text-sm text-gray-800 leading-relaxed italic">{thutoNote}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">Coaching note unavailable — check your connection.</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportJSON}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Download size={15} />
                Export JSON
              </button>
              <button
                onClick={() => void postToArena()}
                disabled={arenaPosted || !token}
                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: arenaPosted ? "#e5e7eb" : "#f0b429",
                  color: arenaPosted ? "#9ca3af" : "#1a3a1a",
                }}
              >
                <Send size={15} />
                {arenaPosted ? "Posted!" : "Share to Arena"}
              </button>
            </div>

            <button
              onClick={reset}
              className="w-full py-3 rounded-2xl text-sm text-gray-500 hover:text-gray-800 flex items-center justify-center gap-2 transition-colors bg-white border border-gray-200"
            >
              <RefreshCw size={13} />
              Analyse another player
            </button>

            {/* History inline toggle */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3"
                >
                  <span className="text-xs font-bold text-gray-600">
                    Recent analyses ({history.length})
                  </span>
                  {showHistory
                    ? <ChevronUp size={14} className="text-gray-400" />
                    : <ChevronDown size={14} className="text-gray-400" />}
                </button>
                {showHistory && (
                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                    {history.slice(0, 10).map((h) => (
                      <div key={h.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{h.playerName}</p>
                          <p className="text-[10px] text-gray-400">{h.analysisLabel} · {new Date(h.timestamp).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black" style={{ color: scoreColor(h.performance_index) }}>
                            {h.performance_index}<span className="text-[9px] text-gray-400 ml-0.5">P</span>
                          </span>
                          <span className="text-xs font-black" style={{ color: scoreColor(h.resilience_index) }}>
                            {h.resilience_index}<span className="text-[9px] text-gray-400 ml-0.5">R</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
