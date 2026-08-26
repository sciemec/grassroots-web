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
  Loader2, Info, History, ChevronDown, ChevronRight, Download, Upload,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useSubscription } from '@/lib/use-subscription';
import { postToArena } from '@/lib/arena-poster';
import { uploadVideoInChunksParallel, getUploadAdvisory, type UploadAdvisory } from '@/lib/upload-chunks';
import { getUploadStrategy, type UploadStrategyResult } from '@/lib/use-upload-strategy';
import { enqueueUpload, flushQueue } from '@/lib/upload-queue';
import { UploadGate } from '@/components/upload/UploadGate';
import {
  getDrillsForSport, getDrillById, drillStorageKey, allDrillResultsKey,
  type GeminiDrill, type DrillResult,
} from '@/config/gemini-drills';
import { downloadDrillResultPdf } from '@/lib/generate-analysis-pdf';

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

// ─── MediaPipe drill recs — 2 targeted drills per mechanic key ───────────────
const MEDIAPIPE_DRILL_RECS: Record<string, string[]> = {
  strike_elevation:     ['Wall shooting: tie a rope at 1 m between two poles. Place 5 balls and shoot low under the rope. 3 sets of 5.', 'One-two combination: partner pass → first-time low drive into bottom corners. 10 reps each foot.'],
  approach_balance:     ['3-step walk-up: approach a cone on exactly 3 steps, hold your finish position for 2 seconds. 10 reps.', 'Curved-cone approach: set 4 cones in an arc, dribble through and strike on the last step. 15 reps.'],
  bend_accuracy:        ['Inside-of-foot curve: shoot from 20 m at an angle, curling towards the far post. 10 reps per foot.', 'Wide target practice: place a cone 1 m outside the post at 25 m — bend the ball around it into goal. 12 reps.'],
  wall_clearance:       ['Rope clearance: tie a rope at 1.5 m, 5 m away from you — practise clearing it into the goal. 10 reps.', 'Partner-loft drill: a partner stands with arms up 18 m away — loft the ball over them into goal. 10 reps.'],
  leg_swing:            ['Pendulum swings: stand on one leg, swing your kicking leg back and through in a slow controlled arc. 3 × 20 reps.', 'Resistance-band kick: loop a band at ankle height and drive your leg through against resistance. 3 × 15 reps.'],
  hip_rotation:         ['Hip-rotation mirror: stand sideways to a mirror, rotate hips slowly to mimic kick follow-through. 20 slow reps.', 'Seated hip turns: sit on the floor with feet planted, rotate torso and hips left to right. 3 × 12 reps.'],
  follow_through:       ['Hold your finish: after each kick freeze in the follow-through position for 2 secs before resetting. 15 kicks.', 'Slow-motion striking: kick at 30% power focusing only on a full, complete swing. 3 × 12 reps.'],
  plant_foot:           ['Footprint drill: mark a footprint on the ground, practise placing your plant foot on it perfectly every time. 20 kicks.', 'Cone-plant habit: plant your foot 10 cm to the side of a cone, 100 kicks to build the muscle memory.'],
  jump_timing:          ['Toss and head: partner throws ball at varying heights — time your jump to meet it at the peak. 20 reps.', 'Standing header sequence: toss → jump → head → land on both feet. Focus only on timing. 15 reps.'],
  neck_set:             ['Neck isometric hold: tuck chin for 3 secs then lift head back for 3 secs, alternate. 15 reps.', 'Soft-toss contact: partner tosses from 1 m — meet ball on forehead while keeping neck locked. 20 reps.'],
  contact_point:        ['Dot heading: mark a spot on the ball with tape, head only that dot. 20 toss-and-head reps.', 'Mirror heading: stand near a wall, mark your forehead with chalk — see exactly where the ball hits. 10 reps.'],
  direction_control:    ['Direction header: place two targets on the floor, head the ball to alternate targets on a partner\'s call. 20 reps.', 'Arrow header: partner calls "left" or "right" before the toss — redirect the header that way. 15 reps.'],
  tackle_timing:        ['Shadow and wait: follow a dribbler for 10 m without committing — only lunge when the ball rolls away from their feet. 5 × 1-min.', 'Gate tackle: partner dribbles through cones; tackle them the moment they cross the final gate. 15 reps.'],
  body_shape:           ['Low-centre walk: crouch in tackle stance, walk sideways 10 m maintaining bent knees and wide base. 5 sets.', 'Mirror shadowing: face a partner in tackle stance, mirror their lateral movements for 30 secs. 5 reps.'],
  weight_transfer:      ['Step-and-pass: take a full stride into each pass — feel your full body weight push through to the front foot. 20 passes.', 'Slow-motion pass: play at 30% power, focusing entirely on driving weight through the ball. 3 × 15 reps.'],
  pivot_efficiency:     ['Square pivot drill: 4 cones in a square — cut sharply around each one. 3 × 1-min.', 'L-turn habit: dribble to a cone, execute a tight L-cut, explode away. 20 reps per foot.'],
  side_step:            ['Ladder laterals: quick side-steps through an agility ladder without crossing your feet. 5 × 1-min.', 'Cone-gate laterals: dribble sideways through gates set 1 m apart. 10 sets.'],
  cross_accuracy:       ['Hoop crossing: hang a hoop in the box, swing crosses through it from both flanks. 20 reps.', 'Moving run cross: jog along the touchline and strike a cross with one touch into the far-post zone. 15 reps.'],
  delivery_shape:       ['Hip-open approach: slow approach to the ball, check hip angle before contact. 10 isolated reps.', 'Byline cross: from the byline, open your body and float a cross onto a target\'s head. 15 reps.'],
  touch_height:         ['Bounce control: toss the ball above head height, control with chest or thigh, bring to foot in 2 touches. 20 reps.', 'Drop-and-cushion: drop ball from hip height, first touch to kill the bounce before it rises. 20 reps.'],
  foot_position:        ['Angled-foot trap: set foot at 45° before the ball arrives — cushion, do not stab. 20 partner-pass reps.', 'Sole-roll reception: receive a rolling ball under the sole and drag it behind your standing leg. 15 reps.'],
  juggling_consistency: ['Start-from-hands: toss ball to foot, juggle 5 touches, catch. Add 1 extra touch each day.', 'Alternating juggle: juggle both feet strictly alternating every touch. 3 × 30 secs.'],
  knee_height:          ['Thigh juggling only: juggle using only your thighs, keeping the ball at chest height. 3 × 30 secs.', 'High-knee jog juggle: jog with high knees and juggle 2 touches per stride. 4 × 20 m.'],
  feet_alternation:     ['Strict-alternate rule: juggle with a hard rule — every touch must swap feet. No two in a row on the same foot. 3 × 30 secs.', 'Weak-foot only: juggle 50 consecutive touches with your weak foot daily.'],
  wrist_snap:           ['Wrist warm-up: circular wrist rotations × 20, then flick a towel for snap speed. 3 sets.', 'Legal throw-in reps: both feet on the ground — focus only on the wrist snap at release. 20 reps.'],
  trunk_rotation:       ['Standing twist: hold ball at chest, rotate torso fully left then right. 3 × 15 reps.', 'Rotational throw: stand at 90° to a partner, rotate and throw the ball explosively from the hips. 3 × 12.'],
  arm_swing:            ['Shadow-kick walk: slowly walk through the kicking motion focusing only on the opposite arm swinging for balance. 20 reps.', 'Weighted arm swing: hold 0.5 kg weights, swing arms in kicking rhythm. 3 × 15 reps.'],
  stance_width:         ['Wide-stance squats: squat with feet shoulder-width apart, hold the bottom position for 2 secs. 3 × 12.', 'Balance board stance: hold drill-ready position on a balance board for 30 secs. 5 reps.'],
};

