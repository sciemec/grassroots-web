/**
 * 1. Deep Trigonometric Angle Calculator
 * Ported directly from your biomechanics.dart file logic
 */
export function calculateJointAngle(first, middle, last) {
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
 * 2. Comprehensive Biometric Frame Parser
 * Processes coordinates based on the selected testing mode
 */
export function processBiometricFrame(landmarks, mode) {
  // Common landmark indices from MediaPipe Pose model mapping
  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightHip = landmarks[24];
  const rightKnee = landmarks[26];
  const rightAnkle = landmarks[28];
  const leftAnkle = landmarks[27];

  switch (mode) {
    case 'SPRINT_KNEE_DRIVE':
      if (!rightHip || !rightKnee || !rightAnkle) return { status: "Searching for Athlete..." };
      const kneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);
      
      // Implements your exact Dart file scoring thresholds
      if (kneeAngle < 90) {
        return { score: kneeAngle, rating: "ELITE: High Knee Drive", color: "#10b981" };
      } else if (kneeAngle < 120) {
        return { score: kneeAngle, rating: "GOOD: Efficient Strides", color: "#3b82f6" };
      } else {
        return { score: kneeAngle, rating: "RAW: Low Extension (Needs Coaching)", color: "#ef4444" };
      }

    case 'JUGGLING_CUSHION':
      if (!rightHip || !leftAnkle || !rightAnkle || !nose || !leftShoulder) return { status: "Align Athlete..." };
      const headTilt = Math.round(Math.abs(nose.y - leftShoulder.y) * 120);
      const centerOfMassX = rightHip.x;
      const verticalDrift = Math.round(Math.abs(rightAnkle.y - leftAnkle.y) * 100);

      return {
        score: verticalDrift,
        rating: headTilt > 40 ? "Heavy Adjustments (Looking Down)" : "Elite Rhythm (Soft Cushion)",
        color: headTilt > 40 ? "#ef4444" : "#10b981"
      };

    default:
      return { status: "Mode Selection Required" };
  }
}