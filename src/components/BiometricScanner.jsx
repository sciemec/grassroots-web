"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Scan, ChevronDown, AlertCircle } from "lucide-react";
import { processBiometricFrame } from "@/utils/biomechanicsEngine";

// ─── Analysis mode config ───────────────────────────────────────────────────
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

const LEVEL_STYLE = {
  Elite: { bg: "#f0fdf4", border: "#86efac", text: "#166534", mark: "ELITE" },
  Good:  { bg: "#fefce8", border: "#fde047", text: "#854d0e", mark: "GOOD"  },
  Raw:   { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b", mark: "RAW"   },
};

// MediaPipe pose connections we care about (indices into landmarks array)
const SKELETON_LINKS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],   // arms
  [11, 23], [12, 24], [23, 24],                         // torso
  [23, 25], [25, 27], [27, 29], [27, 31],               // left leg
  [24, 26], [26, 28], [28, 30], [28, 32],               // right leg
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function BiometricScanner() {
  const [open, setOpen]           = useState(false);
  const [mode, setMode]           = useState("SPRINT_KNEE_DRIVE");
  const [phase, setPhase]         = useState("idle"); // idle | scanning | stopped
  const [result, setResult]       = useState(null);
  const [framesDone, setFramesDone] = useState(0);
  const [error, setError]         = useState(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // MediaStream (camera)
  const poseRef   = useRef(null); // MediaPipe Pose instance
  const rafRef    = useRef(null); // requestAnimationFrame id

  // Always stop camera when component is removed from DOM
  useEffect(() => () => stopAll(), []);

  function stopAll() {
    if (rafRef.current)    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current)  { videoRef.current.srcObject = null; videoRef.current.src = ""; }
  }

  // ── Load / reuse MediaPipe Pose ──────────────────────────────────────────
  async function ensurePose() {
    if (poseRef.current) {
      poseRef.current.onResults(onResults);
      return poseRef.current;
    }
    // Dynamic import keeps Next.js SSR happy — MediaPipe uses browser globals
    const mp = await import("@mediapipe/pose");
    const pose = new mp.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
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

  // ── Start live camera ────────────────────────────────────────────────────
  async function startCamera() {
    setError(null);
    setResult(null);
    setFramesDone(0);
    setPhase("scanning");

    try {
      await ensurePose();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = "";
        await videoRef.current.play();
        loop();
      }
    } catch (err) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not open camera. Try uploading a video clip instead.";
      setError(msg);
      setPhase("idle");
    }
  }

  // ── Handle video file upload ──────────────────────────────────────────────
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input so the same file can be re-selected
    e.target.value = "";

    setError(null);
    setResult(null);
    setFramesDone(0);
    stopAll();
    setPhase("scanning");

    const objectUrl = URL.createObjectURL(file);

    try {
      await ensurePose();

      const video = videoRef.current;
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
          try { await poseRef.current.send({ image: videoRef.current }); } catch {}
          videoLoop();
        });
      }
      videoLoop();
    } catch (err) {
      setError("Could not analyse this video. Try the live camera instead.");
      setPhase("idle");
      URL.revokeObjectURL(objectUrl);
    }
  }

  // ── rAF loop (camera mode) ───────────────────────────────────────────────
  function loop() {
    rafRef.current = requestAnimationFrame(async () => {
      if (streamRef.current?.active && poseRef.current && videoRef.current) {
        try { await poseRef.current.send({ image: videoRef.current }); } catch {}
        loop();
      }
    });
  }

  // ── MediaPipe results callback ───────────────────────────────────────────
  function onResults(results) {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;

    const w = video.videoWidth  || 640;
    const h = video.videoHeight || 480;
    canvas.width  = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (!results.poseLandmarks?.length) return;

    drawSkeleton(ctx, results.poseLandmarks, w, h);

    try {
      const analysis = processBiometricFrame(results.poseLandmarks, mode);
      if (analysis) {
        setResult(analysis);
        setFramesDone(n => n + 1);
      }
    } catch {}
  }

  // ── Draw green skeleton on canvas ────────────────────────────────────────
  function drawSkeleton(ctx, lm, w, h) {
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth   = 2;
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

  function handleStop() {
    stopAll();
    setPhase("stopped");
  }

  function handleReset() {
    stopAll();
    setPhase("idle");
    setResult(null);
    setError(null);
    setFramesDone(0);
  }

  function handleClose() {
    handleReset();
    setOpen(false);
  }

  const levelStyle = result ? (LEVEL_STYLE[result.level] ?? LEVEL_STYLE.Raw) : null;
  const isScanning = phase === "scanning";
  const isStopped  = phase === "stopped";

  // ── Collapsed pill ───────────────────────────────────────────────────────
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

  // ── Expanded panel ───────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header bar */}
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
        {/* Mode selector — always visible */}
        <div className="mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Analysis Mode
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setResult(null); }}
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

        {/* Idle state — action buttons */}
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
            {/* Video + skeleton canvas stacked */}
            <div
              className="relative rounded-xl overflow-hidden bg-black w-full"
              style={{ aspectRatio: "4/3" }}
            >
              {/* The same video element serves both camera stream and uploaded video */}
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
                  {result.score != null && (
                    <span className="text-sm font-black" style={{ color: levelStyle.text }}>
                      {result.score}
                      <span className="text-xs font-medium">/100</span>
                    </span>
                  )}
                </div>
                {result.details && (
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{result.details}</p>
                )}
                {framesDone > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">{framesDone} frames analysed</p>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
