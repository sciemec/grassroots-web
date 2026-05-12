'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Download } from 'lucide-react';

type CardStyle = 'gold' | 'green' | 'dark';

interface PlayerCardData {
  name: string;
  score: number;
  position: string;
  province: string;
  clubOrSchool: string;
  ageGroup: string;
  strengths: string[];
  scoutViews: number;
  sessionsLogged: number;
}

const THEMES = {
  gold: {
    bg1: '#0a1f0e', bg2: '#1a5c2a', cardBg: '#112a16',
    stripe: '#c8962a', accent: '#c8962a', accentLight: '#f5d98a',
    textPrimary: '#ffffff', textSec: '#aaddbb',
    scoreText: '#0a1f0e', scoreBg: '#c8962a',
    badgeBg: 'rgba(200,150,42,0.15)',
  },
  green: {
    bg1: '#061a0c', bg2: '#0f3a1a', cardBg: '#0a2210',
    stripe: '#c8962a', accent: '#2d8a45', accentLight: '#cceecc',
    textPrimary: '#ffffff', textSec: '#aaddbb',
    scoreText: '#c8962a', scoreBg: '#1a5c2a',
    badgeBg: 'rgba(45,138,69,0.15)',
  },
  dark: {
    bg1: '#0e0e1a', bg2: '#1a1a2e', cardBg: '#13131f',
    stripe: '#7c3aed', accent: '#7c3aed', accentLight: '#c4b5fd',
    textPrimary: '#ffffff', textSec: '#aaaacc',
    scoreText: '#ffffff', scoreBg: '#7c3aed',
    badgeBg: 'rgba(124,58,237,0.15)',
  },
};

function scoreGrade(s: number): string {
  if (s >= 90) return 'Elite';
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Strong';
  if (s >= 60) return 'Good';
  return 'Developing';
}

function scoreColor(s: number): string {
  if (s >= 80) return '#22c55e';
  if (s >= 65) return '#eab308';
  return '#f97316';
}

