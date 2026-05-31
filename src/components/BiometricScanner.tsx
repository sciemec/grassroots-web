"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, X, Scan, ChevronDown, AlertCircle, Save, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnalysisResult {
  score100: number;
  level: "Elite" | "Good" | "Raw";
  rating: string;
  angle?: number;
}

interface AsymmetryResult {
  detected: boolean;
  isAsymmetric: boolean;
  weakSide: "left" | "right";
  leftKneeAngle: number;
  rightKneeAngle: number;
  asymmetryDiff: number;
  asymmetryScore: number;
}

interface ScanEntry {
  mode: string;
  score: number;
  level: string;
  asymmetry_score: number;
  asymmetry_diff: number;
  weak_side: string | null;
  frames_analysed: number;
  session_date: string;
  mode_label: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MODES = [
  {
    id: "SPRINT_KNEE_DRIVE",
    label: "Sprint Drive",
    desc: "Knee angle & drive phase mechanics — for sprinters and footballers",
  },
  {
    id: "JUGGLING_CUSHION",
    label: "Ball Control",
    desc: "Head stability & vertical drift — for football first-touch technique",
  },
];

const LEVEL_STYLE: Record<string, { bg: string; border: string; text: string; mark: string }> = {
  Elite: { bg: "#f0fdf4", border: "#86efac", text: "#166534", mark: "ELITE" },
  Good:  { bg: "#fefce8", border: "#fde047", text: "#854d0e", mark: "GOOD"  },
  Raw:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", mark: "RAW"   },
};

const SKELETON_LINKS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],   // arms
  [11, 23], [12, 24], [23, 24],                         // torso
  [23, 25], [25, 27], [27, 29], [27, 31],               // left leg
  [24, 26], [26, 28], [28, 30], [28, 32],               // right leg
];

const LS_KEY = "gs_biometric_scans";

// ─── Helper Functions ───────────────────────────────────────────────────────
function calculateAngle(a: any, b: any, c: any): number {
  if (!a || !b || !c) return 0;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) -
                  Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return Math.round(angle);
}

function processBiometricFrame(landmarks: any[], mode: string): AnalysisResult | null {
  if (!landmarks || landmarks.length < 28) return null;
  
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  
  const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  
  let level: "Elite" | "Good" | "Raw" = "Raw";
  let rating = "";
  let score100 = 40;
  
  if (kneeAngle < 90) {
    level = "Elite";
    rating = "High knee drive — explosive mechanics detected";
    score100 = Math.min(100, 85 + (90 - kneeAngle));
  } else if (kneeAngle < 120) {
    level = "Good";
    rating = "Solid knee drive — efficient form";
    score100 = Math.min(85, 70 + (120 - kneeAngle) / 2);
  } else {
    level = "Raw";
    rating = "Low knee drive — needs work on hip flexion";
    score100 = Math.max(40, 70 - (kneeAngle - 120) / 2);
  }
  
  return { score100, level, rating, angle: kneeAngle };
}

function detectAsymmetry(landmarks: any[]): AsymmetryResult {
  if (!landmarks || landmarks.length < 28) {
    return {
      detected: false,
      isAsymmetric: false,
      weakSide: "left",
      leftKneeAngle: 0,
      rightKneeAngle: 0,
      asymmetryDiff: 0,
      asymmetryScore: 0,
    };
  }
  
  const leftHip = landmarks[23];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  const rightHip = landmarks[24];
  const rightKnee = landmarks[26];
  const rightAnkle = landmarks[28];
  
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const asymmetryDiff = Math.abs(leftKneeAngle - rightKneeAngle);
  const isAsymmetric = asymmetryDiff > 10;
  const weakSide = leftKneeAngle < rightKneeAngle ? "left" : "right";
  const asymmetryScore = Math.min(100, Math.round(asymmetryDiff * 2));
  
  return {
    detected: isAsymmetric,
    isAsymmetric,
    weakSide,
    leftKneeAngle,
    rightKneeAngle,
    asymmetryDiff,
    asymmetryScore,
  };
}

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
  onScanComplete?: (data: ScanEntry) => void;
}

