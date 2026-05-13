'use client';

/**
 * PotentialCard.jsx
 * Grassroots Sports — grassrootssports.live
 *
 * Displays the THUTO Prediction Engine output on a player's profile page.
 * Fetches prediction data from the Laravel API and renders a visual card
 * with peak level, upside rating, readiness, comparable player, and narrative.
 *
 * Usage:
 *   <PotentialCard playerId={player.id} playerName={player.first_name} />
 *
 * Author: Nigel Ndoro — Founder, Grassroots Sports
 * Date: May 2026
 */

import { useState, useEffect } from 'react';

// ── CONSTANTS ──────────────────────────────────────────────────────────────
// Keys match TalentPredictionService::LEVELS (backend)

const LEVEL_COLOURS = {
  'continental':        { bg: 'from-amber-600 to-yellow-400',   badge: 'bg-amber-500',   text: 'text-amber-900'   },
  'sadc_international': { bg: 'from-green-700 to-green-500',    badge: 'bg-green-600',   text: 'text-green-900'   },
  'premier_league':     { bg: 'from-emerald-800 to-emerald-600',badge: 'bg-emerald-600', text: 'text-emerald-900' },
  'division_1':         { bg: 'from-blue-800 to-blue-600',      badge: 'bg-blue-600',    text: 'text-blue-900'    },
  'division_2':         { bg: 'from-slate-700 to-slate-500',    badge: 'bg-slate-500',   text: 'text-slate-900'   },
  'amateur':            { bg: 'from-gray-700 to-gray-500',      badge: 'bg-gray-500',    text: 'text-gray-900'    },
};

const LEVEL_ICONS = {
  'continental':        '🌍',
  'sadc_international': '🦁',
  'premier_league':     '🇿🇼',
  'division_1':         '⚽',
  'division_2':         '🏃',
  'amateur':            '🌱',
};

// ── STAR RATING COMPONENT ──────────────────────────────────────────────────

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── CONFIDENCE BAR ─────────────────────────────────────────────────────────

function ConfidenceBar({ confidence }) {
  const colour =
    confidence >= 75 ? 'bg-green-500' :
    confidence >= 50 ? 'bg-amber-500' :
    'bg-orange-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Prediction Confidence</span>
        <span className="font-semibold text-foreground">{confidence}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colour}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

// ── VELOCITY INDICATOR ─────────────────────────────────────────────────────

function VelocityIndicator({ velocity }) {
  const isPositive = velocity > 0;
  const isNeutral  = velocity === 0;

  const colour = isPositive ? 'text-green-400' : isNeutral ? 'text-amber-400' : 'text-red-400';
  const arrow  = isPositive ? '↑' : isNeutral ? '→' : '↓';
  const label  = isPositive
    ? `+${velocity.toFixed(1)} pts/month`
    : isNeutral
    ? 'Stable'
    : `${velocity.toFixed(1)} pts/month`;

  return (
    <div className="flex items-center gap-1">
      <span className={`text-lg font-bold ${colour}`} aria-hidden="true">{arrow}</span>
      <span className={`text-sm font-semibold ${colour}`}>{label}</span>
    </div>
  );
}

// ── SKELETON LOADER ────────────────────────────────────────────────────────

function PotentialCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded-full" />
      </div>
      <div className="h-16 bg-muted rounded-xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
      </div>
      <div className="h-20 bg-muted rounded-xl" />
    </div>
  );
}

// ── EMPTY STATE ────────────────────────────────────────────────────────────

