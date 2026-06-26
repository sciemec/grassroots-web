import { NextRequest, NextResponse } from "next/server";

const PAYNOW_URL = "https://www.paynow.co.zw/interface/remotetransaction";

const PLAN_AMOUNTS: Record<string, string> = {
  weekly:           "1.50",
  monthly:          "5.00",
  "3-month":        "12.00",
  world_cup_class:  "3.00",
};

const PLAN_LABELS: Record<string, string> = {
  weekly:           "GrassRoots Sports - 1 Week",
  monthly:          "GrassRoots Sports - Monthly",
  "3-month":        "GrassRoots Sports - 3 Months",
  world_cup_class:  "GrassRoots Sports - After-Match Class",
};

// Normalise Zimbabwean phone number to international format required by Paynow
// e.g. 0771234567 → 2637712345678, +263... → 263...
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("263")) return digits;
  if (digits.startsWith("0"))   return "263" + digits.slice(1);
  return "263" + digits;
}

// SHA-512 via Web Crypto API (available in both Node.js and Edge runtime)
async function sha512Hex(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const buffer  = await crypto.subtle.digest("SHA-512", encoded);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function POST(req: NextRequest) {
  const integrationId  = process.env.PAYNOW_INTEGRATION_ID?.trim();
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY?.trim();
  const appUrl         = process.env.NEXT_PUBLIC_APP_URL ?? "https://grassrootssports.live";

  if (!integrationId || !integrationKey) {
    return NextResponse.json(
      { error: "Payment service not configured." },
      { status: 503 }
    );
  }

  try {
    const { plan, phone, method, email, user_id } = await req.json() as {
      plan:    string;
      phone:   string;
      method:  string;
      email?:  string;
      user_id?: string | number;
    };

    const amount = PLAN_AMOUNTS[plan];
    if (!amount) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }

    const normalisedPhone = normalisePhone(phone ?? "");
    if (normalisedPhone.length < 11) {
      return NextResponse.json(
        { error: "Please enter your full phone number (e.g. 0771 234 567)." },
        { status: 400 }
      );
    }

    // Reference format required by PaynowController::confirm() to parse plan + userId
    const reference = `grassroots_${plan}_${user_id ?? email ?? "unknown"}`;

    const additionalInfo = PLAN_LABELS[plan] ?? "GrassRoots Sports Subscription";
    const returnUrl   = `${appUrl}/player/subscription?paynow=1`;
    const resultUrl   = `${appUrl}/api/payments/paynow/webhook`;
    const status      = "Message";
    const payMethod  = (method ?? "ecocash").toLowerCase();
    // Test mode: authemail must be the merchant's registered address.
    // Live mode: use the customer's email.
    const authEmail  = process.env.PAYNOW_MERCHANT_EMAIL ?? "sciemeq@gmail.com";

    // Hash field order and URL-encoding matches the official Paynow Node.js SDK buildMobile():
    // All field values are URL-encoded via encodeURI() BEFORE computing the hash.
    // Field order: resulturl, returnurl, reference, amount, id, additionalinfo, authemail, phone, method, status
    // Then append lowercased integrationKey and SHA-512 the whole string (uppercase hex).
    const fields: Record<string, string> = {
      resulturl:      resultUrl,
      returnurl:      returnUrl,
      reference,
      amount,
      id:             integrationId,
      additionalinfo: additionalInfo,
      authemail:      authEmail,
      phone:          normalisedPhone,
      method:         payMethod,
      status,
    };
    const hashInput =
      Object.values(fields).map((v) => encodeURI(v)).join("") +
      integrationKey.toLowerCase();
    const hash = await sha512Hex(hashInput);

    const body = new URLSearchParams({
      ...fields,
      hash,
    });

    const paynowRes = await fetch(PAYNOW_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    body.toString(),
    });

    const responseText = await paynowRes.text();
    const params       = new URLSearchParams(responseText);
    const paynowStatus = (params.get("status") ?? "").toLowerCase();

    if (paynowStatus === "error") {
      const errorMsg = params.get("error") ?? "Payment initiation failed.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const pollUrl = params.get("pollurl");
    if (!pollUrl) {
      return NextResponse.json(
        { error: "Could not initiate payment. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ poll_url: pollUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
