import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PAYNOW_ID  = process.env.PAYNOW_INTEGRATION_ID ?? "";
const PAYNOW_KEY = process.env.PAYNOW_INTEGRATION_KEY ?? "";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";
const API_URL    = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

function buildHash(fields: string[]): string {
  const str = fields.join("") + PAYNOW_KEY;
  return crypto.createHash("sha512").update(str).digest("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  if (!PAYNOW_ID || !PAYNOW_KEY) {
    return NextResponse.json({ error: "Paynow not configured on this server." }, { status: 503 });
  }

  const { event_id, amount, phone, donor_name } = await req.json() as {
    event_id: string;
    amount: string;
    phone: string;
    donor_name?: string;
  };

  if (!event_id) return NextResponse.json({ error: "Missing event_id." }, { status: 400 });
  if (!amount || parseFloat(amount) < 0.01) return NextResponse.json({ error: "Invalid amount." }, { status: 400 });

  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  // Normalize phone to international format
  const digits = phone.replace(/\D/g, "");
  const normalizedPhone = digits.startsWith("0")
    ? "263" + digits.slice(1)
    : digits.startsWith("263")
    ? digits
    : "263" + digits;

  // Encode event_id + donor_name in the reference so the webhook can extract them
  const safeName  = (donor_name ?? "").replace(/\|/g, "");
  const reference = `MATCH|||${event_id}|||${safeName}`;

  const additionalInfo = `Match Day Donation - ${donor_name ?? "Anonymous"}`;
  const returnUrl      = `${APP_URL}/match/${event_id}?donated=1`;
  const resultUrl      = `${APP_URL}/api/payments/match-donate/webhook`;
  const status         = "Message";
  const paynowMethod   = "ecocash";

  const hash = buildHash([
    PAYNOW_ID, reference, amount, additionalInfo,
    returnUrl, resultUrl, status, paynowMethod, normalizedPhone,
  ]);

  const body = new URLSearchParams({
    id:             PAYNOW_ID,
    reference,
    amount,
    additionalinfo: additionalInfo,
    returnurl:      returnUrl,
    resulturl:      resultUrl,
    status,
    method:         paynowMethod,
    phone:          normalizedPhone,
    hash,
  });

  try {
    const paynowRes = await fetch("https://www.paynow.co.zw/interface/remotetransaction", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });

    const text     = await paynowRes.text();
    const params   = new URLSearchParams(text);
    const pStatus  = params.get("status") ?? "";

    if (pStatus.toLowerCase() !== "ok") {
      const errMsg = params.get("error") ?? "Payment initiation failed. Check your number and try again.";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({
      reference,
      poll_url:   params.get("pollurl"),
      paynow_ref: params.get("paynowreference"),
      api_url:    API_URL,
    });
  } catch {
    return NextResponse.json({ error: "Could not reach Paynow. Check your connection." }, { status: 502 });
  }
}
