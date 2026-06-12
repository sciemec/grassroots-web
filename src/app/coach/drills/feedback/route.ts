import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization");
  const { searchParams } = new URL(req.url);
  const res = await fetch(`${API}/coach/drills/feedback?${searchParams.toString()}`, {
    headers: { ...(token ? { Authorization: token } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
