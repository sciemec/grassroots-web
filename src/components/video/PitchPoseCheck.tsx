"use client";

/**
 * PitchPoseCheck — Compact pose form checker for Pitch Mode warmup.
 *
 * Designed for fullscreen green background. Shows a small camera window
 * at the bottom of the screen with skeleton overlay and exercise-specific
 * THUTO coaching cue. No card styling — just camera + feedback on dark.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { X, RotateCcw, Loader2 } from "lucide-react";
import { scorePose, scoreWarmupExercise, averageScores, type NormalizedLandmark } from "@/lib/pose-scorer";

// ─── MediaPipe CDN (same as PoseCamera) ──────────────────────────────────────

const MP_VISION_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const POSE_CONNECTIONS: [number, number][] = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
  [23,25],[24,26],[25,27],[26,28],
  [27,31],[28,32],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _mpModule: any = null;
async function loadMP() {
  if (_mpModule) return _mpModule;
  _mpModule = await import(/* webpackIgnore: true */ MP_VISION_CDN);
  return _mpModule;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Current warmup exercise name — drives exercise-specific scoring */
  currentExercise: string;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PitchPoseCheck({ currentExercise, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detRef    = useRef<any>(null);
  const bufRef    = useRef<ReturnType<typeof scorePose>[]>([]);
  const frameRef  = useRef(0);

  const [status, setStatus]       = useState<"loading" | "running" | "error">("loading");
  const [facingMode, setFacing]   = useState<"user" | "environment">("environment");
  const [score, setScore]         = useState(0);
  const [cue, setCue]             = useState("Getting ready…");

  // ── Stop ────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  // ── Frame loop ───────────────────────────────────────────────────────────────
  const runLoop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const det    = detRef.current;
    if (!video || !canvas || !det || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(runLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(runLoop); return; }

    if (canvas.width !== video.videoWidth)  canvas.width  = video.videoWidth;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

    ctx.save();
    if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    try {
      const res = det.detectForVideo(video, performance.now());
      if (res?.landmarks?.length > 0) {
        const lms: NormalizedLandmark[] = res.landmarks[0];
        const display = facingMode === "user" ? lms.map((l) => ({ ...l, x: 1 - l.x })) : lms;

        // Exercise-specific score + cue
        const exResult = scoreWarmupExercise(lms, currentExercise);
        bufRef.current.push(scorePose(lms));
        frameRef.current++;

        if (frameRef.current % 20 === 0) {
          const stable = averageScores(bufRef.current.slice(-20));
          const blended = Math.round((exResult.score + stable.overall) / 2);
          setScore(blended);
          setCue(exResult.cue);
          bufRef.current = bufRef.current.slice(-20);
        }

        // Draw skeleton
        const color = exResult.score >= 75 ? "#22c55e" : exResult.score >= 50 ? "#f0b429" : "#ef4444";
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        for (const [a, b] of POSE_CONNECTIONS) {
          const lA = display[a]; const lB = display[b];
          if (!lA || !lB || (lA.visibility ?? 1) < 0.3 || (lB.visibility ?? 1) < 0.3) continue;
          ctx.beginPath();
          ctx.moveTo(lA.x * canvas.width, lA.y * canvas.height);
          ctx.lineTo(lB.x * canvas.width, lB.y * canvas.height);
          ctx.stroke();
        }
        for (const lm of display) {
          if ((lm.visibility ?? 1) < 0.3) continue;
          ctx.beginPath();
          ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
      }
    } catch { /* skip bad frame */ }

    rafRef.current = requestAnimationFrame(runLoop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, currentExercise]);

  // ── Start ────────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setStatus("loading");
    try {
      const mp = await loadMP();
      const { PoseLandmarker, FilesetResolver, RunningMode } = mp;
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      let det = null;
      for (const delegate of ["GPU", "CPU"] as const) {
        try {
          det = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
            runningMode: RunningMode ? RunningMode.VIDEO : "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          break;
        } catch { if (delegate === "CPU") throw new Error("Model failed"); }
      }
      detRef.current = det;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("running");
      rafRef.current = requestAnimationFrame(runLoop);
    } catch {
      setStatus("error");
    }
  }, [facingMode, runLoop]);

  useEffect(() => { start(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = useCallback(() => { stop(); setFacing((m) => m === "user" ? "environment" : "user"); }, [stop]);
  useEffect(() => { if (status !== "loading") start(); }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreColor = score >= 75 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-black/95">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Form Check · {currentExercise}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={flip} className="rounded-lg p-1 text-white/50 hover:text-white">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => { stop(); onClose(); }} className="rounded-lg p-1 text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Camera + overlay */}
      <div className="relative h-52 w-full overflow-hidden bg-black">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-0" playsInline muted autoPlay />
        <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full object-cover transition-opacity ${status === "running" ? "opacity-100" : "opacity-0"}`} />

        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
            <p className="text-xs text-white/50">Loading pose model…</p>
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
            <p className="text-xs text-red-400">Camera unavailable.</p>
            <p className="text-xs text-white/40">Allow camera access and try again.</p>
          </div>
        )}

        {/* Score ring */}
        {status === "running" && score > 0 && (
          <div className="absolute left-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 bg-black/60"
            style={{ borderColor: scoreColor }}>
            <span className="text-base font-black" style={{ color: scoreColor }}>{score}</span>
          </div>
        )}
      </div>

      {/* THUTO coaching cue */}
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-white">
          <span className="mr-1 text-[#f0b429]">THUTO:</span>
          {status === "running" ? cue : "Point your phone away, step back 2–3 metres."}
        </p>
        <p className="mt-1 text-xs text-white/40">
          Place phone against your bag — full body must be visible
        </p>
      </div>
    </div>
  );
}
