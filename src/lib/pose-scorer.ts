/**
 * Pose Movement Quality Scorer
 *
 * Takes MediaPipe PoseLandmarker NormalizedLandmarks and returns a 0–100
 * movement quality score. The same scoring dimensions used in Bhora AI's
 * TalentIdService._calculateMovementQuality() — ported to TypeScript.
 *
 * Dimensions (equal weight):
 *  1. Symmetry      — left/right joint alignment
 *  2. Balance       — hips centred over ankles
 *  3. Posture       — vertical spine alignment (nose → hip)
 *  4. Joint angles  — key joint angles within athletic range
 */

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// MediaPipe PoseLandmarker keypoint indices
const IDX = {
  NOSE:           0,
  L_SHOULDER:    11,
  R_SHOULDER:    12,
  L_ELBOW:       13,
  R_ELBOW:       14,
  L_WRIST:       15,
  R_WRIST:       16,
  L_HIP:         23,
  R_HIP:         24,
  L_KNEE:        25,
  R_KNEE:        26,
  L_ANKLE:       27,
  R_ANKLE:       28,
} as const;

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function visible(lm: NormalizedLandmark): boolean {
  return (lm.visibility ?? 1) > 0.4;
}

/** Score 1 — Symmetry: compare left vs right joint heights (y coords) */
function symmetryScore(lm: NormalizedLandmark[]): number {
  const pairs = [
    [IDX.L_SHOULDER, IDX.R_SHOULDER],
    [IDX.L_HIP,      IDX.R_HIP],
    [IDX.L_KNEE,     IDX.R_KNEE],
    [IDX.L_ANKLE,    IDX.R_ANKLE],
  ];
  const diffs: number[] = [];
  for (const [l, r] of pairs) {
    if (visible(lm[l]) && visible(lm[r])) {
      diffs.push(Math.abs(lm[l].y - lm[r].y));
    }
  }
  if (diffs.length === 0) return 50;
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  // 0 diff = 100, 0.15 diff = 0
  return Math.max(0, Math.min(100, 100 - (avgDiff / 0.15) * 100));
}

/** Score 2 — Balance: mid-hip x should be between mid-ankle x */
function balanceScore(lm: NormalizedLandmark[]): number {
  const lHip = lm[IDX.L_HIP], rHip = lm[IDX.R_HIP];
  const lAnk = lm[IDX.L_ANKLE], rAnk = lm[IDX.R_ANKLE];
  if (!visible(lHip) || !visible(rHip) || !visible(lAnk) || !visible(rAnk)) return 50;

  const midHipX   = (lHip.x + rHip.x) / 2;
  const midAnkleX = (lAnk.x + rAnk.x) / 2;
  const offset    = Math.abs(midHipX - midAnkleX);
  // 0 offset = perfect, 0.2 = very off
  return Math.max(0, Math.min(100, 100 - (offset / 0.20) * 100));
}

/** Score 3 — Posture: nose, shoulder midpoint, hip midpoint should be vertically aligned */
function postureScore(lm: NormalizedLandmark[]): number {
  const nose  = lm[IDX.NOSE];
  const lShld = lm[IDX.L_SHOULDER], rShld = lm[IDX.R_SHOULDER];
  const lHip  = lm[IDX.L_HIP],      rHip  = lm[IDX.R_HIP];

  if (!visible(nose) || !visible(lShld) || !visible(rShld) || !visible(lHip) || !visible(rHip)) return 50;

  const midShoulderX = (lShld.x + rShld.x) / 2;
  const midHipX      = (lHip.x  + rHip.x)  / 2;

  // All three x-coords should be close to each other
  const spineDeviation = Math.abs(nose.x - midShoulderX) + Math.abs(midShoulderX - midHipX);
  return Math.max(0, Math.min(100, 100 - (spineDeviation / 0.20) * 100));
}

/** Score 4 — Joint angles: knee angle should be between 150–180° when standing */
function jointAngleScore(lm: NormalizedLandmark[]): number {
  const scores: number[] = [];

  const calcKneeAngle = (hip: NormalizedLandmark, knee: NormalizedLandmark, ankle: NormalizedLandmark): number => {
    if (!visible(hip) || !visible(knee) || !visible(ankle)) return -1;
    const v1 = { x: hip.x - knee.x, y: hip.y - knee.y };
    const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag = Math.sqrt((v1.x ** 2 + v1.y ** 2)) * Math.sqrt((v2.x ** 2 + v2.y ** 2));
    if (mag === 0) return -1;
    return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
  };

  const lKneeAngle = calcKneeAngle(lm[IDX.L_HIP], lm[IDX.L_KNEE], lm[IDX.L_ANKLE]);
  const rKneeAngle = calcKneeAngle(lm[IDX.R_HIP], lm[IDX.R_KNEE], lm[IDX.R_ANKLE]);

  for (const angle of [lKneeAngle, rKneeAngle]) {
    if (angle < 0) continue;
    // Athletic range: 140–180°. Deduct for hyperextension (<140) or extreme flex
    const deviation = Math.max(0, 140 - angle); // penalise if < 140°
    scores.push(Math.max(0, 100 - deviation * 3));
  }

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 50;
}

/** Composite movement quality score: average of all 4 dimensions */
export function scorePose(landmarks: NormalizedLandmark[]): {
  overall: number;
  symmetry: number;
  balance: number;
  posture: number;
  jointAngles: number;
} {
  const symmetry   = symmetryScore(landmarks);
  const balance    = balanceScore(landmarks);
  const posture    = postureScore(landmarks);
  const jointAngles = jointAngleScore(landmarks);

  const overall = Math.round(
    (symmetry + balance + posture + jointAngles) / 4
  );

  return {
    overall,
    symmetry:    Math.round(symmetry),
    balance:     Math.round(balance),
    posture:     Math.round(posture),
    jointAngles: Math.round(jointAngles),
  };
}

/** Average multiple frame scores into one stable reading */
export function averageScores(scores: ReturnType<typeof scorePose>[]): ReturnType<typeof scorePose> {
  if (scores.length === 0) return { overall: 0, symmetry: 0, balance: 0, posture: 0, jointAngles: 0 };
  const avg = (key: keyof ReturnType<typeof scorePose>) =>
    Math.round(scores.reduce((s, x) => s + x[key], 0) / scores.length);
  return {
    overall:     avg("overall"),
    symmetry:    avg("symmetry"),
    balance:     avg("balance"),
    posture:     avg("posture"),
    jointAngles: avg("jointAngles"),
  };
}
