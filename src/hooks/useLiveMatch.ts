// src/hooks/useLiveMatch.ts
'use client';

import { useState, useEffect } from 'react';
import { getLiveMatches, getMatchesByDate, iSportsMatch, LEAGUE_IDS } from '@/lib/isports/client';

export function useLiveMatches() {
  const [matches, setMatches] = useState<iSportsMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Try to get live matches
        let matchesData = await getLiveMatches(LEAGUE_IDS.WORLD_CUP);
        console.log('Live matches:', matchesData.length);
        
        // If no live matches, try today's matches
        if (matchesData.length === 0) {
          const today = new Date().toISOString().split('T')[0];
          matchesData = await getMatchesByDate(today, LEAGUE_IDS.WORLD_CUP);
          console.log('Today\'s matches:', matchesData.length);
        }
        
        setMatches(matchesData);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
        setMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  return { matches, isLoading, error };
}