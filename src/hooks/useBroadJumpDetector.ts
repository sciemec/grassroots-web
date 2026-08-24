"use client";

/**
 * useBroadJumpDetector
 *
 * MediaPipe hook for EUROFIT SBJ (Standing Broad Jump) attempt detection.
 *
 * Setup:
 *   - Place phone side-on so the player's full body is visible in profile.
 *   - MediaPipe pose landmarker (lite) loaded from CDN at runtime.
 *
 * Detection strategy:
 *   - Calibrates a resting hip-Y baseline from the first CALIB_FRAMES good frames
 *     (average of L_HIP and R_HIP normalised Y).
 *   - In MediaPipe coords Y=0 is the top of frame. When the player jumps, their
 *     hips rise → normalised Y DECREASES below baseline.
 *   - AIRBORNE: hipY < baseline - JUMP_THRESHOLD  (hips rose ≥ 6 % of frame)
 *   - LANDED:   hipY > baseline - LAND_THRESHOLD  (hips back to within 4 % of baseline)
 *   - On each LANDED transition: fires onAttemptCompleted(attemptNumber).
 *   - Automatically stops after MAX_ATTEMPTS landings.
 *
 * What it CANNOT do:
 *   - Measure the jump distance in cm — pixel displacement has no fixed real-world
 *     scale without calibration. The actual distance must be entered manually.
 *
 * The hook's job is to act as an automatic "attempt counter" so the player does
 * not need to tap anything between jumps.
 */

import { useRef, useCallback, useEffect } from "react";

// -- MediaPipe CDN (same bundle as other pose hooks) --------------------------

const MP_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// -- Landmark indices --------------------------------------------------------

const L_HIP = 23;
const R_HIP = 24;

// -- Detection thresholds ----------------------------------------------------

/** Frames of standing-still hip-Y to collect before calibration is complete. */
const CALIB_FRAMES = 30;

/**
 * Hip must rise by at least this fraction of frame height (Y decreases by this
 * much below baseline) to be counted as airborne.
 */
const JUMP_THRESHOLD = 0.06;

/**
 * Hip must return to within this fraction of frame height above baseline
 * (i.e. hipY > baseline - LAND_THRESHOLD) to confirm landing.
 */
const LAND_THRESHOLD = 0.04;

/** Maximum number of attempts before the hook stops automatically. */
const MAX_ATTEMPTS = 2;

// -- Public types ------------------------------------------------------------

export interface UseBroadJumpDetectorOptions {
  /** Fired each time the player completes a jump and lands (up to MAX_ATTEMPTS). */
  onAttemptCompleted: (attemptNumber: number) => void;
  /** Optional: fired when airborne state changes (true = in air, false = landed). */
  onAirborneChange?: (isAirborne: boolean) => void;
}

// -- Hook --------------------------------------------------------------------

export function useBroadJumpDetector({
  onAttemptCompleted,
  onAirborneChange,
}: UseBroadJumpDetectorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const rafRef        = useRef<number>(0);
  const runningRef    = useRef(false);

  // Calibration state
  const calibSamplesRef = useRef<number[]>([]);
  const baselineYRef    = useRef<number | null>(null);

  // Attempt tracking
  const phaseRef      = useRef<"calibrating" | "ready" | "airborne">("calibrating");
  const attemptRef    = useRef(0);
  const airborneRef   = useRef(false);

  // Callback refs — prevents stale closures in rAF
  const cbAttemptRef  = useRef(onAttemptCompleted);
  const cbAirborneRef = useRef(onAirborneChange);
  useEffect(() => { cbAttemptRef.current  = onAttemptCompleted; }, [onAttemptCompleted]);
  useEffect(() => { cbAirborneRef.current = onAirborneChange;   }, [onAirborneChange]);

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
      console.error("[useBroadJumpDetector] Model load error:", err);
      return false;
    }
  }, []);

  // -- Per-frame logic -------------------------------------------------------

  const processFrame = useCallback(() => {
    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;
    if (attemptRef.current >= MAX_ATTEMPTS) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch { return; }

    const lm = result?.landmarks?.[0];
    if (!lm || lm.length < 25) return;

    const lHip = lm[L_HIP];
    const rHip = lm[R_HIP];

    // Require reasonable visibility on at least one hip
    const lVis = lHip.visibility ?? 0;
    const rVis = rHip.visibility ?? 0;
    if (lVis < 0.4 && rVis < 0.4) return;

    // Average hip Y, weighted by visibility
    const totalVis = lVis + rVis;
    const hipY = (lHip.y * lVis + rHip.y * rVis) / totalVis;

    // -- Calibration phase: collect baseline hip-Y from standing still -------
    if (phaseRef.current === "calibrating") {
      calibSamplesRef.current.push(hipY);
      if (calibSamplesRef.current.length >= CALIB_FRAMES) {
        const sum = calibSamplesRef.current.reduce((a, b) => a + b, 0);
        baselineYRef.current = sum / calibSamplesRef.current.length;
        phaseRef.current = "ready";
      }
      return;
    }

    const baseline = baselineYRef.current;
    if (baseline === null) return;

    // -- Jump detection ------------------------------------------------------
    if (phaseRef.current === "ready") {
      if (hipY < baseline - JUMP_THRESHOLD) {
        phaseRef.current = "airborne";
        airborneRef.current = true;
        cbAirborneRef.current?.(true);
      }
      return;
    }

    // -- Landing detection ---------------------------------------------------
    if (phaseRef.current === "airborne") {
      if (hipY > baseline - LAND_THRESHOLD) {
        phaseRef.current = "ready";
        airborneRef.current = false;
        cbAirborneRef.current?.(false);
        attemptRef.current += 1;
        cbAttemptRef.current(attemptRef.current);
      }
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
   * Start camera and pose detection.
   * Pass the HTMLVideoElement that will receive the camera stream.
   * Returns true on success.
   */
  const start = useCallback(async (videoEl: HTMLVideoElement): Promise<boolean> => {
    if (runningRef.current) return true;
    videoRef.current = videoEl;

    const ok = await loadModel();
    if (!ok) return false;

    try {
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
      console.error("[useBroadJumpDetector] Camera error:", err);
      return false;
    }

    // Reset all state
    calibSamplesRef.current = [];
    baselineYRef.current    = null;
    phaseRef.current        = "calibrating";
    attemptRef.current      = 0;
    airborneRef.current     = false;

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
