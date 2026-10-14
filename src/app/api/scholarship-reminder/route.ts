"use server";

// src/app/api/scholarship-reminder/route.ts
// Bulk WhatsApp scholarship reminder — sends eligible-age players their top scholarship matches.
// POST { age_groups: string[], province?: string, sport?: string }
// Fetches players from Laravel /players/discover, sends one WhatsApp per player with a phone number.

import { NextRequest, NextResponse } from "next/server";
import { matchPlayerToScholarships } from "@/lib/scholarship-matcher";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const API_URL   = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// Age groups considered scholarship-eligible for the reminder
const DEFAULT_ELIGIBLE_GROUPS = ["u16", "u17", "u18", "u19", "u20", "u21"];

interface ReminderBody {
  age_groups?: string[];   // e.g. ["u16","u17","u18"] — defaults to all eligible groups
  province?:   string;     // filter by province (optional)
  sport?:      string;     // filter by sport (optional)
}

interface DiscoveredPlayer {
  id:             string;
  initials?:      string;
  name?:          string;
  sport?:         string;
  position?:      string;
  province?:      string;
  age_group?:     string;
  phone?:         string;
  thuto_score?:   number;
  open_for_scouting?: boolean;
}

async function sendWhatsApp(
  to: string,
  body: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body, preview_url: false },
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildMessage(player: DiscoveredPlayer): string | null {
  const sport     = player.sport     ?? "football";
  const position  = player.position  ?? "";
  const province  = player.province  ?? "";
  const score     = player.thuto_score ?? 0;
  const ageGroup  = player.age_group ?? "";

  const matches = matchPlayerToScholarships({
    sport,
    position,
    province,
    thuto_score:    score,
    reel_complete:  false,
    ncaa_id:        false,
    target_pathway: "usa_ncaa",
  });

  const top3 = matches.slice(0, 3);
  if (top3.length === 0) return null;

  const lines: string[] = [
    `🎓 *GrassRoots Sports — Scholarship Alert*`,
    ``,
    `You're in the *${ageGroup.toUpperCase()}* age group — one of the most sought-after windows for international scholarship programmes.`,
    ``,
    `Here are your top matches right now:`,
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

  lines.push(`Open THUTO on the app to ask about any of these programmes:`);
  lines.push(`grassrootssports.live/player/pathway`);

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { ok: false, reason: "WhatsApp not configured" },
      { status: 503 },
    );
  }

  let body: ReminderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "Invalid JSON" }, { status: 400 });
  }

  const targetGroups = (body.age_groups ?? DEFAULT_ELIGIBLE_GROUPS).map(g =>
    g.toLowerCase().replace(/\s/g, ""),
  );

  // Build query params for player discovery endpoint
  const params = new URLSearchParams();
  if (body.province) params.set("province", body.province);
  if (body.sport)    params.set("sport",    body.sport);
  // Fetch for each age group and merge results
  const fetchPromises = targetGroups.map(ag =>
    fetch(`${API_URL}/players/discover?age_group=${encodeURIComponent(ag)}&${params.toString()}`)
      .then(r => r.ok ? r.json() : { data: [] })
      .catch(() => ({ data: [] })),
  );

  const results = await Promise.all(fetchPromises);

  // Collect all players, deduplicate by id
  const seen  = new Set<string>();
  const players: DiscoveredPlayer[] = [];

  for (const result of results) {
    const arr: DiscoveredPlayer[] = Array.isArray(result)
      ? result
      : Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
          ? result.data
          : [];

    for (const p of arr) {
      if (p.id && !seen.has(p.id)) {
        seen.add(p.id);
        players.push(p);
      }
    }
  }

  let sent    = 0;
  let skipped = 0;

  for (const player of players) {
    if (!player.phone) {
      skipped++;
      continue;
    }

    // Normalise: strip non-digits
    const to = player.phone.replace(/[^0-9]/g, "");
    if (to.length < 8) {
      skipped++;
      continue;
    }

    const message = buildMessage(player);
    if (!message) {
      skipped++;
      continue;
    }

    const ok = await sendWhatsApp(to, message, phoneNumberId, accessToken);
    if (ok) {
      sent++;
    } else {
      skipped++;
    }

    // Small delay between sends to avoid rate limits (50ms)
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return NextResponse.json({
    ok:      true,
    sent,
    skipped,
    total:   players.length,
  });
}
