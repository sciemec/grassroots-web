// src/hooks/useLiveMatch.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  fetchLiveMatches, 
  fetchMatchEvents, 
  fetchMatchLineups, 
  fetchMatchStatistics,
  fetchTodaySchedule,
  type ISportsMatch,
  type ISportsEvent,
  type ISportsLineup,
  type ISportsStatistics
} from '@/lib/isports/client';

interface LiveMatchState {
  match: ISportsMatch | null;
  events: ISportsEvent[];
  lineups: ISportsLineup[];
  statistics: ISportsStatistics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useLiveMatch(matchId: string) {
  const [state, setState] = useState<LiveMatchState>({
    match: null,
    events: [],
    lineups: [],
    statistics: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const lastEventIdRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // Fetch all match data
      const [match, events, lineups, statistics] = await Promise.all([
        fetchLiveMatches().then(matches => matches.find(m => m.id === matchId) || null),
        fetchMatchEvents(matchId, lastEventIdRef.current || undefined),
        fetchMatchLineups(matchId),
        fetchMatchStatistics(matchId),
      ]);

      if (!isMountedRef.current) return;

      // Track last event ID for delta updates
      if (events && events.length > 0) {
        const lastEvent = events[events.length - 1];
        if (lastEvent?.id) {
          lastEventIdRef.current = lastEvent.id;
        }
      }

      setState(prev => ({
        match: match || prev.match,
        events: [...prev.events, ...(events || [])],
        lineups: prev.lineups.length > 0 ? prev.lineups : (lineups || []),
        statistics: statistics || prev.statistics,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      }));

    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to fetch match data',
          isLoading: false,
        }));
      }
    }
  }, [matchId]);

  // Initial fetch and polling
  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial fetch
    fetchData();

    // Poll every 10 seconds
    intervalRef.current = setInterval(fetchData, 10000);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  // Reset when matchId changes
  useEffect(() => {
    lastEventIdRef.current = null;
    setState(prev => ({
      ...prev,
      events: [],
      isLoading: true,
    }));
  }, [matchId]);

  return state;
}

export function useLiveMatches() {
  const [matches, setMatches] = useState<ISportsMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        // First try live matches
        let liveMatches = await fetchLiveMatches();
        
        // If no live matches, get today's schedule
        if (liveMatches.length === 0) {
          liveMatches = await fetchTodaySchedule();
        }

        if (isMounted) {
          setMatches(liveMatches);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch matches');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMatches();

    // Poll for live matches every 30 seconds
    const interval = setInterval(loadMatches, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { matches, isLoading, error };
}