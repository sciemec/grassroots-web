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

export type Sport = 'football' | 'rugby' | 'athletics' | 'netball' | 'basketball' | 'cricket' | 'swimming' | 'tennis' | 'volleyball' | 'hockey' | 'universal';
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

// ── SCHOLARSHIP REEL TYPES ────────────────────────────────────────────────────

export type ReelSlot = 'movement' | 'technical' | 'decision' | 'physical';

export interface UniversalDrill extends GeminiDrill {
  reelSlot: ReelSlot;
  coachNote: string;
  ncaaRelevance: string;
}

// ── UNIVERSAL ATHLETIC DRILLS (cross-sport — all athletes) ───────────────────

export const UNIVERSAL_ATHLETIC_DRILLS: UniversalDrill[] = [
  {
    id: 'uni_40yd_dash',
    name: '40-Yard Dash',
    sport: 'universal',
    emoji: '⚡',
    positions: [],
    description: 'Explosive straight-line speed test. The single most cited metric by NCAA, NAIA and African scholarship scouts.',
    coachingFocus: 'Drive phase (0–10 yards), top-end speed mechanics, arm drive.',
    whatToRecord: 'Full side-on view from start position. Capture at least 50 yards of runway.',
    duration: '10 sec',
    equipment: [],
    difficulty: 'beginner',
    grsDomain: 'linearSpeed',
    dimensions: [
      { key: 'drive_angle',  label: 'Drive Angle',   tip: 'Body lean forward in first 10 yards — ideal 45°' },
      { key: 'arm_drive',    label: 'Arm Drive',     tip: 'Compact 90° elbow, driving back to hip' },
      { key: 'stride_length',label: 'Stride Length', tip: 'Long powerful strides in acceleration phase' },
      { key: 'heel_kickup',  label: 'Heel Kick-Up',  tip: 'Heel pulls high toward glutes at top speed' },
    ],
    geminiPrompt: `You are analysing a 40-yard dash. Watch the entire video and return ONLY valid JSON:
{
  "scores": {
    "drive_angle":   { "score": <0-10>, "observation": "<one sentence>" },
    "arm_drive":     { "score": <0-10>, "observation": "<one sentence>" },
    "stride_length": { "score": <0-10>, "observation": "<one sentence>" },
    "heel_kickup":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: '40-Yard Dash',
    reelSlot: 'movement',
    coachNote: 'Film from the side at ground level for best angle analysis.',
    ncaaRelevance: 'Required by most American football and track programmes. Used as proxy for explosive athleticism in all field sports.',
  },
  {
    id: 'uni_505_cod',
    name: '5-0-5 Change of Direction',
    sport: 'universal',
    emoji: '🔄',
    positions: [],
    description: 'Agility test: sprint 15m, plant and return 5m. Measures deceleration control and lateral explosiveness.',
    coachingFocus: 'Penultimate foot plant, knee bend at change point, re-acceleration angle.',
    whatToRecord: 'Overhead or front-facing angle showing the plant foot and full COD motion.',
    duration: '15 sec',
    equipment: ['2 cones (or stones)'],
    difficulty: 'beginner',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'decel_steps',  label: 'Decel Steps',   tip: 'Number of steps to stop before plant — fewer is better' },
      { key: 'plant_knee',   label: 'Plant Knee',    tip: 'Knee over toe, not collapsing inward' },
      { key: 'reaccel_angle',label: 'Re-Accel Angle',tip: 'Low forward lean immediately after plant' },
      { key: 'hip_drop',     label: 'Hip Drop',      tip: 'Hips stay level — no excessive drop on plant side' },
    ],
    geminiPrompt: `You are analysing a 5-0-5 change of direction test. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "decel_steps":   { "score": <0-10>, "observation": "<one sentence>" },
    "plant_knee":    { "score": <0-10>, "observation": "<one sentence>" },
    "reaccel_angle": { "score": <0-10>, "observation": "<one sentence>" },
    "hip_drop":      { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: '5-0-5 Agility',
    reelSlot: 'movement',
    coachNote: 'Place camera at chest height directly facing the change-of-direction cone.',
    ncaaRelevance: 'Standard agility benchmark for football, netball, basketball, and hockey recruits.',
  },
  {
    id: 'uni_vertical_jump',
    name: 'Vertical Jump',
    sport: 'universal',
    emoji: '🦘',
    positions: [],
    description: 'Counter-movement vertical jump. Measures lower-body explosive power — correlated with sprint speed and athletic potential.',
    coachingFocus: 'Counter-movement depth, arm swing timing, peak height, landing mechanics.',
    whatToRecord: 'Full side view showing the athlete from feet to hands. Jump against a wall or pole for reference height.',
    duration: '10 sec',
    equipment: [],
    difficulty: 'beginner',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'cm_depth',     label: 'Counter-Move Depth', tip: 'Thigh near parallel at bottom of dip' },
      { key: 'arm_timing',   label: 'Arm Swing Timing',   tip: 'Arms and legs extend simultaneously at takeoff' },
      { key: 'peak_height',  label: 'Perceived Height',   tip: 'Estimated height reached relative to body length' },
      { key: 'landing',      label: 'Landing Control',    tip: 'Soft knee bend on landing, no forward collapse' },
    ],
    geminiPrompt: `You are analysing a counter-movement vertical jump. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "cm_depth":   { "score": <0-10>, "observation": "<one sentence>" },
    "arm_timing": { "score": <0-10>, "observation": "<one sentence>" },
    "peak_height": { "score": <0-10>, "observation": "<one sentence>" },
    "landing":    { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Vertical Jump',
    reelSlot: 'physical',
    coachNote: 'Place camera side-on at waist height. Mark the wall with tape for reference.',
    ncaaRelevance: 'Key metric for basketball, volleyball, netball, and athletics scholarship evaluation.',
  },
  {
    id: 'uni_broad_jump',
    name: 'Standing Broad Jump',
    sport: 'universal',
    emoji: '🏃',
    positions: [],
    description: 'Two-foot horizontal explosive jump. Tests hip extension power and athletic potential in a different plane from vertical.',
    coachingFocus: 'Arm swing, hip hinge, full extension at takeoff, landing balance.',
    whatToRecord: 'Side view showing full takeoff through landing. Mark the ground for reference.',
    duration: '10 sec',
    equipment: ['tape or chalk mark on ground'],
    difficulty: 'beginner',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'hip_hinge',    label: 'Hip Hinge',        tip: 'Deep hip hinge loading before jump' },
      { key: 'arm_swing',    label: 'Arm Swing',        tip: 'Arms drive forward and up at takeoff' },
      { key: 'full_extend',  label: 'Full Extension',   tip: 'Hips, knees and ankles fully extended at peak' },
      { key: 'landing_bal',  label: 'Landing Balance',  tip: 'Lands on both feet and holds — no stepping forward' },
    ],
    geminiPrompt: `You are analysing a standing broad jump. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "hip_hinge":   { "score": <0-10>, "observation": "<one sentence>" },
    "arm_swing":   { "score": <0-10>, "observation": "<one sentence>" },
    "full_extend": { "score": <0-10>, "observation": "<one sentence>" },
    "landing_bal": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Broad Jump',
    reelSlot: 'physical',
    coachNote: 'Mark the takeoff line with chalk. Film from the side at ground level.',
    ncaaRelevance: 'Used by college track, football and basketball programmes to assess lower-body power.',
  },
];

