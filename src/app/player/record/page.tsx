"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Circle, Square, Upload, RotateCcw, AlertCircle,
  Loader2, CheckCircle2, Film, Play, Mic, MicOff, FlipHorizontal,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

type VideoTag = "Goals" | "Skills" | "Assists" | "Defending" | "Full Match";
type RecordState = "idle" | "countdown" | "recording" | "review" | "uploading" | "done";

const TAG_OPTIONS: VideoTag[] = ["Goals", "Skills", "Assists", "Defending", "Full Match"];
const TAG_COLORS: Record<VideoTag, string> = {
  Goals:        "bg-green-500/20 text-green-400 border-green-500/30",
  Skills:       "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Assists:      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Defending:    "bg-red-500/20 text-red-400 border-red-500/30",
  "Full Match": "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordDrillPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const previewRef  = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state,      setState]      = useState<RecordState>("idle");
  const [error,      setError]      = useState("");
  const [muted,      setMuted]      = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [elapsed,    setElapsed]    = useState(0);
  const [countdown,  setCountdown]  = useState(3);
  const [blob,       setBlob]       = useState<Blob | null>(null);
  const [blobUrl,    setBlobUrl]    = useState<string | null>(null);

  // Upload form
  const [title,       setTitle]       = useState("");
  const [tag,         setTag]         = useState<VideoTag>("Skills");
  const [description, setDescription] = useState("");
  const [uploadErr,   setUploadErr]   = useState("");
  const [shareUrl] = useState<string | null>(null);

  // ── Camera helpers ──────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const constraints: MediaStreamConstraints = {
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: !muted,
      };
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // always mute preview to avoid echo
        await videoRef.current.play().catch(() => null);
      }
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setError("Camera access denied. Please allow camera access in your browser settings.");
      } else {
        setError("Could not access camera. Make sure no other app is using it.");
      }
    }
  }, [facingMode, muted]);

  // Cleanup on unmount (always runs regardless of auth state)
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth + camera start — wait for Zustand hydration before checking user
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated]);

  // Re-init camera when facing mode changes
  useEffect(() => {
    if (state === "idle") startCamera();
  }, [facingMode, startCamera, state]);

  // ── Recording flow ──────────────────────────────────────────────────────────

  function startCountdown() {
    setState("countdown");
    setCountdown(3);
    let c = 3;
    const iv = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c === 0) {
        clearInterval(iv);
        startRecording();
      }
    }, 1000);
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const recorded = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(recorded);
      setBlob(recorded);
      setBlobUrl(url);
      setState("review");
      if (previewRef.current) {
        previewRef.current.src = url;
        previewRef.current.load();
      }
    };

    recorder.start(200);
    setState("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }

  function handleDiscard() {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlob(null);
    setBlobUrl(null);
    setElapsed(0);
    setTitle("");
    setDescription("");
    setUploadErr("");
    setState("idle");
    startCamera();
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function handleUpload() {
    if (!blob) return;
    if (!title.trim()) { setUploadErr("Please enter a title for your recording."); return; }

    setState("uploading");
    setUploadErr("");

    const ext  = blob.type.includes("mp4") ? "mp4" : "webm";
    const file = new File([blob], `${title.trim()}.${ext}`, { type: blob.type });

    const form = new FormData();
    form.append("file", file);
    form.append("title", title.trim());
    form.append("tag", tag);
    if (description) form.append("description", description);

    try {
      await api.post("/player/vault/upload", form);
      setState("done");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Upload failed. Please try again.";
      setUploadErr(msg);
      setState("review");
    }
  }

  if (!user) return null;

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (state === "done") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex flex-1 flex-col items-center justify-center p-6 pt-16 lg:pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Video saved to Vault!</h1>
            <p className="text-sm text-muted-foreground">
              Your drill recording has been uploaded. Scouts can see it in your highlight reel.
            </p>
            {shareUrl && (
              <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{shareUrl}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Record another
              </button>
              <button
                onClick={() => router.push("/player/vault")}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Film className="h-4 w-4" /> View Vault
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Review screen ───────────────────────────────────────────────────────────
  if (state === "review" || state === "uploading") {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6 pt-16 lg:pt-6">

          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Player Hub</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
              <Camera className="h-6 w-6 text-primary" /> Review Recording
            </h1>
          </div>

          <div className="mx-auto max-w-2xl space-y-5">
            {/* Video preview */}
            <div className="overflow-hidden rounded-2xl bg-black">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={previewRef}
                controls
                className="w-full"
                style={{ maxHeight: "55vh" }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Duration: <span className="font-medium text-white">{formatTime(elapsed)}</span>
            </p>

            {/* Upload form */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title *  e.g. Free-kick drill — Tuesday"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setUploadErr(""); }}
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />

              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as VideoTag)}
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-card px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {uploadErr && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {uploadErr}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDiscard}
                disabled={state === "uploading"}
                className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-40"
              >
                <RotateCcw className="h-4 w-4" /> Discard
              </button>
              <button
                onClick={handleUpload}
                disabled={state === "uploading"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {state === "uploading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Uploading to Vault…</>
                ) : (
                  <><Upload className="h-4 w-4" /> Save to Vault</>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Camera / recording screen ───────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex flex-1 flex-col p-6 pt-16 lg:pt-6 overflow-hidden">
        {/* Header */}
        <div className="mb-4 flex-shrink-0">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Player Hub</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
            <Camera className="h-6 w-6 text-primary" /> Record Drill
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Record your performance — save to Highlight Vault for scouts
          </p>
        </div>

        {error && (
          <div className="mb-4 flex-shrink-0 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button
              onClick={startCamera}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Camera viewport */}
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-black min-h-0">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {/* Countdown overlay */}
          {state === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-[100px] font-black text-white drop-shadow-2xl leading-none">
                {countdown > 0 ? countdown : "GO!"}
              </span>
            </div>
          )}

          {/* Recording indicator */}
          {state === "recording" && (
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-sm font-bold text-white">{formatTime(elapsed)}</span>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 bg-gradient-to-t from-black/80 to-transparent px-6 py-6">

            {/* Mute toggle */}
            <button
              onClick={() => setMuted((m) => !m)}
              disabled={state === "recording" || state === "countdown"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-40"
            >
              {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Record / Stop */}
            {state === "recording" ? (
              <button
                onClick={stopRecording}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 transition-transform hover:scale-105 active:scale-95"
              >
                <Square className="h-7 w-7 fill-white" />
              </button>
            ) : (
              <button
                onClick={startCountdown}
                disabled={state === "countdown" || !!error}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/40 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Circle className="h-7 w-7 fill-white" />
              </button>
            )}

            {/* Flip camera */}
            <button
              onClick={() => setFacingMode((f) => (f === "user" ? "environment" : "user"))}
              disabled={state === "recording" || state === "countdown"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-40"
            >
              <FlipHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tag selector below camera */}
        <div className="mt-4 flex-shrink-0 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Tag:</span>
          {TAG_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              disabled={state === "recording"}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                tag === t
                  ? TAG_COLORS[t]
                  : "border-white/10 text-muted-foreground hover:border-white/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tips */}
        {state === "idle" && (
          <div className="mt-3 flex-shrink-0 grid grid-cols-3 gap-2 text-center">
            {[
              { emoji: "📱", text: "Prop phone at goal-post height" },
              { emoji: "💡", text: "Good lighting = clear video" },
              { emoji: "🎯", text: "Tag before recording" },
            ].map(({ emoji, text }) => (
              <div key={text} className="rounded-xl border border-white/10 bg-card/50 p-3">
                <p className="text-xl">{emoji}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Vault link */}
        <div className="mt-3 flex-shrink-0">
          <button
            onClick={() => router.push("/player/vault")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
          >
            <Play className="h-4 w-4" /> View Highlight Vault
          </button>
        </div>
      </main>
    </div>
  );
}
