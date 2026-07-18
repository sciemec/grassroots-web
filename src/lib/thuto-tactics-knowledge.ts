// src/lib/thuto-tactics-knowledge.ts
// ─────────────────────────────────────────────────────────────────────────────
// THUTO AI Football Tactics Knowledge Base
// Injected into THUTO's system prompt when a coach or player asks a tactical
// question. Sourced from: FA England Football Learning, Wikipedia Football
// Tactics and Formations, Association Football Positions.
// ─────────────────────────────────────────────────────────────────────────────

export const THUTO_TACTICS_KNOWLEDGE = `
## FOOTBALL TACTICS KNOWLEDGE

### What Are Tactics, Strategies and Systems?
- TACTICS: specific actions and decisions individuals or units make in certain situations (e.g. force play wide then press in tight areas)
- STRATEGY: the general plan to beat opponents, considering strengths and weaknesses of both teams (e.g. win the ball high up the pitch)
- SYSTEM / FORMATION: where players are positioned on the pitch (e.g. 4-3-3)

### General Principles of Play

**Width in Attack**
The attacking team divides the defence by spreading play across a broad front rather than forcing narrow channels. Wingers create gaps between defenders. Those gaps feed the ball to strikers.

**Width in Defence**
The defending team contracts and denies width, shepherding attackers into narrower, more crowded spaces.

**Depth in Attack**
The attacking team uses the full length of the pitch — moving players up from the rear or down from the top. A "target striker" maintains presence deep in the defence.

**Depth in Defence**
Defenders mark supporting players and hold a man back as cover (sweeper/libero role). The ball carrier finds no open passing options.

**Balance in Defence**
Defenders cover space evenly. They do not cluster on one side just because the ball is there.

---

### Attacking Tactics

**Pass and Move**
Player passes then immediately moves into a new position. Creates forward motion through spaces where defenders are not.

**Give and Go (One-Two / Wall Pass)**
Player passes to a teammate then makes a run. Teammate immediately returns the ball into the space the first player has run into. Most effective for beating the first line of defence.

**Through Ball (Slide-Rule Pass)**
Pass into space behind the defensive line while attacking players run onto it from onside positions. Works best with fast forwards against a high defensive line.

**Long Through Ball**
Deep aerial pass over defenders' heads into space for forwards to chase. Requires strong, fast forwards with good ball control.

**Counter-Attack**
Fast-paced attack immediately after winning the ball back. Requires players with split-vision, speed and quick thinking. Forwards position in open spaces near the penalty box.

**Switching Sides**
Cross-field pass to a player on the far side to relieve pressure and open new spaces. Forces defenders to reorganise, creating gaps.

**Triangular Play**
Ball passed between three players forming a triangle. Triangle is shifted forward incrementally. Maintains possession while advancing. Common in midfield and in the final third.

**Target Man**
Quality striker who occupies two defenders, making the defence vulnerable. Combined with fast wingers creates problems for four-man defences.

**Cross Into the Box**
Wide player crosses from the flank into the penalty area for a striker to attack with a header, volley or first-time shot.

**Strong Side Overloads**
Attackers pressure one side of the pitch, then quickly switch the ball to an unmarked player on the far side for a free shot or dribble.

---

### Defensive Tactics

**Zone Defence**
Defenders cover specific areas of the pitch and move in synchronicity with teammates. A straight defensive line can also enforce the offside trap.

**Man-to-Man Defence**
One defender follows one opponent wherever they go. Good for neutralising star players. Risk: defenders can be drawn out of position, creating space.

**Sweeper (Libero)**
A central defender positioned slightly behind the defensive line who "sweeps up" any attacks that break through. Rare in modern football.

**First Defender**
The player closest to the ball carrier. Pressures the opponent, guides them toward a safer area, delays the attack and signals teammates whether to press high or drop deep.

**Second Defender**
Provides immediate support for the first defender. Takes over if the first defender is beaten. Typical distance: 6 metres from the first defender (varies with opponent's speed).

**Third Defender**
Provides deeper cover. Has the best view of the defence and communicates threats to teammates. Covers gaps if first and second defenders are beaten.

**Gegenpressing (Counter-Pressing)**
Attackers and midfielders immediately press the opposition after losing possession. High physical demand. Developed by Ralf Rangnick, popularised by Jürgen Klopp.

**High Block / Low Block / Medium Block**
- HIGH BLOCK: defend most of the pitch — press the opposition high up
- MEDIUM BLOCK: defend the first two-thirds
- LOW BLOCK: defend own half only — conserve energy, compress space

**Defensive Line Height**
- SHORT LINE DEPTH (~16m between defensive and midfield lines): for defensive teams
- Deeper line = more cover but more space for opposition in behind
- Higher line = offside trap possible but vulnerable to through balls

---

### Formations

**4-3-3**
Four defenders, three midfielders, three forwards. Strong midfield. Forwards spread wide. Full-backs provide defensive cover on flanks. Used by: Barcelona (Guardiola), Liverpool (Klopp), Manchester City.

**4-4-2**
Four defenders, four midfielders, two forwards. One central midfielder holds, one advances. Wide midfielders must track back. Was the dominant formation of the 1990s. Still used effectively by Atlético Madrid.

**4-2-3-1**
Double pivot (two holding midfielders) protects the back four. Three attacking midfielders support one striker. Flexible — can become 4-4-1-1 or 4-5-1 in defence. Very common at international level.

**4-3-2-1 (Christmas Tree)**
Three central midfielders, two attacking midfielders behind one striker. Narrow — relies on full-backs for width. Used by Carlo Ancelotti at AC Milan.

**4-2-2-2 (Magic Rectangle)**
Two holding midfielders, two support strikers/attacking midfielders, two strikers. Full-backs must provide width. Very attacking. Used by France (1982 World Cup), Brazil.

**3-5-2**
Three centre-backs, two wing-backs (attack and defend the full flank), three central midfielders, two strikers. Wing-backs are crucial. Used by Argentina (1986 World Cup), Antonio Conte's teams.

**5-3-2**
Five defenders (three centre-backs plus two wing-backs who are more defensive), three central midfielders, two strikers. Defensive solidity with width from wing-backs.

**4-5-1**
Conservative — five midfielders, one striker. Packs midfield. Useful for holding a lead or grinding out a result.

**3-4-3**
Three defenders, four midfielders, three forwards. Attacking — requires disciplined midfielders to cover wide areas. Used by Chelsea under Conte (2016-17 Premier League title).

---

### Positions

**Goalkeeper (GK)**
Only player allowed to handle the ball (in own penalty area). Must command the area, organise the defence, command set pieces, and increasingly act as a sweeper-keeper (coming off the line to clear through balls).

**Centre-Back (CB)**
Blocks opponents from scoring, clears the ball from the defensive area. Usually tall, strong, good in the air. Two play in front of the goalkeeper. Must read the game and make last-ditch tackles.

**Full-Back (RB / LB)**
Defenders at each side of the centre-backs. Must deal with opposition wingers. In modern football increasingly attacks down the flank (wing-back role).

**Wing-Back (RWB / LWB)**
Full-back with more attacking emphasis. Works the full length of the flank — supports both attack and defence. Most physically demanding outfield position.

**Defensive Midfielder (DM)**
Screens the defence by winning the ball and directing play. Covers full-backs and centre-backs when they advance. Must have stamina, positioning, tackling ability and good passing. Covers up to 12km per game.

**Central Midfielder (CM)**
Links defence and attack. Good vision, stamina, and both long and short passing. Often described as the "engine room." Whichever team dominates central midfield tends to dominate the game.

**Attacking Midfielder (AM / No.10)**
Positioned between midfield and forwards. Creates goal-scoring chances with vision, dribbling and passing. "Playing in the hole." Also called trequartista or enganche.

**Wide Midfielder / Winger (LM / RM / LW / RW)**
Attacks down the flank. Uses pace to beat full-backs, then delivers crosses. Modern wingers often play on the "wrong" flank to cut inside onto their stronger foot (inverted winger).

**Centre-Forward / Striker (ST / No.9)**
Primary goal-scorer. Can be a target man (tall, wins headers, holds ball up) or a pacey forward (runs in behind). Sometimes plays as a false nine (drops deep to create space).

**Second Striker (SS)**
Supports the centre-forward. More creative — plays "in the hole." Also called shadow striker, deep-lying forward, or trequartista.

---

### Coaching: Working With Players

**Matching Tactics to Players**
Never impose tactics the players cannot execute. Discover player strengths first, then choose tactics that maximise those strengths. A winger who is great in 1v1s needs tactics that give them space to attack.

**Consistency Over Complexity**
Do not change tactics every week. Players need time to understand their roles. Work on a system for a period of time before making changes.

**Age-Appropriate Communication**
- U5-U11: Keep it simple. Use language they understand. "Hunt in packs" is better than "press high."
- U12-U15: Begin position-specific instruction. Link roles to responsibilities.
- U16+: Detailed tactical information. Video analysis. Opposition scouting.

**Training Design (The Three Rs)**
- REPETITION: enough reps to learn the movement pattern
- RELEVANCE: practices must relate to match situations
- REALISM: numbers and space should reflect the real game

**Matchday**
- Warm-up should mirror the tactical approach you will use in the game
- Give players 1-2 clear objectives — not ten instructions
- At half-time: ask players how they think it is going before telling them
- Focus on 2-3 specific observations — not everything

---

### Key Teaching Points for Zimbabwe Context

**Pressing Without the Ball**
Teach players to win the ball within 5 seconds of losing it. If they cannot, fall back into shape.

**Width in Attack**
Zimbabwe's natural tendency is to play narrow. Teach wingers to hold their width and stretch the defence before combining centrally.

**Defensive Line Discipline**
Most grassroots players do not hold a defensive line. Teach the back four to move as a unit — step up together, drop together.

**Second Phase from Set Pieces**
Most goals at grassroots level come from set pieces. Teach players where to position for second balls from corners and free-kicks.

**Using the Full-Back in Attack**
Teach full-backs to overlap the winger when safe to do so. This creates 2v1 situations on the flank.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Formation data for the tactics board and learning module
// ─────────────────────────────────────────────────────────────────────────────

export interface FormationDetail {
  name:        string;
  code:        string;
  era:         string;
  style:       "attacking" | "defensive" | "balanced" | "possession";
  strengths:   string[];
  weaknesses:  string[];
  bestFor:     string;
  famousUse:   string;
  coachingTip: string;
  positions:   { label: string; role: string; responsibility: string }[];
}

export const FORMATION_LIBRARY: FormationDetail[] = [
  {
    name: "4-3-3",
    code: "4-3-3",
    era:  "1960s — Present",
    style: "attacking",
    strengths: [
      "Strong midfield trio controls the game",
      "Three forwards stretch the defence across the width",
      "Pressing high is natural with the front three",
      "Full-backs can overlap wide forwards for extra width",
    ],
    weaknesses: [
      "Vulnerable on the counter-attack if midfield does not track back",
      "Wide forwards must track back to help full-backs",
      "Only two central midfielders if one is a holder — can be outnumbered",
    ],
    bestFor: "Teams with a strong pressing style and technically good full-backs who can attack.",
    famousUse: "Barcelona (Guardiola 2008-12), Liverpool (Klopp 2015-24), Brazil 1962 World Cup",
    coachingTip: "Set your wingers a simple rule: when we have the ball, stay wide and stretch the defence. When we lose it, press the nearest defender immediately. The 4-3-3 presses from the front or it does not work.",
    positions: [
      { label:"GK",  role:"Goalkeeper",          responsibility:"Sweeper-keeper — comes off line to clear through balls. Organises the back four." },
      { label:"RB",  role:"Right Back",           responsibility:"Overlaps the right winger when safe. Tracks opposition left winger on transitions." },
      { label:"CB",  role:"Centre Back (Right)",  responsibility:"Holds defensive line. Steps to win first ball. Communicates with partner." },
      { label:"CB",  role:"Centre Back (Left)",   responsibility:"Covers space in behind. Last line before GK. Plays out from the back." },
      { label:"LB",  role:"Left Back",            responsibility:"Overlaps the left winger. Blocks opposition right winger when defending." },
      { label:"CM",  role:"Defensive Midfielder", responsibility:"Screens the back four. Wins second balls. Distributes simply to attackers." },
      { label:"CM",  role:"Box-to-Box Midfielder",responsibility:"Links defence and attack. Arrives late into the box. Covers ground both ways." },
      { label:"CM",  role:"Advanced Midfielder",  responsibility:"Creates for forwards. Takes set pieces. Can arrive into the box as a 4th attacker." },
      { label:"RW",  role:"Right Winger",         responsibility:"Stays wide to stretch defence. Delivers crosses. Tracks back to help right back." },
      { label:"ST",  role:"Striker",              responsibility:"Focal point of the attack. Holds the ball up. Finishes chances. Leads the press." },
      { label:"LW",  role:"Left Winger",          responsibility:"Inverted winger — cuts inside onto right foot to shoot. Or stays wide and crosses." },
    ],
  },
  {
    name: "4-4-2",
    code: "4-4-2",
    era:  "1970s — Present",
    style: "balanced",
    strengths: [
      "Two strikers always threaten — forces two centre-backs to stay deep",
      "Two banks of four — very difficult to play through",
      "Wide midfielders provide both width and defensive cover",
      "Simple for players to understand their zones",
    ],
    weaknesses: [
      "Can be outnumbered in central midfield against 3-man midfields",
      "Wide midfielders must cover enormous distances",
      "Less creativity than a 4-3-3 or 4-2-3-1",
    ],
    bestFor: "Teams that work hard, are well organised, and want to be difficult to beat. Strong at set pieces.",
    famousUse: "AC Milan (Sacchi 1988-92), Atlético Madrid (Simeone), Leicester City (Ranieri 2016)",
    coachingTip: "The 4-4-2 wins games through shape and discipline, not individual brilliance. Drill your players to hold a compact block of two lines of four. Twelve metres between the lines maximum. Any more and the opposition plays through you.",
    positions: [
      { label:"GK",  role:"Goalkeeper",          responsibility:"Commands the box. Organises the two defensive lines. Quick distribution to restart attacks." },
      { label:"RB",  role:"Right Back",           responsibility:"Tight defensive role. Only overlaps when the right midfielder tucks in. Marks opposition winger." },
      { label:"CB",  role:"Centre Back (Right)",  responsibility:"Marks the striker tightly. Wins first balls. Steps to tackle when confident." },
      { label:"CB",  role:"Centre Back (Left)",   responsibility:"Covers partner. Sweeps behind the defensive line. Heads away crosses." },
      { label:"LB",  role:"Left Back",            responsibility:"Mirrors right back. Defensive first. Occasional overlap when team is dominant." },
      { label:"RM",  role:"Right Midfielder",     responsibility:"Tracks up and down the right flank. Delivers crosses when attacking. Tracks back to make a flat line of four when defending." },
      { label:"CM",  role:"Central Midfielder",   responsibility:"Breaks up play. Simple distribution. Wins second balls from set pieces." },
      { label:"CM",  role:"Central Midfielder",   responsibility:"More creative partner. Plays forward passes. Links midfield and strikers." },
      { label:"LM",  role:"Left Midfielder",      responsibility:"Mirrors right midfielder. Provides left-side width. Defensive cover for left back." },
      { label:"ST",  role:"Striker (Right)",      responsibility:"Mobile — makes runs in behind and drops to link play. Leads the press from the front." },
      { label:"ST",  role:"Striker (Left)",       responsibility:"Target man — holds the ball up, brings partners into play. Wins aerial duels." },
    ],
  },
  {
    name: "4-2-3-1",
    code: "4-2-3-1",
    era:  "2000s — Present",
    style: "possession",
    strengths: [
      "Double pivot (two DMs) screens the back four very effectively",
      "Highly flexible — becomes 4-4-1-1 in defence, 4-3-3 in attack",
      "Number 10 has freedom to create between the lines",
      "Full-backs can attack because the double pivot covers",
    ],
    weaknesses: [
      "Lone striker can become isolated if number 10 drops too deep",
      "Wide attackers must track back to make a midfield five when defending",
      "Requires a specialist number 10 — rare in Zimbabwe grassroots football",
    ],
    bestFor: "Technical teams with a creative number 10 and energetic wide players.",
    famousUse: "Germany (2006-10 World Cup), France, Spain. Liverpool under Benitez.",
    coachingTip: "The 4-2-3-1 lives or dies by the two holding midfielders. They must stay central and never both go forward at the same time. If one goes, the other stays. Teach this rule before anything else.",
    positions: [
      { label:"GK",  role:"Goalkeeper",            responsibility:"Distribute quickly to the double pivot to start attacks from the back." },
      { label:"RB",  role:"Right Back",             responsibility:"Attacks with freedom when the double pivot is set. Overlaps the right winger." },
      { label:"CB",  role:"Centre Back (Right)",    responsibility:"Zonal defending. Steps to engage when striker comes short." },
      { label:"CB",  role:"Centre Back (Left)",     responsibility:"Covers space in behind. Commands the defensive line." },
      { label:"LB",  role:"Left Back",              responsibility:"Attacks down the left. Double pivot covers the space left behind." },
      { label:"DM",  role:"Defensive Midfielder 1", responsibility:"One half of the double pivot. Breaks up attacks. Never both advance at once." },
      { label:"DM",  role:"Defensive Midfielder 2", responsibility:"Second holder. Covers when partner steps out. Deep-lying passer to switch play." },
      { label:"RM",  role:"Right Attacking Mid",    responsibility:"Stays wide initially. Cuts inside when full-back overlaps. Threatens goal." },
      { label:"AM",  role:"Number 10 (Playmaker)",  responsibility:"Plays between the lines. Creates for the striker. Arrives late in the box." },
      { label:"LM",  role:"Left Attacking Mid",     responsibility:"Mirrors right side. Inverted or wide — depends on squad strengths." },
      { label:"ST",  role:"Striker",                responsibility:"Holds the ball up for the number 10. Finishes chances. Leads the press." },
    ],
  },
  {
    name: "3-5-2",
    code: "3-5-2",
    era:  "1980s — Present",
    style: "balanced",
    strengths: [
      "Three centre-backs give defensive solidity",
      "Wing-backs provide width in attack and defence",
      "Five in midfield can dominate possession",
      "Two strikers always threaten",
    ],
    weaknesses: [
      "Wing-backs must have elite stamina — they run the full length of the pitch",
      "Vulnerable to teams with fast wide forwards who can exploit the wide spaces",
      "Requires disciplined central midfielders to cover when wing-backs push forward",
    ],
    bestFor: "Teams with athletic wing-backs and a strong midfield trio. Good for playing out from the back.",
    famousUse: "Argentina 1986 World Cup (Bilardo), Chelsea (Conte 2016-17), Inter Milan (Inzaghi)",
    coachingTip: "The wing-backs in a 3-5-2 must understand when to push forward and when to drop back. The simple rule: when the ball is in the central third, hold wide in a line of five. When the ball moves wide to our side, push forward and create the overload. When we lose it, sprint back to make a line of five immediately.",
    positions: [
      { label:"GK",  role:"Goalkeeper",        responsibility:"Commands the box. Distributes to the wide centre-backs to start attacks." },
      { label:"CB",  role:"Right Centre-Back",  responsibility:"Can step forward to win first balls. Covers the right wing-back's space." },
      { label:"CB",  role:"Central Centre-Back",responsibility:"Defensive leader. Organises the three-man line. Heads away crosses." },
      { label:"CB",  role:"Left Centre-Back",   responsibility:"Mirrors right centre-back. Covers left wing-back. Good on the ball." },
      { label:"RWB", role:"Right Wing-Back",    responsibility:"The key attacker on the right. Delivers crosses. Must sprint back to defend." },
      { label:"CM",  role:"Right Midfielder",   responsibility:"Ball-winner. Covers the space when right wing-back attacks." },
      { label:"CM",  role:"Central Midfielder", responsibility:"Controls the game. Distributes to wing-backs and strikers. Dictates tempo." },
      { label:"CM",  role:"Left Midfielder",    responsibility:"Mirrors right midfielder. Covers left wing-back." },
      { label:"LWB", role:"Left Wing-Back",     responsibility:"Mirrors right wing-back. Attacks the left channel. Delivers crosses." },
      { label:"ST",  role:"Striker (Right)",    responsibility:"Mobile — makes runs in behind. Links play. Takes on defensive headers." },
      { label:"ST",  role:"Striker (Left)",     responsibility:"Target man or second runner. Creates space for partner. Finishes at goal." },
    ],
  },
  {
    name: "5-3-2",
    code: "5-3-2",
    era:  "1960s — Present",
    style: "defensive",
    strengths: [
      "Five defenders make it very difficult to score — effective low block",
      "Three midfielders can control possession when the team has the ball",
      "Two strikers can threaten on the counter-attack",
      "Wing-backs sit deeper than in 3-5-2 — more defensive cover",
    ],
    weaknesses: [
      "Narrow — relies on wing-backs staying disciplined rather than attacking",
      "Three midfielders can be outnumbered by a four-man midfield",
      "Counter-attacking focus means less possession overall",
    ],
    bestFor: "Teams that want defensive security and to win on the counter-attack. Good for away games against stronger opponents.",
    famousUse: "Inter Milan (Herrera 1960s), Brazil 2002 World Cup (with Cafu and Roberto Carlos as wing-backs)",
    coachingTip: "The key difference between 3-5-2 and 5-3-2 is what the wing-backs do. In 5-3-2, they defend first. They only push forward when it is safe — when the midfield trio is set and the two strikers are ready to counter. Discipline is everything in this system.",
    positions: [
      { label:"GK",  role:"Goalkeeper",          responsibility:"Last line. Organises the five defenders. Clear communication on when to step out." },
      { label:"RWB", role:"Right Wing-Back",      responsibility:"Defensive priority. Sits in a line of five. Only attacks when it is safe." },
      { label:"CB",  role:"Centre-Back (Right)",  responsibility:"Compact defensive line. Does not step too early. Covers wing-back's space." },
      { label:"CB",  role:"Centre-Back (Centre)", responsibility:"Organises the defensive line. Commands headers and clearances." },
      { label:"CB",  role:"Centre-Back (Left)",   responsibility:"Mirrors right centre-back. Covers left wing-back." },
      { label:"LWB", role:"Left Wing-Back",       responsibility:"Mirrors right wing-back. Defensive first. Occasional overlap when safe." },
      { label:"CM",  role:"Right Midfielder",     responsibility:"Connects to right wing-back and right striker. Covers transitions." },
      { label:"CM",  role:"Central Midfielder",   responsibility:"Controls tempo. Distributes to strikers. Defensive screen for the five." },
      { label:"CM",  role:"Left Midfielder",      responsibility:"Mirrors right midfielder." },
      { label:"ST",  role:"Striker (Right)",      responsibility:"Holds the ball up on the counter. Links play. Makes runs in behind." },
      { label:"ST",  role:"Striker (Left)",       responsibility:"Quick — the threat on the break. Makes diagonal runs to receive counter passes." },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Tactical principles for the learning module
// ─────────────────────────────────────────────────────────────────────────────

export interface TacticalPrinciple {
  id:          string;
  title:       string;
  category:    "attack" | "defence" | "transition" | "set_piece";
  summary:     string;
  detail:      string;
  zimbabweApplication: string;
  drill:       string;
  keyPoints:   string[];
}

export const TACTICAL_PRINCIPLES: TacticalPrinciple[] = [
  {
    id: "width-attack",
    title: "Width in Attack",
    category: "attack",
    summary: "Spread the play across the full width of the pitch to stretch the defence and create gaps.",
    detail: "Width forces the opposition to cover more ground. When wingers stay wide, they pin the opposition full-backs out of the game. The central striker and attacking midfielder then have more space to operate. Without width, even the best central players will be smothered by a compact defence.",
    zimbabweApplication: "In Zimbabwe grassroots football, most teams naturally narrow up and play through the middle. Wide players drift inside and leave the flanks empty. Coach your wingers to hold their width — stay near the touchline until the ball arrives. This single instruction will open more space than any complex tactical plan.",
    drill: "Set up a pitch 40m wide. Play 7v7. Any goal scored from a cross from the wide channel counts double. This rewards width immediately and teaches players to use the full pitch.",
    keyPoints: [
      "Wingers must hold their width — touching the touchline if necessary",
      "Width pins the opposition full-backs in their own half",
      "Width creates the gaps the striker and number 10 exploit centrally",
      "Full-backs can overlap to create 2v1s when the winger holds wide",
    ],
  },
  {
    id: "pass-and-move",
    title: "Pass and Move",
    category: "attack",
    summary: "After passing the ball, immediately move into a new position. Never stand still.",
    detail: "The most fundamental attacking principle. A player who passes and then stops has removed themselves from the game. A player who passes and moves into a new position gives the teammate with the ball another option and creates a forward momentum that defenders cannot easily track. Many goals at all levels of football begin with a simple pass-and-move combination.",
    zimbabweApplication: "A common fault in Zimbabwe youth football is a player passing the ball and then watching what happens. Drill your players to treat the pass as a trigger — the moment the ball leaves the foot, the body must move. Use a simple rule in training: after you pass, you must touch a different area of the pitch before you can receive again.",
    drill: "Rondo (4v1 or 5v2 in a circle). Players must move to a new position after each pass. Anyone who stands still after passing is penalised (they become the defender). Encourages constant movement off the ball.",
    keyPoints: [
      "Pass, then immediately move into a new position",
      "Movement off the ball creates new passing angles for the receiver",
      "Pass and move is the foundation of all good combination play",
      "Teams that stand still after passing give the opposition time to defend",
    ],
  },
  {
    id: "counter-attack",
    title: "Counter-Attack",
    category: "transition",
    summary: "Win the ball back and attack immediately — before the opposition can get back into shape.",
    detail: "The counter-attack is one of the most effective tactics in football because it exploits the moment when the opposition is most out of shape — when they have committed players forward to attack. The moment possession is regained, the ball must move quickly and directly toward the opposition goal. Every second spent in possession after winning the ball gives the opposition more time to recover their defensive shape.",
    zimbabweApplication: "Zimbabwe grassroots teams often have fast forwards who do not play for technically strong clubs. The counter-attack is a great leveller — a well-drilled counter can beat a technically superior team. Teach your forwards to read when possession will be won (interceptions, tackles in midfield) and to start their run immediately rather than waiting for the ball.",
    drill: "Set up 6v6. One team attacks, the other defends. When the defending team wins the ball, they have 5 seconds to get a shot on goal. Count out loud: 1, 2, 3, 4, 5. Any shot in 5 seconds counts double. Teaches rapid transition from defence to attack.",
    keyPoints: [
      "Win the ball, then move it forward immediately — do not consolidate",
      "Forwards must read when the ball is about to be won and start their run early",
      "The first pass of a counter must go forward — not sideways",
      "Speed of transition is more important than technical perfection on the counter",
    ],
  },
  {
    id: "defensive-block",
    title: "Defensive Block — Staying Compact",
    category: "defence",
    summary: "All 10 outfield players defend as a compact unit, closing the spaces between the lines.",
    detail: "A defensive block is organised when your team does not have the ball and wants to be difficult to break down. The two lines of four (or five and three, or five and four) must stay close together — no more than 12-16 metres between the defensive and midfield lines. If the gap between the lines is too large, the opposition plays through it easily. If the lines are compact, even technically superior teams will struggle to find a way through.",
    zimbabweApplication: "Most grassroots teams in Zimbabwe defend too narrow — all 10 players collapse into the centre. Teach your defensive block to also hold its WIDTH. Defenders should be no more than 4 metres apart across the pitch. A block that is both compact (vertically) and wide (horizontally) forces the opposition to go backwards or play long.",
    drill: "Set up 9v9 on a small pitch (35x25m). The defending team must stay in two lines of four plus a goalkeeper. Award a point to the defending team every time they keep their shape for 30 seconds without the ball going behind the defensive line. Teaches compactness under pressure.",
    keyPoints: [
      "Two lines of four stay no more than 12-16 metres apart vertically",
      "Lines must also hold their width — no narrowing into a cluster",
      "When the ball moves wide, the block shifts — do not open the centre",
      "First defender delays. Second defender covers. Third defender communicates.",
    ],
  },
  {
    id: "pressing",
    title: "High Press — Winning the Ball Back Quickly",
    category: "defence",
    summary: "Press the opposition high up the pitch to win the ball back before they can build an attack.",
    detail: "The high press is a defensive tactic that also functions as an attacking weapon. By pressing the opposition high — in or near their own half — a team can win the ball in a position where a quick counter-attack leads directly to a scoring chance. The press requires all players to work hard and understand their trigger — the specific moment they press (e.g. a bad touch by the opposition, a pass going backwards). If the trigger is not clear, the press becomes disorganised and leaves gaps.",
    zimbabweApplication: "The high press is physically demanding and requires fitness. Build it into your training by doing sprint intervals as part of every session. The most important coaching point: the press is organised by the FORWARDS, not the midfield. The centre-forward is the first presser. If the number 9 does not press, the whole system breaks down.",
    drill: "Set up 5v5 on a small pitch (30x20m). Tell the team out of possession they must win the ball back within 5 seconds of losing it. Use a stop-watch and call out the count. Any time they win it back in under 5 seconds, they get a bonus point. Teaches urgency of pressing.",
    keyPoints: [
      "Define the press TRIGGER — e.g. ball played to the goalkeeper, or a bad first touch",
      "The centre-forward starts the press — everyone else follows",
      "Press as a unit — do not press alone",
      "If the press is beaten, fall back into shape immediately — do not chase",
    ],
  },
  {
    id: "set-pieces-attack",
    title: "Attacking Set Pieces",
    category: "set_piece",
    summary: "Use corners and free-kicks to create organised scoring chances.",
    detail: "More goals are scored from set pieces at grassroots level than at any other level of the game. An organised set piece routine gives your team a significant advantage because the opposition is still reacting to your movement. Key principles: know who delivers (accuracy is more important than power), know where the targets are, know who attacks which zone, and know who stays back to cover the counter-attack.",
    zimbabweApplication: "In Zimbabwe grassroots football, set pieces are often wasted. The taker simply crosses the ball and hopes. Spend 10-15 minutes of every training session on set pieces. A simple corner routine: one player near post, one far post, one penalty spot, one edge of the box. Taker aims for the penalty spot. Everyone knows their run. Repeat until automatic.",
    drill: "From a corner: practice the same routine 10 times in a row without opposition. Then add two defenders to the routine. Then practice with full opposition. The repetition without pressure first builds confidence — then the opposition teaches problem-solving.",
    keyPoints: [
      "Repetition is key — practice the same routine until it is automatic",
      "Set pieces require runners at near post, far post, penalty spot and edge of box",
      "Always leave two players back to prevent the counter-attack",
      "The taker must be accurate — power is secondary",
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Coaching Education Course — Module Structure
// ─────────────────────────────────────────────────────────────────────────────

export interface CourseModule {
  id:       number;
  title:    string;
  duration: string;
  topics:   string[];
  quiz:     { question: string; options: string[]; correct: number }[];
  badge:    string;
}

export const COACHING_COURSE_MODULES: CourseModule[] = [
  {
    id: 1,
    title: "Understanding Football Formations",
    duration: "20 minutes",
    topics: [
      "What is a formation and why does it matter?",
      "How formations are described (4-3-3 means 4 defenders, 3 midfielders, 3 forwards)",
      "The five most important modern formations: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 5-3-2",
      "How to choose a formation based on the players you have",
      "Why formations are flexible — they change during the game",
    ],
    quiz: [
      { question: "In a 4-2-3-1 formation, how many defensive midfielders are there?", options: ["1","2","3","4"], correct: 1 },
      { question: "Which formation uses wing-backs who must run the full length of the pitch?", options: ["4-4-2","4-3-3","3-5-2","4-2-3-1"], correct: 2 },
      { question: "What does the first number in a formation description represent?", options: ["Forwards","Midfielders","Defenders","Goalkeeper"], correct: 2 },
      { question: "Which formation was dominant in European football in the 1990s?", options: ["4-3-3","4-4-2","3-5-2","4-2-3-1"], correct: 1 },
      { question: "A team playing 5-3-2 is likely trying to...", options: ["Score as many goals as possible","Keep possession","Be difficult to beat and counter-attack","Press high all game"], correct: 2 },
    ],
    badge: "Formation Fundamentals",
  },
  {
    id: 2,
    title: "Attacking Principles",
    duration: "25 minutes",
    topics: [
      "Width in attack — why it matters and how to create it",
      "Depth in attack — using the full length of the pitch",
      "Pass and move — the foundation of all good attacking play",
      "The counter-attack — winning the ball and moving immediately",
      "Through balls, crosses, and combination play",
      "Triangular play — maintaining possession while advancing",
    ],
    quiz: [
      { question: "What is the primary purpose of width in attack?", options: ["To score from wide positions","To stretch the defence and create central space","To help the full-backs defend","To slow down the game"], correct: 1 },
      { question: "In pass and move, what must a player do immediately after passing?", options: ["Stand and watch the next pass","Shout instructions","Move into a new position","Return to their starting position"], correct: 2 },
      { question: "The counter-attack is most effective when...", options: ["The opposition defence is well organised","The opposition has committed players forward","Both teams are equally positioned","The game is in the final minute"], correct: 1 },
      { question: "What is a 'through ball'?", options: ["A long high kick upfield","A pass into space behind the defensive line","A cross from the wide area","A back pass to the goalkeeper"], correct: 1 },
      { question: "Triangular play is most commonly used in...", options: ["The defensive third","Midfield","The penalty area","Set pieces only"], correct: 1 },
    ],
    badge: "Attacking Tactician",
  },
  {
    id: 3,
    title: "Defensive Organisation",
    duration: "25 minutes",
    topics: [
      "Zone defence vs man-to-man marking — when to use each",
      "The first, second and third defender — roles and responsibilities",
      "The defensive block — staying compact between the lines",
      "High press, medium press, and low block",
      "Defensive line height — when to hold high and when to drop",
      "Defending set pieces — corners, free-kicks, and throw-ins",
    ],
    quiz: [
      { question: "In zone defence, how do defenders primarily move?", options: ["Following individual opponents","In synchronicity with teammates","Randomly based on where the ball is","Only in their own penalty area"], correct: 1 },
      { question: "What is the role of the 'second defender'?", options: ["The goalkeeper","The player who takes corners","Provides immediate support for the first defender","Covers the opposition's best player"], correct: 2 },
      { question: "A 'low block' defence means...", options: ["Defenders crouch down low","The team defends primarily in their own half","Defenders press the opposition in their own half","The goalkeeper plays very low and wide"], correct: 1 },
      { question: "What is Gegenpressing?", options: ["A German goalkeeper technique","Counter-pressing immediately after losing possession","A set piece routine","A defensive formation used in Italy"], correct: 1 },
      { question: "How far apart should the defensive and midfield lines typically be?", options: ["5 metres","16 metres","30 metres","40 metres"], correct: 1 },
    ],
    badge: "Defensive Organiser",
  },
  {
    id: 4,
    title: "Matchday Management",
    duration: "20 minutes",
    topics: [
      "Warm-up design — linking training to matchday",
      "Pre-match team talk — what to say and what not to say",
      "Reading the game from the touchline — what to watch for",
      "Half-time adjustments — how to change things without confusing players",
      "Substitutions — when and why",
      "Managing winning and losing positions tactically",
    ],
    quiz: [
      { question: "What should a matchday warm-up ideally replicate?", options: ["The training session from Monday","A small version of the tactical approach for that game","Individual fitness only","Set pieces only"], correct: 1 },
      { question: "When a team is winning, a common substitution is to...", options: ["Bring on an extra striker","Replace an attacker with a defensive midfielder","Remove the goalkeeper","Bring on all substitutes at once"], correct: 1 },
      { question: "At half-time, a good coach should...", options: ["Tell players everything they did wrong","Only talk to individual players","Ask players how they think it is going first","Change the entire formation"], correct: 2 },
      { question: "When observing a match from the touchline, you should focus on...", options: ["Every action by every player","Only the goalkeeper","Two or three specific things","Only your best player"], correct: 0 },
      { question: "How many things should you give a player to focus on during a match?", options: ["As many as possible","At least five","One or two clear objectives","None — let them play freely"], correct: 1 },
    ],
    badge: "Matchday Manager",
  },
  {
    id: 5,
    title: "Coaching Different Age Groups",
    duration: "20 minutes",
    topics: [
      "U5-U11: simplicity, fun, and age-appropriate language",
      "U12-U15: beginning position-specific instruction",
      "U16+: detailed tactics, video analysis, opposition scouting",
      "The three Rs: Repetition, Relevance, Realism",
      "Disability football — adapting your approach",
      "How to explain formations to young players without numbers",
    ],
    quiz: [
      { question: "For U7 players, which phrase is better than 'press high'?", options: ["Press immediately","Hunt in packs","Apply pressure","Engage the opposition"], correct: 1 },
      { question: "What are the three Rs of training design?", options: ["Rules, Repetition, Results","Repetition, Relevance, Realism","Runs, Routines, Results","Rhythm, Repetition, Rest"], correct: 1 },
      { question: "At what age can you begin more detailed position-specific instruction?", options: ["U8","U10","U12-U15","Only adults"], correct: 2 },
      { question: "What is the most important thing to consider no matter what age group you coach?", options: ["The formation","The players — putting them first","Winning every game","Advanced tactics"], correct: 1 },
      { question: "For young players, how should you explain a diamond formation?", options: ["4-1-2-1 formation","Use the number system only","Ask them to form a diamond shape on the pitch","Draw it on a tactics board only"], correct: 2 },
    ],
    badge: "Youth Development Coach",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get THUTO context for a tactical question
// ─────────────────────────────────────────────────────────────────────────────

export function getThuTOTacticsContext(question: string): string {
  const lower = question.toLowerCase();
  const isFormationQ = /formation|4-3-3|4-4-2|3-5-2|system/.test(lower);
  const isAttackQ    = /attack|press|counter|through ball|cross|width/.test(lower);
  const isDefenceQ   = /defend|press|block|zone|man.to.man|line/.test(lower);
  const isAgeQ       = /young|youth|u12|u15|u18|kids|children|age/.test(lower);

  if (isFormationQ || isAttackQ || isDefenceQ || isAgeQ) {
    return THUTO_TACTICS_KNOWLEDGE;
  }
  return "";
}
