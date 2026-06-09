// src/components/world-cup/MatchCard.tsx
"use client";

import { useState } from 'react';
import { Calendar, Clock, MapPin, Youtube, ExternalLink, Volume2, TrendingUp } from 'lucide-react';
import type { Match } from '@/lib/world-cup-data';

interface HighlightVideo {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  channelTitle: string;
}

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const [highlights, setHighlights] = useState<HighlightVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  
  const isLive = match.status === 'live';
  const matchTime = new Date(`${match.date}T${match.time}:00`);
  const isPast = matchTime < new Date() && match.status !== 'live';
  const isToday = match.date === new Date().toISOString().split('T')[0];
  
  const fetchHighlights = async () => {
    setIsLoading(true);
    try {
      const query = `${match.homeTeam} vs ${match.awayTeam} world cup 2026 highlights`;
      const res = await fetch(`/api/world-cup/highlights?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.videos) {
        setHighlights(data.videos);
        setShowHighlights(true);
      }
    } catch (error) {
      console.error('Failed to fetch highlights:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStatusBadge = () => {
    if (isLive) return <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">LIVE</span>;
    if (isPast) return <span className="bg-gray-500 text-white text-[10px] px-2 py-0.5 rounded-full">Final</span>;
    if (isToday) return <span className="bg-[#f0b429] text-[#1a5c2a] text-[10px] px-2 py-0.5 rounded-full">Today</span>;
    return null;
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Match Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <Calendar size={10} />
            <span>{new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <Clock size={10} />
            <span>{match.time}</span>
            <MapPin size={10} />
            <span>{match.stadium}</span>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-gray-900">{match.homeTeam}</p>
            {match.homeScore !== undefined && <p className="text-2xl font-black text-[#1a5c2a]">{match.homeScore}</p>}
          </div>
          <div className="px-3 text-gray-400 font-bold">VS</div>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-gray-900">{match.awayTeam}</p>
            {match.awayScore !== undefined && <p className="text-2xl font-black text-[#1a5c2a]">{match.awayScore}</p>}
          </div>
        </div>
        
        <div className="text-center mt-2">
          <span className="text-[9px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{match.group}</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-3 flex gap-2">
        {!isPast ? (
          <>
            <button className="flex-1 bg-[#1a5c2a] text-white py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
              <Volume2 size={12} />
              Live Audio
            </button>
            <button className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1">
              <TrendingUp size={12} />
              Odds
            </button>
          </>
        ) : (
          <button
            onClick={fetchHighlights}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
          >
            <Youtube size={12} />
            {isLoading ? 'Searching highlights...' : (showHighlights ? 'Hide highlights' : 'Watch highlights')}
          </button>
        )}
      </div>
      
      {/* Highlights Section */}
      {showHighlights && highlights.length > 0 && (
        <div className="border-t border-gray-100 p-3 bg-gray-50">
          <p className="text-[10px] font-bold text-gray-500 mb-2">MATCH HIGHLIGHTS</p>
          <div className="space-y-2">
            {highlights.map(video => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 bg-white rounded-lg hover:shadow-sm transition-shadow"
              >
                <img src={video.thumbnail} alt="" className="w-16 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{video.title}</p>
                  <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Youtube size={8} /> {video.channelTitle}
                    <ExternalLink size={8} />
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
      
      {showHighlights && highlights.length === 0 && !isLoading && (
        <div className="border-t border-gray-100 p-3 bg-gray-50 text-center text-xs text-gray-500">
          No highlights found. Try again later.
        </div>
      )}
    </div>
  );
}