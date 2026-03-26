import { NextRequest, NextResponse } from "next/server";

// Paynow statuses: created | sent | cancelled | disputed | refunded | paid | ok
export async function GET(req: NextRequest) {
  const pollUrl = req.nextUrl.searchParams.get("pollUrl");

  if (!pollUrl) {
    return NextResponse.json({ error: "Missing pollUrl" }, { status: 400 });
  }

  try {
    const res    = await fetch(decodeURIComponent(pollUrl));
    const text   = await res.text();
    const params = new URLSearchParams(text);

    const status = (params.get("status") ?? "unknown").toLowerCase();
    const paid   = status === "paid" || status === "ok";

    return NextResponse.json({
      status,
      paid,
      paynow_ref: params.get("paynowreference"),
      amount:     params.get("amount"),
    });
  } catch {
    return NextResponse.json({ error: "Could not check payment status." }, { status: 502 });
  }
}
