'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Upload, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { getDrillsForFlags } from '@/lib/drill-data';
import type { MediaPipeFlag } from '@/lib/drill-data';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'select' | 'upload' | 'processing' | 'results';
type DrillType = 'sprint' | 'jump_land' | 'touch_shot' | 'running' | 'full_scan';
type ScoreFlag = 'good' | 'warning' | 'issue';

interface MetricResult {
  score: number;
  flag: ScoreFlag;
  detail: string;
  rawValue?: number;
}

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

// ── Drill definitions ─────────────────────────────────────────────────────────

const DRILL_TYPES: {
  id: DrillType;
  label: string;
  emoji: string;
  description: string;
  metrics: string[];
}[] = [
  {
    id: 'sprint',
    label: 'Sprint',
    emoji: '⚡',
    description: 'Run at full speed past the camera',
    metrics: ['trunk_lean', 'knee_drive', 'bilateral_asymmetry'],
  },
  {
    id: 'jump_land',
    label: 'Jump & Land',
    emoji: '🦘',
    description: 'Jump and land on two feet, hold 2 seconds',
    metrics: ['landing_stiffness', 'knee_valgus', 'bilateral_asymmetry'],
  },
  {
    id: 'touch_shot',
    label: 'Touch / Shot',
    emoji: '⚽',
    description: 'Control the ball and strike or touch',
    metrics: ['body_shape', 'trunk_lean', 'knee_valgus'],
  },
  {
    id: 'running',
    label: 'Running Drill',
    emoji: '🏃',
    description: 'Jog or run with change of direction',
    metrics: ['knee_drive', 'trunk_lean', 'ankle_dorsiflexion', 'bilateral_asymmetry'],
  },
  {
    id: 'full_scan',
    label: 'Full Scan',
    emoji: '🔬',
    description: 'Any movement — all 6 metrics measured',
    metrics: ['trunk_lean', 'knee_drive', 'knee_valgus', 'bilateral_asymmetry', 'landing_stiffness', 'ankle_dorsiflexion'],
  },
];

const METRIC_LABELS: Record<string, string> = {
  trunk_lean:          'Trunk Lean',
  knee_drive:          'Knee Drive',
  knee_valgus:         'Knee Valgus',
  bilateral_asymmetry: 'Bilateral Symmetry',
  landing_stiffness:   'Landing Stiffness',
  ankle_dorsiflexion:  'Ankle Dorsiflexion',
  body_shape:          'Body Shape at Contact',
};

// Metric key → MediaPipe flag for drill prescription
const METRIC_TO_FLAG: Record<string, MediaPipeFlag> = {
  knee_valgus:         'knee_valgus',
  bilateral_asymmetry: 'bilateral_asymmetry',
  landing_stiffness:   'landing_stiffness',
  trunk_lean:          'trunk_lean_deficit',
  knee_drive:          'knee_drive',
  ankle_dorsiflexion:  'ankle_dorsiflexion',
  body_shape:          'hip_rotation_deficit',
};

const DRILL_METRICS: Record<DrillType, string[]> = {
  sprint:     ['trunk_lean', 'knee_drive', 'bilateral_asymmetry'],
  jump_land:  ['landing_stiffness', 'knee_valgus', 'bilateral_asymmetry'],
  touch_shot: ['body_shape', 'trunk_lean', 'knee_valgus'],
  running:    ['knee_drive', 'trunk_lean', 'ankle_dorsiflexion', 'bilateral_asymmetry'],
  full_scan:  ['trunk_lean', 'knee_drive', 'knee_valgus', 'bilateral_asymmetry', 'landing_stiffness', 'ankle_dorsiflexion'],
};

// ── Math helpers ──────────────────────────────────────────────────────────────

function angle3(a: Landmark, b: Landmark, c: Landmark): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const mag = Math.sqrt((ba.x ** 2 + ba.y ** 2) * (bc.x ** 2 + bc.y ** 2));
  if (mag === 0) return 180;
  return (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI;
}

