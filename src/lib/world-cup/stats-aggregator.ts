// lib/world-cup/stats-aggregator.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';
import { fetchMatchPlayerStats, fetchPlayerInfo } from './data-provider';
import type { AggregatedPlayerStats } from './types';

// Calculate custom performance score (real algorithm)
export function calculatePerformanceScore(stats: AggregatedPlayerStats): number {
  let score = 0;
  
  // Goals: 10 points each
  score += stats.goals * 10;
  
  // Assists: 6 points each
  score += stats.assists * 6;
  
  // Defensive actions
  score += (stats.tackles + stats.interceptions) * 0.5;
  
  // Goalkeeper specific
  if (stats.position === 'GK') {
    score += stats.saves * 1.5;
    score += stats.cleanSheets * 15;
  }
  
  // Passing accuracy (0-10 scale)
  score += (stats.passAccuracy / 100) * 5;
  
  // Minutes played (up to 10 points)
  score += Math.min(stats.minutesPlayed / 90, 10);
  
  // Rating from match performance (0-10 scale)
  score += stats.avgRating * 1.5;
  
  return Math.round(score * 100) / 100;
}

// Synchronize a single match to database (process real data)
export async function syncMatchToDatabase(matchId: string): Promise<void> {
  try {
    // Fetch real player stats from API
    const playerPerformances = await fetchMatchPlayerStats(matchId);
    
    // Process each player
    for (const performance of playerPerformances) {
      // Get or create player info
      let player = await prisma.worldCupPlayerStats.findUnique({
        where: { playerId: performance.playerId }
      });
      
      if (!player) {
        const playerInfo = await fetchPlayerInfo(performance.playerId);
        if (playerInfo) {
          player = await prisma.worldCupPlayerStats.create({
            data: {
              playerId: performance.playerId,
              playerName: playerInfo.name,
              country: playerInfo.country,
              position: playerInfo.position,
              shirtNumber: playerInfo.shirtNumber
            }
          });
        }
      }
      
      if (player) {
        // Update aggregated stats
        const newMatchesPlayed = player.matchesPlayed + 1;
        const newMinutesPlayed = player.minutesPlayed + performance.minutesPlayed;
        const newGoals = player.goals + performance.goals;
        const newAssists = player.assists + performance.assists;
        const newShots = player.shots + performance.shots;
        const newShotsOnTarget = player.shotsOnTarget + performance.shotsOnTarget;
        const newTackles = player.tackles + performance.tackles;
        const newInterceptions = player.interceptions + performance.interceptions;
        const newSaves = player.saves + performance.saves;
        const newCleanSheets = player.cleanSheets + (performance.cleanSheet ? 1 : 0);
        const newYellowCards = player.yellowCards + performance.yellowCards;
        const newRedCards = player.redCards + performance.redCards;
        
        // Calculate new pass accuracy
        const newPassesCompleted = (player.passesCompleted || 0) + performance.passesCompleted;
        const newPassesAttempted = (player.passesAttempted || 0) + performance.passesAttempted;
        const newPassAccuracy = newPassesAttempted > 0 
          ? (newPassesCompleted / newPassesAttempted) * 100 
          : 0;
        
        // Calculate new average rating
        const newTotalRating = (player.avgRating * (player.matchesPlayed || 1)) + performance.rating;
        const newAvgRating = newTotalRating / newMatchesPlayed;
        
        // Prepare update data
        const updateData: Prisma.WorldCupPlayerStatsUpdateInput = {
          matchesPlayed: newMatchesPlayed,
          minutesPlayed: newMinutesPlayed,
          goals: newGoals,
          assists: newAssists,
          shots: newShots,
          shotsOnTarget: newShotsOnTarget,
          passAccuracy: newPassAccuracy,
          passesCompleted: newPassesCompleted,
          passesAttempted: newPassesAttempted,
          tackles: newTackles,
          interceptions: newInterceptions,
          saves: newSaves,
          cleanSheets: newCleanSheets,
          yellowCards: newYellowCards,
          redCards: newRedCards,
          avgRating: newAvgRating
        };
        
        // Calculate performance score
        updateData.performanceScore = calculatePerformanceScore({
          ...updateData as unknown as AggregatedPlayerStats,
          position: player.position
        });
        
        // Update database with real data
        await prisma.worldCupPlayerStats.update({
          where: { playerId: performance.playerId },
          data: updateData
        });
      }
    }
    
    // Mark match as synced
    await prisma.worldCupMatchSync.upsert({
      where: { matchId },
      update: { syncedAt: new Date() },
      create: { matchId, syncedAt: new Date() }
    });
    
  } catch (error) {
    console.error(`Failed to sync match ${matchId}:`, error);
    throw error;
  }
}

// Sync all World Cup matches (real data)
export async function syncAllWorldCupMatches(): Promise<{ synced: number; failed: number }> {
  const matches = await prisma.worldCupMatch.findMany({
    where: { status: 'finished' }
  });

  // Batch lookup: one query instead of N separate findUnique calls
  const matchIds = matches.map((m) => m.id);
  const alreadySynced = await prisma.worldCupMatchSync.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true }
  });
  const syncedSet = new Set(alreadySynced.map((s) => s.matchId));

  let synced = 0;
  let failed = 0;

  for (const match of matches) {
    if (syncedSet.has(match.id)) continue;
    try {
      await syncMatchToDatabase(match.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}