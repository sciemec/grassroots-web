
import { evaluateBiometrics } from "./grs-engine";

export interface BiometricsSubmission {
  playerId: string;
  playerName: string;
  testType: "20m_sprint" | "vertical_leap" | "pro_agility";
  durationSeconds: number;
  ageGroup: "U8" | "U13" | "U17" | "Senior";
  date: Date;
  notes?: string;
}

export interface BiometricsResult {
  id: string;
  playerId: string;
  playerName: string;
  testType: string;
  durationSeconds: number;
  ageGroup: string;
  rawScore: string;
  percentile: number;
  tier: "Elite (Class A)" | "Competitive (Class B)" | "Developmental";
  scoutNarrative: string;
  recommendedPositions: string[];
  suggestedDrills: string[];
  date: Date;
  notes?: string;
}

// Store results (in production, this would be a database)
let biometricsStore: BiometricsResult[] = [];

export function submitBiometricsTest(data: BiometricsSubmission): BiometricsResult {
  const evaluation = evaluateBiometrics({
    testType: data.testType,
    durationSeconds: data.durationSeconds,
    ageGroup: data.ageGroup,
  });

  const result: BiometricsResult = {
    id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    playerId: data.playerId,
    playerName: data.playerName,
    testType: data.testType,
    durationSeconds: data.durationSeconds,
    ageGroup: data.ageGroup,
    rawScore: evaluation.rawScore,
    percentile: evaluation.percentile,
    tier: evaluation.tier,
    scoutNarrative: evaluation.scoutNarrative,
    recommendedPositions: evaluation.recommendedPositions,
    suggestedDrills: evaluation.suggestedDrills,
    date: data.date,
    notes: data.notes,
  };

  biometricsStore.push(result);

  // In production, save to database:
  // await prisma.biometricsTest.create({ data: result });

  return result;
}

export function getPlayerBiometrics(playerId: string): BiometricsResult[] {
  return biometricsStore
    .filter((r) => r.playerId === playerId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getSquadBiometricsOverview(playerIds: string[]): {
  byTestType: Record<string, { count: number; averagePercentile: number; eliteCount: number }>;
  topPerformers: Array<{ playerName: string; testType: string; percentile: number }>;
} {
  const playerResults = biometricsStore.filter((r) => playerIds.includes(r.playerId));
  
  const byTestType: Record<string, { count: number; averagePercentile: number; eliteCount: number }> = {};
  
  for (const result of playerResults) {
    if (!byTestType[result.testType]) {
      byTestType[result.testType] = { count: 0, averagePercentile: 0, eliteCount: 0 };
    }
    byTestType[result.testType].count++;
    byTestType[result.testType].averagePercentile += result.percentile;
    if (result.tier === "Elite (Class A)") {
      byTestType[result.testType].eliteCount++;
    }
  }
  
  // Calculate averages
  for (const testType in byTestType) {
    byTestType[testType].averagePercentile = Math.round(
      byTestType[testType].averagePercentile / byTestType[testType].count
    );
  }
  
  // Get top 5 performers across all tests
  const topPerformers = [...playerResults]
    .sort((a, b) => b.percentile - a.percentile)
    .slice(0, 5)
    .map((r) => ({
      playerName: r.playerName,
      testType: r.testType,
      percentile: r.percentile,
    }));
  
  return { byTestType, topPerformers };
}

export function generateScoutingReport(playerId: string): {
  player: { id: string; name: string };
  summary: string;
  overallTier: string;
  positionRecommendations: string[];
  drillRecommendations: string[];
  testResults: BiometricsResult[];
  scoutNotes: string;
} {
  const playerResults = getPlayerBiometrics(playerId);
  
  if (playerResults.length === 0) {
    return {
      player: { id: playerId, name: "Unknown" },
      summary: "No biometric data available for this player.",
      overallTier: "Not Assessed",
      positionRecommendations: [],
      drillRecommendations: [],
      testResults: [],
      scoutNotes: "Complete biometric testing to generate report.",
    };
  }
  
  // Determine overall tier (majority or highest)
  const tierCounts = playerResults.reduce((acc, r) => {
    acc[r.tier] = (acc[r.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const overallTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Developmental";
  
  // Aggregate position recommendations
  const allPositions = playerResults.flatMap((r) => r.recommendedPositions);
  const positionCounts = allPositions.reduce((acc, p) => {
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const positionRecommendations = Object.entries(positionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pos]) => pos);
  
  // Aggregate drill recommendations
  const allDrills = playerResults.flatMap((r) => r.suggestedDrills);
  const drillCounts = allDrills.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const drillRecommendations = Object.entries(drillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([drill]) => drill);
  
  // Generate scout summary
  const eliteTests = playerResults.filter((r) => r.tier === "Elite (Class A)").length;
  const competitiveTests = playerResults.filter((r) => r.tier === "Competitive (Class B)").length;
  const avgPercentile = Math.round(
    playerResults.reduce((sum, r) => sum + r.percentile, 0) / playerResults.length
  );
  
  let summary = "";
  if (eliteTests >= 2) {
    summary = `HIGH-POTENTIAL PROSPECT: This athlete demonstrates ELITE-level metrics in ${eliteTests} out of ${playerResults.length} tests, placing them in the top ${100 - avgPercentile}% of their age group. Priority recruitment target.`;
  } else if (competitiveTests >= 2) {
    summary = `DEVELOPMENTAL TARGET: Shows COMPETITIVE baseline metrics with clear developmental trajectory. Recommended for academy trials and position-specific training blocks.`;
  } else {
    summary = `PROJECT PLAYER: Raw athletic profile requires systematic development. Focus on foundational movement patterns and sport-specific conditioning before advanced placement.`;
  }
  
  const scoutNotes = `Tested on ${playerResults.length} occasions. Peak performance: ${Math.max(...playerResults.map(r => r.percentile))}th percentile. Most recent test: ${playerResults[0]?.testType} at ${playerResults[0]?.percentile}th percentile.`;
  
  return {
    player: { id: playerId, name: playerResults[0]?.playerName || "Unknown" },
    summary,
    overallTier,
    positionRecommendations,
    drillRecommendations,
    testResults: playerResults,
    scoutNotes,
  };
}