// app/api/world-cup/matches/route.ts - NO MOCKS
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getRealLiveMatches } from '@/lib/live-scores';

export async function GET() {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    return NextResponse.json({
      live: [],
      message: 'Live scores not configured.',
      lastChecked: new Date().toISOString()
    });
  }

  try {
    const liveMatches = await getRealLiveMatches();
    return NextResponse.json({
      live: liveMatches,
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      live: [],
      error: 'Failed to fetch live matches',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}