'use client';
// components/age-guide/AgeGroupGuide.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Age Group Guide
// Matches the design in the uploaded screenshot exactly:
//   1. Age group cards — phase name, description, pill tags
//   2. At-a-glance matrix table
//   3. Home testing — test by test
//   4. Solo vs helper split + two-mode callout
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';

// ── Colour tokens ──────────────────────────────────────────────────────────
const BG       = '#1a1a1a';
const CARD_BG  = '#242424';
const BORDER   = '#333';
const TEXT     = '#e5e5e5';
const MUTED    = '#888';
const GREEN    = '#1c3d22';
const GREEN_LT = '#2d5c35';
const GOLD     = '#c8962a';
const GOLD_LT  = '#e8b44a';

// ── Age group data ─────────────────────────────────────────────────────────
const AGE_GROUPS = [
  {
    range:   '6 – 9',
    phase:   'Spark phase',
    sub:     'discovery',
    color:   '#c8962a',
    desc:    'At this age testing is not about scores. It is about finding out if a child enjoys movement, can follow simple instructions, and has natural ball comfort. Only T6 (ball mastery) and a simplified version of T3 (balance) are appropriate. Sprint and reaction tests at this age produce unreliable results because the nervous system is still developing. Focus is fun, not data.',
    pills: [
      { label: 'T3 simplified',          bg: '#2d2d1a', color: '#c8962a' },
      { label: 'T6 ball mastery',         bg: '#2d2d1a', color: '#c8962a' },
      { label: 'T1 T2 T4 T5 — not yet',  bg: '#2a2a2a', color: '#666'    },
    ],
  },
  {
    range:   '10 – 12',
    phase:   'Build phase',
    sub:     'first real data',
    color:   '#185fa5',
    desc:    'The nervous system is ready for speed and reaction testing from age 10. All 6 tests can now be used but some are modified — the sprint uses 15m instead of 20m, the Endurance circuit uses 2 rounds instead of 3, and the reaction test starts at 1.5m instead of 2m. Results are compared only against the 10–12 normative group, not older athletes.',
    pills: [
      { label: 'All 6 tests',               bg: '#1a2d1a', color: '#4ade80' },
      { label: 'Modified distances',         bg: '#1a2035', color: '#60a5fa' },
      { label: 'Compared vs 10–12 norms only', bg: '#1a2035', color: '#60a5fa' },
    ],
  },
  {
    range:   '13 – 15',
    phase:   'Develop phase',
    sub:     'full battery',
    color:   '#1c3d22',
    desc:    'The primary target group for GRS. All 6 tests at full specification. This is the age where genuine talent identification has the most impact — early enough to develop, old enough to produce reliable data. The full 40-minute battery is used as designed. Most of the normative data GRS will build is anchored here.',
    pills: [
      { label: 'All 6 tests — full spec',     bg: '#1a2d1a', color: '#4ade80' },
      { label: 'Full 40-minute battery',       bg: '#1a2d1a', color: '#4ade80' },
      { label: 'Primary GRS target group',     bg: '#2d1a1a', color: '#f87171' },
    ],
  },
  {
    range:   '16 – 18',
    phase:   'Perform phase',
    sub:     'intensity increases',
    color:   '#534ab7',
    desc:    'All 6 tests at full spec with higher expectations. The Endurance circuit becomes 4 rounds instead of 3. The sprint expectation drops below 3.2 seconds to be considered competitive. The ball mastery turn quality scoring becomes stricter — a 2 at age 13 looks like a 1 at age 17. Weekly testing becomes especially valuable here because the rate of improvement slows down and small gains matter more.',
    pills: [
      { label: 'All 6 tests',         bg: '#1a2d1a', color: '#4ade80' },
      { label: 'Higher thresholds',   bg: '#1a1a2d', color: '#a78bfa' },
      { label: '4 endurance rounds',    bg: '#1a1a2d', color: '#a78bfa' },
    ],
  },
  {
    range:   '18+',
    phase:   'Elite and adult phase',
    sub:     '',
    color:   '#444',
    desc:    'Full battery at maximum intensity. At this age the DQ (development rate) matters more than raw AQ — scouts at adult level want to see whether a player is still improving or has plateaued. An 18-year-old with AQ 65 improving 2% per week is a more interesting signing than an AQ 75 who has not improved in 6 months. The platform tracks this automatically.',
    pills: [
      { label: 'Full battery',                   bg: '#1a2d1a', color: '#4ade80' },
      { label: 'DQ trajectory is the key number', bg: '#2d1a1a', color: '#f87171' },
      { label: 'Scout-facing passport activated', bg: '#2d2d1a', color: '#c8962a' },
    ],
  },
];

