// src/lib/super-engine.ts
// GRS Super Engine — multi-tier AI orchestrator for athletic video analysis.
//
// Tier 1 (always available, runs in browser):
//   MediaPipe PoseLandmarker — 33 landmarks, best individual biomechanics
//   MoveNet Lightning         — 17 keypoints, fastest frame-rate pose
//   YOLOv8-det ONNX           — ball + multi-player detection
//
// Tier 2 (available when local Python server is running at localhost:8765):
//   OpenPifPaf  — multi-person pose on team footage
//   ByteTrack   — player tracking with jersey IDs across frames
//   Supervision — zone occupancy + heatmaps
//
// Usage:
//   const result = await measureFromVideo(file, 'jump', (pct, label, engine) => …)
//   // result.jumpHeightCm, result.enginesUsed, result.warnings …

import { extractFrames }                          from './engines/frame-extractor';
import { analyseWithPose }                         from './mediapipe-pose';
import {
  detectPoseMoveNet,
  mnTrunkLean, mnKneeDrive, mnArmSwing,
  mnBilateralAsymmetry,
  mnJumpFlightTime,
  mnBalanceCorrections,
  type MoveNetKeypoint,
}                                                  from './engines/movenet-engine';
import { detectObjects, isYoloAvailable }          from './engines/yolov8-engine';
import {
  analyseWithPython,
  isPythonServerAvailable,
  type PyTrackResult,
}                                                  from './engines/python-bridge';
import { jumpFromFlightTime }                      from './grs-engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TestType =
  | 'jump'         // T1 — detect flight time → jump height
  | 'sprint'       // T2 — trunk lean, knee drive, arm swing form scores
  | 'balance'      // T3 — correction count per leg
  | 'ball_mastery' // T6 — juggling count + turn quality
  | 'set_piece'    // Tactical — ball trajectory + player zone counts
  | 'team';        // Full team — ByteTrack heatmaps + zone occupancy

export interface VideoMeasurement {
  // ── GRS RawTestInputs fields (fed directly into grs-engine evaluate()) ──
  jumpFlightTimeSec?:   number;
  jumpHeightCm?:        number;
  balanceRightOpen?:    number;
  balanceLeftOpen?:     number;
  balanceRightClosed?:  number;
  balanceLeftClosed?:   number;
  jugglingCount?:       number;
  turnQualityScore?:    number;

  // ── Sprint form coaching scores (not in RawTestInputs, but shown in UI) ──
  sprintTrunkLean?:     number; // 0–100
  sprintKneeDrive?:     number;
  sprintArmSwing?:      number;
  sprintAsymmetry?:     number; // lower = better

  // ── Tactical / team data ─────────────────────────────────────────────────
  playersInFrame?:      number;
  ballTrajectory?:      Array<{ x: number; y: number; frame: number }>;
  zoneOccupancy?:       Record<string, number>;
  playerHeatmap?:       number[][];

  // ── Metadata ──────────────────────────────────────────────────────────────
  framesAnalysed:       number;
  confidence:           number;   // 0–1 fraction of frames with valid detection
  enginesUsed:          string[];
  testType:             TestType;
  warnings:             string[];
}

export type ProgressCallback = (pct: number, label: string, engine: string) => void;

// ── Helpers ───────────────────────────────────────────────────────────────────

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 50;
}

// ── T1: Jump ─────────────────────────────────────────────────────────────────

