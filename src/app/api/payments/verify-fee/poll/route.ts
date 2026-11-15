import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PAYNOW_KEY = process.env.PAYNOW_INTEGRATION_KEY ?? "";

function verifyPollHash(params: URLSearchParams): boolean {
  if (!PAYNOW_KEY) return true; // skip in dev if key not set
  const status    = params.get("status") ?? "";
  const reference = params.get("reference") ?? "";
  const amount    = params.get("amount") ?? "";
  const paynowRef = params.get("paynowreference") ?? "";
  const pollUrl   = params.get("pollurl") ?? "";
  const hash      = params.get("hash") ?? "";

  const computed = crypto
    .createHash("sha512")
    .update(status + reference + amount + paynowRef + pollUrl + PAYNOW_KEY)
    .digest("hex")
    .toUpperCase();

  return computed === hash.toUpperCase();
}

export async function GET(req: NextRequest) {
  const pollUrl = req.nextUrl.searchParams.get("poll_url");

  if (!pollUrl) {
    return NextResponse.json({ error: "Missing poll_url." }, { status: 400 });
  }

  try {
    const res    = await fetch(pollUrl);
    const text   = await res.text();
    const params = new URLSearchParams(text);
    const status = (params.get("status") ?? "").toLowerCase();

    // Verify hash to ensure response is from Paynow
    if (!verifyPollHash(params)) {
      return NextResponse.json({ error: "Invalid poll response hash." }, { status: 400 });
    }

    const paid = status === "paid";

    return NextResponse.json({
      paid,
      status:     params.get("status"),
      paynow_ref: params.get("paynowreference"),
      amount:     params.get("amount"),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach Paynow poll URL." }, { status: 502 });
  }
}
