// This is the brain - pure math, no UI
// Ported directly from your biomechanics.dart file

export interface JointPoint {
  x: number;
  y: number;
  visibility?: number;
}

export interface BiometricMetrics {
  kneeAngle: number;
  kneeRating: 'ELITE' | 'GOOD' | 'RAW';
  headTilt: number;
  coreDrift: number;
  symmetryScore: number;
  touchCushion: number;
  recommendedPosition: string;
  recommendedSport: string;
  confidenceScore: number;
}

// 1. Calculate angle between three joints (Hip -> Knee -> Ankle)
export function calculateJointAngle(
  first: JointPoint | null,
  middle: JointPoint | null,
  last: JointPoint | null
): number {
  if (!first || !middle || !last) return 0;
  
  const radians = Math.atan2(last.y - middle.y, last.x - middle.x) -
                  Math.atan2(first.y - middle.y, first.x - middle.x);
  
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

// 2. Knee Drive Analysis (Your exact logic from the Dart file)
export function analyzeKneeDrive(
  hip: JointPoint | null,
  knee: JointPoint | null,
  ankle: JointPoint | null
): { angle: number; rating: 'ELITE' | 'GOOD' | 'RAW' } {
  const angle = calculateJointAngle(hip, knee, ankle);
  
  if (angle < 90) {
    return { angle, rating: 'ELITE' };
  } else if (angle < 120) {
    return { angle, rating: 'GOOD' };
  } else {
    return { angle, rating: 'RAW' };
  }
}

// 3. Head tilt (looking down vs scanning the field)
export function analyzeHeadTilt(
  nose: JointPoint | null,
  leftShoulder: JointPoint | null,
  rightShoulder: JointPoint | null
): number {
  if (!nose || !leftShoulder || !rightShoulder) return 0;
  
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const tilt = Math.abs(nose.y - shoulderY) * 120;
  return Math.min(100, Math.round(tilt));
}

// 4. Core drift (stability during juggling)
export function analyzeCoreDrift(
  leftHip: JointPoint | null,
  rightHip: JointPoint | null,
  initialHipX: number | null
): number {
  if (!leftHip || !rightHip) return 0;
  
  const currentHipX = (leftHip.x + rightHip.x) / 2;
  if (initialHipX === null) return 0;
  
  const drift = Math.abs(currentHipX - initialHipX) * 100;
  return Math.min(100, Math.round(drift));
}

// 5. Bilateral symmetry (left vs right leg usage)
export function analyzeSymmetry(
  leftKnee: JointPoint | null,
  rightKnee: JointPoint | null
): number {
  if (!leftKnee || !rightKnee) return 50;
  
  const leftHeight = 1 - leftKnee.y;
  const rightHeight = 1 - rightKnee.y;
  const difference = Math.abs(leftHeight - rightHeight) * 100;
  
  return Math.max(0, Math.min(100, 100 - difference));
}

// 6. Sport/Position Classifier (from your sportsClassifier.js)
export function classifyAthleteProfile(metrics: {
  verticalTakeoffVelocity: number;
  decelerationFrames: number;
  tSpineRotationDeg: number;
  limbSymmetryIndex: number;
}): {
  primaryAttribute: string;
  recommendedSport: string;
  recommendedPosition: string;
  confidence: number;
} {
  const { verticalTakeoffVelocity, decelerationFrames, tSpineRotationDeg, limbSymmetryIndex } = metrics;
  
  // Case 1: Elite Vertical Power
  if (verticalTakeoffVelocity > 4.2 && decelerationFrames <= 15) {
    return {
      primaryAttribute: "Explosive Verticality & Reactive Elasticity",
      recommendedSport: "Football / Basketball",
      recommendedPosition: "Winger / Goalkeeper / Basketball Guard",
      confidence: 85
    };
  }
  
  // Case 2: Multi-directional Agility
  if (decelerationFrames < 12 && tSpineRotationDeg > 40) {
    return {
      primaryAttribute: "Elite Change-of-Direction & Lateral Deceleration",
      recommendedSport: "Football / Rugby / Tennis",
      recommendedPosition: "Defensive Midfielder / Fullback / Rugby Sevens Back",
      confidence: 82
    };
  }
  
  // Case 3: Deep Mobility & Flexibility
  if (tSpineRotationDeg >= 50 && limbSymmetryIndex > 90) {
    return {
      primaryAttribute: "Thoracic Rotational Torque & Kinetic Stability",
      recommendedSport: "Cricket / Football Playmaker / Combat Sports",
      recommendedPosition: "Central Box-to-Box Midfielder / Fast Bowler",
      confidence: 88
    };
  }
  
  // Default: Balanced Athlete
  return {
    primaryAttribute: "Balanced Mobility & Structural Strength",
    recommendedSport: "Football / Netball / Volleyball",
    recommendedPosition: "Center Back / Target Forward / Netball Shooter",
    confidence: 75
  };
}

// 7. Touch cushion (juggling quality)
export function analyzeTouchCushion(
  ankleVelocity: number,
  verticalDrift: number
): { score: number; rating: string } {
  let score = 100;
  let rating = "Good Control";
  
  if (verticalDrift > 15) {
    score = Math.max(45, 100 - (verticalDrift * 2));
  }
  
  if (score > 80) {
    rating = "Elite Touch (Soft Cushion)";
  } else if (score > 60) {
    rating = "Proficient Mechanics";
  } else {
    rating = "Erratic Rhythm (Heavy Adjustments)";
  }
  
  return { score, rating };
}