async function measureJump(
  file:       File,
  onProgress: ProgressCallback,
): Promise<Partial<VideoMeasurement> & { confidence: number; enginesUsed: string[]; warnings: string[] }> {
  const enginesUsed: string[] = [];
  const warnings:    string[] = [];

  // Extract 60 frames for better flight-time resolution
  onProgress(10, 'Extracting frames...', 'System');
  const frames = await extractFrames(file, 60, (p) => onProgress(10 + p * 0.2, 'Extracting frames...', 'System'));
  const fps    = frames.length / Math.max(frames[frames.length - 1]?.timestamp ?? 1, 0.001);

  // MoveNet — fast per-frame detection for flight time
  onProgress(32, 'Detecting skeleton with MoveNet...', 'MoveNet');
  const mnLandmarks = await Promise.all(frames.map((f) => detectPoseMoveNet(f.canvas)));
  const mnDetected  = mnLandmarks.filter(Boolean).length;
  const mnConfidence = mnDetected / frames.length;

  let jumpFlightTimeSec: number | undefined;
  let jumpHeightCm:      number | undefined;

  if (mnConfidence >= 0.3) {
    enginesUsed.push('MoveNet');
    const ft = mnJumpFlightTime(mnLandmarks, fps);
    if (ft > 0.05 && ft < 1.5) {
      jumpFlightTimeSec = parseFloat(ft.toFixed(3));
      jumpHeightCm      = Math.round(jumpFromFlightTime(ft));
    }
  }

  // MediaPipe fallback / confirmation — richer landmarks
  if (!jumpHeightCm) {
    onProgress(60, 'Confirming with MediaPipe...', 'MediaPipe');
    const poseResult = await analyseWithPose(file, 'movement', (p, lbl) =>
      onProgress(60 + p * 0.3, lbl, 'MediaPipe'),
    );
    if (poseResult && poseResult.confidence >= 0.3) {
      enginesUsed.push('MediaPipe');
      // MediaPipe doesn't give flight time directly but confirms detection
    }
  }

  if (!jumpHeightCm) {
    warnings.push('Could not detect jump takeoff/landing — ensure full body is visible and centred.');
  }

  return { jumpFlightTimeSec, jumpHeightCm, confidence: mnConfidence, enginesUsed, warnings };
}

// ── T2: Sprint form ───────────────────────────────────────────────────────────

async function measureSprint(
  file:       File,
  onProgress: ProgressCallback,
): Promise<Partial<VideoMeasurement> & { confidence: number; enginesUsed: string[]; warnings: string[] }> {
  const enginesUsed: string[] = [];
  const warnings:    string[] = [];

  // MediaPipe first — more precise (33 vs 17 landmarks, better heel tracking)
  onProgress(20, 'Analysing sprint form with MediaPipe...', 'MediaPipe');
  const poseResult = await analyseWithPose(file, 'movement', (p, lbl) =>
    onProgress(20 + p * 0.45, lbl, 'MediaPipe'),
  );

  const trunkLeans:  number[] = [];
  const kneeDrives:  number[] = [];
  const armSwings:   number[] = [];
  const asymmetries: number[] = [];

  if (poseResult && poseResult.confidence >= 0.3) {
    enginesUsed.push('MediaPipe');
    const m = poseResult.metrics;
    if (m.trunk_lean          !== undefined) trunkLeans.push(m.trunk_lean);
    if (m.knee_drive          !== undefined) kneeDrives.push(m.knee_drive);
    if (m.arm_swing           !== undefined) armSwings.push(m.arm_swing);
    if (m.bilateral_asymmetry !== undefined) asymmetries.push(m.bilateral_asymmetry);
  }

  // MoveNet cross-checks (runs over all frames for temporal consistency)
  onProgress(68, 'Cross-checking with MoveNet...', 'MoveNet');
  const frames       = await extractFrames(file, 30, () => undefined);
  const mnLandmarks  = await Promise.all(frames.map((f) => detectPoseMoveNet(f.canvas)));
  const mnDetected   = mnLandmarks.filter(Boolean).length;

  if (mnDetected > 0) {
    enginesUsed.push('MoveNet');
    const valid = mnLandmarks.filter((lm): lm is MoveNetKeypoint[] => lm !== null);
    trunkLeans.push(...valid.map(mnTrunkLean));
    kneeDrives.push(...valid.map(mnKneeDrive));
    armSwings.push(...valid.map(mnArmSwing));
    asymmetries.push(...valid.map(mnBilateralAsymmetry));
  }

  const confidence = Math.max(
    poseResult?.confidence ?? 0,
    mnDetected / frames.length,
  );

  if (confidence < 0.3) warnings.push('Low detection rate — ensure full body is visible.');

  return {
    sprintTrunkLean:  Math.round(avg(trunkLeans)),
    sprintKneeDrive:  Math.round(avg(kneeDrives)),
    sprintArmSwing:   Math.round(avg(armSwings)),
    sprintAsymmetry:  Math.round(avg(asymmetries)),
    confidence,
    enginesUsed: [...new Set(enginesUsed)],
    warnings,
  };
}

// ── T3: Balance ───────────────────────────────────────────────────────────────

