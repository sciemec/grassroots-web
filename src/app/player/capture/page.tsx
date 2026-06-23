"use client";

/**
 * Moment Capture — Innovation 04 (World First)
 *
 * Player records a 30-second skill clip directly in the browser.
 * THUTO analyses the footage using Claude vision and gives
 * specific, actionable coaching feedback within seconds.
 *
 * No app download. No YouTube. Point. Record. Get coached.
 *
 * Route: /player/capture
 *
 * Screens:
 *  1. ready     — rear camera preview, drill selector, record button
 *  2. recording — live preview, red pulsing dot, 30s countdown
 *  3. uploading — "THUTO is watching your clip..." animated dots
 *  4. feedback  — typewriter reveal of 3 THUTO coaching points
 *
 * Upload:  Cloudflare R2 via existing presigned URL route
 * AI:      Claude vision via /api/capture/analyse
 * Fallback: If R2 not configured, analysis still works on extracted frame
 * Storage: Saves to localStorage (Highlight Vault) + Laravel /captures
 */

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Camera, Video, Square, RotateCcw, ArrowLeft,
  CheckCircle, Save, Loader2, AlertCircle, Mic,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ─── Drill options ──────────────────────────────────────────────────────────

const DRILLS = [
  { id: "dribbling",   label: "Dribbling",             emoji: "⚡", focus: "close control, body feints, change of direction" },
  { id: "shooting",    label: "Shooting",              emoji: "🎯", focus: "shooting stance, foot contact point, follow-through" },
  { id: "passing",     label: "Passing",               emoji: "🎪", focus: "weight of pass, body shape, support angle" },
  { id: "first_touch", label: "First Touch / Control", emoji: "🦶", focus: "receiving position, cushioning, direction of touch" },
  { id: "heading",     label: "Heading",               emoji: "👆", focus: "approach, forehead contact point, direction" },
  { id: "defending",   label: "1v1 Defending",         emoji: "🛡️", focus: "defensive stance, jockeying distance, tackle timing" },
  { id: "crossing",    label: "Crossing",              emoji: "↗️", focus: "approach angle, contact point, delivery height" },
  { id: "free_kick",   label: "Free Kick",             emoji: "🌀", focus: "run-up angle, planting foot, strike technique" },
  { id: "juggling",    label: "Ball Juggling",         emoji: "⚽", focus: "balance, concentration, touch variety" },
  { id: "sprint",      label: "Sprint / Running Form", emoji: "🏃", focus: "arm drive, knee lift, forward lean" },
] as const;

type DrillId = (typeof DRILLS)[number]["id"];

// ─── Feedback shape returned from /api/capture/analyse ─────────────────────

interface THUTOFeedback {
  strength:            string;
  correction:          string;
  drillRecommendation: string;
}

// ─── Screen state machine ───────────────────────────────────────────────────

type Screen = "ready" | "recording" | "uploading" | "feedback" | "error";

// ─── localStorage — Highlight Vault key ────────────────────────────────────

const VAULT_KEY = "grassroots_highlight_vault";

interface VaultClip {
  id:        string;
  drill:     string;
  videoUrl:  string | null;
  feedback:  THUTOFeedback;
  createdAt: string;
}

function saveToVault(clip: VaultClip) {
  try {
    const existing: VaultClip[] = JSON.parse(localStorage.getItem(VAULT_KEY) ?? "[]");
    const updated = [clip, ...existing].slice(0, 20); // keep 20 most recent
    localStorage.setItem(VAULT_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Frame extraction — client-side canvas approach ─────────────────────────
// Seeks to the midpoint of the video blob and captures a JPEG frame.

function extractFrame(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const vid  = document.createElement("video");
    vid.preload = "metadata";
    vid.muted   = true;
    vid.playsInline = true;
    vid.src = url;

    vid.onloadedmetadata = () => {
      // Seek to midpoint (capped at 15 s)
      vid.currentTime = Math.min(vid.duration / 2, 15);
    };

    vid.onseeked = () => {
      try {
        const W = Math.min(vid.videoWidth  || 640, 1280);
        const H = Math.min(vid.videoHeight || 480, 720);
        const canvas = document.createElement("canvas");
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(vid, 0, 0, W, H);
        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
        URL.revokeObjectURL(url);
        resolve(base64);
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    vid.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load video for frame extraction"));
    };
  });
}

// ─── R2 upload via existing presigned URL route ─────────────────────────────

async function uploadToR2(blob: Blob, drillId: string): Promise<string | null> {
  try {
    const filename = `capture-${drillId}-${Date.now()}.webm`;

    // 1. Get presigned PUT URL
    const presignRes = await fetch("/api/upload/presigned", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ filename, content_type: "video/webm", folder: "captures" }),
    });
    if (!presignRes.ok) return null;
    const { uploadUrl, publicUrl } = (await presignRes.json()) as {
      uploadUrl: string;
      publicUrl: string | null;
      key: string;
    };

    // 2. PUT blob directly to R2
    const putRes = await fetch(uploadUrl, {
      method:  "PUT",
      body:    blob,
      headers: { "Content-Type": "video/webm" },
    });
    if (!putRes.ok) return null;

    return publicUrl;
  } catch {
    return null;
  }
}

