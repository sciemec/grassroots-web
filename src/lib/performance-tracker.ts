// Complete player performance tracking system

export interface TrainingSession {
  sessionId: string;
  playerId: string;
  playerName: string;
  sport: string;
  position: string;
  timestamp: string;
  duration: number;  // seconds
  metrics: {
    // Sprint mechanics
    kneeAngle: number;
    kneeRating: 'ELITE' | 'GOOD' | 'RAW';
    strideLength: number;
    armSwingEfficiency: number;
    
    // Body control
    headTilt: number;
    coreDrift: number;
    symmetryScore: number;
    fatigueIndex: number;
    
    // Holistic features
    explosivePower: number;
    overallForm: number;
    gripStrength: number;
    handSpeed: number;
    
    // Sport-specific
    jumpHeight?: number;
    throwSpeed?: number;
    agilityScore?: number;
  };
  faceVerification: {
    verified: boolean;
    confidence: number;
  };
  notes?: string;
}

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  sport: string;
  position: string;
  sessions: TrainingSession[];
  averages: {
    overallForm: number;
    explosivePower: number;
    symmetryScore: number;
  };
  trends: {
    improvementRate: number;      // % improvement over last 30 days
    consistencyScore: number;     // 0-100 (how regular they train)
    peakForm: number;             // Best overallForm score ever
  };
  lastSessionDate: string;
  totalSessions: number;
}

// Store a training session
export async function saveTrainingSession(
  session: TrainingSession
): Promise<void> {
  // Save to localStorage (offline first)
  const sessions = getStoredSessions(session.playerId);
  sessions.unshift(session);
  localStorage.setItem(
    `training_sessions_${session.playerId}`,
    JSON.stringify(sessions.slice(0, 100)) // Keep last 100 sessions
  );
  
  // Sync to backend if online
  if (navigator.onLine) {
    try {
      const token = localStorage.getItem("auth_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/player/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(session)
      });
    } catch (err) {
      console.error("Failed to sync session:", err);
    }
  }
}

// Get all sessions for a player
export function getStoredSessions(playerId: string): TrainingSession[] {
  const stored = localStorage.getItem(`training_sessions_${playerId}`);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Calculate player performance metrics over time
export function calculatePerformanceTrends(
  sessions: TrainingSession[]
): PlayerPerformance | null {
  if (!sessions.length) return null;
  
  const firstSession = sessions[sessions.length - 1];
  const lastSession = sessions[0];
  
  // Calculate averages of last 10 sessions
  const recentSessions = sessions.slice(0, 10);
  const avgOverall = recentSessions.reduce((sum, s) => sum + s.metrics.overallForm, 0) / recentSessions.length;
  const avgExplosive = recentSessions.reduce((sum, s) => sum + s.metrics.explosivePower, 0) / recentSessions.length;
  const avgSymmetry = recentSessions.reduce((sum, s) => sum + s.metrics.symmetryScore, 0) / recentSessions.length;
  
  // Improvement rate (first session vs last session)
  const firstScore = firstSession.metrics.overallForm;
  const lastScore = lastSession.metrics.overallForm;
  const improvementRate = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;
  
  // Consistency score (how many days between sessions)
  const dates = sessions.map(s => new Date(s.timestamp).getTime());
  let consistencyScore = 100;
  for (let i = 0; i < dates.length - 1; i++) {
    const daysDiff = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
    if (daysDiff > 7) consistencyScore -= 10;
  }
  consistencyScore = Math.max(0, Math.min(100, consistencyScore));
  
  return {
    playerId: lastSession.playerId,
    playerName: lastSession.playerName,
    sport: lastSession.sport,
    position: lastSession.position,
    sessions: sessions.slice(0, 20),
    averages: {
      overallForm: Math.round(avgOverall),
      explosivePower: Math.round(avgExplosive),
      symmetryScore: Math.round(avgSymmetry)
    },
    trends: {
      improvementRate: Math.round(improvementRate),
      consistencyScore: Math.round(consistencyScore),
      peakForm: Math.max(...sessions.map(s => s.metrics.overallForm))
    },
    lastSessionDate: lastSession.timestamp,
    totalSessions: sessions.length
  };
}

// Export performance data for scouts
export function exportScoutReport(player: PlayerPerformance): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `
╔══════════════════════════════════════════════════════════════╗
║           GRASSROOTS SPORTS - SCOUTING REPORT                ║
╚══════════════════════════════════════════════════════════════╝

PLAYER: ${player.playerName}
SPORT: ${player.sport}
POSITION: ${player.position}
TOTAL SESSIONS: ${player.totalSessions}
LAST TRAINED: ${new Date(player.lastSessionDate).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFORMANCE METRICS:
┌─────────────────────────────────────────────────────────────┐
│ Overall Form:        ${player.averages.overallForm}/100                │
│ Explosive Power:     ${player.averages.explosivePower}/100                │
│ Movement Symmetry:   ${player.averages.symmetryScore}/100                │
└─────────────────────────────────────────────────────────────┘

TRENDS:
┌─────────────────────────────────────────────────────────────┐
│ Improvement Rate:    ${player.trends.improvementRate > 0 ? '+' : ''}${player.trends.improvementRate}%              │
│ Consistency Score:   ${player.trends.consistencyScore}/100                │
│ Peak Form Achieved:  ${player.trends.peakForm}/100                │
└─────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SESSION HISTORY:
${player.sessions.slice(0, 5).map((s, i) => {
  const date = new Date(s.timestamp).toLocaleDateString();
  return `${i+1}. ${date} - Form: ${s.metrics.overallForm} | Power: ${s.metrics.explosivePower} | Symmetry: ${s.metrics.symmetryScore}`;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AI ASSESSMENT:
This player shows ${player.trends.improvementRate > 10 ? 'excellent' : 'steady'} improvement over time.
${player.trends.consistencyScore > 70 ? 'Training consistency is high - shows dedication.' : 'Training consistency needs improvement.'}
${player.averages.overallForm > 80 ? 'Currently performing at elite levels for their age group.' : 'Has potential to develop further with continued training.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated: ${date}
GrassRoots Sports - AI-Powered Talent Identification
`;
}