function PotentialCardEmpty({ playerName }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
      <div className="text-4xl">🔮</div>
      <h3 className="font-semibold text-foreground">Prediction Unlocking...</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {playerName ? `${playerName} needs` : 'You need'} at least 3 logged training sessions
        for THUTO to generate a talent prediction. Keep training and logging!
      </p>
      <div className="inline-flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
        <span>⚡</span>
        <span>Log sessions at grassrootssports.live/player/training</span>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function PotentialCard({ playerId, playerName, isPublicView = false }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [expanded, setExpanded]     = useState(false);

  useEffect(() => {
    if (!playerId) return;

    const fetchPrediction = async () => {
      setLoading(true);
      setError(null);
      try {
        // NEXT_PUBLIC_API_URL already includes /api/v1 — do NOT add it again
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/prediction`,
          {
            headers: {
              'Accept': 'application/json',
              ...(typeof window !== 'undefined' &&
                localStorage.getItem('auth_token')
                ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
                : {}),
            },
            cache: 'no-store',
          }
        );

        if (res.status === 404) {
          setPrediction(null);
          return;
        }

        if (!res.ok) throw new Error('Failed to load prediction');

        const json = await res.json();
        const raw  = json.data ?? json;

        // Backend returns comparable_name / comparable_style as flat fields.
        // Normalise to nested object for the template below.
        setPrediction({
          ...raw,
          comparable: raw.comparable_name
            ? { name: raw.comparable_name, style: raw.comparable_style }
            : null,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [playerId]);

  if (loading) return <PotentialCardSkeleton />;
  if (error)   return null; // fail silently — never break the profile page

  // Backend returns data_quality as lowercase: 'low', 'medium', 'high'
  if (!prediction || prediction.data_quality === 'low') {
    return <PotentialCardEmpty playerName={playerName} />;
  }

  const colours = LEVEL_COLOURS[prediction.peak_level] || LEVEL_COLOURS['amateur'];
  const icon    = LEVEL_ICONS[prediction.peak_level]   || '⚽';

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">

      {/* HEADER */}
      <div className={`bg-gradient-to-r ${colours.bg} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-0.5">
              🔮 THUTO Prediction Engine
            </p>
            <h3 className="text-lg font-bold text-white">Talent Forecast</h3>
          </div>
          <span className="text-4xl" aria-hidden="true">{icon}</span>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* PEAK LEVEL */}
        <div className="rounded-xl bg-muted/50 border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Projected Peak Level
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xl font-bold text-foreground">
              {prediction.peak_level_label}
            </p>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${colours.badge} ${colours.text}`}
            >
              {prediction.percentile}th percentile
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {prediction.platform_rank}
          </p>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3">

          {/* Upside Rating */}
          <div className="rounded-xl bg-muted/30 border border-border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Upside Rating</p>
            <StarRating rating={prediction.upside_rating} />
            <p className="text-xs font-semibold text-amber-500">
              {prediction.upside_label}
            </p>
          </div>

          {/* Readiness */}
          <div className="rounded-xl bg-muted/30 border border-border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Professional Readiness</p>
            <p className="text-sm font-bold text-foreground">{prediction.readiness_age}</p>
            <p className="text-xs text-muted-foreground">Estimated timeline</p>
          </div>

          {/* Development Velocity */}
          <div className="rounded-xl bg-muted/30 border border-border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Development Speed</p>
            <VelocityIndicator velocity={prediction.velocity} />
            <p className="text-xs text-muted-foreground">THUTO score change</p>
          </div>

          {/* Consistency */}
          <div className="rounded-xl bg-muted/30 border border-border p-3 space-y-1">
            <p className="text-xs text-muted-foreground">Training Consistency</p>
            <p className="text-sm font-bold text-foreground">{prediction.consistency}%</p>
            <p className="text-xs text-muted-foreground">Last 3 months</p>
          </div>
        </div>

        {/* COMPARABLE PLAYER */}
        {prediction.comparable && (
          <div className="rounded-xl bg-green-950/30 border border-green-800/30 p-4">
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">
              ⚡ Comparable Player
            </p>
            <p className="font-bold text-white text-sm mb-1">
              {prediction.comparable.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {prediction.comparable.style}
            </p>
            <p className="text-xs text-green-400 mt-1 italic">
              (Developmental phase comparison)
            </p>
          </div>
        )}

        {/* CONFIDENCE */}
        <ConfidenceBar confidence={prediction.confidence} />

        {/* NARRATIVE — expandable */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs text-amber-500 hover:text-amber-400 font-semibold mb-2"
            aria-expanded={expanded}
          >
            <span>{expanded ? '▼' : '▶'}</span>
            <span>Full Analysis</span>
          </button>

          {expanded && (
            <div className="rounded-xl bg-muted/20 border border-border p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prediction.narrative}
              </p>
            </div>
          )}
        </div>

        {/* DATA QUALITY NOTE */}
        {prediction.data_quality === 'medium' && (
          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <span aria-hidden="true">⚠</span>
            <span>
              Medium confidence — log more training sessions to improve prediction accuracy.
            </span>
          </div>
        )}

        {/* SCOUT VIEW — share prompt */}
        {isPublicView && prediction.scout_interest > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Scout Interest</p>
              <p className="text-sm font-bold text-foreground">
                {prediction.scout_interest} score this month
              </p>
            </div>
            <div className="text-2xl" aria-hidden="true">👀</div>
          </div>
        )}

      </div>
    </div>
  );
}
