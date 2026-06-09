// lib/player-predictions.ts
// Uses REAL player data from your database

export interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  goalsThisSeason: number;
  shotAccuracy: number; // 0-100
  sprintSpeed: number; // km/h
  fatigueLevel: number; // 0-100
  formScore: number; // THUTO score
  preferredFoot: 'left' | 'right' | 'both';
  favoriteZones: string[]; // ['box_left', 'box_center', 'edge_of_box']
}

export interface GameState {
  ballPosition: { x: number; y: number }; // 0-100 pitch coordinates
  timeMinute: number;
  homeScore: number;
  awayScore: number;
  homePossession: number;
  awayPossession: number;
}

export interface Prediction {
  playerId: string;
  playerName: string;
  eventType: 'goal' | 'assist' | 'foul' | 'yellow_card' | 'sprint';
  probability: number; // 0-100
  excitementLevel: 'low' | 'medium' | 'high' | 'explosive';
  triggerPhrase: string;
  celebrationPhrase: string;
}

// Calculate probability of a player scoring
export function calculateGoalProbability(
  player: PlayerProfile,
  gameState: GameState,
  ballCarrier: boolean
): number {
  let probability = 0;
  
  // Base from player stats
  probability += (player.formScore / 100) * 30;
  probability += (player.shotAccuracy / 100) * 25;
  probability += (player.goalsThisSeason / 20) * 15;
  
  // Fatigue factor (tired players less likely to score)
  probability -= (player.fatigueLevel / 100) * 20;
  
  // Position bonus
  if (player.position === 'striker' || player.position === 'forward') {
    probability += 15;
  }
  
  // Ball position - in scoring zone?
  const inShootingRange = isInShootingRange(gameState.ballPosition);
  if (inShootingRange && ballCarrier) {
    probability += 25;
  }
  
  // Late game hero factor
  if (gameState.timeMinute > 75) {
    probability += 10;
  }
  
  // Form bonus
  if (player.formScore > 80) {
    probability += 10;
  }
  
  return Math.min(95, Math.max(5, Math.round(probability)));
}

// Calculate probability of a foul
export function calculateFoulProbability(
  player: PlayerProfile,
  gameState: GameState,
  isDefending: boolean
): number {
  let probability = 5; // Base
  
  // High fatigue = more likely to foul
  probability += (player.fatigueLevel / 100) * 30;
  
  // Defenders foul more
  if (player.position === 'defender' && isDefending) {
    probability += 20;
  }
  
  // Late game desperation
  const isCloseGame = Math.abs(gameState.homeScore - gameState.awayScore) <= 1;
  if (gameState.timeMinute > 80 && isCloseGame && isDefending) {
    probability += 25;
  }
  
  // Yellow card history would increase probability
  
  return Math.min(70, Math.round(probability));
}

// Calculate sprint probability
export function calculateSprintProbability(
  player: PlayerProfile,
  gameState: GameState
): number {
  let probability = 20;
  
  // Fast players sprint more
  if (player.sprintSpeed > 32) probability += 25;
  if (player.sprintSpeed > 30) probability += 15;
  
  // Wingers and forwards sprint more
  if (['winger', 'striker', 'forward'].includes(player.position)) {
    probability += 20;
  }
  
  // Counter-attack situation
  if (gameState.homePossession < 40 || gameState.awayPossession < 40) {
    probability += 15;
  }
  
  return Math.min(85, Math.round(probability));
}

// Generate prediction-based commentary
export function generatePredictiveCommentary(
  prediction: Prediction,
  player: PlayerProfile,
  gameState: GameState
): string {
  const { eventType, probability, excitementLevel } = prediction;
  
  const excitementPrefix = {
    low: "Just a note...",
    medium: "Watch this...",
    high: "HERE WE GO!",
    explosive: "EVERYONE ON THEIR FEET!"
  };
  
  const probabilityPhrase = probability > 80 ? "He's almost certain to " : 
                           probability > 60 ? "He's likely to " : 
                           probability > 40 ? "He could " : "Maybe ";
  
  switch (eventType) {
    case 'goal':
      return `${excitementPrefix[excitementLevel]} ${player.name} has the ball! ${probabilityPhrase}score from here! He's got ${probability}% success rate in this position!`;
      
    case 'foul':
      return `${player.name} under pressure... tired legs after ${gameState.timeMinute} minutes... ${probabilityPhrase}commit a foul here. Referee watching closely!`;
      
    case 'sprint':
      return `Here comes ${player.name}! One of the fastest players on the pitch! ${probabilityPhrase}leave defenders behind! His top speed is ${player.sprintSpeed}km/h!`;
      
    case 'yellow_card':
      return `Dangerous situation! ${player.name} is one tackle away from a card! The referee has seen this before!`;
      
    default:
      return `${player.name} on the ball... something might happen here!`;
  }
}

function isInShootingRange(ballPosition: { x: number; y: number }): boolean {
  // Convert pitch coordinates to determine if in shooting range
  const shootingZoneX = 70; // Final third
  return ballPosition.x > shootingZoneX;
}