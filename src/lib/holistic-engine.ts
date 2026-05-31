// MediaPipe Holistic Engine - 543 Point Full Body Analysis
// Processes Pose (33), Face (468), Hands (42) simultaneously

export interface HolisticResults {
  pose: PoseLandmark[];
  face: FaceLandmark[];
  leftHand: HandLandmark[];
  rightHand: HandLandmark[];
  timestamp: number;
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface AthleteMetrics {
  // Body metrics (from Pose)
  kneeAngle: number;
  hipAngle: number;
  shoulderAngle: number;
  torsoLean: number;
  strideLength: number;
  armSwingEfficiency: number;
  
  // Head/Face metrics (from Face Mesh)
  headGazeX: number;
  headGazeY: number;
  expressionFatigue: number;      // Detected from facial tension
  focusScore: number;              // Based on head stability
  
  // Hand metrics (from Hands)
  gripStrength: number;            // Finger curl angle
  handSpeed: number;               // Wrist velocity
  gestureType: string;             // Open/Closed/Pointing
  
  // Combined metrics
  overallForm: number;             // 0-100 composite
  fatigueIndex: number;            // 0-100
  symmetryScore: number;           // 0-100
  explosivePower: number;          // 0-100
}

// Calculate angle between three points
export function calculateAngle(
  a: PoseLandmark | null,
  b: PoseLandmark | null,
  c: PoseLandmark | null
): number {
  if (!a || !b || !c) return 0;
  
  const radians = Math.atan2(c.y - b.y, c.x - b.x) -
                  Math.atan2(a.y - b.y, a.x - b.x);
  
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360.0 - angle;
  return Math.round(angle);
}

// Calculate distance between two points (in normalized units)
export function calculateDistance(
  a: PoseLandmark | null,
  b: PoseLandmark | null
): number {
  if (!a || !b) return 0;
  const dx = (a.x - b.x) * 100;
  const dy = (a.y - b.y) * 100;
  return Math.sqrt(dx * dx + dy * dy);
}

// Process all 543 points into athlete metrics
export function processHolisticData(
  pose: PoseLandmark[],
  face: FaceLandmark[],
  leftHand: HandLandmark[],
  rightHand: HandLandmark[]
): AthleteMetrics {
  
  // ----- POSE ANALYSIS (33 points) -----
  // Key pose indices:
  // 11-12: Shoulders, 13-14: Elbows, 15-16: Wrists
  // 23-24: Hips, 25-26: Knees, 27-28: Ankles
  
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];
  const leftHip = pose[23];
  const rightHip = pose[24];
  const leftKnee = pose[25];
  const rightKnee = pose[26];
  const leftAnkle = pose[27];
  const rightAnkle = pose[28];
  const leftWrist = pose[15];
  const rightWrist = pose[16];
  const leftElbow = pose[13];
  const rightElbow = pose[14];
  
  // Knee angle (sprint efficiency)
  const kneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  
  // Hip angle (posture)
  const hipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
  
  // Torso lean (forward/backward)
  const torsoLean = ((leftShoulder?.y || 0) - (leftHip?.y || 0)) * 100;
  
  // Stride length (distance between ankles)
  const strideLength = calculateDistance(leftAnkle, rightAnkle);
  
  // Arm swing efficiency (elbow angle during movement)
  const armSwingEfficiency = calculateAngle(leftShoulder, leftElbow, leftWrist);
  
  // ----- FACE ANALYSIS (468 points) -----
  // Key face indices for expression detection
  // Eyebrow positions indicate tension/fatigue
  const leftEyebrowInner = face[55];
  const rightEyebrowInner = face[285];
  const leftEye = face[33];
  const rightEye = face[263];
  const mouthCenter = face[13];
  
  // Head gaze direction (where player is looking)
  const headGazeX = (leftEye?.x || 0 + rightEye?.x || 0) / 2;
  const headGazeY = (leftEye?.y || 0 + rightEye?.y || 0) / 2;
  
  // Fatigue detection from facial tension
  // Raised/tense eyebrows = fatigue or stress
  const eyebrowHeight = ((leftEyebrowInner?.y || 0) + (rightEyebrowInner?.y || 0)) / 2;
  const expressionFatigue = Math.min(100, Math.max(0, (eyebrowHeight - 0.3) * 200));
  
  // Focus score based on head stability
  const focusScore = Math.max(0, 100 - Math.abs(headGazeY - 0.5) * 100);
  
