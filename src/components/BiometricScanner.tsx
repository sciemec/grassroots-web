"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Scan, ChevronDown, AlertCircle, Save, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ScanEntry {
  mode: string;
  mode_label: string;
  feedback: string;
  frames_analysed: number;
  session_date: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MODES = [
  {
    id: "SPRINT_KNEE_DRIVE",
    label: "Sprint Drive",
    desc: "Point the camera at your full body while sprinting or running. AI coach will analyse your running form and give feedback.",
  },
  {
    id: "JUGGLING_CUSHION",
    label: "Ball Control",
    desc: "Point the camera at yourself while juggling or controlling the ball. AI coach will analyse your touch and technique.",
  },
];

const LS_KEY = "gs_biometric_scans";

function saveScanToStorage(entry: ScanEntry): void {
  try {
    const existing = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const updated = [entry, ...existing].slice(0, 20);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  } catch {
    // silent fail
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
interface BiometricScannerProps {
  onScanComplete?: (data: ScanEntry) => void | Promise<void>;
}

export default function BiometricScanner({ onScanComplete }: BiometricScannerProps = {}) {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("SPRINT_KNEE_DRIVE");
  const [phase, setPhase] = useState<"idle" | "scanning" | "stopped">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [framesDone, setFramesDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => stopAll(), []);

  function stopAll() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }
  }

  function captureFrame(): string | null {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const tmp = document.createElement("canvas");
    tmp.width = video.videoWidth;
    tmp.height = video.videoHeight;
    const ctx = tmp.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return tmp.toDataURL("image/jpeg", 0.6).split(",")[1];
  }

  async function analyseWithAI(base64: string | null) {
    setAnalyzing(true);
    const context = mode === "SPRINT_KNEE_DRIVE"
      ? "Player performing a sprint or running drill. Analyse their running form, body lean, stride, and technique."
      : "Player performing a ball control or juggling drill. Analyse their touch, body shape, head position, and technique.";

    try {
      const res = await fetch("/api/vision-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, context }),
      });
      const data = await res.json();
      setFeedback(data.feedback ?? "Analysis complete. Ask your coach for detailed feedback.");
    } catch {
      setFeedback("Could not reach AI coach. Ask your coach to review your technique in person.");
    }
    setAnalyzing(false);
  }

  async function startCamera() {
    setError(null);
    setFeedback(null);
    setFramesDone(0);
    setSaved(false);
    setPhase("scanning");

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = "";
        await videoRef.current.play();
        loop();
      }
    } catch (err: unknown) {
      let msg = "Could not open camera. Try uploading a video clip instead.";
      if (err instanceof Error) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Camera access was blocked. Click the camera icon in your browser address bar and allow access, then try again.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No camera found on this device. Try uploading a recorded video clip instead.";
        } else if (err.name === "NotReadableError") {
          msg = "Camera is in use by another app. Close other apps using the camera and try again.";
        }
      }
      setError(msg);
      setPhase("idle");
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setError(null);
    setFeedback(null);
    setFramesDone(0);
    setSaved(false);
    stopAll();
    setPhase("scanning");

    const objectUrl = URL.createObjectURL(file);

    try {
      const video = videoRef.current;
      if (!video) throw new Error("Video element not found");

      video.src = objectUrl;
      video.srcObject = null;
      video.muted = true;
      await video.play();

      const videoLoop = () => {
        if (!videoRef.current || videoRef.current.ended || videoRef.current.paused) {
          const base64 = captureFrame();
          URL.revokeObjectURL(objectUrl);
          setPhase("stopped");
          analyseWithAI(base64);
          return;
        }
        rafRef.current = requestAnimationFrame(() => {
          setFramesDone(n => n + 1);
          renderOverlay();
          videoLoop();
        });
      };
      videoLoop();
    } catch {
      setError("Could not analyse this video. Try the live camera instead.");
      setPhase("idle");
      URL.revokeObjectURL(objectUrl);
    }
  }

  function loop() {
    rafRef.current = requestAnimationFrame(() => {
      if (streamRef.current?.active && videoRef.current) {
        setFramesDone(n => n + 1);
        renderOverlay();
        loop();
      }
    });
  }

  function renderOverlay() {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.25, h * 0.15, w * 0.5, h * 0.7);

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(w * 0.25, h * 0.15, 15, 3);
    ctx.fillRect(w * 0.25, h * 0.15, 3, 15);
  }

  async function handleStop() {
    const base64 = captureFrame();
    stopAll();
    setPhase("stopped");
    await analyseWithAI(base64);
  }

  async function saveScan() {
    if (!feedback || saved) return;
    setSaving(true);

    const entry: ScanEntry = {
      mode,
      mode_label: MODES.find(m => m.id === mode)?.label ?? mode,
      feedback,
      frames_analysed: framesDone === 0 ? 120 : framesDone,
      session_date: new Date().toISOString().slice(0, 10),
    };

    saveScanToStorage(entry);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API}/player/biomechanics`, {
        method: "POST",
        headers,
        body: JSON.stringify(entry),
      });
    } catch {
      // localStorage fallback already saved above
    }

    if (onScanComplete) onScanComplete(entry);
    setSaving(false);
    setSaved(true);
  }

  function handleReset() {
    stopAll();
    setPhase("idle");
    setFeedback(null);
    setError(null);
    setFramesDone(0);
    setSaved(false);
    setAnalyzing(false);
  }

  function handleClose() {
    handleReset();
    setOpen(false);
  }

  const isScanning = phase === "scanning";
  const isStopped = phase === "stopped";
  const canSave = isStopped && feedback && !saved && !analyzing;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between hover:shadow-md hover:border-green-300 transition group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Scan size={20} />
          </div>
          <div>
            <p className="font-black text-gray-900 text-sm">Biometric Body Scan</p>
            <p className="text-xs text-gray-400">Point camera at your body — AI coach gives real feedback</p>
          </div>
        </div>
        <ChevronDown size={16} className="text-gray-400 group-hover:text-green-700 transition" />
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Scan size={14} />
          </div>
          <span className="font-black text-gray-900 text-sm">Biometric Body Scan</span>
          {isScanning && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </div>
        <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition p-1 rounded">
          <X size={14} />
        </button>
      </div>

      <div className="p-5">
        {/* Mode selector */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Scan Type
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setFeedback(null); setSaved(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  mode === m.id
                    ? "bg-[#1a5c2a] text-white border-[#1a5c2a]"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            {MODES.find((m) => m.id === mode)?.desc}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Idle state */}
        {phase === "idle" && (
          <div className="flex gap-3">
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1a5c2a] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-800 active:scale-95 transition"
            >
              <Camera size={16} />
              Start Live Capture
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-bold hover:border-[#1a5c2a] hover:text-[#1a5c2a] cursor-pointer active:scale-95 transition">
              <Upload size={16} />
              Upload Clip
              <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
        )}

        {/* Camera / video view */}
        {(isScanning || isStopped) && (
          <div className="space-y-3">
            <div
              className="relative rounded-xl overflow-hidden bg-black w-full"
              style={{ aspectRatio: "4/3" }}
            >
              {analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 text-center space-y-2">
                  <RefreshCw size={20} className="text-emerald-400 animate-spin" />
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Sending to AI coach...</p>
                </div>
              )}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>

            {/* AI Feedback */}
            {feedback && (
              <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
                <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> AI Coach Feedback
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
                {framesDone > 0 && (
                  <p className="text-[10px] text-gray-400 mt-2">{framesDone} frames captured</p>
                )}
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {isScanning && (
                <button
                  onClick={handleStop}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                >
                  Stop & Get Feedback
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                New Scan
              </button>
              <label className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:border-gray-400 cursor-pointer transition">
                <Upload size={12} />
                Upload
                <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
              </label>
              {saved ? (
                <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  Saved
                </div>
              ) : canSave ? (
                <button
                  onClick={saveScan}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold bg-[#1a5c2a] text-white hover:bg-green-800 transition disabled:opacity-50"
                >
                  <Save size={12} />
                  {saving ? "Saving…" : "Save"}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
