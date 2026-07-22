'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Video, Upload, StopCircle, RotateCcw,
  Zap, TrendingUp, Users, ArrowRight, CheckCircle2,
  AlertTriangle, Minus, Loader2, Play
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'setup' | 'recording' | 'preview' | 'processing' | 'results';

type DrillType =
  | 'sprint' | 'dribbling' | 'shooting' | 'jumping'
  | 'passing' | 'defending' | 'first_touch' | 'heading';

interface JointScore {
  rating: 'strong' | 'good' | 'fair' | 'weak';
  note: string;
}

interface DrillAnalysis {
  posture_score: number;
  movement_efficiency: number;
  joint_scores: {
    knee_drive: JointScore;
    hip_extension: JointScore;
    arm_mechanics: JointScore;
    trunk_alignment: JointScore;
    foot_strike: JointScore;
  };
  strengths: string[];
  improvements: string[];
  drill_specific_tip: string;
  overall_assessment: string;
}

interface ProcessingStep {
  label: string;
  status: 'waiting' | 'running' | 'done' | 'error';
}

// ── Constants ────────────────────────────────────────────────────────────────

const DRILLS: { id: DrillType; label: string; emoji: string; desc: string }[] = [
  { id: 'sprint',      label: 'Sprint',      emoji: '⚡', desc: 'Running mechanics & drive phase' },
  { id: 'dribbling',   label: 'Dribbling',   emoji: '⚽', desc: 'Ball control & direction change' },
  { id: 'shooting',    label: 'Shooting',    emoji: '🎯', desc: 'Strike technique & follow-through' },
  { id: 'jumping',     label: 'Jumping',     emoji: '🦅', desc: 'Take-off & landing mechanics' },
  { id: 'passing',     label: 'Passing',     emoji: '📐', desc: 'Contact point & weight transfer' },
  { id: 'defending',   label: 'Defending',   emoji: '🛡️', desc: 'Stance, jockeying & challenge timing' },
  { id: 'first_touch', label: 'First Touch', emoji: '🤝', desc: 'Cushioning & body orientation' },
  { id: 'heading',     label: 'Heading',     emoji: '💪', desc: 'Contact timing & neck tension' },
];

const JOINT_LABELS: Record<string, string> = {
  knee_drive:      'Knee Drive',
  hip_extension:   'Hip Extension',
  arm_mechanics:   'Arm Mechanics',
  trunk_alignment: 'Trunk Alignment',
  foot_strike:     'Foot Strike',
};

