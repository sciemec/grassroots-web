import { useState } from "react";

// ─── FORMATS TABLE DATA ──────────────────────────────────────────────────────
const FORMATS_TABLE = [
  { age:"Under 7 (Year 2)", format:"3v3", ball:"Size 3", recommended:"15 x 10", min:"15 x 10", max:"20 x 15", goal:"4 x 2.5" },
  { age:"Under 8 (Year 3)", format:"5v5", ball:"Size 3", recommended:"37 x 27", min:"27 x 18", max:"37 x 27", goal:"12 x 6" },
  { age:"Under 9 (Year 4)", format:"5v5", ball:"Size 3", recommended:"37 x 27", min:"27 x 18", max:"37 x 27", goal:"12 x 6" },
  { age:"Under 10 (Year 5)", format:"7v7", ball:"Size 3", recommended:"55 x 37", min:"46 x 27", max:"55 x 37", goal:"12 x 6" },
  { age:"Under 11 (Year 6)", format:"7v7", ball:"Size 3", recommended:"55 x 37", min:"46 x 27", max:"55 x 37", goal:"12 x 6" },
  { age:"Under 12 (Year 7)", format:"9v9", ball:"Size 4", recommended:"73 x 46", min:"64 x 37", max:"73 x 46", goal:"16 x 7" },
  { age:"Under 13 (Year 8)", format:"9v9", ball:"Size 4", recommended:"73 x 46", min:"64 x 37", max:"73 x 46", goal:"16 x 7" },
  { age:"Under 14 (Year 9)", format:"11v11", ball:"Size 5", recommended:"82 x 50", min:"82 x 46", max:"91 x 55", goal:"21 x 7*" },
  { age:"Under 15 (Year 10)", format:"11v11", ball:"Size 5", recommended:"91 x 55", min:"82 x 46", max:"100 x 64", goal:"24 x 8**" },
  { age:"Under 16 (Year 11)", format:"11v11", ball:"Size 5", recommended:"91 x 55", min:"82 x 46", max:"100 x 64", goal:"24 x 8" },
  { age:"Under 17 (Year 12)", format:"11v11", ball:"Size 5", recommended:"100 x 64", min:"91 x 46", max:"118 x 91", goal:"24 x 8" },
  { age:"Under 18 (Year 13)", format:"11v11", ball:"Size 5", recommended:"100 x 64", min:"91 x 46", max:"118 x 91", goal:"24 x 8" },
  { age:"Open Age", format:"11v11", ball:"Size 5", recommended:"100 x 64", min:"91 x 46", max:"118 x 91", goal:"24 x 8" },
];

const FORMAT_COLORS = {
  "3v3":"#006400","5v5":"#B8860B","7v7":"#8B0000","9v9":"#1a5276","11v11":"#6c3483",
};