// ── FOOTBALL SCHOLARSHIP DRILLS ───────────────────────────────────────────────

export const FOOTBALL_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'fb_1v1_defending',
    name: '1v1 Defending — Delay and Deny',
    sport: 'football',
    emoji: '🛡️',
    positions: ['Defender', 'Midfielder', 'Goalkeeper'],
    description: 'Defender delays an attacker who is trying to pass, showing body shape, tracking run, and winning the ball.',
    coachingFocus: 'Stance, jockeying footwork, timing of tackle, body angle.',
    whatToRecord: 'Side or diagonal view showing both attacker and defender from first touch to tackle or recovery.',
    duration: '30 sec',
    equipment: ['ball', '2 cones'],
    difficulty: 'intermediate',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'stance',       label: 'Defensive Stance',  tip: 'Low centre of gravity, sideways-on, weight on balls of feet' },
      { key: 'jockey',       label: 'Jockeying',         tip: 'Small backwards steps staying goal-side of attacker' },
      { key: 'tackle_time',  label: 'Tackle Timing',     tip: 'Tackle triggered when attacker touches ball — not before' },
      { key: 'recovery',     label: 'Recovery Run',      tip: 'Immediate sprint if beaten — head up, tracking attacker' },
    ],
    geminiPrompt: `You are analysing a 1v1 defending drill in football. Watch the full clip and return ONLY valid JSON:
{
  "scores": {
    "stance":      { "score": <0-10>, "observation": "<one sentence>" },
    "jockey":      { "score": <0-10>, "observation": "<one sentence>" },
    "tackle_time": { "score": <0-10>, "observation": "<one sentence>" },
    "recovery":    { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: '1v1 Defending',
    reelSlot: 'decision',
    coachNote: 'Set a 5m channel so the attacker must commit. Film from the side.',
    ncaaRelevance: 'Elite defensive positioning is the #1 trait scouts note in defensive midfielders and centre backs.',
  },
  {
    id: 'fb_touch_and_press',
    name: 'Touch and Press — High-Press Trigger',
    sport: 'football',
    emoji: '🔥',
    positions: ['Striker', 'Winger', 'Midfielder'],
    description: 'Player triggers a press the moment the opponent receives a backwards pass, closing the gap in 2–3 explosive strides.',
    coachingFocus: 'Trigger recognition, sprint angle to cut off passing lane, body shape on approach.',
    whatToRecord: 'Overhead or diagonal view showing the pressing player and the recipient. Capture the trigger moment and full press.',
    duration: '20 sec',
    equipment: ['ball', '2 cones'],
    difficulty: 'advanced',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'trigger_read', label: 'Trigger Read',     tip: 'Press starts before ball arrives at receiver — not after' },
      { key: 'sprint_angle', label: 'Sprint Angle',     tip: 'Approaches to cut off forward pass, not straight at ball' },
      { key: 'press_speed',  label: 'Press Speed',      tip: 'Maximum acceleration in first 3 strides' },
      { key: 'body_shape',   label: 'Approach Shape',   tip: 'Arrives with arms wide, low centre, forcing sideways' },
    ],
    geminiPrompt: `You are analysing a high-press trigger drill in football. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "trigger_read": { "score": <0-10>, "observation": "<one sentence>" },
    "sprint_angle": { "score": <0-10>, "observation": "<one sentence>" },
    "press_speed":  { "score": <0-10>, "observation": "<one sentence>" },
    "body_shape":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'High Press Trigger',
    reelSlot: 'decision',
    coachNote: 'Use a coach or partner to play the back-pass on cue. Film from behind the presser.',
    ncaaRelevance: 'Pressing intelligence is the defining quality separating Division I midfielders from lower tiers.',
  },
  {
    id: 'fb_blindside_run',
    name: 'Blindside Run — Timing Off the Ball',
    sport: 'football',
    emoji: '👻',
    positions: ['Striker', 'Winger', 'Attacking Midfielder'],
    description: 'Attacker times a run into a blindspot behind the last defender, triggered by the moment a teammate looks up.',
    coachingFocus: 'Timing of run, acceleration into space, checking run before the burst.',
    whatToRecord: 'Wide side view showing the full attacking half. Film from a raised position if possible.',
    duration: '20 sec',
    equipment: ['ball'],
    difficulty: 'advanced',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'check_run',    label: 'Check Run',         tip: 'Short movement away before the burst — draws defender' },
      { key: 'run_timing',   label: 'Run Timing',        tip: 'Run starts as passer looks up — not before or after' },
      { key: 'accel_burst',  label: 'Acceleration Burst',tip: 'Explosive first 3 strides into the space' },
      { key: 'offside_ctrl', label: 'Offside Control',   tip: 'Stays marginally onside at the trigger moment' },
    ],
    geminiPrompt: `You are analysing a blindside run timing drill in football. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "check_run":   { "score": <0-10>, "observation": "<one sentence>" },
    "run_timing":  { "score": <0-10>, "observation": "<one sentence>" },
    "accel_burst": { "score": <0-10>, "observation": "<one sentence>" },
    "offside_ctrl":{ "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Blindside Run',
    reelSlot: 'decision',
    coachNote: 'Have a partner play the trigger pass. Film from the side at raised height.',
    ncaaRelevance: 'Movement without the ball is the hardest skill to teach — scouts prize natural timing.',
  },
];

// ── RUGBY SCHOLARSHIP DRILLS ──────────────────────────────────────────────────

export const RUGBY_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'rg_tackle_technique',
    name: 'Tackle Technique — Front-On',
    sport: 'rugby',
    emoji: '💥',
    positions: ['Flanker', 'Lock', 'Prop', 'Fullback'],
    description: 'Player executes a front-on tackle on a pad-carrier: chop tackle entry, wrap, drive through.',
    coachingFocus: 'Leg drive, head position (cheek to cheek), wrap and squeeze, body angle.',
    whatToRecord: 'Side-on or slight diagonal view. Film entire approach, contact and follow-through.',
    duration: '15 sec',
    equipment: ['tackle pad or willing partner'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'head_pos',     label: 'Head Position',  tip: 'Head to side — never directly in front of contact' },
      { key: 'leg_drive',    label: 'Leg Drive',      tip: 'Short powerful steps continuing through contact' },
      { key: 'wrap',         label: 'Wrap and Squeeze',tip: 'Arms wrap tight around ball carrier body' },
      { key: 'body_angle',   label: 'Body Angle',     tip: 'Low entry angle — tackler below ball carrier centre of gravity' },
    ],
    geminiPrompt: `You are analysing a front-on rugby tackle technique. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "head_pos":   { "score": <0-10>, "observation": "<one sentence>" },
    "leg_drive":  { "score": <0-10>, "observation": "<one sentence>" },
    "wrap":       { "score": <0-10>, "observation": "<one sentence>" },
    "body_angle": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Tackle Technique',
    reelSlot: 'technical',
    coachNote: 'Use a tackle bag. Film from the side at ground level.',
    ncaaRelevance: 'Safe and effective tackle mechanics are a prerequisite for any college rugby programme.',
  },
  {
    id: 'rg_ball_carry',
    name: 'Ball Carry — Contact Entry',
    sport: 'rugby',
    emoji: '🏉',
    positions: ['Number 8', 'Flanker', 'Lock', 'Centre'],
    description: 'Ball carrier drives into a tackle bag, staying low and powerful through contact. Tests leg power and body position.',
    coachingFocus: 'Low body position, short power steps, ball protection, body angle through contact.',
    whatToRecord: 'Side view showing approach, contact and follow-through for at least 3 metres past contact.',
    duration: '15 sec',
    equipment: ['tackle bag'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'body_low',     label: 'Low Body',        tip: 'Hips below contact point on entry' },
      { key: 'power_steps',  label: 'Power Steps',     tip: 'Short explosive steps continue through bag' },
      { key: 'ball_protect', label: 'Ball Protection', tip: 'Ball tucked into body with two-point carry' },
      { key: 'post_contact', label: 'Post-Contact Drive',tip: 'Continues driving for minimum 2 body lengths' },
    ],
    geminiPrompt: `You are analysing a rugby ball carry into contact. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "body_low":     { "score": <0-10>, "observation": "<one sentence>" },
    "power_steps":  { "score": <0-10>, "observation": "<one sentence>" },
    "ball_protect": { "score": <0-10>, "observation": "<one sentence>" },
    "post_contact": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Ball Carry',
    reelSlot: 'technical',
    coachNote: 'Set a tackle bag against a wall or held by a partner. Film from the side.',
    ncaaRelevance: 'Post-contact metres gained is the top ball-carrying metric in USA Rugby college scouting.',
  },
  {
    id: 'rg_line_break',
    name: 'Line Break — Footwork and Evasion',
    sport: 'rugby',
    emoji: '⚡',
    positions: ['Fly Half', 'Centre', 'Wing', 'Fullback'],
    description: 'Player uses a step or fend to evade a defender in space. Tests evasion footwork and acceleration post-contact.',
    coachingFocus: 'Plant foot explosiveness, direction change, post-evasion acceleration.',
    whatToRecord: 'Diagonal or front view showing the evasion move and sprint away. Film from raised position if possible.',
    duration: '20 sec',
    equipment: ['ball', '1 cone'],
    difficulty: 'advanced',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'plant_foot',   label: 'Plant Foot Power', tip: 'Explosive push-off from the step foot' },
      { key: 'hip_turn',     label: 'Hip Turn Speed',   tip: 'Hips rotate quickly in evasion direction' },
      { key: 'post_step',    label: 'Post-Step Speed',  tip: 'Immediate acceleration within 2 strides of the step' },
      { key: 'ball_ctrl',    label: 'Ball Control',     tip: 'Ball remains secure and in attack position during step' },
    ],
    geminiPrompt: `You are analysing a rugby line break and evasion drill. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "plant_foot": { "score": <0-10>, "observation": "<one sentence>" },
    "hip_turn":   { "score": <0-10>, "observation": "<one sentence>" },
    "post_step":  { "score": <0-10>, "observation": "<one sentence>" },
    "ball_ctrl":  { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Line Break',
    reelSlot: 'decision',
    coachNote: 'Use a cone as a marker for the defender position. Film from above and to the side.',
    ncaaRelevance: 'Evasion footwork separates D1 backs from lower-tier players in NAIA and club rugby.',
  },
];

