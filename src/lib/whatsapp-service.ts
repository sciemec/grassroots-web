// src/lib/whatsapp-service.ts
// WhatsApp messaging via Meta Cloud API
// Replaces former Twilio SDK implementation

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

export interface Subscriber {
  phoneNumber: string;
  name: string;
  preferences: {
    goals: boolean;
    stats: boolean;
    halftimeAnalysis: boolean;
    affiliateLinks: boolean;
  };
  subscriptionTier: 'free' | 'premium';
}

// Store subscribers (in production, use database)
const subscribers: Map<string, Subscriber> = new Map();

// ── Credentials ───────────────────────────────────────────────────────────────

function getCredentials(): { phoneNumberId: string; accessToken: string } | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    console.error('[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return null;
  }
  return { phoneNumberId, accessToken };
}

// Strip 'whatsapp:' prefix and leading '+' — Meta API takes bare E.164 digits
function normaliseRecipient(to: string): string {
  return to.replace(/^whatsapp:/i, '').replace(/^\+/, '');
}

// ── Core send functions ───────────────────────────────────────────────────────

export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) return false;
  try {
    const res = await fetch(`${GRAPH_URL}/${creds.phoneNumberId}/messages`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:   normaliseRecipient(to),
        type: 'text',
        text: { body },
      }),
    });
    if (!res.ok) {
      console.error('[WhatsApp] Send failed:', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    return false;
  }
}

export async function sendWhatsAppVideo(to: string, videoUrl: string, caption?: string): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) return false;
  try {
    const res = await fetch(`${GRAPH_URL}/${creds.phoneNumberId}/messages`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to:    normaliseRecipient(to),
        type:  'video',
        video: { link: videoUrl, caption: caption ?? '' },
      }),
    });
    if (!res.ok) {
      console.error('[WhatsApp] Video send failed:', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[WhatsApp] Video send error:', error);
    return false;
  }
}

// ── Higher-level helpers ──────────────────────────────────────────────────────

export async function subscribeUser(phoneNumber: string, name: string): Promise<boolean> {
  const subscriber: Subscriber = {
    phoneNumber,
    name,
    preferences: {
      goals:            true,
      stats:            true,
      halftimeAnalysis: true,
      affiliateLinks:   true,
    },
    subscriptionTier: 'free',
  };

  subscribers.set(phoneNumber, subscriber);

  await sendWhatsAppMessage(
    phoneNumber,
    `\uD83C\uDDF5\uD83C\uDDFC Welcome to GrassRoots Sports, ${name}!\n\n` +
    `You'll receive:\n` +
    `\u26BD Live goal alerts (sponsored)\n` +
    `\uD83D\uDCCA Match stats every 15 minutes\n` +
    `\uD83C\uDFA4 AI halftime analysis\n` +
    `\uD83D\uDCB0 Exclusive betting offers\n\n` +
    `Reply "STOP" to unsubscribe at any time.`,
  );

  return true;
}

export async function sendMatchHighlight(to: string, matchTitle: string, videoUrl: string): Promise<boolean> {
  const caption =
    `\uD83C\uDFA5 ${matchTitle} Highlight\n\n` +
    `Watch the key moment from this match!\n\n` +
    `Powered by GrassRoots Sports`;
  return sendWhatsAppVideo(to, videoUrl, caption);
}

export async function broadcastToAll(message: string): Promise<number> {
  let successCount = 0;
  for (const [phoneNumber] of subscribers) {
    const sent = await sendWhatsAppMessage(phoneNumber, message);
    if (sent) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return successCount;
}

export async function broadcastToSubscribers(
  message: string,
  filter?: (sub: Subscriber) => boolean,
): Promise<number> {
  let successCount = 0;
  for (const [phoneNumber, subscriber] of subscribers) {
    if (filter && !filter(subscriber)) continue;
    const sent = await sendWhatsAppMessage(phoneNumber, message);
    if (sent) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return successCount;
}