function scoreFlag(s: number): ScoreFlag {
  if (s >= 75) return 'good';
  if (s >= 55) return 'warning';
  return 'issue';
}

// ── Per-metric calculators ────────────────────────────────────────────────────

function calcTrunkLean(frames: Landmark[][]): MetricResult {
  const leans: number[] = [];
  for (const lm of frames) {
    const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
    if (!ls || !rs || !lh || !rh) continue;
    const sx = (ls.x + rs.x) / 2, sy = (ls.y + rs.y) / 2;
    const hx = (lh.x + rh.x) / 2, hy = (lh.y + rh.y) / 2;
    leans.push(Math.atan2(Math.abs(sx - hx), Math.abs(sy - hy)) * (180 / Math.PI));
  }
  if (!leans.length) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  const avg = leans.reduce((a, b) => a + b, 0) / leans.length;
  // Ideal forward lean: 5–15°
  const score = Math.round(Math.min(100, Math.max(0, 100 - Math.abs(avg - 10) * 4)));
  const detail = score >= 75
    ? 'Good forward lean — efficient power transfer'
    : score >= 55
    ? 'Slight excess lean — check hip flexor tightness'
    : `Trunk at ${avg.toFixed(1)}° — adjust for better efficiency`;
  return { score, flag: scoreFlag(score), detail, rawValue: avg };
}

function calcKneeDrive(frames: Landmark[][]): MetricResult {
  const angles: number[] = [];
  for (const lm of frames) {
    const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24], lk = lm[25], rk = lm[26];
    if (!ls || !rs || !lh || !rh || !lk || !rk) continue;
    const sh  = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2, z: 0 };
    const hip = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2, z: 0 };
    const kn  = { x: (lk.x + rk.x) / 2, y: (lk.y + rk.y) / 2, z: 0 };
    angles.push(angle3(sh, hip, kn));
  }
  if (!angles.length) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  const minAngle = Math.min(...angles);
  // Peak drive = minimum hip–knee angle. Ideal peak: <90°
  const score = Math.round(Math.min(100, Math.max(0, 100 - Math.max(0, minAngle - 70) * 2)));
  const detail = score >= 75
    ? 'Strong knee lift — good stride mechanics'
    : score >= 55
    ? 'Moderate knee drive — work on hip flexor power'
    : 'Low knee drive — limits stride length and speed';
  return { score, flag: scoreFlag(score), detail, rawValue: minAngle };
}

function calcKneeValgus(frames: Landmark[][]): MetricResult {
  const deviations: number[] = [];
  for (const lm of frames) {
    const lh = lm[23], rh = lm[24], lk = lm[25], rk = lm[26], la = lm[27], ra = lm[28];
    if (!lh || !rh || !lk || !rk || !la || !ra) continue;
    const left  = Math.abs(180 - angle3(lh, lk, la));
    const right = Math.abs(180 - angle3(rh, rk, ra));
    deviations.push((left + right) / 2);
  }
  if (!deviations.length) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  const maxDev = Math.max(...deviations);
  // 0° deviation = knees track straight (100), 30°+ = severe collapse (0)
  const score = Math.round(Math.min(100, Math.max(0, 100 - maxDev * 3.3)));
  const detail = score >= 75
    ? 'Knees tracking well over toes'
    : score >= 55
    ? 'Mild inward knee collapse — strengthen glutes'
    : 'Knee valgus detected — injury risk. See prescriptions below.';
  return { score, flag: scoreFlag(score), detail };
}

