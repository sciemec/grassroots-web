/**
 * POST /api/payments/webhook
 * Stripe sends payment events here. We notify the Laravel backend to activate/cancel subscriptions.
 * Uses Web Crypto for signature verification (no Stripe SDK) to keep the CF Workers bundle small.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET   — from Stripe dashboard → Webhooks → Signing secret
 *   NEXT_PUBLIC_API_URL     — https://bhora-ai.onrender.com/api/v1
 */

import { NextRequest, NextResponse } from "next/server";

/** Verify Stripe-Signature header using Web Crypto HMAC-SHA256. */
async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  // sig header format: "t=1614556800,v1=abc123,v1=def456"
  const parts = sigHeader.split(",");
  const tPart = parts.find((p) => p.startsWith("t="));
  const vParts = parts.filter((p) => p.startsWith("v1="));
  if (!tPart || vParts.length === 0) return false;

  const timestamp = tPart.slice(2);
  const payload = `${timestamp}.${rawBody}`;

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch {
    return false;
  }

  const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const computed = Array.from(new Uint8Array(sigBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return vParts.some((v) => v.slice(3) === computed);
}

interface StripeEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  const valid = await verifyStripeSignature(rawBody, sig, webhookSecret);
  if (!valid) {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

  // ── Blueprint one-time purchase ─────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: Record<string, string>;
      payment_intent?: string | null;
      amount_total?: number | null;
    };

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
