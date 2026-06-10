// src/lib/live-ball-tracker.ts

export interface BallUpdate {
  x: number;
  y: number;
  timestamp: number;
  event?: string;
}

// This function would call a real API like Sportmonks
// For now, it returns a simulated position based on match phase
// _matchId is intentionally unused until the real API is wired in
export function fetchBallPosition(_matchId: string, minute: number): Promise<BallUpdate> {
  // In production: replace with actual API call
  // const res = await fetch(`https://api.sportmonks.com/v3/football/live/${_matchId}?api_key=YOUR_KEY`);
  // const data = await res.json();
  // return { x: data.ball.x, y: data.ball.y, timestamp: Date.now() };

  // SIMULATION (for demonstration - replace with real API)
  const attackDirection = Math.sin(minute / 5) > 0 ? 1 : -1;
  const baseX = 50 + (attackDirection * 20 * Math.random());
  const x = Math.min(95, Math.max(5, baseX + (Math.random() - 0.5) * 10));
  const y = Math.min(95, Math.max(5, 30 + Math.random() * 40));

  return Promise.resolve({ x, y, timestamp: Date.now() });
}

// For live matches, you would poll every 2-3 seconds.
// Uses recursive setTimeout instead of setInterval to prevent overlapping
// async calls when fetchBallPosition takes longer than intervalMs.
export function startBallTracking(
  matchId: string,
  onUpdate: (pos: BallUpdate) => void,
  intervalMs = 3000,
  startMinute = 0,
): () => void {
  let active = true;
  let minute = startMinute;

  const tick = () => {
    if (!active) return;
    minute = Math.min(minute + 0.5, 90);
    fetchBallPosition(matchId, minute)
      .then((pos) => {
        if (active) onUpdate(pos);
      })
      .catch((err) => {
        console.error('fetchBallPosition error:', err);
      })
      .finally(() => {
        if (active) setTimeout(tick, intervalMs);
      });
  };

  setTimeout(tick, intervalMs);

  return () => { active = false; };
}
