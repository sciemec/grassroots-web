"use client";

/**
 * useYoyoPoseDetector — v2
 *
 * Phase-correct MediaPipe hook for Yo-Yo IR1 automated detection.
 *
 * Protocol phases per shuttle:
 *   RUN      startTime → endTime      Player must reach B (20 m mark)
 *   RECOVERY endTime → recoveryEnd    Player must return to A (10 s window)
 *   IDLE     recoveryEnd → next start Rest between shuttles
 *
 * Completion: reachedB (in RUN) + returnedA (in RECOVERY) → onShuttleCompleted
 * Miss A:     endTime reached without reachedB             → onMissDetected
 * Miss B:     recoveryEnd reached; reachedB but no return  → onMissDetected
 *
 * Setup:
 *   - Camera must be face-on, wide, with zones A (0 m) and B (20 m) visible.
 *   - MediaPipe pose landmarker (lite) loaded from CDN at runtime.
 *   - Hip X (avg of L_HIP + R_HIP landmarks) is used for lateral tracking.
 *   - Frames where hip visibility < MIN_VISIBILITY are skipped.
 */

import { useRef, useCallback, useEffect } from "react";

// ── MediaPipe CDN ─────────────────────────────────────────────────────────────

const MP_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm";

// ── Landmark indices ──────────────────────────────────────────────────────────

const L_HIP = 23;
const R_HIP = 24;

// ── Detection thresholds ──────────────────────────────────────────────────────

/** Normalised frame-width travel needed to count as "reached B". */
const REACH_B_THRESHOLD = 0.22;

/**
 * Displacement must drop to ≤ this fraction of the peak before we call it
 * a confirmed return to A (player back at start).
 */
const REVERSAL_RATIO = 0.65;

/** Skip frames where either hip landmark has visibility below this score. */
const MIN_VISIBILITY = 0.60;

// ── Public types ──────────────────────────────────────────────────────────────

export type YoyoPhase    = "RUN" | "RECOVERY" | "IDLE";
export type YoyoProtocol = "yo_yo_ir1" | "eurofit_esr";

export interface YoyoScheduleEntry {
  globalShuttle: number;
  startTime:    number; // seconds — RUN phase opens (must reach B by endTime)
  endTime:      number; // seconds — RUN phase closes
  recoveryEnd:  number; // seconds — RECOVERY phase closes (must return by here)
}

export interface UseYoyoPoseDetectorOptions {
  /** Full shuttle schedule (same YOYO_SCHEDULE used by the modal). */
  schedule: YoyoScheduleEntry[];
  /** Returns the audio element's currentTime in seconds. */
  getAudioTime: () => number;
  /** Called once when the player completes a shuttle (reached B + returned to A). */
  onShuttleCompleted: (globalShuttle: number) => void;
  /** Called once on Miss-A (no B reached) or Miss-B (B reached, no return). */
  onMissDetected: (globalShuttle: number) => void;
  /** Optional: called when the detected phase changes (for live coaching cues). */
  onPhaseChange?: (phase: YoyoPhase) => void;
  /** Protocol in use — informational, defaults to yo_yo_ir1. */
  protocol?: YoyoProtocol;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useYoyoPoseDetector({
  schedule,
  getAudioTime,
  onShuttleCompleted,
  onMissDetected,
  onPhaseChange,
  protocol = "yo_yo_ir1",
}: UseYoyoPoseDetectorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef  = useRef<any>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const videoRef       = useRef<HTMLVideoElement | null>(null);
  const rafRef         = useRef<number>(0);
  const runningRef     = useRef(false);

  // Per-shuttle tracking (refs only — never useState inside rAF callbacks)
  const lastGlobalRef  = useRef<number>(-1);
  const evaluatedRef   = useRef<Set<number>>(new Set()); // shuttles fully resolved
  const recovEvalRef   = useRef<Set<number>>(new Set()); // recovery phase resolved
  const startXRef      = useRef<number | null>(null);    // hip X at RUN start
  const peakRef        = useRef<number>(0);              // max displacement this shuttle
  const reachedBRef    = useRef<boolean>(false);
  const returnedARef   = useRef<boolean>(false);

  // Phase tracking
  const currentPhaseRef    = useRef<YoyoPhase>("IDLE");
  const completedRepsRef   = useRef<number>(0);

  // Callback refs — keep rAF closure from capturing stale functions
  const cbCompletedRef = useRef(onShuttleCompleted);
  const cbMissRef      = useRef(onMissDetected);
  const cbPhaseRef     = useRef(onPhaseChange);
  const getTimeRef     = useRef(getAudioTime);
  const scheduleRef    = useRef(schedule);

  useEffect(() => { cbCompletedRef.current = onShuttleCompleted; }, [onShuttleCompleted]);
  useEffect(() => { cbMissRef.current = onMissDetected; }, [onMissDetected]);
  useEffect(() => { cbPhaseRef.current = onPhaseChange; }, [onPhaseChange]);
  useEffect(() => { getTimeRef.current = getAudioTime; }, [getAudioTime]);
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);

  // ── Phase helper ──────────────────────────────────────────────────────────

  const setPhase = useCallback((p: YoyoPhase) => {
    if (currentPhaseRef.current === p) return;
    currentPhaseRef.current = p;
    cbPhaseRef.current?.(p);
  }, []);

  // ── CDN + model ──────────────────────────────────────────────────────────

