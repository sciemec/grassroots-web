// lib/whatsapp-service.ts
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

// Lazy client — avoids crash at module load when env vars are not set
let _client: ReturnType<typeof twilio> | null = null;
function getClient() {
  if (!_client) {
    if (!accountSid || !authToken) throw new Error('Twilio env vars TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN not set');
    _client = twilio(accountSid, authToken);
  }
  return _client;
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'half_start' | 'half_end' | 'full_time';
  team: 'home' | 'away';
  playerName?: string;
  homeScore: number;
  awayScore: number;
  homePossession?: number;
  awayPossession?: number;
  homeShots?: number;
  awayShots?: number;
}

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
  
  // Send welcome message
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

export function getSubscriberCount(): number {
  return subscribers.size;
}

export async function sendWhatsAppMessage(to: string, body: string): Promise<boolean> {
  try {
    // Normalise: strip any existing whatsapp: prefix before re-adding it
    const normalised = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    await getClient().messages.create({
      body: body,
      from: fromNumber,
      to: normalised
    });
    return true;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return false;
  }
}

export async function broadcastToAll(message: string): Promise<number> {
  let successCount = 0;
  
  for (const [phoneNumber, subscriber] of subscribers) {
    const sent = await sendWhatsAppMessage(phoneNumber, message);
    if (sent) successCount++;
    
    // Rate limit to avoid Twilio throttling
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

// Generate match update message
export function generateMatchUpdateMessage(event: MatchEvent, affiliateLink?: string): string {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  switch (event.type) {
    case 'goal':
      return `
⚽ GOAL! ${event.playerName || 'A player'} scores!
${event.minute}' minute

📊 Score: ${event.homeScore} - ${event.awayScore}

🎙️ ${process.env.SPONSOR_GOAL_MESSAGE || 'Sponsored by GrassRoots Sports'}

${affiliateLink ? `🔗 Bet on next goal: ${affiliateLink}` : ''}

Reply "STATS" for match statistics
      `.trim();
      
    case 'half_end':
      return `
🎙️ HALF-TIME ANALYSIS - ${event.minute}' minutes played

📊 STATS:
Home: ${event.homePossession || 50}% possession, ${event.homeShots || 0} shots
Away: ${event.awayPossession || 50}% possession, ${event.awayShots || 0} shots

🤖 AI ANALYSIS:
${generateHalftimeAnalysis(event)}

${process.env.SPONSOR_HALFTIME_MESSAGE || 'Sponsored by GrassRoots Sports'}

💰 Second half specials: ${affiliateLink || process.env.BETWAY_AFFILIATE_URL}

Reply "GOAL" for goal alerts only
      `.trim();
      
    case 'full_time':
      return `
🏁 FULL TIME - ${event.minute}' minutes played

FINAL SCORE: ${event.homeScore} - ${event.awayScore}

📊 FULL STATS:
Possession: ${event.homePossession || 50}% - ${event.awayPossession || 50}%
Shots: ${event.homeShots || 0} - ${event.awayShots || 0}

${process.env.SPONSOR_FULLTIME_MESSAGE || 'Sponsored by GrassRoots Sports'}

📱 Share this match with friends!
🔗 Next match odds: ${affiliateLink || process.env.BETWAY_AFFILIATE_URL}

Reply "SUBSCRIBE" for more match updates
      `.trim();
      
    default:
      return `
📊 MATCH UPDATE - ${event.minute}' minute

Score: ${event.homeScore} - ${event.awayScore}
Possession: ${event.homePossession || 50}% - ${event.awayPossession || 50}%

${affiliateLink ? `🔗 Live odds: ${affiliateLink}` : ''}

Reply "STATS" for more details
      `.trim();
  }
}

function generateHalftimeAnalysis(event: MatchEvent): string {
  const homeDominant = (event.homePossession || 50) > 55;
  const awayDominant = (event.awayPossession || 50) > 55;
  const homeShotsMore = (event.homeShots || 0) > (event.awayShots || 0) + 2;
  
  if (homeDominant) {
    return `Home team controlling the game with ${event.homePossession}% possession. ` +
           `${homeShotsMore ? `${event.homeShots} shots, surely a goal is coming!` : 'Creating chances but need to be more clinical.'}`;
  }
  
  if (awayDominant) {
    return `Away team looking dangerous on the counter. ${event.awayShots} shots despite less possession. Watch for a breakaway goal!`;
  }
  
  return `Very tight contest. Both teams cancelling each other out. Next goal is crucial!`;
}