function posAbbr(pos: string): string {
  const map: Record<string, string> = {
    'goalkeeper': 'GK', 'striker': 'ST', 'centre forward': 'CF',
    'left wing': 'LW', 'right wing': 'RW', 'winger': 'WNG',
    'attacking midfielder': 'CAM', 'central midfielder': 'CM',
    'defensive midfielder': 'CDM', 'left back': 'LB', 'right back': 'RB',
    'centre back': 'CB', 'defender': 'DEF', 'midfielder': 'MID', 'forward': 'FWD',
  };
  return map[pos.toLowerCase()] ?? pos.substring(0, 3).toUpperCase();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  data: PlayerCardData,
  style: CardStyle
) {
  const W = 360, H = 520;
  const T = THEMES[style];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, T.bg1);
  grad.addColorStop(1, T.bg2);
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner surface
  roundRect(ctx, 12, 12, 336, 496, 10);
  ctx.fillStyle = T.cardBg;
  ctx.fill();

  // Top stripe
  roundRect(ctx, 12, 12, 336, 4, 3);
  ctx.fillStyle = T.stripe;
  ctx.fill();

  // Platform name
  ctx.fillStyle = T.accent;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GRASSROOTS SPORTS', W / 2, 38);

  // URL line
  ctx.fillStyle = T.textSec;
  ctx.font = '9px sans-serif';
  ctx.fillText('grassrootssports.live \u2022 Zimbabwe', W / 2, 52);

  // Score circle
  const cx = W / 2, cy = 160, cr = 62;

  // Arc track (full) — outside the filled circle at cr+14
  ctx.beginPath();
  ctx.arc(cx, cy, cr + 14, -Math.PI * 0.8, Math.PI * 0.8);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Arc progress — outside the filled circle
  const progress = Math.max(0, Math.min(1, data.score / 100));
  const endAngle = -Math.PI * 0.8 + Math.PI * 1.6 * progress;
  ctx.beginPath();
  ctx.arc(cx, cy, cr + 14, -Math.PI * 0.8, endAngle);
  ctx.strokeStyle = scoreColor(data.score);
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Circle fill (solid, drawn after arc so arc is behind circle edge visually)
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fillStyle = T.scoreBg;
  ctx.fill();

  // Score number
  ctx.fillStyle = T.scoreText;
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.round(data.score)), cx, cy + 14);

  // THUTO SCORE label
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = T.scoreText;
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('THUTO SCORE', cx, cy + 28);
  ctx.globalAlpha = 1;

  // Grade badge
  const grade = scoreGrade(data.score);
  ctx.font = 'bold 9px sans-serif';
  const gradeW = ctx.measureText(grade).width + 20;
  roundRect(ctx, cx - gradeW / 2, cy + 36, gradeW, 18, 9);
  ctx.fillStyle = scoreColor(data.score) + '33';
  ctx.fill();
  ctx.fillStyle = scoreColor(data.score);
  ctx.fillText(grade, cx, cy + 49);

  // Player name (y=270 baseline)
  ctx.fillStyle = T.textPrimary;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  let displayName = data.name;
  while (ctx.measureText(displayName).width > 300 && displayName.length > 1) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== data.name) displayName += '\u2026';
  ctx.fillText(displayName, cx, 285);

  // Position + Age pills
  const posText = posAbbr(data.position);
  const ageText = data.ageGroup;
  ctx.font = 'bold 10px sans-serif';
  const posW = ctx.measureText(posText).width + 16;
  ctx.font = '10px sans-serif';
  const ageW = ctx.measureText(ageText).width + 16;
  const totalPillW = posW + ageW + 8;
  const px0 = cx - totalPillW / 2;

  roundRect(ctx, px0, 298, posW, 20, 10);
  ctx.fillStyle = T.accent;
  ctx.fill();
  ctx.fillStyle = T.bg1;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(posText, px0 + 8, 312);

  roundRect(ctx, px0 + posW + 8, 298, ageW, 20, 10);
  ctx.fillStyle = T.badgeBg;
  ctx.fill();
  ctx.fillStyle = T.textSec;
  ctx.font = '10px sans-serif';
  ctx.fillText(ageText, px0 + posW + 16, 312);

  // Divider
  ctx.beginPath();
  ctx.moveTo(24, 326); ctx.lineTo(336, 326);
  ctx.strokeStyle = T.textSec + '33';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Club / Province labels
  ctx.fillStyle = T.textSec;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Club / School', 24, 340);
  ctx.textAlign = 'right';
  ctx.fillText('Province', 336, 340);

  // Club / Province values
  ctx.fillStyle = T.textPrimary;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  const rawClub = data.clubOrSchool || '\u2014';
  let club = rawClub;
  while (ctx.measureText(club).width > 148 && club.length > 1) club = club.slice(0, -1);
  if (club !== rawClub) club += '\u2026';
  ctx.fillText(club, 24, 355);
  ctx.textAlign = 'right';
  ctx.fillText(data.province || '\u2014', 336, 355);

  // Divider
  ctx.beginPath();
  ctx.moveTo(24, 368); ctx.lineTo(336, 368);
  ctx.strokeStyle = T.textSec + '33';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Strengths label
  ctx.fillStyle = T.textSec;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Top Strengths', cx, 382);

  // Strength pills — left-aligned from x=24
  const strengths = data.strengths.slice(0, 3);
  if (strengths.length > 0) {
    ctx.font = '11px sans-serif';
    const pws = strengths.map(s => ctx.measureText(s).width + 16);
    let spx = 24;
    strengths.forEach((s, i) => {
      roundRect(ctx, spx, 390, pws[i], 18, 9);
      ctx.fillStyle = T.badgeBg;
      ctx.fill();
      ctx.fillStyle = T.accentLight;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(s, spx + 8, 403);
      spx += pws[i] + 6;
    });
  }

  // Divider
  ctx.beginPath();
  ctx.moveTo(24, 416); ctx.lineTo(336, 416);
  ctx.strokeStyle = T.textSec + '33';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Stats row — 3 columns with vertical separators
  const status = data.score >= 70 ? 'Ready' : data.score >= 50 ? 'Rising' : 'Emerging';
  const statCols = [
    { label: 'Scout Views', value: String(data.scoutViews) },
    { label: 'Sessions', value: String(data.sessionsLogged) },
    { label: 'Status', value: status },
  ];
  const colW = 336 / 3;
  statCols.forEach((col, i) => {
    const scx = 24 + colW * i + colW / 2;
    ctx.fillStyle = T.accent;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(col.value, scx, 438);
    ctx.fillStyle = T.textSec;
    ctx.font = '9px sans-serif';
    ctx.fillText(col.label, scx, 450);
    // Vertical separator after first and second column
    if (i < 2) {
      ctx.beginPath();
      ctx.moveTo(24 + colW * (i + 1), 422);
      ctx.lineTo(24 + colW * (i + 1), 455);
      ctx.strokeStyle = T.textSec + '33';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  });

  // Bottom stripe
  roundRect(ctx, 12, H - 16, 336, 4, 3);
  ctx.fillStyle = T.stripe;
  ctx.fill();

  // Zim flag dots — left-aligned
  const dotY = H - 8;
  ['#1a5c2a', '#ffde00', '#ce1126'].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(24 + i * 14, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });

  // Bottom text with flag emoji
  ctx.fillStyle = T.textSec;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AI-Powered Talent Discovery \u2022 Zimbabwe \uD83C\uDDFF\uD83C\uDDFC', cx, H - 1);
}

