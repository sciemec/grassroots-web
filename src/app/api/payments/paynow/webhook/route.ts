import { NextRequest, NextResponse } from "next/server";

// Paynow posts here automatically when payment status changes.
// Use this to activate subscription on the Laravel backend.
export async function POST(req: NextRequest) {
  const text   = await req.text();
  const params = new URLSearchParams(text);

  const status    = (params.get("status") ?? "").toLowerCase();
  const reference = params.get("reference") ?? "";
  const amount    = params.get("amount") ?? "";
  const paynowRef = params.get("paynowreference") ?? "";

  if (status === "paid") {
    // Notify Laravel backend to activate subscription
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/paynow-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, paynow_ref: paynowRef, amount, status }),
      });
    } catch {
      // Log to monitoring — do not fail the webhook response
    }
  }

  // Paynow requires a 200 OK response to stop retrying
  return NextResponse.json({ received: true });
}
