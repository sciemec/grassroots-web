// app/api/player/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { drillId, rating, feedback, difficulty } = body;

    if (!drillId) {
      return NextResponse.json({ error: "Missing drillId" }, { status: 400 });
    }

    const drill = await prisma.drill.findUnique({
      where: { externalId: drillId },
    });

    if (!drill) {
      return NextResponse.json({ error: "Drill not found" }, { status: 404 });
    }

    const feedbackRecord = await prisma.playerDrillFeedback.upsert({
      where: {
        playerId_drillId: {
          playerId: player.id,
          drillId: drill.id,
        },
      },
      update: {
        rating,
        feedback,
        difficulty,
      },
      create: {
        playerId: player.id,
        drillId: drill.id,
        rating,
        feedback,
        difficulty,
      },
    });

    return NextResponse.json({
      success: true,
      feedback: feedbackRecord,
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

// Get feedback for a coach (to see player responses)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const drillId = searchParams.get("drillId");

    const where: any = {};
    if (drillId) {
      const drill = await prisma.drill.findUnique({ where: { externalId: drillId } });
      if (drill) where.drillId = drill.id;
    }

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

    const transformed = feedback.map((f) => ({
      ...f,
      drill: {
        ...f.drill,
        externalId: f.drill.externalId,
      },
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json({ error: "Failed to get feedback" }, { status: 500 });
  }
}