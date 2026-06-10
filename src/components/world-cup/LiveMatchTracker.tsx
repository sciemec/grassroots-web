// src/components/world-cup/LiveMatchTracker.tsx
"use client";

import { useState, useEffect } from 'react';
import { FootyPitch } from '@/components/FootyPitch';
import { startBallTracking, BallUpdate } from '@/lib/live-ball-tracker';

interface LiveMatchTrackerProps {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
}

export function LiveMatchTracker({ 
  matchId, 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  minute: initialMinute 
}: LiveMatchTrackerProps) {
  const [ballPos, setBallPos] = useState({ x: 50, y: 50 });
  const [currentMinute, setCurrentMinute] = useState(initialMinute);

  // Sync if parent provides an updated minute (e.g. score refresh)
  useEffect(() => {
    setCurrentMinute(initialMinute);
  }, [initialMinute]);

  useEffect(() => {
    // Start tracking from the current match minute so simulation phase is correct
    const stopTracking = startBallTracking(matchId, (update: BallUpdate) => {
      setBallPos({ x: update.x, y: update.y });
    }, 3000, initialMinute);

    // Simulate minute counter (increase every 60 seconds real time)
    const minuteInterval = setInterval(() => {
      setCurrentMinute(prev => Math.min(prev + 1, 90));
    }, 60000);

    return () => {
      stopTracking();
      clearInterval(minuteInterval);
    };
  }, [matchId, initialMinute]);
  
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-white text-sm font-bold mb-3">Live Match Tracker</h3>
      <FootyPitch 
        ballPosition={ballPos}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={homeScore}
        awayScore={awayScore}
        minute={currentMinute}
      />
      <p className="text-[10px] text-gray-400 text-center mt-2">
        Ball position updates every 3 seconds • Data from live feed
      </p>
    </div>
  );
}