// ── ATHLETICS SCHOLARSHIP DRILLS ─────────────────────────────────────────────

export const ATHLETICS_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'ath_sprint_start',
    name: 'Sprint Start — Block Mechanics',
    sport: 'athletics',
    emoji: '🚀',
    positions: ['Sprinter', '100m', '200m', '400m'],
    description: 'Starting block reaction and drive phase mechanics for 100m, 200m or 400m sprint events.',
    coachingFocus: 'Block clearance angle, drive phase body lean, arm drive, shin angle in first 10m.',
    whatToRecord: 'Side view from the starting blocks. Capture at least 20 metres of the sprint.',
    duration: '10 sec',
    equipment: ['starting blocks (or standing start)'],
    difficulty: 'intermediate',
    grsDomain: 'linearSpeed',
    dimensions: [
      { key: 'block_angle',  label: 'Block Angle',      tip: 'Body at 45° on clearance — horizontal power' },
      { key: 'shin_angle',   label: 'Shin Angle',       tip: 'Shin parallel to trunk — powerful push' },
      { key: 'arm_drive',    label: 'Arm Drive',        tip: '90° elbow, driven back to hip aggressively' },
      { key: 'head_neutral', label: 'Head Neutral',     tip: 'Head neutral at clearance — rises gradually over 10m' },
    ],
    geminiPrompt: `You are analysing an athletics sprint start. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "block_angle":  { "score": <0-10>, "observation": "<one sentence>" },
    "shin_angle":   { "score": <0-10>, "observation": "<one sentence>" },
    "arm_drive":    { "score": <0-10>, "observation": "<one sentence>" },
    "head_neutral": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Sprint Start',
    reelSlot: 'technical',
    coachNote: 'Film from directly to the side at ground level. Capture the full drive phase.',
    ncaaRelevance: 'Starting mechanics are evaluated at every US college track and field combine.',
  },
  {
    id: 'ath_hurdle',
    name: 'Hurdle Clearance',
    sport: 'athletics',
    emoji: '🏃',
    positions: ['Hurdler', '100mH', '110mH', '400mH'],
    description: 'Athlete clears a hurdle (or substitute) showing lead leg snap, trail leg mechanics and stride rhythm.',
    coachingFocus: 'Lead leg snap, trail leg pull-through, forward lean over hurdle, landing stride.',
    whatToRecord: 'Side view showing at least 3 hurdles in sequence. Film at chest height.',
    duration: '15 sec',
    equipment: ['hurdle or 2 cones with a stick'],
    difficulty: 'advanced',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'lead_snap',    label: 'Lead Leg Snap',    tip: 'Straight leg drives up and snaps down quickly' },
      { key: 'trail_pull',   label: 'Trail Leg Pull',   tip: 'Trail knee pulls through horizontally — not swinging wide' },
      { key: 'forward_lean', label: 'Forward Lean',     tip: 'Body leans forward over the hurdle — minimal height' },
      { key: 'land_stride',  label: 'Landing Stride',   tip: 'Landing foot pulls back and contacts ground actively' },
    ],
    geminiPrompt: `You are analysing hurdle clearance in athletics. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "lead_snap":    { "score": <0-10>, "observation": "<one sentence>" },
    "trail_pull":   { "score": <0-10>, "observation": "<one sentence>" },
    "forward_lean": { "score": <0-10>, "observation": "<one sentence>" },
    "land_stride":  { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Hurdle Clearance',
    reelSlot: 'technical',
    coachNote: 'Use 3+ hurdles in sequence so Gemini can see rhythm. Film from the side.',
    ncaaRelevance: 'Hurdle mechanics are directly assessed at IAAF and NCAA track combines.',
  },
  {
    id: 'ath_long_jump',
    name: 'Long Jump — Approach and Takeoff',
    sport: 'athletics',
    emoji: '✈️',
    positions: ['Long Jumper', 'Jumps'],
    description: 'Full long jump approach, takeoff mechanics, flight position and landing.',
    coachingFocus: 'Penultimate step acceleration, takeoff foot plant, flight position, landing reach.',
    whatToRecord: 'Full side view from approach start through landing. Film at ground level.',
    duration: '15 sec',
    equipment: ['sand pit or marked zone on ground'],
    difficulty: 'advanced',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'penultimate',  label: 'Penultimate Step', tip: 'Long fast penultimate step drops hips for takeoff' },
      { key: 'takeoff_ext',  label: 'Takeoff Extension',tip: 'Full body extension at takeoff — toe to fingertip' },
      { key: 'flight_pos',   label: 'Flight Position',  tip: 'Hang or stride technique maintained in air' },
      { key: 'landing_reach',label: 'Landing Reach',    tip: 'Legs reach forward and heels contact first' },
    ],
    geminiPrompt: `You are analysing a long jump in athletics. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "penultimate":   { "score": <0-10>, "observation": "<one sentence>" },
    "takeoff_ext":   { "score": <0-10>, "observation": "<one sentence>" },
    "flight_pos":    { "score": <0-10>, "observation": "<one sentence>" },
    "landing_reach": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Long Jump',
    reelSlot: 'technical',
    coachNote: 'Film full approach plus landing. Mark the sand edge for reference.',
    ncaaRelevance: 'Standard field event evaluated at all NCAA and NAIA athletics combines.',
  },
];

// ── NETBALL SCHOLARSHIP DRILLS ────────────────────────────────────────────────

export const NETBALL_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'nb_centre_pass',
    name: 'Centre Pass — Timing and Lead',
    sport: 'netball',
    emoji: '🏐',
    positions: ['Centre', 'Wing Attack', 'Wing Defence'],
    description: 'Player leads from the centre circle on the whistle, receives and distributes in one fluid movement.',
    coachingFocus: 'Lead timing, footwork on catch, pivot turn, pass accuracy.',
    whatToRecord: 'Overhead or elevated view showing the centre circle and both leads. Capture whistle through pass.',
    duration: '20 sec',
    equipment: ['ball', 'marked court or circle'],
    difficulty: 'intermediate',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'lead_timing',  label: 'Lead Timing',     tip: 'Lead starts simultaneously with whistle — not after' },
      { key: 'footwork',     label: 'Footwork',         tip: 'Lands on one foot — correct landing pattern for netball' },
      { key: 'pivot_speed',  label: 'Pivot Speed',      tip: 'Quick pivot toward target before defender recovers' },
      { key: 'pass_acc',     label: 'Pass Accuracy',    tip: 'Chest or shoulder pass delivered on target' },
    ],
    geminiPrompt: `You are analysing a netball centre pass. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "lead_timing": { "score": <0-10>, "observation": "<one sentence>" },
    "footwork":    { "score": <0-10>, "observation": "<one sentence>" },
    "pivot_speed": { "score": <0-10>, "observation": "<one sentence>" },
    "pass_acc":    { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Centre Pass',
    reelSlot: 'decision',
    coachNote: 'Film from a raised position. Use a whistle for accurate trigger timing.',
    ncaaRelevance: 'Centre pass execution is the defining metric for midcourt players in IFNA scholarship assessments.',
  },
  {
    id: 'nb_shooting',
    name: 'Shooting Under Pressure',
    sport: 'netball',
    emoji: '🎯',
    positions: ['Goal Shoot', 'Goal Attack'],
    description: 'Player shoots from close and mid-range positions under passive defender pressure. Tests technique consistency.',
    coachingFocus: 'Shooting stance, release point, follow-through, pressure response.',
    whatToRecord: 'Front or slight diagonal view showing full body and ring. Film 5+ shot attempts.',
    duration: '60 sec',
    equipment: ['ball', 'goal post'],
    difficulty: 'intermediate',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'stance',       label: 'Stance',           tip: 'Balanced base — feet shoulder-width, knees soft' },
      { key: 'release',      label: 'Release Point',    tip: 'Ball released high — extends to fingertip' },
      { key: 'follow_thru',  label: 'Follow-Through',   tip: 'Hand follows toward ring after release' },
      { key: 'pressure_rsp', label: 'Pressure Response',tip: 'Technique unchanged when defender close' },
    ],
    geminiPrompt: `You are analysing netball shooting under pressure. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "stance":       { "score": <0-10>, "observation": "<one sentence>" },
    "release":      { "score": <0-10>, "observation": "<one sentence>" },
    "follow_thru":  { "score": <0-10>, "observation": "<one sentence>" },
    "pressure_rsp": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Shooting',
    reelSlot: 'technical',
    coachNote: 'Film from the front slightly off-centre. Include both close and mid-range attempts.',
    ncaaRelevance: 'Shooting accuracy under simulated match pressure is the top metric for Goal Shoot recruiters.',
  },
  {
    id: 'nb_defence',
    name: 'Defence — Marking and Intercept',
    sport: 'netball',
    emoji: '🛡️',
    positions: ['Goal Defence', 'Wing Defence', 'Goal Keeper'],
    description: 'Defender shadows an attacker and attempts to intercept a pass in a confined zone.',
    coachingFocus: 'Footwork, reading the pass, tipping or intercepting without contact.',
    whatToRecord: 'Overhead or elevated view showing defender, attacker and passer. Film 3 + pass attempts.',
    duration: '30 sec',
    equipment: ['ball', 'marked zone'],
    difficulty: 'intermediate',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'shadow_fwork',label: 'Shadow Footwork',  tip: 'Stays within 0.9m — mirrors attacker without contact' },
      { key: 'read_pass',   label: 'Read the Pass',    tip: 'Shifts weight and reaches before ball arrives' },
      { key: 'tip_control', label: 'Tip Control',      tip: 'Controlled tip — not wild swipe that goes out' },
      { key: 'recovery',    label: 'Recovery',          tip: 'Returns to defensive position within 1 second of missed intercept' },
    ],
    geminiPrompt: `You are analysing netball defensive marking and interception. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "shadow_fwork": { "score": <0-10>, "observation": "<one sentence>" },
    "read_pass":    { "score": <0-10>, "observation": "<one sentence>" },
    "tip_control":  { "score": <0-10>, "observation": "<one sentence>" },
    "recovery":     { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Defensive Marking',
    reelSlot: 'decision',
    coachNote: 'Use 3-player setup: passer, attacker, defender. Film from elevated position.',
    ncaaRelevance: 'Defensive anticipation is the hardest skill to develop — scouts value players who arrive with it.',
  },
];

