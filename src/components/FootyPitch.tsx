// src/components/FootyPitch.tsx
"use client";

import { useEffect, useState, useRef } from 'react';

interface BallPosition {
  x: number;  // 0 to 100 (0 = left goal, 100 = right goal)
  y: number;  // 0 to 100 (0 = top touchline, 100 = bottom touchline)
}

interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  team: 'home' | 'away';
}

interface FootyPitchProps {
  ballPosition?: BallPosition;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  onBallUpdate?: (pos: BallPosition) => void;
  players?: Player[];
  selectedPlayerId?: string;
  onPlayerClick?: (playerId: string) => void;
  heatmapData?: Array<{ x: number; y: number; minute: number }>;
}

export function FootyPitch({ 
  ballPosition = { x: 50, y: 50 }, 
  homeTeam = "Home", 
  awayTeam = "Away",
  homeScore = 0,
  awayScore = 0,
  minute = 0,
  onBallUpdate 
}: FootyPitchProps) {
  
  // Convert 0-100 coordinate to SVG pixel (0-600 width, 0-400 height)
  const toSvgX = (x: number) => (x / 100) * 600;
  const toSvgY = (y: number) => (y / 100) * 400;
  
  return (
    <div className="relative bg-green-800 rounded-xl overflow-hidden shadow-lg">
      {/* Score banner */}
      <div className="absolute top-2 left-0 right-0 z-10 flex justify-between px-4 py-2 bg-black/60 text-white">
        <div className="text-left">
          <p className="text-xs font-bold">{homeTeam}</p>
          <p className="text-2xl font-black">{homeScore}</p>
        </div>
        <div className="text-center">
          <p className="text-xs opacity-70">{minute}' minute</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold">{awayTeam}</p>
          <p className="text-2xl font-black">{awayScore}</p>
        </div>
      </div>
      
      {/* SVG Pitch */}
      <svg 
        viewBox="0 0 600 400" 
        className="w-full aspect-[3/2] bg-green-700"
        style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 2%, transparent 2.5%)', backgroundSize: '20px 20px' }}
      >
        {/* Outer bounds */}
        <rect x="10" y="10" width="580" height="380" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
        
        {/* Half line */}
        <line x1="300" y1="10" x2="300" y2="390" stroke="white" strokeWidth="2" opacity="0.5"/>
        
        {/* Centre circle */}
        <circle cx="300" cy="200" r="30" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
        
        {/* Centre spot */}
        <circle cx="300" cy="200" r="2" fill="white" opacity="0.8"/>
        
        {/* Left penalty area */}
        <rect x="10" y="130" width="80" height="140" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
        
        {/* Right penalty area */}
        <rect x="510" y="130" width="80" height="140" fill="none" stroke="white" strokeWidth="2" opacity="0.5"/>
        
        {/* Left goal */}
        <rect x="2" y="160" width="8" height="80" fill="white" opacity="0.7"/>
        
        {/* Right goal */}
        <rect x="590" y="160" width="8" height="80" fill="white" opacity="0.7"/>
        
        {/* Ball (yellow circle) */}
        <circle 
          cx={toSvgX(ballPosition.x)} 
          cy={toSvgY(ballPosition.y)} 
          r="6" 
          fill="#f0b429" 
          stroke="#1a5c2a" 
          strokeWidth="1.5"
          className="transition-all duration-300 ease-linear shadow-lg"
        />
      </svg>
      
      {/* Attribution */}
      <div className="absolute bottom-1 right-2 text-[8px] text-white/30">
        GrassRoots Sports Live Tracker
      </div>
    </div>
  );
}