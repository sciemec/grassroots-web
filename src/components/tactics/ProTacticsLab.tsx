// src/components/tactics/ProTacticsLab.tsx
"use client";

import { useState, useEffect } from 'react';
import { FootyPitch } from '@/components/FootyPitch';
import { startBallTracking, BallUpdate, PlayerMovement, getPlayerPositions, startPlayerTracking } from '@/lib/tactics-tracker';

interface Player {
  id: string;
  name: string;
  position: 'GK' | 'RB' | 'CB' | 'LB' | 'CDM' | 'CM' | 'CAM' | 'RW' | 'LW' | 'ST';
  number: number;
  team: 'home' | 'away';
}

interface ProTacticsLabProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  homePlayers: Player[];
  awayPlayers: Player[];
  selectedPlayerId?: string;
  onPlayerSelect?: (playerId: string) => void;
}

export function ProTacticsLab({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  minute: initialMinute,
  homePlayers,
  awayPlayers,
  selectedPlayerId,
  onPlayerSelect
}: ProTacticsLabProps) {
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [currentMinute, setCurrentMinute] = useState(initialMinute);
  const [playerMovements, setPlayerMovements] = useState<PlayerMovement[]>([]);
  const [selectedPlayerData, setSelectedPlayerData] = useState<PlayerMovement | null>(null);
  const [activeTab, setActiveTab] = useState<'tracker' | 'heatmap' | 'passing' | 'stats'>('tracker');
  
  // Get all players
  const allPlayers = [...homePlayers, ...awayPlayers];
  const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId);
  
  useEffect(() => {
    // Start tracking ball movement
    const stopTracking = startBallTracking(matchId, (update) => {
      setBallPos({ x: update.x, y: update.y });
    }, 3000);
    
    // Start tracking player movements
    const stopPlayerTracking = startPlayerTracking(matchId, (movements) => {
      setPlayerMovements(movements);
      if (selectedPlayerId) {
        const playerData = movements.find(m => m.playerId === selectedPlayerId);
        setSelectedPlayerData(playerData || null);
      }
    }, 5000);
    
    // Minute counter
    const minuteInterval = setInterval(() => {
      setCurrentMinute(prev => Math.min(prev + 1, 90));
    }, 60000);
    
    return () => {
      stopTracking();
      stopPlayerTracking();
      clearInterval(minuteInterval);
    };
  }, [matchId, selectedPlayerId]);
  
  // Get learning tip based on selected player's position
  const getLearningTip = (position: string): string => {
    const tips: Record<string, string> = {
      'GK': "Watch how the goalkeeper positions themselves relative to the ball. They should always be centered between the goal and the ball.",
      'RB': "Notice when the right back pushes forward vs stays back. It depends on which winger has the ball.",
      'CB': "Watch the defensive line. They move together as a unit, not individually.",
      'LB': "Observe the left back's body position. Always open to the field, never square.",
      'CDM': "The defensive midfielder sits in the 'hole' - protecting the back four and connecting to attackers.",
      'CM': "Watch how central midfielders check their shoulders before receiving the ball.",
      'CAM': "The attacking midfielder finds spaces between the lines - where defenders aren't.",
      'RW': "Right wingers stay wide to stretch the defense, then cut inside.",
      'LW': "Left wingers do the same - wide to stretch, inside to shoot.",
      'ST': "Strikers movement is about timing - watch when they go vs when they wait."
    };
    return tips[position] || "Watch how this player moves off the ball - that's where elite players separate themselves.";
  };
  
  return (
    <div className="bg-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a5c2a] to-[#0d3d1a] p-4">
        <h2 className="text-white font-bold text-lg">🎓 Pro Tactics Lab</h2>
        <p className="text-white/60 text-xs">Learn how professionals play your position</p>
      </div>
      
      <div className="p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-800 pb-2">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tracker' ? 'bg-[#1a5c2a] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎯 Live Tracker
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'heatmap' ? 'bg-[#1a5c2a] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🔥 Heatmap
          </button>
          <button
            onClick={() => setActiveTab('passing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'passing' ? 'bg-[#1a5c2a] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            🧠 Passing Network
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'stats' ? 'bg-[#1a5c2a] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Position Stats
          </button>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Pitch */}
          <div className="lg:col-span-2">
            <FootyPitch 
              ballPosition={ballPos}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeScore={homeScore}
              awayScore={awayScore}
              minute={currentMinute}
              players={activeTab === 'tracker' ? allPlayers : undefined}
              selectedPlayerId={selectedPlayerId}
              onPlayerClick={onPlayerSelect}
              heatmapData={activeTab === 'heatmap' && selectedPlayerId ? selectedPlayerData?.positions : undefined}
            />
          </div>
          
          {/* Right: Learning Panel */}
          <div className="space-y-4">
            {/* Player Selection */}
            <div className="bg-gray-800 rounded-lg p-3">
              <h3 className="text-white text-xs font-bold mb-2">📋 SELECT A PLAYER TO STUDY</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {allPlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => onPlayerSelect?.(player.id)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedPlayerId === player.id 
                        ? 'bg-[#1a5c2a] text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-gray-400 w-6 inline-block">
                      #{player.number}
                    </span>
                    <span className="font-medium">{player.name}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{player.position}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Learning Card (shows when player selected) */}
            {selectedPlayer && (
              <div className="bg-amber-900/30 border border-amber-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">
                    {selectedPlayer.position === 'GK' && '🧤'}
                    {selectedPlayer.position === 'CB' && '🛡️'}
                    {selectedPlayer.position === 'CM' && '⚡'}
                    {selectedPlayer.position === 'ST' && '⚽'}
                    {!['GK','CB','CM','ST'].includes(selectedPlayer.position) && '🎯'}
                  </span>
                  <div>
                    <h3 className="text-white font-bold">{selectedPlayer.name}</h3>
                    <p className="text-amber-400 text-xs">{selectedPlayer.position} • #{selectedPlayer.number}</p>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 mb-3">
                  <p className="text-amber-300 text-xs font-bold mb-1">📖 LEARNING TIP</p>
                  <p className="text-white/80 text-sm">
                    {getLearningTip(selectedPlayer.position)}
                  </p>
                </div>
                
                {selectedPlayerData && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Distance covered:</span>
                      <span className="text-white font-mono">{selectedPlayerData.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Top speed:</span>
                      <span className="text-white font-mono">{selectedPlayerData.topSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Touches:</span>
                      <span className="text-white font-mono">{selectedPlayerData.touches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Passes completed:</span>
                      <span className="text-white font-mono">{selectedPlayerData.passes}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Educational Note */}
            <div className="bg-blue-900/30 border border-blue-700/30 rounded-lg p-3">
              <p className="text-blue-300 text-[10px] font-bold mb-1">💡 WHY THIS MATTERS</p>
              <p className="text-white/60 text-[10px]">
                Understanding professional positioning helps you make better decisions on the pitch. 
                Watch, learn, and apply to your own game.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}