  const loadModel = useCallback(async (): Promise<boolean> => {
    if (landmarkerRef.current) return true;
    try {
      if (!document.querySelector(`script[src="${MP_CDN}"]`)) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = MP_CDN;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("MediaPipe CDN load failed"));
          document.head.appendChild(s);
        });
      } else {
        // Script tag exists but may not be fully initialised yet
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
      if (!w.PoseLandmarker || !w.FilesetResolver)
        throw new Error("PoseLandmarker / FilesetResolver missing after CDN load");

      const filesetResolver = await w.FilesetResolver.forVisionTasks(WASM_PATH);
      landmarkerRef.current = await w.PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      return true;
    } catch (err) {
      console.error("[useYoyoPoseDetector] Model load error:", err);
      return false;
    }
  }, []);

  // ── Per-frame logic ──────────────────────────────────────────────────────

  const processFrame = useCallback(() => {
    const video      = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    const t     = getTimeRef.current();
    const sched = scheduleRef.current;

    // Find current schedule entry (last entry whose startTime ≤ t)
    let entry: YoyoScheduleEntry | null = null;
    for (let i = sched.length - 1; i >= 0; i--) {
      if (sched[i].startTime <= t) { entry = sched[i]; break; }
    }
    if (!entry) { setPhase("IDLE"); return; }

    const { globalShuttle, startTime, endTime, recoveryEnd } = entry;

    // ── Determine current phase ────────────────────────────────────────────
    const inRun      = t >= startTime && t < endTime;
    const inRecovery = t >= endTime   && t < recoveryEnd;

    if      (inRun)      setPhase("RUN");
    else if (inRecovery) setPhase("RECOVERY");
    else                 setPhase("IDLE");

    // ── Reset state when a new shuttle begins ──────────────────────────────
    if (globalShuttle !== lastGlobalRef.current) {
      lastGlobalRef.current = globalShuttle;
      startXRef.current     = null;
      peakRef.current       = 0;
      reachedBRef.current   = false;
      returnedARef.current  = false;
    }

    // ── Miss-A: sprint window closed, player never reached B ──────────────
    if (
      !inRun && t >= endTime &&
      !reachedBRef.current &&
      !evaluatedRef.current.has(globalShuttle)
    ) {
      evaluatedRef.current.add(globalShuttle);
      recovEvalRef.current.add(globalShuttle); // skip recovery eval
      cbMissRef.current(globalShuttle);
      return;
    }

    // ── Miss-B: recovery window closed, reached B but never returned to A ──
    if (
      !inRecovery && t >= recoveryEnd &&
      reachedBRef.current && !returnedARef.current &&
      !recovEvalRef.current.has(globalShuttle)
    ) {
      recovEvalRef.current.add(globalShuttle);
      if (!evaluatedRef.current.has(globalShuttle)) {
        evaluatedRef.current.add(globalShuttle);
        cbMissRef.current(globalShuttle);
      }
      return;
    }

    // ── Only run pose detection during active phases ───────────────────────
    if (!inRun && !inRecovery) return;
    if (evaluatedRef.current.has(globalShuttle)) return;

    // Run MediaPipe
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch { return; }

    const landmarks = result?.landmarks?.[0];
    if (!landmarks || landmarks.length < 25) return;

    // Visibility gate — skip low-confidence frames
    const lVis = landmarks[L_HIP].visibility ?? 1;
    const rVis = landmarks[R_HIP].visibility ?? 1;
    if (lVis < MIN_VISIBILITY || rVis < MIN_VISIBILITY) return;

    const hipX = (landmarks[L_HIP].x + landmarks[R_HIP].x) / 2;

    // Capture shuttle start X on the first good frame of RUN phase only
    if (startXRef.current === null) {
      if (inRun) { startXRef.current = hipX; }
      return;
    }

    const disp = Math.abs(hipX - startXRef.current);

    // ── RUN phase: track reach-B ───────────────────────────────────────────
    if (inRun) {
      if (disp > peakRef.current) peakRef.current = disp;
      if (!reachedBRef.current && peakRef.current >= REACH_B_THRESHOLD) {
        reachedBRef.current = true;
      }
    }

    // ── RECOVERY phase: track return-to-A ─────────────────────────────────
    if (inRecovery && reachedBRef.current && !returnedARef.current) {
      if (disp <= peakRef.current * REVERSAL_RATIO) {
        returnedARef.current = true;
      }
    }

    // ── Completion: reached B (RUN) + returned to A (RECOVERY) ────────────
    if (
      reachedBRef.current && returnedARef.current &&
      !evaluatedRef.current.has(globalShuttle)
    ) {
      evaluatedRef.current.add(globalShuttle);
      recovEvalRef.current.add(globalShuttle);
      completedRepsRef.current += 1;
      cbCompletedRef.current(globalShuttle);
    }
  }, [setPhase]);

  // ── rAF loop ──────────────────────────────────────────────────────────────

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    processFrame();
    rafRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start camera + pose detection loop.
   * Returns true on success, false if camera permission denied or model failed.
   */
  const start = useCallback(async (videoEl: HTMLVideoElement): Promise<boolean> => {
    if (runningRef.current) return true;
    videoRef.current = videoEl;

    const ok = await loadModel();
    if (!ok) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (err) {
      console.error("[useYoyoPoseDetector] Camera error:", err);
      return false;
    }

    // Reset all tracking state
    lastGlobalRef.current    = -1;
    evaluatedRef.current     = new Set();
    recovEvalRef.current     = new Set();
    startXRef.current        = null;
    peakRef.current          = 0;
    reachedBRef.current      = false;
    returnedARef.current     = false;
    completedRepsRef.current = 0;
    currentPhaseRef.current  = "IDLE";

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

  useEffect(() => () => { stop(); }, [stop]);

  return {
    cameraVideoRef: videoRef,
    start,
    stop,
    /** Protocol in use — informational for the caller. */
    protocol,
    /**
     * Running count of completed reps (completedReps × 40 m = total distance).
     * Read `.current` directly — updates in the rAF loop without re-renders.
     */
    completedRepsRef,
  };
}
