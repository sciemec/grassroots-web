// app/world-cup/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Trophy, Radio, Calendar } from 'lucide-react';
import { LiveCommentary } from '@/components/LiveCommentary';
import { Sidebar } from '@/components/layout/sidebar';

interface LiveMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
}

export default function WorldCupPage() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/world-cup/matches');
      const data = await response.json();
      
      if (response.ok) {
        setLiveMatches(data.live || []);
        setUpcomingMatches(data.upcoming || []);
        
        // Auto-select first live match if none selected
        if (data.live && data.live.length > 0 && !selectedMatch) {
          setSelectedMatch(data.live[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f2ee]">
      <Sidebar />
      
      <main className="flex-1 lg:ml-72">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] text-white">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex items-center gap-3">
              <Trophy size={28} className="text-[#f0b429]" />
              <h1 className="text-2xl font-black">FIFA World Cup 2026</h1>
            </div>
            <p className="text-white/70 text-sm mt-1">
              Live audio commentary for all matches
            </p>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Match List */}
            <div className="lg:col-span-1 space-y-6">
              {/* Live Matches */}
              {liveMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Radio size={14} className="text-red-500 animate-pulse" />
                    <h2 className="text-sm font-bold text-gray-900">LIVE NOW ({liveMatches.length})</h2>
                  </div>
                  <div className="space-y-2">
                    {liveMatches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatch(match)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          selectedMatch?.id === match.id
                            ? 'bg-[#1a5c2a] text-white shadow-md'
                            : 'bg-white border border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold">{match.homeTeam}</span>
                          <span className="text-lg font-black">{match.homeScore}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{match.awayTeam}</span>
                          <span className="text-lg font-black">{match.awayScore}</span>
                        </div>
                        <div className="mt-2 text-[10px] opacity-60">
                          {match.minute}' minute
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-gray-500" />
                    <h2 className="text-sm font-bold text-gray-900">UPCOMING</h2>
                  </div>
                  <div className="space-y-2">
                    {upcomingMatches.map((match) => (
                      <div key={match.id} className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                          <span>{match.homeTeam}</span>
                          <span className="text-gray-400">vs</span>
                          <span>{match.awayTeam}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                          <Calendar size={10} />
                          <span>{new Date(match.utcDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Commentary Player */}
            <div className="lg:col-span-2">
              {selectedMatch ? (
                <LiveCommentary
                  matchId={selectedMatch.id.toString()}
                  homeTeam={selectedMatch.homeTeam}
                  awayTeam={selectedMatch.awayTeam}
                />
              ) : liveMatches.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                  <Radio size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No Live Matches</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Check back during match hours
                  </p>
                  <p className="text-xs text-gray-400 mt-4">
                    Live commentary available for all World Cup matches
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}