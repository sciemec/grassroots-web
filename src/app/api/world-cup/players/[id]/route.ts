// src/app/api/world-cup/players/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const player = await prisma.worldCupPlayerStats.findUnique({
      where: { playerId: params.id }
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
