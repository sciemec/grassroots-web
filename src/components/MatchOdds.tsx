// components/MatchOdds.tsx
"use client";

import { TrendingUp, Minus, Zap, Target, Flame } from 'lucide-react';

interface MatchOddsProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  homePossession?: number;
  awayPossession?: number;
  homeShots?: number;
  awayShots?: number;
}

export function MatchOdds({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  minute,
  homePossession = 50,
  awayPossession = 50,
  homeShots = 0,
  awayShots = 0,
}: MatchOddsProps) {

  const calculateWinProbability = () => {
    const timeRemaining = (90 - minute) / 90;
    const scoreDiff = homeScore - awayScore;
    let homeProb = 33, awayProb = 33, drawProb = 34;

    if (scoreDiff > 0) {
      homeProb = 50 + scoreDiff * 15 + timeRemaining * 20;
      awayProb = 15 - scoreDiff * 5;
      drawProb = 35 - scoreDiff * 5;
    } else if (scoreDiff < 0) {
      homeProb = 15 - Math.abs(scoreDiff) * 5;
      awayProb = 50 + Math.abs(scoreDiff) * 15 + timeRemaining * 20;
      drawProb = 35 - Math.abs(scoreDiff) * 5;
    } else {
      const homeAdv = (homePossession - 50) / 10 + (homeShots - awayShots) / 20;
      homeProb = 33 + homeAdv * 10;
      awayProb = 33 - homeAdv * 5;
      drawProb = 34 - Math.abs(homeAdv) * 5;
    }

    return {
      home: Math.min(85, Math.max(5, Math.round(homeProb))),
      away: Math.min(85, Math.max(5, Math.round(awayProb))),
      draw: Math.min(50, Math.max(10, Math.round(drawProb))),
    };
  };

  const probabilities = calculateWinProbability();

  const getMomentum = () => {
    const homeAdv = homeShots > awayShots ? homeShots - awayShots : 0;
    const awayAdv = awayShots > homeShots ? awayShots - homeShots : 0;
    if (homeAdv > awayAdv + 2) return { team: homeTeam, intensity: 'high' };
    if (awayAdv > homeAdv + 2) return { team: awayTeam, intensity: 'high' };
    if (homeAdv > awayAdv)     return { team: homeTeam, intensity: 'low' };
    if (awayAdv > homeAdv)     return { team: awayTeam, intensity: 'low' };
    return { team: null, intensity: 'none' };
  };

  const getKeyMoment = () => {
    if (90 - minute < 5) return "Final minutes — expect drama";
    if (probabilities.home > 60) return `${homeTeam} pushing for another goal`;
    if (probabilities.away > 60) return `${awayTeam} threatening to score`;
    if (Math.abs(probabilities.home - probabilities.away) < 10) return "Tight contest — next goal is crucial";
    return "End-to-end action";
  };

  const momentum = getMomentum();

  // Unified probability bar segments (home | draw | away)
  const total = probabilities.home + probabilities.draw + probabilities.away;
  const homeW  = (probabilities.home / total) * 100;
  const drawW  = (probabilities.draw / total) * 100;
  const awayW  = (probabilities.away / total) * 100;

  const divider = 'rgba(255,255,255,0.06)';

  return (
    <div className="p-4 text-white" style={{ background: 'transparent' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <Zap size={13} style={{ color: '#f0b429' }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Live Win Probability
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={9} style={{ color: 'rgba(255,255,255,0.25)' }} />
          <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>AI · updated live</span>
        </div>
      </div>

      {/* Unified broadcast probability bar */}
      <div className="mb-3">
        {/* Labels row */}
        <div className="grid grid-cols-3 text-center mb-1.5">
          <div>
            <span className="text-[10px] font-bold truncate block" style={{ color: 'rgba(255,255,255,0.6)' }}>{homeTeam}</span>
            <span className="text-base font-black" style={{ color: '#22c55e' }}>{probabilities.home}%</span>
          </div>
          <div>
            <span className="text-[10px] font-bold block" style={{ color: 'rgba(255,255,255,0.35)' }}>Draw</span>
            <span className="text-base font-black" style={{ color: '#f0b429' }}>{probabilities.draw}%</span>
          </div>
          <div>
            <span className="text-[10px] font-bold truncate block" style={{ color: 'rgba(255,255,255,0.6)' }}>{awayTeam}</span>
            <span className="text-base font-black" style={{ color: '#60a5fa' }}>{probabilities.away}%</span>
          </div>
        </div>
        {/* Single segmented bar */}
        <div className="flex h-2.5 rounded-full overflow-hidden gap-px" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${homeW}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)', borderRadius: '999px 0 0 999px' }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${drawW}%`, background: 'linear-gradient(90deg, #ca8a04, #f0b429)' }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${awayW}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '0 999px 999px 0' }}
          />
        </div>
      </div>

      {/* Momentum + Key Moment */}
      <div className="rounded-xl p-3 space-y-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Momentum */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame size={12} style={{ color: '#f97316' }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Momentum
            </span>
          </div>
          {momentum.team ? (
            <div className="flex items-center gap-1.5">
              <TrendingUp size={11} style={{ color: '#4ade80' }} />
              <span className="text-[11px] font-black text-white">{momentum.team}</span>
              {momentum.intensity === 'high' && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(249,115,22,0.2)', color: '#fb923c' }}>
                  ON FIRE
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Minus size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Even contest</span>
            </div>
          )}
        </div>

        {/* Key moment */}
        <div className="flex items-start gap-2" style={{ borderTop: `1px solid ${divider}`, paddingTop: '0.625rem' }}>
          <Target size={10} className="shrink-0 mt-0.5" style={{ color: '#f0b429' }} />
          <div>
            <span className="text-[8px] font-black uppercase tracking-widest block mb-0.5" style={{ color: 'rgba(240,180,41,0.55)' }}>
              Key Moment
            </span>
            <p className="text-[11px] font-semibold text-white">{getKeyMoment()}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Possession */}
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[8px] font-black uppercase tracking-widest mb-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Possession
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-white w-8 text-right">{Math.round(homePossession)}%</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${homePossession}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }} />
            </div>
            <span className="text-[11px] font-black text-white w-8">{Math.round(awayPossession)}%</span>
          </div>
        </div>

        {/* Shots */}
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[8px] font-black uppercase tracking-widest mb-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Shots
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl font-black text-white">{homeShots}</span>
            <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span className="text-xl font-black text-white">{awayShots}</span>
          </div>
        </div>
      </div>

      <p className="text-[8px] text-center mt-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
        Probabilities based on live match data · For entertainment only
      </p>
    </div>
  );
}