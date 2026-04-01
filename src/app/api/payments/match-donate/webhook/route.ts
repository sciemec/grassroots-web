import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// Paynow posts here when the match day donation is completed.
// Parses the reference to extract event_id + donor_name, then notifies Laravel.
export async function POST(req: NextRequest) {
  const text   = await req.text();
  const params = new URLSearchParams(text);

  const status    = (params.get("status") ?? "").toLowerCase();
  const reference = params.get("reference") ?? "";
  const amount    = params.get("amount") ?? "0";

  // Reference format: MATCH|||{event_id}|||{donor_name}
  const parts      = reference.split("|||");
  const event_id   = parts[1] ?? "";
  const donor_name = parts[2] ?? null;

  if (status === "paid" && event_id) {
    try {
      await fetch(`${API_URL}/business/match-donate`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id,
          amount:     parseFloat(amount),
          donor_name: donor_name || undefined,
          status:     "paid",
        }),
      });
    } catch {
      // Log to monitoring — do not fail the webhook response or Paynow will retry
    }
  }

  // Paynow requires a 200 OK to stop retrying
  return NextResponse.json({ received: true });
}
