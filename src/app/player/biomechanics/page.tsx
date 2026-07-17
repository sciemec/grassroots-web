'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, X, ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { measureFromVideo, type VideoMeasurement, type TestType } from '@/lib/super-engine';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://bhora-ai.onrender.com/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage = 'select' | 'guide' | 'upload' | 'processing' | 'results' | 'error';

interface Drill {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  cameraAngle: string;         // plain English
  howToDo: string[];           // numbered steps, simple words
  noEquipment: string;         // what to use if no gear
  whatWeCheck: {
    label: string;             // simplified metric name
    simple: string;            // plain English explanation
  }[];
}

interface PlayerResult {
  id: string;
  metrics: Record<string, number>;
  performance_index: number;
  resilience_index: number;
  flags: string[];
}

// ── Drills ────────────────────────────────────────────────────────────────────

const DRILLS: Drill[] = [
  {
    id: 'sprint_10m',
    name: 'Short Sprint',
    emoji: '⚡',
    tagline: 'Run as fast as you can for 10 steps',
    cameraAngle: 'Side view — phone level with your hips, 4–5 metres away',
    howToDo: [
      'Put your phone on a water bottle, brick, or ask someone to hold it at hip height.',
      'Stand side-on to the camera (your shoulder faces the lens).',
      'Mark two points about 10 big steps apart.',
      'Hit record, wait 2 seconds, then sprint as hard as you can from point A to point B.',
      'Stop the recording. Upload the clip here.',
    ],
    noEquipment: 'You just need space — a road, field, or compound. No cones needed, use stones or sticks as markers.',
    whatWeCheck: [
      { label: 'Body lean', simple: 'Are you leaning forward at the right angle? Leaning too far back makes you slow.' },
      { label: 'Knee lift', simple: 'How high does your knee come up? Higher knees = longer strides = more speed.' },
      { label: 'Side difference', simple: 'Is your left leg moving the same as your right? Big differences can cause injuries.' },
    ],
  },
  {
    id: 'cut_505',
    name: 'Quick Turn',
    emoji: '↩️',
    tagline: 'Sprint, plant your foot, and change direction fast',
    cameraAngle: 'Front view — phone facing you straight on, 4 metres away at knee height',
    howToDo: [
      'Set up two points about 5 big steps apart.',
      'Phone on the ground or a low surface, pointing at you.',
      'Hit record, sprint to the far point, plant hard, turn, sprint back.',
      'Do this 2–3 times in the same clip.',
    ],
    noEquipment: 'Use chalk lines, stones, or clothing as markers. Any firm surface works.',
    whatWeCheck: [
      { label: 'Knee cave risk', simple: 'Does your knee fall inward when you plant? That\'s a big injury warning sign.' },
      { label: 'Body lean', simple: 'Are you low and leaning into the turn, or upright and losing speed?' },
      { label: 'Side difference', simple: 'Is your left turn as sharp as your right? Weakness on one side matters.' },
    ],
  },
  {
    id: 'drop_jump',
    name: 'Step-Off Jump',
    emoji: '🦘',
    tagline: 'Step off a raised surface and jump straight up',
    cameraAngle: 'Front view — phone facing you, 3–4 metres away at knee height',
    howToDo: [
      'Find a step, kerb, or low wall (about 20–30 cm high).',
      'Set up the phone facing you straight on.',
      'Step off — do NOT jump off. Just step, land with both feet, then immediately jump as high as you can.',
      'Do this 3 times in the same clip.',
    ],
    noEquipment: 'No box? Use a dirt mound, low school step, or thick book stack. If you have nothing raised, do a normal standing jump from flat ground instead.',
    whatWeCheck: [
      { label: 'Knee cave risk', simple: 'Do your knees stay over your toes when you land? Caving inward = ACL risk.' },
      { label: 'Landing softness', simple: 'Do you bend your knees to absorb the landing, or do you land stiff-legged? Stiff landings damage joints.' },
      { label: 'Switch speed', simple: 'How fast do you go from landing to jumping? Faster = more explosive power.' },
      { label: 'Side difference', simple: 'Does one leg do more work than the other on landing?' },
    ],
  },
  {
    id: 'dynamic_header',
    name: 'Jump and Head',
    emoji: '🏃',
    tagline: 'Run two steps, jump, and head the ball',
    cameraAngle: 'Front view — phone facing you, 4 metres away at chest height',
    howToDo: [
      'Ask a friend to hold the ball up, or tie a ball in a net/bag at head height.',
      'Take two running steps, jump, and head the ball.',
      'The camera should capture your whole body from feet to head.',
      'Do this 3 times in the same clip.',
    ],
    noEquipment: 'No ball? Use a mango, balled-up cloth, or plastic bag stuffed with rags. Hang it from a tree branch or have someone hold it up.',
    whatWeCheck: [
      { label: 'Knee cave risk', simple: 'Do your knees stay in line when you land after heading?' },
      { label: 'Landing softness', simple: 'Do you land softly, or do you crash down hard?' },
      { label: 'Body lean', simple: 'Is your trunk upright as you jump, giving you good jump height?' },
    ],
  },
  {
    id: 'lateral_shuffle',
    name: 'Side-Step Speed',
    emoji: '↔️',
    tagline: 'Shuffle sideways as fast as possible',
    cameraAngle: 'Front view — phone facing you, 4 metres away at hip height',
    howToDo: [
      'Mark two points about 4 big steps apart (sideways).',
      'Phone in front of you, pointing at your face/chest.',
      'Shuffle side to side between the two points as fast as you can.',
      'Do NOT cross your feet. Stay low. Keep going for about 10 seconds.',
    ],
    noEquipment: 'Any flat surface works. Mark with stones, sticks, or chalk.',
    whatWeCheck: [
      { label: 'Body lean', simple: 'Are you staying low and leaning slightly? Standing tall loses speed.' },
      { label: 'Knee cave risk', simple: 'Are your knees staying strong and over your toes as you push sideways?' },
      { label: 'Side difference', simple: 'Are you as fast going left as going right?' },
    ],
  },
  {
    id: 'dribble_sprint',
    name: 'Sprint Dribble',
    emoji: '⚽',
    tagline: 'Dribble at full speed for 10 metres',
    cameraAngle: 'Side view — phone level with your hips, 4–5 metres away',
    howToDo: [
      'Place the phone to your side at hip height.',
      'Dribble at full speed in a straight line past the camera.',
      'Push the ball out ahead, sprint to it, touch again. Full pace!',
      'Do this 2 times in the same clip.',
    ],
    noEquipment: 'No football? Use a tennis ball, plastic bottle, or anything round you can push. Any firm ground works.',
    whatWeCheck: [
      { label: 'Body lean', simple: 'Are you leaning forward into the sprint, or sitting upright and slow?' },
      { label: 'Knee lift', simple: 'Are your knees driving up, giving you a long powerful stride?' },
      { label: 'Side difference', simple: 'Is your running action balanced on both sides?' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return '#16a34a';
  if (s >= 55) return '#d97706';
  return '#dc2626';
}

function scoreLabel(s: number) {
  if (s >= 75) return 'Great';
  if (s >= 55) return 'OK — room to improve';
  return 'Needs work';
}

// Map VideoMeasurement → PlayerResult format per drill type
function vmToPlayerResult(vm: VideoMeasurement, drillId: string): PlayerResult {
  const isJump = drillId === 'drop_jump' || drillId === 'dynamic_header';

  const tl = vm.sprintTrunkLean ?? 50;
  const kd = vm.sprintKneeDrive ?? 50;
  const as = vm.sprintArmSwing  ?? 50;
  const bA = vm.sprintAsymmetry ?? 30;
  const jH = vm.jumpHeightCm;

  let performance_index: number;
  let resilience_index:  number;
  let metrics: Record<string, number>;
  const flags: string[] = [];

  if (isJump) {
    performance_index = jH != null
      ? Math.min(100, Math.round((jH / 60) * 100))
      : Math.round((tl + kd) / 2);
    resilience_index  = Math.max(0, Math.round(100 - bA));
    metrics = {
      trunk_lean:   Math.round(tl),
      knee_flexion: Math.round(kd),
      asymmetry:    Math.round(bA),
      ...(jH != null ? { jump_height_cm: Math.round(jH) } : {}),
    };
    if (bA > 55) flags.push('landing_imbalance');
    if (kd < 45) flags.push('knee_flexion_low');
    if (tl < 45) flags.push('forward_lean_issue');
  } else {
    performance_index = Math.round((tl + kd + as) / 3);
    resilience_index  = Math.max(0, Math.round(100 - bA));
    metrics = {
      trunk_lean: Math.round(tl),
      knee_drive: Math.round(kd),
      arm_swing:  Math.round(as),
      asymmetry:  Math.round(bA),
    };
    if (bA > 55) flags.push('bilateral_imbalance');
    if (kd < 45) flags.push('knee_drive_low');
    if (tl < 45) flags.push('forward_lean_low');
  }

  return {
    id:                `local_${Date.now()}`,
    metrics,
    performance_index: Math.max(0, Math.min(100, performance_index)),
    resilience_index:  Math.max(0, Math.min(100, resilience_index)),
    flags,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BiometricsPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [stage,          setStage]         = useState<Stage>('select');
  const [drill,          setDrill]         = useState<Drill | null>(null);
  const [videoFile,      setVideoFile]     = useState<File | null>(null);
  const [uploadPct,      setUploadPct]     = useState(0);
  const [results,        setResults]       = useState<PlayerResult[]>([]);
  const [thutoNote,      setThutoNote]     = useState<string | null>(null);
  const [expandMetrics,  setExpandMetrics] = useState(false);
  const [errorMsg,       setErrorMsg]      = useState('');
  const [useCamera,      setUseCamera]     = useState(false);
  const [recording,      setRecording]     = useState(false);
  const [countdown,      setCountdown]     = useState(60);
  const [passportSaved,  setPassportSaved] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  // ── Camera helpers ────────────────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setErrorMsg('Camera not accessible. Use the Upload option instead.');
      setUseCamera(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoFile(new File([blob], 'recording.webm', { type: 'video/webm' }));
      stopCamera();
      setUseCamera(false);
    };
    mr.start(500);
    mediaRef.current = mr;
    setRecording(true);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { stopRecording(); return 0; }
        return c - 1;
      });
    }, 1000);
  }, [stopCamera]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (useCamera) startCamera();
    else stopCamera();
    return stopCamera;
  }, [useCamera, startCamera, stopCamera]);

  // ── In-browser analysis ───────────────────────────────────────────────────

  const analyseLocally = async () => {
    if (!videoFile || !drill) return;
    setStage('processing');
    setUploadPct(0);
    setErrorMsg('');

    try {
      const testType: TestType = (['drop_jump', 'dynamic_header'] as string[]).includes(drill.id)
        ? 'jump'
        : 'sprint';

      const vm = await measureFromVideo(
        videoFile,
        testType,
        (pct) => setUploadPct(pct),
      );

      if (!vm || vm.confidence < 0.1) {
        setErrorMsg('No person detected. Try a clear side-view clip with the full body visible.');
        setStage('error');
        return;
      }

      const player = vmToPlayerResult(vm, drill.id);
      setResults([player]);
      setStage('results');
      fetchThutoNote([player]);
      saveToPassport([player]);
    } catch {
      setErrorMsg('Analysis failed. Please try again with a shorter, clearer clip.');
      setStage('error');
    }
  };

  // ── THUTO coaching note ───────────────────────────────────────────────────

  const fetchThutoNote = async (players: PlayerResult[]) => {
    if (!players[0]) return;
    const p = players[0];
    const summary = `Drill: ${drill?.name}. Performance score: ${p.performance_index}. Body Safety score: ${p.resilience_index}. Flags: ${p.flags.join(', ') || 'none'}.`;
    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `A 14-year-old Zimbabwean footballer just got these movement scan results. ${summary} Write exactly 3 short sentences in very simple English. Sentence 1: tell them one thing they did well. Sentence 2: explain one thing to work on, using simple words (no jargon). Sentence 3: one easy thing they can do this week to improve.`,
          system_prompt: 'You are THUTO, a friendly AI coach for young Zimbabwean athletes. Use simple English only. No technical terms. Keep each sentence under 20 words.',
        }),
      });
      const data = await res.json();
      setThutoNote(data.response ?? data.answer ?? null);
    } catch { /* silent */ }
  };

  // ── Passport write-back ───────────────────────────────────────────────────

  const saveToPassport = (players: PlayerResult[]) => {
    const p = players[0];
    if (!p || !token || token === 'dev-token') return;
    fetch(`${API_URL}/player/biometric-scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        drill:             drill?.id,
        performance_index: p.performance_index,
        resilience_index:  p.resilience_index,
        flags:             p.flags,
      }),
    })
      .then(() => setPassportSaved(true))
      .catch(() => { /* silent — passport update is non-blocking */ });
  };

  // ── PDF export ────────────────────────────────────────────────────────────

  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const p = results[0];
    if (!p) return;

    // Header
    doc.setFillColor(26, 92, 42);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('GrassRoots Sports — Movement Scan', 14, 11);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Drill: ${drill?.name}   Player: ${user?.name ?? 'Unknown'}`, 14, 20);

    // Scores
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Your Scores', 14, 40);
    doc.setFontSize(11); doc.setFont('helvetica', 'normal');
    doc.text(`Performance: ${p.performance_index} / 100`, 14, 50);
    doc.text(`Body Safety:  ${p.resilience_index} / 100`, 14, 58);

    // Flags
    if (p.flags.length) {
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Areas to check with your coach:', 14, 72);
      doc.setFont('helvetica', 'normal');
      p.flags.forEach((f, i) => doc.text(`• ${f.replace(/_/g, ' ')}`, 18, 80 + i * 7));
    }

    // THUTO note
    if (thutoNote) {
      const y = 80 + (p.flags.length || 1) * 7 + 12;
      doc.setFont('helvetica', 'bold');
      doc.text('THUTO says:', 14, y);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(thutoNote, 180);
      doc.text(lines, 14, y + 8);
    }

    doc.setFontSize(8); doc.setTextColor(150, 150, 150);
    doc.text('grassrootssports.live', 14, 285);
    doc.save(`movement-scan-${drill?.id ?? 'result'}.pdf`);
  };

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (!hasHydrated) return null;

  const result = results[0] ?? null;

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f2ee' }}>

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 1rem' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', height: 52, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/player" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} /> Player Hub
          </Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>Movement Check</span>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>

        {/* ── SELECT ─────────────────────────────────────────────────────────── */}
        {stage === 'select' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Movement Check</h1>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                Pick a drill, film yourself (or get a friend to film you), upload the clip, and get your AI score in about a minute.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DRILLS.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setDrill(d); setStage('guide'); }}
                  style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '1rem 1.125rem', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a5c2a')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 26 }}>{d.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>{d.name}</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{d.tagline}</p>
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: 18 }}>›</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── GUIDE ──────────────────────────────────────────────────────────── */}
        {stage === 'guide' && drill && (
          <>
            <button onClick={() => setStage('select')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, marginBottom: '1.25rem', padding: 0 }}>
              <ArrowLeft size={15} /> Back
            </button>

            <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: '1.25rem', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <span style={{ fontSize: 30 }}>{drill.emoji}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>{drill.name}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{drill.tagline}</p>
                </div>
              </div>

              {/* Camera position */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '0.75rem', marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📱 Where to put the phone</p>
                <p style={{ margin: 0, fontSize: 13, color: '#166534' }}>{drill.cameraAngle}</p>
              </div>

              {/* Steps */}
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How to do it</p>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {drill.howToDo.map((step, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{step}</li>
                ))}
              </ol>

              {/* No equipment */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '0.75rem', marginTop: '1rem' }}>
                <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>No kit? No problem</p>
                <p style={{ margin: 0, fontSize: 13, color: '#78350f' }}>{drill.noEquipment}</p>
              </div>
            </div>

            {/* What AI checks */}
            <div style={{ backgroundColor: '#fff', borderRadius: 18, padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>What the AI looks for</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {drill.whatWeCheck.map((w, i) => (
                  <div key={i} style={{ borderLeft: '3px solid #1a5c2a', paddingLeft: 10 }}>
                    <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{w.label}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{w.simple}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStage('upload')}
              style={{ width: '100%', backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: 14, padding: '0.875rem', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              Ready — upload or record my clip →
            </button>
          </>
        )}

        {/* ── UPLOAD ─────────────────────────────────────────────────────────── */}
        {stage === 'upload' && drill && (
          <>
            <button onClick={() => { setStage('guide'); setVideoFile(null); setUseCamera(false); stopCamera(); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, marginBottom: '1.25rem', padding: 0 }}>
              <ArrowLeft size={15} /> Guide
            </button>

            <h2 style={{ margin: '0 0 1.25rem', fontSize: 18, fontWeight: 800, color: '#111827' }}>{drill.emoji} Upload Your Clip</h2>

            {/* Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem' }}>
              {[false, true].map(cam => (
                <button
                  key={String(cam)}
                  onClick={() => { setUseCamera(cam); setVideoFile(null); }}
                  style={{ flex: 1, padding: '0.625rem', borderRadius: 12, border: `2px solid ${useCamera === cam ? '#1a5c2a' : '#e5e7eb'}`, background: useCamera === cam ? '#f0fdf4' : '#fff', color: useCamera === cam ? '#1a5c2a' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  {cam ? <Camera size={15} /> : <Upload size={15} />}
                  {cam ? 'Use Camera' : 'Upload File'}
                </button>
              ))}
            </div>

            {/* Camera mode */}
            {useCamera && (
              <div style={{ marginBottom: '1.25rem' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 14, background: '#000', maxHeight: 260 }} />
                {!recording ? (
                  <button onClick={startRecording} style={{ marginTop: 10, width: '100%', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    ⏺ Start Recording
                  </button>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>● Recording…</span>
                      <span style={{ fontSize: 13, color: '#374151' }}>{countdown}s left</span>
                    </div>
                    <button onClick={stopRecording} style={{ width: '100%', backgroundColor: '#374151', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      ⬛ Stop Recording
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* File upload */}
            {!useCamera && (
              <div
                onClick={() => document.getElementById('bio-file')?.click()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setVideoFile(f); }}
                onDragOver={e => e.preventDefault()}
                style={{ border: `2px dashed ${videoFile ? '#1a5c2a' : '#d1d5db'}`, borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: videoFile ? '#f0fdf4' : '#fff', marginBottom: '1.25rem' }}
              >
                <Upload size={32} color={videoFile ? '#1a5c2a' : '#9ca3af'} style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: videoFile ? '#15803d' : '#374151' }}>
                  {videoFile ? `✓ ${videoFile.name}` : 'Tap to choose a video'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9ca3af' }}>MP4, MOV, WebM</p>
                <input id="bio-file" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }} />
              </div>
            )}

            {videoFile && (
              <div style={{ marginBottom: '1rem', padding: '0.625rem 1rem', backgroundColor: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#15803d' }}>✓ Clip ready</span>
                <button onClick={() => setVideoFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={15} /></button>
              </div>
            )}

            <button
              onClick={analyseLocally}
              disabled={!videoFile}
              style={{ width: '100%', backgroundColor: videoFile ? '#1a5c2a' : '#d1d5db', color: videoFile ? '#fff' : '#9ca3af', border: 'none', borderRadius: 14, padding: '0.875rem', fontSize: 15, fontWeight: 700, cursor: videoFile ? 'pointer' : 'not-allowed' }}
            >
              {videoFile ? 'Analyse My Movement →' : 'Upload a clip first'}
            </button>

            <p style={{ marginTop: 10, textAlign: 'center', fontSize: 12, color: '#9ca3af' }}>
              Your clip is sent securely to the GrassRoots AI and deleted after analysis.
            </p>
          </>
        )}

        {/* ── PROCESSING ─────────────────────────────────────────────────────── */}
        {stage === 'processing' && (
          <>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid #e5e7eb', borderTop: '4px solid #1a5c2a', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Analysing your movement…</h2>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: '1.5rem' }}>Running MoveNet · MediaPipe in your browser. Takes about 15–40 seconds.</p>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {uploadPct < 30 ? 'Extracting frames…' : uploadPct < 65 ? 'Detecting skeleton…' : uploadPct < 90 ? 'Cross-checking…' : 'Finalising…'}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1a5c2a' }}>{uploadPct}%</span>
                </div>
                <div style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: 6, backgroundColor: '#1a5c2a', width: `${uploadPct}%`, borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────────── */}
        {stage === 'results' && result && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>{drill?.emoji} Your Results</h2>
              <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: 10, padding: '0.5rem 0.875rem', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <FileDown size={14} /> Save PDF
              </button>
            </div>

            {passportSaved && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.5rem 0.875rem', marginBottom: '1rem', fontSize: 13, color: '#15803d' }}>
                ✓ Scores saved to your Talent Passport
              </div>
            )}

            {/* Two big scores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: '1.25rem' }}>
              {[
                { label: 'Performance', value: result.performance_index, hint: 'Speed, power, and movement quality' },
                { label: 'Body Safety', value: result.resilience_index, hint: 'How safe your movement is on your joints' },
              ].map(({ label, value, hint }) => (
                <div key={label} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '1.25rem', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                  <p style={{ margin: '0 0 4px', fontSize: 52, fontWeight: 900, lineHeight: 1, color: scoreColor(value) }}>{value}</p>
                  <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: scoreColor(value) }}>{scoreLabel(value)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{hint}</p>
                </div>
              ))}
            </div>

            {/* Flags */}
            {result.flags.length > 0 && (
              <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Show these to your coach</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {result.flags.map(f => (
                    <span key={f} style={{ backgroundColor: '#fed7aa', color: '#9a3412', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* THUTO note */}
            {thutoNote && (
              <div style={{ backgroundColor: '#fff', border: '2px solid #1a5c2a', borderRadius: 16, padding: '1.125rem', marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#1a5c2a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>THUTO says</p>
                <p style={{ margin: 0, fontSize: 14, color: '#111827', lineHeight: 1.65 }}>{thutoNote}</p>
              </div>
            )}
            {!thutoNote && (
              <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '1.125rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>THUTO is thinking… (may take a moment)</p>
              </div>
            )}

            {/* Metric breakdown */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setExpandMetrics(v => !v)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1.125rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Detailed breakdown</span>
                {expandMetrics ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
              </button>
              {expandMetrics && (
                <div style={{ padding: '0 1.125rem 1rem', borderTop: '1px solid #f3f4f6' }}>
                  {Object.entries(result.metrics).map(([key, val]) => {
                    const score = typeof val === 'number' ? Math.round(val) : 0;
                    return (
                      <div key={key} style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#374151' }}>{key.replace(/_/g, ' ')}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
                        </div>
                        <div style={{ height: 5, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: 5, backgroundColor: scoreColor(score), width: `${score}%`, borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setStage('select'); setDrill(null); setVideoFile(null); setResults([]); setThutoNote(null); setPassportSaved(false); }}
                style={{ flex: 1, backgroundColor: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 14, padding: '0.75rem', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                New scan
              </button>
              <Link href="/player/passport" style={{ flex: 1, backgroundColor: '#1a5c2a', color: '#fff', borderRadius: 14, padding: '0.75rem', fontSize: 14, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                View Passport →
              </Link>
            </div>
          </>
        )}

        {/* ── ERROR ──────────────────────────────────────────────────────────── */}
        {stage === 'error' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: 40, marginBottom: '1rem' }}>😔</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: '1.5rem' }}>{errorMsg || 'The analysis failed. Try again with a shorter, clearer clip.'}</p>
            <button onClick={() => { setStage('upload'); setVideoFile(null); }} style={{ backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: 12, padding: '0.75rem 1.5rem', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