// ─── TRAINING DRILLS DATA ─────────────────────────────────────────────────────
const TRAINING_FORMATS = [
  {
    id:"5v5",
    format:"5v5",
    ages:"U8 – U9",
    color:"#B8860B",
    icon:"⚽",
    priority:"Individual Technique",
    formation:"No fixed formation — free roles",
    sessionLength:"60 minutes max",
    frequency:"1 session per week",
    overview:"At this age the focus is on developing love of the game, ball confidence, and basic 1v1 skills. Every drill should have lots of touches and feel like play, not work.",
    warmup:{
      name:"Passing Circle Warm-Up",
      duration:"10 min",
      players:"All",
      setup:"Players stand in a circle, 1 ball. Pass around the circle, then reverse direction. Progress to one-touch.",
      cues:["Use the inside of your foot","Call the name of who you're passing to","Head up to see the next pass"],
    },
    drills:[
      {
        name:"1v1 Battles",
        duration:"15 min",
        players:"Pairs",
        setup:"Two cones 10m apart as goals. Pairs play 1v1. First to 5 goals wins. Rotate pairs every 3 minutes.",
        objective:"Build confidence in 1v1 attacking and defending. Learn body positioning and deception.",
        cues:["Attackers: use a fake before going past","Defenders: stay on your feet, don't dive in","Celebrate good defending too"],
        progression:"Add a 3-second rule — attacker must attempt a move within 3 seconds of receiving.",
      },
      {
        name:"Pass & Move",
        duration:"15 min",
        players:"Groups of 4",
        setup:"20x15m grid. 4 players passing in sequence. After each pass, the passer must run to a new spot before receiving again.",
        objective:"Teach the fundamental habit of moving after passing — the basis of all team play.",
        cues:["Pass then move — never stand still","Make your run before the ball arrives","Call for the ball when you're free"],
        progression:"Add a defender in the middle — keep the ball away from them.",
      },
      {
        name:"Dribble & Shield",
        duration:"10 min",
        players:"All — solo",
        setup:"20x20m area. All players have a ball. Dribble freely. Coach calls 'freeze!' — players must shield their ball for 5 seconds.",
        objective:"Develop close ball control and body awareness when under pressure.",
        cues:["Keep the ball close — small touches","Body between the ball and the defender","Head up to see where others are"],
        progression:"Add 2 chasers who try to kick balls out of the area.",
      },
      {
        name:"5v5 Small Game",
        duration:"20 min",
        players:"Full squad — rotate",
        setup:"Play the actual 5v5 format on a 37x27m pitch. Use proper mini goals. Play 2 x 10 min halves.",
        objective:"Apply everything learned in the session in a real game environment.",
        cues:["Encourage — never shout instructions during play","Let them solve problems","Praise effort and bravery on the ball"],
        progression:"Challenge: can your team score using a pass before shooting?",
      },
    ],
  },
  {
    id:"7v7",
    format:"7v7",
    ages:"U10 – U11",
    color:"#8B0000",
    icon:"🏟️",
    priority:"Individual Technique + Basic Shape",
    formation:"2-3-1 (recommended)",
    sessionLength:"70–80 minutes",
    frequency:"1–2 sessions per week",
    overview:"Players now understand basic play. Introduce simple team shape using the 2-3-1. Focus on width, triangles, and basic defensive positioning. Rotate positions every session.",
    warmup:{
      name:"Triangle Passing Rondo",
      duration:"12 min",
      players:"Groups of 3",
      setup:"3 cones forming a triangle, 8m apart. Pass around the triangle, then reverse. Progress to one-touch. Add a defender in the middle.",
      cues:["Form the triangle before the pass arrives","Weight of pass must reach the target","Move after every pass — no standing"],
    },
    drills:[
      {
        name:"Width & Support Drill",
        duration:"15 min",
        players:"Groups of 5",
        setup:"40x30m grid with 2 wide channels (5m each side). 4v1 possession — attacking team must use the wide channels at least once before scoring through a gate.",
        objective:"Teach players to use width, find space, and not crowd around the ball.",
        cues:["Get wide — pull the defender away","Look for the player in the channel","One touch in the channel, then quick pass inside"],
        progression:"Make it 4v2, then 5v3.",
      },
      {
        name:"Shadow Defending",
        duration:"12 min",
        players:"Pairs",
        setup:"1 attacker dribbles slowly through a 20m channel. 1 defender follows WITHOUT tackling — they shadow, mirror movement, and control the attacker's direction.",
        objective:"Build patience, correct defensive body shape, and channel awareness before tackling is introduced.",
        cues:["Stay on your toes — low and balanced","Force them toward the touchline","Don't dive in — wait for the mistake"],
        progression:"After 5 rounds, allow the defender to make a tackle.",
      },
      {
        name:"2v1 Overload",
        duration:"12 min",
        players:"Groups of 3",
        setup:"15x10m channel with a small goal. 2 attackers vs 1 defender. Attackers start 5m back. Score in the goal.",
        objective:"Teach attackers to use numerical advantage. Teach the decision: dribble or pass?",
        cues:["If defender comes to you — pass","If defender drops — drive forward","Support player: show for the ball, don't hide"],
        progression:"Add a second defender joining after 3 seconds.",
      },
      {
        name:"7v7 Shape Game",
        duration:"25 min",
        players:"Full squad",
        setup:"Play 7v7 on a 55x37m pitch. Use the 2-3-1 formation. Play 2 x 12 min halves. Rotate positions at half time.",
        objective:"Apply the 2-3-1 shape in a real game. Don't over-coach — let them play.",
        cues:["Remind players of their starting positions only","Encourage wide play","Rotate positions so everyone experiences different roles"],
        progression:"Award bonus points for goals scored after a wide pass.",
      },
    ],
  },
  {
    id:"9v9",
    format:"9v9",
    ages:"U12 – U13",
    color:"#1a5276",
    icon:"📐",
    priority:"Technique at Speed + Team Organisation",
    formation:"3-3-2 or 3-2-3",
    sessionLength:"80–90 minutes",
    frequency:"2 sessions per week",
    overview:"This is the bridge to full football. Players are ready for tactical concepts: pressing, compactness, transitions, and offside. Train position-specific skills and introduce structured team defending.",
    warmup:{
      name:"Rondo 4v2",
      duration:"15 min",
      players:"Groups of 6",
      setup:"15x15m grid. 4 players keep the ball from 2 defenders. When defenders win it, the 2 who lost it become the new defenders.",
      cues:["Quick one and two-touch play","Play away from pressure — find the free player","Defenders: press together, not one at a time"],
    },
    drills:[
      {
        name:"Pressing Trigger Drill",
        duration:"15 min",
        players:"Full team — split into two groups",
        setup:"Half pitch. Attacking team tries to build from back. Defending team learns one press trigger: when the ball goes to the goalkeeper, the front 2 press immediately.",
        objective:"Teach a shared trigger for pressing — the start of organised team defending.",
        cues:["Everyone moves together when the trigger happens","Press with purpose — angle to close the pass","If the press is beaten, drop and reset — don't chase"],
        progression:"Add a second trigger: press when a defender turns their back.",
      },
      {
        name:"3v2 Finishing",
        duration:"15 min",
        players:"Groups of 5",
        setup:"Mark out an 18-yard box. 3 attackers vs 2 defenders + goalkeeper. First attacker passes into the box to start. Attackers can only shoot after receiving and controlling the ball.",
        objective:"Develop combination play in the final third and composed finishing under pressure.",
        cues:["Control first — then look to shoot","Draw the defender before the final pass","Shot: low and across the goalkeeper"],
        progression:"Reduce to 3v3 for more defensive challenge.",
      },
      {
        name:"4-Goal Scanning Game",
        duration:"15 min",
        players:"8–10 players",
        setup:"30x20m area with 4 small goals at the corners. Two teams of 4. Each team can score in EITHER of their two assigned goals. Forces constant scanning and defensive organisation.",
        objective:"Develop awareness, communication, and defensive compactness.",
        cues:["Scan before you receive — know where both goals are","Defend as a unit — compress when the ball is far","Call out which goal they're threatening"],
        progression:"Reduce the goal size to raise the accuracy demand.",
      },
      {
        name:"9v9 Tactical Game",
        duration:"30 min",
        players:"Full squad",
        setup:"Play 9v9 on a 73x46m pitch. Use the 3-3-2. Focus for the game: apply the press trigger drill from earlier.",
        objective:"Transfer the pressing concept into a full game environment.",
        cues:["Praise when the press works collectively","Pause and reset if shape collapses — brief freeze coaching","Keep the game flowing — limit stoppages"],
        progression:"Add offside line practice — defensive line steps up together.",
      },
    ],
  },
  {
    id:"11v11",
    format:"11v11",
    ages:"U14 – Open Age",
    color:"#6c3483",
    icon:"🏆",
    priority:"Decision Making & Awareness in All Situations",
    formation:"4-3-3 (recommended for development)",
    sessionLength:"90 minutes",
    frequency:"2 sessions per week",
    overview:"The full game. Technical training becomes position-specific. Tactical understanding deepens across all four phases: attacking, defending, transition to attack, transition to defend. Players also begin physical conditioning work.",
    warmup:{
      name:"Positional Rondo 6v3",
      duration:"15 min",
      players:"Groups of 9",
      setup:"25x25m grid. 6 keep the ball from 3 defenders. Positional awareness — each player has an assigned zone they must stay near.",
      cues:["Play quickly — limit touches","Find the player in space, not the closest one","Defenders: press as a unit of 3, not individually"],
    },
    drills:[
      {
        name:"Position-Specific Finishing",
        duration:"20 min",
        players:"Full squad in 3 groups",
        setup:"Three simultaneous stations: (1) Defenders — pass out from back under pressure. (2) Midfielders — receive to turn and play forward. (3) Strikers — receive and finish 1v1 vs goalkeeper.",
        objective:"Develop technical skills specific to each playing position at match speed.",
        cues:["Defenders: composure and accuracy under pressure","Midfielders: first touch away from pressure","Strikers: choose placement over power"],
        progression:"Combine stations into a full 11v11 pattern-of-play sequence.",
      },
      {
        name:"Organised Pressing Unit",
        duration:"20 min",
        players:"Full squad",
        setup:"Full pitch. Team A builds from back with goalkeeper. Team B defends with 3 press triggers agreed before the drill starts. Run 5-minute blocks, swap roles.",
        objective:"Develop a coordinated pressing system with shared triggers, direction, and cover.",
        cues:["Trigger → Press direction → Cover shape — in that order","When press is beaten: drop fast, don't chase","Goalkeeper communicates — they see the whole picture"],
        progression:"Add a rule: if the press wins the ball, immediate counterattack in 5 seconds.",
      },
      {
        name:"Transition Counterattack",
        duration:"15 min",
        players:"Full squad",
        setup:"Half pitch. Team A attacks with 7 players. Team B defends with 6. When Team B wins the ball, they counter with all 6 — Team A must recover. Target: score within 6 passes.",
        objective:"Train the explosive moment of transition from defence to attack.",
        cues:["Win the ball — look up immediately","First pass must go forward","Recovering defenders: sprint to get goal-side, not ball-side"],
        progression:"Restrict counterattack to 4 passes only — increases speed of decision.",
      },
      {
        name:"Set Piece Workshop",
        duration:"15 min",
        players:"Full squad",
        setup:"Corners and free kicks only. Each set piece has 3 assigned runs. Practice each one 5 times — attacking, then defending.",
        objective:"Build set piece routines where every player knows their position and run.",
        cues:["Time your run — arrive as the ball does","Defender: mark your zone, not just one person","Goalkeeper: communicate and command"],
        progression:"Run set pieces against a full defensive block.",
      },
    ],
  },
];

