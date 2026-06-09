// src/app/api/world-cup/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRealMatchEvents } from '@/lib/live-scores';
import { generateCommentary } from '@/lib/commentary-engine';
import { WORLD_CUP_MATCHES } from '@/lib/world-cup-data';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // Resolve static match data for team names / score / status
  const staticMatch = WORLD_CUP_MATCHES.find(m => m.id === id);

  try {
    const events = await getRealMatchEvents(Number(id));
    return NextResponse.json({
      id,
      homeTeam: staticMatch?.homeTeam ?? 'Home',
      awayTeam: staticMatch?.awayTeam ?? 'Away',
      homeScore: staticMatch?.homeScore ?? 0,
      awayScore: staticMatch?.awayScore ?? 0,
      minute: staticMatch?.minute ?? 0,
      status: staticMatch?.status ?? 'scheduled',
      events,
    });
  } catch {
    // Live events unavailable — return static data with empty events
    return NextResponse.json({
      id,
      homeTeam: staticMatch?.homeTeam ?? 'Home',
      awayTeam: staticMatch?.awayTeam ?? 'Away',
      homeScore: staticMatch?.homeScore ?? 0,
      awayScore: staticMatch?.awayScore ?? 0,
      minute: staticMatch?.minute ?? 0,
      status: staticMatch?.status ?? 'scheduled',
      events: [],
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { event } = await req.json();
    const commentary = await generateCommentary(event);
    return NextResponse.json({ success: true, commentary });
  } catch (error) {
    console.error('Commentary generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate commentary' }, { status: 500 });
  }
}
