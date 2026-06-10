// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';

function twimlResponse(status = 200) {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status,
    headers: { 'Content-Type': 'application/xml' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Validate Twilio signature — reject requests not originating from Twilio
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (authToken) {
      const signature = req.headers.get('x-twilio-signature') ?? '';
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`;
      const params = Object.fromEntries(
        [...formData.entries()].map(([k, v]) => [k, v.toString()])
      ) as Record<string, string>;
      const valid = twilio.validateRequest(authToken, signature, url, params);
      if (!valid) {
        console.warn('Webhook: invalid Twilio signature — request rejected');
        return twimlResponse(403);
      }
    }

    const body = formData.get('Body')?.toString();
    const from = formData.get('From')?.toString().replace('whatsapp:', '');

    if (!body || !from) {
      console.warn('Webhook: missing Body or From field');
      return twimlResponse(200);
    }

    const command = body.toLowerCase().trim();
    const affiliateUrl = process.env.BETWAY_AFFILIATE_URL ?? '';

    switch (command) {
      case 'stop':
      case 'unsubscribe':
        // In production, remove from database
        await sendWhatsAppMessage(from,
          `You have been unsubscribed from GrassRoots Sports updates.\n\n` +
          `Reply "START" to resubscribe.`
        );
        break;

      case 'stats':
        await sendWhatsAppMessage(from,
          `📊 To get match stats, reply with the match ID:\n` +
          `Example: "STATS Spain vs Germany"\n\n` +
          `Live matches:\n` +
          `• Spain vs Germany (ID: SPA_GER)\n` +
          `• Brazil vs Argentina (ID: BRA_ARG)`
        );
        break;

      case 'goal':
        await sendWhatsAppMessage(from,
          `⚽ You'll now receive ONLY goal alerts.\n` +
          `Reply "ALL" to receive full updates again.`
        );
        // Update user preference
        break;

      case 'all':
        await sendWhatsAppMessage(from,
          `📱 You'll now receive ALL match updates.\n` +
          `Reply "GOAL" for goals only, "STATS" for match data.`
        );
        break;

      case 'help':
        await sendWhatsAppMessage(from,
          `📱 GrassRoots Sports Help\n\n` +
          `Commands:\n` +
          `• STATS - Get match statistics\n` +
          `• GOAL - Goals only mode\n` +
          `• ALL - Full updates mode\n` +
          `• STOP - Unsubscribe\n` +
          `• HELP - Show this menu` +
          (affiliateUrl ? `\n\n💰 Betting offers: ${affiliateUrl}` : '')
        );
        break;

      default:
        // Check if asking for specific match stats
        if (command.includes('stats') || command.includes('vs')) {
          await sendWhatsAppMessage(from,
            `📊 Fetching stats for ${body}...\n\n` +
            `This feature is coming soon! For now, follow live updates.`
          );
        } else {
          await sendWhatsAppMessage(from,
            `📱 GrassRoots Sports Live\n\n` +
            `Reply "HELP" for available commands.\n` +
            `Reply "STOP" to unsubscribe.`
          );
        }
    }

    return twimlResponse(200);

  } catch (error) {
    console.error('Webhook error:', error);
    // Always return 200 to Twilio — non-200 causes retries and duplicate messages
    return twimlResponse(200);
  }
}

// Twilio does NOT use GET for webhook verification (that is a Meta/WhatsApp Business pattern).
// This handler exists only as a health-check endpoint.
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}