// ── BASKETBALL SCHOLARSHIP DRILLS ─────────────────────────────────────────────

export const BASKETBALL_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'bk_ball_handling',
    name: 'Ball Handling — Two-Ball Combination',
    sport: 'basketball',
    emoji: '🏀',
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward'],
    description: 'Player dribbles two basketballs simultaneously through a combination sequence, testing hand speed and coordination.',
    coachingFocus: 'Dribble height, hand alternation, eye level (not looking at ball), rhythm.',
    whatToRecord: 'Front or slightly diagonal view showing both hands and the ball contact. Film 30+ seconds.',
    duration: '45 sec',
    equipment: ['2 basketballs'],
    difficulty: 'intermediate',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'dribble_hgt',  label: 'Dribble Height',   tip: 'Below waist — controlled, not bouncing high' },
      { key: 'eyes_up',      label: 'Eyes Up',           tip: 'Eyes at chest level or above — not watching ball' },
      { key: 'hand_speed',   label: 'Hand Speed',        tip: 'Quick alternating rhythm between both hands' },
      { key: 'body_low',     label: 'Low Body',          tip: 'Knees bent, athletic stance maintained throughout' },
    ],
    geminiPrompt: `You are analysing a basketball two-ball handling drill. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "dribble_hgt": { "score": <0-10>, "observation": "<one sentence>" },
    "eyes_up":     { "score": <0-10>, "observation": "<one sentence>" },
    "hand_speed":  { "score": <0-10>, "observation": "<one sentence>" },
    "body_low":    { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Ball Handling',
    reelSlot: 'technical',
    coachNote: 'Film from the front at waist height. Combine crossover and between-legs moves.',
    ncaaRelevance: 'Two-ball handling is a standard D1 guard evaluation tool at US college combines.',
  },
  {
    id: 'bk_drive_finish',
    name: 'Drive and Finish — Layup Angles',
    sport: 'basketball',
    emoji: '🏀',
    positions: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward'],
    description: 'Player drives from the wing to the basket from both sides, finishing with correct layup footwork.',
    coachingFocus: 'Gathering step, extension at layup point, correct foot for each side, body control.',
    whatToRecord: 'Side or diagonal view. Include 3+ drives from each side. Film from free throw line position.',
    duration: '60 sec',
    equipment: ['ball', 'hoop'],
    difficulty: 'intermediate',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'gather_step',  label: 'Gather Step',      tip: 'Clean 1-2 gather — no extra steps' },
      { key: 'correct_foot', label: 'Correct Foot',     tip: 'Right layup = left foot takeoff, vice versa' },
      { key: 'body_ctrl',    label: 'Body Control',     tip: 'Absorbs contact — does not fade or lose balance' },
      { key: 'finish_ext',   label: 'Finish Extension', tip: 'Full arm extension at highest point of jump' },
    ],
    geminiPrompt: `You are analysing basketball drive and finish layup mechanics. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "gather_step":  { "score": <0-10>, "observation": "<one sentence>" },
    "correct_foot": { "score": <0-10>, "observation": "<one sentence>" },
    "body_ctrl":    { "score": <0-10>, "observation": "<one sentence>" },
    "finish_ext":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Drive and Finish',
    reelSlot: 'technical',
    coachNote: 'Alternate sides. Film each drive separately if possible. Use cone as defender.',
    ncaaRelevance: 'Finishing at the rim separates college-ready guards from prep-level players.',
  },
  {
    id: 'bk_read_defence',
    name: 'Read the Defence — Pick and Roll',
    sport: 'basketball',
    emoji: '🧠',
    positions: ['Point Guard', 'Shooting Guard'],
    description: 'Player reads the pick-and-roll coverage and makes the correct decision: pull-up, pass to roller, or drive.',
    coachingFocus: 'Eyes on defence, decision speed, ball placement on each option.',
    whatToRecord: 'Overhead or elevated view showing the full pick-and-roll including roll man. Film from behind the hoop.',
    duration: '30 sec',
    equipment: ['ball', 'a partner as screener'],
    difficulty: 'advanced',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'eyes_defence', label: 'Eyes on Defence',  tip: 'Head up reading coverage before using the screen' },
      { key: 'decision_spd', label: 'Decision Speed',   tip: 'Correct read executed within 1 second of screen use' },
      { key: 'spacing',      label: 'Spacing',          tip: 'Uses screen correctly — tight off the screener shoulder' },
      { key: 'pass_acc',     label: 'Pass Accuracy',    tip: 'Pass on target when choosing the roller or skip option' },
    ],
    geminiPrompt: `You are analysing a basketball pick-and-roll read. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "eyes_defence": { "score": <0-10>, "observation": "<one sentence>" },
    "decision_spd": { "score": <0-10>, "observation": "<one sentence>" },
    "spacing":      { "score": <0-10>, "observation": "<one sentence>" },
    "pass_acc":     { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Pick and Roll Read',
    reelSlot: 'decision',
    coachNote: 'Use two players: ball handler and screener. Film from above and behind the play.',
    ncaaRelevance: 'Pick-and-roll IQ is the primary decision-making metric for D1 guard prospects.',
  },
];

// ── SWIMMING SCHOLARSHIP DRILLS ───────────────────────────────────────────────

export const SWIMMING_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'sw_freestyle_stroke',
    name: 'Freestyle Stroke Mechanics',
    sport: 'swimming',
    emoji: '🏊',
    positions: ['Freestyler', '100m Free', '200m Free', 'All-rounder'],
    description: 'Full freestyle stroke analysis from an overhead and side view, assessing technique and efficiency.',
    coachingFocus: 'High elbow catch, hip rotation, kick rhythm, bilateral breathing.',
    whatToRecord: 'Side view (above water) for 2+ full lengths. Include underwater section if possible.',
    duration: '30 sec',
    equipment: ['pool or open water'],
    difficulty: 'intermediate',
    grsDomain: 'endurance',
    dimensions: [
      { key: 'high_elbow',   label: 'High Elbow Catch', tip: 'Elbow higher than hand in catch phase' },
      { key: 'hip_rotate',   label: 'Hip Rotation',     tip: 'Body rotates 45–60° on each stroke side' },
      { key: 'kick_rhythm',  label: 'Kick Rhythm',      tip: 'Six-beat kick — consistent and compact' },
      { key: 'breathing',    label: 'Breathing',         tip: 'Rotational breath — minimal head lift' },
    ],
    geminiPrompt: `You are analysing freestyle swimming stroke mechanics. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "high_elbow":  { "score": <0-10>, "observation": "<one sentence>" },
    "hip_rotate":  { "score": <0-10>, "observation": "<one sentence>" },
    "kick_rhythm": { "score": <0-10>, "observation": "<one sentence>" },
    "breathing":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Freestyle Stroke',
    reelSlot: 'technical',
    coachNote: 'Film from the side above water level. 2+ lengths gives better technique analysis.',
    ncaaRelevance: 'Stroke mechanics are assessed at every NCAA swimming combine — technique efficiency determines time potential.',
  },
  {
    id: 'sw_flip_turn',
    name: 'Flip Turn — Approach and Push-Off',
    sport: 'swimming',
    emoji: '🔄',
    positions: ['All Strokes', 'Freestyler', 'Backstroker'],
    description: 'Tumble turn mechanics: approach timing, rotation compactness, wall contact and push-off streamline.',
    coachingFocus: 'Approach stroke count, tuck tightness, wall contact position, streamline depth.',
    whatToRecord: 'Side view showing the full turn sequence from 5 metres out through 5 metres off the wall.',
    duration: '15 sec',
    equipment: ['pool with wall'],
    difficulty: 'intermediate',
    grsDomain: 'linearSpeed',
    dimensions: [
      { key: 'approach_cnt', label: 'Approach Count',   tip: 'Consistent stroke count — no shortening or reaching' },
      { key: 'tuck_tight',   label: 'Tuck Tightness',  tip: 'Compact tuck — knees pulled to chest' },
      { key: 'wall_contact', label: 'Wall Contact',     tip: 'Both feet contact wall simultaneously' },
      { key: 'streamline',   label: 'Streamline',       tip: 'Arms locked overhead in tight streamline before kick-out' },
    ],
    geminiPrompt: `You are analysing a swimming flip turn. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "approach_cnt": { "score": <0-10>, "observation": "<one sentence>" },
    "tuck_tight":   { "score": <0-10>, "observation": "<one sentence>" },
    "wall_contact": { "score": <0-10>, "observation": "<one sentence>" },
    "streamline":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Flip Turn',
    reelSlot: 'technical',
    coachNote: 'Film from the side at water level. Use slow-motion if available.',
    ncaaRelevance: 'Turns account for up to 30% of race time — elite turn mechanics are a primary scholarship differentiator.',
  },
  {
    id: 'sw_dive_entry',
    name: 'Race Dive — Entry and Breakout',
    sport: 'swimming',
    emoji: '🤽',
    positions: ['All Strokes', 'Sprint Freestyler'],
    description: 'Starting block dive through the water entry and breakout, assessing angle, distance and streamline.',
    coachingFocus: 'Block explosion angle, entry angle, streamline depth, breakout timing.',
    whatToRecord: 'Side view from block through first 15 metres. Capture above and below water if possible.',
    duration: '15 sec',
    equipment: ['starting block or poolside'],
    difficulty: 'intermediate',
    grsDomain: 'explosivePower',
    dimensions: [
      { key: 'block_drive',  label: 'Block Drive',      tip: 'Explosive leg drive — body fully extended at entry' },
      { key: 'entry_angle',  label: 'Entry Angle',      tip: 'Enters at 30–40° — minimal splash, maximum distance' },
      { key: 'stream_depth', label: 'Streamline Depth', tip: 'Streamlines at optimal depth (0.6–1m below surface)' },
      { key: 'breakout_time',label: 'Breakout Timing',  tip: 'Breakout stroke before speed drops to surface speed' },
    ],
    geminiPrompt: `You are analysing a swimming race dive and breakout. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "block_drive":   { "score": <0-10>, "observation": "<one sentence>" },
    "entry_angle":   { "score": <0-10>, "observation": "<one sentence>" },
    "stream_depth":  { "score": <0-10>, "observation": "<one sentence>" },
    "breakout_time": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Race Dive',
    reelSlot: 'physical',
    coachNote: 'Film from the side. Underwater camera is ideal but not required for basic analysis.',
    ncaaRelevance: 'Start mechanics are evaluated at every USA Swimming recruiting event.',
  },
];