export default function MyCardPage() {
  const { token, user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerData, setPlayerData] = useState<PlayerCardData | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('gold');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!token || !apiUrl) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`${apiUrl}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        const profile = json.profile ?? {};
        const stats = json.stats ?? {};

        let scoutViews = 0;
        try {
          const vr = await fetch(`${apiUrl}/players/${json.player_id}/view-count`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (vr.ok) {
            const vj = await vr.json();
            scoutViews = vj.count ?? 0;
          }
        } catch { /* silent — view count is non-critical */ }

        setPlayerData({
          name: [profile.first_name, profile.surname].filter(Boolean).join(' ') || 'Player',
          score: Math.round(Number(stats.avg_form_score) || 0),
          position: profile.position_primary || 'Player',
          province: json.province || '\u2014',
          clubOrSchool: profile.school_name || '\u2014',
          ageGroup: json.age_group || 'Player',
          strengths: ['Dedication', 'Talent', 'Spirit'],
          scoutViews,
          sessionsLogged: stats.total_sessions ?? 0,
        });
      } catch {
        setPlayerData({
          name: (user as { name?: string })?.name || 'Player',
          score: 0,
          position: 'Player',
          province: '\u2014',
          clubOrSchool: '\u2014',
          ageGroup: '\u2014',
          strengths: ['Dedication', 'Talent', 'Spirit'],
          scoutViews: 0,
          sessionsLogged: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  // Redraw canvas whenever data or style changes
  useEffect(() => {
    if (!canvasRef.current || !playerData) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    drawCard(ctx, playerData, selectedStyle);
  }, [playerData, selectedStyle]);

  const handleDownload = () => {
    if (!canvasRef.current || !playerData) return;
    const link = document.createElement('a');
    link.download = `grassroots_card_${playerData.name.replace(/\s+/g, '_')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const shareText = playerData
    ? `\u26bd Got my THUTO Score \u2014 ${playerData.score}/100 (${scoreGrade(playerData.score)})\n\ud83c\udfe5 ${playerData.clubOrSchool} | ${playerData.province}\n\ud83d\udccd ${playerData.position} | Zimbabwe\n\ud83d\udc40 ${playerData.scoutViews} scouts viewed my profile this month\n\nZimbabwe is watching. The world is watching.\n\n\ud83d\udd17 grassrootssports.live\n#GrassrootsSports #ZimbabweFootball #THUTO #ZimPride`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-7 w-48 rounded-lg bg-muted animate-pulse mb-2" />
        <div className="h-4 w-64 rounded bg-muted animate-pulse mb-8" />
        <div className="flex justify-center">
          <div className="w-[360px] h-[520px] rounded-2xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-1">Your Player Card</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Download and share your THUTO Score card on WhatsApp and Facebook
      </p>

      {/* Card canvas */}
      <div className="flex justify-center mb-6">
        <canvas ref={canvasRef} width={360} height={520} className="rounded-2xl shadow-lg" />
      </div>

      {/* Style selector */}
      <div className="flex gap-3 justify-center mb-6">
        {(['gold', 'green', 'dark'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedStyle(key)}
            className={
              selectedStyle === key
                ? 'px-4 py-2 rounded-lg border-2 border-amber-500 text-sm font-semibold text-amber-600'
                : 'px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-amber-500 transition-colors'
            }
          >
            {key === 'gold' ? 'Gold Elite' : key === 'green' ? 'Zim Green' : 'Dark Pro'}
          </button>
        ))}
      </div>

      {/* Download */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 w-full max-w-xs bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl text-sm transition-colors justify-center"
        >
          <Download className="h-4 w-4" />
          Download My Card
        </button>
      </div>

      {/* Share text — read-only */}
      <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
        {shareText}
      </div>
      <button
        onClick={handleCopy}
        className="mt-2 text-xs text-green-700 hover:text-green-600 font-semibold underline cursor-pointer"
      >
        {copied ? '\u2713 Copied!' : 'Copy Share Text'}
      </button>

      {/* Viral nudge */}
      <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 text-center mt-4">
        <p className="text-sm text-foreground font-semibold mb-1">Tag a teammate!</p>
        <p className="text-xs text-muted-foreground">
          Challenge them to register and beat your score.
        </p>
      </div>
    </div>
  );
}
