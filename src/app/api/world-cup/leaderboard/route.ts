// app/api/world-cup/leaderboard/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const position = searchParams.get('position');
    const country = searchParams.get('country');
    const sortBy = searchParams.get('sortBy') || 'performanceScore';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Build where clause
    const where: any = {};
    if (position && position !== 'ALL') {
      where.position = position;
    }
    if (country) {
      where.country = country;
    }
    
    // Build order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'goals':
        orderBy = { goals: 'desc' };
        break;
      case 'assists':
        orderBy = { assists: 'desc' };
        break;
      case 'avgRating':
        orderBy = { avgRating: 'desc' };
        break;
      default:
        orderBy = { performanceScore: 'desc' };
    }
    
    // Fetch real data from database
    const players = await prisma.worldCupPlayerStats.findMany({
      where,
      orderBy,
      take: limit
    });
    
    // Get distinct countries for filter
    const countries = await prisma.worldCupPlayerStats.findMany({
      select: { country: true },
      distinct: ['country']
    });
    
    // Add rank to each player
    const rankedPlayers = players.map((player, index) => ({
      rank: index + 1,
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
    }));
    
    return NextResponse.json({
      success: true,
      data: rankedPlayers,
      availableCountries: countries.map(c => c.country),
      totalPlayers: players.length,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}