// ─── ECD DATA ─────────────────────────────────────────────────────────────────
const ECD_STAGES = [
  {
    id:"tiny", stage:"Tiny Boots", shona:"Shangu Diki", age:"3 – 4 years", ageShona:"Makore 3 – 4",
    level:"ECD A", color:"#B8860B", icon:"🌱",
    goal:"Build a relationship with the ball. No rules, no pressure — just movement and joy.",
    goalShona:"Kuvaka ukama nebhora. Hapana mitemo — kungoita mafaro.",
    equipment:"1 ball per child, open space", equipmentShona:"Bhora rimwe nerimwe, nzvimbo yakavhurika",
    duration:"15 minutes",
    activities:[
      { name:"Chase the Ball", shona:"Tsvaga Bhora", desc:"Teacher rolls ball gently. Children run and stop it with their foot. No competition — everyone wins.", shonaDesc:"Mudzidzisi anobhinha bhora. Vana vanomhanya nokumisa nebiri. Hapana makwikwi.", cues:["Use your foot, not your hands","Stop it before it gets away","Try the other foot too"], cuesShona:["Shandisa tsoka, kwete maoko","Misira usati waenda","Edza tsoka imwe zvakare"] },
      { name:"Roll & Fetch", shona:"Bhinha Unotsvaga", desc:"Pairs: one rolls, one fetches and rolls back. Develops coordination and taking turns.", shonaDesc:"Vaviri: mumwe anobhinha, mumwe anotsvaga. Inodzidzisa kutevedzana.", cues:["Aim at your partner","Use inside of your foot","Wait for your turn"], cuesShona:["Tangira shamwari yako","Shandisa mukati metsoka","Mirira nguva yako"] },
      { name:"Kick the Wall", shona:"Rova Madziro", desc:"Each child kicks against a wall and controls the rebound. Solo ball mastery.", shonaDesc:"Mwana wega anorova bhora kumadziro. Zvinodzidzisa kuita bhora zvakanaka.", cues:["Kick with your laces","Watch the ball come back","Try to stop it clean"], cuesShona:["Rova nemazano eshoe","Tarisa bhora richidzokerera","Edza kurimisa zvakanaka"] },
    ],
  },
  {
    id:"firstkick", stage:"First Kick", shona:"Kurova Kwekutanga", age:"5 – 6 years", ageShona:"Makore 5 – 6",
    level:"ECD B / Grade 1", color:"#8B0000", icon:"⚡",
    goal:"Introduce dribbling, passing, and simple decision-making with the ball at their feet.",
    goalShona:"Kudzidzisa kutakura bhora, kupasa, uye kusarudza.",
    equipment:"1 ball per child, 4–6 cones", equipmentShona:"Bhora rimwe nerimwe, makoni 4–6",
    duration:"20 minutes",
    activities:[
      { name:"Cone Dribble", shona:"Takura Makoni", desc:"4 cones in a line. Dribble through, turn, come back. Time them for fun.", shonaDesc:"Makoni mana mumutsara. Ita bhora nepakati, vodzoka. Vatore nguva mufaro.", cues:["Small touches, stay in control","Look up sometimes","Use both feet"], cuesShona:["Kurova zvishoma","Tarisa kumusoro","Shandisa tsoka dzose"] },
      { name:"Pass & Move", shona:"Pasa Ufambe", desc:"In pairs, pass then run to a new spot. Teaches moving after a pass.", shonaDesc:"Mumwe nomumwe, pasa bhora umhanyire kuimwe nzvimbo.", cues:["Pass then move — don't stand still","Use the inside of your foot","Call your partner's name"], cuesShona:["Pasa wobva wafamba","Shandisa mukati metsoka","Daidza zita reshamwari yako"] },
      { name:"Mini Gates", shona:"Magedhi Madiki", desc:"6 pairs of cones as gates. Dribble through as many as possible in 60 seconds.", shonaDesc:"Makoni matanhatu semini magedhi. Ita bhora nepakati paanogona mu60 seconds.", cues:["Head up to see the gates","Change direction quickly","Count how many you got"], cuesShona:["Simudza musoro uone magedhi","Shandura nzira","Verenga wakaita mangani"] },
    ],
  },
  {
    id:"ready", stage:"Ready for 3v3", shona:"Kugadzirira 3v3", age:"7 years", ageShona:"Makore 7",
    level:"Grade 2 → Organised 3v3", color:"#006400", icon:"🏆",
    goal:"Transition into structured mini games. Ready for the 3v3 format with mini goals.",
    goalShona:"Kupinda mumitambo yakagadziridzwa. Vagadzirira 3v3 nemini magedhi.",
    equipment:"Size 3 ball, 4 cones as mini goals", equipmentShona:"Bhora Size 3, makoni 4 semini magedhi",
    duration:"30 minutes",
    activities:[
      { name:"1v1 Mini Game", shona:"Mutambo we1v1", desc:"Two children, two cones as a goal each end. First to 3 goals wins.", shonaDesc:"Vana vaviri, makoni maviri semusuwo. Anotanga 3 anokunda.", cues:["Attack when you have the ball","Defend your goal","High five after"], cuesShona:["Rova kana une bhora","Dzivirira musuwo wako","High five mushure"] },
      { name:"2v1 Overload", shona:"2v1 Kuwedzera", desc:"Two attackers vs one defender. Teaches passing when outnumbered.", shonaDesc:"Varwi vaviri nemumwe mudziviriri. Inodzidzisa kupasa.", cues:["If they come to you — pass","If you're free — call for it","Work together"], cuesShona:["Kana vauya kwauri — pasa","Kana uri akasununguka — daidza","Shanda pamwe"] },
      { name:"First 3v3 Game", shona:"Mutambo Wekutanga we3v3", desc:"3 players each side. Mini goals. 6–8 minutes. High five to start. Pure fun.", shonaDesc:"Vatambi vatatu kune imwe. Mini magedhi. Maminetsi 6–8. High five kutanga.", cues:["Everyone attacks, everyone defends","Score from the other half","Shake hands after every game"], cuesShona:["Vose vanorwisa, vose vanodzivirira","Rova uri kumhiri kwehafu","Sungana maoko mushure"] },
    ],
  },
];

