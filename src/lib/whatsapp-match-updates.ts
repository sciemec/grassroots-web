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

const ADULT_AGE_GROUPS = ['18_25', '26_plus'] as const;

export function generateWhatsAppMessage(
  update: MatchUpdate,
  affiliateLink: string,
  userAgeGroup?: string,
): string {
  const isAdult = !!userAgeGroup && (ADULT_AGE_GROUPS as readonly string[]).includes(userAgeGroup);
  const bettingLine = isAdult && affiliateLink
    ? `\n\n🔗 ${affiliateLink}\n⚠️ 18+ only. Gamble responsibly.`
    : '';

  switch (update.type) {
    case 'goal':
      return `
⚽ GOAL! ${update.scorer} scores for ${update.homeScore > update.awayScore ? 'HOME' : 'AWAY'}!
${update.minute}' minute

🎙️ "${update.sponsor || 'This goal'} brought to you by GrassRoots Sports"

📊 Score: ${update.homeScore} - ${update.awayScore}${bettingLine}
      `.trim();

    case 'halftime':
      return `
🎙️ HALF-TIME ANALYSIS - ${update.minute}' minutes played

📊 STATS:
Home: ${update.homePossession}% possession, ${update.homeShots} shots
Away: ${update.awayPossession}% possession, ${update.awayShots} shots

🤖 AI BOT DEBATE:
"The Analyst says: ${generateAnalystComment(update)}"
"The Pundit says: ${generatePunditComment(update)}"${bettingLine}
      `.trim();

    case 'stats':
      return `
📊 MATCH STATS - ${update.minute}' minute

Possession:  ${update.homePossession}% - ${update.awayPossession}%
Shots:       ${update.homeShots} - ${update.awayShots}
On target:   ${Math.floor(update.homeShots * 0.4)} - ${Math.floor(update.awayShots * 0.3)}

🔮 ${update.homePossession > 55 ? 'Home team dominating' : 'Close contest'}${bettingLine}
      `.trim();

    default:
      return `
⚽ LIVE: ${update.minute}' minute
${update.homeScore} - ${update.awayScore}

${update.eventDescription || 'End to end action!'}${bettingLine}
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