export default function BiometricScanner({ onScanComplete }: BiometricScannerProps = {}) {
  const token = useAuthStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("SPRINT_KNEE_DRIVE");
  const [phase, setPhase] = useState<"idle" | "scanning" | "stopped">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [asymmetry, setAsymmetry] = useState<AsymmetryResult | null>(null);
  const [framesDone, setFramesDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<any>(null);
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

  async function ensurePose() {
    if (poseRef.current) {
      poseRef.current.onResults(onResults);
      return poseRef.current;
    }
    const mp = await import("@mediapipe/pose");
    const pose = new mp.Pose({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults(onResults);
    await pose.initialize();
    poseRef.current = pose;
    return pose;
  }

  async function startCamera() {
    setError(null);
    setResult(null);
    setAsymmetry(null);
    setFramesDone(0);
    setSaved(false);
    setPhase("scanning");

    try {
      await ensurePose();

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
    } catch (err: any) {
      let msg = "Could not open camera. Try uploading a video clip instead.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera access was blocked. Click the camera icon in your browser address bar and allow access, then try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No camera found on this device. Try uploading a recorded video clip instead.";
      } else if (err.name === "NotReadableError") {
        msg = "Camera is in use by another app. Close other apps using the camera and try again.";
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
    setResult(null);
    setAsymmetry(null);
    setFramesDone(0);
    setSaved(false);
    stopAll();
    setPhase("scanning");

    const objectUrl = URL.createObjectURL(file);

    try {
      await ensurePose();

      const video = videoRef.current;
      if (!video) throw new Error("Video element not found");
      
      video.src = objectUrl;
      video.srcObject = null;
      video.muted = true;
      await video.play();

      function videoLoop() {
        if (!videoRef.current || videoRef.current.ended || videoRef.current.paused) {
          URL.revokeObjectURL(objectUrl);
          setPhase("stopped");
          return;
        }
        rafRef.current = requestAnimationFrame(async () => {
          try {
            if (poseRef.current && videoRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          } catch {}
          videoLoop();
        });
      }
      videoLoop();
    } catch {
      setError("Could not analyse this video. Try the live camera instead.");
      setPhase("idle");
      URL.revokeObjectURL(objectUrl);
    }
  }

  function loop() {
    rafRef.current = requestAnimationFrame(async () => {
      if (streamRef.current?.active && poseRef.current && videoRef.current) {
        try { await poseRef.current.send({ image: videoRef.current }); } catch {}
        loop();
      }
    });
  }

  const onResults = useCallback((results: any) => {
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

    if (!results.poseLandmarks?.length) return;

    drawSkeleton(ctx, results.poseLandmarks, w, h);

    try {
      const analysis = processBiometricFrame(results.poseLandmarks, mode);
      if (analysis && analysis.score100) {
        setResult(analysis);
      }

      setFramesDone(n => {
        const next = n + 1;
        if (next % 10 === 0) {
          const asym = detectAsymmetry(results.poseLandmarks);
          if (asym.detected) setAsymmetry(asym);
        }
        return next;
      });
    } catch {}
  }, [mode]);

  function drawSkeleton(ctx: CanvasRenderingContext2D, lm: any[], w: number, h: number) {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 2;
    for (const [a, b] of SKELETON_LINKS) {
      const p = lm[a];
      const q = lm[b];
      if (p?.visibility > 0.4 && q?.visibility > 0.4) {
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h);
        ctx.lineTo(q.x * w, q.y * h);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#f0b429";
    for (const p of lm) {
      if (p?.visibility > 0.4) {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  async function saveScan() {
    if (!result || saved) return;
    setSaving(true);

    const entry: ScanEntry = {
      mode,
      score: result.score100 ?? 0,
      level: result.level ?? "Raw",
      asymmetry_score: asymmetry?.asymmetryScore ?? 0,
      asymmetry_diff: asymmetry?.asymmetryDiff ?? 0,
      weak_side: asymmetry?.weakSide ?? null,
      frames_analysed: framesDone,
      session_date: new Date().toISOString().slice(0, 10),
      mode_label: MODES.find(m => m.id === mode)?.label ?? mode,
    };

    saveScanToStorage(entry);

    // Try backend (non-blocking)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API}/player/biomechanics`, {
        method: "POST",
        headers,
        body: JSON.stringify(entry),
      });
    } catch {
      // localStorage copy already saved
    }

    if (onScanComplete) onScanComplete(entry);
    
    setSaving(false);
    setSaved(true);
  }

  function handleStop() {
    stopAll();
    setPhase("stopped");
  }

  function handleReset() {
    stopAll();
    setPhase("idle");
    setResult(null);
    setAsymmetry(null);
    setError(null);
    setFramesDone(0);
    setSaved(false);
  }

  function handleClose() {
    handleReset();
    setOpen(false);
  }

  const levelStyle = result?.level ? LEVEL_STYLE[result.level] ?? LEVEL_STYLE.Raw : null;
  const isScanning = phase === "scanning";
  const isStopped = phase === "stopped";
  const canSave = isStopped && result && !saved;

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
            <p className="text-xs text-gray-400">AI pose analysis — live camera or video upload</p>
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
            Analysis Mode
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(null); setAsymmetry(null); setSaved(false); }}
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
              Start Camera
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
              {isScanning && framesDone === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white text-xs font-bold animate-pulse px-4 text-center">
                    Loading AI pose model…
                  </p>
                </div>
              )}
              {isStopped && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <p className="text-white text-xs font-bold">Analysis complete</p>
                </div>
              )}
            </div>

            {/* Live score card */}
            {result && levelStyle && (
              <div
                className="rounded-xl p-4 border"
                style={{ backgroundColor: levelStyle.bg, borderColor: levelStyle.border }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-xs font-extrabold uppercase tracking-wider"
                    style={{ color: levelStyle.text }}
                  >
                    {levelStyle.mark} — {MODES.find((m) => m.id === mode)?.label}
                  </span>
                  {result.score100 != null && (
                    <span className="text-sm font-black" style={{ color: levelStyle.text }}>
                      {result.score100}
                      <span className="text-xs font-medium">/100</span>
                    </span>
                  )}
                </div>
                {result.rating && (
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{result.rating}</p>
                )}
                {framesDone > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">{framesDone} frames analysed</p>
                )}
              </div>
            )}

            {/* Asymmetry warning */}
            {asymmetry?.isAsymmetric && (
              <div className="rounded-xl p-3 border border-amber-200 bg-amber-50 flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700">
                    Asymmetry detected — {asymmetry.weakSide} side compensation
                  </p>
                  <p className="text-[11px] text-amber-600 mt-0.5">
                    L knee: {asymmetry.leftKneeAngle}° vs R knee: {asymmetry.rightKneeAngle}°
                    {" "}({asymmetry.asymmetryDiff}° difference). Imbalances &gt;10° increase injury risk.
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {isScanning && (
                <button
                  onClick={handleStop}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                >
                  Stop
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
                  {saving ? "Saving…" : "Save Scan"}
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}