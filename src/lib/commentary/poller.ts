// src/lib/commentary/poller.ts
// iSports match event polling — stubbed (no active subscription)
const fetchMatchEvents = async (
  _matchId: string,
  _lastEventId?: string
): Promise<Array<{ id: string; minute?: number; event_type: string; team_name: string; player_name: string; assist_player_name?: string }>> => [];
import { CommentaryBroadcaster } from './broadcaster';
import type { MatchEvent } from './engine';

export class EventPoller {
  private interval: NodeJS.Timeout | null = null;
  private lastEventId: string | null = null;
  private isPolling: boolean = false;

  constructor(
    private matchId: string,
    private broadcaster: CommentaryBroadcaster,
    private onEvent: (event: MatchEvent) => void,
    private intervalMs: number = 5000 // Poll every 5 seconds
  ) {}

  start(): void {
    if (this.isPolling) return;
    this.isPolling = true;
    this.poll();
  }

  stop(): void {
    this.isPolling = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private async poll(): Promise<void> {
    if (!this.isPolling) return;

    try {
      const events = await fetchMatchEvents(this.matchId, this.lastEventId || undefined);
      
      // Process new events
      for (const event of events) {
        // Transform iSports event to our MatchEvent format
        const matchEvent: MatchEvent = {
          id: event.id,
          minute: event.minute || 0,
          eventType: event.event_type as any,
          team: event.team_name,
          playerName: event.player_name,
          assistPlayerName: event.assist_player_name,
          homeScore: 0, // Will be updated by broadcaster
          awayScore: 0,
          homeTeam: '',
          awayTeam: '',
        };

        // Notify broadcaster
        await this.broadcaster.processEvent(matchEvent);
        this.lastEventId = event.id;
      }

      // Schedule next poll
      this.interval = setTimeout(() => this.poll(), this.intervalMs);
    } catch (error) {
      console.error('Polling error:', error);
      // Retry after delay
      this.interval = setTimeout(() => this.poll(), this.intervalMs);
    }
  }

  updateMatchId(matchId: string): void {
    this.matchId = matchId;
    this.lastEventId = null;
  }
}