const PATHWAY_STEPS = [
  {age:"3–4",label:"ECD A",sub:"Tiny Boots",color:"#B8860B",icon:"🌱",shona:"Shangu Diki"},
  {age:"5–6",label:"ECD B / Gr.1",sub:"First Kick",color:"#8B0000",icon:"⚡",shona:"Kurova Kwekutanga"},
  {age:"7",label:"Grade 2",sub:"3v3 Ready",color:"#006400",icon:"⚽",shona:"Kugadzirira 3v3"},
  {age:"8–9",label:"Grade 3–4",sub:"5v5",color:"#B8860B",icon:"🏟️",shona:"5v5"},
  {age:"10–11",label:"Grade 5–6",sub:"7v7",color:"#8B0000",icon:"📐",shona:"7v7"},
  {age:"12–13",label:"Form 1–2",sub:"9v9",color:"#1a5276",icon:"🎽",shona:"9v9"},
  {age:"14+",label:"Form 3+",sub:"11v11",color:"#6c3483",icon:"🏆",shona:"11v11 Yakazara"},
];

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const GeometricPattern = () => (
  <svg width="100%" height="50" viewBox="0 0 400 50" preserveAspectRatio="none" style={{display:"block"}}>
    {Array.from({length:20}).map((_,i)=>(
      <polygon key={i} points={`${i*20},0 ${i*20+10},25 ${i*20+20},0`} fill={i%3===0?"#006400":i%3===1?"#B8860B":"#8B0000"} opacity="0.9"/>
    ))}
    {Array.from({length:20}).map((_,i)=>(
      <polygon key={`b${i}`} points={`${i*20},50 ${i*20+10},25 ${i*20+20},50`} fill={i%3===0?"#8B0000":i%3===1?"#006400":"#B8860B"} opacity="0.7"/>
    ))}
  </svg>
);

const Tag = ({label,color}) => (
  <span style={{fontSize:9,letterSpacing:3,color,fontFamily:"'Courier New',monospace",border:`1px solid ${color}`,padding:"3px 10px",display:"inline-block",marginBottom:10}}>◆ {label}</span>
);

const DiamondDivider = ({color="#B8860B"}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,margin:"20px 0"}}>
    <div style={{flex:1,height:1,background:`${color}40`}}/>
    <div style={{width:8,height:8,background:color,transform:"rotate(45deg)"}}/>
    <div style={{flex:1,height:1,background:`${color}40`}}/>
  </div>
);

