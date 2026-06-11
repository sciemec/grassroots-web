
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
    const { completedDrills, localProgress } = body;

    // Sync completed drills
    for (const drillId of completedDrills || []) {
      const drill = await prisma.drill.findUnique({
        where: { externalId: drillId },
      });

      if (drill) {
        await prisma.playerDrillProgress.upsert({
          where: {
            playerId_drillId: {
              playerId: player.id,
              drillId: drill.id,
            },
          },
          update: {
            status: "completed",
            completedAt: new Date(),
          },
          create: {
            playerId: player.id,
            drillId: drill.id,
            status: "completed",
            completedAt: new Date(),
          },
        });

        await prisma.playerDrillAssignment.updateMany({
          where: {
            playerId: player.id,
            drillId: drill.id,
          },
          data: { status: "completed" },
        });
      }
    }

    // Update talent passport
    await updateTalentPassport(player.id);

    return NextResponse.json({
      success: true,
      message: "Progress synced successfully",
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ error: "Failed to sync progress" }, { status: 500 });
  }
}

async function updateTalentPassport(playerId: string) {
  const completed = await prisma.playerDrillProgress.findMany({
    where: {
      playerId,
      status: "completed",
    },
    include: { drill: true },
  });

  const totalDrills = completed.length;
  const totalMinutes = completed.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

  await prisma.talentPassport.upsert({
    where: { playerId },
    update: {
      completedDrills: totalDrills,
      totalMinutes,
      lastUpdated: new Date(),
    },
    create: {
      playerId,
      totalDrills: 0,
      completedDrills: totalDrills,
      totalMinutes,
    },
  });
}