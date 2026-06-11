
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

    // Get all completed drills with details
    const completedProgress = await prisma.playerDrillProgress.findMany({
      where: {
        playerId: player.id,
        status: "completed",
      },
      include: {
        drill: true,
      },
      orderBy: { completedAt: "desc" },
    });

    // Get all feedback
    const feedback = await prisma.playerDrillFeedback.findMany({
      where: { playerId: player.id },
    });

    const feedbackMap = new Map(feedback.map((f) => [f.drillId, f]));

    // Calculate stats
    const totalDrills = completedProgress.length;
    const totalMinutes = completedProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / (feedback.length || 1);

    // Build passport
    const passport = {
      player: {
        id: player.id,
        name: player.name,
        email: player.email,
        position: player.position,
      },
      stats: {
        totalDrillsCompleted: totalDrills,
        totalMinutesPracticed: totalMinutes,
        averageRating: Math.round(avgRating * 10) / 10,
        passportGenerated: new Date().toISOString(),
      },
      completedDrills: completedProgress.map((p) => ({
        drillId: p.drill.externalId,
        drillName: p.drill.name,
        description: p.drill.description,
        duration: p.drill.duration,
        difficulty: p.drill.difficulty,
        phase: p.drill.phase,
        coachingPoints: p.drill.coachingPoints,
        completedAt: p.completedAt,
        timeSpent: p.timeSpent,
        feedback: feedbackMap.get(p.drillId) || null,
      })),
      byDepartment: completedProgress.reduce((acc, p) => {
        const dept = p.drill.department;
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(p.drill.externalId);
        return acc;
      }, {} as Record<string, string[]>),
    };

    // Save to talent passport table
    await prisma.talentPassport.upsert({
      where: { playerId: player.id },
      update: {
        completedDrills: totalDrills,
        totalMinutes,
        lastUpdated: new Date(),
        passportData: passport,
      },
      create: {
        playerId: player.id,
        totalDrills: 0,
        completedDrills: totalDrills,
        totalMinutes,
        passportData: passport,
      },
    });

    return NextResponse.json(passport);
  } catch (error) {
    console.error("Get passport error:", error);
    return NextResponse.json({ error: "Failed to get passport" }, { status: 500 });
  }
}