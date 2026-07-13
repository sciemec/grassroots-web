"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Upload, Play, RefreshCw, Zap, Lock, CheckCircle2,
  Camera, StopCircle, Video,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ─────────────────────────────────────────────────────────────────────────────
// Sport + Drill config — all 10 GRS sports
// ─────────────────────────────────────────────────────────────────────────────
const SPORTS: { id: string; label: string; emoji: string; positions: string[]; drills: string[] }[] = [
  {
    id: "football", label: "Football", emoji: "⚽",
    positions: ["Striker", "Midfielder", "Defender", "Goalkeeper", "Winger"],
    drills:    ["Sprint", "Dribbling", "Shooting", "Passing", "Defending", "Heading", "Juggling", "Agility"],
  },
  {
    id: "rugby", label: "Rugby", emoji: "🏉",
    positions: ["Prop", "Hooker", "Lock", "Flanker", "Number 8", "Scrum-half", "Fly-half", "Wing", "Centre", "Fullback"],
    drills:    ["Sprint", "Tackle", "Lineout", "Scrum", "Carry", "Kicking", "Agility"],
  },
  {
    id: "athletics", label: "Athletics", emoji: "🏃",
    positions: ["Sprinter", "Middle Distance", "Long Distance", "Jumper", "Thrower"],
    drills:    ["Sprint", "Long Jump", "High Jump", "Hurdles", "Relay", "Discus", "Shot Put"],
  },
  {
    id: "netball", label: "Netball", emoji: "🏐",
    positions: ["Goal Shooter", "Goal Attack", "Wing Attack", "Centre", "Wing Defence", "Goal Defence", "Goalkeeper"],
    drills:    ["Shooting", "Chest Pass", "Footwork", "Defence", "Agility", "Court Movement"],
  },
  {
    id: "basketball", label: "Basketball", emoji: "🏀",
    positions: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Centre"],
    drills:    ["Dribbling", "Shooting", "Layup", "Defence", "Passing", "Agility"],
  },
  {
    id: "cricket", label: "Cricket", emoji: "🏏",
    positions: ["Batsman", "Bowler", "All-Rounder", "Wicketkeeper"],
    drills:    ["Batting", "Bowling", "Fielding", "Wicketkeeping"],
  },
  {
    id: "swimming", label: "Swimming", emoji: "🏊",
    positions: ["Freestyle", "Breaststroke", "Backstroke", "Butterfly", "Individual Medley"],
    drills:    ["Freestyle", "Breaststroke", "Backstroke", "Butterfly", "Turns", "Starts"],
  },
  {
    id: "tennis", label: "Tennis", emoji: "🎾",
    positions: ["Baseline Player", "Serve-Volley Player", "All-Court Player"],
    drills:    ["Serve", "Forehand", "Backhand", "Volley", "Footwork"],
  },
  {
    id: "volleyball", label: "Volleyball", emoji: "🏐",
    positions: ["Setter", "Outside Hitter", "Middle Blocker", "Libero", "Opposite"],
    drills:    ["Spike", "Serve", "Dig", "Block", "Setting"],
  },
  {
    id: "hockey", label: "Hockey", emoji: "🏑",
    positions: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
    drills:    ["Dribbling", "Shooting", "Passing", "Defence", "Penalty Corner"],
  },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalysePage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [sport,     setSport]     = useState(SPORTS[0]);
  const [drill,     setDrill]     = useState(SPORTS[0].drills[0]);
  const [position,  setPosition]  = useState(SPORTS[0].positions[0]);
  const [video,     setVideo]     = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(null);
  const [phase,     setPhase]     = useState<"idle" | "uploading" | "done" | "error" | "paywall">("idle");
  const [feedback,  setFeedback]  = useState("");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [inputMode,       setInputMode]       = useState<"upload" | "camera">("upload");
  const [uploadProgress,  setUploadProgress]  = useState(0);

  // Camera state
  const [camReady,    setCamReady]    = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown,   setCountdown]   = useState(60);
  const [arenaPosted, setArenaPosted] = useState(false);

  const fileRef      = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const recorderRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSportChange = (s: typeof SPORTS[0]) => {
    setSport(s);
    setDrill(s.drills[0]);
    setPosition(s.positions[0]);
  };

  // ── File upload with 60s duration check ──────────────────────────────────
  const validateAndSetFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setErrorMsg("Please upload a video file (mp4 or mov).");
      return;
    }
    if (f.size > 200 * 1024 * 1024) {
      setErrorMsg("Video must be under 200MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(f);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      if (vid.duration > 62) {
        setErrorMsg(
          `Video is ${Math.round(vid.duration)}s long — maximum is 60 seconds. Please trim and re-upload.`
        );
        return;
      }
      setVideo(f);
      setPreview(URL.createObjectURL(f));
      setPhase("idle");
      setErrorMsg("");
    };
    vid.onerror = () => {
      // Can't read metadata — accept it and let the server validate
      URL.revokeObjectURL(objectUrl);
      setVideo(f);
      setPreview(URL.createObjectURL(f));
      setPhase("idle");
      setErrorMsg("");
    };
    vid.src = objectUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) validateAndSetFile(f);
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
    setCamReady(false);
    setIsRecording(false);
    setCountdown(60);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startCamera = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width:      { ideal: 1280 },
          height:     { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
      setCamReady(true);
    } catch {
      setErrorMsg(
        "Camera access denied. Please allow camera permission in your browser settings and try again."
      );
    }
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  }, []);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
      ? "video/webm;codecs=vp8"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";

    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined
    );
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const usedType = recorder.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type: usedType });
      const ext  = usedType.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `drill_recording.${ext}`, { type: usedType });
      setVideo(file);
      setPreview(URL.createObjectURL(blob));
      setPhase("idle");
      stopCamera();
    };

    recorder.start(100);
    setIsRecording(true);
    setCountdown(60);

    let secs = 60;
    timerRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) stopRecording();
    }, 1000);
  };

  // Cleanup on unmount or mode switch
  useEffect(() => () => { stopCamera(); }, [stopCamera]);
  useEffect(() => { if (inputMode === "upload") stopCamera(); }, [inputMode, stopCamera]);

  // ── Arena auto-post ───────────────────────────────────────────────────────
  const postToArena = async (feedbackText: string) => {
    if (!token) return;
    const body =
      `Just completed a ${sport.label} ${drill} drill — here is my Gemini AI coaching feedback:\n\n` +
      feedbackText;
    try {
      await fetch(`${API_URL}/arena/posts`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body,
          post_type: "video",
          sport:     sport.id,
          metadata:  { video_source: "web", drill, position },
        }),
        signal: AbortSignal.timeout(10_000),
      });
      setArenaPosted(true);
    } catch {
      // Non-fatal — the feedback is already shown to the user
    }
  };

  // ── Run analysis ──────────────────────────────────────────────────────────
  // Uses direct-to-Google browser XHR upload so no video bytes pass through
  // Vercel (which has a ~4.5 MB body limit that blocks most real phone videos).
  const runAnalysis = async () => {
    if (!video) return;
    setPhase("uploading");
    setUploadProgress(0);
    setFeedback("");
    setErrorMsg("");
    setArenaPosted(false);

    try {
      // Step 1 — Get a Gemini resumable upload URL (tiny metadata request through Vercel)
      const sessionRes = await fetch("/api/match-eye/upload", {
        method:  "POST",
        headers: {
          "content-type":     video.type || "video/mp4",
          "x-content-length": String(video.size),
        },
      });

      if (!sessionRes.ok) {
        const err = await sessionRes.json().catch(() => ({} as Record<string, string>));
        setErrorMsg((err as { error?: string }).error ?? "Could not start upload. Please try again.");
        setPhase("error");
        return;
      }

      const { uploadUrl } = await sessionRes.json() as { uploadUrl: string };

      // Step 2 — XHR PUT the video bytes DIRECTLY to Google (bypasses Vercel completely)
      const fileData = await new Promise<{ uri: string; name: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            // Map 0-100 of the upload to 0-80% of the progress bar
            setUploadProgress(Math.round((e.loaded / e.total) * 80));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as { file?: { uri?: string; name?: string } };
              const uri  = data.file?.uri;
              const name = data.file?.name;
              if (!uri || !name) {
                reject(new Error("Google did not return file URI. Please try again."));
              } else {
                resolve({ uri, name });
              }
            } catch {
              reject(new Error("Unexpected upload response. Please try again."));
            }
          } else {
            reject(new Error(`Video upload failed (${xhr.status}). Try a shorter clip.`));
          }
        };

        xhr.onerror   = () => reject(new Error("Upload failed. Check your internet connection."));
        xhr.ontimeout = () => reject(new Error("Upload timed out. Try a shorter clip."));
        xhr.timeout   = 120_000; // 2-minute upload timeout

        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Length",        String(video.size));
        xhr.setRequestHeader("X-Goog-Upload-Offset",  "0");
        xhr.setRequestHeader("X-Goog-Upload-Command", "upload, finalize");
        xhr.setRequestHeader("Content-Type",          video.type || "video/mp4");
        xhr.send(video);
      });

      setUploadProgress(85);

      // Step 3 — Send only the file URI to the analysis route (no video through Vercel)
      const res  = await fetch("/api/analyse-from-uri", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUri:  fileData.uri,
          fileName: fileData.name,
          mimeType: video.type || "video/mp4",
          sport:    sport.id,
          drill,
          position,
          token:    token ?? "",
        }),
      });

      setUploadProgress(100);

      const data = await res.json() as {
        feedback?: string;
        error?: string;
        free_trial?: boolean;
        is_pro?: boolean;
      };

      if (res.status === 402) { setPhase("paywall"); return; }
      if (!res.ok) {
        setErrorMsg(data.error ?? "Analysis failed. Please try again.");
        setPhase("error");
        return;
      }

      const fbText = data.feedback ?? "";
      setFeedback(fbText);
      setPhase("done");

      // Auto-post to Arena (non-blocking, best-effort)
      if (fbText && user) void postToArena(fbText);

      // Save as discoverable showcase record so scouts can find this analysis
      if (fbText && token && token !== "dev-token") {
        const sentences = fbText.split(/[.!?]/).map((s: string) => s.trim()).filter(Boolean);
        void fetch(`${API_URL}/player/showcase`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            skill_type:       drill,
            video_url:        "",
            ai_rating:        7,
            top_strength:     sentences[0] ?? fbText.slice(0, 120),
            position_fit:     [position],
            scout_note:       fbText.slice(0, 280),
            development_flag: sentences[sentences.length - 1] ?? "",
            open_for_scouting: true,
          }),
        }).catch(() => { /* best-effort */ });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setErrorMsg(msg || "Connection error. Please check your internet and try again.");
      setPhase("error");
    }
  };

  const reset = () => {
    setVideo(null);
    setPreview(null);
    setPhase("idle");
    setFeedback("");
    setErrorMsg("");
    setArenaPosted(false);
    setUploadProgress(0);
    stopCamera();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/player" className="text-gray-400 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight">
              AI Drill Analysis
            </h1>
            <p className="text-xs text-gray-400">
              Record or upload a drill — Gemini watches the full clip and coaches you
            </p>
          </div>
          <span
            className="text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider"
            style={{ background: "#c8962a", color: "#fff" }}
          >
            Pro Feature
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Free trial banner ── */}
        <div
          className="rounded-2xl p-4 border"
          style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
        >
          <div className="flex items-start gap-3">
            <Zap size={18} className="mt-0.5 shrink-0" style={{ color: "#1c3d22" }} />
            <div>
              <p className="text-sm font-black text-gray-900">1 free analysis included</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Try AI drill analysis free. Upgrade to Pro for unlimited coaching feedback
                on all 10 sports.{" "}
                <Link href="/player/subscription" className="underline font-bold" style={{ color: "#1c3d22" }}>
                  Upgrade
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* ── Sport selector ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Select Sport</p>
          <div className="grid grid-cols-5 gap-2">
            {SPORTS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSportChange(s)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center"
                style={{
                  borderColor: sport.id === s.id ? "#1c3d22" : "#e5e7eb",
                  background:  sport.id === s.id ? "#f0fdf4" : "#fff",
                  color:       sport.id === s.id ? "#1c3d22" : "#6b7280",
                }}
              >
                <span className="text-lg leading-none">{s.emoji}</span>
                <span className="text-[9px] font-bold leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Drill + Position ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Drill Type
            </label>
            <select
              value={drill}
              onChange={(e) => setDrill(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-800 bg-white"
            >
              {sport.drills.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1.5">
              Your Position
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 font-semibold text-gray-800 bg-white"
            >
              {sport.positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* ── Video input (camera or upload) ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode("camera")}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all"
              style={{
                background: inputMode === "camera" ? "#1c3d22" : "#f3f4f6",
                color:      inputMode === "camera" ? "#fff"    : "#6b7280",
              }}
            >
              <Camera size={14} /> Record Video
            </button>
            <button
              onClick={() => setInputMode("upload")}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black transition-all"
              style={{
                background: inputMode === "upload" ? "#1c3d22" : "#f3f4f6",
                color:      inputMode === "upload" ? "#fff"    : "#6b7280",
              }}
            >
              <Upload size={14} /> Upload Video
            </button>
          </div>

          {/* Camera mode (no preview yet) */}
          {inputMode === "camera" && !preview && (
            !camReady ? (
              <div
                className="rounded-xl flex flex-col items-center justify-center gap-3 bg-gray-900 cursor-pointer"
                style={{ minHeight: 200 }}
                onClick={startCamera}
              >
                <Camera size={32} className="text-white/40" />
                <p className="text-sm font-bold text-white/60">Tap to open camera</p>
                <p className="text-xs text-white/40">Uses back camera · Max 60 seconds</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden bg-black" style={{ minHeight: 200 }}>
                <video
                  ref={liveVideoRef}
                  muted
                  playsInline
                  className="w-full object-cover"
                  style={{ maxHeight: 320 }}
                />

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    REC &middot; {countdown}s left
                  </div>
                )}

                {/* Countdown ring when near limit */}
                {isRecording && countdown <= 10 && (
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-black w-9 h-9 rounded-full flex items-center justify-center">
                    {countdown}
                  </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white"
                      style={{ background: "#dc2626" }}
                    >
                      <Video size={14} /> Start Recording
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black text-white bg-gray-800"
                    >
                      <StopCircle size={14} /> Stop &amp; Use Clip
                    </button>
                  )}
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2.5 rounded-full text-xs font-bold text-white/70 bg-black/40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          )}

          {/* Upload mode (no preview yet) */}
          {inputMode === "upload" && !preview && (
            <>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gray-400 transition-colors"
                style={{ minHeight: 160 }}
              >
                <Upload size={28} className="text-gray-300" />
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-500">Tap to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-0.5">MP4 or MOV · Max 60 seconds · Max 200MB</p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/quicktime,video/mov,video/webm"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) validateAndSetFile(f);
                }}
              />
            </>
          )}

          {/* Preview (both modes) */}
          {preview && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video src={preview} controls className="w-full h-full object-contain" />
              <button
                onClick={reset}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {errorMsg && (
          <div className="rounded-xl p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* ── Paywall ── */}
        {phase === "paywall" && (
          <div
            className="rounded-2xl p-5 border text-center"
            style={{ background: "#fffbeb", borderColor: "#fde68a" }}
          >
            <Lock size={24} className="mx-auto mb-2" style={{ color: "#c8962a" }} />
            <p className="text-sm font-black text-gray-900 mb-1">Free trial used</p>
            <p className="text-xs text-gray-500 mb-4">
              Upgrade to Pro for unlimited AI drill analysis across all 10 sports.
            </p>
            <Link
              href="/player/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background: "#1c3d22" }}
            >
              Upgrade to Pro
            </Link>
          </div>
        )}

        {/* ── Feedback ── */}
        {phase === "done" && feedback && (
          <div
            className="rounded-2xl p-5 border"
            style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={18} style={{ color: "#1c3d22" }} />
              <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Gemini AI Coach — {sport.label} · {drill}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{feedback}</p>

            {/* Arena confirmation */}
            {arenaPosted && (
              <div
                className="mt-3 flex items-center gap-2 text-xs font-semibold"
                style={{ color: "#1c3d22" }}
              >
                <CheckCircle2 size={13} />
                Posted to your Arena feed &middot;{" "}
                <Link href="/arena" className="underline">View in Arena</Link>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 bg-white hover:bg-gray-50 transition"
              >
                <RefreshCw size={13} /> Analyse Another
              </button>
              <Link
                href="/arena"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black text-white transition"
                style={{ background: "#1c3d22" }}
              >
                <Play size={13} /> View in Arena
              </Link>
            </div>
          </div>
        )}

        {/* ── Analyse button ── */}
        {phase !== "done" && phase !== "paywall" && (
          <div className="space-y-2">
            <button
              onClick={runAnalysis}
              disabled={!video || phase === "uploading"}
              className="w-full py-3 rounded-xl text-sm font-black text-white flex items-center justify-center gap-2 transition disabled:opacity-40"
              style={{ background: "#1c3d22" }}
            >
              {phase === "uploading" ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  {uploadProgress < 85 ? `Uploading… ${uploadProgress}%` : "Analysing with Gemini…"}
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Analyse with Gemini AI
                </>
              )}
            </button>

            {/* Upload progress bar */}
            {phase === "uploading" && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%`, background: "#1c3d22" }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Tips ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Tips for best results</p>
          <ul className="space-y-1.5">
            {[
              "Keep clips under 60 seconds — focus on one drill at a time",
              "Use the back camera for the clearest footage of your movement",
              "Film in good light with the full body visible in frame",
              "One player in frame gives the clearest Gemini feedback",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-xs text-gray-500">
                <span style={{ color: "#1c3d22" }} className="mt-0.5 font-bold">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {!user && (
          <div className="text-center text-xs text-gray-400 pb-4">
            <Link href="/login" className="font-bold underline" style={{ color: "#1c3d22" }}>
              Sign in
            </Link>{" "}
            to save your analysis and post results to The Arena automatically.
          </div>
        )}

      </div>
    </div>
  );
}
