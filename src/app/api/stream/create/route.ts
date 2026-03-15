import { NextResponse } from "next/server";

interface CloudflareResult {
  uid: string;
  webRTC?: { url?: string };
}

interface CloudflareResponse {
  result: CloudflareResult;
}

export async function POST() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken  = process.env.CLOUDFLARE_STREAM_API_TOKEN;

  if (!accountId || !apiToken) {
    return NextResponse.json(
      {
        error:
          "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN are not configured. Add them to Vercel environment variables.",
      },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/live_inputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: {
            name: `Grassroots Sport Live — ${new Date().toISOString()}`,
          },
          recording: { mode: "automatic", requireSignedURLs: false },
          deleteRecordingAfterDays: 30,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Cloudflare live input creation failed", res.status, errText);
      return NextResponse.json(
        { error: `Cloudflare error (${res.status})` },
        { status: res.status }
      );
    }

    const data = (await res.json()) as CloudflareResponse;
    const result = data.result;

    return NextResponse.json({
      live_input_id: result.uid,
      whip_url:
        result.webRTC?.url ??
        `https://customer-${accountId}.cloudflarestream.com/${result.uid}/webRTC/publish`,
      hls_url: `https://customer-${accountId}.cloudflarestream.com/${result.uid}/manifest/video.m3u8`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stream creation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