async function measureBalance(
  file:       File,
  onProgress: ProgressCallback,
): Promise<Partial<VideoMeasurement> & { confidence: number; enginesUsed: string[]; warnings: string[] }> {
  onProgress(20, 'Counting balance corrections with MoveNet...', 'MoveNet');
  const frames      = await extractFrames(file, 60, (p) => onProgress(20 + p * 0.5, 'Extracting...', 'System'));
  const landmarks   = await Promise.all(frames.map((f) => detectPoseMoveNet(f.canvas)));
  const detected    = landmarks.filter(Boolean).length;
  const confidence  = detected / frames.length;

  const corrections = mnBalanceCorrections(landmarks, 'left'); // right leg raised
  const enginesUsed = confidence > 0.3 ? ['MoveNet'] : [];
  const warnings    = confidence < 0.3 ? ['Could not detect stance — ensure single-leg stance is clearly visible.'] : [];

  return {
    balanceRightOpen: corrections,
    // The other 3 variants need separate recordings — left leg, eyes closed
    confidence,
    enginesUsed,
    warnings,
  };
}

// ── T6: Ball mastery ──────────────────────────────────────────────────────────

async function measureBallMastery(
  file:       File,
  onProgress: ProgressCallback,
): Promise<Partial<VideoMeasurement> & { confidence: number; enginesUsed: string[]; warnings: string[] }> {
  const enginesUsed: string[] = [];
  const warnings:    string[] = [];
  const ballPositions: Array<{ x: number; y: number; frame: number }> = [];

  // YOLOv8 — ball tracking for juggling count
  onProgress(15, 'Checking YOLOv8 model...', 'YOLOv8');
  const yoloReady = await isYoloAvailable();

  const frames = await extractFrames(file, 30, (p) => onProgress(15 + p * 0.2, 'Extracting frames...', 'System'));

  let jugglingCount = 0;
  let ballDetected  = 0;

  if (yoloReady) {
    onProgress(38, 'Tracking ball with YOLOv8...', 'YOLOv8');
    for (const frame of frames) {
      const dets    = await detectObjects(frame.canvas);
      const balls   = dets.filter((d) => d.label === 'ball');
      const persons = dets.filter((d) => d.label === 'person');

      if (balls.length > 0) {
        ballDetected++;
        const ball = balls[0];
        ballPositions.push({ x: ball.bbox.x, y: ball.bbox.y, frame: frame.index });

        // Touch detection: ball Y near foot zone of person (bottom 10% of bbox)
        if (persons.length > 0) {
          const p          = persons[0];
          const footZoneY  = p.bbox.y + p.bbox.h * 0.9;
          const ballCentreY = ball.bbox.y + ball.bbox.h / 2;
          if (Math.abs(ballCentreY - footZoneY) < 0.07) jugglingCount++;
        }
      }
    }
    if (ballDetected > 0) enginesUsed.push('YOLOv8');
    else warnings.push('No ball detected — place yolov8n.onnx in /public/models/ and export from Python.');
  } else {
    warnings.push('YOLOv8 model not loaded — place yolov8n.onnx in /public/models/.');
  }

  // MediaPipe — turn quality from posture/technique drill
  onProgress(60, 'Scoring turn quality with MediaPipe...', 'MediaPipe');
  const poseResult = await analyseWithPose(file, 'technique', (p, lbl) =>
    onProgress(60 + p * 0.3, lbl, 'MediaPipe'),
  );

  let turnQualityScore = 50;
  let poseConfidence   = 0;

  if (poseResult && poseResult.confidence >= 0.3) {
    enginesUsed.push('MediaPipe');
    poseConfidence = poseResult.confidence;
    const lean = poseResult.metrics.trunk_lean          ?? 50;
    const asym = poseResult.metrics.bilateral_asymmetry ?? 50;
    turnQualityScore = Math.round(lean * 0.6 + (100 - asym) * 0.4);
  }

  return {
    jugglingCount,
    turnQualityScore,
    ballTrajectory: ballPositions,
    confidence:    Math.max(poseConfidence, ballDetected / Math.max(frames.length, 1)),
    enginesUsed:   [...new Set(enginesUsed)],
    warnings,
  };
}

// ── Set piece / team analysis ─────────────────────────────────────────────────

