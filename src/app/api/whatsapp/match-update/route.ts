// app/api/whatsapp/match-update/route.ts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import {
  broadcastToSubscribers,
  generateMatchUpdateMessage,
  subscribeUser,
  getSubscriberCount,
  type MatchEvent,
  type Subscriber,
} from '@/lib/whatsapp-service';

// Store active matches (in production, use database)
const activeMatches = new Map();

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // ==========================================
    // 📱 FLOW A: HANDSHAKE FROM TWILIO WEBHOOKS
    // ==========================================
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      
      // Extract key fields from the Twilio WhatsApp payload
      const fromNumber = formData.get('From') ?? '';   // e.g., "whatsapp:+263xxxxxxxxx"
      const toNumber   = formData.get('To')   ?? '';   // Your Sandbox number
      const messageBody = formData.get('Body') ?? '';  // The actual text message sent
      const messageSid  = formData.get('MessageSid') ?? '';

      console.log(`\n📬 [WhatsApp Incoming] New message from ${fromNumber}:`);
      console.log(`💬 Content: "${messageBody}"`);
      console.log(`🆔 Message SID: ${messageSid}\n`);

      // TODO: Add inbound user command parsing here (e.g., if a user replies directly to an update)
      
      // Respond to Twilio with an empty TwiML template to peacefully acknowledge receipt
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
      return new NextResponse(twimlResponse, {
        status: 200,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    // ==========================================
    // ⚙️ FLOW B: INTERNAL PLATFORM ACTIONS (JSON)
    // ==========================================
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const {
      action,
      matchId,
      event,
      phoneNumber,
      name,
      message: customMessage,
      filterPremium,
    } = body as {
      action?: string;
      matchId?: string;
      event?: MatchEvent;
      phoneNumber?: string;
      name?: string;
      message?: string;
      filterPremium?: boolean;
    };

    // Handle subscription
    if (action === 'subscribe') {
      if (!phoneNumber || !name) {
        return NextResponse.json({ error: 'phoneNumber and name are required' }, { status: 400 });
      }
      const success = await subscribeUser(phoneNumber, name);
      return NextResponse.json({ success, message: 'Subscribed to match updates' });
    }
    
    // Handle match event broadcast
    if (action === 'broadcast_event' && event) {
      const affiliateLink = getAffiliateLinkForEvent(event);
      const message = generateMatchUpdateMessage(event, affiliateLink);
      
      // Filter subscribers who want this type of update
      const filter = (sub: Subscriber) => {
        if (event.type === 'goal' && !sub.preferences.goals) return false;
        return true;
      };
      
      const sentCount = await broadcastToSubscribers(message, filter);
      
      // Store event for later
      if (!activeMatches.has(matchId)) {
        activeMatches.set(matchId, []);
      }
      activeMatches.get(matchId).push(event);
      
      return NextResponse.json({ 
        success: true, 
        sentCount,
        message: `Broadcast to ${sentCount} subscribers`
      });
    }
    
    // Handle manual broadcast
    if (action === 'broadcast_custom') {
      if (!customMessage) {
        return NextResponse.json({ error: 'message is required' }, { status: 400 });
      }
      const filter = filterPremium
        ? (sub: Subscriber) => sub.subscriptionTier === 'premium'
        : undefined;
      const sentCount = await broadcastToSubscribers(customMessage, filter);
      
      return NextResponse.json({ success: true, sentCount });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('❌ WhatsApp API Processing Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to append targeted affiliate payloads to updates
function getAffiliateLinkForEvent(event: MatchEvent): string {
  if (event.type === 'goal') {
    return process.env.BETWAY_AFFILIATE_URL
      ? `${process.env.BETWAY_AFFILIATE_URL}&campaign=next_goal`
      : '';
  }
  if (event.type === 'half_end') {
    return process.env.PREMIERBET_AFFILIATE_URL
      ? `${process.env.PREMIERBET_AFFILIATE_URL}&campaign=second_half`
      : '';
  }
  return process.env.BETWAY_AFFILIATE_URL || '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  
  if (action === 'stats') {
    return NextResponse.json({
      totalSubscribers: getSubscriberCount(),
    });
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}