// src/lib/mediapipe-pose.ts
// On-device pose analysis using MediaPipe Tasks Vision.
// Client-side only — dynamically imported, never runs on the server.

// ── Landmark indices ───────────────────────────────────────────────────────────

const LM = {
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW:    13, R_ELBOW:    14,
  L_WRIST:    15, R_WRIST:    16,
  L_HIP:      23, R_HIP:      24,
  L_KNEE:     25, R_KNEE:     26,
  L_ANKLE:    27, R_ANKLE:    28,
  L_HEEL:     29, R_HEEL:     30,
} as const;

type LM = { x: number; y: number; z: number; visibility?: number };

// ── Singleton landmarker ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _landmarker: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _loading: Promise<any> | null = null;

async function getLandmarker() {
  if (_landmarker) return _landmarker;
  if (_loading)   return _loading;

  _loading = (async () => {
    const { PoseLandmarker, FilesetResolver } = await import(
      /* webpackIgnore: true */
      /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/vision_bundle.mjs"
    );

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    );

    const lm = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "IMAGE",
      numPoses:    1,
    });
    _landmarker = lm;
    return lm;
  })();

  return _loading;
}

// ── Frame extraction ───────────────────────────────────────────────────────────

async function extractFrames(
  file:        File,
  maxFrames = 30,
  onProgress?: (pct: number) => void,
): Promise<HTMLCanvasElement[]> {
  return new Promise((resolve, reject) => {
    const url    = URL.createObjectURL(file);
    const video  = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d");
    if (!ctx) { URL.revokeObjectURL(url); reject(new Error("No canvas 2D")); return; }

    video.src         = url;
    video.muted       = true;
    video.playsInline = true;
    video.preload     = "auto";

    video.onloadedmetadata = async () => {
      const dur = video.duration;
      if (!isFinite(dur) || dur <= 0) {
        URL.revokeObjectURL(url);
        reject(new Error("Video duration unknown — cannot seek."));
        return;
      }

      canvas.width  = 640;
      canvas.height = Math.round(640 * (video.videoHeight / Math.max(video.videoWidth, 1)));

      const frames: HTMLCanvasElement[] = [];
      const step = dur / maxFrames;

      for (let i = 0; i < maxFrames; i++) {
        video.currentTime = i * step + step * 0.1; // slight offset avoids black frames
        await new Promise<void>((res) => { video.onseeked = () => res(); });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const f = document.createElement("canvas");
        f.width  = canvas.width;
        f.height = canvas.height;
        f.getContext("2d")!.drawImage(canvas, 0, 0);
        frames.push(f);
        onProgress?.(Math.round(((i + 1) / maxFrames) * 100));
      }

      URL.revokeObjectURL(url);
      resolve(frames);
    };

    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not decode video.")); };
  });
}

// ── Geometry helpers ───────────────────────────────────────────────────────────

function mid(a: LM, b: LM) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
function dist(a: LM, b: LM) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }
function clamp(v: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, Math.round(v))); }

// ── Individual metric functions ────────────────────────────────────────────────
// All return 0-100 (raw, before rounding).
// MediaPipe coords: x=0 left → x=1 right, y=0 top → y=1 bottom.

function trunk_lean(lm: LM[]): number {
  const mS = mid(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]);
  const mH = mid(lm[LM.L_HIP],      lm[LM.R_HIP]);
  const dx = mS.x - mH.x;
  const dy = mH.y - mS.y; // positive when shoulder is above hip (normal)
  const angle = Math.abs(Math.atan2(Math.abs(dx), Math.max(dy, 0.001)) * (180 / Math.PI));
  // 0-5°: too upright → 40, 10-20° good sprint lean → 75-85, 30°+ over-lean → drops
  if (angle < 5)  return clamp(40 + angle * 2);
  if (angle < 20) return clamp(50 + (angle - 5) * 2.3);
  if (angle < 35) return clamp(84 - (angle - 20) * 1.6);
  return clamp(60 - (angle - 35) * 2);
}