function calcBilateralAsymmetry(frames: Landmark[][]): MetricResult {
  const diffs: number[] = [];
  for (const lm of frames) {
    const lh = lm[23], rh = lm[24], lk = lm[25], rk = lm[26], la = lm[27], ra = lm[28];
    if (!lh || !rh || !lk || !rk || !la || !ra) continue;
    diffs.push(Math.abs(angle3(lh, lk, la) - angle3(rh, rk, ra)));
  }
  if (!diffs.length) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  // 0° = perfect symmetry (100), 20°+ = severe (0)
  const score = Math.round(Math.min(100, Math.max(0, 100 - avg * 5)));
  const detail = score >= 75
    ? 'Both sides balanced — symmetrical movement'
    : score >= 55
    ? `${avg.toFixed(1)}° average side difference — monitor weaker limb`
    : `${avg.toFixed(1)}° asymmetry — overloading dominant side, injury risk`;
  return { score, flag: scoreFlag(score), detail, rawValue: avg };
}

function calcLandingStiffness(frames: Landmark[][]): MetricResult {
  if (frames.length < 5) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  // Detect landing frame: hip Y at maximum (lowest physical position)
  let maxHipY = -Infinity, landIdx = Math.floor(frames.length / 2);
  frames.forEach((lm, i) => {
    const lh = lm[23], rh = lm[24];
    if (!lh || !rh) return;
    const hy = (lh.y + rh.y) / 2;
    if (hy > maxHipY) { maxHipY = hy; landIdx = i; }
  });
  const atLanding = frames[landIdx];
  const lh = atLanding[23], lk = atLanding[25], la = atLanding[27];
  const kneeAngle = (lh && lk && la) ? angle3(lh, lk, la) : 170;
  // More knee flexion at landing = softer = better
  const flexion = Math.max(0, 170 - kneeAngle);
  const score = Math.round(Math.min(100, flexion * 3));
  const detail = score >= 75
    ? 'Soft landing — good energy absorption through the knee'
    : score >= 55
    ? 'Moderate stiffness — practise softer landings'
    : 'Stiff-legged landing — high ACL stress. See prescriptions below.';
  return { score, flag: scoreFlag(score), detail, rawValue: kneeAngle };
}

function calcAnkleDorsiflexion(frames: Landmark[][]): MetricResult {
  const angles: number[] = [];
  for (const lm of frames) {
    const lk = lm[25], rk = lm[26], la = lm[27], ra = lm[28], lf = lm[31], rf = lm[32];
    if (!lk || !rk || !la || !ra || !lf || !rf) continue;
    angles.push((angle3(lk, la, lf) + angle3(rk, ra, rf)) / 2);
  }
  if (!angles.length) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  const minAngle = Math.min(...angles); // peak dorsiflexion = smallest angle
  // Ideal min 65–80°; above 90° = restricted range
  const score = Math.round(Math.min(100, Math.max(0, 100 - Math.max(0, minAngle - 75) * 3)));
  const detail = score >= 75
    ? 'Good ankle range — supports deep knee bend'
    : score >= 55
    ? 'Moderate restriction — stretch calves daily'
    : 'Limited dorsiflexion — restricts deep knee bend and landing mechanics';
  return { score, flag: scoreFlag(score), detail, rawValue: minAngle };
}

function calcBodyShape(frames: Landmark[][]): MetricResult {
  const tilts: number[] = [];
  for (const lm of frames) {
    const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
    if (!ls || !rs || !lh || !rh) continue;
    const sTilt = Math.abs(ls.y - rs.y) * 100;
    const hTilt = Math.abs(lh.y - rh.y) * 100;
    tilts.push((sTilt + hTilt) / 2);
  }
  if (!tilts.length) return { score: 50, flag: 'warning', detail: 'Insufficient pose data' };
  const avg = tilts.reduce((a, b) => a + b, 0) / tilts.length;
  const score = Math.round(Math.min(100, Math.max(0, 100 - avg * 10)));
  const detail = score >= 75
    ? 'Balanced body position at contact'
    : score >= 55
    ? 'Slight lateral tilt — adjust standing foot position'
    : 'Poor body shape — affects both accuracy and power generation';
  return { score, flag: scoreFlag(score), detail, rawValue: avg };
}

