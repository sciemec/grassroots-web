// app/api/world-cup/leaderboard/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const position = searchParams.get('position');
    const country = searchParams.get('country');
    const sortBy = searchParams.get('sortBy') || 'performanceScore';
    const limit = parseInt(searchParams.get('limit') || '50') || 50;
    
    // Build where clause
    const where: Prisma.WorldCupPlayerStatsWhereInput = {};
    if (position && position !== 'ALL') {
      where.position = position;
    }
    if (country) {
      where.country = country;
    }

    // Build order by
    let orderBy: Prisma.WorldCupPlayerStatsOrderByWithRelationInput = {};
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
    
    // 🔥 OPTIMIZATION: Fire the data query and total matching count query in parallel
    const [players, totalMatchingPlayers, countries] = await Promise.all([
      prisma.worldCupPlayerStats.findMany({
        where,
        orderBy,
        take: limit
      }),
      prisma.worldCupPlayerStats.count({
        where // <-- Uses the exact same filter rules to count the absolute total
      }),
      prisma.worldCupPlayerStats.findMany({
        select: { country: true },
        distinct: ['country']
      })
    ]);
    
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
      totalPlayers: totalMatchingPlayers, // <-- Now returns the accurate database total!
      processedOnPage: players.length,    // Optional: let frontend know how many are in this payload
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}