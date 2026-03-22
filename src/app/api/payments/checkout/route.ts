/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout session and returns the session URL.
 * The frontend redirects the user to that URL to complete payment.
 *
 * Required env vars (Vercel + .env.local):
 *   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
 *   NEXT_PUBLIC_APP_URL    — https://grassrootssports.live (used for success/cancel redirects)
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLANS: Record<string, { name: string; amount: number; interval: "month" | "year" }> = {
  // Player individual plans
  weekly:    { name: "Weekly Plan",    amount:  150,  interval: "month" }, // $1.50 → billed monthly
  monthly:   { name: "Monthly Plan",   amount:  500,  interval: "month" }, // $5/month
  "3-month": { name: "3-Month Plan",   amount:  400,  interval: "month" }, // $12/quarter → ~$4/month
  // Org plans
  school:    { name: "School Plan",    amount: 1000,  interval: "month" }, // $10/month
  pro_local: { name: "Pro-Local Plan", amount: 2500,  interval: "month" }, // $25/month
  match_day: { name: "Match Day",      amount: 5000,  interval: "month" }, // $50/event
};

interface CheckoutBody {
  plan: string;
  user_id?: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2025-01-27.acacia" });

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { plan, user_id, email } = body;
  const planConfig = PLANS[plan];
  if (!planConfig) {
    return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: planConfig.name },
            unit_amount: planConfig.amount,
            recurring: { interval: planConfig.interval },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: { user_id: user_id ?? "", plan },
      success_url: `${appUrl}/player/subscription?success=1&plan=${plan}`,
      cancel_url:  `${appUrl}/player/subscription?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
