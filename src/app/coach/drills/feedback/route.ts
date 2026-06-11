// app/api/coach/drills/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coach = await prisma.coach.findUnique({
      where: { email: session.user.email },
    });

    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const drillId = searchParams.get("drillId");
    const playerId = searchParams.get("playerId");

    const where: any = {};
    if (drillId) {
      const drill = await prisma.drill.findUnique({ where: { externalId: drillId } });
      if (drill) where.drillId = drill.id;
    }
    if (playerId) where.playerId = playerId;

    const feedback = await prisma.playerDrillFeedback.findMany({
      where,
      include: {
        player: {
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
          },
        },
        drill: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate aggregate stats
    const stats = {
      totalFeedbacks: feedback.length,
      averageRating: feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / (feedback.length || 1),
      byDifficulty: {
        too_easy: feedback.filter((f) => f.difficulty === "too_easy").length,
        just_right: feedback.filter((f) => f.difficulty === "just_right").length,
        too_hard: feedback.filter((f) => f.difficulty === "too_hard").length,
      },
    };

    const transformed = feedback.map((f) => ({
      ...f,
      drill: {
        ...f.drill,
        externalId: f.drill.externalId,
      },
    }));

    return NextResponse.json({
      stats,
      feedback: transformed,
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json({ error: "Failed to get feedback" }, { status: 500 });
  }
}