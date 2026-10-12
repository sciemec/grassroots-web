"use server";

// src/app/api/scholarship-nudge/route.ts
// Sends a proactive WhatsApp message to a player with their top scholarship matches.
// Called fire-and-forget from /player/pathway when they complete key milestones.

import { NextRequest, NextResponse } from "next/server";
import { matchPlayerToScholarships } from "@/lib/scholarship-matcher";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

interface NudgeBody {
  phone:          string;
  sport:          string;
  position:       string;
  province:       string;
  thuto_score:    number;
  reel_complete:  boolean;
  ncaa_id:        boolean;
  target_pathway: string;
  checkpoint?:    string; // which milestone triggered this
}

export async function POST(req: NextRequest) {
  const phoneNumberId   = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken     = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ ok: false, reason: "WhatsApp not configured" }, { status: 503 });
  }

  let body: NudgeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid JSON" }, { status: 400 });
  }

  const { phone, sport, position, province, thuto_score, reel_complete, ncaa_id, target_pathway } = body;

  if (!phone || phone.length < 8) {
    return NextResponse.json({ ok: false, reason: "No phone number" }, { status: 400 });
  }

  // Normalise: strip +, spaces, dashes → bare digits
  const to = phone.replace(/[^0-9]/g, "");

  // Match scholarships
  const matches = matchPlayerToScholarships({ sport, position, province, thuto_score, reel_complete, ncaa_id, target_pathway });
  const top3 = matches.slice(0, 3);

  if (top3.length === 0) {
    return NextResponse.json({ ok: false, reason: "No matches found" }, { status: 200 });
  }

  // Build message
  const checkpointLabel: Record<string, string> = {
    scholarship_reel_complete: "You completed your Scholarship Reel",
    ncaa_registered:           "You registered your NCAA ID",
    coach_outreach_started:    "You started coach outreach",
    scholarship_applied:       "You submitted a scholarship application",
  };

  const trigger = body.checkpoint ? checkpointLabel[body.checkpoint] ?? "Your profile is growing" : "Your profile is growing";

  const lines: string[] = [
    `🎓 *Scholarship Update — GrassRoots Sports*`,
    ``,
    `${trigger}. Here are your top matches:`,
    ``,
  ];

  top3.forEach((m, i) => {
    lines.push(`${i + 1}. *${m.program.institution}* — ${m.program.division} ${m.program.sport}`);
    lines.push(`   ${m.label} · ${Math.round(m.score)}% fit`);
    if (m.blockers.length > 0) {
      lines.push(`   💡 Next step: ${m.blockers[0]}`);
    }
    lines.push(`   📍 ${m.program.country}`);
    lines.push(``);
  });

  lines.push(`View your full pathway:`);
  lines.push(`grassrootssports.live/player/pathway`);

  const messageText = lines.join("\n");

  // Send via Meta Cloud API
  const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: messageText, preview_url: false },
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "unknown error");
    console.error("[scholarship-nudge] WhatsApp send failed:", res.status, err);
    return NextResponse.json({ ok: false, reason: "WhatsApp API error" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, message_id: data.messages?.[0]?.id });
}
