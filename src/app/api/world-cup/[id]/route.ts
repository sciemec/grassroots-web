// app/api/world-cup/players/[id]/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the correct asynchronous context type for Next.js 15 App Router
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    // 1. Explicitly await the params Promise to unwrap the dynamic route values
    const resolvedParams = await context.params;
    
    // 2. Security guard check to guarantee the id argument exists securely
    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 });
    }
    
    const id = resolvedParams.id;

    // 3. Query records from database engine instance
    const player = await prisma.worldCupPlayerStats.findUnique({
      where: { playerId: id }
    });
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        playerId: player.playerId,
        playerName: player.playerName,
        country: player.country,
        position: player.position,
        shirtNumber: player.shirtNumber,
        matchesPlayed: player.matchesPlayed,
        minutesPlayed: player.minutesPlayed,
        goals: player.goals,
        assists: player.assists,
        shots: player.shots,
        shotsOnTarget: player.shotsOnTarget,
        passAccuracy: player.passAccuracy,
        tackles: player.tackles,
        interceptions: player.interceptions,
        saves: player.saves,
        cleanSheets: player.cleanSheets,
        yellowCards: player.yellowCards,
        redCards: player.redCards,
        avgRating: player.avgRating,
        performanceScore: player.performanceScore
      }
    });
    
  } catch (error) {
    console.error('Player fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch player' }, { status: 500 });
  }
}