// src/lib/tactical-iq/quiz-generator.ts
// ─────────────────────────────────────────────────────────────────────────────
// Selects 2-3 high-leverage moments from the match and turns each into a
// "What Would You Do?" quiz question with 3 options.
//
// This is the single highest-value feature from the brainstorm — it is what
// makes the product unmistakably a learning tool rather than a media product.
// A quiz cannot be confused with a broadcast.
// ─────────────────────────────────────────────────────────────────────────────

import type { MatchEvent, PhaseReport } from './phase-classifier';

export interface QuizOption {
  id:          string;
  label:       string;  // the tactical choice, e.g. "Play the long ball forward"
  isOptimal:   boolean; // was this the decision-theory-correct choice
}

export interface QuizMoment {
  id:           string;
  minute:       number;
  zone:         MatchEvent['zone'];
  setupText:    string;     // describes the frozen moment, no result given
  options:      QuizOption[];
  actualChoice: string;     // what actually happened (option id)
  explanation:  string;     // filled in by THUTO/Amara after the player answers
}

// Pre-written option templates by zone — gives the engine realistic tactical
// choices to offer without needing an LLM call per moment (cheap + fast)
const OPTION_TEMPLATES: Record<MatchEvent['zone'], { label: string; weight: number }[]> = {
  defensive_third: [
    { label: 'Play the long ball forward to relieve pressure', weight: 1 },
    { label: 'Pass short to the nearest defender', weight: 2 },
    { label: 'Switch play to the opposite fullback', weight: 3 },
  ],
  middle_third: [
    { label: 'Play a vertical through-ball', weight: 3 },
    { label: 'Recycle possession backward', weight: 1 },
    { label: 'Dribble at the defender 1v1', weight: 2 },
  ],
  attacking_third: [
    { label: 'Shoot first time', weight: 2 },
    { label: 'Cut back for a teammate in space', weight: 3 },
    { label: 'Cross early to the far post', weight: 1 },
  ],
};

export function generateQuizMoments(
  events: MatchEvent[],
  phases: PhaseReport,
): QuizMoment[] {
  // Pick the most tactically interesting moments:
  // 1. Goals (always interesting — what led to it)
  // 2. Turnovers in the defensive third (high consequence)
  // 3. Failed build-up sequences right before a phase change
  const candidates = events.filter(e =>
    e.eventType === 'GOAL' ||
    (e.eventType === 'TURNOVER' && e.zone === 'defensive_third') ||
    (e.eventType === 'PASS' && e.outcome === 'failure' && e.zone === 'middle_third')
  );

  // Cap at 3 — enough to teach without feeling like homework
  const selected = candidates.slice(0, 3);

  return selected.map((event, i) => buildQuizMoment(event, i));
}

function buildQuizMoment(event: MatchEvent, index: number): QuizMoment {
  const templates = OPTION_TEMPLATES[event.zone];

  // Shuffle deterministically by event id so options aren't always in the
  // same order (avoids players learning "answer B is always right")
  const seed = event.id.charCodeAt(0) + index;
  const shuffled = [...templates].sort((a, b) =>
    ((seed * (templates.indexOf(a) + 1)) % 7) - ((seed * (templates.indexOf(b) + 1)) % 7)
  );

  const options: QuizOption[] = shuffled.map((t, i) => ({
    id:        `opt_${i}`,
    label:     t.label,
    isOptimal: t.weight === 3, // the weight-3 option is decision-theory-optimal
  }));

  const optimalOption = options.find(o => o.isOptimal);

  return {
    id:           `quiz_${event.id}`,
    minute:       event.minute,
    zone:         event.zone,
    setupText:    buildSetupText(event),
    options,
    actualChoice: event.outcome === 'success' ? (optimalOption?.id ?? 'opt_0') : 'opt_0',
    explanation:  '', // filled by THUTO/Amara when the player submits an answer
  };
}

function buildSetupText(event: MatchEvent): string {
  const zoneLabel = event.zone.replace('_', ' ');
  return `${event.minute}' — ${event.team === 'home' ? 'Your team' : 'The opposition'} has the ball in the ${zoneLabel}. What's the right decision here?`;
}

// ── Called when a player submits their answer to a quiz moment ──────────────
// This is a lightweight per-answer THUTO call — much cheaper than narrating
// every event live, and only fires when a player actually engages.
export async function explainQuizAnswer(
  moment:       QuizMoment,
  chosenOptionId: string,
  gender:       'male' | 'female',
): Promise<string> {
  const chosen  = moment.options.find(o => o.id === chosenOptionId);
  const optimal = moment.options.find(o => o.isOptimal);
  const actual  = moment.options.find(o => o.id === moment.actualChoice);

  const prompt = chosen?.isOptimal
    ? `A youth player correctly chose "${chosen.label}" in this situation: ${moment.setupText} Explain in 2 sentences why this was the strong tactical choice.`
    : `A youth player chose "${chosen?.label}" but the stronger option was "${optimal?.label}" in this situation: ${moment.setupText} Explain in 2 encouraging sentences why the other option creates a better outcome — be supportive, not corrective.`;

  const res = await fetch('/api/ai-coach', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      gender,
      history: [],
      userContext: { mode: 'tactical_quiz' },
    }),
  });

  if (!res.ok) return 'Good thinking — every decision in football has trade-offs.';
  const json = await res.json();
  return json.response ?? json.reply ?? '';
}