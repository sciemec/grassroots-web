"use client";

/**
 * PoseCamera — Live camera pose detection with MediaPipe PoseLandmarker.
 *
 * Loads the MediaPipe Tasks Vision bundle from CDN on first use (~8 MB).
 * The model file (pose_landmarker_lite) is fetched from Google's storage.
 * Both are cached by the service worker after first load — works offline.
 *
 * Output:
 *  - Real-time skeleton overlay drawn on a <canvas> over the <video>
 *  - Movement quality score (0–100) reported via onScore prop
 *  - Score breakdown: symmetry, balance, posture, joint angles
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera, CameraOff, Loader2, AlertTriangle, Activity,
  Zap, Shield, Target, RotateCcw, WifiOff,
} from "lucide-react";
import { scorePose, averageScores, type NormalizedLandmark } from "@/lib/pose-scorer";
import { CameraPermissionHelp } from "@/components/ui/camera-permission-help";

// ─── MediaPipe CDN ────────────────────────────────────────────────────────────

const MP_VISION_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

// MediaPipe skeleton connections (pairs of landmark indices)
const POSE_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,7],[0,4],[4,5],[5,6],[6,8],        // face
  [9,10],                                                   // mouth
  [11,12],[11,13],[13,15],[12,14],[14,16],                  // arms
  [15,17],[15,19],[15,21],[16,18],[16,20],[16,22],          // hands
  [11,23],[12,24],[23,24],                                  // torso
  [23,25],[24,26],[25,27],[26,28],                          // legs
  [27,29],[28,30],[29,31],[30,32],[27,31],[28,32],          // feet
];

// ─── Types ────────────────────────────────────────────────────────────────────

type PoseState = "idle" | "loading" | "ready" | "running" | "error" | "no-camera";

export interface PoseCameraProps {
  /** Called each time a stable score is computed (every ~30 frames) */
  onScore?: (score: number, breakdown: { symmetry: number; balance: number; posture: number; jointAngles: number }) => void;
  /** Focus area — shown in the UI to give context */
  focusArea?: string;
}

// ─── CDN loader ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mpVisionModule: any = null;