// ─── Typewriter hook ────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function MomentCapturePage() {
  const user = useAuthStore((s) => s.user);

  // ── UI state ──
  const [screen, setScreen]     = useState<Screen>("ready");
  const [drill, setDrill]       = useState<DrillId>("dribbling");
  const [elapsed, setElapsed]   = useState(0);          // seconds recorded
  const [feedback, setFeedback] = useState<THUTOFeedback | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [savedToVault, setSavedToVault] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cameraError, setCameraError] = useState(false);

  // ── Refs ──
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef     = useRef<Blob | null>(null);

  // ── Typewriter texts ──
  const strengthText  = useTypewriter(screen === "feedback" ? (feedback?.strength ?? "")          : "", 20);
  const correctionText = useTypewriter(screen === "feedback" ? (feedback?.correction ?? "")        : "", 20);
  const drillText     = useTypewriter(screen === "feedback" ? (feedback?.drillRecommendation ?? "") : "", 20);

  // ── Start camera on mount ──────────────────────────────────────────────────
  useEffect(() => {
    startCamera();
    return () => stopStream();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setCameraError(false);
    try {
      // Try rear camera first; fall back to any camera on Android Chrome
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        // NotFoundError / OverconstrainedError on some Android devices — retry without facingMode
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      // NotAllowedError (permission denied) or no camera at all
      setCameraError(true);
      console.warn("Camera access failed:", err instanceof Error ? err.message : err);
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Determine best supported MIME type ────────────────────────────────────
  const getMimeType = (): string => {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    if (typeof MediaRecorder === "undefined") return "";
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  };

  // ── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    const mimeType = getMimeType();
    const recorder  = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined
    );
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      blobRef.current = blob;
      handleUploadAndAnalyse(blob);
    };

    recorder.start(200); // collect data every 200 ms
    recorderRef.current = recorder;

    // ── Timer: count up to 30, then auto-stop ──
    setElapsed(0);
    setScreen("recording");
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= 29) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  // ── Upload + Analyse ───────────────────────────────────────────────────────
  const handleUploadAndAnalyse = async (blob: Blob) => {
    setScreen("uploading");

    try {
      // 1. Extract frame (client-side — no ffmpeg needed)
      let frame: string | null = null;
      try {
        frame = await extractFrame(blob);
      } catch {}

      // 2. Upload to R2 (best-effort — analysis still works without video URL)
      const r2Url = await uploadToR2(blob, drill);
      setVideoUrl(r2Url);

      // 3. Analyse with THUTO (Claude vision)
      const selectedDrill = DRILLS.find((d) => d.id === drill)!;
      const res = await fetch("/api/capture/analyse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          frame,
          drill:      selectedDrill.label,
          focus:      selectedDrill.focus,
          playerName: user?.name ?? "Player",
          position:   "footballer",
          videoUrl:   r2Url,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = (await res.json()) as THUTOFeedback;
      setFeedback(data);
      setScreen("feedback");

      // 4. Save to Laravel (best-effort)
      try {
        await api.post("/captures", {
          drill_name:       selectedDrill.label,
          r2_url:           r2Url ?? "",
          thuto_feedback:   JSON.stringify(data),
          duration_seconds: elapsed,
          is_public:        false,
        });
      } catch {}

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErrorMsg(msg);
      setScreen("error");
    }
  };

  // ── Save to Highlight Vault ────────────────────────────────────────────────
  const saveToHighlightVault = () => {
    if (!feedback) return;
    const selectedDrill = DRILLS.find((d) => d.id === drill)!;
    saveToVault({
      id:        `${Date.now()}`,
      drill:     selectedDrill.label,
      videoUrl:  videoUrl,
      feedback,
      createdAt: new Date().toISOString(),
    });
    setSavedToVault(true);
  };

  // ── Reset to record again ──────────────────────────────────────────────────
  const recordAgain = () => {
    blobRef.current  = null;
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setScreen("ready");
    // Re-attach stream to video element
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    } else {
      startCamera();
    }
  };

  const selectedDrill = DRILLS.find((d) => d.id === drill)!;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">

        {/* ── Header ── */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
          <Link
            href="/player"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold">Moment Capture</h1>
            <p className="text-xs text-muted-foreground">Record a skill — get coached by THUTO</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1">
            <Mic className="h-3 w-3 text-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-600">THUTO Vision</span>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 1 — READY
              ════════════════════════════════════════════════════════════════ */}
          {(screen === "ready") && (
            <div className="space-y-5">

              {/* Camera preview */}
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[9/16] max-h-[420px]">
                {cameraError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                    <Camera className="h-12 w-12 opacity-40" />
                    <p className="text-sm">Camera not available</p>
                    <button
                      onClick={startCamera}
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
                      30 second max
                    </div>
                  </>
                )}
              </div>

              {/* Drill selector */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What are you practising?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {DRILLS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDrill(d.id)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all ${
                        drill === d.id
                          ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border-border bg-card text-foreground hover:border-green-500/50 hover:bg-muted"
                      }`}
                    >
                      <span className="text-base">{d.emoji}</span>
                      <span className="truncate">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Record button */}
              <button
                onClick={startRecording}
                disabled={cameraError}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 text-lg font-bold text-white transition-all active:scale-95 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Video className="h-5 w-5" />
                Start Recording
              </button>

              <p className="text-center text-xs text-muted-foreground">
                THUTO will analyse your {selectedDrill.label.toLowerCase()} technique using AI vision.
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 2 — RECORDING
              ════════════════════════════════════════════════════════════════ */}
          {screen === "recording" && (
            <div className="space-y-5">

              {/* Live preview with pulsing dot + countdown */}
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[9/16] max-h-[420px]">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />

                {/* Pulsing red record indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">REC</span>
                </div>

                {/* 30s countdown top-right */}
                <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-bold text-white tabular-nums">
                    {30 - elapsed}s
                  </span>
                </div>

                {/* Elapsed bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000"
                    style={{ width: `${(elapsed / 30) * 100}%` }}
                  />
                </div>
              </div>

              {/* Drill reminder */}
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-2xl">{selectedDrill.emoji}</p>
                <p className="mt-1 font-semibold">{selectedDrill.label}</p>
                <p className="text-xs text-muted-foreground">Recording {elapsed}s</p>
              </div>

              {/* Stop button */}
              <button
                onClick={stopRecording}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-red-500 bg-red-500/10 py-4 text-base font-bold text-red-600 transition-all active:scale-95 hover:bg-red-500/20"
              >
                <Square className="h-5 w-5 fill-red-600" />
                Stop Recording
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 3 — UPLOADING / ANALYSING
              ════════════════════════════════════════════════════════════════ */}
          {screen === "uploading" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              {/* THUTO animated avatar */}
              <div className="relative mb-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600 shadow-lg">
                  <span className="text-4xl">🤖</span>
                </div>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400">
                  <span className="h-2 w-2 rounded-full bg-yellow-600 animate-ping" />
                </span>
              </div>

              <h2 className="text-xl font-bold">THUTO is watching your clip</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Analysing your {selectedDrill.label.toLowerCase()} technique
              </p>

              {/* Animated dots */}
              <div className="mt-6 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-green-500"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>

              <p className="mt-8 max-w-xs text-xs text-muted-foreground">
                This takes 10–20 seconds. THUTO is looking at your form, body position and technique.
              </p>

              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-8px); }
                }
              `}</style>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 4 — FEEDBACK
              ════════════════════════════════════════════════════════════════ */}
          {screen === "feedback" && feedback && (
            <div className="space-y-5">

              {/* THUTO header */}
              <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-600">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <p className="font-bold text-green-700 dark:text-green-400">THUTO</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedDrill.label} Analysis · Just now
                  </p>
                </div>
              </div>

              {/* Strength — green */}
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
                    What you did well
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-foreground min-h-[3rem]">
                  {strengthText}
                  {strengthText.length < (feedback.strength?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-current animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Correction — amber */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    One thing to fix
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-foreground min-h-[3rem]">
                  {correctionText}
                  {correctionText.length < (feedback.correction?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-current animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Drill recommendation — blue */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏋️</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Drill to try
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-foreground min-h-[3rem]">
                  {drillText}
                  {drillText.length < (feedback.drillRecommendation?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-current animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={saveToHighlightVault}
                  disabled={savedToVault}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-95 ${
                    savedToVault
                      ? "border border-green-500/30 bg-green-500/10 text-green-600 cursor-default"
                      : "bg-[#f0b429] text-[#1a3a1a] hover:opacity-90"
                  }`}
                >
                  {savedToVault ? (
                    <><CheckCircle className="h-4 w-4" /> Saved to Vault</>
                  ) : (
                    <><Save className="h-4 w-4" /> Save to Vault</>
                  )}
                </button>

                <button
                  onClick={recordAgain}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold transition-all hover:bg-muted active:scale-95"
                >
                  <RotateCcw className="h-4 w-4" />
                  Record again
                </button>
              </div>

              {savedToVault && (
                <Link
                  href="/player/vault"
                  className="block w-full rounded-xl border border-border py-3 text-center text-sm text-muted-foreground transition-colors hover:bg-muted"
                >
                  View in Highlight Vault →
                </Link>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN — ERROR
              ════════════════════════════════════════════════════════════════ */}
          {screen === "error" && (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-lg font-bold">Analysis failed</h2>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">{errorMsg}</p>
              <button
                onClick={recordAgain}
                className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
