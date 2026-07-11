import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/whatsapp/report
 * Sends a match report via WhatsApp Business API (Meta Cloud API).
 * Called after a match is logged in the coach match dashboard.
 *
 * Required env vars:
 *   WHATSAPP_PHONE_NUMBER_ID  â€” from Meta Developer Console
 *   WHATSAPP_ACCESS_TOKEN     â€” System User token or Temporary Token
 *
 * Body: { to, home_team, away_team, home_score, away_score, summary?, match_url? }
 */

const GRAPH_URL = "https://graph.facebook.com/v19.0";

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
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { error: "WhatsApp service not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN." },
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

  const safeHome      = sanitize(String(home_team));
  const safeAway      = sanitize(String(away_team));
  const safeHomeScore = String(home_score).replace(/\D/g, "").slice(0, 3);
  const safeAwayScore = String(away_score).replace(/\D/g, "").slice(0, 3);
  const safeSummary   = summary ? sanitize(String(summary), 200) : "";
  const safeUrl       = match_url
    ? sanitize(String(match_url), 200)
    : "https://grassrootssports.live";

  const messageBody = [
    `\u26BD MATCH REPORT \u2014 ${safeHome} vs ${safeAway}`,
    `Final Score: ${safeHomeScore} - ${safeAwayScore}`,
    "",
    safeSummary || "",
    "",
    `\uD83D\uDCCA Full analysis: ${safeUrl}`,
    "",
    "Powered by Grassroots Sport \uD83C\uDDF5\uD83C\uDDFC",
    "grassrootssports.live",
  ]
    .filter((line, i) => !(i === 3 && !safeSummary))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  // Meta takes bare E.164 digits â€” strip the leading +
  const recipient = cleanTo.replace(/^\+/, "");

  try {
    const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to:   recipient,
        type: "text",
        text: { body: messageBody },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("WhatsApp Meta API error", res.status, errBody);
      return NextResponse.json(
        { error: `WhatsApp send failed (${res.status}). Check Meta credentials.` },
        { status: res.status }
      );
    }

    const data = await res.json() as { messages?: { id: string }[] };
    return NextResponse.json({ ok: true, message_id: data.messages?.[0]?.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "WhatsApp send failed";
    console.error("WhatsApp fetch exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

