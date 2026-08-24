"use client";

/**
 * useYoyoPoseDetector
 *
 * Live-camera MediaPipe hook for Yo-Yo IR1 automated miss detection.
 *
 * Setup:
 *   - Camera must be face-on, wide, with zones A (0 m), B (20 m), and C
 *     (recovery) all visible.
 *   - MediaPipe pose landmarker (lite) loaded from CDN at runtime.
 *
 * Detection strategy:
 *   - Hip X position = average of L_HIP (idx 23) and R_HIP (idx 24)
 *     normalised landmarks (0–1).
 *   - "Reached B" = peak displacement from shuttle-start X ≥ 0.22 (22 %
 *     of frame width).
 *   - "Reversed" = displacement drops to ≤ 65 % of peak after reaching B.
 *   - Completion fires once when BOTH conditions are met within the sprint
 *     window defined by the audio schedule.
 *   - Miss fires on the first frame where t ≥ entry.endTime and the shuttle
 *     was not already marked completed.
 *   - Each shuttle is evaluated exactly once (evaluated Set guard).
 *
 * Audio sync:
 *   - getAudioTime() callback is called every rAF frame to get current
 *     audio position — used as the source of truth for which shuttle is live.
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
 * a confirmed reversal (player back at A).
 */
const REVERSAL_RATIO = 0.65;

// ── Public types ──────────────────────────────────────────────────────────────

export interface YoyoScheduleEntry {
  globalShuttle: number;
  startTime: number;   // seconds — sprint window opens
  endTime: number;     // seconds — sprint window closes (miss if not completed by here)
  recoveryEnd: number; // seconds — next shuttle startTime
}

export interface UseYoyoPoseDetectorOptions {
  /** Full shuttle schedule (same YOYO_SCHEDULE used by the modal). */
  schedule: YoyoScheduleEntry[];
  /** Returns the audio element's currentTime in seconds. */
  getAudioTime: () => number;
  /** Called once when the player completes a shuttle (reached B and reversed). */
  onShuttleCompleted: (globalShuttle: number) => void;
  /** Called once when the sprint window closes without a completion. */
  onMissDetected: (globalShuttle: number) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useYoyoPoseDetector({
  schedule,
  getAudioTime,
  onShuttleCompleted,
  onMissDetected,
}: UseYoyoPoseDetectorOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landmarkerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  // Per-shuttle tracking (refs only — never useState inside rAF callbacks)
  const lastGlobalRef = useRef<number>(0);      // last globalShuttle seen
  const evaluatedRef = useRef<Set<number>>(new Set());
  const startXRef = useRef<number | null>(null); // hip X at shuttle start
  const peakRef = useRef<number>(0);             // max displacement seen this shuttle
  const reachedBRef = useRef<boolean>(false);
  const reversedRef = useRef<boolean>(false);

  // Callback refs — keeps the rAF closure from holding stale function refs
  const cbCompletedRef = useRef(onShuttleCompleted);
  const cbMissRef = useRef(onMissDetected);
  const getTimeRef = useRef(getAudioTime);
  const scheduleRef = useRef(schedule);

  useEffect(() => { cbCompletedRef.current = onShuttleCompleted; }, [onShuttleCompleted]);
  useEffect(() => { cbMissRef.current = onMissDetected; }, [onMissDetected]);
  useEffect(() => { getTimeRef.current = getAudioTime; }, [getAudioTime]);
  useEffect(() => { scheduleRef.current = schedule; }, [schedule]);

  // ── CDN + model ──────────────────────────────────────────────────────────

  const loadModel = useCallback(async (): Promise<boolean> => {
    if (landmarkerRef.current) return true;
    try {
      // Inject CDN script if not already present
      if (!document.querySelector(`script[src="${MP_CDN}"]`)) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = MP_CDN;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("MediaPipe CDN load failed"));
          document.head.appendChild(s);
        });
      } else {
        // Script tag exists but may not be fully loaded yet — wait for PoseLandmarker
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
      const PoseLandmarker = w.PoseLandmarker;
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
      console.error("[useYoyoPoseDetector] Model load error:", err);
      return false;
    }
  }, []);

  // ── Per-frame logic ──────────────────────────────────────────────────────

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) return;

    const t = getTimeRef.current();
    const sched = scheduleRef.current;

    // Find current shuttle entry (last entry whose startTime ≤ t)
    let entry: YoyoScheduleEntry | null = null;
    for (let i = sched.length - 1; i >= 0; i--) {
      if (sched[i].startTime <= t) { entry = sched[i]; break; }
    }
    if (!entry) return;

    const { globalShuttle, startTime, endTime } = entry;
    const inSprint = t >= startTime && t < endTime;

    // Reset per-shuttle state when shuttle index advances
    if (globalShuttle !== lastGlobalRef.current) {
      lastGlobalRef.current = globalShuttle;
      startXRef.current = null;
      peakRef.current = 0;
      reachedBRef.current = false;
      reversedRef.current = false;
    }

    // Miss detection: sprint window closed without a completion
    if (!inSprint && t >= endTime && !evaluatedRef.current.has(globalShuttle)) {
      evaluatedRef.current.add(globalShuttle);
      cbMissRef.current(globalShuttle);
      return;
    }

    // Only run expensive pose detection during the sprint window
    if (!inSprint) return;
    if (evaluatedRef.current.has(globalShuttle)) return;

    // Run MediaPipe pose detection
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      return;
    }

    const landmarks = result?.landmarks?.[0];
    if (!landmarks || landmarks.length < 25) return;

    // Hip X = average of left and right hip (normalised 0–1)
    const hipX = (landmarks[L_HIP].x + landmarks[R_HIP].x) / 2;

    // Capture shuttle start X on the first good frame
    if (startXRef.current === null) {
      startXRef.current = hipX;
      return;
    }

    const disp = Math.abs(hipX - startXRef.current);

    // Track peak displacement
    if (disp > peakRef.current) peakRef.current = disp;

    // Check "reached B"
    if (!reachedBRef.current && peakRef.current >= REACH_B_THRESHOLD) {
      reachedBRef.current = true;
    }

    // Check reversal (displacement dropped to ≤ REVERSAL_RATIO × peak after B)
    if (
      reachedBRef.current &&
      !reversedRef.current &&
      peakRef.current > REACH_B_THRESHOLD &&
      disp <= peakRef.current * REVERSAL_RATIO
    ) {
      reversedRef.current = true;
    }

    // Completion: reached B AND reversed
    if (reachedBRef.current && reversedRef.current && !evaluatedRef.current.has(globalShuttle)) {
      evaluatedRef.current.add(globalShuttle);
      cbCompletedRef.current(globalShuttle);
    }
  }, []);

  // ── rAF loop ─────────────────────────────────────────────────────────────

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    processFrame();
    rafRef.current = requestAnimationFrame(loop);
  }, [processFrame]);

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Start camera + pose detection loop.
   * Pass the HTMLVideoElement that will display the camera feed.
   * Returns true on success, false if camera permission denied or model failed.
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
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      videoEl.srcObject = stream;
      await videoEl.play();
    } catch (err) {
      console.error("[useYoyoPoseDetector] Camera error:", err);
      return false;
    }

    // Reset all tracking state
    lastGlobalRef.current = 0;
    evaluatedRef.current = new Set();
    startXRef.current = null;
    peakRef.current = 0;
    reachedBRef.current = false;
    reversedRef.current = false;

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