function knee_drive(lm: LM[]): number {
  const hipY    = mid(lm[LM.L_HIP], lm[LM.R_HIP]).y;
  const minKneeY = Math.min(lm[LM.L_KNEE].y, lm[LM.R_KNEE].y);
  // Positive = knee above hip level (good). Larger = better drive.
  const rel = hipY - minKneeY;
  return clamp(50 + rel * 300);
}

function heel_recovery(lm: LM[]): number {
  const dL = dist(lm[LM.L_HEEL], lm[LM.L_HIP]);
  const dR = dist(lm[LM.R_HEEL], lm[LM.R_HIP]);
  // Closer heel to hip = better recovery. Typical: 0.1 (good) → 0.4 (poor).
  return clamp(100 - Math.min(dL, dR) * 250);
}

function knee_valgus(lm: LM[]): number {
  // Knee should stay inline between hip and ankle. Inward deviation = valgus.
  const devL = Math.abs(lm[LM.L_KNEE].x - (lm[LM.L_HIP].x + lm[LM.L_ANKLE].x) / 2);
  const devR = Math.abs(lm[LM.R_KNEE].x - (lm[LM.R_HIP].x + lm[LM.R_ANKLE].x) / 2);
  return clamp(Math.max(devL, devR) * 500);
}

function bilateral_asymmetry(lm: LM[]): number {
  const lLeg = dist(lm[LM.L_HIP], lm[LM.L_ANKLE]);
  const rLeg = dist(lm[LM.R_HIP], lm[LM.R_ANKLE]);
  const lArm = dist(lm[LM.L_SHOULDER], lm[LM.L_WRIST]);
  const rArm = dist(lm[LM.R_SHOULDER], lm[LM.R_WRIST]);
  const legAsym = lLeg > 0 ? Math.abs(lLeg - rLeg) / Math.max(lLeg, rLeg) : 0;
  const armAsym = lArm > 0 ? Math.abs(lArm - rArm) / Math.max(lArm, rArm) : 0;
  return clamp(((legAsym + armAsym) / 2) * 200);
}

function landing_stiffness(lm: LM[]): number {
  function kneeAngle(hip: LM, knee: LM, ankle: LM) {
    const ux = hip.x - knee.x, uy = hip.y - knee.y;
    const vx = ankle.x - knee.x, vy = ankle.y - knee.y;
    const dot = ux * vx + uy * vy;
    return Math.atan2(Math.abs(ux * vy - uy * vx), dot) * (180 / Math.PI);
  }
  const avg = (kneeAngle(lm[LM.L_HIP], lm[LM.L_KNEE], lm[LM.L_ANKLE])
             + kneeAngle(lm[LM.R_HIP], lm[LM.R_KNEE], lm[LM.R_ANKLE])) / 2;
  // 180° = fully straight (stiff/bad) → low. ~90° = bent (good absorption) → high.
  if (avg > 160) return clamp(20 + (180 - avg) * 1.5);
  if (avg > 120) return clamp(50 + (160 - avg));
  if (avg > 90)  return clamp(90 - (120 - avg) * 0.67);
  return 85;
}

function arm_swing(lm: LM[]): number {
  // High wrist/elbow above shoulder = good arm drive upward.
  const lUp = lm[LM.L_SHOULDER].y - Math.min(lm[LM.L_WRIST].y, lm[LM.L_ELBOW].y);
  const rUp = lm[LM.R_SHOULDER].y - Math.min(lm[LM.R_WRIST].y, lm[LM.R_ELBOW].y);
  return clamp(50 + Math.max(lUp, rUp) * 400);
}

// ── Metric registry ────────────────────────────────────────────────────────────

const METRIC_FNS: Record<string, (lm: LM[]) => number> = {
  trunk_lean,
  knee_drive,
  heel_recovery,
  knee_valgus,
  bilateral_asymmetry,
  landing_stiffness,
  arm_swing,
};

const DRILL_METRICS: Record<string, string[]> = {
  movement:   ["trunk_lean", "knee_drive", "heel_recovery"],
  technique:  ["trunk_lean", "heel_recovery", "bilateral_asymmetry"],
  resilience: ["knee_valgus", "bilateral_asymmetry", "landing_stiffness"],
  posture:    ["trunk_lean", "bilateral_asymmetry", "arm_swing"],
};

