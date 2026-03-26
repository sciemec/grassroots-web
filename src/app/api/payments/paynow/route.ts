import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PAYNOW_ID  = process.env.PAYNOW_INTEGRATION_ID ?? "";
const PAYNOW_KEY = process.env.PAYNOW_INTEGRATION_KEY ?? "";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";

const PLAN_AMOUNTS: Record<string, string> = {
  weekly:    "1.50",
  monthly:   "5.00",
  "3-month": "12.00",
};

function buildHash(fields: string[]): string {
  const str = fields.join("") + PAYNOW_KEY;
  return crypto.createHash("sha512").update(str).digest("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  if (!PAYNOW_ID || !PAYNOW_KEY) {
    return NextResponse.json({ error: "Paynow not configured on this server." }, { status: 503 });
  }

  const { plan, phone, method, email } = await req.json() as {
    plan: string;
    phone: string;
    method: string;
    email: string;
  };

  const amount = PLAN_AMOUNTS[plan];
  if (!amount) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  if (!phone || phone.replace(/\D/g, "").length < 9) {
    return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
  }

  // Normalize phone: strip spaces/dashes, convert 07X to 2637X
  const digits = phone.replace(/\D/g, "");
  const normalizedPhone = digits.startsWith("0")
    ? "263" + digits.slice(1)
    : digits.startsWith("263")
    ? digits
    : "263" + digits;

  const paynowMethod  = method === "innbucks" ? "innbucks" : method === "onemoney" ? "onemoney" : "ecocash";
  const reference     = `GRS-${Date.now()}`;
  const additionalInfo = `GrassRoots Sports ${plan} plan - ${email}`;
  const returnUrl     = `${APP_URL}/player/subscription?paynow=1&plan=${plan}`;
  const resultUrl     = `${APP_URL}/api/payments/paynow/webhook`;
  const status        = "Message";

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

    const text   = await paynowRes.text();
    const params = new URLSearchParams(text);
    const pStatus = params.get("status") ?? "";

    if (pStatus.toLowerCase() !== "ok") {
      const errMsg = params.get("error") ?? "Payment initiation failed. Check your number and try again.";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({
      reference,
      poll_url:    params.get("pollurl"),
      paynow_ref:  params.get("paynowreference"),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach Paynow. Check your connection." }, { status: 502 });
  }
}
