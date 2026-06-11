
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    const body = await req.json();
    const {
      testType,
      durationSeconds,
      ageGroup,
      rawScore,
      percentile,
      tier,
      scoutNarrative,
      recommendedPositions,
      suggestedDrills,
      notes,
      playerName: providedPlayerName,
    } = body;

    // Validate required fields
    if (!testType || !durationSeconds === undefined || !ageGroup) {
      return NextResponse.json({ error: "Missing required fields: testType, durationSeconds, ageGroup" }, { status: 400 });
    }

    let playerId: string;
    let playerEmail: string | undefined = session?.user?.email;

    // Handle player lookup/creation
    if (playerEmail) {
      // Authenticated user - find or create player account
      let player = await prisma.player.findUnique({
        where: { email: playerEmail },
      });
      
      if (!player) {
        player = await prisma.player.create({
          data: {
            email: playerEmail,
            name: session.user.name || playerEmail.split('@')[0],
            role: "player",
          },
        });
      }
      playerId = player.id;
    } else {
      // Non-authenticated / guest user - create temporary record
      // Check if we have a playerName, otherwise use generic
      const tempName = providedPlayerName || "Guest Athlete";
      const tempEmail = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 8)}@temp.grs.com`;
      
      const tempPlayer = await prisma.player.create({
        data: {
          email: tempEmail,
          name: tempName,
          role: "player",
        },
      });
      playerId = tempPlayer.id;
    }

    // Prepare the data for database
    const biometricData = {
      playerId,
      testType,
      durationSeconds,
      ageGroup,
      rawScore: rawScore || `${durationSeconds.toFixed(2)}s`,
      percentile: percentile || 50,
      tier: tier || "Developmental",
      scoutNarrative: scoutNarrative || "Biometric test completed via GRS Talent Lab",
      recommendedPositions: recommendedPositions || [],
      suggestedDrills: suggestedDrills || [],
      date: new Date(),
      notes: notes || null,
    };

    // Save biometric test result to database
    const savedResult = await prisma.biometricsTest.create({
      data: biometricData,
    });

    // Return success response with full result data
    return NextResponse.json({
      success: true,
      message: "Biometric test results saved successfully",
      result: {
        id: savedResult.id,
        playerId: savedResult.playerId,
        testType: savedResult.testType,
        durationSeconds: savedResult.durationSeconds,
        ageGroup: savedResult.ageGroup,
        rawScore: savedResult.rawScore,
        percentile: savedResult.percentile,
        tier: savedResult.tier,
        scoutNarrative: savedResult.scoutNarrative,
        recommendedPositions: savedResult.recommendedPositions,
        suggestedDrills: savedResult.suggestedDrills,
        date: savedResult.date,
        notes: savedResult.notes,
      },
    });
    
  } catch (error) {
    console.error("Submit biometrics error:", error);
    return NextResponse.json(
      { 
        error: "Failed to save biometric test results", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }, 
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve player's biometric history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized - Please log in to view your results" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { email: session.user.email },
    });

    if (!player) {
      return NextResponse.json({ error: "Player profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const testType = searchParams.get("testType");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = { playerId: player.id };
    if (testType) where.testType = testType;

    const results = await prisma.biometricsTest.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
    });

    // Calculate aggregate stats
    const allResults = await prisma.biometricsTest.findMany({
      where: { playerId: player.id },
    });

    const avgPercentile = allResults.length > 0
      ? Math.round(allResults.reduce((sum, r) => sum + r.percentile, 0) / allResults.length)
      : 0;

    const bestResult = allResults.length > 0
      ? allResults.reduce((best, current) => current.percentile > best.percentile ? current : best)
      : null;

    return NextResponse.json({
      success: true,
      results,
      stats: {
        totalTests: allResults.length,
        averagePercentile: avgPercentile,
        bestTier: bestResult?.tier || null,
        bestPercentile: bestResult?.percentile || null,
      },
    });
    
  } catch (error) {
    console.error("Get biometrics error:", error);
    return NextResponse.json({ error: "Failed to retrieve results" }, { status: 500 });
  }
}