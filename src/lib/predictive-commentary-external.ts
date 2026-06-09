// lib/predictive-commentary-external.ts
import { ExternalPlayer } from './external-player-data';

export function predictGoalLikelihood(
  player: ExternalPlayer,
  positionOnPitch: { x: number; y: number },
  minute: number
): number {
  let prob = 0;
  
  // Position bonus
  if (player.position === 'Offence') prob += 25;
  if (player.position === 'Midfield' && positionOnPitch.x > 70) prob += 15;
  
  // Historical performance (from external API)
  if (player.goalsThisSeason && player.goalsThisSeason > 5) prob += 20;
  if (player.rating && player.rating > 7.5) prob += 15;
  
  // Late game clutch
  if (minute > 75) prob += 10;
  
  return Math.min(95, prob);
}

export function predictFoulLikelihood(player: ExternalPlayer, minute: number): number {
  let prob = 5;
  if (player.position === 'Defence') prob += 15;
  if (player.yellowCards && player.yellowCards > 3) prob += 20;
  if (minute > 80) prob += 15;
  return Math.min(70, prob);
}

export function generateExcitementPhrase(player: ExternalPlayer, event: 'goal' | 'foul' | 'sprint'): string {
  const name = player.name.split(' ').pop(); // last name only
  const ratingBoost = (player.rating && player.rating > 8) ? ' STAR PLAYER! ' : '';
  
  switch(event) {
    case 'goal':
      return `⚽ ${name}${ratingBoost}IN THE DANGER ZONE! He has ${player.goalsThisSeason} goals this season! LISTEN TO THE CROWD!`;
    case 'foul':
      return `⚠️ ${name} under pressure! Already on ${player.yellowCards} yellow cards this tournament!`;
    case 'sprint':
      return `💨 ${name} EXPLODES down the wing! Defenders can't keep up!`;
  }
}