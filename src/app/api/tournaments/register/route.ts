import { NextRequest, NextResponse } from "next/server";

export interface TournamentPlayer {
  name: string;
  dob: string;
  position: string;
  school: string;
}

export interface TournamentRegistration {
  id: string;
  clubName: string;
  coachName: string;
  coachPhone: string;
  coachEmail: string;
  province: string;
  category: string;
  players: TournamentPlayer[];
  registeredAt: string;
  status: "pending" | "confirmed" | "rejected";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { clubName, coachName, coachPhone, coachEmail, province, category, players } = body;

    // Validate required fields
    if (!clubName || !coachName || !coachPhone || !category || !players?.length) {
      return NextResponse.json(
        { error: "Missing required registration fields." },
        { status: 400 }
      );
    }

    if (players.length > 18) {
      return NextResponse.json(
        { error: "Maximum 18 players per squad." },
        { status: 400 }
      );
    }

    const registration: TournamentRegistration = {
      id: `MCC2026-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      clubName,
      coachName,
      coachPhone,
      coachEmail: coachEmail ?? "",
      province: province ?? "Harare",
      category,
      players,
      registeredAt: new Date().toISOString(),
      status: "pending",
    };

    // Forward to Laravel backend if available
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      try {
        const laravelRes = await fetch(`${apiUrl}/tournaments/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registration),
          signal: AbortSignal.timeout(8000),
        });

        if (laravelRes.ok) {
          const laravelData = await laravelRes.json();
          return NextResponse.json({ success: true, registration: laravelData.data ?? registration });
        }
      } catch {
        // Laravel not yet implemented — fall through to success response
      }
    }

    // Return success even without Laravel (localStorage handles persistence on frontend)
    return NextResponse.json({ success: true, registration });
  } catch {
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const province = searchParams.get("province");

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (province) params.set("province", province);

      const laravelRes = await fetch(`${apiUrl}/tournaments/registrations?${params}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (laravelRes.ok) {
        const data = await laravelRes.json();
        return NextResponse.json(data);
      }
    }
  } catch {
    // Fall through
  }

  // Return empty — frontend reads from localStorage
  return NextResponse.json({ data: [], total: 0 });
}
