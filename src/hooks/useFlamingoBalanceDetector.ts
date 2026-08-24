"use client";

/**
 * useFlamingoBalanceDetector
 *
 * MediaPipe hook for EUROFIT FLB (Flamingo Balance Test) automatic fall counting.
 *
 * Setup:
 *   - Place phone side-on so the player's full body is visible in profile.
 *   - Player stands on preferred foot (other leg bent at knee, foot held behind).
 *   - MediaPipe pose landmarker (lite) loaded from CDN at runtime.
 *
 * Detection strategy:
 *   - Tracks both ankle landmarks (L_ANKLE=27, R_ANKLE=28).
 *   - Gap = standingAnkle.y - raisedAnkle.y
 *     (positive when raised foot is up; Y=0 is top of frame in MediaPipe).
 *   - Calibrates over first CALIB_FRAMES frames to confirm detection is running.
 *   - FALL:     gap < FALL_THRESHOLD     (raised foot dropped toward floor).
 *   - RECOVERY: gap > RECOVERY_THRESHOLD (raised foot back up).
 *   - Each FALL→RECOVERY transition fires onFallCounted(totalFalls).
 *   - The 60-second test timer is managed by the calling modal, not this hook.
 *
 * What it CANNOT do:
 *   - Detect exact floor contact — only approximate from ankle vertical position.
 *   - Work reliably with a front-on camera angle (must be side-on).
 */

import { useRef, useCallback, useEffect } from "react";

// -- MediaPipe CDN (same bundle as other pose hooks) -------------------------

const MP_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// -- Landmark indices --------------------------------------------------------

const L_ANKLE = 27;
const R_ANKLE = 28;

// -- Detection thresholds ----------------------------------------------------

/** Frames to collect before exiting calibration phase. */
const CALIB_FRAMES = 20;

/**
 * If standingAnkle.y - raisedAnkle.y < FALL_THRESHOLD the raised foot has
 * dropped close to floor level → transition to "falling".
 */
const FALL_THRESHOLD = 0.10;

/**
 * Gap must recover above this value before the fall is counted and the hook
 * resets to "balanced" (prevents counting same fall multiple times).
 */
const RECOVERY_THRESHOLD = 0.18;

// -- Public types ------------------------------------------------------------

export interface UseFlamingoBalanceDetectorOptions {
  /** Which foot the player is balancing ON (the standing foot). */
  standingFoot: "left" | "right";
  /** Fired each time a fall + recovery cycle completes. */
  onFallCounted: (totalFalls: number) => void;
  /** Optional: fired when fall state changes (true = foot down, false = recovered). */
  onFallStateChange?: (isFalling: boolean) => void;
}

// -- Hook --------------------------------------------------------------------

export function useFlamingoBalanceDetector({
  standingFoot,
  onFallCounted,
  onFallStateChange,
}: UseFlamingoBalanceDetectorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const rafRef        = useRef<number>(0);
  const runningRef    = useRef(false);

  // Calibration
  const calibSamplesRef = useRef<number[]>([]);

  // Detection state
  const phaseRef = useRef<"calibrating" | "balanced" | "falling">("calibrating");
  const fallsRef = useRef(0);

  // Keep standingFoot in a ref so start() always uses the latest value
  const standingFootRef = useRef(standingFoot);
  useEffect(() => { standingFootRef.current = standingFoot; }, [standingFoot]);

  // Callback refs — prevents stale closures in rAF
  const cbFallRef  = useRef(onFallCounted);
  const cbStateRef = useRef(onFallStateChange);
  useEffect(() => { cbFallRef.current  = onFallCounted;    }, [onFallCounted]);
  useEffect(() => { cbStateRef.current = onFallStateChange; }, [onFallStateChange]);

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
      console.error("[useFlamingoBalanceDetector] Model load error:", err);
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
    if (!lm || lm.length < 29) return;

    const foot = standingFootRef.current;
    const standingAnkle = foot === "left" ? lm[L_ANKLE] : lm[R_ANKLE];
    const raisedAnkle   = foot === "left" ? lm[R_ANKLE] : lm[L_ANKLE];

    // Require reasonable visibility on both ankles
    const sVis = standingAnkle.visibility ?? 0;
    const rVis = raisedAnkle.visibility   ?? 0;
    if (sVis < 0.4 || rVis < 0.3) return;

    // Gap: how much higher the raised ankle is in space.
    // MediaPipe Y=0 is top, so standing ankle (near floor) has larger Y.
    // Positive gap = raised foot is up; near-zero gap = foot dropped to floor.
    const gap = standingAnkle.y - raisedAnkle.y;

    // -- Calibration: wait for consistent detection --------------------------
    if (phaseRef.current === "calibrating") {
      calibSamplesRef.current.push(gap);
      if (calibSamplesRef.current.length >= CALIB_FRAMES) {
        phaseRef.current = "balanced";
      }
      return;
    }

    // -- Fall state machine --------------------------------------------------
    if (phaseRef.current === "balanced") {
      if (gap < FALL_THRESHOLD) {
        phaseRef.current = "falling";
        cbStateRef.current?.(true);
      }
      return;
    }

    if (phaseRef.current === "falling") {
      if (gap > RECOVERY_THRESHOLD) {
        phaseRef.current = "balanced";
        cbStateRef.current?.(false);
        fallsRef.current += 1;
        cbFallRef.current(fallsRef.current);
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
    standingFootRef.current = standingFoot;

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
      console.error("[useFlamingoBalanceDetector] Camera error:", err);
      return false;
    }

    // Reset all state
    calibSamplesRef.current = [];
    phaseRef.current        = "calibrating";
    fallsRef.current        = 0;

    runningRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
    return true;
  }, [standingFoot, loadModel, loop]);

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
