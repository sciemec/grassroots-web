// src/lib/tactical-iq/blueprint-generator.ts
import { PhaseReport } from './phase-classifier';
import { QuizMoment } from './quiz-generator';

export interface TrainingModule {
  day: number;
  title: string;
  focus: string;
  warmup: string;
  drill: string;
  tacticalGame: string;
  conditionedMatch: string;
  coachingPoints: string[];
  ageGroupAdaptations: {
    u8: string;
    u12: string;
    u16: string;
    adult: string;
  };
  playerNumbers: string;
}

export interface TrainingMicrocycle {
  matchContext: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
  };
  summary: string;
  modules: TrainingModule[];
  recommendedDuration: string; // e.g., "5 days (1.5 hours per session)"
}

export function generateTrainingMicrocycle(input: {
  match: { homeTeam: string; awayTeam: string; homeScore: number; awayScore: number };
  phases: PhaseReport;
  quizMoments: QuizMoment[];
  narrative: string;
}): TrainingMicrocycle {
  const { match, phases, quizMoments, narrative } = input;
  
  // Extract key tactical insights
  const insights = extractTacticalInsights(phases, quizMoments);
  
  // Generate 5 training modules based on the insights
  const modules: TrainingModule[] = [];
  
  // Module 1: If regain phase is weak, focus on pressing/transition
  if (phases.regain.successRate < 50) {
    modules.push(createPressingModule(1, match));
  } else {
    modules.push(createBuildUpModule(1, match));
  }
  
  // Module 2: Build-up phase
  modules.push(createBuildUpModule(2, match));
  
  // Module 3: Final third / finishing
  modules.push(createFinishingModule(3, match));
  
  // Module 4: Transition defense (based on quiz moments)
  const transitionInsight = insights.find(i => i.phase === 'regain');
  modules.push(createTransitionModule(4, match, transitionInsight));
  
  // Module 5: Game day preparation / review
  modules.push(createReviewModule(5, match, narrative));
  
  return {
    matchContext: match,
    summary: generateSummary(phases, narrative),
    modules,
    recommendedDuration: '5 days (1.5 hours per session)',
  };
}

function extractTacticalInsights(phases: PhaseReport, quizMoments: QuizMoment[]) {
  const insights = [];
  
  // Analyze phase performance
  if (phases.regain.successRate < 50) {
    insights.push({
      phase: 'regain',
      issue: 'Low success rate in regaining possession',
      suggestion: 'Focus on pressing triggers and defensive shape',
    });
  }
  
  if (phases.build.successRate < 50) {
    insights.push({
      phase: 'build',
      issue: 'Difficulty building attacks',
      suggestion: 'Work on playing through the thirds and finding passing lanes',
    });
  }
  
  if (phases.finish.successRate < 40) {
    insights.push({
      phase: 'finish',
      issue: 'Low conversion rate in final third',
      suggestion: 'Practice finishing drills and crossing patterns',
    });
  }
  
  // Analyze quiz moments for decision-making insights
  quizMoments.forEach(moment => {
    const wrongAnswers = moment.options.filter(o => !o.isOptimal);
    if (wrongAnswers.length > 0) {
      insights.push({
        phase: moment.zone,
        issue: `Common tactical error: ${wrongAnswers[0].label}`,
        suggestion: moment.explanation,
      });
    }
  });
  
  return insights;
}

function createPressingModule(day: number, match: any): TrainingModule {
  return {
    day,
    title: 'Pressing Triggers & Transition',
    focus: 'Win the ball back efficiently in the opponent\'s half',
    warmup: '5v2 Rondo (5 minutes) - Focus on pressure and cover',
    drill: '8v8 Pressing Drill - 40x30 yard grid, focus on pressing triggers (sideways pass, backward pass)',
    tacticalGame: '6v6+2 (Neutral players) - Team must press within 6 seconds of losing possession',
    conditionedMatch: '10v10 with pressing condition: 3 players must be ahead of the ball at all times',
    coachingPoints: [
      'Trigger #1: When the ball is played sideways across the field',
      'Trigger #2: When a player receives with back to goal',
      'Body position: Show the attacker away from central areas',
      'The nearest player presses, others cover passing lanes',
    ],
    ageGroupAdaptations: {
      u8: 'Focus on basic chasing and positioning',
      u12: 'Introduce the concept of "pressing triggers"',
      u16: 'Full pressing system with coordinated movements',
      adult: 'Advanced pressing traps and tactical fouls',
    },
    playerNumbers: 'Minimum 8 per team (recommended 11v11)',
  };
}