// ─── TRAINING DRILLS SECTION ──────────────────────────────────────────────────
function TrainingDrillsSection() {
  const [activeFormat, setActiveFormat] = useState("5v5");
  const [openDrill, setOpenDrill] = useState(null);
  const [showWarmup, setShowWarmup] = useState(false);

  const fmt = TRAINING_FORMATS.find(f => f.id === activeFormat);

  return (
    <div>
      <Tag label="TRAINING DRILLS BY FORMAT" color="#B8860B"/>
      <h2 style={{fontSize:28,fontWeight:900,color:"#f0e6d0",margin:"8px 0 6px"}}>Session Plans & Drills</h2>
      <p style={{fontSize:13,color:"#8a9a8a",marginBottom:28,lineHeight:1.7,maxWidth:680}}>
        Age-appropriate training sessions for every format. Each plan includes a warm-up, drills with coaching cues, and a full game. Click any drill to expand the full session card.
      </p>

      {/* Format selector */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:32}}>
        {TRAINING_FORMATS.map(f=>(
          <button key={f.id} onClick={()=>{setActiveFormat(f.id);setOpenDrill(null);setShowWarmup(false);}} style={{
            background:activeFormat===f.id?f.color:"#0d1a0d",
            border:`1px solid ${activeFormat===f.id?f.color:"#1e3a1e"}`,
            color:activeFormat===f.id?"#fff":"#6a8a6a",
            padding:"18px 12px",cursor:"pointer",transition:"all 0.25s",textAlign:"center",
          }}>
            <div style={{fontSize:24,marginBottom:6}}>{f.icon}</div>
            <div style={{fontSize:16,fontWeight:900,fontFamily:"'Georgia',serif",color:activeFormat===f.id?"#fff":"#f0e6d0"}}>{f.format}</div>
            <div style={{fontSize:9,fontFamily:"'Courier New',monospace",letterSpacing:1,marginTop:3,opacity:0.8}}>{f.ages}</div>
          </button>
        ))}
      </div>

      {/* Session overview */}
      <div style={{background:"#0a130a",border:`1px solid ${fmt.color}40`,borderLeft:`4px solid ${fmt.color}`,padding:24,marginBottom:24}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16,marginBottom:16}}>
          {[
            {label:"PRIORITY",value:fmt.priority},
            {label:"FORMATION",value:fmt.formation},
            {label:"SESSION LENGTH",value:fmt.sessionLength},
            {label:"FREQUENCY",value:fmt.frequency},
          ].map((s,i)=>(
            <div key={i}>
              <div style={{fontSize:8,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",marginBottom:4}}>{s.label}</div>
              <div style={{fontSize:12,color:"#c8b89a",fontFamily:"'Georgia',serif",lineHeight:1.4}}>{s.value}</div>
            </div>
          ))}
        </div>
        <p style={{fontSize:13,color:"#8a9a8a",lineHeight:1.8,margin:0,fontFamily:"'Georgia',serif"}}>{fmt.overview}</p>
      </div>

      {/* Warm-up card */}
      <div onClick={()=>setShowWarmup(!showWarmup)} style={{
        background:"#0d1a0d",border:`1px solid ${showWarmup?fmt.color:"#1e3a1e"}`,
        padding:"16px 20px",cursor:"pointer",transition:"all 0.25s",marginBottom:8,
        borderLeft:`4px solid ${fmt.color}`,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",border:`1px solid ${fmt.color}`,padding:"2px 8px"}}>WARM-UP</span>
            <span style={{fontSize:14,fontWeight:700,color:"#f0e6d0",fontFamily:"'Georgia',serif"}}>{fmt.warmup.name}</span>
            <span style={{fontSize:11,color:"#4a6a4a",fontFamily:"'Courier New',monospace"}}>· {fmt.warmup.duration} · {fmt.warmup.players}</span>
          </div>
          <span style={{color:fmt.color,fontSize:22,flexShrink:0}}>{showWarmup?"−":"+"}</span>
        </div>
        {showWarmup && (
          <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1e3a1e"}}>
            <p style={{fontSize:13,color:"#c8b89a",lineHeight:1.8,fontFamily:"'Georgia',serif",marginBottom:14}}>{fmt.warmup.setup}</p>
            <div style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",marginBottom:8}}>COACHING CUES</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {fmt.warmup.cues.map((c,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{color:fmt.color,flexShrink:0}}>›</span>
                  <span style={{fontSize:12,color:"#a89880",fontFamily:"'Georgia',serif",lineHeight:1.6}}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drill cards */}
      {fmt.drills.map((drill,i)=>(
        <div key={i} onClick={()=>setOpenDrill(openDrill===i?null:i)} style={{
          background:openDrill===i?"#0a130a":"#0d1a0d",
          border:`1px solid ${openDrill===i?fmt.color:"#1e3a1e"}`,
          padding:"16px 20px",cursor:"pointer",transition:"all 0.25s",marginBottom:8,
        }}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",border:`1px solid ${fmt.color}40`,padding:"2px 8px",flexShrink:0}}>DRILL {i+1}</span>
              <span style={{fontSize:14,fontWeight:700,color:"#f0e6d0",fontFamily:"'Georgia',serif"}}>{drill.name}</span>
              <span style={{fontSize:11,color:"#4a6a4a",fontFamily:"'Courier New',monospace"}}>· {drill.duration} · {drill.players}</span>
            </div>
            <span style={{color:fmt.color,fontSize:22,flexShrink:0,marginLeft:12}}>{openDrill===i?"−":"+"}</span>
          </div>

          {openDrill===i && (
            <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1e3a1e"}}>
              {/* Objective */}
              <div style={{background:"#060c06",border:`1px solid ${fmt.color}30`,padding:"12px 16px",marginBottom:16}}>
                <span style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace"}}>OBJECTIVE: </span>
                <span style={{fontSize:12,color:"#8a9a8a",fontFamily:"'Georgia',serif"}}>{drill.objective}</span>
              </div>

              {/* Setup */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",marginBottom:6}}>SETUP</div>
                <p style={{fontSize:13,color:"#c8b89a",lineHeight:1.8,fontFamily:"'Georgia',serif",margin:0}}>{drill.setup}</p>
              </div>

              {/* Cues */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",marginBottom:8}}>COACHING CUES</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {drill.cues.map((c,j)=>(
                    <div key={j} style={{display:"flex",gap:8,alignItems:"flex-start",background:"#080e08",padding:"8px 10px"}}>
                      <span style={{color:fmt.color,flexShrink:0,marginTop:2}}>›</span>
                      <span style={{fontSize:12,color:"#a89880",fontFamily:"'Georgia',serif",lineHeight:1.5}}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progression */}
              <div style={{background:`${fmt.color}15`,border:`1px solid ${fmt.color}40`,padding:"10px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",flexShrink:0,paddingTop:2}}>PROGRESSION →</span>
                <span style={{fontSize:12,color:"#c8b89a",fontFamily:"'Georgia',serif",lineHeight:1.6}}>{drill.progression}</span>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Session summary */}
      <div style={{marginTop:20,background:"#0d1a0d",border:`1px solid ${fmt.color}40`,padding:20,display:"flex",gap:16,flexWrap:"wrap"}}>
        <div style={{fontSize:9,letterSpacing:2,color:fmt.color,fontFamily:"'Courier New',monospace",alignSelf:"center",flexShrink:0}}>SESSION TOTAL →</div>
        {[
          {label:"Warm-Up",val:fmt.warmup.duration},
          {label:"Drills",val:`${fmt.drills.length} drills`},
          {label:"Game Included",val:"✓ Yes"},
          {label:"Total",val:fmt.sessionLength},
        ].map((s,i)=>(
          <div key={i} style={{textAlign:"center",padding:"0 16px",borderLeft:"1px solid #1e3a1e"}}>
            <div style={{fontSize:8,color:"#4a6a4a",fontFamily:"'Courier New',monospace",letterSpacing:1,marginBottom:2}}>{s.label}</div>
            <div style={{fontSize:13,color:"#f0e6d0",fontFamily:"'Georgia',serif",fontWeight:700}}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ECD SECTION ─────────────────────────────────────────────────────────────
function ECDSection() {
  const [activeStage, setActiveStage] = useState("tiny");
  const [activeActivity, setActiveActivity] = useState(null);
  const [showShona, setShowShona] = useState(false);
  const stage = ECD_STAGES.find(s => s.id === activeStage);
  return (
    <div>
      <Tag label="EARLY CHILDHOOD DEVELOPMENT" color="#B8860B"/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:8}}>
        <h2 style={{fontSize:28,fontWeight:900,color:"#f0e6d0",margin:0}}>Football Starts at ECD</h2>
        <button onClick={()=>setShowShona(!showShona)} style={{background:showShona?"#B8860B":"transparent",border:"1px solid #B8860B",color:showShona?"#fff":"#B8860B",padding:"8px 18px",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10,letterSpacing:2,transition:"all 0.2s"}}>
          {showShona?"ENGLISH":"SHONA 🇿🇼"}
        </button>
      </div>
      <p style={{fontSize:13,color:"#8a9a8a",marginBottom:28,lineHeight:1.8,maxWidth:680}}>
        {showShona?"Nzira yepamusoro yekudzidzisa bhora muZimbabwe inotanga kuECD. Vana vane makore 3–6 vanogona kudzidza kutamba bhora usati wapinda muchidzidzo chikuru."
          :"The most powerful football development pathway in Zimbabwe starts at ECD. Children aged 3–6 can begin their football journey long before organised school sport begins."}
      </p>
      {/* Pathway */}
      <div style={{marginBottom:36}}>
        <div style={{fontSize:9,letterSpacing:3,color:"#B8860B",fontFamily:"'Courier New',monospace",marginBottom:14}}>{showShona?"NZIRA YEKUKURA":"DEVELOPMENT PATHWAY"}</div>
        <div style={{display:"flex",alignItems:"stretch",overflowX:"auto",gap:0,paddingBottom:8}}>
          {PATHWAY_STEPS.map((step,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
              <div style={{background:i<3?"#0d1a0d":"#080e08",border:`1px solid ${step.color}`,borderTop:`3px solid ${step.color}`,padding:"12px 14px",textAlign:"center",minWidth:90,opacity:i<3?1:0.55}}>
                <div style={{fontSize:18,marginBottom:3}}>{step.icon}</div>
                <div style={{fontSize:14,fontWeight:900,color:step.color,fontFamily:"'Georgia',serif"}}>{step.age}</div>
                <div style={{fontSize:8,color:"#f0e6d0",fontFamily:"'Courier New',monospace",letterSpacing:1,margin:"3px 0 2px"}}>{step.label}</div>
                <div style={{fontSize:10,color:"#6a8a6a",fontFamily:"'Georgia',serif"}}>{showShona?step.shona:step.sub}</div>
              </div>
              {i<PATHWAY_STEPS.length-1&&<div style={{color:"#333",fontSize:18,padding:"0 3px",flexShrink:0}}>›</div>}
            </div>
          ))}
        </div>
      </div>
      {/* Stage selector */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
        {ECD_STAGES.map(s=>(
          <button key={s.id} onClick={()=>{setActiveStage(s.id);setActiveActivity(null);}} style={{background:activeStage===s.id?s.color:"#0d1a0d",border:`1px solid ${activeStage===s.id?s.color:"#1e3a1e"}`,color:activeStage===s.id?"#fff":"#6a8a6a",padding:"16px 12px",cursor:"pointer",transition:"all 0.25s",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:12,fontWeight:700,color:activeStage===s.id?"#fff":"#f0e6d0",fontFamily:"'Georgia',serif",marginBottom:2}}>{showShona?s.shona:s.stage}</div>
            <div style={{fontSize:9,fontFamily:"'Courier New',monospace",letterSpacing:1,opacity:0.8}}>{showShona?s.ageShona:s.age}</div>
          </button>
        ))}
      </div>
      {/* Stage detail */}
      <div style={{background:"#0a130a",border:`1px solid ${stage.color}40`,borderLeft:`4px solid ${stage.color}`,padding:24,marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
          {[{label:showShona?"CHINANGWA":"GOAL",val:showShona?stage.goalShona:stage.goal},{label:showShona?"ZVINODIWA":"EQUIPMENT",val:showShona?stage.equipmentShona:stage.equipment},{label:"DURATION",val:stage.duration}].map((s,i)=>(
            <div key={i}><div style={{fontSize:9,letterSpacing:2,color:stage.color,fontFamily:"'Courier New',monospace",marginBottom:6}}>{s.label}</div><p style={{fontSize:12,color:"#c8b89a",lineHeight:1.7,margin:0,fontFamily:"'Georgia',serif"}}>{s.val}</p></div>
          ))}
        </div>
        <DiamondDivider color={stage.color}/>
        <div style={{fontSize:9,letterSpacing:3,color:stage.color,fontFamily:"'Courier New',monospace",marginBottom:12}}>{showShona?"MAITIRO EMITAMBO":"ACTIVITY CARDS"}</div>
        {stage.activities.map((act,i)=>(
          <div key={i} onClick={()=>setActiveActivity(activeActivity===i?null:i)} style={{background:activeActivity===i?"#060c06":"#0d1a0d",border:`1px solid ${activeActivity===i?stage.color:"#1e3a1e"}`,padding:"14px 18px",cursor:"pointer",transition:"all 0.25s",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:9,letterSpacing:2,color:stage.color,fontFamily:"'Courier New',monospace"}}>ACTIVITY {i+1}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#f0e6d0",fontFamily:"'Georgia',serif"}}>{showShona?act.shona:act.name}</span>
              </div>
              <span style={{color:stage.color,fontSize:20}}>{activeActivity===i?"−":"+"}</span>
            </div>
            {activeActivity===i&&(
              <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #1e3a1e"}}>
                <p style={{fontSize:13,color:"#c8b89a",lineHeight:1.8,fontFamily:"'Georgia',serif",marginBottom:12}}>{showShona?act.shonaDesc:act.desc}</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {(showShona?act.cuesShona:act.cues).map((c,j)=>(
                    <div key={j} style={{display:"flex",gap:8}}><span style={{color:stage.color,flexShrink:0}}>›</span><span style={{fontSize:12,color:"#a89880",fontFamily:"'Georgia',serif",lineHeight:1.5}}>{c}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{background:"linear-gradient(135deg,#0d1a0d,#1a0a00)",border:"1px solid #B8860B",padding:24,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontSize:9,letterSpacing:3,color:"#B8860B",fontFamily:"'Courier New',monospace",marginBottom:6}}>◆ {showShona?"NYORESA NZVIMBO YAKO YECD":"REGISTER YOUR ECD CENTRE"}</div>
          <p style={{fontSize:14,fontWeight:700,color:"#f0e6d0",fontFamily:"'Georgia',serif",margin:"0 0 4px"}}>{showShona?"Nzvimbo yako yeECD inogona kutanga nzira yebhora nhasi.":"Your ECD centre can start Zimbabwe's football pipeline today."}</p>
          <p style={{fontSize:12,color:"#6a8a6a",margin:0}}>{showShona?"Mahara. Bhora rimwe nemakoni mana zvakakwana.":"Free to join. One ball and four cones is enough."}</p>
        </div>
        <button style={{background:"#B8860B",border:"none",color:"#fff",padding:"13px 28px",fontFamily:"'Courier New',monospace",fontSize:10,letterSpacing:3,cursor:"pointer"}}>{showShona?"NYORESA NHASI →":"REGISTER NOW →"}</button>
      </div>
    </div>
  );
}

// ─── 3V3 SECTION ─────────────────────────────────────────────────────────────
function ThreeVThreeSection() {
  const [tab, setTab] = useState("why");
  const tabs=[{id:"why",label:"Why 3v3?"},{id:"setup",label:"Pitch Setup"},{id:"rules",label:"Rules"},{id:"coaching",label:"Coaching Tips"}];
  const THREE_V_THREE_RULES=[
    {rule:"Game Start",detail:"Begin every game with a high five. Rock-paper-scissors decides who kicks off."},
    {rule:"No Goalkeeper",detail:"Every player attacks and defends. Faster game, more ball touches for all."},
    {rule:"No Heading",detail:"No heading or penalty kicks allowed. Safety first for young players."},
    {rule:"Free Kicks",detail:"All free kicks must be at least 3m from the goal. Opposition must be 3m away."},
    {rule:"Restarts",detail:"Players can dribble OR pass at all restarts — goal line, corners, sidelines, free kicks."},
    {rule:"Scoring",detail:"A player must be in the opponent's half of the pitch for a goal to count."},
    {rule:"After a Goal",detail:"The conceding team restarts from their goal line. Scoring team returns to their half."},
    {rule:"Goal Line",detail:"On goal line restarts, opposition retreats to their own half before play resumes."},
  ];
  return (
    <div>
      <Tag label="FEATURED FORMAT — U7" color="#006400"/>
      <h2 style={{fontSize:28,fontWeight:900,color:"#f0e6d0",margin:"8px 0 6px"}}>3v3 — The Entry Format</h2>
      <p style={{fontSize:13,color:"#8a9a8a",marginBottom:24,lineHeight:1.7}}>The recommended format for Under 7s. Fast, fun, and proven to develop better players from day one.</p>
      <div style={{display:"flex",gap:4,marginBottom:24,flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"#006400":"transparent",border:`1px solid ${tab===t.id?"#006400":"#1e3a1e"}`,color:tab===t.id?"#fff":"#6a8a6a",padding:"10px 20px",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10,letterSpacing:2,transition:"all 0.2s"}}>{t.label.toUpperCase()}</button>
        ))}
      </div>
      {tab==="why"&&(<div><div style={{background:"#0d1a0d",border:"1px solid #1e3a1e",borderLeft:"4px solid #006400",padding:24,marginBottom:16}}><p style={{fontSize:14,color:"#c8b89a",lineHeight:1.9,fontFamily:"'Georgia',serif",margin:0}}>3v3 gives young players the best introduction to football — more chances to learn, play, make decisions, score and stop goals. Extensive research shows it encourages more physical activity and increases technical actions, meaning more touches on the ball and more play on the pitch.</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>{[{n:"MORE TOUCHES",sub:"per player vs 5v5"},{n:"MORE ACTION",sub:"physical activity per min"},{n:"MORE FUN",sub:"every child plays always"}].map((s,i)=>(<div key={i} style={{background:"#060c06",border:"1px solid #1e3a1e",borderTop:"3px solid #006400",padding:"18px 14px",textAlign:"center"}}><div style={{fontSize:14,fontWeight:900,color:"#006400",fontFamily:"'Georgia',serif",marginBottom:4}}>{s.n}</div><div style={{fontSize:10,color:"#6a8a6a",fontFamily:"'Courier New',monospace",letterSpacing:1,lineHeight:1.4}}>{s.sub}</div></div>))}</div></div>)}
      {tab==="setup"&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[{icon:"📐",title:"Pitch Size",body:"10×15m min, up to 15×20m. Create up to 4 pitches inside a 5v5 pitch. Use cones — no permanent markings needed."},{icon:"⚽",title:"Ball & Goals",body:"Size 3 ball. Mini goals: 4×2.5ft. Four cones marking two small goals is enough to get started."},{icon:"👥",title:"Teams & Adults",body:"Squads of 6–12. 2 adults as Pitch Facilitators. No referee — children make their own decisions."},{icon:"⏱️",title:"Duration",body:"6–10 min per game. Carousel rotation gives every player 30–40 minutes total playing time."}].map((s,i)=>(<div key={i} style={{background:"#0d1a0d",border:"1px solid #1e3a1e",borderLeft:"4px solid #006400",padding:20}}><div style={{fontSize:24,marginBottom:8}}>{s.icon}</div><div style={{fontSize:10,letterSpacing:2,color:"#006400",fontFamily:"'Courier New',monospace",marginBottom:6}}>{s.title.toUpperCase()}</div><p style={{fontSize:13,color:"#c8b89a",lineHeight:1.8,margin:0,fontFamily:"'Georgia',serif"}}>{s.body}</p></div>))}</div>)}
      {tab==="rules"&&(<div style={{display:"flex",flexDirection:"column",gap:6}}>{THREE_V_THREE_RULES.map((r,i)=>(<div key={i} style={{background:"#0d1a0d",border:"1px solid #1e3a1e",padding:"13px 18px",display:"flex",gap:18,alignItems:"flex-start"}}><div style={{minWidth:120,fontSize:9,letterSpacing:2,color:"#006400",fontFamily:"'Courier New',monospace",paddingTop:2,flexShrink:0}}>{r.rule.toUpperCase()}</div><div style={{fontSize:13,color:"#c8b89a",lineHeight:1.7,fontFamily:"'Georgia',serif"}}>{r.detail}</div></div>))}</div>)}
      {tab==="coaching"&&(<div style={{background:"#0d1a0d",border:"1px solid #1e3a1e",borderLeft:"4px solid #006400",padding:24}}><div style={{fontSize:9,letterSpacing:3,color:"#006400",fontFamily:"'Courier New',monospace",marginBottom:16}}>COACHING PRINCIPLES FOR U7 3v3</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{["Encourage both feet every session","Praise decision-making, not just goals","Rotate teams to maximise social development","Keep instructions under 30 seconds","Equal playing time for every child","Learn every player's name from day one","Use the game as the teacher","Focus on enjoyment — skills follow"].map((tip,i)=>(<div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{color:"#006400",fontSize:16,flexShrink:0}}>›</span><span style={{fontSize:13,color:"#c8b89a",lineHeight:1.7,fontFamily:"'Georgia',serif"}}>{tip}</span></div>))}</div></div>)}
    </div>
  );
}

// ─── FORMATS TABLE ────────────────────────────────────────────────────────────
function FormatsTable() {
  const [highlight, setHighlight] = useState(null);
  return (
    <div>
      <Tag label="OFFICIAL FORMATS" color="#B8860B"/>
      <h2 style={{fontSize:28,fontWeight:900,color:"#f0e6d0",margin:"8px 0 6px"}}>Age Group Formats & Pitch Sizes</h2>
      <p style={{fontSize:13,color:"#8a9a8a",marginBottom:20,lineHeight:1.7}}>All pitch sizes in metres. All pitches must have a minimum 3m run-off. * 24×8 also permitted &nbsp; ** 21×7 also permitted</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:20}}>
        <span style={{fontSize:10,color:"#555",fontFamily:"'Courier New',monospace",alignSelf:"center",marginRight:4}}>FILTER:</span>
        {Object.entries(FORMAT_COLORS).map(([fmt,col])=>(<button key={fmt} onClick={()=>setHighlight(highlight===fmt?null:fmt)} style={{background:highlight===fmt?col:"#0d1a0d",border:`1px solid ${col}`,color:highlight===fmt?"#fff":col,padding:"7px 16px",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:11,letterSpacing:2,transition:"all 0.2s",fontWeight:700}}>{fmt}</button>))}
        {highlight&&<button onClick={()=>setHighlight(null)} style={{background:"transparent",border:"1px solid #333",color:"#555",padding:"7px 12px",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:10}}>✕ Clear</button>}
      </div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{background:"#0a130a"}}>{["Age Group","Format","Ball","Rec. Pitch (m)","Min. Pitch (m)","Max. Pitch (m)","Goal (ft)"].map(h=>(<th key={h} style={{padding:"12px 14px",textAlign:"left",color:"#B8860B",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:2,borderBottom:"2px solid #B8860B40",whiteSpace:"nowrap"}}>{h}</th>))}</tr></thead>
          <tbody>{FORMATS_TABLE.map((row,i)=>{const col=FORMAT_COLORS[row.format];const active=!highlight||highlight===row.format;return(<tr key={i} style={{background:active?(i%2===0?"#0a130a":"#0d1a0d"):"#080c08",borderLeft:`3px solid ${active?col:"transparent"}`,opacity:active?1:0.2,transition:"all 0.25s"}}><td style={{padding:"11px 14px",color:active?"#f0e6d0":"#333",fontFamily:"'Georgia',serif",whiteSpace:"nowrap"}}>{row.age}</td><td style={{padding:"11px 14px"}}><span style={{background:active?col:"#1a1a1a",color:"#fff",padding:"3px 10px",fontFamily:"'Courier New',monospace",fontSize:11,fontWeight:700,letterSpacing:1,display:"inline-block"}}>{row.format}</span></td><td style={{padding:"11px 14px",color:active?"#c8b89a":"#333",fontFamily:"'Courier New',monospace"}}>{row.ball}</td><td style={{padding:"11px 14px",color:active?"#f0e6d0":"#333",fontFamily:"'Courier New',monospace",fontWeight:700}}>{row.recommended}</td><td style={{padding:"11px 14px",color:active?"#6a8a6a":"#222",fontFamily:"'Courier New',monospace"}}>{row.min}</td><td style={{padding:"11px 14px",color:active?"#6a8a6a":"#222",fontFamily:"'Courier New',monospace"}}>{row.max}</td><td style={{padding:"11px 14px",color:active?col:"#222",fontFamily:"'Courier New',monospace",fontWeight:700}}>{row.goal}</td></tr>);})}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FootballKnowledgeHub() {
  const [section, setSection] = useState("drills");
  const [faqOpen, setFaqOpen] = useState(null);

  const navItems = [
    {id:"ecd",label:"ECD",icon:"🌱"},
    {id:"3v3",label:"3v3",icon:"⚽"},
    {id:"drills",label:"Training Drills",icon:"🎽"},
    {id:"formats",label:"All Formats",icon:"🏟️"},
    {id:"faq",label:"FAQ",icon:"❓"},
  ];

  const FAQS = [
    {q:"What age can my child start?",a:"From age 3 with Tiny Boots activities at ECD. Organised 3v3 play begins at age 7 (Grade 2)."},
    {q:"How often should we train at each age?",a:"U8–U10: one session per week is sufficient. U12 and above: two sessions per week — one technical, one tactical."},
    {q:"What format does my child play at their age?",a:"Go to the All Formats tab — every age group from U7 to Open Age is listed with format, ball size, and pitch dimensions."},
    {q:"Why is there no goalkeeper in 3v3?",a:"Removing the goalkeeper gives every player more chances to develop ball skills and experience both attacking and defending."},
    {q:"Can ECD teachers run football sessions?",a:"Yes. The ECD activity cards are designed for teachers with no football background. One ball and open space is all you need."},
    {q:"What formation should I use for 7v7?",a:"The 2-3-1 is the most balanced development formation for 7v7 — two defenders, three midfielders, one forward."},
    {q:"Is the platform available in Shona?",a:"Hongu! The ECD section has a full Shona toggle. Tichadzidza pamwe chete — we learn together."},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#080e08",color:"#f0e6d0",fontFamily:"'Georgia',serif"}}>
      <GeometricPattern/>
      <header style={{background:"#060c06",borderBottom:"1px solid #1a2a1a",padding:"0 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,background:"linear-gradient(135deg,#006400,#B8860B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⚽</div>
            <div>
              <div style={{fontSize:8,letterSpacing:4,color:"#B8860B",fontFamily:"'Courier New',monospace"}}>GRASSROOTS SPORTS</div>
              <div style={{fontSize:17,fontWeight:900,color:"#f0e6d0",letterSpacing:1}}>Football Knowledge Hub</div>
            </div>
          </div>
          <nav style={{display:"flex",gap:0,flexWrap:"wrap"}}>
            {navItems.map(n=>(
              <button key={n.id} onClick={()=>setSection(n.id)} style={{background:"none",border:"none",color:section===n.id?"#B8860B":"#555",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:1,cursor:"pointer",padding:"6px 10px",borderBottom:section===n.id?"2px solid #B8860B":"2px solid transparent",transition:"all 0.2s",whiteSpace:"nowrap"}}>
                {n.icon} {n.label.toUpperCase()}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div style={{padding:"40px 24px",background:"linear-gradient(135deg,#060c06 0%,#0d1f0d 60%,#1a0a00 100%)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(45deg,#B8860B08 0,#B8860B08 1px,transparent 1px,transparent 28px),repeating-linear-gradient(-45deg,#00640008 0,#00640008 1px,transparent 1px,transparent 28px)`,pointerEvents:"none"}}/>
        <div style={{maxWidth:1100,margin:"0 auto",position:"relative"}}>
          <div style={{fontSize:9,letterSpacing:5,color:"#B8860B",fontFamily:"'Courier New',monospace",marginBottom:10}}>◆ ZIMBABWE'S FOOTBALL KNOWLEDGE PLATFORM</div>
          <h1 style={{fontSize:"clamp(22px,4vw,48px)",fontWeight:900,color:"#f0e6d0",margin:"0 0 10px",lineHeight:1.05,maxWidth:620}}>
            From ECD to 11v11.<br/><span style={{color:"#B8860B"}}>Zimbabwe's Full Football Pathway.</span>
          </h1>
          <p style={{fontSize:13,color:"#8a9a8a",maxWidth:500,lineHeight:1.8,marginBottom:24}}>
            ECD activities, 3v3 rules, training drills for every format, pitch size tables — all in one place. Built for Zimbabwe's coaches, teachers, and parents.
          </p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {navItems.map(n=>(
              <button key={n.id} onClick={()=>setSection(n.id)} style={{background:section===n.id?"#006400":"#0d1a0d",border:`1px solid ${section===n.id?"#006400":"#1e3a1e"}`,color:section===n.id?"#fff":"#6a8a6a",padding:"10px 18px",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:9,letterSpacing:2,transition:"all 0.2s"}}>
                {n.icon} {n.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"44px 24px"}}>
        {section==="ecd"&&<ECDSection/>}
        {section==="3v3"&&<ThreeVThreeSection/>}
        {section==="drills"&&<TrainingDrillsSection/>}
        {section==="formats"&&<FormatsTable/>}
        {section==="faq"&&(
          <div>
            <Tag label="FREQUENTLY ASKED QUESTIONS" color="#B8860B"/>
            <h2 style={{fontSize:28,fontWeight:900,color:"#f0e6d0",margin:"8px 0 24px"}}>Got Questions?</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {FAQS.map((faq,i)=>(
                <div key={i} onClick={()=>setFaqOpen(faqOpen===i?null:i)} style={{background:"#0d1a0d",border:`1px solid ${faqOpen===i?"#B8860B":"#1e3a1e"}`,padding:"16px 22px",cursor:"pointer",transition:"all 0.25s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
                    <p style={{fontSize:14,fontWeight:700,color:"#f0e6d0",margin:0,fontFamily:"'Georgia',serif"}}>{faq.q}</p>
                    <span style={{color:"#B8860B",flexShrink:0,fontSize:20}}>{faqOpen===i?"−":"+"}</span>
                  </div>
                  {faqOpen===i&&<p style={{marginTop:12,fontSize:13,color:"#8a9a8a",lineHeight:1.8,borderTop:"1px solid #1e3a1e",paddingTop:12,margin:"12px 0 0"}}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{marginTop:48}}>
          <DiamondDivider color="#B8860B"/>
          <div style={{background:"#0d1a0d",border:"1px solid #1e3a1e",padding:"24px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{fontSize:9,letterSpacing:3,color:"#B8860B",fontFamily:"'Courier New',monospace",marginBottom:6}}>ZIM@46 ◆ MUNHUMUTAPA CHALLENGE CUP</div>
              <p style={{fontSize:14,color:"#f0e6d0",margin:"0 0 4px",fontWeight:700,fontFamily:"'Georgia',serif"}}>Register your player, club or ECD centre today.</p>
              <p style={{fontSize:12,color:"#6a8a6a",margin:0}}>grassrootssports.live — Tichadzidza pamwe chete.</p>
            </div>
            <button style={{background:"#006400",border:"none",color:"#fff",padding:"13px 28px",fontFamily:"'Courier New',monospace",fontSize:10,letterSpacing:3,cursor:"pointer"}}>JOIN NOW →</button>
          </div>
        </div>
      </div>

      <GeometricPattern/>
      <footer style={{background:"#040804",padding:"20px 24px",textAlign:"center",borderTop:"1px solid #1a2a1a"}}>
        <div style={{fontSize:9,letterSpacing:4,color:"#B8860B",fontFamily:"'Courier New',monospace",marginBottom:4}}>GRASSROOTS SPORTS ◆ ZIMBABWE</div>
        <p style={{fontSize:11,color:"#3a5a3a",fontFamily:"'Courier New',monospace",margin:0}}>grassrootssports.live — Tichadzidza pamwe chete. We learn together.</p>
      </footer>
    </div>
  );
}
