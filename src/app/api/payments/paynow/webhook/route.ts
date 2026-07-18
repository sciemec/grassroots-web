import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// Paynow posts here automatically when payment status changes.
export async function POST(req: NextRequest) {
  const text   = await req.text();
  const params = new URLSearchParams(text);

  const status    = (params.get("status") ?? "").toLowerCase();
  const reference = params.get("reference") ?? "";
  const amount    = params.get("amount") ?? "";
  const paynowRef = params.get("paynowreference") ?? "";

  if (status === "paid") {
    try {
      if (reference.startsWith("bp_")) {
        // Blueprint purchase: reference = bp_{userId 36}_{matchId 36}
        // Total prefix "bp_" = 3 chars, UUID = 36 chars, separator "_" = 1 char
        const userId  = reference.slice(3, 39);
        const matchId = reference.slice(40, 76);

        await fetch(`${API}/world-cup/blueprints/confirm`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id:      userId,
            match_id:     matchId,
            paynow_ref:   paynowRef,
            amount_cents: Math.round(parseFloat(amount) * 100),
          }),
        });
      } else {
        // Subscription payment
        await fetch(`${API}/subscription/paynow-confirm`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, paynow_ref: paynowRef, amount, status, hash: params.get("hash") ?? "" }),
        });
      }
    } catch {
      // Never fail the webhook response — Paynow will retry if we 500
    }
  }

  // Paynow requires a 200 OK response to stop retrying
  return NextResponse.json({ received: true });
}