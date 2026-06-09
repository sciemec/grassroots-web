// components/world-cup/PerformanceLeaderboard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Trophy, Medal, Flame, Target, Users, TrendingUp, Filter, ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import { PlayerDetailModal } from './PlayerDetailModal';

interface Player {
  rank: number;
  playerId: string;
  playerName: string;
  country: string;
  position: string;
  shirtNumber: number;
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  saves: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
  avgRating: number;
  performanceScore: number;
}

export function PerformanceLeaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<string>('performanceScore');
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [countries, setCountries] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, selectedPosition, selectedCountry]);
  
  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (sortBy !== 'performanceScore') params.append('sortBy', sortBy);
      if (selectedPosition !== 'ALL') params.append('position', selectedPosition);
      if (selectedCountry) params.append('country', selectedCountry);
      params.append('limit', '50');
      
      const response = await fetch(`/api/world-cup/leaderboard?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setPlayers(data.data);
        if (data.availableCountries && countries.length === 0) {
          setCountries(data.availableCountries);
        }
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeaderboard();
  };
  
  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-600';
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#f0b429]" size={40} />
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-gray-900 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Trophy size={24} className="text-[#f0b429]" />
                <h2 className="text-xl font-black text-white">World Cup 2026</h2>
              </div>
              <p className="text-white/60 text-sm mt-1">Top performers of the tournament</p>
              {lastUpdated && (
                <p className="text-[10px] text-white/40 mt-1">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-white text-sm hover:bg-white/20 transition-colors"
              >
                <Filter size={14} />
                Filters
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-800 bg-gray-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                >
                  <option value="performanceScore">🏆 Overall Performance</option>
                  <option value="goals">⚽ Most Goals</option>
                  <option value="assists">🎯 Most Assists</option>
                  <option value="avgRating">⭐ Highest Rating</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Position</label>
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                >
                  <option value="ALL">All Positions</option>
                  <option value="FW">⚽ Forwards</option>
                  <option value="MF">🎯 Midfielders</option>
                  <option value="DF">🛡️ Defenders</option>
                  <option value="GK">🧤 Goalkeepers</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]"
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-gray-800">
          <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-400">Total Goals</p>
            <p className="text-xl font-bold text-white">
              {players.reduce((sum, p) => sum + p.goals, 0)}
            </p>
          </div>
          <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-400">Total Assists</p>
            <p className="text-xl font-bold text-white">
              {players.reduce((sum, p) => sum + p.assists, 0)}
            </p>
          </div>
          <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-400">Players Tracked</p>
            <p className="text-xl font-bold text-white">{players.length}</p>
          </div>
          <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-400">Countries</p>
            <p className="text-xl font-bold text-white">{countries.length}</p>
          </div>
          <div className="bg-gray-900 p-3 text-center">
            <p className="text-[10px] text-gray-400">Matches</p>
            <p className="text-xl font-bold text-white">48+</p>
          </div>
        </div>
        
        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">RANK</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">PLAYER</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">POS</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">MP</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">⚽</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">🎯</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">🛡️</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">🧤</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">⭐</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {players.map((player) => (
                <tr 
                  key={player.playerId} 
                  className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {player.rank <= 3 ? (
                        <Medal size={20} className={getMedalColor(player.rank)} />
                      ) : (
                        <span className="text-sm text-gray-500 w-5">#{player.rank}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{player.playerName}</p>
                      <p className="text-[10px] text-gray-400">{player.country}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      player.position === 'FW' ? 'bg-red-500/20 text-red-400' :
                      player.position === 'MF' ? 'bg-blue-500/20 text-blue-400' :
                      player.position === 'DF' ? 'bg-green-500/20 text-green-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300">
                    {player.matchesPlayed}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-bold text-yellow-500">{player.goals}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-blue-400">
                    {player.assists}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-green-400">
                    {player.tackles + player.interceptions}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-purple-400">
                    {player.saves > 0 ? player.saves : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame size={12} className="text-orange-500" />
                      <span className="text-sm font-bold text-white">{player.performanceScore.toFixed(1)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-800 text-center">
          <p className="text-[10px] text-gray-500">
            Performance score calculated based on goals, assists, defensive actions, and match impact.
            Data updates automatically after each match via Sportmonks API integration.
          </p>
        </div>
      </div>
      
      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </>
  );
}