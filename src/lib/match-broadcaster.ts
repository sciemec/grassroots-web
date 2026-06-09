// lib/match-broadcaster.ts

// This polls the football API and broadcasts events to WhatsApp
export async function startMatchBroadcaster(matchId: string) {
  let lastEventId = '';
  
  const interval = setInterval(async () => {
    try {
      // Fetch latest match events from your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/world-cup/matches/${matchId}`);
      const data = await response.json();
      
      const newEvents = data.events.filter((e: any) => e.id !== lastEventId);
      
      for (const event of newEvents) {
        // Broadcast to WhatsApp
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/whatsapp/match-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'broadcast_event',
            matchId,
            event: {
              id: event.id,
              minute: event.minute,
              type: event.type,
              playerName: event.player,
              homeScore: data.homeScore,
              awayScore: data.awayScore,
              homePossession: data.stats?.possession?.home,
              awayPossession: data.stats?.possession?.away,
              homeShots: data.stats?.shots?.home,
              awayShots: data.stats?.shots?.away,
            }
          })
        });
        
        lastEventId = event.id;
      }
      
    } catch (error) {
      console.error('Broadcaster error:', error);
    }
  }, 5000); // Check every 5 seconds
  
  return () => clearInterval(interval);
}