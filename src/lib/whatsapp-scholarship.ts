// src/lib/whatsapp-scholarship.ts
// Inbound WhatsApp scholarship flow:
// 1. Detect scholarship keywords in a player's incoming message
// 2. Look up their profile from the backend by phone number
// 3. Run matchPlayerToScholarships() and build a personalised reply
// 4. Send the reply via Meta Cloud API

import { matchPlayerToScholarships, type PlayerMatchData } from "@/lib/scholarship-matcher";

const GRAPH_URL = "https://graph.facebook.com/v19.0";
const API_URL   = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ── Keyword detection ────────────────────────────────────────────────────────

const SCHOLARSHIP_KEYWORDS = [
  "scholarship", "schola", "bursary", "ncaa", "university",
  "study abroad", "pathway", "college", "4",
];

export function isScholarshipIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return SCHOLARSHIP_KEYWORDS.some(kw => lower.includes(kw));
}

// ── Player profile lookup ────────────────────────────────────────────────────

interface PlayerProfile {
  name?:               string;
  sport:               string;
  position:            string;
  thuto_score:         number;
  school_year:         string;
  ncaa_registered:     boolean;
  english_proficiency: string;   // 'none' | 'basic' | 'ielts' | 'native'
  reel_complete:       boolean;
  target_pathway:      string;   // 'ncaa_d1' | 'ncaa_d2' | 'uk' | 'naia' | etc.
}

async function fetchPlayerByPhone(digits: string): Promise<PlayerProfile | null> {
  try {
    const res = await fetch(
      `${API_URL}/players/by-phone/${encodeURIComponent(digits)}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as PlayerProfile;
  } catch {
    return null;
  }
}

// ── Message builders ─────────────────────────────────────────────────────────

function buildScholarshipMessage(
  matches: ReturnType<typeof matchPlayerToScholarships>,
  playerName?: string,
): string {
  const top3 = matches.slice(0, 3);
  const first = playerName ? playerName.split(" ")[0] : null;
  const greeting = first ? `Hi ${first}!` : "Hi!";

  const lines: string[] = [
    `🎓 *GrassRoots Sports — Scholarship Matches*`,
    ``,
    `${greeting} Here are your top scholarship opportunities right now:`,
    ``,
  ];

  if (top3.length === 0) {
    lines.push(
      `No matches found yet. Complete your profile (sport, position, THUTO score) to unlock programmes.`,
      ``,
      `Build your profile here:`,
      `grassrootssports.live/player/pathway`,
    );
    return lines.join("\n");
  }

  top3.forEach((m, i) => {
    lines.push(`${i + 1}. *${m.program.institution}* — ${m.program.division} ${m.program.sport}`);
    lines.push(`   ${m.label} · ${Math.round(m.score)}% fit`);
    if (m.blockers.length > 0) {
      lines.push(`   💡 Next step: ${m.blockers[0]}`);
    }
    lines.push(`   📍 ${m.program.country}`);
    lines.push(``);
  });

  lines.push(`Reply *more* to see all your matches, or open THUTO to ask questions:`);
  lines.push(`grassrootssports.live/player/pathway`);

  return lines.join("\n");
}

function buildNoProfileMessage(): string {
  return [
    `🎓 *GrassRoots Sports — Scholarships*`,
    ``,
    `We couldn't find a player profile linked to this number.`,
    ``,
    `To get personalised scholarship matches:`,
    `1. Register at grassrootssports.live/register`,
    `2. Complete your sport, position and THUTO score`,
    `3. Text *scholarship* again`,
    ``,
    `Already registered? Make sure your WhatsApp number matches your account.`,
  ].join("\n");
}

// ── Meta Cloud API send ───────────────────────────────────────────────────────

async function sendWhatsApp(
  to: string,
  body: string,
  phoneNumberId: string,
  accessToken: string,
): Promise<void> {
  await fetch(`${GRAPH_URL}/${phoneNumberId}/messages`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body, preview_url: false },
    }),
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────

/**
 * Called when a scholarship keyword is detected in an inbound WhatsApp message.
 * Looks up the player's profile, runs the matcher, and sends a personalised reply.
 * Returns true if a reply was sent, false if credentials are missing.
 */
export async function handleScholarshipIntent(senderPhone: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) return false;

  // Strip non-digits for the backend lookup
  const digits  = senderPhone.replace(/\D/g, "");
  const profile = await fetchPlayerByPhone(digits);

  let message: string;

  if (!profile) {
    message = buildNoProfileMessage();
  } else {
    const playerData: PlayerMatchData = {
      sport:               profile.sport               ?? "football",
      position:            profile.position            ?? "",
      thuto_score:         profile.thuto_score         ?? 0,
      school_year:         profile.school_year         ?? "form5",
      ncaa_registered:     profile.ncaa_registered     ?? false,
      english_proficiency: profile.english_proficiency ?? "basic",
      reel_complete:       profile.reel_complete        ?? false,
      target_pathway:      profile.target_pathway       ?? "ncaa_d2",
    };
    const matches = matchPlayerToScholarships(playerData);
    message = buildScholarshipMessage(matches, profile.name);
  }

  await sendWhatsApp(senderPhone, message, phoneNumberId, accessToken);
  return true;
}
