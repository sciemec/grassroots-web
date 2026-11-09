// src/app/api/campaigns/paynow/status/route.ts
// Polls a Paynow pollUrl and returns { paid, status }.
// Called by the frontend every 3 seconds during the USSD flow.

import { NextRequest, NextResponse } from "next/server";

function parsePaynowResponse(body: string): Record<string, string> {
  return Object.fromEntries(
    body.split("&").map((pair) => pair.split("=").map(decodeURIComponent))
  );
}

export async function POST(req: NextRequest) {
  const { poll_url } = await req.json();
  if (!poll_url) {
    return NextResponse.json({ error: "Missing poll_url" }, { status: 400 });
  }

  try {
    const res    = await fetch(poll_url);
    const text   = await res.text();
    const parsed = parsePaynowResponse(text);
    const status = (parsed.status ?? "").toLowerCase();
    const paid   = status === "paid" || status === "awaiting delivery";

    return NextResponse.json({ paid, status: parsed.status ?? "unknown", paynow_ref: parsed.paynowreference ?? null });
  } catch {
    return NextResponse.json({ paid: false, status: "error" });
  }
}
