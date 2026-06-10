// app/api/world-cup/matches/route.ts - NO MOCKS
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getRealLiveMatches } from '@/lib/live-scores';

export async function GET() {
  try {
    // Return ONLY real live matches from the API
    const liveMatches = await getRealLiveMatches();
    
    if (liveMatches.length === 0) {
      // Return empty array, no mock data
      return NextResponse.json({ 
        live: [], 
        message: 'No live matches at the moment. Check back during match hours.',
        lastChecked: new Date().toISOString()
      });
    }
    
    return NextResponse.json({ 
      live: liveMatches,
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch live matches',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}