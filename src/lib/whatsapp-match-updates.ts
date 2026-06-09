// lib/whatsapp-match-updates.ts

export interface MatchUpdate {
  minute: number;
  type: 'stats' | 'goal' | 'key_moment' | 'halftime' | 'fulltime';
  homeScore: number;
  awayScore: number;
  homePossession: number;
  awayPossession: number;
  homeShots: number;
  awayShots: number;
  eventDescription?: string;
  scorer?: string;
  sponsor?: string;
}

export function generateWhatsAppMessage(update: MatchUpdate, affiliateLink: string): string {
  const timestamp = new Date().toLocaleTimeString();
  
  switch (update.type) {
    case 'goal':
      return `
⚽ GOAL! ${update.scorer} scores for ${update.homeScore > update.awayScore ? 'HOME' : 'AWAY'}!
${update.minute}' minute

🎙️ "${update.sponsor || 'This goal'} brought to you by GrassRoots Sports"

📊 Score: ${update.homeScore} - ${update.awayScore}

🔗 Bet on next goal: ${affiliateLink}
      `.trim();
      
    case 'halftime':
      return `
🎙️ HALF-TIME ANALYSIS - ${update.minute}' minutes played

📊 STATS:
Home: ${update.homePossession}% possession, ${update.homeShots} shots
Away: ${update.awayPossession}% possession, ${update.awayShots} shots

🤖 AI BOT DEBATE:
"The Analyst says: ${generateAnalystComment(update)}"
"The Pundit says: ${generatePunditComment(update)}"

💰 Second half specials: ${affiliateLink}
      `.trim();
      
    case 'stats':
      return `
📊 MATCH STATS - ${update.minute}' minute

Possession:  ${update.homePossession}% - ${update.awayPossession}%
Shots:       ${update.homeShots} - ${update.awayShots}
On target:   ${Math.floor(update.homeShots * 0.4)} - ${Math.floor(update.awayShots * 0.3)}

🔮 ${update.homePossession > 55 ? 'Home team dominating' : 'Close contest'}

🔗 Live odds: ${affiliateLink}
      `.trim();
      
    default:
      return `
⚽ LIVE: ${update.minute}' minute
${update.homeScore} - ${update.awayScore}

${update.eventDescription || 'End to end action!'}

🔗 Bet now: ${affiliateLink}
      `.trim();
  }
}

function generateAnalystComment(update: MatchUpdate): string {
  if (update.homePossession > 60) {
    return `Home team controlling the tempo. ${update.homePossession}% possession suggests they'll break through soon.`;
  }
  return `Very tactical affair. Both teams cancelling each other out. Next goal is crucial.`;
}

function generatePunditComment(update: MatchUpdate): string {
  if (update.homeShots > update.awayShots + 3) {
    return `HOW ARE THEY NOT WINNING?! ${update.homeShots} shots and no goal! Unbelievable!`;
  }
  return `TIGHT GAME! One moment of magic will decide this! I can't watch!`;
}