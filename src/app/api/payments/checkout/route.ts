/**
 * /api/payments/checkout — REMOVED
 * Stripe has been removed from this platform.
 * Payments are handled via Paynow Zimbabwe only.
 * See /api/payments/paynow
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe payments have been removed. Use Paynow Zimbabwe instead.", redirect: "/player/subscription" },
    { status: 410 },
  );
}
