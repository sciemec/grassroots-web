// hooks/usePoseDetector.ts
// ─────────────────────────────────────────────────────────────────────────────
// MediaPipe PoseLandmarker hook for automated GRS test measurement.
//
// Supported modes:
//   'jump'    — detects takeoff and landing to calculate flight time + height
//   'posture' — streams landmark data for real-time posture scoring
//
// Jump height formula (from flight time):
//   h = (g × t²) / 8    where g = 9.81 m/s², t = total flight time in seconds
//   This is the standard physics formula for a symmetric jump trajectory.
//
// MediaPipe Tasks Vision is loaded from CDN at runtime — no npm package needed.
// If the camera is denied or MediaPipe fails to load, error is set and the
// parent test falls back to manual numeric entry.
//
// Uses: src/lib/pose-scorer.ts for NormalizedLandmark type compatibility.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import type { NormalizedLandmark } from '@/lib/pose-scorer';

// MediaPipe landmark indices used for jump detection
const IDX_L_ANKLE = 27;
const IDX_R_ANKLE = 28;

// Physics constant
const G_MS2 = 9.81;

export type PoseDetectorMode = 'jump' | 'posture';

export interface JumpResult {
  /** Total flight time in seconds (takeoff → landing) */
  flightTimeSec: number;
  /** Jump height in centimetres, calculated from flight time */
  heightCm: number;
}

export interface PoseDetectorState {
  /** MediaPipe model loaded and camera open */
  ready: boolean;
  /** Detection loop is active */
  running: boolean;
  /** Human-readable error, set when camera or model unavailable */
  error: string | null;
  /** True during the airborne phase (for jump mode) */
  inFlight: boolean;
  /** Completed jump result — null until a full jump is detected */
  jumpResult: JumpResult | null;
  /** Latest raw landmarks (for posture mode) */
  landmarks: NormalizedLandmark[] | null;
}

// Injected once per page load — avoids re-downloading the CDN script
let mediapipeLoadPromise: Promise<boolean> | null = null;

function injectMediaPipe(): Promise<boolean> {
  if (mediapipeLoadPromise) return mediapipeLoadPromise;

  mediapipeLoadPromise = new Promise<boolean>((resolve) => {
    // Already loaded by a previous call
    if (typeof window !== 'undefined' && (window as any).__mpTasksVision) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/vision_bundle.js';
    script.crossOrigin = 'anonymous';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false); // graceful — fall back to manual entry
    document.head.appendChild(script);
  });

  return mediapipeLoadPromise;
}

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const WASM_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';

export function usePoseDetector(mode: PoseDetectorMode = 'jump') {
  const [state, setState] = useState<PoseDetectorState>({
    ready: false, running: false, error: null,
    inFlight: false, jumpResult: null, landmarks: null,
  });

  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const landmarkerRef = useRef<any>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number | null>(null);

  // Jump-specific tracking refs (not state — updated every frame, no re-render needed)
  const baselineAnkleY = useRef<number | null>(null);
  const calibFrames    = useRef(0);
  const inFlightRef    = useRef(false);
  const flightStart    = useRef<number | null>(null); // performance.now() at takeoff

  // ── Load MediaPipe model ──────────────────────────────────────────────────
  const loadModel = useCallback(async (): Promise<boolean> => {
    if (landmarkerRef.current) return true;

    const loaded = await injectMediaPipe();
    if (!loaded) return false;

    try {
      const { PoseLandmarker, FilesetResolver } = (window as any).__mpTasksVision
        ?? (window as any); // CDN bundle attaches to window

      // FilesetResolver might be top-level or nested — handle both CDN patterns
      const vision = await (FilesetResolver ?? (window as any).FilesetResolver)
        .forVisionTasks(WASM_URL);

      landmarkerRef.current = await (PoseLandmarker ?? (window as any).PoseLandmarker)
        .createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate:       'GPU',
          },
          runningMode:                    'VIDEO',
          numPoses:                       1,
          minPoseDetectionConfidence:     0.5,
          minPosePresenceConfidence:      0.5,
          minTrackingConfidence:          0.5,
        });

      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Per-frame detection ───────────────────────────────────────────────────
  const processFrame = useCallback(() => {
    const video    = videoRef.current;
    const detector = landmarkerRef.current;

    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const result = detector.detectForVideo(video, performance.now());
    const lm: NormalizedLandmark[] | undefined = result?.landmarks?.[0];

    if (!lm || lm.length < 33) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }

    setState(s => ({ ...s, landmarks: lm }));

    if (mode === 'jump') {
      const ankleY = (lm[IDX_L_ANKLE].y + lm[IDX_R_ANKLE].y) / 2;

      // ── Calibration: average first 45 frames as standing baseline ─────
      if (calibFrames.current < 45) {
        calibFrames.current++;
        baselineAnkleY.current = baselineAnkleY.current === null
          ? ankleY
          : (baselineAnkleY.current * (calibFrames.current - 1) + ankleY) / calibFrames.current;
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const baseline  = baselineAnkleY.current!;
      // In normalised coords: smaller Y = higher on screen.
      // Ankles rise (Y decreases) when the player is airborne.
      const LIFT = 0.035; // ~3.5% of frame height above baseline = airborne
      const airborne = ankleY < baseline - LIFT;

      if (airborne && !inFlightRef.current) {
        // Takeoff detected
        inFlightRef.current = true;
        flightStart.current = performance.now();
        setState(s => ({ ...s, inFlight: true }));
      }

      if (!airborne && inFlightRef.current) {
        // Landing detected
        const flightMs      = performance.now() - (flightStart.current ?? performance.now());
        const flightTimeSec = flightMs / 1000;

        // Only accept plausible jumps: 0.2s – 1.2s flight time
        if (flightTimeSec >= 0.2 && flightTimeSec <= 1.2) {
          const heightCm = Math.round((G_MS2 * flightTimeSec ** 2 / 8) * 100);

          setState(s => ({
            ...s,
            inFlight:   false,
            jumpResult: {
              flightTimeSec: parseFloat(flightTimeSec.toFixed(3)),
              heightCm:      Math.max(5, Math.min(120, heightCm)),
            },
          }));
        }

        inFlightRef.current = false;
        flightStart.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, [mode]);

  // ── Public API ────────────────────────────────────────────────────────────

  const start = useCallback(async (videoEl: HTMLVideoElement) => {
    videoRef.current = videoEl;
    setState(s => ({ ...s, error: null, jumpResult: null, inFlight: false }));

    const modelReady = await loadModel();
    if (!modelReady) {
      setState(s => ({
        ...s,
        error: 'Camera analysis unavailable — enter your measurement manually',
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current     = stream;
      videoEl.srcObject     = stream;
      videoEl.muted         = true;
      videoEl.playsInline   = true;
      await videoEl.play();

      // Reset jump tracking
      baselineAnkleY.current = null;
      calibFrames.current    = 0;
      inFlightRef.current    = false;
      flightStart.current    = null;

      setState(s => ({ ...s, ready: true, running: true }));
      rafRef.current = requestAnimationFrame(processFrame);
    } catch {
      setState(s => ({
        ...s,
        error: 'Camera access denied — tap the camera icon in your browser to allow it, or enter manually',
      }));
    }
  }, [loadModel, processFrame]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    videoRef.current = null;
    setState(s => ({ ...s, running: false }));
  }, []);

  const resetJump = useCallback(() => {
    baselineAnkleY.current = null;
    calibFrames.current    = 0;
    inFlightRef.current    = false;
    flightStart.current    = null;
    setState(s => ({ ...s, jumpResult: null, inFlight: false, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { state, start, stop, resetJump, videoRef };
}
