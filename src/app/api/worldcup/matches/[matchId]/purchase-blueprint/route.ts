// src/app/api/world-cup/matches/[matchId]/purchase-blueprint/route.ts
// Creates a Stripe Payment Intent for a $4.99 Coaching Blueprint purchase.
// Auth: Bearer JWT from the GRS auth store (not next-auth).
// Returns: { clientSecret, paymentIntentId } — frontend confirms with Stripe.js.

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2026-05-27.dahlia' });
}

async function resolveUser(req: NextRequest): Promise<{ id: string } | null> {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token || token === 'dev-token') return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? data?.user ?? null;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const user = await resolveUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const { matchId } = await params;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // $4.99
      currency: 'usd',
      metadata: {
        matchId,
        userId: user.id,
        product: 'coaching-blueprint',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
