'use client';
// src/components/tactical-iq/WhatWouldYouDo.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The quiz component — frozen tactical moment, 3 options, no result shown
// until the player commits to an answer. This is the feature that makes
// Tactical IQ unmistakably a learning tool and not a media product.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import type { QuizMoment } from '@/lib/tactical-iq/quiz-generator';
import { explainQuizAnswer } from '@/lib/tactical-iq/quiz-generator';

const GRS_GREEN = '#1c3d22';
const GRS_GOLD  = '#c8962a';

interface Props {
  moment:    QuizMoment;
  gender:    'male' | 'female';
  onAnswered: (wasOptimal: boolean) => void;
}

export default function WhatWouldYouDo({ moment, gender, onAnswered }: Props) {
  const [selected,    setSelected]    = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  const handleSelect = async (optionId: string) => {
    if (selected) return; // lock after first answer
    setSelected(optionId);
    setLoading(true);

    const chosen = moment.options.find(o => o.id === optionId);
    onAnswered(chosen?.isOptimal ?? false);

    const text = await explainQuizAnswer(moment, optionId, gender);
    setExplanation(text);
    setLoading(false);
  };

  const coachName = gender === 'female' ? 'Amara' : 'THUTO';

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e5', padding: 20 }}>

      {/* Frozen moment setup */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GRS_GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          What would you do?
        </div>
        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>
          {moment.setupText}
        </div>
      </div>

      {/* Three options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: selected ? 16 : 0 }}>
        {moment.options.map(option => {
          const isChosen   = selected === option.id;
          const showResult = !!selected;
          const isCorrect  = option.isOptimal;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={!!selected}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: 10,
                border: showResult && isCorrect
                  ? `1.5px solid ${GRS_GREEN}`
                  : showResult && isChosen
                  ? '1.5px solid #d97373'
                  : '1px solid #e0e0e0',
                background: showResult && isCorrect
                  ? '#eaf3de'
                  : showResult && isChosen
                  ? '#fdf0f0'
                  : '#fff',
                cursor: selected ? 'default' : 'pointer',
                fontSize: 13,
                color: '#333',
                transition: 'all 0.15s',
              }}
            >
              {option.label}
              {showResult && isCorrect && (
                <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: GRS_GREEN }}>
                  ✓ Strongest choice
                </span>
              )}
              {showResult && isChosen && !isCorrect && (
                <span style={{ marginLeft: 8, fontSize: 11, color: '#a85a5a' }}>
                  Your choice
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* THUTO/Amara explanation — appears after answering */}
      {selected && (
        <div style={{ borderTop: '0.5px solid #f0f0f0', paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: GRS_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: GRS_GOLD, fontSize: 11, flexShrink: 0 }}>
              {gender === 'female' ? 'A' : 'T'}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: GRS_GREEN }}>{coachName} explains</div>
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: '#aaa', fontStyle: 'italic' }}>Thinking it through...</div>
          ) : (
            <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>{explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}