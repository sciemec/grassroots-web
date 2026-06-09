// components/MatchOdds.tsx
"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, Target, Flame } from 'lucide-react';

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
  awayShots = 0
}: MatchOddsProps) {
  
  // Calculate win probability based on score, time, and stats
  const calculateWinProbability = () => {
    const timeRemaining = (90 - minute) / 90;
    const scoreDiff = homeScore - awayScore;
    
    // Base probability from score
    let homeProb = 33;
    let awayProb = 33;
    let drawProb = 34;
    
    if (scoreDiff > 0) {
      homeProb = 50 + (scoreDiff * 15) + (timeRemaining * 20);
      awayProb = 15 - (scoreDiff * 5);
      drawProb = 35 - (scoreDiff * 5);
    } else if (scoreDiff < 0) {
      homeProb = 15 - (Math.abs(scoreDiff) * 5);
      awayProb = 50 + (Math.abs(scoreDiff) * 15) + (timeRemaining * 20);
      drawProb = 35 - (Math.abs(scoreDiff) * 5);
    } else {
      // Draw - adjust based on shots/possession
      const homeAdvantage = (homePossession - 50) / 10 + (homeShots - awayShots) / 20;
      homeProb = 33 + homeAdvantage * 10;
      awayProb = 33 - homeAdvantage * 5;
      drawProb = 34 - Math.abs(homeAdvantage) * 5;
    }
    
    // Clamp values
    return {
      home: Math.min(85, Math.max(5, Math.round(homeProb))),
      away: Math.min(85, Math.max(5, Math.round(awayProb))),
      draw: Math.min(50, Math.max(10, Math.round(drawProb)))
    };
  };
  
  const probabilities = calculateWinProbability();
  
  // Determine momentum
  const getMomentum = () => {
    const homeRecent = homeShots > awayShots ? homeShots - awayShots : 0;
    const awayRecent = awayShots > homeShots ? awayShots - homeShots : 0;
    
    if (homeRecent > awayRecent + 2) return { team: homeTeam, trend: 'up', intensity: 'high' };
    if (awayRecent > homeRecent + 2) return { team: awayTeam, trend: 'up', intensity: 'high' };
    if (homeRecent > awayRecent) return { team: homeTeam, trend: 'up', intensity: 'low' };
    if (awayRecent > homeRecent) return { team: awayTeam, trend: 'up', intensity: 'low' };
    return { team: null, trend: 'flat', intensity: 'none' };
  };
  
  const momentum = getMomentum();
  
  // Get key moment prediction
  const getKeyMoment = () => {
    const timeRemaining = 90 - minute;
    if (timeRemaining < 5) return "Final minutes! Expect drama!";
    if (probabilities.home > 60) return `${homeTeam} pushing for another goal`;
    if (probabilities.away > 60) return `${awayTeam} threatening to score`;
    if (Math.abs(probabilities.home - probabilities.away) < 10) return "Tight contest! Next goal crucial";
    return "End-to-end action";
  };
  
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-500" />
          <span className="text-xs font-bold uppercase tracking-wider">Live Win Probability</span>
        </div>
        <div className="flex items-center gap-1">
          <Target size={10} className="text-gray-500" />
          <span className="text-[9px] text-gray-400">Powered by AI • Updated live</span>
        </div>
      </div>
      
      {/* Probability Bars */}
      <div className="space-y-3">
        {/* Home Team */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold">{homeTeam}</span>
            <span className="text-yellow-500 font-bold">{probabilities.home}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
              style={{ width: `${probabilities.home}%` }}
            />
          </div>
        </div>
        
        {/* Draw */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Draw</span>
            <span className="text-gray-400">{probabilities.draw}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${probabilities.draw}%` }}
            />
          </div>
        </div>
        
        {/* Away Team */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-bold">{awayTeam}</span>
            <span className="text-yellow-500 font-bold">{probabilities.away}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${probabilities.away}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Momentum Indicator */}
      <div className="mt-4 pt-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={14} className="text-orange-500" />
            <span className="text-[10px] text-gray-400 uppercase">Momentum</span>
          </div>
          {momentum.team ? (
            <div className="flex items-center gap-1">
              {momentum.trend === 'up' ? (
                <TrendingUp size={12} className="text-green-400" />
              ) : (
                <Minus size={12} className="text-gray-400" />
              )}
              <span className="text-xs font-bold">{momentum.team}</span>
              {momentum.intensity === 'high' && (
                <span className="text-[8px] bg-green-500/20 text-green-400 px-1 py-0.5 rounded">ON FIRE</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500">Even contest</span>
          )}
        </div>
        
        {/* Key Moment Prediction */}
        <div className="mt-2 bg-gray-800/50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Target size={10} className="text-yellow-500" />
            <span className="text-[9px] text-gray-400">KEY MOMENT</span>
          </div>
          <p className="text-xs font-medium mt-1">{getKeyMoment()}</p>
        </div>
      </div>
      
      {/* Stats Row */}
      <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[9px] text-gray-400">Possession</p>
          <div className="flex justify-between text-xs mt-1">
            <span>{Math.round(homePossession)}%</span>
            <span className="text-gray-600">|</span>
            <span>{Math.round(awayPossession)}%</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] text-gray-400">Shots</p>
          <div className="flex justify-between text-xs mt-1">
            <span>{homeShots}</span>
            <span className="text-gray-600">|</span>
            <span>{awayShots}</span>
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-[8px] text-gray-500 text-center mt-3">
        Probabilities based on live match data • For entertainment only
      </p>
    </div>
  );
}