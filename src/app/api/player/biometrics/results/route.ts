
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { email: session.user.email },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const results = await prisma.biometricsTest.findMany({
      where: { playerId: player.id },
      orderBy: { date: "desc" },
    });

    // Calculate averages
    const averages = {
      avgPercentile: 0,
      bestTier: "Developmental",
      testsCompleted: results.length,
    };

    if (results.length > 0) {
      const avgPercentile = results.reduce((sum, r) => sum + r.percentile, 0) / results.length;
      averages.avgPercentile = Math.round(avgPercentile);
      
      const tierOrder = { "Elite (Class A)": 3, "Competitive (Class B)": 2, "Developmental": 1 };
      const bestTierResult = results.reduce((best, current) => 
        tierOrder[current.tier as keyof typeof tierOrder] > tierOrder[best.tier as keyof typeof tierOrder] 
          ? current : best
      );
      averages.bestTier = bestTierResult.tier;
    }

    return NextResponse.json({
      results,
      averages,
      recommendations: {
        suggestedPositions: results.flatMap(r => r.recommendedPositions).slice(0, 3),
        suggestedDrills: results.flatMap(r => r.suggestedDrills).slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Get biometrics error:", error);
    return NextResponse.json({ error: "Failed to get results" }, { status: 500 });
  }
}