// ── Matrix table data ──────────────────────────────────────────────────────
const MATRIX_ROWS = [
  { test: 'T1 Jump test',     vals: ['—',         'Modified', 'Full',       'Full',            'Full'           ] },
  { test: 'T2 Sprint test',     vals: ['—',         '15m',      '20m',        '20m',             '20m'            ] },
  { test: 'T3 Balance test',    vals: ['Simplified','Full',     'Full',       'Full',            'Full'           ] },
  { test: 'T4 Reaction test',vals:['—',         '1.5m',     '2m',         '2m+',             '3m'             ] },
  { test: 'T5 Endurance circuit',  vals: ['—',         '2 rounds', '3 rounds',   '4 rounds',        '4 rounds'       ] },
  { test: 'T6 Ball mastery',     vals: ['Full',      'Full',     'Full',       'Stricter scoring','Stricter scoring'] },
];

const MATRIX_COLS = ['6–9', '10–12', '13–15', '16–18', '18+'];

// ── Home testing data ──────────────────────────────────────────────────────
const HOME_TESTS = [
  {
    id:      'T1',
    name:    'Jump test',
    verdict: 'yes, easy at home',
    icon:    '✓',
    iconBg:  '#1a2d1a',
    iconCl:  '#4ade80',
    desc:    'A front step, a low wall in the yard, a concrete ledge outside the house. Most homes in Zimbabwe have something knee-height. Parent holds the phone sideways. One person can set this up in 2 minutes.',
  },
  {
    id:      'T2',
    name:    'Sprint test',
    verdict: 'yes, needs a helper',
    icon:    '~',
    iconBg:  '#2d2d1a',
    iconCl:  '#c8962a',
    desc:    'Any open space — a road, a yard, a field. The athlete cannot do this alone because someone must hold the phone to the side while they run. Needs one other person — a parent, sibling, or friend. The two markers can be literally anything: shoes, stones, bottles.',
  },
  {
    id:      'T3',
    name:    'Balance test',
    verdict: 'yes, completely solo',
    icon:    '✓',
    iconBg:  '#1a2d1a',
    iconCl:  '#4ade80',
    desc:    'Flat floor anywhere in the house. No phone camera needed — the athlete counts their own balance corrections and enters the numbers. This is the one test an athlete can do alone with just a phone timer. Perfect for daily self-monitoring at home between sessions.',
  },
  {
    id:      'T4',
    name:    'Reaction test',
    verdict: 'yes, needs a helper',
    icon:    '~',
    iconBg:  '#2d2d1a',
    iconCl:  '#c8962a',
    desc:    'Needs someone to drop the ball — a parent, sibling, or friend. Any open indoor or outdoor space works. The phone records from a tripod or propped against a wall. If the family only has one phone, it records the video and the coach reviews the taps afterwards rather than live.',
  },
  {
    id:      'T5',
    name:    'Endurance circuit',
    verdict: 'yes, but needs space',
    icon:    '~',
    iconBg:  '#2d2d1a',
    iconCl:  '#c8962a',
    desc:    'Needs about 12 metres of open space — a yard, a road with no traffic, a field. A small house with no outdoor space makes this hard. But in most rural Zimbabwean settings, open ground is available. One person can run this alone if the phone is propped at the side recording the whole space. They watch the video back and rate their own technique quality in rounds 1 and 3.',
  },
  {
    id:      'T6',
    name:    'Ball mastery',
    verdict: 'yes, completely solo',
    icon:    '✓',
    iconBg:  '#1a2d1a',
    iconCl:  '#4ade80',
    desc:    'A ball and a small open space — even indoors if the ceiling is high enough. The athlete sets the phone against a wall, presses record, and does the juggling and turns. They watch their own video, count the longest juggling sequence, and rate their own turns using the app\'s video examples as a guide. This is the best home training habit on the platform.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AgeGroupGuide() {
  const [expanded, setExpanded] = useState<string | null>('13 – 15');

  return (
    <div style={{ background: BG, color: TEXT, fontFamily: 'var(--font-sans)', minHeight: '100vh' }}>

      {/* ── SECTION 1: Age groups ──────────────────────────────────────── */}
      <Section label="Age groups — who each test is designed for">

        {AGE_GROUPS.map(ag => {
          const isOpen = expanded === ag.range;
          return (
            <div key={ag.range}
              style={{ background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>

              {/* Header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : ag.range)}
                style={{
                  width: '100%', textAlign: 'left', padding: '14px 16px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: 'none', border: 'none', cursor: 'pointer', color: TEXT,
                }}
              >
                {/* Age badge */}
                <div style={{
                  minWidth: 52, padding: '4px 0', borderRadius: 8, textAlign: 'center',
                  background: ag.color, fontSize: 13, fontWeight: 700, color: '#fff',
                  flexShrink: 0, lineHeight: 1.3,
                }}>
                  {ag.range}
                </div>

                {/* Phase name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>
                    {ag.phase}
                    {ag.sub && (
                      <span style={{ color: MUTED, fontWeight: 400 }}> — {ag.sub}</span>
                    )}
                  </div>
                </div>

                <div style={{ color: MUTED, fontSize: 12, flexShrink: 0, marginTop: 3 }}>
                  {isOpen ? '▲' : '▼'}
                </div>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ fontSize: 13, color: '#bbb', lineHeight: 1.7, margin: '12px 0 12px' }}>
                    {ag.desc}
                  </p>
                  {/* Pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ag.pills.map(p => (
                      <span key={p.label} style={{
                        fontSize: 11, fontWeight: 500, padding: '4px 10px',
                        borderRadius: 20, background: p.bg, color: p.color,
                      }}>
                        {p.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Section>

      {/* ── SECTION 2: Matrix table ───────────────────────────────────── */}
      <Section label="At a glance — which tests apply at which age">
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: MUTED, fontWeight: 500, minWidth: 150 }}>
                    Test
                  </th>
                  {MATRIX_COLS.map(col => (
                    <th key={col} style={{ padding: '10px 12px', textAlign: 'center', color: MUTED, fontWeight: 500, minWidth: 90 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX_ROWS.map((row, ri) => (
                  <tr key={row.test}
                    style={{ borderBottom: ri < MATRIX_ROWS.length - 1 ? `1px solid ${BORDER}` : 'none',
                             background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '10px 14px', color: TEXT, fontWeight: 500 }}>
                      {row.test}
                    </td>
                    {row.vals.map((val, ci) => (
                      <td key={ci} style={{
                        padding: '10px 12px', textAlign: 'center',
                        color: val === '—'           ? '#444'
                             : val === 'Full'         ? '#4ade80'
                             : val.includes('Stricter') ? '#c8962a'
                             : val === 'Simplified'   ? '#60a5fa'
                             : '#e5e5e5',
                        fontWeight: val === 'Full' || val === '—' ? 500 : 400,
                      }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* ── SECTION 3: Home testing ───────────────────────────────────── */}
      <Section label="Can it be done at home — test by test">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOME_TESTS.map(t => (
            <div key={t.id} style={{
              background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              {/* Icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: t.iconBg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 13, fontWeight: 700,
                color: t.iconCl, marginTop: 2,
              }}>
                {t.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 2 }}>
                  {t.id} {t.name}
                  <span style={{ color: t.iconCl, fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                    — {t.verdict}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.65 }}>
                  {t.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── SECTION 4: Solo vs helper split ──────────────────────────── */}
      <Section label="What a solo athlete at home actually needs">

        {/* Two-column card */}
        <div style={{
          background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 12,
          overflow: 'hidden', marginBottom: 12,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {/* Can do alone */}
            <div style={{ padding: '16px 18px', borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 12 }}>
                Can do fully alone
              </div>
              {[
                'T3 Balance — counts own corrections',
                'T6 Ball mastery — phone propped against wall',
                'T5 Circuit — phone propped, self-rate video',
              ].map(item => (
                <div key={item} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
                }}>
                  <span style={{ color: '#4ade80', fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
                  <span style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Needs helper */}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 12 }}>
                Needs one other person
              </div>
              {[
                'T1 Jump — someone holds the phone',
                'T2 Sprint — someone holds the phone',
                'T4 Reaction — someone drops the ball',
              ].map(item => (
                <div key={item} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8,
                }}>
                  <span style={{ color: GOLD, fontSize: 12, flexShrink: 0, marginTop: 1 }}>~</span>
                  <span style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-mode callout */}
        <div style={{
          background: '#1c2a1c', border: `1px solid #2d4a2d`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.7 }}>
            The GRS app has two modes:{' '}
            <strong style={{ color: TEXT }}>School session mode</strong>
            {' '}(coach runs all 6 tests on a group) and{' '}
            <strong style={{ color: TEXT }}>Home training mode</strong>
            {' '}(athlete does what they can alone, flags which tests were self-administered).
            Self-administered results are stored separately and shown with a different badge
            on the Talent Passport so scouts know the context.
          </div>
        </div>
      </Section>

    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 16px 4px' }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: MUTED,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 12,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}