// src/components/FootballPitch.tsx
'use client';

import { useRef, useEffect } from 'react';

interface Player {
  id: string;
  number: number;
  name: string;
  x: number;
  y: number;
}

interface FootballPitchProps {
  ballPosition?: { x: number; y: number };
  homePlayers?: Player[];
  awayPlayers?: Player[];
  possession?: 'home' | 'away' | 'neutral';
  pitchLogoLeftUrl?: string | null;
  pitchLogoRightUrl?: string | null;
  pitchSponsorName?: string | null;
}

export function FootballPitch({ 
  ballPosition, 
  homePlayers = [], 
  awayPlayers = [],
  possession = 'neutral',
  pitchLogoLeftUrl,
  pitchLogoRightUrl,
  pitchSponsorName
}: FootballPitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 900;
  const height = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw pitch background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a5c2a');
    grad.addColorStop(0.5, '#0e4a1e');
    grad.addColorStop(1, '#0a3d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Grass stripes
    ctx.fillStyle = '#0a3d16';
    for (let i = 0; i < width; i += 40) ctx.fillRect(i, 0, 20, height);
    ctx.fillStyle = '#1a5c2a';
    for (let i = 20; i < width; i += 40) ctx.fillRect(i, 0, 20, height);

    // Pitch lines
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 40, width - 80, height - 80);
    ctx.beginPath();
    ctx.moveTo(width / 2, 40);
    ctx.lineTo(width / 2, height - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 45, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.strokeRect(40, height / 2 - 90, 90, 180);
    ctx.strokeRect(width - 130, height / 2 - 90, 90, 180);

    // Goals
    ctx.fillStyle = '#ddd';
    ctx.fillRect(25, height / 2 - 40, 15, 80);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(22, height / 2 - 42, 3, 84);
    ctx.fillRect(width - 40, height / 2 - 40, 15, 80);
    ctx.fillRect(width - 25, height / 2 - 42, 3, 84);

    // Draw home players (green)
    if (homePlayers && homePlayers.length > 0) {
      homePlayers.forEach(player => {
        if (!player) return;
        const x = 40 + (player.x / 100) * (width - 80);
        const y = 40 + (player.y / 100) * (height - 80);
        
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = possession === 'home' ? '#00ff00' : '#00aa00';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        if (player.number !== undefined && player.number !== null) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.number), x, y);
        }
      });
    }

    // Draw away players (red)
    if (awayPlayers && awayPlayers.length > 0) {
      awayPlayers.forEach(player => {
        if (!player) return;
        const x = 40 + (player.x / 100) * (width - 80);
        const y = 40 + (player.y / 100) * (height - 80);
        
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = possession === 'away' ? '#ff0000' : '#cc0000';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        if (player.number !== undefined && player.number !== null) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.number), x, y);
        }
      });
    }

    // Draw ball
    if (ballPosition) {
      const x = 40 + (ballPosition.x / 100) * (width - 80);
      const y = 40 + (ballPosition.y / 100) * (height - 80);
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x + 4, y + 6, 9, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Sponsor text
    ctx.font = 'bold 24px "Inter", system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pitchSponsorName ? pitchSponsorName.toUpperCase() : "GRASSROOTS SPORTS", width / 2, height / 2 + 40);
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(240, 180, 41, 0.4)';
    ctx.fillText("grassrootssports.live", width / 2, height / 2 + 85);

    // Possession indicator
    if (possession !== 'neutral') {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(
        possession === 'home' ? '🔵 Home Possession' : '🔴 Away Possession',
        20, 20
      );
    }
  }, [ballPosition, homePlayers, awayPlayers, possession, pitchLogoLeftUrl, pitchLogoRightUrl, pitchSponsorName]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full rounded-xl shadow-2xl border border-[#f0b429]/20" />;
}