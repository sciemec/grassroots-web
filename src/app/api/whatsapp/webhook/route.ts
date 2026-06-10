// app/api/whatsapp/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const body = formData.get('Body')?.toString();
    const from = formData.get('From')?.toString().replace('whatsapp:', '');
    const profileName = formData.get('ProfileName')?.toString();
    
    if (!body || !from) {
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
    }
    
    const command = body.toLowerCase().trim();
    
    // Handle user replies
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
          `• HELP - Show this menu\n\n` +
          `💰 Betting offers: ${process.env.BETWAY_AFFILIATE_URL}`
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
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Verify webhook for Twilio (GET request)
export async function GET(req: NextRequest) {
  // Twilio sends a GET request to verify the webhook URL
  return NextResponse.json({ status: 'ok' });
}