async function loadMediaPipe() {
  if (mpVisionModule) return mpVisionModule;
  // Dynamic import from CDN using a module script
  const mod = await import(/* webpackIgnore: true */ MP_VISION_CDN);
  mpVisionModule = mod;
  return mod;
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  canvasW: number,
  canvasH: number,
  score: number
) {
  // Colour based on score
  const lineColor  = score >= 75 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";
  const pointColor = "#ffffff";

  // Draw connections
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = lineColor;
  ctx.lineCap = "round";

  for (const [a, b] of POSE_CONNECTIONS) {
    const lmA = landmarks[a];
    const lmB = landmarks[b];
    if (!lmA || !lmB) continue;
    if ((lmA.visibility ?? 1) < 0.3 || (lmB.visibility ?? 1) < 0.3) continue;

    ctx.beginPath();
    ctx.moveTo(lmA.x * canvasW, lmA.y * canvasH);
    ctx.lineTo(lmB.x * canvasW, lmB.y * canvasH);
    ctx.stroke();
  }

  // Draw joints
  for (const lm of landmarks) {
    if ((lm.visibility ?? 1) < 0.3) continue;
    ctx.beginPath();
    ctx.arc(lm.x * canvasW, lm.y * canvasH, 4, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.fill();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Score badge top-left
  const scoreText = `${score}`;
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = lineColor;
  ctx.fillText(scoreText, 12, 30);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Movement Score", 12, 46);
}

// ─── Score breakdown bar ──────────────────────────────────────────────────────

function ScoreBar({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 flex-shrink-0" style={{ color }} />
          <span className="text-xs font-medium text-white">{label}</span>
        </div>
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PoseCamera({ onScore, focusArea }: PoseCameraProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef = useRef<any>(null);
  const scoresBuffer = useRef<ReturnType<typeof scorePose>[]>([]);
  const frameCount   = useRef(0);

  const [poseState, setPoseState] = useState<PoseState>("idle");
  const [errorMsg, setErrorMsg]   = useState("");
  const [currentScore, setCurrentScore] = useState<ReturnType<typeof scorePose> | null>(null);
  const [stableScore, setStableScore]   = useState<ReturnType<typeof scorePose> | null>(null);
  const [facingMode, setFacingMode]     = useState<"user" | "environment">("environment");

  // ── Stop camera ─────────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    scoresBuffer.current = [];
    frameCount.current   = 0;
    setPoseState("idle");
    setCurrentScore(null);
    setStableScore(null);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Frame loop ───────────────────────────────────────────────────────────────

  const runFrameLoop = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const det    = detectorRef.current;
    if (!video || !canvas || !det || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(runFrameLoop);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) { rafRef.current = requestAnimationFrame(runFrameLoop); return; }

    // Match canvas to video dimensions
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    // Clear and draw mirrored video frame (front camera = mirror)
    ctx.save();
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // Run pose detection
    try {
      const result = det.detectForVideo(video, performance.now());
      if (result?.landmarks?.length > 0) {
        const lms: NormalizedLandmark[] = result.landmarks[0];

        const frameScore = scorePose(lms);
        setCurrentScore(frameScore);

        // Buffer 30 frames then emit a stable average
        scoresBuffer.current.push(frameScore);
        frameCount.current++;

        if (frameCount.current % 30 === 0) {
          const stable = averageScores(scoresBuffer.current.slice(-30));
          setStableScore(stable);
          onScore?.(stable.overall, {
            symmetry:    stable.symmetry,
            balance:     stable.balance,
            posture:     stable.posture,
            jointAngles: stable.jointAngles,
          });
        }

        // Draw skeleton (mirror landmark x for front cam)
        const displayLms = facingMode === "user"
          ? lms.map((l) => ({ ...l, x: 1 - l.x }))
          : lms;

        drawSkeleton(ctx, displayLms, canvas.width, canvas.height, frameScore.overall);
      }
    } catch {
      // Silently skip bad frames
    }

    rafRef.current = requestAnimationFrame(runFrameLoop);
  }, [facingMode, onScore]);

  // ── Start camera ─────────────────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    setPoseState("loading");
    setErrorMsg("");

    try {
      // 1. Load MediaPipe
      const mp = await loadMediaPipe();
      const { PoseLandmarker, FilesetResolver, RunningMode } = mp;

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );

      // Try GPU first (faster), fall back to CPU (wider device support — especially Android)
      let detector = null;
      for (const delegate of ["GPU", "CPU"] as const) {
        try {
          detector = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
            runningMode: RunningMode ? RunningMode.VIDEO : "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          break;
        } catch {
          if (delegate === "CPU") throw new Error("Pose model failed to load. Try a different browser.");
        }
      }
      detectorRef.current = detector;

      // 2. Check camera permission status before trying (avoids silent denial on some browsers)
      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({ name: "camera" as PermissionName });
          if (perm.state === "denied") {
            throw new DOMException("Camera permission denied by browser settings.", "NotAllowedError");
          }
        } catch (e) {
          // If permissions API not supported, proceed anyway
          if (e instanceof DOMException && e.name === "NotAllowedError") throw e;
        }
      }

      // 3. Open camera — fall back to basic constraints if ideal constraints fail
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (e) {
        const name = e instanceof DOMException ? e.name : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError") throw e;
        // Retry with minimal constraints for older/restrictive devices
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setPoseState("running");
      rafRef.current = requestAnimationFrame(runFrameLoop);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setPoseState("no-camera");
        setErrorMsg("Camera permission denied. Allow camera access and try again.");
      } else if (msg.includes("NotFound") || msg.includes("Devices")) {
        setPoseState("no-camera");
        setErrorMsg("No camera found on this device.");
      } else {
        setPoseState("error");
        setErrorMsg(msg.length > 120 ? msg.slice(0, 120) + "…" : msg);
      }
    }
  }, [facingMode, runFrameLoop]);

  const flipCamera = useCallback(() => {
    stopCamera();
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  }, [stopCamera]);

  const displayScore = stableScore ?? currentScore;
  const scoreColor   = !displayScore ? "#86a891"
    : displayScore.overall >= 75 ? "#22c55e"
    : displayScore.overall >= 50 ? "#f0b429"
    : "#ef4444";

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-white">Pose Analysis</span>
          {focusArea && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium capitalize text-accent">
              {focusArea}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {poseState === "running" && (
            <>
              <button
                onClick={flipCamera}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 transition-colors"
                title="Flip camera"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <CameraOff className="h-3.5 w-3.5" /> Stop
              </button>
            </>
          )}
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative aspect-video w-full bg-black">
        {/* Hidden video element — source for both display and ML detection */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover opacity-0"
          playsInline
          muted
          autoPlay
        />

        {/* Canvas = video + skeleton overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${poseState === "running" ? "opacity-100" : "opacity-0"}`}
        />

        {/* Idle state */}
        {poseState === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
              <Camera className="h-8 w-8 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-white">Live Pose Analysis</p>
              <p className="mt-1 text-xs text-muted-foreground">
                MediaPipe AI detects 33 body keypoints and draws a live skeleton overlay.
                Scores your symmetry, balance, posture and joint angles in real time.
              </p>
            </div>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-opacity"
            >
              <Camera className="h-4 w-4" />
              Start Pose Camera
            </button>
            <p className="text-[10px] text-muted-foreground">
              Requires camera permission · Model ~8 MB (cached after first load)
            </p>
          </div>
        )}

        {/* Loading state */}
        {poseState === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
            <p className="text-sm text-white">Loading MediaPipe model…</p>
            <p className="text-xs text-muted-foreground">First load ~8 MB · cached afterwards</p>
          </div>
        )}

        {/* Error / no camera */}
        {(poseState === "error" || poseState === "no-camera") && (
          <div className="absolute inset-0 overflow-y-auto bg-black/90">
            {poseState === "no-camera" ? (
              <CameraPermissionHelp onRetry={startCamera} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-6 text-center h-full">
                <AlertTriangle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-red-300">{errorMsg}</p>
                <button
                  onClick={startCamera}
                  className="rounded-xl border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Live score ring overlay (top-right when running) */}
        {poseState === "running" && displayScore && (
          <div className="absolute right-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 bg-black/60 backdrop-blur-sm"
            style={{ borderColor: scoreColor }}>
            <span className="text-lg font-black" style={{ color: scoreColor }}>
              {displayScore.overall}
            </span>
            <span className="text-[9px] text-white/60">score</span>
          </div>
        )}
      </div>

      {/* Score breakdown — shown when running */}
      {poseState === "running" && displayScore && (
        <div className="border-t border-white/10 px-5 py-4 space-y-2.5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent/70">
            Movement Breakdown
          </p>
          <ScoreBar label="Symmetry"     value={displayScore.symmetry}    icon={Zap}      color="#3b82f6" />
          <ScoreBar label="Balance"      value={displayScore.balance}     icon={Shield}   color="#a855f7" />
          <ScoreBar label="Posture"      value={displayScore.posture}     icon={Activity} color="#22c55e" />
          <ScoreBar label="Joint Angles" value={displayScore.jointAngles} icon={Target}   color="#f0b429" />

          {stableScore && (
            <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Movement Quality Score</p>
                <p className="text-lg font-black" style={{ color: scoreColor }}>
                  {stableScore.overall}<span className="text-xs font-normal text-muted-foreground">/100</span>
                </p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stableScore.overall >= 75 ? "Excellent form — keep it up!" :
                 stableScore.overall >= 50 ? "Good effort — watch your balance" :
                 "Focus on posture and symmetry"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
