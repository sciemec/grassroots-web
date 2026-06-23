// src/app/worldcup/live/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useLiveMatches } from '@/hooks/useLiveMatch';
import { useState, useEffect, useRef } from 'react';

interface Player {
  id: string;
  number: number;
  name: string;
  x: number;
  y: number;
}

// Inline FootballPitch component
function FootballPitch({ 
  ballPosition, 
  homePlayers = [], 
  awayPlayers = [],
  possession = 'neutral'
}: { 
  ballPosition?: { x: number; y: number };
  homePlayers?: Player[];
  awayPlayers?: Player[];
  possession?: 'home' | 'away' | 'neutral';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 900;
  const height = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Draw pitch
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1a5c2a');
    grad.addColorStop(0.5, '#0e4a1e');
    grad.addColorStop(1, '#0a3d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#0a3d16';
    for (let i = 0; i < width; i += 40) ctx.fillRect(i, 0, 20, height);
    ctx.fillStyle = '#1a5c2a';
    for (let i = 20; i < width; i += 40) ctx.fillRect(i, 0, 20, height);

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

    ctx.fillStyle = '#ddd';
    ctx.fillRect(25, height / 2 - 40, 15, 80);
    ctx.fillStyle = '#aaa';
    ctx.fillRect(22, height / 2 - 42, 3, 84);
    ctx.fillRect(width - 40, height / 2 - 40, 15, 80);
    ctx.fillRect(width - 25, height / 2 - 42, 3, 84);

    // Draw players
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
        if (player.number) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.number), x, y);
        }
      });
    }

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
        if (player.number) {
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

    ctx.font = 'bold 24px "Inter", system-ui';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("GRASSROOTS SPORTS", width / 2, height / 2 + 40);

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
  }, [ballPosition, homePlayers, awayPlayers, possession]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full rounded-xl shadow-2xl border border-[#f0b429]/20" />;
}

// Main Page Component
export default function LiveMatchPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const { matches, isLoading, error } = useLiveMatches();
  
  const LIVE_STATUSES = [1, 2, 3, 4, 5];
  const match = matches?.find((m) => m.matchId === matchId);
  
  const [ballPosition, setBallPosition] = useState({ x: 55, y: 50 });
  const [events] = useState<any[]>([]);
  const emptyPlayers: Player[] = [];
  
  useEffect(() => {
    if (!match || !LIVE_STATUSES.includes(match.status)) return;
    const interval = setInterval(() => {
      setBallPosition(prev => ({ 
        x: Math.min(95, Math.max(5, prev.x + (Math.random() - 0.5) * 3)), 
        y: Math.min(95, Math.max(5, prev.y + (Math.random() - 0.5) * 2)) 
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [match]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2ee]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1a5c2a] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading match...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2ee]">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md">
          <p className="text-red-600">{error}</p>
          <a href="/worldcup" className="mt-4 inline-block px-4 py-2 bg-[#1a5c2a] text-white rounded-lg hover:bg-[#0d3d1a] transition">
            Back to World Cup
          </a>
        </div>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f2ee]">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Match Not Found</h1>
          <p className="text-gray-500 mb-4">The match you're looking for doesn't exist or isn't available.</p>
          <a href="/worldcup" className="inline-block px-4 py-2 bg-[#1a5c2a] text-white rounded-lg hover:bg-[#0d3d1a] transition">
            Back to World Cup
          </a>
        </div>
      </div>
    );
  }
  
  const isLive = LIVE_STATUSES.includes(match.status);
  
  return (
    <div className="min-h-screen bg-[#f4f2ee]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white border-b-4 border-[#f0b429]">
        <div className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f0b429] rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-sm">GRS</span>
              </div>
              <h1 className="text-xl font-black tracking-tight">Live Match</h1>
              {isLive && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <a href="/worldcup" className="text-white/70 hover:text-white text-sm">
              ← Back
            </a>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Match Header */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <span className="text-gray-400 text-xs uppercase">HOME</span>
                  <p className="text-gray-800 font-bold text-xl mt-1">{match.homeName || 'Home'}</p>
                  <p className="text-4xl font-black text-[#1a5c2a] mt-1">{match.homeScore ?? 0}</p>
                </div>
                <div className="text-center px-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500 text-xs font-mono">VS</span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500 font-mono">
                    {isLive ? `${match.extraExplain?.minute ?? 0}'` : 'Scheduled'}
                  </div>
                  {isLive && (
                    <div className="mt-1 text-[9px] text-red-500 font-bold animate-pulse">● LIVE</div>
                  )}
                </div>
                <div className="text-center flex-1">
                  <span className="text-gray-400 text-xs uppercase">AWAY</span>
                  <p className="text-gray-800 font-bold text-xl mt-1">{match.awayName || 'Away'}</p>
                  <p className="text-4xl font-black text-[#1a5c2a] mt-1">{match.awayScore ?? 0}</p>
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <span>📍 {match.location || 'TBD'}</span>
              </div>
            </div>
            
            {/* Football Pitch */}
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Live Tracker</h3>
              <FootballPitch 
                ballPosition={isLive ? ballPosition : undefined}
                homePlayers={emptyPlayers}
                awayPlayers={emptyPlayers}
                possession="neutral"
              />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">No events yet</p>
              <p className="text-gray-400 text-xs mt-1">Check back for live updates</p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Match Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-bold ${isLive ? 'text-red-500' : 'text-gray-700'}`}>
                    {isLive ? 'Live' : 'Scheduled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stadium</span>
                  <span className="text-gray-700">{match.location || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-700">{new Date(match.matchTime * 1000).toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}