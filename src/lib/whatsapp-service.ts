// src/lib/whatsapp-service.ts
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

const client = twilio(accountSid, authToken);

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
let subscribers: Map<string, Subscriber> = new Map();

export async function subscribeUser(phoneNumber: string, name: string): Promise<boolean> {
  const subscriber: Subscriber = {
    phoneNumber,
    name,
    preferences: {
      goals: true,
      stats: true,
      halftimeAnalysis: true,
      affiliateLinks: true,
    },
    subscriptionTier: 'free'
  };
  
  subscribers.set(phoneNumber, subscriber);
  
  await sendWhatsAppMessage(
    phoneNumber,
    `🇿🇼 Welcome to GrassRoots Sports World Cup Live, ${name}!\n\n` +
    `You'll receive:\n` +
    `⚽ Live goal alerts (sponsored)\n` +
    `📊 Match stats every 15 minutes\n` +
    `🎙️ AI halftime analysis\n` +
    `💰 Exclusive betting offers\n\n` +
    `Reply "STOP" to unsubscribe at any time.`
  );
  
  return true;
}

// Send text message
export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  try {
    await client.messages.create({
      body: body,
      from: fromNumber,
      to: `whatsapp:${to}`
    });
    return true;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

// 🆕 Send Video Message (NEW)
export async function sendWhatsAppVideo(to: string, videoUrl: string, caption?: string): Promise<boolean> {
  try {
    // Video requirements: MP4, H.264 codec, AAC audio, max 16MB
    await client.messages.create({
      from: fromNumber,
      to: `whatsapp:${to}`,
      mediaUrl: [videoUrl],
      body: caption || ''
    });
    return true;
  } catch (error) {
    console.error('WhatsApp video send error:', error);
    return false;
  }
}

// 🆕 Send Match Highlight Video (NEW)
export async function sendMatchHighlight(to: string, matchTitle: string, videoUrl: string): Promise<boolean> {
  const caption = `🎥 ${matchTitle} Highlight\n\nWatch the key moment from this match!\n\nPowered by GrassRoots Sports`;
  return sendWhatsAppVideo(to, videoUrl, caption);
}

// Broadcast to all subscribers
export async function broadcastToAll(message: string): Promise<number> {
  let successCount = 0;
  for (const [phoneNumber, subscriber] of subscribers) {
    const sent = await sendWhatsAppMessage(phoneNumber, message);
    if (sent) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return successCount;
}

export async function broadcastToSubscribers(message: string, filter?: (sub: Subscriber) => boolean): Promise<number> {
  let successCount = 0;
  for (const [phoneNumber, subscriber] of subscribers) {
    if (filter && !filter(subscriber)) continue;
    const sent = await sendWhatsAppMessage(phoneNumber, message);
    if (sent) successCount++;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return successCount;
}