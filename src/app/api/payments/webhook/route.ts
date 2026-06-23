/**
 * POST /api/payments/webhook
 * Stripe sends payment events here. We notify the Laravel backend to activate/cancel subscriptions.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET   — from Stripe dashboard → Webhooks → Signing secret
 *   NEXT_PUBLIC_API_URL     — https://bhora-ai.onrender.com/api/v1
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-05-27.dahlia" });
  const sig = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  // ── Blueprint one-time purchase ─────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === "coaching_blueprint") {
      const userId  = session.metadata.user_id;
      const matchId = session.metadata.matchId;

      if (userId && matchId) {
        await fetch(`${apiUrl}/world-cup/blueprints/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id:               userId,
            match_id:              matchId,
            stripe_payment_intent: typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
            amount_cents: session.amount_total ?? 499,
          }),
        }).catch(() => {
          console.error("Failed to record blueprint purchase for match:", matchId);
        });
      }

      // Blueprint purchase handled — do not forward to the subscription webhook
      return NextResponse.json({ received: true });
    }
  }

  // ── Subscription events — forward to Laravel ────────────────────────────────
  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.deleted" ||
    event.type === "invoice.payment_failed"
  ) {
    await fetch(`${apiUrl}/webhooks/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: event.type, data: event.data }),
    }).catch(() => {
      console.error("Failed to forward Stripe event to Laravel:", event.type);
    });
  }

  return NextResponse.json({ received: true });
}