async function measureSetPiece(
  file:       File,
  onProgress: ProgressCallback,
): Promise<Partial<VideoMeasurement> & { confidence: number; enginesUsed: string[]; warnings: string[] }> {
  const enginesUsed:  string[] = [];
  const warnings:     string[] = [];
  const ballPositions: Array<{ x: number; y: number; frame: number }> = [];
  let maxPlayers = 0;

  const frames = await extractFrames(file, 60, (p) =>
    onProgress(5 + p * 0.15, 'Extracting frames...', 'System'),
  );

  // YOLOv8 — ball + player detection per frame
  const yoloReady = await isYoloAvailable();
  let detectedFrames = 0;

  if (yoloReady) {
    onProgress(22, 'Detecting ball and players with YOLOv8...', 'YOLOv8');
    for (const frame of frames) {
      const dets    = await detectObjects(frame.canvas);
      const balls   = dets.filter((d) => d.label === 'ball');
      const persons = dets.filter((d) => d.label === 'person');

      if (balls.length > 0) {
        ballPositions.push({ x: balls[0].bbox.x, y: balls[0].bbox.y, frame: frame.index });
      }
      if (persons.length > maxPlayers) maxPlayers = persons.length;
      if (dets.length > 0) detectedFrames++;
    }
    if (detectedFrames > 0) enginesUsed.push('YOLOv8');
  } else {
    warnings.push('YOLOv8 model missing — place yolov8n.onnx in /public/models/ for ball/player detection.');
  }

  // Python server — ByteTrack tracking + Supervision zone analysis
  onProgress(55, 'Checking Python AI server...', 'Python');
  const pythonUp = await isPythonServerAvailable();
  let zoneOccupancy: Record<string, number> | undefined;
  let playerHeatmap: number[][] | undefined;

  if (pythonUp) {
    onProgress(60, 'Running ByteTrack + zone analysis...', 'Python');
    const pyResult = await analyseWithPython(file, 'set_piece', (p) =>
      onProgress(60 + p * 0.3, 'Python team analysis...', 'Python'),
    );
    if (pyResult && 'zoneOccupancy' in pyResult) {
      const tr       = pyResult as PyTrackResult;
      zoneOccupancy  = tr.zoneOccupancy;
      playerHeatmap  = tr.heatmap;
      if (tr.ballPositions?.length) ballPositions.push(...tr.ballPositions);
      enginesUsed.push('ByteTrack', 'Supervision');
    }
  } else {
    warnings.push('Python server offline — zone heatmaps unavailable. Run: python scripts/grs-ai-server/main.py');
  }

  const confidence = detectedFrames / Math.max(frames.length, 1);

  return {
    playersInFrame: maxPlayers,
    ballTrajectory: ballPositions,
    zoneOccupancy,
    playerHeatmap,
    confidence,
    enginesUsed: [...new Set(enginesUsed)],
    warnings,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * measureFromVideo — the GRS Super Engine entry point.
 * Routes video to the correct AI engines based on testType.
 * Returns a VideoMeasurement that can be merged with manual RawTestInputs
 * and passed to the GRS engine's evaluate() function.
 */
export async function measureFromVideo(
  file:       File,
  testType:   TestType,
  onProgress: ProgressCallback = () => undefined,
): Promise<VideoMeasurement> {
  onProgress(2, 'Initialising GRS Super Engine...', 'System');

  type PartialResult = Partial<VideoMeasurement> & {
    confidence: number;
    enginesUsed: string[];
    warnings: string[];
  };

  let partial: PartialResult;

  switch (testType) {
    case 'jump':
      partial = await measureJump(file, onProgress);
      break;
    case 'sprint':
      partial = await measureSprint(file, onProgress);
      break;
    case 'balance':
      partial = await measureBalance(file, onProgress);
      break;
    case 'ball_mastery':
      partial = await measureBallMastery(file, onProgress);
      break;
    case 'set_piece':
    case 'team':
      partial = await measureSetPiece(file, onProgress);
      break;
    default:
      partial = { confidence: 0, enginesUsed: [], warnings: ['Unknown testType'] };
  }

  onProgress(100, 'Done', 'System');

  // Count frames from the file (approximation for metadata)
  const framesAnalysed = testType === 'sprint' || testType === 'jump' ? 60 : 30;

  return {
    ...partial,
    framesAnalysed,
    testType,
    warnings: partial.warnings ?? [],
    enginesUsed: partial.enginesUsed ?? [],
  };
}

/**
 * Probe which engines are available right now.
 * Useful for showing an engine status dashboard before analysis.
 */
export async function probeEngines(): Promise<{
  mediapipe: boolean;
  movenet:   boolean;
  yolov8:    boolean;
  python:    boolean;
  pythonEngines: string[];
}> {
  const [yolov8, python] = await Promise.all([
    isYoloAvailable(),
    isPythonServerAvailable(),
  ]);

  let pythonEngines: string[] = [];
  if (python) {
    const { getPythonEngines } = await import('./engines/python-bridge');
    pythonEngines = await getPythonEngines();
  }

  return {
    mediapipe: true, // always available (CDN WASM)
    movenet:   true, // always available (TF.js CDN)
    yolov8,
    python,
    pythonEngines,
  };
}
