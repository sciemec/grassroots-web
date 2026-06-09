// components/world-cup/PlayerDetailModal.tsx
"use client";

import { useState, useEffect } from 'react';
import { X, TrendingUp, Target, Shield, Award, Clock, Loader2 } from 'lucide-react';

interface PlayerDetailModalProps {
  player: any;
  onClose: () => void;
}

export function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  const [additionalStats, setAdditionalStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/world-cup/players/${player.playerId}`);
        const data = await response.json();
        if (data.success) {
          setAdditionalStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch player details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerDetails();
  }, [player.playerId]);
  
  const stats = additionalStats || player;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-5 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black">{stats.playerName}</h2>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">#{player.rank}</span>
              </div>
              <p className="text-white/70">{stats.country} • #{stats.shirtNumber}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#f0b429]" size={24} />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-2xl font-bold text-white">{stats.matchesPlayed}</p>
                  <p className="text-[10px] text-gray-400">Matches</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-3 text-center">
                  <TrendingUp size={16} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-2xl font-bold text-white">{stats.minutesPlayed}</p>
                  <p className="text-[10px] text-gray-400">Minutes</p>
                </div>
              </div>
              
              {/* Attacking Stats */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Target size={14} className="text-[#f0b429]" />
                  Attacking
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400">Goals</p>
                    <p className="text-xl font-bold text-yellow-500">{stats.goals}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Assists</p>
                    <p className="text-xl font-bold text-blue-400">{stats.assists}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Shots</p>
                    <p className="text-sm text-gray-300">{stats.shots} ({stats.shotsOnTarget} on target)</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Pass Accuracy</p>
                    <p className="text-sm text-gray-300">{(stats.passAccuracy ?? 0).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
              
              {/* Defensive Stats */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Shield size={14} className="text-green-500" />
                  Defensive
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-400">Tackles</p>
                    <p className="text-sm text-gray-300">{stats.tackles}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Interceptions</p>
                    <p className="text-sm text-gray-300">{stats.interceptions}</p>
                  </div>
                  {(stats.saves > 0 || stats.cleanSheets > 0) && (
                    <>
                      <div>
                        <p className="text-[10px] text-gray-400">Saves</p>
                        <p className="text-sm text-gray-300">{stats.saves}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Clean Sheets</p>
                        <p className="text-sm text-gray-300">{stats.cleanSheets}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Discipline */}
              {(stats.yellowCards > 0 || stats.redCards > 0) && (
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-2">Discipline</h3>
                  <div className="flex gap-3">
                    {stats.yellowCards > 0 && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                        🟨 {stats.yellowCards}
                      </span>
                    )}
                    {stats.redCards > 0 && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                        🟥 {stats.redCards}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Performance Score */}
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-4 text-center">
                <Award size={20} className="mx-auto text-[#f0b429] mb-2" />
                <p className="text-[10px] text-gray-400">Performance Score</p>
                <p className="text-3xl font-black text-[#f0b429]">{(stats.performanceScore ?? 0).toFixed(1)}</p>
                <p className="text-[10px] text-gray-500 mt-1">Rank #{stats.rank} in tournament</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}