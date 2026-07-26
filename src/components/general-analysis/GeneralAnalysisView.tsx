'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, Download,
  Star, Users, Target, Lightbulb, Zap, Film, TrendingUp,
} from 'lucide-react';
import { uploadVideoInChunks } from '@/lib/upload-chunks';
import { useAuthStore } from '@/lib/auth-store';

interface GeneralAnalysisParticipants {
  estimated_count: number;
  age_group: string;
  level: string;
}

interface GeneralAnalysis {
  video_type: string;
  context_summary: string;
  participants: GeneralAnalysisParticipants;
  key_observations: string[];
  strengths: string[];
  improvements: string[];
  tactical_note: string | null;
  standout_moment: string | null;
  coaching_priority: string;
  drill_recommendation: string;
  overall_score: number;
  score_rationale: string;
}

type Status = 'idle' | 'uploading' | 'analysing' | 'done' | 'error';

interface Props {
  backHref: string;
}

const VIDEO_TYPE_LABELS: Record<string, string> = {
  match:               'Full Match',
  training_drill:      'Training Drill',
  skill_practice:      'Skill Practice',
  small_sided_game:    'Small-Sided Game',
  street_football:     'Street Football',
  goalkeeper_training: 'Goalkeeper Training',
  fitness_session:     'Fitness Session',
  other:               'Football Footage',
};

function ScoreCircle({ score }: { score: number }) {
  const colour =
    score === 0 ? '#6b7280'
    : score >= 8 ? '#16a34a'
    : score >= 6 ? '#c8962a'
    : score >= 4 ? '#ea580c'
    : '#dc2626';
  const label =
    score === 0 ? 'Unclear'
    : score >= 8 ? 'Excellent'
    : score >= 6 ? 'Good'
    : score >= 4 ? 'Developing'
    : 'Poor';
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow"
        style={{ backgroundColor: colour }}
      >
        {score === 0 ? '?' : score}
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colour }}>
        {label}
      </span>
      <span className="text-xs text-gray-400">out of 10</span>
    </div>
  );
}

