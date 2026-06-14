/**
 * POST /api/payments/match-unlock
 * Creates a one-time Stripe Checkout session for $1 to unlock match audio.
 * On success Stripe redirects to /worldcup?unlocked={matchId}
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY   — sk_live_... or sk_test_...
 *   NEXT_PUBLIC_APP_URL — https://grassrootssports.live
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

interface UnlockBody {
  matchId: string;
  matchTitle: string;
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: UnlockBody;
  try {
    body = (await req.json()) as UnlockBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { matchId, matchTitle } = body;
  if (!matchId || !matchTitle) {
    return NextResponse.json({ error: "Missing matchId or matchTitle" }, { status: 400 });
  }

  const stripe  = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency:     "usd",
            product_data: { name: `Audio Commentary — ${matchTitle}` },
            unit_amount:  100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      metadata:    { matchId },
      success_url: `${appUrl}/worldcup?unlocked=${matchId}`,
      cancel_url:  `${appUrl}/worldcup`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