function calculateScores(frames: Landmark[][], drill: DrillType): Record<string, MetricResult> {
  const all: Record<string, () => MetricResult> = {
    trunk_lean:          () => calcTrunkLean(frames),
    knee_drive:          () => calcKneeDrive(frames),
    knee_valgus:         () => calcKneeValgus(frames),
    bilateral_asymmetry: () => calcBilateralAsymmetry(frames),
    landing_stiffness:   () => calcLandingStiffness(frames),
    ankle_dorsiflexion:  () => calcAnkleDorsiflexion(frames),
    body_shape:          () => calcBodyShape(frames),
  };
  const result: Record<string, MetricResult> = {};
  for (const key of DRILL_METRICS[drill]) {
    result[key] = all[key]?.() ?? { score: 50, flag: 'warning', detail: 'Not calculated' };
  }
  return result;
}

// ── Page component ────────────────────────────────────────────────────────────

export default function BiometricsPage() {
  const [stage, setStage]         = useState<Stage>('select');
  const [drillType, setDrillType] = useState<DrillType | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [duration, setDuration]   = useState(0);
  const [progress, setProgress]   = useState(0);
  const [frameCount, setFrameCount]   = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [scores, setScores]       = useState<Record<string, MetricResult>>({});
  const [error, setError]         = useState<string | null>(null);
  const [mpLoaded, setMpLoaded]   = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load MediaPipe via CDN — no npm install required
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('mp-tasks-vision')) { setMpLoaded(true); return; }
    const script = document.createElement('script');
    script.id = 'mp-tasks-vision';
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => setMpLoaded(true);
    script.onerror = () => setError('Failed to load MediaPipe — check your internet connection.');
    document.head.appendChild(script);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('video/')) { setError('Please upload a video file (MP4, MOV, WebM).'); return; }
    setError(null);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => { setDuration(vid.duration); setVideoFile(file); };
    vid.src = URL.createObjectURL(file);
  };

  const runAnalysis = async () => {
    if (!videoFile || !drillType || !canvasRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!w.PoseLandmarker || !w.FilesetResolver) {
      setError('MediaPipe is still loading — please wait a moment then try again.');
      return;
    }
    setStage('processing');
    setError(null);
    try {
      const vision = await w.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const landmarker = await w.PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.playsInline = true;
      await new Promise<void>((res, rej) => { video.onloadedmetadata = () => res(); video.onerror = () => rej(); });

      const clipDuration = Math.min(video.duration, 30);
      const FPS = 10;
      const total = Math.floor(clipDuration * FPS);
      setTotalFrames(total);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 256;

      const allFrames: Landmark[][] = [];
      let ts = 1; // strictly monotonically increasing timestamps required by MediaPipe VIDEO mode

      for (let i = 0; i < total; i++) {
        video.currentTime = i / FPS;
        await new Promise<void>((res) => {
          const onSeeked = () => { video.removeEventListener('seeked', onSeeked); res(); };
          video.addEventListener('seeked', onSeeked);
          setTimeout(res, 250); // fallback if seeked never fires
        });
        ctx.drawImage(video, 0, 0, 256, 256);
        const result = landmarker.detectForVideo(canvas, ts);
        ts += 100;
        if (result.landmarks?.[0]) allFrames.push(result.landmarks[0] as Landmark[]);
        setFrameCount(i + 1);
        setProgress(Math.round(((i + 1) / total) * 100));
      }

      landmarker.close();

      if (allFrames.length < 5) {
        throw new Error('Not enough pose data. Make sure your full body is visible, well-lit, and the camera is steady.');
      }

      setScores(calculateScores(allFrames, drillType));
      setStage('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed — please try again.');
      setStage('upload');
    }
  };

  const reset = () => {
    setStage('select'); setDrillType(null); setVideoFile(null);
    setDuration(0); setProgress(0); setFrameCount(0); setTotalFrames(0);
    setScores({}); setError(null);
  };

  const overallScore = Object.keys(scores).length
    ? Math.round(Object.values(scores).reduce((s, r) => s + r.score, 0) / Object.values(scores).length)
    : 0;

  const flaggedFlags = Object.entries(scores)
    .filter(([, r]) => r.flag !== 'good')
    .map(([key]) => METRIC_TO_FLAG[key])
    .filter(Boolean) as MediaPipeFlag[];
  const prescriptions = getDrillsForFlags(flaggedFlags);

  const durationBarColor = duration === 0 ? '#6b7280'
    : duration <= 20 ? '#16a34a'
    : duration <= 30 ? '#d97706'
    : '#dc2626';

  const currentDrill = DRILL_TYPES.find(d => d.id === drillType);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1f12' }}>

      {/* Sticky nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid rgba(240,180,41,0.1)', background: 'rgba(13,31,18,0.95)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 1rem', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/player" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.45)', fontSize: 13, textDecoration: 'none' }}>
            <ChevronLeft size={15} /> Player Hub
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Biomechanics Scan</span>
          {!mpLoaded && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f0b429' }}>⏳ Loading AI…</span>}
        </div>
      </div>

      {/* Hidden canvas used for frame capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.75rem 1rem 3rem' }}>

        {/* ══ STAGE: SELECT ══════════════════════════════════════════════════════ */}
        {stage === 'select' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Biomechanics Scan</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Upload a short video (≤30s). MediaPipe analyses your movement frame-by-frame — <em>nothing is uploaded to any server.</em>
              </p>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,180,41,0.6)', marginBottom: 12 }}>
              Pick your drill type
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DRILL_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => { setDrillType(dt.id); setStage('upload'); }}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(240,180,41,0.12)', borderRadius: 16, padding: '1rem 1.25rem', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(240,180,41,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(240,180,41,0.12)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{dt.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#fff' }}>{dt.label}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{dt.description}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {dt.metrics.map(m => (
                      <span key={m} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.18)', color: '#f0b429' }}>
                        {METRIC_LABELS[m]}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ══ STAGE: UPLOAD ══════════════════════════════════════════════════════ */}
        {stage === 'upload' && currentDrill && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <button onClick={() => setStage('select')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, padding: 0 }}>
                <ChevronLeft size={14} /> Back
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{currentDrill.emoji} {currentDrill.label}</h2>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{currentDrill.description}</p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={e => e.preventDefault()}
              onClick={() => document.getElementById('bio-video-input')?.click()}
              style={{ border: '2px dashed rgba(240,180,41,0.25)', borderRadius: 18, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1.25rem', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(240,180,41,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(240,180,41,0.25)')}
            >
              <Upload size={36} color="#f0b429" style={{ margin: '0 auto 14px' }} />
              <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: '#fff' }}>
                {videoFile ? videoFile.name : 'Tap or drag your video here'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                MP4, MOV, WebM · Max 30 seconds · Full body must be in frame
              </p>
              <input id="bio-video-input" type="file" accept="video/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Duration bar */}
            {duration > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '0.875rem 1rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Video duration</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: durationBarColor }}>
                    {duration.toFixed(1)}s / 30s{duration > 30 ? ' — will analyse first 30s' : ''}
                  </span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: 5, borderRadius: 3, backgroundColor: durationBarColor, width: `${Math.min(100, (duration / 30) * 100)}%`, transition: 'width 0.3s' }} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem' }}>
                <XCircle size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 13, color: '#f87171' }}>{error}</span>
              </div>
            )}

            <button
              onClick={runAnalysis}
              disabled={!videoFile || !mpLoaded}
              style={{ width: '100%', borderRadius: 14, padding: '0.875rem', fontSize: 15, fontWeight: 700, border: 'none', cursor: videoFile && mpLoaded ? 'pointer' : 'not-allowed', background: videoFile && mpLoaded ? '#f0b429' : 'rgba(255,255,255,0.08)', color: videoFile && mpLoaded ? '#0d1f12' : 'rgba(255,255,255,0.25)' }}
            >
              {!mpLoaded ? '⏳ Loading MediaPipe…' : !videoFile ? 'Upload a video first' : '🔬 Analyse with MediaPipe'}
            </button>

            <p style={{ marginTop: 10, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              All processing happens in your browser — no video data leaves your device.
            </p>
          </>
        )}

        {/* ══ STAGE: PROCESSING ══════════════════════════════════════════════════ */}
        {stage === 'processing' && (
          <>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center', padding: '2.5rem 0 1.5rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(240,180,41,0.15)', borderTop: '3px solid #f0b429', animation: 'spin 0.9s linear infinite', margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Scanning your movement…</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>
                Frame {frameCount} of {totalFrames}
              </p>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: '2rem', overflow: 'hidden' }}>
                <div style={{ height: 6, borderRadius: 3, backgroundColor: '#f0b429', width: `${progress}%`, transition: 'width 0.2s' }} />
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '0.75rem 1rem' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,180,41,0.5)', marginBottom: 10 }}>
                Measuring
              </p>
              {currentDrill?.metrics.map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f0b429', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{METRIC_LABELS[m]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ STAGE: RESULTS ═════════════════════════════════════════════════════ */}
        {stage === 'results' && (
          <>
            {/* Overall score card */}
            <div style={{ background: overallScore >= 75 ? 'rgba(74,222,128,0.06)' : overallScore >= 55 ? 'rgba(240,180,41,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${overallScore >= 75 ? 'rgba(74,222,128,0.2)' : overallScore >= 55 ? 'rgba(240,180,41,0.2)' : 'rgba(248,113,113,0.2)'}`, borderRadius: 20, padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>
                {currentDrill?.emoji} {currentDrill?.label} · Overall Score
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 60, fontWeight: 900, lineHeight: 1, color: overallScore >= 75 ? '#4ade80' : overallScore >= 55 ? '#f0b429' : '#f87171' }}>
                {overallScore}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
                {overallScore >= 75 ? 'Strong movement quality' : overallScore >= 55 ? 'Some areas to address' : 'Needs focused work'}
              </p>
            </div>

            {/* Per-metric cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
              {Object.entries(scores).map(([key, result]) => {
                const colour = result.flag === 'good' ? '#4ade80' : result.flag === 'warning' ? '#f0b429' : '#f87171';
                const Icon   = result.flag === 'good' ? CheckCircle : result.flag === 'warning' ? AlertTriangle : XCircle;
                return (
                  <div key={key} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '1rem 1.125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Icon size={15} color={colour} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{METRIC_LABELS[key]}</span>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: colour }}>{result.score}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
                      <div style={{ height: 5, borderRadius: 3, backgroundColor: colour, width: `${result.score}%`, transition: 'width 0.6s ease' }} />
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{result.detail}</p>
                  </div>
                );
              })}
            </div>

            {/* Drill prescriptions */}
            {prescriptions.length > 0 && (
              <div style={{ background: 'rgba(217,119,6,0.07)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: 18, padding: '1.25rem', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#f0b429' }}>
                  Prescribed Remediation Drills
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {prescriptions.slice(0, 4).map(d => (
                    <div key={d.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 11, padding: '0.75rem 1rem' }}>
                      <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: '#fff' }}>{d.name}</p>
                      <p style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{d.why_it_matters}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,180,41,0.5)' }}>
                        {d.sets_reps} · {d.frequency}
                      </p>
                    </div>
                  ))}
                </div>
                <Link href="/player/drills" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 12, color: '#f0b429', textDecoration: 'none' }}>
                  View full drill library →
                </Link>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={reset} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '0.75rem', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                New Scan
              </button>
              <Link href="/player/drills" style={{ flex: 1, background: '#f0b429', color: '#0d1f12', borderRadius: 14, padding: '0.75rem', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Go to Drills →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
