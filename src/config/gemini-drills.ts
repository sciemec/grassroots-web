// src/config/gemini-drills.ts
// ─────────────────────────────────────────────────────────────────────────────
// Gemini 2.0 Flash drill library.
// Each drill has a sport-specific prompt that leverages Gemini's ability to
// observe motion ACROSS TIME (1 frame/sec), not just a single frozen frame.
//
// Gemini CAN measure: acceleration, deceleration, body shape, foot surface,
//   change of direction sharpness, sprint mechanics, jump timing, technique.
// Gemini CANNOT measure: exact speed in km/h, precise angles, heart rate,
//   offside position, accurate distance.
// ─────────────────────────────────────────────────────────────────────────────

export type Sport = 'football' | 'rugby' | 'athletics' | 'netball' | 'basketball' | 'cricket';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type GrsDomain = 'linearSpeed' | 'explosivePower' | 'balance' | 'cognitiveSpeed' | 'endurance' | 'ballMastery';

export interface DrillDimension {
  key: string;
  label: string;
  tip: string; // what Gemini specifically looks for
}

export interface GeminiDrill {
  id: string;
  name: string;
  sport: Sport;
  emoji: string;
  positions: string[];   // empty = all positions
  description: string;
  coachingFocus: string;
  whatToRecord: string;
  duration: string;
  equipment: string[];
  difficulty: Difficulty;
  grsDomain: GrsDomain;
  dimensions: DrillDimension[];
  geminiPrompt: string;  // exact prompt sent to Gemini after video is uploaded
  passportLabel: string;
}

// ── FOOTBALL DRILLS ──────────────────────────────────────────────────────────

