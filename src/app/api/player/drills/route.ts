
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, in_progress, completed, all

    const where: any = { playerId: player.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const assignments = await prisma.playerDrillAssignment.findMany({
      where,
      include: {
        drill: true,
      },
      orderBy: { assignedAt: "desc" },
    });

    // Get progress for each drill
    const progress = await prisma.playerDrillProgress.findMany({
      where: { playerId: player.id },
    });

    const progressMap = new Map(progress.map((p) => [p.drillId, p]));

    const transformed = assignments.map((assignment) => ({
      drillId: assignment.drill.externalId,
      drillName: assignment.drill.name,
      description: assignment.drill.description,
      duration: assignment.drill.duration,
      difficulty: assignment.drill.difficulty,
      coachingPoints: assignment.drill.coachingPoints,
      equipment: assignment.drill.equipment,
      phase: assignment.drill.phase,
      department: assignment.drill.department,
      status: assignment.status,
      assignedBy: assignment.assignedBy,
      assignedAt: assignment.assignedAt,
      dueDate: assignment.dueDate,
      coachNotes: assignment.coachNotes,
      progress: progressMap.get(assignment.drillId) || null,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Get player drills error:", error);
    return NextResponse.json({ error: "Failed to get drills" }, { status: 500 });
  }
}