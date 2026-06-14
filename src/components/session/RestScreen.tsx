'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TestId } from '@/lib/session-manager';

const REST_SECONDS = 60;

const TEST_LABELS: Record<string, string> = {
  t1_jump:      'Standing Jump',
  t2_sprint:    '20m Sprint',
  t3_balance:   'Balance',
  t4_reaction:  'Reaction',
  t5_endurance: 'Chitima Run',
  t6_ball:      'Ball Control',
};

const NEXT_TIPS: Record<string, { equipment: string; tip: string; coaching: string }> = {
  t2_sprint: {
    equipment: 'Two cones, 20 metres apart',
    tip:       'Mark the sprint lane clearly. Player starts behind the line.',
    coaching:  'Drive your knees high and pump your arms. Sprint through the finish — do not slow down early.',
  },
  t3_balance: {
    equipment: 'Flat ground, no equipment needed',
    tip:       'Find a smooth, flat surface. Remove shoes if necessary.',
    coaching:  'Soft knees, eyes fixed on one point. Breathe slowly and stay tall.',
  },
  t4_reaction: {
    equipment: 'A ball or small object to catch',
    tip:       'Stand 2 metres apart. Tester drops the ball from shoulder height.',
    coaching:  'Stay loose, watch the hands — not the ball. React before you think.',
  },
  t5_endurance: {
    equipment: 'Two cones, 20 metres apart',
    tip:       'Player shuttles between cones. Count each 20m length.',
    coaching:  'Start at a pace you can hold. Find your rhythm in the first 2 minutes.',
  },
  t6_ball: {
    equipment: 'One football',
    tip:       'Player juggles on the spot. Count the longest unbroken sequence.',
    coaching:  'Relax your ankle. Small touches are better than big kicks. Watch the ball all the way.',
  },
};

interface RestScreenProps {
  completedTestId:  string;
  completedValue:   string;
  nextTestId:       TestId | string;
  playerPosition:   string;
  playerGender:     'male' | 'female';
  onStartNextTest:  () => void;
}

export default function RestScreen({
  completedTestId,
  completedValue,
  nextTestId,
  onStartNextTest,
}: RestScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(REST_SECONDS);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(id); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleStart = useCallback(() => {
    if (secondsLeft > 0) return;
    setStarted(true);
    onStartNextTest();
  }, [secondsLeft, onStartNextTest]);

  const completedLabel = TEST_LABELS[completedTestId] ?? completedTestId;
  const nextLabel      = TEST_LABELS[nextTestId]      ?? nextTestId;
  const tips           = NEXT_TIPS[nextTestId];

  const pct         = ((REST_SECONDS - secondsLeft) / REST_SECONDS) * 100;
  const radius      = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset  = circumference - (pct / 100) * circumference;

  const timerColour = secondsLeft === 0 ? '#16a34a' : secondsLeft <= 15 ? '#f0b429' : '#1a5c2a';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-6"
      style={{ backgroundColor: '#f4f2ee' }}
    >
      {/* Completed badge */}
      <div
        className="w-full max-w-sm rounded-2xl px-5 py-4 text-center"
        style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
      >
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
          Just Completed
        </p>
        <p className="text-sm font-black text-gray-900">{completedLabel}</p>
        <p className="text-lg font-black mt-1" style={{ color: '#16a34a' }}>{completedValue}</p>
      </div>

      {/* Countdown ring */}
      <div className="relative flex items-center justify-center">
        <svg width={128} height={128}>
          <circle cx={64} cy={64} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={8} />
          <circle
            cx={64} cy={64} r={radius}
            fill="none"
            stroke={timerColour}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black leading-none" style={{ color: timerColour }}>
            {secondsLeft}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
            {secondsLeft === 0 ? 'Ready' : 'sec rest'}
          </span>
        </div>
      </div>

      {/* Next test info */}
      {tips && (
        <div className="w-full max-w-sm space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Next Up — {nextLabel}
            </p>
            <p className="text-xs font-semibold text-gray-700 mb-1">
              <span className="font-black text-gray-900">Equipment: </span>{tips.equipment}
            </p>
            <p className="text-xs text-gray-500">{tips.tip}</p>
          </div>
          <div
            className="rounded-2xl px-5 py-4"
            style={{ backgroundColor: '#1a5c2a', border: '1px solid rgba(240,180,41,0.2)' }}
          >
            <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(240,180,41,0.7)' }}>
              THUTO Coaching Tip
            </p>
            <p className="text-xs font-semibold leading-snug" style={{ color: '#f0fdf4' }}>
              {tips.coaching}
            </p>
          </div>
        </div>
      )}

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={secondsLeft > 0 || started}
        className="w-full max-w-sm rounded-2xl py-4 font-black text-sm uppercase tracking-widest transition-all"
        style={{
          backgroundColor: secondsLeft === 0 && !started ? '#1a5c2a' : '#d1d5db',
          color: secondsLeft === 0 && !started ? '#f0b429' : '#6b7280',
          cursor: secondsLeft === 0 && !started ? 'pointer' : 'not-allowed',
        }}
      >
        {started ? 'Starting…' : `Start ${nextLabel}`}
      </button>

      {/* Skip rest */}
      {secondsLeft > 0 && (
        <button
          onClick={() => { setSecondsLeft(0); }}
          className="text-[11px] font-semibold text-gray-400 underline underline-offset-2"
        >
          Skip rest ({secondsLeft}s remaining)
        </button>
      )}
    </div>
  );
}
