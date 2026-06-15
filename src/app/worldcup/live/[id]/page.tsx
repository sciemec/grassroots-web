// src/app/world-cup/live/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useLiveMatch } from '@/hooks/useLiveMatch';
import { FootballPitch } from '@/components/FootballPitch';
import { MatchHeader } from '@/components/MatchHeader';
import { EventsFeed } from '@/components/EventsFeed';
import { CommentaryPanel } from '@/components/CommentaryPanel';
import { StatisticsPanel } from '@/components/StatisticsPanel';
import type { ShotData } from '@/lib/isports/types';

export default function LiveMatchPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const { match, events, statistics, isLoading, error, lastUpdated } = useLiveMatch(id as string);

  // Derive shot data from events (goals and shots have coordinates)
  const shots: ShotData[] = events
    .filter((e) => e.event_type === 'goal' && e.event_coordinate_x != null)
    .map((e) => ({
      event_id:     e.event_id,
      coordinate_x: e.event_coordinate_x ?? 50,
      coordinate_y: e.event_coordinate_y ?? 50,
      is_goal:      e.event_type === 'goal',
      team_id:      e.team_id,
      player_name:  e.player_name,
      event_minute: e.event_minute,
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#f0b429] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Fetching live match data from iSports API...</p>
          <p className="text-gray-500 text-xs mt-2">This may take a few seconds</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-red-900/20 rounded-xl border border-red-800">
          <p className="text-red-400 font-bold mb-2">Failed to load match data</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <ul className="text-gray-500 text-xs list-disc list-inside mt-4 space-y-1">
            <li>ISPORTS_API_KEY must be set in Vercel environment variables</li>
            <li>Match ID {id} must be valid</li>
            <li>Your iSports subscription must cover World Cup 2026</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">No match data available</p>
          <p className="text-gray-500 text-xs mt-2">Match ID: {id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <MatchHeader match={match} lastUpdated={lastUpdated} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — pitch + statistics */}
          <div className="lg:col-span-2 space-y-4">
            <FootballPitch shots={shots} />
            {statistics && <StatisticsPanel statistics={statistics} />}
          </div>

          {/* Right column — commentary + events */}
          <div className="space-y-4">
            <CommentaryPanel match={match} />
            <EventsFeed events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
