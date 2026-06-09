// components/FanPrediction.tsx
"use client";

import { useState, useEffect } from 'react';
import { ThumbsUp, Users, Trophy, Star } from 'lucide-react';

interface FanPredictionProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
}

export function FanPrediction({ matchId, homeTeam, awayTeam }: FanPredictionProps) {
  const [userPick, setUserPick] = useState<string | null>(null);
  const [predictions, setPredictions] = useState({ home: 0, away: 0, draw: 0 });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load predictions from localStorage
    const stored = localStorage.getItem(`predictions_${matchId}`);
    if (stored) {
      setPredictions(JSON.parse(stored));
    }
    
    // Load user's pick
    const userStored = localStorage.getItem(`user_pick_${matchId}`);
    if (userStored) {
      setUserPick(userStored);
    }
  }, [matchId]);

  const handlePredict = (pick: string) => {
    setUserPick(pick);
    localStorage.setItem(`user_pick_${matchId}`, pick);
    
    // Update predictions count
    const newPredictions = { ...predictions };
    if (pick === 'home') newPredictions.home++;
    if (pick === 'draw') newPredictions.draw++;
    if (pick === 'away') newPredictions.away++;
    
    setPredictions(newPredictions);
    localStorage.setItem(`predictions_${matchId}`, JSON.stringify(newPredictions));
  };

  const totalVotes = predictions.home + predictions.draw + predictions.away;

  return (
    <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} className="text-purple-300" />
        <span className="text-xs font-bold uppercase tracking-wider">Fan Pulse</span>
        <span className="text-[9px] text-purple-300">{totalVotes} predictions</span>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={() => handlePredict('home')}
          className={`w-full p-2 rounded-lg text-sm font-medium transition-all ${
            userPick === 'home' 
              ? 'bg-green-600 text-white' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          👍 {homeTeam} to win ({predictions.home})
        </button>
        
        <button
          onClick={() => handlePredict('draw')}
          className={`w-full p-2 rounded-lg text-sm font-medium transition-all ${
            userPick === 'draw' 
              ? 'bg-yellow-600 text-white' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          🤝 Draw ({predictions.draw})
        </button>
        
        <button
          onClick={() => handlePredict('away')}
          className={`w-full p-2 rounded-lg text-sm font-medium transition-all ${
            userPick === 'away' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          🔥 {awayTeam} to win ({predictions.away})
        </button>
      </div>
      
      {userPick && (
        <div className="mt-3 p-2 bg-white/10 rounded-lg text-center">
          <p className="text-[10px]">You picked: <span className="font-bold">{userPick === 'home' ? homeTeam : userPick === 'away' ? awayTeam : 'Draw'}</span></p>
          <p className="text-[8px] text-purple-300 mt-1">Share your prediction with friends!</p>
        </div>
      )}
      
      <p className="text-[7px] text-center text-purple-300/50 mt-3">
        No real money involved • Bragging rights only
      </p>
    </div>
  );
}