export const FOOTBALL_DRILLS: GeminiDrill[] = [

  {
    id: 'fb_first_touch',
    name: 'First Touch Control',
    sport: 'football',
    emoji: '🎯',
    positions: [],
    description: 'Receive a moving ball and set it up cleanly for your next action. The foundation of all good play.',
    coachingFocus: 'Body shape before ball arrives, foot surface used, direction of first touch, acceleration out of the touch.',
    whatToRecord: 'Have a partner throw or kick the ball to you from 5–10m. Film from the side at hip height. Do 6–8 repetitions with the camera running.',
    duration: '30–60 seconds',
    equipment: ['1 ball', 'partner (or wall)'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'body_shape',        label: 'Body Shape',          tip: 'Is the player open to the field (side-on) before the ball arrives, or facing square?' },
      { key: 'foot_surface',      label: 'Foot Surface',        tip: 'Inside foot, laces, or outside — is the surface choice correct for the type of pass?' },
      { key: 'touch_direction',   label: 'Touch Direction',     tip: 'Does the first touch go forward or across the body (positive) or back towards own goal (negative)?' },
      { key: 'acceleration_out',  label: 'Acceleration Out',    tip: 'Does the player explode away after the touch or take an extra shuffle step to settle?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified football coach reviewing a short training clip from a young Zimbabwean player practising first touch control.

Watch this clip carefully — observe body position BEFORE the ball arrives, which foot surface is used at the moment of contact, where the ball travels after the touch, and how quickly the player moves into their next action.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "body_shape":       { "score": <0-10>, "observation": "<one sentence of what you actually see>" },
    "foot_surface":     { "score": <0-10>, "observation": "<one sentence>" },
    "touch_direction":  { "score": <0-10>, "observation": "<one sentence>" },
    "acceleration_out": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence — what this player does notably well>",
  "key_improvement": "<one specific, actionable thing to change immediately>",
  "coach_note": "<2 sentences — encouraging guidance with a concrete next step>",
  "data_confidence": "<high|medium|low — how clearly the technique was visible in this clip>"
}`,
    passportLabel: 'First Touch',
  },

  {
    id: 'fb_shooting',
    name: 'Shooting Technique',
    sport: 'football',
    emoji: '⚽',
    positions: ['Striker', 'Winger', 'Midfielder'],
    description: 'Strike a stationary or moving ball at goal with power and accuracy. The most-watched skill by scouts.',
    coachingFocus: 'Non-kicking foot position, contact point on the foot, body lean at contact, follow-through, head position.',
    whatToRecord: 'Set up 6–8 balls at 12–18m from goal. Strike each one and film from behind and to the side. Show the full run-up and follow-through.',
    duration: '60–90 seconds',
    equipment: ['6 balls', 'goal or target'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'standing_foot',    label: 'Standing Foot',      tip: 'Non-kicking foot beside the ball (good) or behind it (causes the ball to go high)?' },
      { key: 'contact_point',    label: 'Contact Point',      tip: 'Laces/instep for power, inside for accuracy — is the player choosing the right surface?' },
      { key: 'body_lean',        label: 'Body Lean',          tip: 'Leaning forward over the ball (keeps shot down) or falling back (ball flies over bar)?' },
      { key: 'follow_through',   label: 'Follow Through',     tip: 'Full leg swing through and past the ball, or is the kick cut short?' },
      { key: 'head_position',    label: 'Head Down',          tip: 'Head and eyes down through contact, or is the player looking up too early?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified football coach reviewing a short training clip of a young Zimbabwean player practising shooting technique.

Watch each shot carefully — look at where the non-kicking foot plants relative to the ball, which part of the foot makes contact, whether the body leans forward or backward, how complete the follow-through is, and whether the head stays down through contact.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "standing_foot":  { "score": <0-10>, "observation": "<one sentence>" },
    "contact_point":  { "score": <0-10>, "observation": "<one sentence>" },
    "body_lean":      { "score": <0-10>, "observation": "<one sentence>" },
    "follow_through": { "score": <0-10>, "observation": "<one sentence>" },
    "head_position":  { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences — encouraging and instructive>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Shooting',
  },

  {
    id: 'fb_dribbling',
    name: 'Dribbling & Change of Direction',
    sport: 'football',
    emoji: '🔀',
    positions: ['Striker', 'Winger', 'Midfielder'],
    description: 'Move with the ball at speed and change direction sharply past a defender or around cones.',
    coachingFocus: 'Acceleration burst, deceleration before cut, sharpness of the direction change, body height (centre of gravity).',
    whatToRecord: 'Set up 4–6 cones in a line or zigzag. Dribble through them at match pace. Film from the side so direction changes are visible. Do 4–5 runs.',
    duration: '45–60 seconds',
    equipment: ['1 ball', '4–6 cones'],
    difficulty: 'intermediate',
    grsDomain: 'linearSpeed',
    dimensions: [
      { key: 'acceleration',    label: 'Acceleration',          tip: 'Does the player explode into space after a change of direction or drift into the next section?' },
      { key: 'deceleration',    label: 'Deceleration Control',  tip: 'Controlled slow-down before the cut, or does the player overshoot the cone?' },
      { key: 'cut_sharpness',   label: 'Cut Sharpness',         tip: 'How tight and sudden is the directional change? Does the player freeze a defender?' },
      { key: 'body_height',     label: 'Centre of Gravity',     tip: 'Low body height and bent knees during movement (agile) vs standing tall (slow to react)?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified football coach reviewing a short dribbling drill clip from a young Zimbabwean player.

Watch how the player moves WITH the ball — observe how explosively they accelerate into space, whether they decelerate with control before direction changes, how sharp and tight their cuts are around cones, and their body height (centre of gravity) throughout.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "acceleration":  { "score": <0-10>, "observation": "<one sentence>" },
    "deceleration":  { "score": <0-10>, "observation": "<one sentence>" },
    "cut_sharpness": { "score": <0-10>, "observation": "<one sentence>" },
    "body_height":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Dribbling',
  },

  {
    id: 'fb_sprint_mechanics',
    name: 'Sprint Mechanics',
    sport: 'football',
    emoji: '💨',
    positions: [],
    description: 'Maximum-effort sprint over 20–30m. Gemini analyses your running form, not just how fast you are.',
    coachingFocus: 'Arm drive, stride length, forward body lean during acceleration, foot strike pattern (heel vs ball of foot).',
    whatToRecord: 'Sprint at 100% effort from a standing start over at least 20m. Film from the side. Do 3–4 sprints with full recovery in between.',
    duration: '30–45 seconds',
    equipment: ['open space, 20–30m'],
    difficulty: 'beginner',
    grsDomain: 'linearSpeed',
    dimensions: [
      { key: 'arm_drive',       label: 'Arm Drive',           tip: 'Arms driving forward and back (good) or crossing the body midline (energy leak)?' },
      { key: 'stride_length',   label: 'Stride Length',       tip: 'Full, powerful strides or short choppy steps? Does stride lengthen as the player reaches top speed?' },
      { key: 'forward_lean',    label: 'Forward Lean',        tip: 'Body leaning forward during acceleration (good) or upright too early?' },
      { key: 'foot_strike',     label: 'Foot Strike',         tip: 'Ball of foot / forefoot striking (efficient sprinter) or heel striking (braking force)?' },
    ],
    geminiPrompt: `You are an elite sprint coach reviewing a maximum-effort sprint clip from a young Zimbabwean football player.

Watch the full sprint sequence — observe arm mechanics (are they driving or crossing the body?), stride length (does it grow as speed increases?), body lean (forward during drive phase?), and foot strike pattern (ball of foot vs heel).

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "arm_drive":     { "score": <0-10>, "observation": "<one sentence>" },
    "stride_length": { "score": <0-10>, "observation": "<one sentence>" },
    "forward_lean":  { "score": <0-10>, "observation": "<one sentence>" },
    "foot_strike":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Sprint Form',
  },

  {
    id: 'fb_defending_1v1',
    name: '1v1 Defending',
    sport: 'football',
    emoji: '🛡️',
    positions: ['Defender', 'Midfielder'],
    description: 'Defend against a live attacker one-on-one. Most scouts watch defensive body shape more than the tackle itself.',
    coachingFocus: 'Defensive stance (side-on, low, knees bent), jockeying movement, patience before committing, tackle timing.',
    whatToRecord: 'Have a partner attack you 1v1 from 10m. Film from the side or slight angle. Do 5–6 defensive sequences. Show the full approach and outcome.',
    duration: '45–60 seconds',
    equipment: ['1 ball', 'partner'],
    difficulty: 'intermediate',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'defensive_stance', label: 'Defensive Stance',   tip: 'Side-on body, weight on front foot, knees bent and low, or square-on and upright?' },
      { key: 'jockeying',        label: 'Jockeying',          tip: 'Staying with the attacker, guiding them to a weak side, or backing off too far?' },
      { key: 'tackle_timing',    label: 'Tackle Timing',      tip: 'Does the defender commit at the right moment (ball away from attacker) or dive in too early?' },
      { key: 'recovery_speed',   label: 'Recovery Speed',     tip: 'After losing ground, how quickly does the defender recover their defensive shape?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified defensive coach reviewing a 1v1 defending drill from a young Zimbabwean player.

Watch each defensive sequence carefully — look at starting stance and body shape, how the defender moves while jockeying (guiding the attacker), the moment they choose to commit to a tackle, and how they recover if beaten.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "defensive_stance": { "score": <0-10>, "observation": "<one sentence>" },
    "jockeying":        { "score": <0-10>, "observation": "<one sentence>" },
    "tackle_timing":    { "score": <0-10>, "observation": "<one sentence>" },
    "recovery_speed":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: '1v1 Defence',
  },

  {
    id: 'fb_passing',
    name: 'Passing Accuracy & Technique',
    sport: 'football',
    emoji: '📡',
    positions: [],
    description: 'Short and medium passes to a target or partner. Gemini reads body shape, foot surface, and follow-through.',
    coachingFocus: 'Body shape (open to see the pass option), correct foot surface, full follow-through, head up before and down at contact.',
    whatToRecord: 'Pass to a partner or target at 10–20m. Film from behind or 45° so body shape is visible. Do 8–10 passes of varying distances.',
    duration: '45–60 seconds',
    equipment: ['1 ball', 'partner or target'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'body_shape',    label: 'Body Shape',       tip: 'Open body position to see both the target and field (good) or facing the ground square-on?' },
      { key: 'foot_surface',  label: 'Foot Surface',     tip: 'Inside foot for short passes (good), laces for longer driven passes — correct choice?' },
      { key: 'follow_through',label: 'Follow Through',   tip: 'Full leg swing through and towards the target, or is the kick jabbed and stopped short?' },
      { key: 'head_scan',     label: 'Head Scan',        tip: 'Does the player look up to scan before the pass, or play with their head down throughout?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified football coach reviewing a passing drill clip from a young Zimbabwean player.

Watch the full passing sequence — look at body shape before each pass (open or closed?), which surface of the foot is used, how complete the follow-through is, and whether the player scans (looks up) before the pass.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "body_shape":    { "score": <0-10>, "observation": "<one sentence>" },
    "foot_surface":  { "score": <0-10>, "observation": "<one sentence>" },
    "follow_through":{ "score": <0-10>, "observation": "<one sentence>" },
    "head_scan":     { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Passing',
  },

  {
    id: 'fb_heading',
    name: 'Heading Technique',
    sport: 'football',
    emoji: '🗯️',
    positions: ['Striker', 'Defender'],
    description: 'Attack a crossed or thrown ball in the air and head it with power and direction.',
    coachingFocus: 'Jump timing (peak when ball arrives), contact point on the forehead, neck muscles (attack the ball), direction control.',
    whatToRecord: 'Have a partner throw the ball in the air towards you. Head the ball from a standing start or short run. Film from the side. Do 6–8 headers.',
    duration: '45–60 seconds',
    equipment: ['1 ball', 'partner'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'jump_timing',     label: 'Jump Timing',      tip: 'Does the player peak at the top of their jump exactly when the ball arrives, or mis-time it?' },
      { key: 'forehead_contact',label: 'Forehead Contact', tip: 'Ball contacted on the flat of the forehead (correct) or top of the head (loses power/direction)?' },
      { key: 'neck_muscles',    label: 'Neck & Attack',    tip: 'Does the player drive forward to meet the ball (tense neck, attacking header) or let the ball hit them?' },
      { key: 'direction_set',   label: 'Direction Control',tip: 'Does the header go in a chosen direction or is it random?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified football coach reviewing a heading drill clip from a young Zimbabwean player.

Watch each header carefully — observe whether the player peaks at their jump exactly when the ball arrives, where on the head the ball makes contact (forehead flat vs top of head), whether they drive forward to meet the ball with tense neck muscles, and whether they control the direction of the header.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "jump_timing":      { "score": <0-10>, "observation": "<one sentence>" },
    "forehead_contact": { "score": <0-10>, "observation": "<one sentence>" },
    "neck_muscles":     { "score": <0-10>, "observation": "<one sentence>" },
    "direction_set":    { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Heading',
  },

  {
    id: 'fb_juggling',
    name: 'Ball Juggling & Control',
    sport: 'football',
    emoji: '🤸',
    positions: [],
    description: 'Keep the ball off the ground using feet, thighs, and head. A direct measure of ball mastery.',
    coachingFocus: 'Consistency of touch height, balance between touches, focus (eyes on ball), ability to use both feet.',
    whatToRecord: 'Juggle the ball as many times as you can without it hitting the ground. Film from the front or 45° angle. One continuous take is best.',
    duration: '30–90 seconds',
    equipment: ['1 ball'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'touch_consistency', label: 'Touch Consistency',  tip: 'Are touches consistent in height (good control) or erratic (ball going too high/low each time)?' },
      { key: 'balance',           label: 'Balance',            tip: 'Is the player stable between touches or stumbling and off-balance?' },
      { key: 'eyes_on_ball',      label: 'Eyes on Ball',       tip: 'Does the player keep eyes focused on the ball throughout, or lose concentration?' },
      { key: 'both_feet',         label: 'Foot Variety',       tip: 'Does the player use both feet equally, or favour one foot exclusively?' },
    ],
    geminiPrompt: `You are an elite UEFA-qualified football coach reviewing a ball juggling clip from a young Zimbabwean player.

Watch the full juggling sequence — assess how consistent the touch height is on each contact, how balanced and stable the player remains between touches, whether their eyes stay focused on the ball, and whether they use both feet or mostly one.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "touch_consistency": { "score": <0-10>, "observation": "<one sentence>" },
    "balance":           { "score": <0-10>, "observation": "<one sentence>" },
    "eyes_on_ball":      { "score": <0-10>, "observation": "<one sentence>" },
    "both_feet":         { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Ball Juggling',
  },

];

// ── ALL DRILLS (future sports added here) ────────────────────────────────────

export const ALL_GEMINI_DRILLS: GeminiDrill[] = [
  ...FOOTBALL_DRILLS,
  // RUGBY_DRILLS, ATHLETICS_DRILLS, NETBALL_DRILLS — coming soon
];

export function getDrillsBySport(sport: Sport): GeminiDrill[] {
  return ALL_GEMINI_DRILLS.filter(d => d.sport === sport);
}

export function getDrillById(id: string): GeminiDrill | undefined {
  return ALL_GEMINI_DRILLS.find(d => d.id === id);
}

// localStorage key pattern: grs_gemini_drill_{drillId}_{playerNameSnake}
export function drillStorageKey(drillId: string, playerName: string): string {
  const nameKey = playerName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `grs_gemini_drill_${drillId}_${nameKey}`;
}

// All drill results for a player (for passport display)
export function allDrillResultsKey(playerName: string): string {
  const nameKey = playerName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return `grs_gemini_all_drills_${nameKey}`;
}

export interface DrillResult {
  drillId: string;
  drillName: string;
  sport: Sport;
  passportLabel: string;
  overall_score: number;
  top_strength: string;
  key_improvement: string;
  coach_note: string;
  data_confidence: string;
  scores: Record<string, { score: number; observation: string }>;
  analysedAt: string; // ISO date
}
