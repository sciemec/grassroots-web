/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout session and returns the session URL.
 * Uses raw fetch (no Stripe SDK) to keep the Cloudflare Workers bundle small.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
 *   NEXT_PUBLIC_APP_URL    — https://grassrootssports.live
 */

import { NextRequest, NextResponse } from "next/server";

const STRIPE_API = "https://api.stripe.com/v1";

const PLANS: Record<string, { name: string; amount: number; interval: "month" | "year" }> = {
  weekly:    { name: "Weekly Plan",    amount:  150,  interval: "month" },
  monthly:   { name: "Monthly Plan",   amount:  500,  interval: "month" },
  "3-month": { name: "3-Month Plan",   amount:  400,  interval: "month" },
  school:    { name: "School Plan",    amount: 1000,  interval: "month" },
  pro_local: { name: "Pro-Local Plan", amount: 2500,  interval: "month" },
  match_day: { name: "Match Day",      amount: 5000,  interval: "month" },
};

interface CheckoutBody {
  plan?: string;
  user_id?: string;
  email?: string;
  planId?: string;
  price?: number;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

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

/** Build a URL-encoded form body for the Stripe API (which uses application/x-www-form-urlencoded). */
function encodeForm(obj: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object" && !Array.isArray(v)) {
      parts.push(encodeForm(v as Record<string, unknown>, key));
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "object") {
          parts.push(encodeForm(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.join("&");
}

async function stripePost(secretKey: string, path: string, params: Record<string, unknown>) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: encodeForm(params),
  });
  const json = await res.json() as { url?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `Stripe error ${res.status}`);
  return json;
}

export async function POST(req: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY is not configured." }, { status: 503 });
  }

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

    const amountCents = Math.round((body.price ?? 3.00) * 100);
    const metadata: Record<string, string> = { ...(body.metadata ?? {}), user_id: userId };

    try {
      const session = await stripePost(secretKey, "/checkout/sessions", {
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
        success_url: body.successUrl ?? `${appUrl}/world-cup`,
        cancel_url:  body.cancelUrl  ?? `${appUrl}/world-cup`,
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
    const session = await stripePost(secretKey, "/checkout/sessions", {
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