const LOWER_IS_BETTER = new Set(["knee_valgus", "bilateral_asymmetry"]);

// ── Public API ─────────────────────────────────────────────────────────────────

export interface PoseAnalysisResult {
  metrics:           Record<string, number>;
  performance_index: number;
  resilience_index:  number;
  flags:             string[];
  confidence:        number; // 0–1: fraction of frames with a detected skeleton
}

/**
 * Run on-device pose analysis on a video file.
 * Returns null if the video quality is too poor (< 30% frames detected).
 */
export async function analyseWithPose(
  file:       File,
  drillId:    string,
  onProgress: (pct: number, label: string) => void,
): Promise<PoseAnalysisResult | null> {
  try {
    // A — load the model (cached after first call)
    onProgress(2, "Loading pose model...");
    const landmarker = await getLandmarker();

    // B — extract frames from the video
    onProgress(5, "Extracting video frames...");
    const frames = await extractFrames(file, 30, (pct) => {
      onProgress(5 + Math.round(pct * 0.4), "Extracting frames...");
    });

    // C — run pose detection on every frame
    const metricKeys = DRILL_METRICS[drillId] ?? DRILL_METRICS.movement;
    const accum: Record<string, number[]> = {};
    for (const k of metricKeys) accum[k] = [];

    let detected = 0;
    const KEY_LMS = [LM.L_HIP, LM.R_HIP, LM.L_KNEE, LM.R_KNEE, LM.L_SHOULDER, LM.R_SHOULDER];

    for (let i = 0; i < frames.length; i++) {
      onProgress(45 + Math.round((i / frames.length) * 45), "Analysing pose...");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const res = landmarker.detect(frames[i]) as { landmarks: LM[][] };
      if (!res.landmarks.length) continue;

      const lm = res.landmarks[0];
      const avgVis =
        KEY_LMS.reduce((s, idx) => s + (lm[idx]?.visibility ?? 0), 0) / KEY_LMS.length;
      if (avgVis < 0.35) continue;

      detected++;
      for (const k of metricKeys) {
        const fn = METRIC_FNS[k];
        if (fn) accum[k].push(fn(lm));
      }
    }

    const confidence = frames.length > 0 ? detected / frames.length : 0;
    if (confidence < 0.3) return null; // too blurry / occlusion → fall back to Gemini

    // D — average metric values
    onProgress(91, "Computing scores...");
    const metrics: Record<string, number> = {};
    for (const k of metricKeys) {
      const vals = accum[k];
      metrics[k] = vals.length > 0
        ? clamp(vals.reduce((s, v) => s + v, 0) / vals.length)
        : 50;
    }

    // E — aggregate indices
    const goodKeys = metricKeys.filter((k) => !LOWER_IS_BETTER.has(k));
    const badKeys  = metricKeys.filter((k) => LOWER_IS_BETTER.has(k));

    const perfScore =
      goodKeys.length > 0
        ? goodKeys.reduce((s, k) => s + metrics[k], 0) / goodKeys.length
        : 60;
    const resScore =
      badKeys.length > 0
        ? 100 - badKeys.reduce((s, k) => s + metrics[k], 0) / badKeys.length
        : 60;

    const performance_index = clamp(perfScore);
    const resilience_index  =
      drillId === "resilience"
        ? clamp(resScore)
        : clamp((perfScore * 0.6 + resScore * 0.4));

    // F — flags
    const flags: string[] = [];
    if ((metrics.knee_valgus        ?? 0) > 55) flags.push("knee_valgus");
    if ((metrics.bilateral_asymmetry ?? 0) > 55) flags.push("bilateral_asymmetry");
    if ((metrics.heel_recovery       ?? 0) < 40) flags.push("heel_recovery_poor");
    if ((metrics.arm_swing           ?? 0) < 40) flags.push("arm_swing_weak");
    if ((metrics.landing_stiffness   ?? 0) < 40) flags.push("landing_too_stiff");
    if ((metrics.trunk_lean          ?? 0) < 40) flags.push("trunk_too_upright");

    onProgress(100, "Done");
    return {
      metrics,
      performance_index,
      resilience_index,
      flags: flags.slice(0, 3),
      confidence,
    };
  } catch {
    return null;
  }
}
