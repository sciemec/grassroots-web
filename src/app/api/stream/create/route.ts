import { NextResponse } from "next/server";

interface DailyRoom {
  name: string;
  url: string;
}

export async function POST() {
  const apiKey = process.env.DAILY_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DAILY_API_KEY is not configured. Add it to your environment variables." },
      { status: 503 }
    );
  }

  const roomName = `grassroots-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          enable_prejoin_ui: false,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4,
          max_participants: 100,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Daily room creation failed", res.status, errText);
      return NextResponse.json(
        { error: `Daily.co error (${res.status})` },
        { status: res.status }
      );
    }

    const room = (await res.json()) as DailyRoom;

    return NextResponse.json({
      room_name: room.name,
      room_url: room.url,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stream creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
