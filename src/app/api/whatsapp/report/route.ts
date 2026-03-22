import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/whatsapp/report
 * Sends a match report via WhatsApp Business API (Twilio).
 * Called after a match is logged in the coach match dashboard.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM  — e.g. whatsapp:+14155238886
 *
 * Body: { to, home_team, away_team, home_score, away_score, summary?, match_url? }
 */

interface ReportBody {
  to?: string;
  home_team?: string;
  away_team?: string;
  home_score?: string | number;
  away_score?: string | number;
  summary?: string;
  match_url?: string;
}

function sanitize(input: string, maxLen = 200): string {
  return String(input)
    .replace(/<[^>]*>/g, "")
    .replace(/[^\w\s.,!?'"\-:@#()\/]/g, "")
    .trim()
    .slice(0, maxLen);
}

function isValidPhone(phone: string): boolean {
  return /^\+\d{7,15}$/.test(phone.replace(/\s/g, ""));
}

export async function POST(req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "WhatsApp service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_WHATSAPP_FROM." },
      { status: 503 }
    );
  }

  let body: ReportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { to, home_team, away_team, home_score, away_score, summary, match_url } = body;

  if (!to || !home_team || !away_team || home_score === undefined || away_score === undefined) {
    return NextResponse.json(
      { error: "Required fields: to, home_team, away_team, home_score, away_score." },
      { status: 400 }
    );
  }

  const cleanTo = String(to).replace(/\s/g, "");
  if (!isValidPhone(cleanTo)) {
    return NextResponse.json(
      { error: "Invalid phone number. Must start with + and contain only digits (e.g. +263712345678)." },
      { status: 400 }
    );
  }

  const safeHome = sanitize(String(home_team));
  const safeAway = sanitize(String(away_team));
  const safeHomeScore = String(home_score).replace(/\D/g, "").slice(0, 3);
  const safeAwayScore = String(away_score).replace(/\D/g, "").slice(0, 3);
  const safeSummary = summary ? sanitize(String(summary), 200) : "";
  const safeUrl = match_url
    ? sanitize(String(match_url), 200)
    : "https://grassrootssports.live";

  const messageBody = [
    `⚽ MATCH REPORT — ${safeHome} vs ${safeAway}`,
    `Final Score: ${safeHomeScore} - ${safeAwayScore}`,
    "",
    safeSummary || "",
    "",
    `📊 Full analysis: ${safeUrl}`,
    "",
    "Powered by Grassroots Sport 🇿🇼",
    "grassrootssports.live",
  ]
    .filter((line, i) => !(i === 3 && !safeSummary))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const toNumber = `whatsapp:${cleanTo}`;

  const formData = new URLSearchParams();
  formData.append("From", fromNumber);
  formData.append("To", toNumber);
  formData.append("Body", messageBody);

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Twilio error", res.status, errBody);
      return NextResponse.json(
        { error: `WhatsApp send failed (${res.status}). Check Twilio credentials.` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, sid: data.sid });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "WhatsApp send failed";
    console.error("Twilio fetch exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