export default function GeneralAnalysisView({ backHref }: Props) {
  const token = useAuthStore((s) => s.token);

  const [file, setFile]         = useState<File | null>(null);
  const [userNote, setUserNote] = useState('');
  const [status, setStatus]     = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<GeneralAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [freeTrial, setFreeTrial] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }, []);

  const handleAnalyse = useCallback(async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const uploaded = await uploadVideoInChunks(file, (pct) => setProgress(pct));
      setStatus('analysing');

      const res = await fetch('/api/analyse-general', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUri:  uploaded.fileUri,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          userNote: userNote.trim(),
          token:    token ?? '',
        }),
      });

      const data = await res.json() as {
        analysis?:   GeneralAnalysis;
        free_trial?: boolean;
        error?:      string;
        message?:    string;
      };

      if (!res.ok) {
        setErrorMsg(
          data.error === 'free_trial_used'
            ? (data.message ?? 'Free trial used. Upgrade to Pro for unlimited analysis.')
            : (data.error ?? 'Analysis failed. Please try again.')
        );
        setStatus('error');
        return;
      }

      setAnalysis(data.analysis ?? null);
      setFreeTrial(data.free_trial ?? false);
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Check your connection.');
      setStatus('error');
    }
  }, [file, userNote, token]);

  const reset = () => {
    setFile(null);
    setUserNote('');
    setStatus('idle');
    setProgress(0);
    setAnalysis(null);
    setErrorMsg('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f2ee' }}>
      {/* Sticky nav */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900">General Football Analysis</h1>
            <p className="text-xs text-gray-500">AI analyses any football footage</p>
          </div>
          <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
            AI
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* ── Upload / Error state ── */}
        {(status === 'idle' || status === 'error') && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Upload Football Footage</h2>
              <p className="text-sm text-gray-500">
                Any football activity — full match, training drill, street kickabout, solo practice.
                No rigid format required.
              </p>
            </div>

            {/* File picker drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors"
              style={{
                borderColor:     file ? '#1a5c2a' : '#d1d5db',
                backgroundColor: file ? '#f0fdf4' : 'transparent',
              }}
            >
              <Film className="w-8 h-8" style={{ color: file ? '#1a5c2a' : '#9ca3af' }} />
              {file ? (
                <>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700">Tap to select video</p>
                  <p className="text-xs text-gray-400">MP4, MOV, WebM — any length</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Optional note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What do you want analysed?{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value.slice(0, 200))}
                placeholder={`e.g. "Focus on the striker's movement off the ball" or "Check our defensive shape"`}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#1a5c2a' } as React.CSSProperties}
                rows={2}
              />
              <p className="text-xs text-gray-400 text-right mt-1">{userNote.length}/200</p>
            </div>

            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <button
              onClick={handleAnalyse}
              disabled={!file}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-40"
              style={{ backgroundColor: '#1a5c2a' }}
            >
              Analyse with AI
            </button>
          </div>
        )}

        {/* ── Uploading ── */}
        {status === 'uploading' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-green-700" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Uploading video…</p>
                <p className="text-xs text-gray-500">Securely uploading to Gemini — {progress}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, backgroundColor: '#1a5c2a' }}
              />
            </div>
          </div>
        )}

        {/* ── Analysing ── */}
        {status === 'analysing' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-green-700 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Analysing your footage…</p>
              <p className="text-xs text-gray-500">Gemini is watching the full video — usually 15–60 seconds</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {status === 'done' && analysis && (
          <>
            {freeTrial && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Star className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Free trial used.{' '}
                  <Link href="/player/subscription" className="font-semibold underline">
                    Upgrade to Pro
                  </Link>{' '}
                  for unlimited analysis.
                </p>
              </div>
            )}

            {/* Video type + score */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 text-white"
                    style={{ backgroundColor: '#1a5c2a' }}
                  >
                    {VIDEO_TYPE_LABELS[analysis.video_type] ?? analysis.video_type}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.context_summary}</p>
                  <p className="text-xs text-gray-400 mt-2 italic">{analysis.score_rationale}</p>
                </div>
                <ScoreCircle score={analysis.overall_score} />
              </div>
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                <span>
                  <span className="font-semibold text-gray-900">{analysis.participants.estimated_count}</span>{' '}
                  <span className="text-gray-500">player{analysis.participants.estimated_count !== 1 ? 's' : ''} visible</span>
                </span>
                <span className="text-gray-300 hidden sm:inline">·</span>
                <span className="text-gray-700 capitalize">
                  {analysis.participants.age_group.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-300 hidden sm:inline">·</span>
                <span className="text-gray-700 capitalize">{analysis.participants.level}</span>
              </div>
            </div>

            {/* Key observations */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Key Observations
              </h3>
              <ul className="space-y-2">
                {analysis.key_observations.map((obs, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                      {i + 1}
                    </span>
                    {obs}
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths + Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-amber-700">
                  <TrendingUp className="w-4 h-4" />
                  Improvements
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Standout moment */}
            {analysis.standout_moment && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  Standout Moment
                </h3>
                <p className="text-sm text-gray-700">{analysis.standout_moment}</p>
              </div>
            )}

            {/* Tactical note */}
            {analysis.tactical_note && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-500" />
                  Tactical Pattern
                </h3>
                <p className="text-sm text-gray-700">{analysis.tactical_note}</p>
              </div>
            )}

            {/* Coaching priority + drill */}
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#1a5c2a' }}>
              <h3 className="font-semibold text-white text-sm mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-300" />
                Coaching Priority
              </h3>
              <p className="text-sm text-white/90 mb-4">{analysis.coaching_priority}</p>
              <div className="border-t border-white/20 pt-3">
                <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Recommended Drill</p>
                <p className="text-sm text-white/90">{analysis.drill_recommendation}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pb-6">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl font-semibold text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Analyse Another
              </button>
              <button
                disabled
                title="PDF download coming in Stage 2"
                className="flex-1 py-3 rounded-xl font-semibold text-sm border border-gray-200 bg-white text-gray-300 flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
