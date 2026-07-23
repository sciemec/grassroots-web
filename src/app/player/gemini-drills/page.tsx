'use client';
// src/app/player/gemini-drills/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Gemini Video Drill Analysis — player-facing
//
// Player picks a drill, uploads a video, Gemini 2.0 Flash analyses it,
// scores come back with per-dimension feedback. Results are saved to
// localStorage and optionally pushed to the backend / passport.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Camera, StopCircle, Video, CheckCircle2, AlertCircle,
  Loader2, Star, Info, History, ChevronDown, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { postToArena } from '@/lib/arena-poster';
import {
  getDrillsForSport, getDrillById, drillStorageKey, allDrillResultsKey,
  type GeminiDrill, type DrillResult,
} from '@/config/gemini-drills';

const GRS_GREEN  = '#1a5c2a';
const GRS_GOLD   = '#c8962a';
const SPORT_TABS = [
  { id: 'football',   label: 'Football',   emoji: '⚽' },
  { id: 'rugby',      label: 'Rugby',       emoji: '🏉' },
  { id: 'athletics',  label: 'Athletics',   emoji: '🏃' },
  { id: 'netball',    label: 'Netball',     emoji: '🏐' },
  { id: 'basketball', label: 'Basketball',  emoji: '🏀' },
  { id: 'cricket',    label: 'Cricket',     emoji: '🏏' },
  { id: 'swimming',   label: 'Swimming',    emoji: '🏊' },
  { id: 'tennis',     label: 'Tennis',      emoji: '🎾' },
  { id: 'volleyball', label: 'Volleyball',  emoji: '🏐' },
  { id: 'hockey',     label: 'Hockey',      emoji: '🏑' },
] as const;

type Phase =
  | 'idle'
  | 'getting_url'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

interface UploadState {
  phase: Phase;
  progress: number;  // 0–100 upload progress
  result: DrillResult | null;
  error: string | null;
}