function scoreLabel(score: number): string {
  if (score >= 8) return 'Excellent';
  if (score >= 6) return 'Good';
  if (score >= 4) return 'Needs work';
  return 'Critical';
}

function scoreLabelColor(score: number): string {
  if (score >= 8) return '#16a34a';
  if (score >= 6) return '#ca8a04';
  if (score >= 4) return '#ea580c';
  return '#dc2626';
}

function scoreLabelBg(score: number): string {
  if (score >= 8) return '#f0fdf4';
  if (score >= 6) return '#fefce8';
  if (score >= 4) return '#fff7ed';
  return '#fef2f2';
}

function MediaPipeResultDisplay({ result, drill }: { result: DrillResult; drill: GeminiDrill }) {
  const dimMap  = Object.fromEntries(drill.dimensions.map(d => [d.key, d]));
  const entries = Object.entries(result.scores ?? {});

  // Two weakest mechanics drive the drill recommendations
  const weakestKeys = [...entries]
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, 2)
    .map(([k]) => k);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Overall score hero */}
      <div style={{ background: '#1d4ed8', borderRadius: 12, padding: '18px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Overall Score
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{result.overall_score}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>out of 10</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
          MediaPipe pose analysis · 33 body landmarks tracked
        </div>
      </div>

      {/* Per-mechanic cards */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #e5e5e5' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
          Technique Breakdown
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {entries.map(([key, s]) => {
            const label       = dimMap[key]?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const isMeasured  = s.measurable !== false;
            const pct         = s.score * 10;
            const barColor    = pct >= 80 ? '#16a34a' : pct >= 60 ? '#ca8a04' : pct >= 40 ? '#ea580c' : '#dc2626';

            return (
              <div key={key}>
                {/* Label + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111', flex: 1 }}>{label}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                    background: isMeasured ? '#dbeafe' : '#f3f4f6',
                    color:      isMeasured ? '#1d4ed8' : '#6b7280',
                  }}>
                    {isMeasured ? 'AI Measured' : 'Rate Manually'}
                  </span>
                </div>

                {/* Bar + score + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: barColor, minWidth: 34, textAlign: 'right' }}>
                    {s.score}/10
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, minWidth: 72, textAlign: 'center',
                    background: scoreLabelBg(s.score), color: scoreLabelColor(s.score),
                  }}>
                    {scoreLabel(s.score)}
                  </span>
                </div>

                {/* Detail observation */}
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, background: '#fafafa', borderRadius: 8, padding: '8px 10px' }}>
                  {s.observation}
                </div>

                {/* Manual-rate tip */}
                {!isMeasured && (
                  <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 5 }}>
                    Ball-tracking is needed to measure this precisely. Review your video and rate how well you executed it.
                  </div>
                )}
              </div>
            );
          })}
        </div>
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

      {/* Drill recommendations for weakest mechanics */}
      {weakestKeys.some(k => MEDIAPIPE_DRILL_RECS[k]) && (
        <div style={{ background: '#eff6ff', borderRadius: 12, padding: '14px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
            Drills to improve your weakest areas
          </div>
          {weakestKeys.map(key => {
            const recs  = MEDIAPIPE_DRILL_RECS[key];
            if (!recs) return null;
            const label = dimMap[key]?.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 8 }}>
                  To improve {label}:
                </div>
                {recs.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{
                      flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                      background: '#1d4ed8', color: '#fff', fontSize: 10, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: 12, color: '#1e3a8a', lineHeight: 1.5 }}>{rec}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Coach note */}
      {result.coach_note && (
        <div style={{ background: '#f8f7f4', borderRadius: 12, padding: '12px 14px', border: '1px solid #e5e0d8' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Coach Note
          </div>
          <div style={{ fontSize: 12, color: '#444', lineHeight: 1.6, fontStyle: 'italic' }}>{result.coach_note}</div>
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
  const [lang, setLang]             = useState<'en' | 'en-sn' | 'en-nd'>('en');
  const [analysisEngine, setAnalysisEngine] = useState<'gemini' | 'mediapipe'>('gemini');
  const [mpFile, setMpFile]         = useState<File | null>(null);
  const [passportSaved, setPassportSaved] = useState(false);
  const [arenaShared,   setArenaShared]   = useState(false);
  const mpFileRef                   = useRef<HTMLInputElement | null>(null);

  const xhrRef            = useRef<XMLHttpRequest | null>(null);
  const mediaRecorderRef  = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef         = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [recordingPhase, setRecordingPhase] = useState<'idle' | 'requesting' | 'recording' | 'preview'>('idle');
  const [countdown, setCountdown]           = useState(30);
  const [previewUrl, setPreviewUrl]         = useState<string | null>(null);
  const [clipAdvisory, setClipAdvisory]     = useState<UploadAdvisory | null>(null);
  const [gateProbing, setGateProbing]       = useState(false);
  const [gateStrategy, setGateStrategy]     = useState<UploadStrategyResult | null>(null);
  const [gatePending, setGatePending]       = useState(false);

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
    // MediaPipe results skip auto-post: the user chooses via explicit buttons
    const apiToken = useAuthStore.getState().token;
    if (apiToken && apiToken !== 'dev-token' && result.engine !== 'mediapipe') {
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
        const dummyFile = new File([blob], `clip.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`, { type: blob.type });
        setClipAdvisory(getUploadAdvisory(dummyFile));
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

  // Shared: run Gemini analysis after any upload (direct or queued)
  const runDrillAnalysis = useCallback(async (uploadData: { fileUri?: string; fileName?: string }) => {
    if (!selected) return;
    const { fileUri, fileName } = uploadData;
    if (!fileUri) throw new Error('Upload server did not return a file URI');
    setUpload(prev => ({ ...prev, phase: 'processing', progress: 100 }));
    const analyseRes = await fetch('/api/gemini-drill-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileUri, fileName, drillId: selected.id }),
    });
    if (!analyseRes.ok) {
      const err = await analyseRes.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error((err as { error?: string }).error ?? 'Gemini analysis failed');
    }
    const result = await analyseRes.json() as DrillResult;
    saveDrillResult(result);
    setUpload({ phase: 'done', progress: 100, result, error: null });
  }, [selected, saveDrillResult]);

  // Camera recording → direct upload (live connection path)
  const handleUploadRecording = useCallback(async () => {
    if (!selected || recordedChunksRef.current.length === 0) return;
    const mimeType = recordedChunksRef.current[0]?.type ?? 'video/webm';
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });

    if (clipAdvisory?.limitError) {
      setUpload({ phase: 'error', progress: 0, result: null, error: clipAdvisory.limitError });
      return;
    }

    setRecordingPhase('idle');
    setPreviewUrl(null);
    setUpload({ phase: 'uploading', progress: 0, result: null, error: null });

    try {
      const videoFile = new File([blob], `drill-${Date.now()}.webm`, { type: blob.type || 'video/webm' });
      const uploadData = await uploadVideoInChunksParallel(
        videoFile,
        (pct) => setUpload(prev => ({ ...prev, progress: pct })),
      );
      await runDrillAnalysis(uploadData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setUpload({ phase: 'error', progress: 0, result: null, error: message });
    }
  }, [selected, clipAdvisory, runDrillAnalysis]);

  // Gate check: called when user taps "Send to Gemini"
  const handleGateSendToGemini = useCallback(async () => {
    if (!selected || recordedChunksRef.current.length === 0) return;
    if (clipAdvisory?.limitError) {
      setUpload({ phase: 'error', progress: 0, result: null, error: clipAdvisory.limitError });
      return;
    }
    setGateProbing(true);
    setGatePending(true);
    try {
      const strategy = await getUploadStrategy();
      setGateProbing(false);
      setGateStrategy(strategy);
      if (strategy.mode === 'live') {
        setGatePending(false);
        setGateStrategy(null);
        void handleUploadRecording();
      }
      // else: gate UI (UploadGate) shows, user chooses force/queue
    } catch {
      setGateProbing(false);
      setGatePending(false);
      void handleUploadRecording(); // probe failed — attempt upload anyway
    }
  }, [selected, clipAdvisory, handleUploadRecording]);

  const handleMediaPipeUpload = useCallback(async () => {
    if (!selected || !mpFile || !selected.mediapipe_drill_type) return;
    setUpload({ phase: 'uploading', progress: 0, result: null, error: null });

    try {
      const formData = new FormData();
      formData.append('file', mpFile);

      setUpload(prev => ({ ...prev, phase: 'processing', progress: 100 }));
      const res = await fetch(
        `/api/fitness-test?test_type=${encodeURIComponent(selected.mediapipe_drill_type!)}&age_group=senior`,
        { method: 'POST', body: formData },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error((err as { detail?: string }).detail ?? 'MediaPipe analysis failed');
      }

      const data = await res.json() as { mechanics?: Record<string, { score: number; measurable: boolean; detail: string }>; summary?: string };
      const mechanics = data.mechanics ?? {};

      const scores: Record<string, { score: number; observation: string; measurable?: boolean }> = {};
      let total = 0;
      let count = 0;
      let bestKey = '';
      let bestVal = -1;
      let worstKey = '';
      let worstVal = 101;

      for (const [key, m] of Object.entries(mechanics)) {
        const normalized = Math.round((m.score / 10) * 10) / 10; // 0-100 → 0-10 (1 dp)
        scores[key] = { score: normalized, observation: m.detail, measurable: m.measurable };
        total += normalized;
        count++;
        if (m.score > bestVal)  { bestVal = m.score;  bestKey = key; }
        if (m.score < worstVal) { worstVal = m.score; worstKey = key; }
      }

      const overall_score = count > 0 ? Math.round((total / count) * 10) / 10 : 0;

      const dimMap = Object.fromEntries(selected.dimensions.map(d => [d.key, d]));
      const bestLabel  = dimMap[bestKey]?.label  ?? bestKey.replace(/_/g, ' ');
      const worstLabel = dimMap[worstKey]?.label ?? worstKey.replace(/_/g, ' ');

      const result: DrillResult = {
        drillId:         selected.id,
        drillName:       selected.name,
        sport:           selected.sport,
        overall_score,
        scores,
        top_strength:    data.summary ?? (bestKey  ? `Strong ${bestLabel} technique detected by pose analysis.` : 'Good technique shown.'),
        key_improvement: worstKey ? `Focus on improving ${worstLabel} — this was your lowest-scoring mechanic.` : 'Keep practising all mechanics consistently.',
        analysedAt:      new Date().toISOString(),
        engine:          'mediapipe',
      };

      saveDrillResult(result);
      setUpload({ phase: 'done', progress: 100, result, error: null });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setUpload({ phase: 'error', progress: 0, result: null, error: message });
    }
  }, [selected, mpFile, saveDrillResult]);

  const resetUpload = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setRecordingPhase('idle');
    setPreviewUrl(null);
    setCountdown(30);
    setClipAdvisory(null);
    setGateProbing(false);
    setGateStrategy(null);
    setGatePending(false);
    setMpFile(null);
    setAnalysisEngine('gemini');
    setPassportSaved(false);
    setArenaShared(false);
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

              {/* Language selector */}
              {selected.protocol && selected.protocol.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Instructions language / Mutauro / Ulimi
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {([
                      { id: 'en',    label: 'English only' },
                      { id: 'en-sn', label: 'English + ChiShona' },
                      { id: 'en-nd', label: 'English + isiNdebele' },
                    ] as const).map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setLang(opt.id)}
                        style={{
                          flex: 1, borderRadius: 8, border: '1.5px solid',
                          padding: '6px 4px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          background: lang === opt.id ? GRS_GREEN : '#fff',
                          color: lang === opt.id ? '#fff' : '#555',
                          borderColor: lang === opt.id ? GRS_GREEN : '#e5e5e5',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ASCII Diagram */}
              {selected.diagram && (
                <div style={{ background: '#f8faff', border: '1px solid #dbeafe', borderRadius: 10, padding: '10px 12px', marginBottom: 10, overflowX: 'auto' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Drill diagram
                  </div>
                  <pre style={{ fontSize: 11, color: '#1e3a5f', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre', margin: 0 }}>
                    {selected.diagram}
                  </pre>
                </div>
              )}

              {/* Step-by-step protocol */}
              {selected.protocol && selected.protocol.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    Step-by-step instructions
                  </div>
                  {(lang === 'en-sn' ? (selected.protocolSn ?? selected.protocol) :
                    lang === 'en-nd' ? (selected.protocolNd ?? selected.protocol) :
                    selected.protocol).map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                        background: GRS_GREEN, color: '#fff',
                        fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ fontSize: 12, color: '#333', lineHeight: 1.6, paddingTop: 2 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}

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
                    <div style={{ fontSize: 12, color: '#92400e', marginBottom: 10 }}>Subscribe to record videos and get AI coaching scores.</div>
                    <Link href="/player/subscription" style={{ display: 'inline-block', padding: '8px 18px', background: '#c8962a', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                      View plans →
                    </Link>
                  </div>
                )}

                {/* Hidden file input for MediaPipe upload */}
                <input
                  ref={mpFileRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={e => { setMpFile(e.target.files?.[0] ?? null); e.target.value = ''; }}
                />

                {selected.mediapipe_drill_type ? (
                  <>
                    <div style={{ background: '#eff6ff', borderRadius: 12, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>MediaPipe Pose Analysis</div>
                      <div style={{ fontSize: 11, color: '#1e40af', lineHeight: 1.6 }}>
                        Upload a video of you performing this drill. MediaPipe tracks 33 body landmarks per frame to score your technique mechanics with precision.
                      </div>
                    </div>
                    {mpFile ? (
                      <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #e5e5e5' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 4 }}>{mpFile.name}</div>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>{(mpFile.size / (1024 * 1024)).toFixed(1)} MB</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            onClick={() => setMpFile(null)}
                            style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, border: '1px solid #d1d5db', cursor: 'pointer' }}
                          >
                            Change
                          </button>
                          <button
                            onClick={handleMediaPipeUpload}
                            disabled={!isPro}
                            style={{ flex: 2, padding: '10px', borderRadius: 10, background: isPro ? '#1d4ed8' : '#9ca3af', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: isPro ? 'pointer' : 'not-allowed' }}
                          >
                            Analyse with MediaPipe
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { if (isPro) mpFileRef.current?.click(); }}
                        disabled={!isPro}
                        style={{
                          width: '100%', padding: '18px', borderRadius: 14,
                          background: isPro ? '#1d4ed8' : '#9ca3af', color: '#fff', fontWeight: 700, fontSize: 15,
                          border: 'none', cursor: isPro ? 'pointer' : 'not-allowed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                          opacity: isPro ? 1 : 0.6,
                        }}
                      >
                        <Upload size={18} />
                        {isPro ? 'Upload video for MediaPipe analysis' : '🔒 Unlock to analyse videos'}
                      </button>
                    )}
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#aaa' }}>
                      Tracks 33 body landmarks · precision pose scoring
                    </div>
                  </>
                ) : (
                  <>
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
                {clipAdvisory && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{clipAdvisory.sizeMB.toFixed(1)} MB</span>
                    <span>Est. {clipAdvisory.estimatedTime}</span>
                  </div>
                )}
                {clipAdvisory?.sizeWarning && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                    ⚠️ {clipAdvisory.sizeWarning}
                  </div>
                )}
                {gatePending && (gateProbing || gateStrategy) ? (
                  <UploadGate
                    strategy={gateStrategy}
                    probing={gateProbing}
                    onForceUpload={() => {
                      setGatePending(false);
                      setGateStrategy(null);
                      flushQueue();
                      void handleUploadRecording();
                    }}
                    onQueue={() => {
                      const mt = recordedChunksRef.current[0]?.type ?? 'video/webm';
                      const bl = new Blob(recordedChunksRef.current, { type: mt });
                      const vf = new File([bl], `drill-${Date.now()}.webm`, { type: bl.type || 'video/webm' });
                      setGatePending(false);
                      setGateStrategy(null);
                      setRecordingPhase('idle');
                      setPreviewUrl(null);
                      setUpload({ phase: 'uploading', progress: 0, result: null, error: null });
                      enqueueUpload(vf, (pct) => setUpload(prev => ({ ...prev, progress: pct })))
                        .then(runDrillAnalysis)
                        .catch((err: unknown) => {
                          setUpload({ phase: 'error', progress: 0, result: null, error: err instanceof Error ? err.message : 'Unknown error' });
                        });
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => { setRecordingPhase('idle'); setPreviewUrl(null); setClipAdvisory(null); recordedChunksRef.current = []; }}
                      style={{ flex: 1, padding: '12px', borderRadius: 10, background: '#fff', color: '#555', fontWeight: 600, fontSize: 13, border: '1px solid #d1d5db', cursor: 'pointer' }}
                    >
                      Retake
                    </button>
                    <button
                      onClick={handleGateSendToGemini}
                      style={{ flex: 2, padding: '12px', borderRadius: 10, background: GRS_GREEN, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Video size={16} />
                      Send to Gemini
                    </button>
                  </div>
                )}
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
                <Loader2 size={36} color={analysisEngine === 'mediapipe' ? '#1d4ed8' : GRS_GREEN} className="animate-spin" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                {analysisEngine === 'mediapipe' ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>MediaPipe is analysing your technique…</div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                      33 body landmarks are being tracked across every frame — scoring your mechanics with precision.
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 12 }}>This takes 15–60 seconds</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>Gemini is watching your video…</div>
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                      Gemini 2.0 Flash processes every second of your clip — reading body shape, foot surface, acceleration, and technique across the full video.
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 12 }}>This takes 30–90 seconds</div>
                  </>
                )}
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {upload.phase === 'done' && upload.result && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>
                  <CheckCircle2 size={16} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {upload.result.engine === 'mediapipe'
                      ? 'Pose analysis complete'
                      : 'Analysis complete — results saved to your profile'}
                  </span>
                </div>

                {upload.result.engine === 'mediapipe'
                  ? <MediaPipeResultDisplay result={upload.result} drill={selected} />
                  : <ResultDisplay result={upload.result} drill={selected} />
                }

                {/* MediaPipe: explicit Save / Share choice */}
                {upload.result.engine === 'mediapipe' && (
                  <div style={{ background: '#fff', borderRadius: 14, padding: '16px', border: '1px solid #e5e5e5' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 12 }}>
                      What would you like to do with these results?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Save to Passport */}
                      <button
                        onClick={() => {
                          if (passportSaved || !upload.result) return;
                          const apiToken = useAuthStore.getState().token;
                          if (apiToken && apiToken !== 'dev-token') {
                            fetch(`${process.env.NEXT_PUBLIC_API_URL}/drills/${upload.result.drillId}/analyze`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiToken}` },
                              body: JSON.stringify({
                                overall_score:   upload.result.overall_score,
                                top_strength:    upload.result.top_strength,
                                key_improvement: upload.result.key_improvement,
                                sport:           upload.result.sport,
                              }),
                            }).catch(() => {});
                          }
                          setPassportSaved(true);
                        }}
                        style={{
                          width: '100%', padding: '13px', borderRadius: 12,
                          background: passportSaved ? '#f0fdf4' : GRS_GREEN,
                          color: passportSaved ? '#16a34a' : '#fff',
                          fontWeight: 700, fontSize: 14, border: passportSaved ? '1px solid #bbf7d0' : 'none',
                          cursor: passportSaved ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        {passportSaved ? <><CheckCircle2 size={16} /> Saved to Passport</> : '⚽ Save to Passport'}
                      </button>

                      {/* Share to Arena */}
                      <button
                        onClick={() => {
                          if (arenaShared || !upload.result) return;
                          postToArena(
                            `Scored ${upload.result.overall_score}/10 on "${upload.result.drillName}" — MediaPipe pose analysis`,
                            {
                              postType:     'milestone',
                              activityType: 'mediapipe_drill',
                              activityData: {
                                drillId:      upload.result.drillId,
                                drillName:    upload.result.drillName,
                                score:        upload.result.overall_score,
                                sport:        upload.result.sport,
                                top_strength: upload.result.top_strength,
                              },
                            }
                          );
                          setArenaShared(true);
                        }}
                        style={{
                          width: '100%', padding: '13px', borderRadius: 12,
                          background: arenaShared ? '#f5f3ff' : '#7c3aed',
                          color: arenaShared ? '#7c3aed' : '#fff',
                          fontWeight: 700, fontSize: 14, border: arenaShared ? '1px solid #ddd6fe' : 'none',
                          cursor: arenaShared ? 'default' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        {arenaShared ? <><CheckCircle2 size={16} /> Shared to Arena</> : '🏟️ Share to Arena'}
                      </button>
                    </div>
                  </div>
                )}

                {/* PDF download — always available */}
                <button
                  onClick={() => downloadDrillResultPdf(upload.result!, selected)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12,
                    background: '#fff', color: '#374151', fontWeight: 700, fontSize: 13,
                    border: '1px solid #d1d5db', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Download size={15} />
                  Download PDF Report
                </button>

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
