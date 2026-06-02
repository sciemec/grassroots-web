import { NextResponse } from "next/server";
import { type PerformanceHistoryEntrySchema } from "@/types/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, beatsPeak, beatsRecovery, soreness, sleep, stress } = body;

    if (!playerId || beatsPeak === undefined || beatsRecovery === undefined) {
      return NextResponse.json({ error: "Missing diagnostic inputs" }, { status: 400 });
    }

    // 🧮 SPORTS SCIENCE MATH MUTATION
    const peakBpm = beatsPeak * 4;
    const recoveryBpm = beatsRecovery * 4;
    const deltaBpm = peakBpm - recoveryBpm;

    // 🛑 HIGH FATIGUE EVALUATION FILTER
    // Flagged true if the heart rate delta drops below 18bpm, or muscle soreness hits critical levels
    const checkAlert = deltaBpm < 18 || soreness >= 4;

    const newHistoryRecord: PerformanceHistoryEntrySchema = {
      id: "log-" + Math.random().toString(36).substring(2, 9),
      playerId,
      loggedAt: new Date().toISOString(),
      entryType: "fatigue_wellness",
      fatigueMetrics: {
        beatsCountedPeak: beatsPeak,
        heartRatePeakBpm: peakBpm,
        beatsCountedRecovery: beatsRecovery,
        heartRateRecoveryBpm: recoveryBpm,
        heartRateDeltaBpm: deltaBpm,
        muscleSoreness: soreness,
        sleepQuality: sleep,
        perceivedStress: stress,
        fatigueAlertFlag: checkAlert
      }
    };

    // TODO: Connect database handler entry line here (Prisma/SupaBase/Postgres)
    // await db.performanceHistory.create({ data: newHistoryRecord });

    return NextResponse.json({ 
      success: true, 
      data: newHistoryRecord,
      message: checkAlert 
        ? "🚨 High Fatigue Parameter Flagged. Nurture pipeline advises active rest recovery protocols." 
        : "✓ Metrics compiled completely. Athletic trajectory optimized."
    });

  } catch (err) {
    return NextResponse.json({ error: "Pipeline processing failure" }, { status: 500 });
  }
}