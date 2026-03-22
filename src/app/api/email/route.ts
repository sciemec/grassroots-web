/**
 * POST /api/email
 * Sends transactional emails via Resend (free tier: 3,000 emails/month).
 * Used for: welcome emails, password reset, match reports, subscription receipts.
 *
 * Required env vars (Vercel + .env.local):
 *   RESEND_API_KEY         — from resend.com dashboard
 *   EMAIL_FROM             — e.g. "Grassroots Sport <noreply@grassrootssports.live>"
 *
 * Body: { to, subject, html, type? }
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const EMAIL_TEMPLATES: Record<string, { subject: string; html: (data: Record<string, string>) => string }> = {
  welcome: {
    subject: "Welcome to Grassroots Sport 🏆",
    html: (d) => `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
        <h2 style="color:#1a5c2a">Welcome to Grassroots Sport, ${d.name ?? "Athlete"}!</h2>
        <p>Zimbabwe's first AI-powered sports platform is ready for you.</p>
        <p>Your role: <strong>${d.role ?? "Player"}</strong></p>
        <a href="https://grassrootssports.live/login"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f0b429;color:#1a3a1a;font-weight:bold;border-radius:6px;text-decoration:none">
          Go to your Dashboard →
        </a>
        <p style="margin-top:32px;color:#888;font-size:12px">
          Grassroots Sport · grassrootssports.live · Zimbabwe 🇿🇼
        </p>
      </div>`,
  },
  subscription_confirmed: {
    subject: "Subscription Confirmed — Grassroots Sport",
    html: (d) => `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
        <h2 style="color:#1a5c2a">Payment Confirmed ✅</h2>
        <p>Hi ${d.name ?? "there"}, your <strong>${d.plan ?? ""}</strong> subscription is now active.</p>
        <p>Amount: <strong>$${d.amount ?? ""}/month</strong></p>
        <a href="https://grassrootssports.live/player/subscription"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f0b429;color:#1a3a1a;font-weight:bold;border-radius:6px;text-decoration:none">
          View Subscription →
        </a>
        <p style="margin-top:32px;color:#888;font-size:12px">Grassroots Sport · grassrootssports.live</p>
      </div>`,
  },
  match_report: {
    subject: "Match Report — Grassroots Sport",
    html: (d) => `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px">
        <h2 style="color:#1a5c2a">⚽ Match Report</h2>
        <h3>${d.home_team ?? "Home"} vs ${d.away_team ?? "Away"}</h3>
        <p style="font-size:28px;font-weight:bold">${d.score ?? "0 - 0"}</p>
        <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
          ${d.summary ?? ""}
        </div>
        <a href="${d.match_url ?? "https://grassrootssports.live"}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a5c2a;color:#fff;font-weight:bold;border-radius:6px;text-decoration:none">
          Full Analysis →
        </a>
        <p style="margin-top:32px;color:#888;font-size:12px">Grassroots Sport · grassrootssports.live</p>
      </div>`,
  },
};

interface EmailBody {
  to: string;
  subject?: string;
  html?: string;
  type?: string;
  data?: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured. Get a free key at resend.com." },
      { status: 503 }
    );
  }

  let body: EmailBody;
  try {
    body = (await req.json()) as EmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { to, subject, html, type, data = {} } = body;
  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 });

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const template = type ? EMAIL_TEMPLATES[type] : null;
  const finalSubject = subject ?? template?.subject ?? "Grassroots Sport";
  const finalHtml = html ?? (template ? template.html(data) : "<p>No content provided.</p>");

  const from = process.env.EMAIL_FROM ?? "Grassroots Sport <noreply@grassrootssports.live>";

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject: finalSubject,
      html: finalHtml,
    });

    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Email send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
