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
  // Subscription flow
  plan?: string;
  user_id?: string;
  email?: string;
  // One-time payment flow (blueprint_single)
  planId?: string;
  price?: number;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

/** Resolve user_id from the Laravel backend using the bearer token. */
async function resolveUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;
  try {
    const res = await fetch(`${apiUrl}/auth/user`, {
      headers: { Authorization: authHeader },
    });
    if (!res.ok) return null;
    const data = await res.json() as { data?: { id?: string } };
    return data?.data?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" });

  let body: CheckoutBody;
  try {
    body = (await req.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";

  // ── One-time payment (Coaching Blueprints) ──────────────────────────────────
  if (body.planId === "blueprint_single") {
    const userId = await resolveUserId(req.headers.get("authorization"));
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const amountCents = Math.round((body.price ?? 4.99) * 100);
    const metadata: Record<string, string> = {
      ...(body.metadata ?? {}),
      user_id: userId,
    };

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: "GRS Coaching Blueprint — 5-Day Microcycle PDF" },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata,
        success_url: body.successUrl ?? `${appUrl}/worldcup`,
        cancel_url:  body.cancelUrl  ?? `${appUrl}/worldcup`,
      });

      return NextResponse.json({ url: session.url });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Stripe error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  // ── Subscription flow ───────────────────────────────────────────────────────
  const plan = body.plan ?? "";
  const planConfig = PLANS[plan];
  if (!planConfig) {
    return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
  }

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
      customer_email: body.email,
      metadata: { user_id: body.user_id ?? "", plan },
      success_url: `${appUrl}/player/subscription?success=1&plan=${plan}`,
      cancel_url:  `${appUrl}/player/subscription?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stripe error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