function createBuildUpModule(day: number, match: any): TrainingModule {
  return {
    day,
    title: 'Building from the Back',
    focus: 'Effective build-up play through the thirds',
    warmup: '7v7 Positional Play (Keep possession in 3 zones)',
    drill: 'Playing Through the Thirds - 4v2 in each zone, progressive advancement',
    tacticalGame: 'Build-up to Finish - Team must complete 5 passes in each third before scoring',
    conditionedMatch: '11v11 with build-up requirement: 8 passes before entering final third',
    coachingPoints: [
      'Create diamond shape to provide passing options',
      'Third-man runs to receive between the lines',
      'Rotate possession to switch play',
      'Body shape must be open to the field when receiving',
    ],
    ageGroupAdaptations: {
      u8: 'Simple passing patterns in small grids',
      u12: '3-zone progression drills',
      u16: 'Building from GK with complex rotations',
      adult: 'Advanced positional rotations and baiting presses',
    },
    playerNumbers: 'Minimum 10 per team',
  };
}

function createFinishingModule(day: number, match: { homeTeam: string; awayTeam: string }): TrainingModule {
  return {
    day,
    title: 'Final Third & Finishing',
    focus: 'Creating and converting chances in the attacking third',
    warmup: 'Finishing Activation — shooting from various angles, 3 minutes',
    drill: '4v2 in final third — overlap and cutback combinations, finish first-time',
    tacticalGame: '8v8 with +2 attacking — score only from crosses or through-balls',
    conditionedMatch: '11v11: goals only count when at least 2 attackers enter the box',
    coachingPoints: [
      'Attack the near post to create rebound opportunities',
      'Runner from deep to arrive late and finish',
      'Hold shape — don\'t over-commit in the final third',
      'Quick combination play to break defensive lines',
    ],
    ageGroupAdaptations: {
      u8: 'Dribble and shoot games in small grids',
      u12: '1v1 and 2v1 finishing circuits',
      u16: 'Full crossing and finishing patterns with GK',
      adult: 'Dead-ball routines, combination play, varied finishing techniques',
    },
    playerNumbers: 'Minimum 8 per team',
  };
}

function createTransitionModule(
  day: number,
  match: { homeTeam: string; awayTeam: string },
  insight?: { issue?: string; suggestion?: string },
): TrainingModule {
  const focus = insight?.suggestion ?? 'Winning the ball back immediately after losing possession';
  return {
    day,
    title: 'Defensive Transition',
    focus,
    warmup: 'Shadow pressing — mirror the coach\'s movements, no ball (4 minutes)',
    drill: '6v6 counter-press — team that loses the ball must win it back within 5 seconds',
    tacticalGame: 'Transition game — gate goals, switch attack immediately on turnover',
    conditionedMatch: '10v10: every goal scored within 8 seconds of winning possession = double',
    coachingPoints: [
      'First reaction after losing the ball: immediate pressure',
      'Defensive shape: compact and narrow',
      'Protect the space in behind when pressing',
      insight?.issue ?? 'React together — press as a unit, not individually',
    ],
    ageGroupAdaptations: {
      u8: 'Tag games to develop chase instinct',
      u12: 'Counter-press in 4v4 grids',
      u16: 'Transition scenarios with shape recovery',
      adult: 'High press with zonal traps and fouls to break momentum',
    },
    playerNumbers: 'Minimum 10 per team',
  };
}

function createReviewModule(
  day: number,
  match: { homeTeam: string; awayTeam: string },
  narrative: string,
): TrainingModule {
  return {
    day,
    title: 'Game Day Preparation & Review',
    focus: 'Apply the week\'s learning in match conditions',
    warmup: 'Review of key tactical concepts — walk-through on the pitch (10 minutes)',
    drill: 'Set pieces — corners, free kicks from positions identified in the match',
    tacticalGame: 'Shadow play at full speed — replicate the team\'s shape and movement patterns',
    conditionedMatch: '11v11 unrestricted match — coach observes only, players make all decisions',
    coachingPoints: [
      'Decision-making under pressure: trust the process',
      'Communication — constant verbal and visual signals',
      'Review moment: "What would you do?" — revisit 1 key match decision',
      narrative.split(' ').slice(0, 12).join(' ') + '...',
    ],
    ageGroupAdaptations: {
      u8: 'Fun match with lots of encouragement and freedom',
      u12: 'Match with one simple condition tied to the week\'s theme',
      u16: 'Full tactical review discussion pre-match, debrief post-match',
      adult: 'Pre-match tactical board, post-match individual feedback',
    },
    playerNumbers: 'Full squad recommended',
  };
}

function generateSummary(phases: PhaseReport, narrative: string): string {
  const weakPhases = [];
  if (phases.regain.successRate < 50) weakPhases.push('Regaining Possession');
  if (phases.build.successRate < 50) weakPhases.push('Building Attacks');
  if (phases.finish.successRate < 40) weakPhases.push('Finishing');
  
  if (weakPhases.length === 0) {
    return 'This team showed excellent tactical balance. Focus this microcycle on maintaining tactical discipline and decision-making under pressure.';
  }
  
  return `This microcycle addresses the key tactical areas where the team struggled: ${weakPhases.join(', ')}. Each session progressively builds tactical understanding through game-realistic drills and conditioned matches.`;
}