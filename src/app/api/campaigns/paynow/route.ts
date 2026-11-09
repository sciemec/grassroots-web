// src/app/api/campaigns/paynow/route.ts
// Initiates a Paynow USSD push for a campaign donation.
// Accepts: { donation_id, amount_cents, phone, campaign_title }
// Returns: { poll_url } or { error }

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const INTEGRATION_ID  = process.env.PAYNOW_INTEGRATION_ID  ?? "";
const INTEGRATION_KEY = process.env.PAYNOW_INTEGRATION_KEY ?? "";
const RETURN_URL      = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live"}/campaigns`;
const RESULT_URL      = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live"}/api/campaigns/paynow/webhook`;

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("263"))  return digits;
  if (digits.startsWith("0"))    return "263" + digits.slice(1);
  return "263" + digits;
}

function paynowHash(fields: Record<string, string>): string {
  const values = Object.values(fields).join("") + INTEGRATION_KEY;
  return crypto.createHash("sha512").update(values).digest("hex").toUpperCase();
}

function parsePaynowResponse(body: string): Record<string, string> {
  return Object.fromEntries(
    body.split("&").map((pair) => pair.split("=").map(decodeURIComponent))
  );
}

export async function POST(req: NextRequest) {
  if (!INTEGRATION_ID || !INTEGRATION_KEY) {
    return NextResponse.json({ error: "Paynow not configured" }, { status: 503 });
  }

  const { donation_id, amount_cents, phone, campaign_title } = await req.json();

  if (!donation_id || !amount_cents || !phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const amount   = (amount_cents / 100).toFixed(2);
  const normPhone = normalisePhone(String(phone));
  const reference = `GRS-DON-${donation_id.slice(0, 8).toUpperCase()}`;
  const info      = `Donation to ${campaign_title ?? "GRS Campaign"}`;

  const fields: Record<string, string> = {
    id:          INTEGRATION_ID,
    reference,
    amount,
    additionalinfo: info,
    returnurl:   RETURN_URL,
    resulturl:   RESULT_URL,
    status:      "Message",
  };

  fields.hash = paynowHash(fields);
  fields.phone   = normPhone;
  fields.method  = "ecocash";

  const body = new URLSearchParams(fields).toString();

  try {
    const paynowRes = await fetch(
      "https://www.paynow.co.zw/interface/remotetransaction",
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
    );
    const text   = await paynowRes.text();
    const parsed = parsePaynowResponse(text);

    if (parsed.status?.toLowerCase() !== "ok") {
      return NextResponse.json({ error: parsed.error ?? "Paynow initiation failed" }, { status: 502 });
    }

    return NextResponse.json({ poll_url: parsed.pollurl, paynow_ref: reference });
  } catch (err) {
    return NextResponse.json({ error: "Network error contacting Paynow" }, { status: 502 });
  }
}