// ── TENNIS SCHOLARSHIP DRILLS ─────────────────────────────────────────────────

export const TENNIS_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'tn_serve',
    name: 'Serve — Trophy Position and Pronation',
    sport: 'tennis',
    emoji: '🎾',
    positions: ['All Positions'],
    description: 'Full serve mechanics from toss through trophy position, contact point and follow-through pronation.',
    coachingFocus: 'Toss placement, trophy position (racket drop), contact point height, pronation.',
    whatToRecord: 'Side view or slight diagonal from behind. Film 5+ serves. Include full court baseline.',
    duration: '60 sec',
    equipment: ['racket', 'balls', 'net'],
    difficulty: 'intermediate',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'toss_pos',     label: 'Toss Position',    tip: 'Toss at 1 o\'clock — slightly in front and to racket side' },
      { key: 'trophy_pos',   label: 'Trophy Position',  tip: 'Racket behind head — wrist cocked, elbow at shoulder level' },
      { key: 'contact_hgt',  label: 'Contact Height',   tip: 'Full extension at contact — racket tip pointing up' },
      { key: 'pronation',    label: 'Pronation',         tip: 'Forearm pronates through contact — inside-out motion' },
    ],
    geminiPrompt: `You are analysing a tennis serve. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "toss_pos":    { "score": <0-10>, "observation": "<one sentence>" },
    "trophy_pos":  { "score": <0-10>, "observation": "<one sentence>" },
    "contact_hgt": { "score": <0-10>, "observation": "<one sentence>" },
    "pronation":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Serve',
    reelSlot: 'technical',
    coachNote: 'Film from the side and slightly behind the server. 5+ serves minimum.',
    ncaaRelevance: 'Serve mechanics are the first evaluation point at every US college tennis tryout.',
  },
  {
    id: 'tn_forehand',
    name: 'Forehand — Unit Turn and Follow-Through',
    sport: 'tennis',
    emoji: '💥',
    positions: ['All Positions'],
    description: 'Forehand groundstroke: split step through unit turn, swing path, contact point and follow-through.',
    coachingFocus: 'Split step timing, unit turn, swing low-to-high, topspin brushing, finish position.',
    whatToRecord: 'Side or diagonal view showing full swing. Film 8+ groundstrokes from a consistent feed.',
    duration: '45 sec',
    equipment: ['racket', 'balls', 'partner or wall'],
    difficulty: 'intermediate',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'split_step',   label: 'Split Step',       tip: 'Split step lands as opponent contacts ball' },
      { key: 'unit_turn',    label: 'Unit Turn',        tip: 'Shoulder and hip turn together — early preparation' },
      { key: 'swing_path',   label: 'Swing Path',       tip: 'Racket rises from low to high through contact' },
      { key: 'finish',       label: 'Follow-Through',   tip: 'Racket finishes over non-dominant shoulder' },
    ],
    geminiPrompt: `You are analysing a tennis forehand groundstroke. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "split_step": { "score": <0-10>, "observation": "<one sentence>" },
    "unit_turn":  { "score": <0-10>, "observation": "<one sentence>" },
    "swing_path": { "score": <0-10>, "observation": "<one sentence>" },
    "finish":     { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Forehand',
    reelSlot: 'technical',
    coachNote: 'Feed balls to the same spot for consistency. Film from the side.',
    ncaaRelevance: 'Forehand consistency under rally pressure is the primary groundstroke metric in US college tennis recruiting.',
  },
  {
    id: 'tn_net_approach',
    name: 'Net Approach — Transition and Volley',
    sport: 'tennis',
    emoji: '🥅',
    positions: ['All Positions'],
    description: 'Player hits an approach shot and moves to the net, executing a volley under time pressure.',
    coachingFocus: 'Approach shot depth, transition footwork, split step at net, volley technique.',
    whatToRecord: 'Side or overhead view showing baseline approach through volley. Include opponent side for context.',
    duration: '30 sec',
    equipment: ['racket', 'balls', 'partner'],
    difficulty: 'advanced',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'approach_dep', label: 'Approach Depth',   tip: 'Approach shot lands deep — forces defender back' },
      { key: 'transition',   label: 'Transition Speed', tip: 'Moves forward immediately after approach contact' },
      { key: 'net_split',    label: 'Net Split Step',   tip: 'Split step as opponent contacts the ball' },
      { key: 'volley_tech',  label: 'Volley Technique', tip: 'Compact punch volley — no backswing' },
    ],
    geminiPrompt: `You are analysing a tennis net approach and volley. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "approach_dep": { "score": <0-10>, "observation": "<one sentence>" },
    "transition":   { "score": <0-10>, "observation": "<one sentence>" },
    "net_split":    { "score": <0-10>, "observation": "<one sentence>" },
    "volley_tech":  { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Net Approach',
    reelSlot: 'decision',
    coachNote: 'Use a partner feeding from baseline. Film from the side at mid-court height.',
    ncaaRelevance: 'Net transition is a key differentiator between D1 and D2 college tennis players.',
  },
];

// ── CRICKET SCHOLARSHIP DRILLS ────────────────────────────────────────────────

export const CRICKET_SCHOLARSHIP_DRILLS: UniversalDrill[] = [
  {
    id: 'cr_batting_drive',
    name: 'Batting — Straight Drive',
    sport: 'cricket',
    emoji: '🏏',
    positions: ['Batsman', 'Opening Bat', 'Middle Order'],
    description: 'Straight drive off a good-length delivery — assessing footwork, head position and bat swing.',
    coachingFocus: 'Head over ball, front foot to pitch of ball, straight bat face, follow-through.',
    whatToRecord: 'Side or front-on view of the batsman. Film 5+ drives from a net or cone marker.',
    duration: '60 sec',
    equipment: ['bat', 'ball or throwdown', 'stumps or marker'],
    difficulty: 'intermediate',
    grsDomain: 'ballMastery',
    dimensions: [
      { key: 'head_pos',     label: 'Head Position',    tip: 'Head still and over the ball at impact' },
      { key: 'front_foot',   label: 'Front Foot',       tip: 'Front foot reaches pitch of ball before impact' },
      { key: 'bat_face',     label: 'Bat Face',         tip: 'Bat face square at impact — no open or closed face' },
      { key: 'follow_thru',  label: 'Follow-Through',   tip: 'High follow-through toward mid-on' },
    ],
    geminiPrompt: `You are analysing a cricket straight drive. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "head_pos":    { "score": <0-10>, "observation": "<one sentence>" },
    "front_foot":  { "score": <0-10>, "observation": "<one sentence>" },
    "bat_face":    { "score": <0-10>, "observation": "<one sentence>" },
    "follow_thru": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Batting Drive',
    reelSlot: 'technical',
    coachNote: 'Film from the side (off side). Use throwdowns for consistency.',
    ncaaRelevance: 'Batting technique is assessed at ICC-affiliated scholarship programmes and WI scholarship trials.',
  },
  {
    id: 'cr_fast_bowling',
    name: 'Fast Bowling — Run-Up and Delivery',
    sport: 'cricket',
    emoji: '⚡',
    positions: ['Fast Bowler', 'Medium Pace', 'All-Rounder'],
    description: 'Full bowling action: run-up, jump, load-up, delivery stride and follow-through.',
    coachingFocus: 'Gather jump, front arm pull, hip and shoulder alignment, delivery stride length.',
    whatToRecord: 'Side view showing full run-up and delivery. Film 5+ deliveries from the same position.',
    duration: '90 sec',
    equipment: ['ball', 'stumps or target on wall'],
    difficulty: 'intermediate',
    grsDomain: 'linearSpeed',
    dimensions: [
      { key: 'gather',       label: 'Gather/Jump',      tip: 'Smooth jump into loading position — no stuttering' },
      { key: 'front_arm',    label: 'Front Arm',        tip: 'Front arm pulls down powerfully at delivery stride' },
      { key: 'hip_align',    label: 'Hip Alignment',    tip: 'Hips rotate from sideways to fully open at release' },
      { key: 'follow_thru',  label: 'Follow-Through',   tip: 'Full follow-through — arm continues past opposite hip' },
    ],
    geminiPrompt: `You are analysing a cricket fast bowling action. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "gather":      { "score": <0-10>, "observation": "<one sentence>" },
    "front_arm":   { "score": <0-10>, "observation": "<one sentence>" },
    "hip_align":   { "score": <0-10>, "observation": "<one sentence>" },
    "follow_thru": { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Fast Bowling',
    reelSlot: 'technical',
    coachNote: 'Film from the off side (facing the bowler). 5+ deliveries minimum.',
    ncaaRelevance: 'Bowling mechanics are assessed at all ICC development and scholarship pathways.',
  },
  {
    id: 'cr_fielding',
    name: 'Fielding — Ground Ball and Throw',
    sport: 'cricket',
    emoji: '🤸',
    positions: ['All Positions'],
    description: 'Player fields a ground ball in the ring and delivers a fast, flat throw to the stumps.',
    coachingFocus: 'Low body position for pickup, side-on throwing action, accuracy and arm speed.',
    whatToRecord: 'Side or diagonal view showing pickup and throw. Film 5+ fielding reps.',
    duration: '60 sec',
    equipment: ['ball', 'stumps or target'],
    difficulty: 'beginner',
    grsDomain: 'cognitiveSpeed',
    dimensions: [
      { key: 'low_pickup',   label: 'Low Pickup',       tip: 'Gets low — knees bent, eyes on ball through pickup' },
      { key: 'side_on',      label: 'Side-On Throw',    tip: 'Shoulders sideways to target before release' },
      { key: 'arm_speed',    label: 'Arm Speed',        tip: 'Fast arm action — full extension before release' },
      { key: 'accuracy',     label: 'Accuracy',          tip: 'Ball hits or is near the stumps on flat trajectory' },
    ],
    geminiPrompt: `You are analysing cricket fielding — ground ball and throw. Watch all frames and return ONLY valid JSON:
{
  "scores": {
    "low_pickup": { "score": <0-10>, "observation": "<one sentence>" },
    "side_on":    { "score": <0-10>, "observation": "<one sentence>" },
    "arm_speed":  { "score": <0-10>, "observation": "<one sentence>" },
    "accuracy":   { "score": <0-10>, "observation": "<one sentence>" }
  },
  "overall_score": <0-10>,
  "top_strength": "<one sentence>",
  "key_improvement": "<one specific actionable fix>",
  "coach_note": "<2 sentences>",
  "data_confidence": "<high|medium|low>"
}`,
    passportLabel: 'Fielding',
    reelSlot: 'physical',
    coachNote: 'Set stumps 20m away. Film from the side showing full pickup and throw.',
    ncaaRelevance: 'Fielding athleticism is increasingly weighted in ICC T20 scholarship assessments.',
  },
];

// ── SPORT DRILLS MAP ──────────────────────────────────────────────────────────

export const SPORT_DRILLS_MAP: Record<string, UniversalDrill[]> = {
  football:   [...FOOTBALL_SCHOLARSHIP_DRILLS,   ...UNIVERSAL_ATHLETIC_DRILLS],
  rugby:      [...RUGBY_SCHOLARSHIP_DRILLS,      ...UNIVERSAL_ATHLETIC_DRILLS],
  athletics:  [...ATHLETICS_SCHOLARSHIP_DRILLS,  ...UNIVERSAL_ATHLETIC_DRILLS],
  netball:    [...NETBALL_SCHOLARSHIP_DRILLS,    ...UNIVERSAL_ATHLETIC_DRILLS],
  basketball: [...BASKETBALL_SCHOLARSHIP_DRILLS, ...UNIVERSAL_ATHLETIC_DRILLS],
  swimming:   [...SWIMMING_SCHOLARSHIP_DRILLS,   ...UNIVERSAL_ATHLETIC_DRILLS],
  tennis:     [...TENNIS_SCHOLARSHIP_DRILLS,     ...UNIVERSAL_ATHLETIC_DRILLS],
  cricket:    [...CRICKET_SCHOLARSHIP_DRILLS,    ...UNIVERSAL_ATHLETIC_DRILLS],
  volleyball: UNIVERSAL_ATHLETIC_DRILLS,
  hockey:     UNIVERSAL_ATHLETIC_DRILLS,
};

export function getDrillsForSport(sport: string): UniversalDrill[] {
  return SPORT_DRILLS_MAP[sport.toLowerCase()] ?? UNIVERSAL_ATHLETIC_DRILLS;
}

export function getDrillsBySlot(sport: string, slot: ReelSlot): UniversalDrill[] {
  return getDrillsForSport(sport).filter(d => d.reelSlot === slot);
}

// ── ALL DRILLS (legacy + scholarship) ────────────────────────────────────────

export const ALL_GEMINI_DRILLS: GeminiDrill[] = [
  ...FOOTBALL_DRILLS,
  ...FOOTBALL_SCHOLARSHIP_DRILLS,
  ...RUGBY_SCHOLARSHIP_DRILLS,
  ...ATHLETICS_SCHOLARSHIP_DRILLS,
  ...NETBALL_SCHOLARSHIP_DRILLS,
  ...BASKETBALL_SCHOLARSHIP_DRILLS,
  ...SWIMMING_SCHOLARSHIP_DRILLS,
  ...TENNIS_SCHOLARSHIP_DRILLS,
  ...CRICKET_SCHOLARSHIP_DRILLS,
  ...UNIVERSAL_ATHLETIC_DRILLS,
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