function scoreColor(score: number): string {
  if (score >= 8) return '#16a34a';
  if (score >= 6) return GRS_GOLD;
  if (score >= 4) return '#ea580c';
  return '#dc2626';
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${score * 10}%`, background: scoreColor(score), borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function DrillCard({ drill, onSelect, bestScore }: {
  drill: GeminiDrill;
  onSelect: () => void;
  bestScore: number | null;
}) {
  const diffColor = drill.difficulty === 'beginner' ? '#16a34a' : drill.difficulty === 'intermediate' ? GRS_GOLD : '#dc2626';

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff', borderRadius: 14, padding: '16px',
        border: '1px solid #e5e5e5', cursor: 'pointer',
        transition: 'box-shadow 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{drill.emoji}</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {bestScore !== null && (
            <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(bestScore), background: '#f5f5f5', padding: '2px 7px', borderRadius: 20 }}>
              {bestScore}/10
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 600, color: diffColor, background: `${diffColor}18`, padding: '2px 7px', borderRadius: 20, textTransform: 'capitalize' }}>
            {drill.difficulty}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 4 }}>{drill.name}</div>
      <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 10 }}>{drill.description}</div>
      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {drill.dimensions.map(d => (
          <span key={d.key} style={{ fontSize: 10, color: '#888', background: '#f5f5f5', padding: '2px 7px', borderRadius: 20 }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultDisplay({ result, drill }: { result: DrillResult; drill: GeminiDrill }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Overall score hero */}
      <div style={{ background: GRS_GREEN, borderRadius: 12, padding: '18px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Overall Score
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{result.overall_score}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>out of 10</div>
        {result.data_confidence && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            Gemini confidence: {result.data_confidence}
          </div>
        )}
      </div>

      {/* Dimension scores */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #e5e5e5' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
          Breakdown
        </div>
        {drill.dimensions.map(dim => {
          const s = result.scores?.[dim.key];
          if (!s) return null;
          return (
            <div key={dim.key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#333', minWidth: 120 }}>{dim.label}</span>
                <ScoreBar score={s.score} />
                <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(s.score), minWidth: 30 }}>{s.score}/10</span>
              </div>
              <div style={{ fontSize: 11, color: '#666', paddingLeft: 128, lineHeight: 1.5 }}>{s.observation}</div>
            </div>
          );
        })}
      </div>

      {/* Strength + improvement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Your Strength
          </div>
          <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>{result.top_strength}</div>
        </div>
        <div style={{ background: '#fff7ed', borderRadius: 12, padding: '12px', border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Work On This
          </div>
          <div style={{ fontSize: 12, color: '#9a3412', lineHeight: 1.5 }}>{result.key_improvement}</div>
        </div>
      </div>

      {/* Coach note */}
      {result.coach_note && (
        <div style={{ background: '#f8f7f4', borderRadius: 12, padding: '12px 14px', border: '1px solid #e5e0d8' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GRS_GREEN, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Coach Note
          </div>
          <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6, fontStyle: 'italic' }}>{result.coach_note}</div>
        </div>
      )}

      {/* What Gemini measured */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <Info size={12} color="#999" />
        <span style={{ fontSize: 11, color: '#999' }}>What Gemini measured in this drill</span>
        {expanded ? <ChevronDown size={12} color="#999" /> : <ChevronRight size={12} color="#999" />}
      </button>
      {expanded && (
        <div style={{ background: '#f9f9f9', borderRadius: 10, padding: '10px 12px', border: '1px solid #eee' }}>
          {drill.dimensions.map(d => (
            <div key={d.key} style={{ fontSize: 11, color: '#666', marginBottom: 4, lineHeight: 1.5 }}>
              <strong style={{ color: '#444' }}>{d.label}:</strong> {d.tip}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GeminiDrillsPage() {
  const user      = useAuthStore((s) => s.user);
  const hydrated  = useAuthStore((s) => s._hasHydrated);
  const { isPro } = useSubscription();

  const [sport, setSport]         = useState<string>('football');

  // Auto-detect user's sport on load
  useEffect(() => {
    if (!hydrated || !user) return;
    const userSport = (user as unknown as Record<string, unknown>).sport as string | undefined;
    if (userSport) setSport(userSport.toLowerCase());
  }, [hydrated, user]);
  const [selected, setSelected]   = useState<GeminiDrill | null>(null);
  const [upload, setUpload]       = useState<UploadState>({
    phase: 'idle', progress: 0, result: null, error: null,
  });
  const [bestScores, setBestScores] = useState<Record<string, number>>({});
  const [history, setHistory]       = useState<DrillResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const xhrRef            = useRef<XMLHttpRequest | null>(null);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef         = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingPhase, setRecordingPhase] = useState<'idle' | 'requesting' | 'recording' | 'preview'>('idle');
  const [countdown, setCountdown]           = useState(30);
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);

  // Load best scores from localStorage
  useEffect(() => {
    if (!hydrated || !user) return;
    const scores: Record<string, number> = {};
    const allKey = allDrillResultsKey(user.name ?? user.email ?? '');
    const raw = localStorage.getItem(allKey);
    if (raw) {
      try {
        const all: DrillResult[] = JSON.parse(raw);
        setHistory(all.slice().reverse());
        all.forEach(r => {
          if (!scores[r.drillId] || r.overall_score > scores[r.drillId]) {
            scores[r.drillId] = r.overall_score;
          }
        });
      } catch { /* ignore */ }
    }
    setBestScores(scores);
  }, [hydrated, user]);

  const saveDrillResult = useCallback((result: DrillResult) => {
    if (!user) return;
    const playerName = user.name ?? user.email ?? 'player';
    // Save to per-drill key
    const key = drillStorageKey(result.drillId, playerName);
    const existing: DrillResult[] = (() => {
      try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
    })();
    existing.push(result);
    localStorage.setItem(key, JSON.stringify(existing.slice(-10)));

    // Save to all-drills key
    const allKey = allDrillResultsKey(playerName);
    const allExisting: DrillResult[] = (() => {
      try { return JSON.parse(localStorage.getItem(allKey) ?? '[]'); } catch { return []; }
    })();
    allExisting.push(result);
    localStorage.setItem(allKey, JSON.stringify(allExisting.slice(-50)));

    // Update best scores
    setBestScores(prev => ({
      ...prev,
      [result.drillId]: Math.max(prev[result.drillId] ?? 0, result.overall_score),
    }));
    setHistory(prev => [result, ...prev].slice(0, 20));

    // Persist to backend + Arena (fire-and-forget — never blocks the UI)
    const apiToken = localStorage.getItem('auth_token');
    if (apiToken && apiToken !== 'dev-token') {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/drills/${result.drillId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
        body: JSON.stringify({
          overall_score:   result.overall_score,
          top_strength:    result.top_strength,
          key_improvement: result.key_improvement,
          sport:           result.sport,
        }),
      }).catch(() => {});

      postToArena(
        `Scored ${result.overall_score}/10 on "${result.drillName}" drill`,
        {
          postType:     'milestone',
          activityType: 'gemini_drill',
          activityData: {
            drillId:      result.drillId,
            drillName:    result.drillName,
            score:        result.overall_score,
            sport:        result.sport,
            top_strength: result.top_strength,
          },
        }
      );
    }
  }, [user]);

  const handleStartRecording = useCallback(async () => {
    if (!isPro) return;
    setRecordingPhase('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      recordedChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => { if (ev.data.size > 0) recordedChunksRef.current.push(ev.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setRecordingPhase('preview');
      };

      mr.start(1000);
      setRecordingPhase('recording');
      setCountdown(30);
      let secs = 30;
      countdownTimerRef.current = setInterval(() => {
        secs -= 1;
        setCountdown(secs);
        if (secs <= 0) {
          clearInterval(countdownTimerRef.current!);
          mr.stop();
        }
      }, 1000);
    } catch {
      setRecordingPhase('idle');
      setUpload({ phase: 'error', progress: 0, result: null, error: 'Camera access denied. Please allow camera access and try again.' });
    }
  }, [isPro]);

  const handleStopRecording = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  }, []);

  const handleUploadRecording = useCallback(async () => {
    if (!selected || recordedChunksRef.current.length === 0) return;
    const mimeType = recordedChunksRef.current[0]?.type ?? 'video/webm';
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });

    setRecordingPhase('idle');
    setPreviewUrl(null);
    setUpload({ phase: 'getting_url', progress: 0, result: null, error: null });

    try {
      // Upload through proxy — avoids CORS block on direct Google uploads
      setUpload(prev => ({ ...prev, phase: 'uploading', progress: 0 }));
      const uploadData = await new Promise<{ fileUri: string; fileName: string; mimeType: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUpload(prev => ({ ...prev, progress: Math.round((ev.loaded / ev.total) * 95) }));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error('Unexpected response from upload server')); }
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', '/api/match-eye/upload');
        xhr.setRequestHeader('Content-Type', blob.type || 'video/webm');
        xhr.setRequestHeader('X-Upload-Content-Length', String(blob.size));
        xhr.send(blob);
      });
      const fileUri  = uploadData.fileUri;
      const fileName = uploadData.fileName;
      if (!fileUri) throw new Error('Upload server did not return a file URI');

      // Step 3: Analyse with Gemini
      setUpload(prev => ({ ...prev, phase: 'processing', progress: 100 }));
      const analyseRes = await fetch('/api/gemini-drill-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUri, fileName, drillId: selected.id }),
      });

      if (!analyseRes.ok) {
        const err = await analyseRes.json().catch(() => ({ error: 'Analysis failed' }));
        throw new Error(err.error ?? 'Gemini analysis failed');
      }

      const result = await analyseRes.json() as DrillResult;
      saveDrillResult(result);
      setUpload({ phase: 'done', progress: 100, result, error: null });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setUpload({ phase: 'error', progress: 0, result: null, error: message });
    }
  }, [selected, saveDrillResult]);

  const resetUpload = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setRecordingPhase('idle');
    setPreviewUrl(null);
    setCountdown(30);
    recordedChunksRef.current = [];
    setUpload({ phase: 'idle', progress: 0, result: null, error: null });
  };

  const drills = getDrillsForSport(sport);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f2ee' }}>
      {/* Header */}
      <div style={{ background: GRS_GREEN, padding: '16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/player" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Video Drill Analysis</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Gemini 2.0 Flash · sees motion, not just frames</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px' }}>

        {/* Sport selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto' }}>
          {SPORT_TABS.map(s => (
            <button
              key={s.id}
              onClick={() => { setSport(s.id); setSelected(null); resetUpload(); }}
              style={{
                padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap',
                background: sport === s.id ? GRS_GREEN : '#fff',
                color: sport === s.id ? '#fff' : '#555',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {/* What Gemini can do — info banner */}
        <div style={{ background: '#eaf3de', borderRadius: 12, padding: '12px 14px', border: '1px solid #c3dfa0', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: GRS_GREEN, marginBottom: 4 }}>
            How Gemini analyses your video
          </div>
          <div style={{ fontSize: 11, color: '#3a6b2a', lineHeight: 1.6 }}>
            Gemini 2.0 Flash processes your full clip at 1 frame per second — it sees motion across time, not just one frozen image. It can read acceleration, body shape, foot surface, cut sharpness, and technique without any special equipment. Just record on your phone and upload.
          </div>
        </div>

        {/* Drill selection */}
        {!selected ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 10 }}>
              Choose a drill to analyse
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 20 }}>
              {drills.map(d => (
                <DrillCard
                  key={d.id}
                  drill={d}
                  onSelect={() => { setSelected(d); resetUpload(); }}
                  bestScore={bestScores[d.id] ?? null}
                />
              ))}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', color: '#555' }}
                >
                  <History size={14} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Past analyses ({history.length})</span>
                  {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {showHistory && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {history.slice(0, 10).map((r, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '10px 12px', border: '1px solid #e5e5e5' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{r.drillName}</span>
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{new Date(r.analysedAt).toLocaleDateString()}</div>
                          </div>
                          <span style={{ fontSize: 20, fontWeight: 900, color: scoreColor(r.overall_score) }}>{r.overall_score}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 6, lineHeight: 1.5 }}>{r.top_strength}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Drill analysis flow */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Back to list */}
            <button
              onClick={() => { setSelected(null); resetUpload(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, color: '#555', alignSelf: 'flex-start' }}
            >
              <ChevronLeft size={16} />
              <span style={{ fontSize: 13 }}>All drills</span>
            </button>

            {/* Drill info card */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e5e5e5' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 32 }}>{selected.emoji}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{selected.description}</div>
                </div>
              </div>

              {/* What to record */}
              <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GRS_GREEN, marginBottom: 4 }}>How to record this</div>
                <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>{selected.whatToRecord}</div>
                <div style={{ fontSize: 11, color: '#4b7c4b', marginTop: 6 }}>
                  Duration: {selected.duration} &nbsp;·&nbsp; Equipment: {selected.equipment.join(', ')}
                </div>
              </div>

              {/* What Gemini will measure */}
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6 }}>Gemini will score:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selected.dimensions.map(d => (
                  <div key={d.key} title={d.tip} style={{ fontSize: 11, background: '#f5f5f5', color: '#555', padding: '3px 8px', borderRadius: 20, cursor: 'help' }}>
                    {d.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Record / analysis flow — idle */}
            {upload.phase === 'idle' && recordingPhase === 'idle' && (
              <>
                {!isPro && (
                  <div style={{ background: '#fffbeb', border: '1px solid #f0b429', borderRadius: 12, padding: '14px 16px', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>🔒 Premium Feature</div>
                    <div style={{ fontSize: 12, color: '#92400e', marginBottom: 10 }}>Subscribe to record videos and get Gemini AI coaching scores.</div>
                    <Link href="/player/subscription" style={{ display: 'inline-block', padding: '8px 18px', background: '#c8962a', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      View plans →
                    </Link>
                  </div>
                )}
                <button
                  onClick={handleStartRecording}
                  style={{
                    width: '100%', padding: '18px', borderRadius: 14,
                    background: isPro ? GRS_GREEN : '#9ca3af', color: '#fff', fontWeight: 700, fontSize: 15,
                    border: 'none', cursor: isPro ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    opacity: isPro ? 1 : 0.6,
                  }}
                  disabled={!isPro}
                >
                  <Camera size={18} />
                  {isPro ? 'Record 30-second video for Gemini' : '🔒 Unlock to record videos'}
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#aaa' }}>
                  Records 30 seconds from your camera · Gemini analyses motion over time
                </div>
              </>
            )}

            {/* Requesting camera access */}
            {upload.phase === 'idle' && recordingPhase === 'requesting' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                <Loader2 size={28} color={GRS_GREEN} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>Requesting camera access…</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>Allow camera access when prompted by your browser</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {/* Recording countdown */}
            {upload.phase === 'idle' && recordingPhase === 'recording' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: `2px solid ${GRS_GREEN}`, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef2f2', border: '3px solid #dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 28, fontWeight: 900, color: '#dc2626' }}>
                  {countdown}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>Recording…</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>{selected.whatToRecord}</div>
                <button
                  onClick={handleStopRecording}
                  style={{ padding: '10px 24px', borderRadius: 10, background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <StopCircle size={16} />
                  Stop early
                </button>
              </div>
            )}

            {/* Preview before sending to Gemini */}
            {upload.phase === 'idle' && recordingPhase === 'preview' && previewUrl && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>Preview your clip</div>
                <video
                  src={previewUrl}
                  controls
                  style={{ width: '100%', borderRadius: 10, background: '#000', marginBottom: 12, maxHeight: 280, objectFit: 'contain' }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setRecordingPhase('idle'); setPreviewUrl(null); recordedChunksRef.current = []; }}
                    style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, border: '1px solid #d1d5db', cursor: 'pointer' }}
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleUploadRecording}
                    style={{ flex: 2, padding: '12px', borderRadius: 10, background: GRS_GREEN, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Video size={16} />
                    Send to Gemini
                  </button>
                </div>
              </div>
            )}

            {(upload.phase === 'getting_url' || upload.phase === 'uploading') && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                <Video size={32} color={GRS_GREEN} style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 6 }}>
                  {upload.phase === 'getting_url' ? 'Preparing upload…' : `Uploading video — ${upload.progress}%`}
                </div>
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${upload.progress}%`, background: GRS_GREEN, borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Video goes directly to Google — bypasses our servers</div>
              </div>
            )}

            {upload.phase === 'processing' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: '32px 24px', border: '1px solid #e5e5e5', textAlign: 'center' }}>
                <Loader2 size={36} color={GRS_GREEN} className="animate-spin" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>Gemini is watching your video…</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                  Gemini 2.0 Flash processes every second of your clip — reading body shape, foot surface, acceleration, and technique across the full video.
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 12 }}>This takes 30–90 seconds</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {upload.phase === 'done' && upload.result && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>
                  <CheckCircle2 size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Analysis complete — results saved to your profile</span>
                </div>
                <ResultDisplay result={upload.result} drill={selected} />
                <button
                  onClick={resetUpload}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12,
                    background: '#fff', color: GRS_GREEN, fontWeight: 700, fontSize: 14,
                    border: `2px solid ${GRS_GREEN}`, cursor: 'pointer',
                  }}
                >
                  Analyse another video for this drill
                </button>
              </>
            )}

            {upload.phase === 'error' && (
              <div style={{ background: '#fdecea', borderRadius: 14, padding: '16px', border: '1px solid #f7c1c1' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <AlertCircle size={16} color="#b42318" style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#b42318' }}>Analysis failed</div>
                </div>
                <div style={{ fontSize: 12, color: '#9b2335', marginBottom: 12 }}>{upload.error}</div>
                <button onClick={resetUpload} style={{ fontSize: 12, color: '#b42318', background: 'none', border: '1px solid #b42318', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Gemini cannot measure — disclaimer */}
        <div style={{ marginTop: 24, padding: '10px 14px', borderRadius: 10, background: '#f5f5f5', border: '1px solid #e5e5e5' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>Gemini cannot measure</div>
          <div style={{ fontSize: 11, color: '#999', lineHeight: 1.6 }}>
            Exact speed in km/h · precise angles · heart rate · offside position · distance covered
          </div>
        </div>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
