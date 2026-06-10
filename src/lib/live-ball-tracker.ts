// src/lib/live-ball-tracker.ts

export interface BallUpdate {
  x: number;
  y: number;
  timestamp: number;
  event?: string;
}

// This function would call a real API like Sportmonks
// For now, it returns a simulated position based on match phase
export async function fetchBallPosition(matchId: string, minute: number): Promise<BallUpdate> {
  // In production: replace with actual API call
  // const res = await fetch(`https://api.sportmonks.com/v3/football/live/${matchId}?api_key=YOUR_KEY`);
  // const data = await res.json();
  // return { x: data.ball.x, y: data.ball.y, timestamp: Date.now() };
  
  // SIMULATION (for demonstration - replace with real API)
  // Random movement but biased towards attacking team's half
  const attackDirection = Math.sin(minute / 5) > 0 ? 1 : -1;
  const baseX = 50 + (attackDirection * 20 * Math.random());
  const x = Math.min(95, Math.max(5, baseX + (Math.random() - 0.5) * 10));
  const y = Math.min(95, Math.max(5, 30 + Math.random() * 40));
  
  return { x, y, timestamp: Date.now() };
}

// For live matches, you would poll every 2-3 seconds
export function startBallTracking(
  matchId: string, 
  onUpdate: (pos: BallUpdate) => void,
  intervalMs = 3000
): () => void {
  let active = true;
  let minute = 0;
  
  const interval = setInterval(async () => {
    if (!active) return;
    minute += 0.5; // simulate time passing
    const pos = await fetchBallPosition(matchId, minute);
    if (active) onUpdate(pos);
  }, intervalMs);
  
  return () => {
    active = false;
    clearInterval(interval);
  };
}