const RATING_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  strong: { color: '#16a34a', bg: '#f0fdf4', label: 'Strong' },
  good:   { color: '#2563eb', bg: '#eff6ff', label: 'Good'   },
  fair:   { color: '#d97706', bg: '#fffbeb', label: 'Fair'   },
  weak:   { color: '#dc2626', bg: '#fef2f2', label: 'Weak'   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 65) return '#2563eb';
  if (score >= 50) return '#d97706';
  return '#dc2626';
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Exceptional';
  if (score >= 75) return 'Very Good';
  if (score >= 65) return 'Good';
  if (score >= 55) return 'Developing';
  return 'Needs Work';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PitchPage() {
  const token = useAuthStore((s) => s.token);

  const [phase, setPhase]             = useState<Phase>('setup');
  const [drill, setDrill]             = useState<DrillType | null>(null);
  const [videoBlob, setVideoBlob]     = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl]       = useState<string | null>(null);
  const [analysis, setAnalysis]       = useState<DrillAnalysis | null>(null);
  const [benchmark, setBenchmark]     = useState<number | null>(null);
  const [arenaPostId, setArenaPostId] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [recSeconds, setRecSeconds]   = useState(0);

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { label: 'Uploading video to secure storage',    status: 'waiting' },
    { label: 'Sending to Gemini AI for analysis',    status: 'waiting' },
    { label: 'Analysing body position & mechanics',  status: 'waiting' },
    { label: 'Comparing to platform benchmark',      status: 'waiting' },
    { label: 'Saving to Arena & Passport',           status: 'waiting' },
  ]);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [videoUrl]);

  useEffect(() => {
    if (phase === 'recording') {
      timerRef.current = setInterval(() => {
        setRecSeconds((s) => {
          if (s >= 89) { stopRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url  = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setPhase('preview');
      };
      mediaRef.current = rec;
      rec.start(250);
      setPhase('recording');
    } catch {
      setError('Camera access denied. Please allow camera access and try again.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop();
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Please select a video file.'); return; }
    if (file.size > 200 * 1024 * 1024) { setError('Video must be under 200 MB.'); return; }
    setVideoBlob(file);
    setVideoUrl(URL.createObjectURL(file));
    setPhase('preview');
  }, []);

  const updateStep = useCallback((idx: number, status: ProcessingStep['status']) => {
    setSteps((prev) => prev.map((s, i) => i === idx ? { ...s, status } : s));
  }, []);

  const analyse = useCallback(async () => {
    if (!videoBlob || !drill) return;
    setError(null);
    setPhase('processing');
    setSteps([
      { label: 'Uploading video to secure storage',    status: 'running' },
      { label: 'Sending to Gemini AI for analysis',    status: 'waiting' },
      { label: 'Analysing body position & mechanics',  status: 'waiting' },
      { label: 'Comparing to platform benchmark',      status: 'waiting' },
      { label: 'Saving to Arena & Passport',           status: 'waiting' },
    ]);

    const mimeType = videoBlob.type || 'video/webm';
    let r2Key    = '';
    let r2Url    = '';
    let fileUri  = '';
    let fileName = '';

    // Step 1: R2 upload
    try {
      const presRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ filename: `drill_${Date.now()}.webm`, contentType: mimeType, source: 'drill_analysis' }),
      });
      if (presRes.ok) {
        const { uploadUrl, publicUrl, key } = await presRes.json() as { uploadUrl: string; publicUrl: string; key: string };
        await fetch(uploadUrl, { method: 'PUT', body: videoBlob, headers: { 'Content-Type': mimeType } });
        r2Key = key;
        r2Url = publicUrl;
      }
    } catch { /* non-fatal */ }
    updateStep(0, 'done');

    // Step 2: Gemini Files API
    updateStep(1, 'running');
    try {
      const uploadRes = await fetch('/api/match-eye/upload', {
        method: 'POST',
        headers: { 'content-type': mimeType, 'x-content-length': String(videoBlob.size) },
      });
      if (!uploadRes.ok) throw new Error('Gemini upload init failed');
      const { uploadUrl: geminiUrl } = await uploadRes.json() as { uploadUrl: string };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', geminiUrl);
        xhr.setRequestHeader('Content-Type', mimeType);
        xhr.setRequestHeader('X-Goog-Upload-Command', 'upload, finalize');
        xhr.setRequestHeader('X-Goog-Upload-Offset', '0');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const resp = JSON.parse(xhr.responseText) as { file?: { uri?: string; name?: string } };
              fileUri  = resp.file?.uri  ?? '';
              fileName = resp.file?.name ?? '';
              resolve();
            } catch { reject(new Error('Failed to parse Gemini upload response')); }
          } else {
            reject(new Error(`Gemini upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Gemini upload network error'));
        xhr.send(videoBlob);
      });
      updateStep(1, 'done');
    } catch (e) {
      updateStep(1, 'error');
      setError(`Upload failed: ${e instanceof Error ? e.message : 'unknown error'}`);
      setPhase('preview');
      return;
    }

    // Step 3: Gemini analysis
    updateStep(2, 'running');
    let drillAnalysis: DrillAnalysis | null = null;
    try {
      const res = await fetch('/api/drill-analysis/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUri, fileName, mimeType, drillType: drill }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? 'Analysis failed');
      }
      const { analysis: a } = await res.json() as { analysis: DrillAnalysis };
      drillAnalysis = a;
      updateStep(2, 'done');
    } catch (e) {
      updateStep(2, 'error');
      setError(`Analysis failed: ${e instanceof Error ? e.message : 'unknown error'}`);
      setPhase('preview');
      return;
    }

    // Step 4: Save to backend + benchmark
    updateStep(3, 'running');
    let platformBenchmark: number | null = null;
    try {
      const saveRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/player/drill-analysis`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
          body: JSON.stringify({
            r2_key:        r2Key || `drill_analysis/local/${Date.now()}-${Math.random().toString(36).slice(2)}`,
            r2_url:        r2Url,
            drill_type:    drill,
            ai_feedback:   drillAnalysis,
            posture_score: drillAnalysis.posture_score,
          }),
        }
      );
      if (saveRes.ok) {
        const saved = await saveRes.json() as { benchmark?: number };
        platformBenchmark = saved.benchmark ?? null;
      }
    } catch { /* non-fatal */ }
    updateStep(3, 'done');

    // Step 5: Arena post
    updateStep(4, 'running');
    let postId: string | null = null;
    try {
      if (r2Url) {
        const postRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/arena/posts`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
            body: JSON.stringify({
              post_type: 'video',
              content:   `Just completed a ${drill.replace(/_/g, ' ')} drill analysis. Posture score: ${drillAnalysis.posture_score}/100. ${drillAnalysis.strengths[0] ?? ''}`,
              video_url: r2Url,
              metadata:  { drill_type: drill, posture_score: drillAnalysis.posture_score, video_source: 'pitch_drill' },
            }),
          }
        );
        if (postRes.ok) {
          const post = await postRes.json() as { data?: { id?: string } };
          postId = post.data?.id ?? null;
        }
      }
    } catch { /* non-fatal */ }
    updateStep(4, 'done');

    setAnalysis(drillAnalysis);
    setBenchmark(platformBenchmark);
    setArenaPostId(postId);
    setPhase('results');
  }, [videoBlob, drill, token, updateStep]);

  const reset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setAnalysis(null);
    setBenchmark(null);
    setArenaPostId(null);
    setError(null);
    setDrill(null);
    setPhase('setup');
  }, [videoUrl]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f2ee', fontFamily: 'system-ui, sans-serif' }}>
      {/* Nav */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e5e5', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/player" style={{ color: '#1a5c2a', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Drill Body Scan</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#666' }}>Record · AI Analysis · Passport Update</p>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#dc2626' }}>{error}</span>
          </div>
        )}

        {/* ── SETUP ─────────────────────────────────────────────────────────── */}
        {phase === 'setup' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>What drill are you recording?</h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
              AI will analyse your body position relative to top athletes and tell you exactly how to improve.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {DRILLS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDrill(d.id)}
                  style={{ backgroundColor: drill === d.id ? '#1a5c2a' : '#fff', color: drill === d.id ? '#fff' : '#1a1a1a', border: `2px solid ${drill === d.id ? '#1a5c2a' : '#e5e5e5'}`, borderRadius: 12, padding: '14px 12px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{d.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{d.desc}</div>
                </button>
              ))}
            </div>

            {drill && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={startRecording}
                  style={{ backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Video size={18} /> Record with Camera
                </button>
                <label style={{ backgroundColor: '#fff', color: '#1a5c2a', border: '2px solid #1a5c2a', borderRadius: 12, padding: '13px 20px', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Upload size={18} /> Upload Video
                  <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
                <p style={{ textAlign: 'center', fontSize: 11, color: '#999', margin: 0 }}>Max 200 MB · MP4, MOV, or WEBM</p>
              </div>
            )}
          </div>
        )}

        {/* ── RECORDING ─────────────────────────────────────────────────────── */}
        {phase === 'recording' && (
          <div>
            <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: 16, overflow: 'hidden', marginBottom: 16, aspectRatio: '9/16', maxHeight: 500 }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#dc2626', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff', animation: 'pulse 1s infinite' }} />
                REC {Math.floor(recSeconds / 60).toString().padStart(2, '0')}:{(recSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11 }}>
                90s max
              </div>
            </div>
            <button
              onClick={stopRecording}
              style={{ width: '100%', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <StopCircle size={18} /> Stop Recording
            </button>
          </div>
        )}

        {/* ── PREVIEW ──────────────────────────────────────────────────────── */}
        {phase === 'preview' && videoUrl && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
              Preview — {drill?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} drill
            </h2>
            <div style={{ backgroundColor: '#000', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
              <video src={videoUrl} controls playsInline style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={analyse} style={{ backgroundColor: '#1a5c2a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Zap size={18} /> Analyse Body Position
              </button>
              <button onClick={reset} style={{ backgroundColor: '#fff', color: '#666', border: '1px solid #e5e5e5', borderRadius: 12, padding: '13px 20px', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RotateCcw size={16} /> Start Over
              </button>
            </div>
          </div>
        )}

        {/* ── PROCESSING ────────────────────────────────────────────────────── */}
        {phase === 'processing' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24, paddingTop: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Loader2 size={28} color="#1a5c2a" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' }}>Analysing your drill</h2>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Gemini AI is watching your technique — this takes 30-60 seconds...</p>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < steps.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: step.status === 'done' ? '#f0fdf4' : step.status === 'running' ? '#fff3e0' : step.status === 'error' ? '#fef2f2' : '#f5f5f5' }}>
                    {step.status === 'done'    && <CheckCircle2 size={16} color="#16a34a" />}
                    {step.status === 'running' && <Loader2 size={16} color="#d97706" style={{ animation: 'spin 1s linear infinite' }} />}
                    {step.status === 'error'   && <AlertTriangle size={16} color="#dc2626" />}
                    {step.status === 'waiting' && <Minus size={16} color="#ccc" />}
                  </div>
                  <span style={{ fontSize: 13, color: step.status === 'waiting' ? '#999' : '#1a1a1a', fontWeight: step.status === 'running' ? 600 : 400 }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────────────── */}
        {phase === 'results' && analysis && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
              {drill?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Analysis
            </h2>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>AI-powered body position breakdown</p>

            {/* Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '2px solid #e8f5e9' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(analysis.posture_score) }}>{analysis.posture_score}</div>
                <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>POSTURE SCORE /100</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>{scoreLabel(analysis.posture_score)}</div>
              </div>
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#2563eb' }}>{analysis.movement_efficiency}</div>
                <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>MOVEMENT EFF. /100</div>
                <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>Efficiency Rating</div>
              </div>
            </div>

            {/* Benchmark */}
            {benchmark !== null && (
              <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 16, border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={20} color="#1a5c2a" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>Platform Benchmark</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    Platform avg for {drill?.replace(/_/g, ' ')}: <strong>{benchmark}/100</strong>
                    {analysis.posture_score > benchmark
                      ? <span style={{ color: '#16a34a', marginLeft: 4 }}> — above average</span>
                      : <span style={{ color: '#d97706', marginLeft: 4 }}> — keep training to reach avg</span>
                    }
                  </div>
                </div>
              </div>
            )}

            {/* Joint breakdown */}
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px' }}>Body Position Breakdown</h3>
              {(Object.entries(analysis.joint_scores) as [string, JointScore][]).map(([key, val]) => {
                const cfg = RATING_CONFIG[val.rating] ?? RATING_CONFIG.fair;
                return (
                  <div key={key} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{JOINT_LABELS[key] ?? key}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, backgroundColor: cfg.bg, padding: '2px 8px', borderRadius: 20 }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{val.note}</p>
                  </div>
                );
              })}
            </div>

            {/* Strengths */}
            <div style={{ backgroundColor: '#f0fdf4', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #bbf7d0' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#15803d', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Strengths
              </h3>
              {analysis.strengths.map((s, i) => (
                <p key={i} style={{ fontSize: 13, color: '#166534', margin: '0 0 4px' }}>• {s}</p>
              ))}
            </div>

            {/* Improvements */}
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #fed7aa' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#c2410c', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={16} /> 3 Things to Improve
              </h3>
              {analysis.improvements.map((imp, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#c2410c' }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: '#7c2d12', margin: 0, paddingTop: 2 }}>{imp}</p>
                </div>
              ))}
            </div>

            {/* Coaching tip */}
            <div style={{ backgroundColor: '#eff6ff', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #bfdbfe' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', margin: '0 0 6px' }}>
                Coaching Tip — {drill?.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>{analysis.drill_specific_tip}</p>
            </div>

            {/* Overall assessment */}
            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 8px' }}>Overall Assessment</h3>
              <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.6 }}>{analysis.overall_assessment}</p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {arenaPostId && (
                <Link href="/arena" style={{ backgroundColor: '#1a5c2a', color: '#fff', borderRadius: 12, padding: '13px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Play size={16} /> View on Arena <ArrowRight size={16} />
                </Link>
              )}
              <Link href="/player/passport" style={{ backgroundColor: '#fff', color: '#1a5c2a', border: '2px solid #1a5c2a', borderRadius: 12, padding: '12px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                View Talent Passport <ArrowRight size={16} />
              </Link>
              <button onClick={reset} style={{ backgroundColor: '#f4f2ee', color: '#555', border: 'none', borderRadius: 12, padding: '13px 20px', fontSize: 14, cursor: 'pointer' }}>
                Analyse Another Drill
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
