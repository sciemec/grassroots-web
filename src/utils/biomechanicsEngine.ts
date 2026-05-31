// src/utils/biomechanicsEngine.ts

/**
 * 1. Deep Trigonometric Angle Calculator
 * Ported directly from your biomechanics.dart file logic
 */
export function calculateJointAngle(first: any, middle: any, last: any): number {
  if (!first || !middle || !last) return 0;

  const radians = Math.atan2(last.y - middle.y, last.x - middle.x) -
                  Math.atan2(first.y - middle.y, first.x - middle.x);

  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * 2. Bilateral Asymmetry Detector
 * Compares left vs right knee angles to flag compensation patterns.
 * A difference > 10° indicates one side is doing less work — injury risk.
 */
export function detectAsymmetry(landmarks: any[]): {
  detected: boolean;
  leftKneeAngle?: number;
  rightKneeAngle?: number;
  asymmetryDiff?: number;
  asymmetryScore?: number;
  isAsymmetric?: boolean;
  weakSide?: string;
} {
  const leftHip    = landmarks[23];
  const leftKnee   = landmarks[25];
  const leftAnkle  = landmarks[27];
  const rightHip   = landmarks[24];
  const rightKnee  = landmarks[26];
  const rightAnkle = landmarks[28];

  if (!leftHip || !leftKnee || !leftAnkle || !rightHip || !rightKnee || !rightAnkle) {
    return { detected: false };
  }

  const leftKneeAngle  = calculateJointAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);
  const diff = Math.abs(leftKneeAngle - rightKneeAngle);

  return {
    detected: true,
    leftKneeAngle,
    rightKneeAngle,
    asymmetryDiff: diff,
    // Score 0–100: 0 = perfectly symmetric, 100 = severely asymmetric
    asymmetryScore: Math.min(100, Math.round(diff * 3.3)),
    isAsymmetric: diff > 10,
    weakSide: leftKneeAngle > rightKneeAngle ? "left" : "right",
  };
}

/**
 * 3. Comprehensive Biometric Frame Parser
 * Processes coordinates based on the selected testing mode.
 * Returns { score, score100, level, rating, color } or { status }
 *   score     — raw measurement (degrees / drift units)
 *   score100  — normalised 0-100 talent score (higher = better)
 *   level     — "Elite" | "Good" | "Raw"
 */
export function processBiometricFrame(landmarks: any[], mode: string): {
  score?: number;
  score100?: number;
  level?: string;
  rating?: string;
  color?: string;
  status?: string;
  angle?: number;
} {
  const nose         = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightHip     = landmarks[24];
  const rightKnee    = landmarks[26];
  const rightAnkle   = landmarks[28];
  const leftAnkle    = landmarks[27];

  switch (mode) {
    case 'SPRINT_KNEE_DRIVE': {
      if (!rightHip || !rightKnee || !rightAnkle) return { status: "Searching for Athlete..." };
      const kneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);

      if (kneeAngle < 90) {
        // Elite: map 0–90° → 100–70
        const score100 = Math.round(100 - (kneeAngle / 90) * 30);
        return { score: kneeAngle, score100, level: "Elite", rating: "ELITE: High Knee Drive", color: "#10b981", angle: kneeAngle };
      } else if (kneeAngle < 120) {
        // Good: map 90–120° → 70–40
        const score100 = Math.round(70 - ((kneeAngle - 90) / 30) * 30);
        return { score: kneeAngle, score100, level: "Good", rating: "GOOD: Efficient Strides", color: "#3b82f6", angle: kneeAngle };
      } else {
        // Raw: map 120–180° → 40–0
        const score100 = Math.max(0, Math.round(40 - ((kneeAngle - 120) / 60) * 40));
        return { score: kneeAngle, score100, level: "Raw", rating: "RAW: Low Extension (Needs Coaching)", color: "#ef4444", angle: kneeAngle };
      }
    }

    case 'JUGGLING_CUSHION': {
      if (!rightHip || !leftAnkle || !rightAnkle || !nose || !leftShoulder) return { status: "Align Athlete..." };
      const headTilt     = Math.round(Math.abs(nose.y - leftShoulder.y) * 120);
      const verticalDrift = Math.round(Math.abs(rightAnkle.y - leftAnkle.y) * 100);
      const isElite      = headTilt <= 40;

      let level: string, score100: number;
      if (isElite && verticalDrift < 15) {
        level    = "Elite";
        score100 = Math.max(70, 100 - verticalDrift);
      } else if (isElite || verticalDrift < 30) {
        level    = "Good";
        score100 = Math.max(40, 70 - verticalDrift);
      } else {
        level    = "Raw";
        score100 = Math.max(0, 40 - verticalDrift);
      }

      return {
        score:        verticalDrift,
        score100:     Math.round(score100),
        level,
        rating:       isElite ? "Elite Rhythm (Soft Cushion)" : "Heavy Adjustments (Looking Down)",
        color:        isElite ? "#10b981" : "#ef4444",
      };
    }

    default:
      return { status: "Mode Selection Required" };
  }
}

// Type exports for use in other files
export interface AnalysisResult {
  score100: number;
  level: "Elite" | "Good" | "Raw";
  rating: string;
  angle?: number;
}

export interface AsymmetryResult {
  detected: boolean;
  isAsymmetric: boolean;
  weakSide: "left" | "right";
  leftKneeAngle: number;
  rightKneeAngle: number;
  asymmetryDiff: number;
  asymmetryScore: number;
}