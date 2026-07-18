// src/lib/engines/movenet-engine.ts
// MoveNet Lightning — fastest in-browser pose detection (17 COCO keypoints, ~10ms/frame)
// Client-side only. Dynamically imported, never runs on the server.

// ── COCO keypoint indices ─────────────────────────────────────────────────────
export const MN = {
  NOSE:       0,
  L_EYE:      1,  R_EYE:      2,
  L_EAR:      3,  R_EAR:      4,
  L_SHOULDER: 5,  R_SHOULDER: 6,
  L_ELBOW:    7,  R_ELBOW:    8,
  L_WRIST:    9,  R_WRIST:   10,
  L_HIP:     11,  R_HIP:     12,
  L_KNEE:    13,  R_KNEE:    14,
  L_ANKLE:   15,  R_ANKLE:   16,
} as const;

export interface MoveNetKeypoint {
  y: number; x: number; score: number; name: string;
}

// ── Singleton detector ────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _detector: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _loading: Promise<any> | null = null;

async function getDetector() {
  if (_detector) return _detector;
  if (_loading)  return _loading;

  _loading = (async () => {
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.ready();

    const pd = await import('@tensorflow-models/pose-detection');
    const detector = await pd.createDetector(
      pd.SupportedModels.MoveNet,
      { modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING },
    );
    _detector = detector;
    return detector;
  })();

  return _loading;
}

// ── Public detect function ────────────────────────────────────────────────────
export async function detectPoseMoveNet(
  canvas: HTMLCanvasElement,
): Promise<MoveNetKeypoint[] | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = (await getDetector()) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const poses    = await detector.estimatePoses(canvas) as any[];
    if (!poses.length) return null;

    const kps = poses[0].keypoints as MoveNetKeypoint[];
    const avgScore = kps.reduce((s, k) => s + (k.score ?? 0), 0) / kps.length;
    return avgScore > 0.2 ? kps : null;
  } catch {
    return null;
  }
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function mid(a: MoveNetKeypoint, b: MoveNetKeypoint) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}
function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ── Per-frame metric functions (mirrors mediapipe-pose.ts) ───────────────────
// All return 0–100. MoveNet coords: x=0 left, y=0 top, normalised 0–1.

export function mnTrunkLean(lm: MoveNetKeypoint[]): number {
  const mS = mid(lm[MN.L_SHOULDER], lm[MN.R_SHOULDER]);
  const mH = mid(lm[MN.L_HIP],      lm[MN.R_HIP]);
  const dx  = mS.x - mH.x;
  const dy  = mH.y - mS.y;
  const angle = Math.abs(Math.atan2(Math.abs(dx), Math.max(dy, 0.001)) * (180 / Math.PI));
  if (angle < 5)  return clamp(40 + angle * 2);
  if (angle < 20) return clamp(50 + (angle - 5) * 2.3);
  if (angle < 35) return clamp(84 - (angle - 20) * 1.6);
  return clamp(60 - (angle - 35) * 2);
}

export function mnKneeDrive(lm: MoveNetKeypoint[]): number {
  const hipY     = mid(lm[MN.L_HIP], lm[MN.R_HIP]).y;
  const minKneeY = Math.min(lm[MN.L_KNEE].y, lm[MN.R_KNEE].y);
  return clamp(50 + (hipY - minKneeY) * 300);
}

export function mnArmSwing(lm: MoveNetKeypoint[]): number {
  const lUp = lm[MN.L_SHOULDER].y - Math.min(lm[MN.L_WRIST].y, lm[MN.L_ELBOW].y);
  const rUp = lm[MN.R_SHOULDER].y - Math.min(lm[MN.R_WRIST].y, lm[MN.R_ELBOW].y);
  return clamp(50 + Math.max(lUp, rUp) * 400);
}

export function mnBilateralAsymmetry(lm: MoveNetKeypoint[]): number {
  const lLeg = dist(lm[MN.L_HIP], lm[MN.L_ANKLE]);
  const rLeg = dist(lm[MN.R_HIP], lm[MN.R_ANKLE]);
  const lArm = dist(lm[MN.L_SHOULDER], lm[MN.L_WRIST]);
  const rArm = dist(lm[MN.R_SHOULDER], lm[MN.R_WRIST]);
  const legA = lLeg > 0 ? Math.abs(lLeg - rLeg) / Math.max(lLeg, rLeg) : 0;
  const armA = lArm > 0 ? Math.abs(lArm - rArm) / Math.max(lArm, rArm) : 0;
  return clamp(((legA + armA) / 2) * 200);
}

// ── Jump flight time derivation ───────────────────────────────────────────────
// Pass all per-frame landmark arrays + estimated fps.
// Returns estimated airborne duration in seconds (0 if no jump detected).
export function mnJumpFlightTime(
  frameLandmarks: (MoveNetKeypoint[] | null)[],
  fps: number,
): number {
  if (frameLandmarks.length < 3 || fps <= 0) return 0;

  const hipYs = frameLandmarks
    .map((lm) => (lm ? mid(lm[MN.L_HIP], lm[MN.R_HIP]).y : -1))
    .filter((y) => y >= 0);

  if (hipYs.length < 4) return 0;

  // Baseline = average of first 3 valid frames (standing)
  const baseline  = hipYs.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
  // Takeoff when hip rises more than 5% of normalised height above baseline
  const threshold = baseline - 0.05;

  let airborneFrames = 0;
  let inFlight       = false;

  for (const y of hipYs) {
    if (y < threshold) {
      inFlight = true;
      airborneFrames++;
    } else if (inFlight) {
      break; // landed
    }
  }

  return airborneFrames > 0 ? airborneFrames / fps : 0;
}

// ── Balance correction counter ────────────────────────────────────────────────
// Records how many frames the raised ankle drifts laterally (= a correction).
export function mnBalanceCorrections(
  frameLandmarks: (MoveNetKeypoint[] | null)[],
  stanceLeg: 'left' | 'right',
): number {
  // The raised ankle is the OPPOSITE of the stance leg
  const ankleIdx = stanceLeg === 'left' ? MN.R_ANKLE : MN.L_ANKLE;
  const positions = frameLandmarks
    .map((lm) => (lm ? lm[ankleIdx] : null))
    .filter((k): k is MoveNetKeypoint => k !== null && (k.score ?? 0) > 0.3);

  if (positions.length < 2) return 0;

  let corrections = 0;
  let prevX       = positions[0].x;

  for (let i = 1; i < positions.length; i++) {
    if (Math.abs(positions[i].x - prevX) > 0.04) corrections++;
    prevX = positions[i].x;
  }
  return corrections;
}
