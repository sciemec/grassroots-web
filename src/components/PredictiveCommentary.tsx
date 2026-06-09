// components/PredictiveCommentary.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  calculateGoalProbability, 
  calculateFoulProbability, 
  calculateSprintProbability,
  generatePredictiveCommentary,
  type PlayerProfile,
  type Prediction
} from '@/lib/player-predictions';
import { getAudioCommentary } from '@/lib/audio-commentary';

interface PredictiveCommentaryProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homePlayers: PlayerProfile[];
  awayPlayers: PlayerProfile[];
}

export function PredictiveCommentary({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  homePlayers, 
  awayPlayers 
}: PredictiveCommentaryProps) {
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [ballCarrier, setBallCarrier] = useState<PlayerProfile | null>(null);
  const [isIntense, setIsIntense] = useState(false);
  const audio = getAudioCommentary();
  
  // Simulate ball carrier changes (in production, this comes from live data)
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly select a player to have the ball
      const allPlayers = [...homePlayers, ...awayPlayers];
      const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];
      setBallCarrier(randomPlayer);
      
      // Generate prediction for this player
      generatePrediction(randomPlayer);
      
    }, 15000); // Every 15 seconds
    
    return () => clearInterval(interval);
  }, [homePlayers, awayPlayers]);
  
  const generatePrediction = (player: PlayerProfile) => {
    // Mock game state (in production, comes from API)
    const gameState = {
      ballPosition: { x: 65 + Math.random() * 30, y: 30 + Math.random() * 40 },
      timeMinute: 45 + Math.random() * 45,
      homeScore: Math.floor(Math.random() * 3),
      awayScore: Math.floor(Math.random() * 3),
      homePossession: 45 + Math.random() * 20,
      awayPossession: 45 + Math.random() * 20
    };
    
    // Calculate various probabilities
    const goalProb = calculateGoalProbability(player, gameState, true);
    const foulProb = calculateFoulProbability(player, gameState, Math.random() > 0.5);
    const sprintProb = calculateSprintProbability(player, gameState);
    
    // Determine which event is most likely
    let prediction: Prediction | null = null;
    let excitementLevel: 'low' | 'medium' | 'high' | 'explosive' = 'medium';
    
    if (goalProb > 60) {
      excitementLevel = goalProb > 80 ? 'explosive' : 'high';
      prediction = {
        playerId: player.id,
        playerName: player.name,
        eventType: 'goal',
        probability: goalProb,
        excitementLevel,
        triggerPhrase: `${player.name} IN THE DANGER ZONE!`,
        celebrationPhrase: `WHAT A PREDICTION! ${player.name} DELIVERS!`
      };
    } else if (sprintProb > 60) {
      excitementLevel = sprintProb > 75 ? 'high' : 'medium';
      prediction = {
        playerId: player.id,
        playerName: player.name,
        eventType: 'sprint',
        probability: sprintProb,
        excitementLevel,
        triggerPhrase: `Watch ${player.name} EXPLODE down the wing!`,
        celebrationPhrase: `UNSTOPPABLE! ${player.name} leaves defenders for dead!`
      };
    } else if (foulProb > 40) {
      prediction = {
        playerId: player.id,
        playerName: player.name,
        eventType: 'foul',
        probability: foulProb,
        excitementLevel: 'medium',
        triggerPhrase: `DANGER! ${player.name} is about to make a challenge!`,
        celebrationPhrase: `The referee reaches for his pocket!`
      };
    }
    
    if (prediction) {
      setCurrentPrediction(prediction);
      
      // Generate and speak the commentary
      const commentary = generatePredictiveCommentary(prediction, player, gameState);
      const excitementVolume = excitementLevel === 'explosive' ? 1.2 : 
                               excitementLevel === 'high' ? 1.1 : 0.95;
      
      audio.speak(commentary, 0.95, excitementVolume);
      
      // Set intense mode for explosive predictions
      setIsIntense(excitementLevel === 'explosive');
      setTimeout(() => setIsIntense(false), 3000);
    }
  };
  
  return (
    <div className={`rounded-xl p-4 transition-all duration-300 ${
      isIntense 
        ? 'bg-gradient-to-r from-red-600 to-orange-600 animate-pulse shadow-lg' 
        : 'bg-gradient-to-r from-purple-900 to-purple-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isIntense ? 'bg-yellow-400 animate-ping' : 'bg-green-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            AI PREDICTION ENGINE
          </span>
        </div>
        {currentPrediction && (
          <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full">
            {currentPrediction.probability}% confidence
          </span>
        )}
      </div>
      
      {currentPrediction ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`text-lg ${isIntense ? 'animate-bounce' : ''}`}>
              {currentPrediction.eventType === 'goal' && '⚽'}
              {currentPrediction.eventType === 'sprint' && '💨'}
              {currentPrediction.eventType === 'foul' && '🟨'}
              {currentPrediction.eventType === 'yellow_card' && '🟨'}
            </div>
            <p className="text-sm font-bold">
              {currentPrediction.triggerPhrase}
            </p>
          </div>
          
          <div className="bg-black/30 rounded-lg p-2 mt-2">
            <p className="text-xs">
              {currentPrediction.playerName} • {currentPrediction.probability}% chance
              {currentPrediction.eventType === 'goal' && ' to score'}
              {currentPrediction.eventType === 'sprint' && ' to sprint'}
              {currentPrediction.eventType === 'foul' && ' to commit a foul'}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/50">Analyzing player patterns...</p>
      )}
      
      {/* Prediction meter */}
      {currentPrediction && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                currentPrediction.probability > 80 ? 'bg-red-500' :
                currentPrediction.probability > 60 ? 'bg-orange-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${currentPrediction.probability}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}