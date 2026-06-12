// src/hooks/useLiveMatch.ts
// REAL polling of iSports API - no mocks

import { useState, useEffect, useRef } from 'react';
import { fetchLiveMatch, fetchMatchEvents, fetchMatchLineups, fetchMatchStatistics } from '@/lib/isports/client';
import type { ISportsMatch, ISportsEvent, ISportsLineup, ISportsStatistics } from '@/lib/isports/types';

interface LiveMatchData {
  match: ISportsMatch | null;
  events: ISportsEvent[];
  lineups: { home: ISportsLineup | null; away: ISportsLineup | null };
  statistics: ISportsStatistics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useLiveMatch(matchId: string) {
  const [data, setData] = useState<LiveMatchData>({
    match: null,
    events: [],
    lineups: { home: null, away: null },
    statistics: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });
  
  const lastEventIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!matchId) return;
    
    let isMounted = true;
    
    const fetchAll = async () => {
      try {
        // Fetch match data
        const match = await fetchLiveMatch(matchId);
        
        // Fetch events (only new ones)
        const events = await fetchMatchEvents(matchId, lastEventIdRef.current || undefined);
        if (events.length > 0 && events[events.length - 1]?.event_id) {
          lastEventIdRef.current = events[events.length - 1].event_id;
        }
        
        // Fetch lineups (once per match)
        let lineups = data.lineups;
        if (!lineups.home && !lineups.away) {
          const homeLineup = await fetchMatchLineups(matchId).catch(() => null);
          const awayLineup = await fetchMatchLineups(matchId).catch(() => null);
          lineups = { home: homeLineup, away: awayLineup };
        }
        
        // Fetch statistics
        const statistics = await fetchMatchStatistics(matchId);
        
        if (isMounted) {
          setData(prev => ({
            match,
            events: [...prev.events, ...events].slice(-50), // keep last 50 events
            lineups,
            statistics,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
          }));
        }
      } catch (err) {
        if (isMounted) {
          setData(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to fetch match data',
            isLoading: false,
          }));
        }
      }
    };
    
    // Initial fetch
    fetchAll();
    
    // Poll every 5 seconds (iSports recommended interval)
    intervalRef.current = setInterval(fetchAll, 5000);
    
    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [matchId]);
  
  return data;
}