  // ----- HAND ANALYSIS (42 points - 21 per hand) -----
  // Key hand indices:
  // Wrist: 0, Thumb: 1-4, Index: 5-8, Middle: 9-12, Ring: 13-16, Pinky: 17-20
  
  const leftWristHand = leftHand[0];
  const leftThumbTip = leftHand[4];
  const leftIndexTip = leftHand[8];
  const rightWristHand = rightHand[0];
  const rightThumbTip = rightHand[4];
  const rightIndexTip = rightHand[8];
  
  // Grip strength (distance between thumb and index finger)
  const leftGrip = calculateDistanceFromHand(leftThumbTip, leftIndexTip);
  const rightGrip = calculateDistanceFromHand(rightThumbTip, rightIndexTip);
  const gripStrength = Math.min(100, ((1 - (leftGrip + rightGrip) / 2) * 100));
  
  // Hand speed (movement between frames - placeholder for now)
  const handSpeed = 0; // Would need frame-to-frame tracking
  
  // Gesture classification
  let gestureType = "Neutral";
  if (leftGrip < 0.05 && rightGrip < 0.05) gestureType = "Closed Fist";
  else if (leftGrip > 0.15 && rightGrip > 0.15) gestureType = "Open Hand";
  else if (leftIndexTip?.y < leftWristHand?.y) gestureType = "Pointing";
  
  // ----- COMBINED METRICS -----
  // Overall form (composite of key metrics)
  const overallForm = Math.round(
    (Math.min(100, kneeAngle < 90 ? 100 : 100 - (kneeAngle - 90)) * 0.25 +
    (100 - Math.abs(torsoLean) * 2) * 0.2 +
    armSwingEfficiency * 0.2 +
    focusScore * 0.2 +
    gripStrength * 0.15)
  );
  
  // Fatigue index (combines facial tension and posture changes)
  const fatigueIndex = Math.round(
    (expressionFatigue * 0.6 +
    (torsoLean > 15 ? Math.min(100, torsoLean * 2) : 0) * 0.4)
  );
  
  // Symmetry score (left vs right comparison)
  const leftLegAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightLegAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const symmetryScore = Math.max(0, 100 - Math.abs(leftLegAngle - rightLegAngle));
  
  // Explosive power (based on knee angle and arm swing)
  const explosivePower = Math.round(
    (kneeAngle < 90 ? 100 : 100 - (kneeAngle - 90)) * 0.6 +
    armSwingEfficiency * 0.4
  );
  
  return {
    kneeAngle,
    hipAngle,
    shoulderAngle: calculateAngle(leftShoulder, rightShoulder, leftHip),
    torsoLean: Math.round(torsoLean),
    strideLength: Math.round(strideLength * 100),
    armSwingEfficiency: Math.round(armSwingEfficiency),
    headGazeX: Math.round(headGazeX * 100),
    headGazeY: Math.round(headGazeY * 100),
    expressionFatigue: Math.round(expressionFatigue),
    focusScore: Math.round(focusScore),
    gripStrength: Math.round(gripStrength),
    handSpeed: Math.round(handSpeed),
    gestureType,
    overallForm,
    fatigueIndex,
    symmetryScore: Math.round(symmetryScore),
    explosivePower
  };
}

// Helper for hand distance (hand landmarks have same x,y,z structure)
function calculateDistanceFromHand(
  a: HandLandmark | null,
  b: HandLandmark | null
): number {
  if (!a || !b) return 0;
  const dx = (a.x - b.x) * 100;
  const dy = (a.y - b.y) * 100;
  return Math.sqrt(dx * dx + dy * dy);
}

// Classify sport/position from holistic metrics
export function classifyFromHolistic(metrics: AthleteMetrics): {
  sport: string;
  position: string;
  confidence: number;
} {
  // High explosive power + good symmetry = striker/winger
  if (metrics.explosivePower > 80 && metrics.symmetryScore > 85) {
    return {
      sport: "Football",
      position: "Winger / Striker",
      confidence: 85
    };
  }
  
  // High focus + low fatigue + good arm swing = midfielder (always scanning)
  if (metrics.focusScore > 85 && metrics.fatigueIndex < 30 && metrics.armSwingEfficiency > 70) {
    return {
      sport: "Football",
      position: "Central Midfielder",
      confidence: 82
    };
  }
  
  // Good grip strength + hand speed = goalkeeper
  if (metrics.gripStrength > 70 && metrics.handSpeed > 60) {
    return {
      sport: "Football",
      position: "Goalkeeper",
      confidence: 88
    };
  }
  
  // Default
  return {
    sport: "Football",
    position: "Utility Player",
    confidence: 70
  };
}