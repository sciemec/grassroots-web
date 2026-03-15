import { NextRequest, NextResponse } from "next/server";

interface EndStreamBody {
  live_input_id?: string;
}

export async function POST(req: NextRequest) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken  = process.env.CLOUDFLARE_STREAM_API_TOKEN;

  // No-op if Cloudflare is not configured
  if (!accountId || !apiToken) return NextResponse.json({ ok: true });

  const body = (await req.json().catch(() => ({}))) as EndStreamBody;
  const { live_input_id } = body;
  if (!live_input_id) return NextResponse.json({ ok: true });

  await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs/${live_input_id}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiToken}` },
    }
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
