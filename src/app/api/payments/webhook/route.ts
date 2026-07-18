/**
 * /api/payments/webhook — REMOVED
 * Stripe webhook has been removed from this platform.
 * Payments are handled via Paynow Zimbabwe only.
 * See /api/payments/paynow/webhook
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhook has been removed." },
    { status: 410 },
  );
}
