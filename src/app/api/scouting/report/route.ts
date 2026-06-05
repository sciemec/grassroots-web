
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ error: "Player ID required" }, { status: 400 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/scout/players/${playerId}`, {
      headers: { Authorization: token },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Generate scouting report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}