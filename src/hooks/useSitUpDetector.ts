"use client";

/**
 * useSitUpDetector
 *
 * MediaPipe hook for EUROFIT SUP (30-second sit-up test) automatic rep counting.
 *
 * Setup:
 *   - Place phone side-on so the player's full body is visible in profile.
 *   - MediaPipe pose landmarker (lite) loaded from CDN at runtime.
 *
 * Detection strategy:
 *   - Calculates the trunk-thigh angle at the hip using shoulder, hip, and
 *     knee landmarks. Picks whichever side (left/right) has better visibility.
 *   - DOWN phase: angle > DOWN_ANGLE (130 deg) -- player lying flat.
 *   - UP phase:   angle < UP_ANGLE   (80 deg)  -- player sitting up.
 *   - Rep counted on the UP->DOWN transition (player completes return to mat).
 *
 * Timer management:
 *   - Intentionally NOT managed by this hook -- the calling modal controls
 *     the 30-second countdown to keep concerns separate (same pattern as
 *     useYoyoPoseDetector where audio is the timer source).
 */

import { useRef, useCallback, useEffect } from "react";

// -- MediaPipe CDN (same bundle as useYoyoPoseDetector) ----------------------

const MP_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// -- Landmark indices --------------------------------------------------------

const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP      = 23;
const R_HIP      = 24;
const L_KNEE     = 25;
const R_KNEE     = 26;

// -- Detection thresholds (degrees at the hip vertex) ------------------------

/** Trunk-thigh angle below this -> player is fully up (torso upright). */
const UP_ANGLE   = 80;
/** Trunk-thigh angle above this -> player is lying flat on the mat. */
const DOWN_ANGLE = 130;

// -- Helpers -----------------------------------------------------------------

function calcAngleDeg(
  a:      { x: number; y: number },
  vertex: { x: number; y: number },
  b:      { x: number; y: number },
): number {
  const ax = a.x - vertex.x, ay = a.y - vertex.y;
  const bx = b.x - vertex.x, by = b.y - vertex.y;
  const dot = ax * bx + ay * by;
  const mag = Math.sqrt((ax * ax + ay * ay) * (bx * bx + by * by));
  if (mag === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}

// -- Public types ------------------------------------------------------------

export interface UseSitUpDetectorOptions {
  /** Fired each time a full rep (down -> up -> down) is completed. */
  onRepCounted: (totalReps: number) => void;
}

// -- Hook --------------------------------------------------------------------

export function useSitUpDetector({ onRepCounted }: UseSitUpDetectorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const rafRef        = useRef<number>(0);
  const runningRef    = useRef(false);

  // Rep-counting state (refs only -- never useState inside rAF callback)
  const phaseRef    = useRef<"down" | "up">("down");
  const repCountRef = useRef(0);

  // Callback ref -- keeps rAF closure from holding a stale function reference
  const cbRepRef = useRef(onRepCounted);
  useEffect(() => { cbRepRef.current = onRepCounted; }, [onRepCounted]);

  // -- CDN + model -----------------------------------------------------------

  const loadModel = useCallback(async (): Promise<boolean> => {
    if (landmarkerRef.current) return true;
    try {
      if (!document.querySelector(`script[src="${MP_CDN}"]`)) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = MP_CDN;
          s.onload  = () => resolve();
          s.onerror = () => reject(new Error("MediaPipe CDN load failed"));
          document.head.appendChild(s);
        });
      } else {
        // Script tag already exists -- wait for PoseLandmarker to appear on window
        await new Promise<void>((resolve) => {
          const deadline = Date.now() + 6000;
          const poll = setInterval(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).PoseLandmarker || Date.now() > deadline) {
              clearInterval(poll);
              resolve();
            }
          }, 100);
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const PoseLandmarker  = w.PoseLandmarker;
      const FilesetResolver = w.FilesetResolver;
      if (!PoseLandmarker || !FilesetResolver) {
        throw new Error("PoseLandmarker / FilesetResolver not on window after CDN load");
      }

      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_PATH);
      landmarkerRef.current = await PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      return true;
    } catch (err) {
      console.error("[useSitUpDetector] Model load error:", err);
      return false;
    }
  }, []);

  // -- Per-frame logic -------------------------------------------------------

  const processFrame = useCallback(() => {
    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch { return; }

    const lm = result?.landmarks?.[0];
    if (!lm || lm.length < 27) return;

    // Pick the side with better landmark visibility (player may face either way)
    const lVis = (lm[L_SHOULDER].visibility ?? 0) +
                 (lm[L_HIP].visibility      ?? 0) +
                 (lm[L_KNEE].visibility     ?? 0);
    const rVis = (lm[R_SHOULDER].visibility ?? 0) +
                 (lm[R_HIP].visibility      ?? 0) +
                 (lm[R_KNEE].visibility     ?? 0);
    const shoulder = lVis >= rVis ? lm[L_SHOULDER] : lm[R_SHOULDER];
    const hip      = lVis >= rVis ? lm[L_HIP]      : lm[R_HIP];
    const knee     = lVis >= rVis ? lm[L_KNEE]      : lm[R_KNEE];

    const angle = calcAngleDeg(shoulder, hip, knee);

    // State machine: DOWN -> UP -> DOWN = 1 rep
    if (phaseRef.current === "down" && angle < UP_ANGLE) {
      phaseRef.current = "up";
    } else if (phaseRef.current === "up" && angle > DOWN_ANGLE) {
      phaseRef.current = "down";
      repCountRef.current += 1;
      cbRepRef.current(repCountRef.current);
    }
  }, []);

  // -- rAF loop --------------------------------------------------------------

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    processFrame();
    rafRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  // -- Public API ------------------------------------------------------------

  /**
   * Start camera and pose detection loop.
   * Pass the HTMLVideoElement that will receive the camera stream.
   * Returns true on success, false if camera permission denied or model failed.
   */
  const start = useCallback(async (videoEl: HTMLVideoElement): Promise<boolean> => {
    if (runningRef.current) return true;
    videoRef.current = videoEl;

    const ok = await loadModel();
    if (!ok) return false;

    try {
      // Side-on view: use environment camera (rear-facing on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width:  { ideal: 480 },
          height: { ideal: 640 },
        },
      });
      streamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (err) {
      console.error("[useSitUpDetector] Camera error:", err);
      return false;
    }

    // Reset per-test state
    phaseRef.current    = "down";
    repCountRef.current = 0;

    runningRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
    return true;
  }, [loadModel, loop]);

  /** Stop camera and detection loop. Safe to call multiple times. */
  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stop(); }, [stop]);

  return { cameraVideoRef: videoRef, start, stop };
}
