import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/training/sessions
 * Proxies to Laravel POST /training/sessions.
 * Used by Pitch Mode when the direct Axios call to bhora-ai fails offline.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const body = await req.json();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  try {
    const res = await fetch(`${apiUrl}/training/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Upstream unavailable" }, { status: 503 });
  }
}
