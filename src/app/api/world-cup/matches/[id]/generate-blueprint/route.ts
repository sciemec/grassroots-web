// src/app/api/world-cup/matches/[id]/generate-blueprint/route.ts
// Verifies Stripe payment, reads tactical report from R2, generates + streams the PDF.
// Auth: Bearer JWT. Body: { paymentIntentId }

export const runtime = 'nodejs';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import Stripe from 'stripe';
import { generateTrainingMicrocycle } from '@/lib/tactical-iq/blueprint-generator';
import { generateBlueprintPDF } from '@/lib/tactical-iq/pdf-generator';
import type { PhaseReport } from '@/lib/tactical-iq/phase-classifier';
import type { QuizMoment } from '@/lib/tactical-iq/quiz-generator';

// ── helpers ──────────────────────────────────────────────────────────────────

function getR2(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secret    = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !keyId || !secret) return null;
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: keyId, secretAccessKey: secret },
  });
}

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-05-28.basil' });
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

interface StoredReport {
  homeTeam:    string;
  awayTeam:    string;
  homeScore:   number;
  awayScore:   number;
  phases:      PhaseReport;
  quizMoments: QuizMoment[];
  narrative:   string;
}

async function getReportFromR2(matchId: string): Promise<StoredReport | null> {
  const r2 = getR2();
  if (!r2) return null;
  try {
    const res = await r2.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET ?? 'grassroots-videos',
      Key: `tactical-reports/${matchId}.json`,
    }));
    const body = await res.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as StoredReport;
  } catch {
    return null;
  }
}

// ── handler ───────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await resolveUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const matchId = params.id;
  const body = await req.json().catch(() => ({}));
  const { paymentIntentId } = body as { paymentIntentId?: string };

  // Verify payment with Stripe
  const stripe = getStripe();
  if (!stripe || !paymentIntentId) {
    return NextResponse.json({ error: 'Payment verification required' }, { status: 402 });
  }

  try {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }
    // Ensure this intent was for this match and this user
    if (intent.metadata.matchId !== matchId || intent.metadata.userId !== user.id) {
      return NextResponse.json({ error: 'Payment mismatch' }, { status: 403 });
    }
  } catch (err) {
    console.error('Stripe verify error:', err);
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 500 });
  }

  // Get report from R2
  const report = await getReportFromR2(matchId);
  if (!report) {
    return NextResponse.json({ error: 'Tactical report not ready yet' }, { status: 404 });
  }

  // Generate training microcycle
  const microcycle = generateTrainingMicrocycle({
    match: {
      homeTeam:  report.homeTeam,
      awayTeam:  report.awayTeam,
      homeScore: report.homeScore,
      awayScore: report.awayScore,
    },
    phases:      report.phases,
    quizMoments: report.quizMoments,
    narrative:   report.narrative,
  });

  // Generate PDF
  const pdfBuffer = await generateBlueprintPDF({
    matchId,
    homeTeam:  report.homeTeam,
    awayTeam:  report.awayTeam,
    homeScore: report.homeScore,
    awayScore: report.awayScore,
    microcycle,
    phases:    report.phases,
    narrative: report.narrative,
  });

  const slug = `${report.homeTeam}-vs-${report.awayTeam}`.replace(/\s+/g, '-');
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="GRS-Blueprint-${slug}.pdf"`,
    },
  });
}
