'use client';
// src/components/ui/PlayerCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// GRS Player Card — the living identity on the platform
// Shows: name, rank, AQ score, weekly streak, 6-domain radar, badges, QR link
// Shareable via WhatsApp as an image. QR links to Talent Passport.
// Used on: /player/talent-id, /player/profile, /passport/[id]
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';

export type PlayerRank = 'Student' | 'Player' | 'Skilled' | 'Attacker' | 'Star' | 'Lion';

export interface PlayerCardData {
  playerName:   string;
  position:     string;
  school:       string;
  ageGroup:     string;
  rank:         PlayerRank;
  aqScore:      number;           // 0–100
  weeklyStreak: number;
  tier:         'Elite' | 'Competitive' | 'Developmental' | 'Foundation';
  domainScores: {
    speed:     number;  // 0–100
    power:     number;
    agility:   number;
    endurance: number;
    ball:      number;
    balance:   number;
  };
  dq?:          number | null;    // development rate % per week
  passportUrl?: string;           // grassrootssports.live/passport/[token]
  coachVerified?: boolean;
}

const RANK_CONFIG: Record<PlayerRank, { color: string; bg: string; desc: string }> = {
  Student:  { color: '#888780', bg: '#f1efe8', desc: 'Completed first test session' },
  Player:   { color: '#185fa5', bg: '#e6f1fb', desc: '4 sessions completed' },
  Skilled:  { color: '#3b6d11', bg: '#eaf3de', desc: '8 sessions + improving DQ' },
  Attacker: { color: '#854f0b', bg: '#faeeda', desc: '16 sessions + top 40% AQ' },
  Star:     { color: '#534ab7', bg: '#eeedfe', desc: '6 months + coach verified' },
  Lion:     { color: '#c8962a', bg: '#1c3d22', desc: 'Top 10% AQ + 6-month streak' },
};

const DOMAIN_LABELS = ['Speed', 'Power', 'Agility', 'Endurance', 'Ball', 'Balance'];

function RadarChart({ scores }: { scores: number[] }) {
  const cx = 70; const cy = 70; const r = 52;
  const n = 6;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1].map(pct => {
    const pts = Array.from({ length: n }, (_, i) => pt(i, r * pct));
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
  });

  const shapePts = scores.map((s, i) => pt(i, r * Math.min(1, s / 100)));
  const shapePath = shapePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';

  const labelPts = Array.from({ length: n }, (_, i) => pt(i, r + 14));

  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      {rings.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const end = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />;
      })}
      <path d={shapePath} fill="rgba(200,150,42,0.3)" stroke="#c8962a" strokeWidth="1.5" />
      {shapePts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#c8962a" />
      ))}
      {labelPts.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central"
          fontSize="8" fill="rgba(255,255,255,0.65)" fontFamily="sans-serif">
          {DOMAIN_LABELS[i]}
        </text>
      ))}
    </svg>
  );
}

export default function PlayerCard({ data, compact = false }: {
  data: PlayerCardData;
  compact?: boolean;
}) {
  const cfg    = RANK_CONFIG[data.rank];
  const isLion = data.rank === 'Lion';
  const scores = Object.values(data.domainScores);
  const initials = data.playerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleShare = async () => {
    const text = `${data.playerName} — GRS ${data.rank} | AQ ${data.aqScore} | ${data.weeklyStreak} week streak\n${data.passportUrl ?? 'grassrootssports.live'}`;
    if (navigator.share) {
      await navigator.share({ title: 'My GRS Player Card', text, url: data.passportUrl ?? 'https://grassrootssports.live' });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden w-full select-none"
      style={{
        background: isLion
          ? 'linear-gradient(135deg, #1c3d22 0%, #0d1f12 100%)'
          : '#1a3d26',
        border: isLion ? '1px solid #c8962a' : '1px solid rgba(255,255,255,0.1)',
        maxWidth: compact ? 320 : 380,
      }}
    >
      {/* Top stripe */}
      <div className="px-4 pt-3 pb-0 flex items-center justify-between">
        <div className="text-xs font-medium opacity-40 uppercase tracking-widest text-white">
          GrassRoots Sports
        </div>
        {data.coachVerified && (
          <div className="flex items-center gap-1">
            <span className="text-green-400 text-xs">✓</span>
            <span className="text-xs text-green-400 opacity-80">Verified</span>
          </div>
        )}
      </div>

      {/* Identity row */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          style={{ background: isLion ? '#c8962a' : 'rgba(255,255,255,0.15)', color: '#fff' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-base truncate">{data.playerName}</div>
          <div className="text-white/60 text-xs">{data.position} · {data.school}</div>
        </div>
        {/* Rank badge */}
        <div
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
          style={isLion
            ? { background: '#c8962a', color: '#fff' }
            : { background: cfg.bg, color: cfg.color }
          }
        >
          {data.rank}
        </div>
      </div>

      {/* AQ + DQ row */}
      <div className="flex items-end gap-4 px-4 pb-3 border-b border-[#f0b429]/10">
        <div>
          <div className="text-5xl font-black text-white leading-none">{data.aqScore}</div>
          <div className="text-white/50 text-xs mt-0.5">Athletic Quotient</div>
        </div>
        <div className="flex-1">
          {data.dq !== null && data.dq !== undefined && (
            <div>
              <div className="text-lg font-bold" style={{ color: data.dq >= 0 ? '#4ade80' : '#f87171' }}>
                {data.dq > 0 ? '+' : ''}{data.dq}%/wk
              </div>
              <div className="text-white/50 text-xs">Development rate</div>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-base">🔥 {data.weeklyStreak}</div>
          <div className="text-white/50 text-xs">week streak</div>
        </div>
      </div>

      {/* Radar + domain bars */}
      <div className="flex items-center gap-2 px-4 py-3">
        <RadarChart scores={scores} />
        <div className="flex-1 space-y-1.5">
          {DOMAIN_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="text-white/50 text-xs w-14">{label}</div>
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${scores[i]}%`, background: '#c8962a', transition: 'width 0.5s' }}
                />
              </div>
              <div className="text-white/70 text-xs w-6 text-right">{scores[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier pill */}
      <div className="px-4 pb-2">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          data.tier === 'Elite'        ? 'bg-amber-500/20 text-amber-300'
          : data.tier === 'Competitive' ? 'bg-green-500/20 text-green-300'
          : data.tier === 'Developmental' ? 'bg-blue-500/20 text-blue-300'
          : 'bg-white/10 text-white/50'
        }`}>
          {data.tier} tier · {data.ageGroup}
        </span>
      </div>

      {/* Action row */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          onClick={handleShare}
          className="flex-1 py-2 rounded-xl text-xs font-medium border border-[#f0b429]/20 text-white hover:bg-white/10 transition-colors"
        >
          Share on WhatsApp
        </button>
        {data.passportUrl && (
          <a
            href={data.passportUrl}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-center text-white transition-colors"
            style={{ background: isLion ? '#c8962a' : '#2d5c35' }}
          >
            Talent Passport
          </a>
        )}
      </div>
    </div>
  );
}