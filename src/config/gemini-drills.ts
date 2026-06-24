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

export type Sport =
  | 'football' | 'rugby' | 'athletics' | 'netball' | 'basketball'
  | 'cricket'  | 'swimming' | 'tennis' | 'volleyball' | 'hockey';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type GrsDomain  = 'linearSpeed' | 'explosivePower' | 'balance' | 'cognitiveSpeed' | 'endurance' | 'ballMastery';

// Scholarship reel slot — which section of the 90-second recruiting reel this drill fills
export type ReelSlot = 'speed' | 'technique' | 'strength' | 'skill' | 'game_intelligence';

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

// UniversalDrill extends GeminiDrill with scholarship pathway context
export interface UniversalDrill extends GeminiDrill {
  reelSlot: ReelSlot;          // which slot in the 90-sec scholarship reel
  ncaaRelevant: boolean;        // directly observable by NCAA/NAIA/UK scouts
  scholarshipNote: string;      // one sentence — why scouts care about this drill
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

// ── RUGBY DRILLS ──────────────────────────────────────────────────────────────

export const RUGBY_DRILLS: UniversalDrill[] = [
  {
    id: 'rb_tackle_technique',
    name: 'Tackle Technique',
    sport: 'rugby',
    emoji: '🏉',
    positions: ['Flanker', 'Lock', 'Prop', 'Back Row'],
    description: 'Execute a safe, effective tackle on a ball carrier. Body position and leg drive are what scouts and coaches first look for.',
    coachingFocus: 'Approach angle, head position (to the side, NOT in the way), shoulder contact point, leg drive through the tackle.',
    whatToRecord: 'Have a partner run a straight line. Tackle a tackle bag or partner wearing a body shield. Film from 45° behind so body position is clear. 5–6 tackles.',
    duration: '45–60 seconds',
    equipment: ['tackle bag or body shield', 'partner'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'strength',
    ncaaRelevant: true,
    scholarshipNote: 'US rugby coaches rate tackle efficiency as the #1 metric for scholarship consideration at flanker and back row positions.',
    dimensions: [
      { key: 'approach_angle',  label: 'Approach Angle',    tip: 'Does the tackler approach from a low, controlled angle or rush in upright?' },
      { key: 'head_placement',  label: 'Head Placement',    tip: 'Head safely to the side of the carrier (NOT in front) — key safety and technique indicator.' },
      { key: 'shoulder_contact',label: 'Shoulder Contact',  tip: 'Leading shoulder drives into the thigh/hip area (correct) or too high (dangerous) or too low (ineffective)?' },
      { key: 'leg_drive',       label: 'Leg Drive',         tip: 'Does the tackler drive forward with powerful leg extension after contact, or do they stop on impact?' },
    ],
    geminiPrompt: `You are a World Rugby-accredited coach reviewing a tackle technique clip from a young Zimbabwean rugby player.

Watch each tackle carefully — observe the approach angle (low and controlled?), whether the head moves safely to the side, where the shoulder makes contact on the ball carrier, and how powerfully the legs drive through after initial contact.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "approach_angle":   { "score": <0-10>, "observation": "<one sentence>" },
    "head_placement":   { "score": <0-10>, "observation": "<one sentence>" },
    "shoulder_contact": { "score": <0-10>, "observation": "<one sentence>" },
    "leg_drive":        { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences — encouraging and instructive>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Tackle Form',
  },

  {
    id: 'rb_ball_carry',
    name: 'Ball Carry & Contact',
    sport: 'rugby',
    emoji: '💪',
    positions: ['Number 8', 'Prop', 'Flanker', 'Centre'],
    description: 'Carry the ball into contact and present it cleanly for the ruck. The carry is judged on power, body height, and ball security.',
    coachingFocus: 'Body height at contact (low is powerful), ball security in two hands, driving through contact, clean ball presentation on the ground.',
    whatToRecord: 'Run at a tackle bag or contact shield from 5m. Drive through, go to ground, and present the ball. Film from the side. 5–6 carries.',
    duration: '40–50 seconds',
    equipment: ['tackle bag or contact shield', 'partner'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'strength',
    ncaaRelevant: true,
    scholarshipNote: 'Effective ball carries per game is a tracked stat in US college rugby — coaches look for players who gain metres, not just avoid being stopped.',
    dimensions: [
      { key: 'body_height',    label: 'Body Height at Contact', tip: 'Is the carrier low (powerful, hard to stop) or upright (easy to tackle high)?' },
      { key: 'ball_security',  label: 'Ball Security',          tip: 'Both hands on the ball in a secure grip? Is the ball tucked safely or exposed?' },
      { key: 'drive_through',  label: 'Drive Through Contact',  tip: 'Does the player keep driving their legs after hitting contact, or stop immediately?' },
      { key: 'ball_placement', label: 'Ball Placement',         tip: 'On going to ground, does the ball end up behind the body (clean ruck) or in front (turnover risk)?' },
    ],
    geminiPrompt: `You are a World Rugby-accredited skills coach reviewing a ball carry drill from a young Zimbabwean player.

Watch each carry — note how low the player is when they hit contact (body height), how securely they hold the ball, whether their legs keep driving after initial impact, and where the ball ends up when they go to ground.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "body_height":    { "score": <0-10>, "observation": "<one sentence>" },
    "ball_security":  { "score": <0-10>, "observation": "<one sentence>" },
    "drive_through":  { "score": <0-10>, "observation": "<one sentence>" },
    "ball_placement": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Ball Carry',
  },
];

// ── ATHLETICS DRILLS ──────────────────────────────────────────────────────────

export const ATHLETICS_DRILLS: UniversalDrill[] = [
  {
    id: 'ath_sprint_100',
    name: '100m Sprint Mechanics',
    sport: 'athletics',
    emoji: '💨',
    positions: [],
    description: 'Full 100m sprint from blocks or standing start. Gemini analyses your mechanics across three phases: drive, transition, top speed.',
    coachingFocus: 'Block start / drive phase body angle, stride frequency vs length at top speed, arm mechanics, head position.',
    whatToRecord: 'Sprint 80–100m at maximum effort. Film from the side at waist height. The full run should be visible. 2–3 attempts.',
    duration: '10–14 seconds per run',
    equipment: ['100m open track or road', 'starting blocks (optional)'],
    difficulty: 'beginner',
    grsDomain: 'linearSpeed',
    reelSlot: 'speed',
    ncaaRelevant: true,
    scholarshipNote: 'NCAA D1 programs look for sub-11.0s (women) and sub-10.5s (men) at 100m — Gemini scores the mechanics that produce those times.',
    dimensions: [
      { key: 'drive_phase_lean',   label: 'Drive Phase Lean',    tip: 'Body angle ≈45° during first 20–30m (optimal) or upright too soon (less power)?' },
      { key: 'arm_mechanics',      label: 'Arm Mechanics',       tip: 'Arms at 90°, driving forward/back without crossing midline? Or flailing / crossing body?' },
      { key: 'stride_frequency',   label: 'Stride Frequency',    tip: 'High turnover rate at top speed vs slow, plodding strides — visible in clip tempo.' },
      { key: 'heel_vs_forefoot',   label: 'Foot Strike',         tip: 'Forefoot/ball-of-foot striking (sprinter) vs heel striking (braking — common beginner error)?' },
    ],
    geminiPrompt: `You are an IAAF Level 3 sprint coach reviewing a 100m sprint clip from a young Zimbabwean athletics athlete.

Observe across the full run: the body angle during the drive phase (first 20–30m), how the arms move (90° drive or crossing midline?), stride frequency at top speed, and foot strike pattern (forefoot vs heel). Note any mechanical inefficiencies that would slow the athlete down.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "drive_phase_lean": { "score": <0-10>, "observation": "<one sentence>" },
    "arm_mechanics":    { "score": <0-10>, "observation": "<one sentence>" },
    "stride_frequency": { "score": <0-10>, "observation": "<one sentence>" },
    "heel_vs_forefoot": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Sprint Mechanics',
  },

  {
    id: 'ath_long_jump',
    name: 'Long Jump / Triple Jump Approach',
    sport: 'athletics',
    emoji: '🦘',
    positions: [],
    description: 'Full approach run and takeoff for long jump or triple jump. Gemini scores the approach speed, penultimate stride, and takeoff position.',
    coachingFocus: 'Approach run acceleration, penultimate stride (long-short) rhythm, takeoff foot flat and powerful, arm drive at takeoff.',
    whatToRecord: 'Full approach run and jump into a sandpit or onto a mat. Film from the side so the full run and takeoff are visible. 3–4 attempts.',
    duration: '3–5 seconds per jump',
    equipment: ['sandpit or landing mat', 'measuring tape (optional)'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'speed',
    ncaaRelevant: true,
    scholarshipNote: 'Jumps coaches prioritise takeoff mechanics over distance in early recruiting — a technically sound 6.0m athlete is more coachable than a 6.5m athlete with poor form.',
    dimensions: [
      { key: 'approach_acceleration',label: 'Approach Acceleration', tip: 'Does the athlete reach maximum controllable speed in the last 4–6 strides, or fade?' },
      { key: 'penultimate_stride',   label: 'Penultimate Stride',    tip: 'The second-to-last stride is longer and lower (lowers the hips for explosive takeoff) — is this present?' },
      { key: 'takeoff_position',     label: 'Takeoff Position',      tip: 'Takeoff foot flat/full contact driving forward-upward, or toe-only (weak) / leaning back (loss of horizontal speed)?' },
      { key: 'arm_drive_takeoff',    label: 'Arm Drive at Takeoff',  tip: 'Powerful upward arm swing at takeoff moment to increase height — is this coordinated with the jump?' },
    ],
    geminiPrompt: `You are an IAAF Level 3 jumps coach reviewing a long jump or triple jump approach clip from a young Zimbabwean athlete.

Analyse the approach run (does speed build smoothly?), the penultimate stride pattern (longer-lower before the board), the takeoff foot position and drive direction, and whether the arms drive powerfully upward at the moment of takeoff.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "approach_acceleration": { "score": <0-10>, "observation": "<one sentence>" },
    "penultimate_stride":    { "score": <0-10>, "observation": "<one sentence>" },
    "takeoff_position":      { "score": <0-10>, "observation": "<one sentence>" },
    "arm_drive_takeoff":     { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Jump Mechanics',
  },
];

// ── NETBALL DRILLS ────────────────────────────────────────────────────────────

export const NETBALL_DRILLS: UniversalDrill[] = [
  {
    id: 'nb_shooting',
    name: 'Shooting Technique',
    sport: 'netball',
    emoji: '🏀',
    positions: ['Goal Shooter', 'Goal Attack'],
    description: 'Shoot at the netball ring from the goal circle. Technical accuracy over power — Gemini rates the full shooting chain.',
    coachingFocus: 'Balanced stance over the shooting foot, ball held above the head (not pushed), wrist flick follow-through, consistent release point.',
    whatToRecord: 'Take 8–10 shots from different positions inside the goal circle. Film from the side at shoulder height. Show the full preparation, release, and follow-through.',
    duration: '60–90 seconds',
    equipment: ['netball', 'netball ring (or basket)'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'US and UK universities track goal % for shooters — Gemini evaluates the technique that determines that percentage.',
    dimensions: [
      { key: 'stance_balance',   label: 'Stance & Balance',    tip: 'Weight balanced over the shooting foot, body square to ring? Or tilted / off-balance?' },
      { key: 'ball_position',    label: 'Ball Position',       tip: 'Ball held above head in line with the ring (correct) or pushed from chest/shoulder (inconsistent)?' },
      { key: 'wrist_flick',      label: 'Wrist Flick',         tip: 'Full wrist extension and follow-through giving backspin, or flat push without rotation?' },
      { key: 'release_point',    label: 'Release Consistency', tip: 'Same release point on every shot, or varies significantly between attempts?' },
    ],
    geminiPrompt: `You are a Netball New Zealand-level shooting coach reviewing a shooting technique clip from a young Zimbabwean player.

Observe each shot: is the player balanced over their shooting foot before releasing, where is the ball positioned (above head or lower push), is there a clear wrist flick giving the ball backspin, and is the release point consistent across shots?

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "stance_balance":  { "score": <0-10>, "observation": "<one sentence>" },
    "ball_position":   { "score": <0-10>, "observation": "<one sentence>" },
    "wrist_flick":     { "score": <0-10>, "observation": "<one sentence>" },
    "release_point":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Shooting',
  },

  {
    id: 'nb_footwork',
    name: 'Landing Footwork & Pivot',
    sport: 'netball',
    emoji: '🦶',
    positions: [],
    description: 'Receive a pass and land within the netball footwork rule, then pivot to pass. The most-penalised skill at international level.',
    coachingFocus: 'Two-footed or single-footed landing (must stop correctly), pivot foot stays grounded, body balanced for immediate passing.',
    whatToRecord: 'Have a partner throw the ball and you receive it at speed, landing and pivoting to throw back. Film from the front-45°. 8–10 catches.',
    duration: '45–60 seconds',
    equipment: ['netball', 'partner'],
    difficulty: 'beginner',
    grsDomain: 'balance',
    reelSlot: 'game_intelligence',
    ncaaRelevant: true,
    scholarshipNote: 'Footwork violations are the #1 reason players are dropped from university squads — scouts watch for technical compliance before raw speed.',
    dimensions: [
      { key: 'landing_control',  label: 'Landing Control',   tip: 'Does the player stop cleanly within the footwork rule, or hop/shuffle after catching?' },
      { key: 'pivot_foot',       label: 'Pivot Foot',        tip: 'Is one foot kept grounded as a pivot point, or does the player drag/lift it (footwork violation)?' },
      { key: 'body_balance',     label: 'Body Balance',      tip: 'Is the player upright and balanced ready to pass immediately after landing?' },
      { key: 'catch_security',   label: 'Catch Security',    tip: 'Two-handed secure catch, or fumbled/bobbled? Key for possession retention.' },
    ],
    geminiPrompt: `You are a Netball Zimbabwe coaching educator reviewing a footwork and landing drill from a young player.

Watch each catch and landing carefully — does the player stop cleanly within the footwork rule, keep a pivot foot grounded without lifting it, stay balanced immediately after landing, and catch the ball securely in two hands?

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "landing_control": { "score": <0-10>, "observation": "<one sentence>" },
    "pivot_foot":      { "score": <0-10>, "observation": "<one sentence>" },
    "body_balance":    { "score": <0-10>, "observation": "<one sentence>" },
    "catch_security":  { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Footwork',
  },
];

// ── BASKETBALL DRILLS ─────────────────────────────────────────────────────────

export const BASKETBALL_DRILLS: UniversalDrill[] = [
  {
    id: 'bb_ball_handling',
    name: 'Ball Handling & Dribbling',
    sport: 'basketball',
    emoji: '🏀',
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward'],
    description: 'Stationary and moving ball-handling drills. Gemini evaluates hand control, eye level (head up), and dribble height.',
    coachingFocus: 'Fingertip control (not palm), dribble below waist height, head up (not watching the ball), sharp crossovers and direction changes.',
    whatToRecord: 'Perform 60–90 seconds of dribbling: stationary crossovers, behind-the-back, between-legs, then a series of directional moves at speed. Film from front and side.',
    duration: '60–90 seconds',
    equipment: ['1 basketball'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    reelSlot: 'skill',
    ncaaRelevant: true,
    scholarshipNote: 'Ball handling under pressure is the first filter NCAA guards apply — Gemini identifies weaknesses in hand control before game situations expose them.',
    dimensions: [
      { key: 'hand_control',     label: 'Hand / Fingertip Control', tip: 'Ball controlled with fingertips (good) or slapping with palm (less control)?' },
      { key: 'dribble_height',   label: 'Dribble Height',           tip: 'Dribbles kept below waist (harder to steal) or bouncing too high (easy to steal)?' },
      { key: 'head_up',          label: 'Eyes Up',                  tip: 'Player looks forward to see the court, or stares down at the ball the whole time?' },
      { key: 'direction_change', label: 'Sharpness of Change',      tip: 'Direction changes are crisp and low to the ground, or wide and telegraphed?' },
    ],
    geminiPrompt: `You are an NCAA Division 1 basketball skills coach reviewing a ball-handling drill from a young Zimbabwean player.

Watch the dribbling sequence — observe whether fingertips (not palm) control the ball, how high the dribble bounces relative to the waist, whether the player's eyes are up scanning the court or staring at the ball, and how sharp direction changes are.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "hand_control":     { "score": <0-10>, "observation": "<one sentence>" },
    "dribble_height":   { "score": <0-10>, "observation": "<one sentence>" },
    "head_up":          { "score": <0-10>, "observation": "<one sentence>" },
    "direction_change": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Ball Handling',
  },

  {
    id: 'bb_shooting_form',
    name: 'Jump Shot Form',
    sport: 'basketball',
    emoji: '🎯',
    positions: [],
    description: 'Mid-range or three-point jump shot. Gemini evaluates the full kinetic chain from leg drive to release.',
    coachingFocus: 'Shot pocket (ball at shooting hip, ready position), upward power from legs, elbow under ball, follow-through with wrist snap (goose neck).',
    whatToRecord: 'Take 8–10 jump shots from mid-range and the three-point arc. Film from the front and then from 45° to see the elbow alignment. Show full jump and follow-through.',
    duration: '60–90 seconds',
    equipment: ['1 basketball', 'hoop'],
    difficulty: 'beginner',
    grsDomain: 'explosivePower',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'Shot form is the single most-evaluated technique for wings and guards in NCAA recruiting — a replicable, correct form outweighs percentage in showcase settings.',
    dimensions: [
      { key: 'shot_pocket',    label: 'Shot Pocket',       tip: 'Ball in a consistent ready position at shooting hip before going up? Or carried low / flat against body?' },
      { key: 'leg_drive',      label: 'Leg Drive',         tip: 'Power generated from full leg bend and explosive upward push, or all-arms weak shot?' },
      { key: 'elbow_under',    label: 'Elbow Alignment',   tip: 'Elbow under the ball (power aligned to target), or elbow winging out to the side?' },
      { key: 'follow_through', label: 'Follow Through',    tip: 'Full wrist snap with fingers pointing down (goose neck) on release, or pushed flat?' },
    ],
    geminiPrompt: `You are an NCAA Division 1 shooting coach reviewing a jump shot form clip from a young Zimbabwean basketball player.

Evaluate the shot pocket (ball position before going up), how much power comes from the legs vs arms only, elbow alignment under the ball at release, and follow-through quality (wrist snap / goose neck). Watch the full kinetic chain on each attempt.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "shot_pocket":    { "score": <0-10>, "observation": "<one sentence>" },
    "leg_drive":      { "score": <0-10>, "observation": "<one sentence>" },
    "elbow_under":    { "score": <0-10>, "observation": "<one sentence>" },
    "follow_through": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Jump Shot',
  },
];

// ── CRICKET DRILLS ────────────────────────────────────────────────────────────

export const CRICKET_DRILLS: UniversalDrill[] = [
  {
    id: 'cr_batting_stance',
    name: 'Batting Stance & Shot Execution',
    sport: 'cricket',
    emoji: '🏏',
    positions: [],
    description: 'Drive, pull, or cut shots off a toss or bowling machine. Gemini evaluates bat swing, weight transfer, and head position.',
    coachingFocus: 'Head still and level, weight transfer to front foot on drive, full face of bat at contact, high elbow on drives.',
    whatToRecord: 'Face 8–10 deliveries (tossed or machine). Play your best shots. Film from side-on (down the pitch angle) so weight transfer and bat swing are clear.',
    duration: '60–90 seconds',
    equipment: ['bat', 'ball (or throw-down machine)', 'partner or tee'],
    difficulty: 'beginner',
    grsDomain: 'cognitiveSpeed',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'US universities with cricket programmes (over 40 NAIA clubs) evaluate batting average AND shot selection — Gemini surfaces the technique behind the numbers.',
    dimensions: [
      { key: 'head_stillness',   label: 'Head Stillness',     tip: 'Head remains still and level through the shot (good) or bobs/moves excessively (miss-hits)?' },
      { key: 'weight_transfer',  label: 'Weight Transfer',    tip: 'On a drive, weight moves fully to the front foot? Or player stays on the back foot (weak push)?' },
      { key: 'bat_face',         label: 'Full Bat Face',      tip: 'Full face of the bat meets the ball at contact (powerful, controlled) or edge presented?' },
      { key: 'high_elbow',       label: 'High Elbow',         tip: 'Top (lead) elbow high and driving through the shot, or collapsed/dropped at contact?' },
    ],
    geminiPrompt: `You are a Cricket Zimbabwe Level 2 batting coach reviewing a batting technique clip from a young Zimbabwean player.

Watch each shot: does the head stay still and level, does weight transfer fully forward on drives, does the full face of the bat meet the ball at contact, and is the top elbow high and driving through the shot?

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "head_stillness":  { "score": <0-10>, "observation": "<one sentence>" },
    "weight_transfer": { "score": <0-10>, "observation": "<one sentence>" },
    "bat_face":        { "score": <0-10>, "observation": "<one sentence>" },
    "high_elbow":      { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Batting Form',
  },

  {
    id: 'cr_bowling_action',
    name: 'Bowling Action',
    sport: 'cricket',
    emoji: '🎳',
    positions: ['Fast Bowler', 'Medium Pacer', 'Spin Bowler'],
    description: 'Bowl from a run-up. Gemini analyses the action for legal delivery, loading position, and follow-through.',
    coachingFocus: 'Front arm drives up (creates pace), side-on or front-on body position consistency, bowling arm straight overhead at release, complete follow-through.',
    whatToRecord: 'Bowl 6–8 balls from your full run-up. Film from behind the umpire angle AND from the side. Both angles in the same clip is ideal.',
    duration: '60–90 seconds',
    equipment: ['cricket ball', 'stumps or target', 'wicket area'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'Action legality (no-ball risk) is screened by US university coaches before offering — Gemini flags elbow straightening issues early.',
    dimensions: [
      { key: 'front_arm',       label: 'Front Arm Drive',    tip: 'Non-bowling arm drives high and then pulls down (generates rotation and pace), or hangs low?' },
      { key: 'body_alignment',  label: 'Body Alignment',     tip: 'Consistent side-on or front-on action throughout, or mixed causing inconsistent release point?' },
      { key: 'arm_straight',    label: 'Arm at Release',     tip: 'Bowling arm as straight as possible through the release zone (legal action), or visible bend?' },
      { key: 'follow_through',  label: 'Follow Through',     tip: 'Full body follow-through across the body toward fine leg, or action stops abruptly at release?' },
    ],
    geminiPrompt: `You are a Cricket Zimbabwe Level 2 bowling coach reviewing a bowling action clip from a young Zimbabwean player.

Watch each delivery — assess the front arm drive (does it come up high and pull down?), the consistency of body alignment (side-on vs front-on), whether the bowling arm appears straight at the release zone (legality concern if clearly bent), and the completeness of the follow-through.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "front_arm":      { "score": <0-10>, "observation": "<one sentence>" },
    "body_alignment": { "score": <0-10>, "observation": "<one sentence>" },
    "arm_straight":   { "score": <0-10>, "observation": "<one sentence>" },
    "follow_through": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Bowling Action',
  },
];

// ── SWIMMING DRILLS ───────────────────────────────────────────────────────────

export const SWIMMING_DRILLS: UniversalDrill[] = [
  {
    id: 'sw_stroke_technique',
    name: 'Freestyle / Front Crawl Stroke',
    sport: 'swimming',
    emoji: '🏊',
    positions: [],
    description: 'Swim one or two pool lengths at race pace. Gemini analyses stroke mechanics across the full visible swim.',
    coachingFocus: 'Catch position (high elbow entry), pull path (S-pull vs straight pull), rotation (hip drive), breathing timing, kick frequency.',
    whatToRecord: 'Swim 50–100m at race pace. Film from the pool deck at water level from the side. A second camera above adds value but is optional.',
    duration: '30–90 seconds',
    equipment: ['swimming pool', 'swimming cap + goggles'],
    difficulty: 'beginner',
    grsDomain: 'endurance',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'NCAA swimming scholarships are highly competitive — stroke efficiency (distance per stroke) is the primary mechanical predictor of performance improvement.',
    dimensions: [
      { key: 'catch_position',  label: 'Catch & Entry',        tip: 'High elbow entry with fingertips first (good) or flat hand slap (creates drag)?' },
      { key: 'pull_path',       label: 'Pull Path',            tip: 'Hand pulls in an efficient path under the body centreline — or wide, wasted pull?' },
      { key: 'body_rotation',   label: 'Hip Rotation',         tip: 'Full hip rotation (logs roll — generates power) or flat, rigid body (less propulsion)?' },
      { key: 'kick_rhythm',     label: 'Kick Rhythm',          tip: 'Consistent kick rhythm synced with arm strokes, or irregular kick breaking timing?' },
    ],
    geminiPrompt: `You are a USA Swimming-certified Level 3 coach reviewing a freestyle stroke clip from a young Zimbabwean swimmer filmed from pool-deck level.

Evaluate the catch/entry position (is the elbow high on entry?), the pull path under the body, the degree of hip rotation (body roll), and kick rhythm consistency throughout the visible length.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "catch_position": { "score": <0-10>, "observation": "<one sentence>" },
    "pull_path":      { "score": <0-10>, "observation": "<one sentence>" },
    "body_rotation":  { "score": <0-10>, "observation": "<one sentence>" },
    "kick_rhythm":    { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Stroke Technique',
  },

  {
    id: 'sw_flip_turn',
    name: 'Tumble Turn (Flip Turn)',
    sport: 'swimming',
    emoji: '🔄',
    positions: [],
    description: 'Approach, flip turn, and push-off at the wall. Scouts rate tumble turns as a top differentiator at elite level.',
    coachingFocus: 'Approach distance to wall (not too close/far), tight tuck (fast rotation), feet plant squarely on wall, powerful push-off and streamline.',
    whatToRecord: 'Swim at race pace and execute 4–6 tumble turns. Film from the side of the pool, wall visible. Slow-motion if possible.',
    duration: '30–60 seconds',
    equipment: ['swimming pool'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'A swimmer can gain 0.3–0.5 seconds per turn with perfect technique — coaches value athletes who have already mastered this aspect.',
    dimensions: [
      { key: 'approach_distance', label: 'Approach Distance',  tip: 'Does the swimmer reach the wall at an optimal distance (not over/under-stretching)?' },
      { key: 'tuck_speed',        label: 'Tuck Speed',         tip: 'Tight, fast tuck rotation at the wall (less time on the turn), or slow open rotation?' },
      { key: 'feet_placement',    label: 'Feet on Wall',       tip: 'Both feet plant squarely on the wall in parallel, ready for a strong push — or one-footed / angled?' },
      { key: 'push_streamline',   label: 'Push & Streamline',  tip: 'Powerful push with arms in tight streamline position — or short push with arms wide/loose?' },
    ],
    geminiPrompt: `You are a USA Swimming-certified Level 3 coach reviewing tumble turn technique from a young Zimbabwean swimmer.

For each turn, assess: approach distance to the wall, how tight and fast the tuck rotation is, where the feet land on the wall (together and parallel?), and the quality of the push-off into streamline.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "approach_distance": { "score": <0-10>, "observation": "<one sentence>" },
    "tuck_speed":        { "score": <0-10>, "observation": "<one sentence>" },
    "feet_placement":    { "score": <0-10>, "observation": "<one sentence>" },
    "push_streamline":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Flip Turn',
  },
];

// ── TENNIS DRILLS ─────────────────────────────────────────────────────────────

export const TENNIS_DRILLS: UniversalDrill[] = [
  {
    id: 'tn_serve_mechanics',
    name: 'Serve Mechanics',
    sport: 'tennis',
    emoji: '🎾',
    positions: [],
    description: 'Full service motion from ready position through ball toss, trophy position, and strike. The most important shot in tennis.',
    coachingFocus: 'Ball toss consistency (slightly in front, high enough), trophy position (arm up, racket behind back), pronation at contact, full leg push.',
    whatToRecord: 'Serve 8–10 balls from the baseline into the service box. Film from behind (to see ball toss) and then from the side (to see trophy position and body rotation).',
    duration: '60–90 seconds',
    equipment: ['tennis racket', '6–10 balls', 'net'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'Serve speed and consistency drive NCAA tennis scholarship decisions — Gemini evaluates the mechanics that generate both.',
    dimensions: [
      { key: 'ball_toss',      label: 'Ball Toss',         tip: 'Toss is high enough and consistently slightly in front and to the right (right-hander) — or inconsistent/behind?' },
      { key: 'trophy_position',label: 'Trophy Position',   tip: 'Clear trophy position (non-dominant arm up, racket behind head, knees bent) before uncoiling?' },
      { key: 'leg_drive',      label: 'Leg Drive & Jump',  tip: 'Full leg bend and explosive upward push (adding pace) — or flat-footed serve without leg contribution?' },
      { key: 'pronation',      label: 'Pronation at Contact', tip: 'Forearm pronates through contact (racket face whips through) adding speed, or arm stays rigid?' },
    ],
    geminiPrompt: `You are a USPTA-certified Level 1 tennis coach reviewing a serve mechanics clip from a young Zimbabwean player.

Assess each serve: ball toss height and placement (in front of the body?), the trophy position before uncoiling (arm up, racket behind), how much leg drive and jump height contribute to the serve, and whether the forearm pronates through ball contact.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "ball_toss":       { "score": <0-10>, "observation": "<one sentence>" },
    "trophy_position": { "score": <0-10>, "observation": "<one sentence>" },
    "leg_drive":       { "score": <0-10>, "observation": "<one sentence>" },
    "pronation":       { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Serve Mechanics',
  },

  {
    id: 'tn_groundstroke',
    name: 'Forehand & Backhand Groundstrokes',
    sport: 'tennis',
    emoji: '🏓',
    positions: [],
    description: 'Rally groundstrokes from the baseline. Gemini evaluates unit turn, swing path, contact point, and follow-through.',
    coachingFocus: 'Early unit turn (shoulder turn as soon as ball direction is known), low-to-high swing path generating topspin, contact in front of body, full finish.',
    whatToRecord: 'Rally with a partner or ball machine from the baseline. 10+ forehand AND 10+ backhand strokes. Film from behind and then from the side to catch swing path.',
    duration: '90–120 seconds',
    equipment: ['tennis racket', 'balls', 'net', 'partner or ball machine'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'Groundstroke consistency percentage is the first metric evaluated in US college tennis trials — technique is the root of consistency.',
    dimensions: [
      { key: 'unit_turn',       label: 'Unit Turn',           tip: 'Full shoulder/hip turn as soon as ball direction is read — or late preparation with just arm swing?' },
      { key: 'swing_path',      label: 'Swing Path',          tip: 'Low-to-high swing generating topspin (ball stays in), or flat push (less margin over the net)?' },
      { key: 'contact_point',   label: 'Contact Point',       tip: 'Ball struck in front of the body at a comfortable extension point, or late contact behind the hip?' },
      { key: 'finish_position', label: 'Finish / Follow-Through', tip: 'Full follow-through across the body finishing high (forehand) or over the shoulder (backhand)?' },
    ],
    geminiPrompt: `You are a USPTA-certified Level 1 tennis coach reviewing a groundstroke technique clip from a young Zimbabwean player at the baseline.

Observe both forehand and backhand shots: how early the unit turn happens after the ball is read, whether the swing path goes low-to-high (topspin) or flat, where the ball is contacted relative to the body (in front vs late), and the quality of the follow-through finishing position.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "unit_turn":       { "score": <0-10>, "observation": "<one sentence>" },
    "swing_path":      { "score": <0-10>, "observation": "<one sentence>" },
    "contact_point":   { "score": <0-10>, "observation": "<one sentence>" },
    "finish_position": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Groundstrokes',
  },
];

// ── VOLLEYBALL DRILLS ─────────────────────────────────────────────────────────

export const VOLLEYBALL_DRILLS: UniversalDrill[] = [
  {
    id: 'vb_spike_approach',
    name: 'Spike Approach & Attack',
    sport: 'volleyball',
    emoji: '🏐',
    positions: ['Outside Hitter', 'Opposite', 'Middle Blocker'],
    description: '3-step or 4-step spike approach with jump and arm swing. Gemini evaluates approach footwork, arm-load, and contact point.',
    coachingFocus: 'Approach footwork rhythm (3-step: right-left-right for right-handers), explosive two-foot jump from platform, arm swing from behind the ear, contact above and in front.',
    whatToRecord: 'Have a setter (or self-toss) and attack 6–8 balls. Film from the side-court angle so the full approach, jump, and swing are visible.',
    duration: '60–90 seconds',
    equipment: ['volleyball', 'net', 'setter or self-toss'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    reelSlot: 'strength',
    ncaaRelevant: true,
    scholarshipNote: 'Attack efficiency (kills per set) is a primary NCAA volleyball recruiting metric — Gemini evaluates the approach mechanics that drive that number.',
    dimensions: [
      { key: 'approach_footwork', label: 'Approach Footwork',   tip: 'Correct 3/4-step pattern (right-left-right for right-handers) — or inconsistent, shuffling approach?' },
      { key: 'jump_platform',     label: 'Two-Foot Platform',   tip: 'Both feet together to create an explosive, balanced platform jump? Or one-footed, off-balance?' },
      { key: 'arm_load',          label: 'Arm Load',            tip: 'Arm loaded back behind the head/ear before swinging (creates power) — or arm swings flat from low?' },
      { key: 'contact_point',     label: 'Contact Point',       tip: 'Ball contacted above and in front of the hitting shoulder at full arm extension (maximum power)?' },
    ],
    geminiPrompt: `You are a USA Volleyball-accredited coach reviewing a spike approach and attack clip from a young Zimbabwean volleyball player.

Watch each attack: is the approach footwork pattern correct and rhythmic (right-left-right for right-handers), do both feet plant together for a powerful two-foot jump, is the arm loaded behind the head before swinging, and where is the ball contacted relative to the shoulder?

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "approach_footwork": { "score": <0-10>, "observation": "<one sentence>" },
    "jump_platform":     { "score": <0-10>, "observation": "<one sentence>" },
    "arm_load":          { "score": <0-10>, "observation": "<one sentence>" },
    "contact_point":     { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Spike Approach',
  },

  {
    id: 'vb_digging',
    name: 'Passing & Digging (Platform)',
    sport: 'volleyball',
    emoji: '🤲',
    positions: ['Libero', 'Defensive Specialist', 'Outside Hitter'],
    description: 'Forearm pass (dig) of hard-driven balls. The foundation of serve-receive and defensive systems.',
    coachingFocus: 'Ready position (low, on balls of feet), platform angle (angled to target), movement to ball (shuffle then freeze), passing through the ball (no swing).',
    whatToRecord: 'Have a partner hit or spike 8–10 balls at varying speeds and angles. Film from behind the passer so platform angle is visible. Show the full movement pattern.',
    duration: '60–90 seconds',
    equipment: ['volleyball', 'partner who can hit'],
    difficulty: 'beginner',
    grsDomain: 'balance',
    reelSlot: 'game_intelligence',
    ncaaRelevant: true,
    scholarshipNote: 'Libero and DS positions are almost entirely evaluated on passing efficiency — Gemini identifies platform and movement mechanics that scouts cannot see in box scores.',
    dimensions: [
      { key: 'ready_position', label: 'Ready Position',   tip: 'Athletic stance: low, weight on balls of feet, arms ready — or upright and flat-footed?' },
      { key: 'platform_angle', label: 'Platform Angle',   tip: 'Platform (forearms) angled toward target (setter location) before ball arrives — or flat/random angle?' },
      { key: 'movement_freeze',label: 'Move Then Freeze', tip: 'Player moves to the ball and stops before contact (stable platform) — or still moving when they contact it?' },
      { key: 'no_swing',       label: 'No Arm Swing',     tip: 'Arms stay firm, body passes through the ball (controlled) — or arm swings causing erratic passes?' },
    ],
    geminiPrompt: `You are a USA Volleyball-accredited defensive coach reviewing a forearm passing (digging) clip from a young Zimbabwean player.

For each dig or pass: assess the starting ready position (low and athletic?), the platform angle toward the setter target, whether the player moves and freezes before contact or contacts while still moving, and whether the arms swing or stay firm through contact.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "ready_position": { "score": <0-10>, "observation": "<one sentence>" },
    "platform_angle": { "score": <0-10>, "observation": "<one sentence>" },
    "movement_freeze":{ "score": <0-10>, "observation": "<one sentence>" },
    "no_swing":       { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Passing & Digging',
  },
];

// ── HOCKEY DRILLS ─────────────────────────────────────────────────────────────

export const HOCKEY_DRILLS: UniversalDrill[] = [
  {
    id: 'hk_stick_handling',
    name: 'Stick Handling & Ball Control',
    sport: 'hockey',
    emoji: '🏑',
    positions: [],
    description: 'Dribble through cones with close ball control. Gemini evaluates grip, ball position relative to feet, and body position over the ball.',
    coachingFocus: 'Correct grip (left hand top, right hand lower), ball kept to the right and in front (Indian dribble), low body position, eyes up to see the field.',
    whatToRecord: 'Set up 6–8 cones in a line and dribble through them using Indian dribble technique. Film from the side and slightly front so stick and ball are visible. 4–5 runs.',
    duration: '45–60 seconds',
    equipment: ['hockey stick', 'hockey ball', '6–8 cones'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    reelSlot: 'skill',
    ncaaRelevant: true,
    scholarshipNote: 'Field hockey is a growth sport in the US with significant D1 scholarship money — stick skills are the primary differentiator for international recruits.',
    dimensions: [
      { key: 'grip_position',  label: 'Grip & Stick Angle',   tip: 'Correct V-grip (left hand top, right lower), stick angled to play the ball on the right side of body?' },
      { key: 'ball_position',  label: 'Ball Position',         tip: 'Ball kept to the right and forward of the feet (Indian dribble) — or too close to feet causing trips?' },
      { key: 'body_position',  label: 'Body Over Ball',        tip: 'Body low and bent at the hips over the ball (control and acceleration) — or upright?' },
      { key: 'eyes_up',        label: 'Eyes Up',               tip: 'Player scans forward while controlling ball — or head constantly down watching the ball?' },
    ],
    geminiPrompt: `You are a Hockey Zimbabwe-accredited coach reviewing a stick handling drill from a young Zimbabwean field hockey player.

Observe each run through the cones: check the stick grip and angle (left hand at top, ball played on right side), where the ball is relative to the feet (Indian dribble position), how low the player's body is over the ball, and whether they scan upfield with their eyes during the dribble.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "grip_position": { "score": <0-10>, "observation": "<one sentence>" },
    "ball_position": { "score": <0-10>, "observation": "<one sentence>" },
    "body_position": { "score": <0-10>, "observation": "<one sentence>" },
    "eyes_up":       { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Stick Skills',
  },

  {
    id: 'hk_push_pass',
    name: 'Push Pass Technique',
    sport: 'hockey',
    emoji: '📡',
    positions: [],
    description: 'Accurate push pass to a partner or target at 10–20m. The most precise pass in field hockey and a core skill for all positions.',
    coachingFocus: 'Low body position at the start of the push, stick face angle to target, weight transfer to front foot through the pass, follow-through pointing at target.',
    whatToRecord: 'Push pass to a partner or target at 10m and 20m. Film from the side-45° angle so the full body position and stick path are visible. 8–10 passes.',
    duration: '45–60 seconds',
    equipment: ['hockey stick', 'hockey ball', 'partner or target'],
    difficulty: 'beginner',
    grsDomain: 'ballMastery',
    reelSlot: 'technique',
    ncaaRelevant: true,
    scholarshipNote: 'Pass completion rate is tracked in NCAA field hockey from D1 down to D3 — the push pass is the foundation of that statistic.',
    dimensions: [
      { key: 'start_position',  label: 'Start Body Position', tip: 'Body low with stick and ball in control position before the push begins — or rushed and upright?' },
      { key: 'stick_face',      label: 'Stick Face to Target', tip: 'Stick face angled squarely toward the target throughout the push (accurate) — or face angled away?' },
      { key: 'weight_transfer', label: 'Weight Transfer',      tip: 'Weight shifts from back foot to front foot through the pass (power) — or stays on back foot?' },
      { key: 'follow_through',  label: 'Follow-Through',       tip: 'Stick follow-through points at the target after release, or stops short at contact?' },
    ],
    geminiPrompt: `You are a Hockey Zimbabwe-accredited coach reviewing a push pass technique clip from a young Zimbabwean field hockey player.

For each pass: assess starting body position (low and controlled?), whether the stick face stays angled toward the target through the push, the weight transfer from back to front foot, and how completely the stick follows through toward the target after release.

Return ONLY valid JSON, no markdown, no extra text:
{
  "scores": {
    "start_position":  { "score": <0-10>, "observation": "<one sentence>" },
    "stick_face":      { "score": <0-10>, "observation": "<one sentence>" },
    "weight_transfer": { "score": <0-10>, "observation": "<one sentence>" },
    "follow_through":  { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Push Pass',
  },
];

// ── SPORT DRILLS MAP ──────────────────────────────────────────────────────────

export const SPORT_DRILLS_MAP: Record<Sport, GeminiDrill[]> = {
  football:   FOOTBALL_DRILLS,
  rugby:      RUGBY_DRILLS,
  athletics:  ATHLETICS_DRILLS,
  netball:    NETBALL_DRILLS,
  basketball: BASKETBALL_DRILLS,
  cricket:    CRICKET_DRILLS,
  swimming:   SWIMMING_DRILLS,
  tennis:     TENNIS_DRILLS,
  volleyball: VOLLEYBALL_DRILLS,
  hockey:     HOCKEY_DRILLS,
};

// ── ALL DRILLS ────────────────────────────────────────────────────────────────

export const ALL_GEMINI_DRILLS: GeminiDrill[] = Object.values(SPORT_DRILLS_MAP).flat();

export function getDrillsBySport(sport: string): GeminiDrill[] {
  return SPORT_DRILLS_MAP[sport as Sport] ?? [];
}

// Alias with string param for page-level use (same behaviour)
export const getDrillsForSport = getDrillsBySport;

export function getDrillsBySlot(slot: ReelSlot): UniversalDrill[] {
  return ALL_GEMINI_DRILLS.filter(
    (d): d is UniversalDrill => 'reelSlot' in d && (d as UniversalDrill).reelSlot === slot
  );
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
  sport: string;          // string (not Sport) — stored result, no strict constraint needed
  passportLabel: string;
  overall_score: number;
  top_strength: string;
  key_improvement: string;
  coach_note: string;
  data_confidence: string;
  scores: Record<string, { score: number; observation: string }>;
  analysedAt: string; // ISO date
}
