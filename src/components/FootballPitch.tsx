// src/components/FootballPitch.tsx
'use client';

import { useEffect, useRef } from 'react';
import type { ShotData } from '@/lib/isports/types';

interface FootballPitchProps {
  shots?: ShotData[];
  ballPosition?: { x: number; y: number };
}

export function FootballPitch({ shots = [], ballPosition = { x: 50, y: 50 } }: FootballPitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 800;
  const height = 600;
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grass
    ctx.fillStyle = '#0d5c2a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw pitch markings
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);
    
    // Half line
    ctx.beginPath();
    ctx.moveTo(width / 2, 20);
    ctx.lineTo(width / 2, height - 20);
    ctx.stroke();
    
    // Centre circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 35, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw shots as dots on pitch
    for (const shot of shots) {
      const x = 20 + (shot.coordinate_x / 100) * (width - 40);
      const y = 20 + (shot.coordinate_y / 100) * (height - 40);
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = shot.is_goal ? '#f0b429' : '#ef4444';
      ctx.fill();
      
      // Add glow effect for goals
      if (shot.is_goal) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f0b429';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    // Draw ball position
    const ballX = 20 + (ballPosition.x / 100) * (width - 40);
    const ballY = 20 + (ballPosition.y / 100) * (height - 40);
    
    ctx.beginPath();
    ctx.arc(ballX, ballY, 7, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
  }, [shots, ballPosition]);
  
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-bold text-sm mb-3">🎯 LIVE TACTICAL VIEW</h3>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full rounded-lg shadow-xl"
      />
      <p className="text-[10px] text-gray-500 text-center mt-2">
        Red dots = shots • Gold dots = goals • White ball = live position
      </p>
    </div>
  );
}