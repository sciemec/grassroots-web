// src/components/MatchHeader.tsx
'use client';

interface MatchHeaderProps {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute?: string;
  status: string;
  stadium?: string;
}

export function MatchHeader({ 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  minute, 
  status,
  stadium 
}: MatchHeaderProps) {
  const isLive = status === 'live';
  
  return (
    <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-200">
      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <span className="text-gray-400 text-xs uppercase">HOME</span>
          <p className="text-gray-800 font-bold text-xl mt-1">{homeTeam}</p>
          <p className="text-4xl font-black text-[#1a5c2a] mt-1">{homeScore}</p>
        </div>
        <div className="text-center px-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-500 text-xs font-mono">VS</span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 font-mono">
            {isLive ? minute : 'Scheduled'}
          </div>
          {isLive && (
            <div className="mt-1 text-[9px] text-red-500 font-bold animate-pulse">
              ● LIVE
            </div>
          )}
        </div>
        <div className="text-center flex-1">
          <span className="text-gray-400 text-xs uppercase">AWAY</span>
          <p className="text-gray-800 font-bold text-xl mt-1">{awayTeam}</p>
          <p className="text-4xl font-black text-[#1a5c2a] mt-1">{awayScore}</p>
        </div>
      </div>
      {stadium && (
        <div className="flex justify-center items-center gap-2 mt-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
          <span>📍 {stadium}</span>
        </div>
      )}
    </div>
  );
}