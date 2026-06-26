/**
 * GET /api/world-cup/questions/[matchId]
 * Returns 25 MCQs for the match using AI, cached in-memory per match.
 */

import { NextRequest, NextResponse } from "next/server";

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number; // 0-indexed
  explanation: string;
  category: "tactical" | "technical" | "physical" | "mental" | "rules";
}

// In-memory cache: matchId → questions (lasts for process lifetime)
const cache = new Map<string, Question[]>();

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1, category: "tactical",
    question: "What is the primary purpose of a high press in football?",
    options: ["To tire out defenders", "To win the ball high up the pitch and limit opponent build-up", "To give attackers more space to run into", "To protect the central midfield"],
    correct: 1,
    explanation: "A high press forces the opposition to play long balls or make mistakes close to their own goal, creating turnovers in dangerous positions."
  },
  {
    id: 2, category: "tactical",
    question: "When a team uses a low defensive block, what is the main objective?",
    options: ["Score on the counter-attack", "Make play compact and deny space behind the defence", "Press the opposition goalkeeper", "Force offsides with a high line"],
    correct: 1,
    explanation: "A low block compresses space between the lines, making it difficult for the opposition to find penetrating passes."
  },
  {
    id: 3, category: "technical",
    question: "What does 'playing out from the back' mean?",
    options: ["Kicking long from the goalkeeper", "Building attacks through short passes from defenders and the goalkeeper", "Defenders overlapping wingers", "Centre-backs pushing into midfield"],
    correct: 1,
    explanation: "Playing out from the back creates numerical advantages in midfield and maintains ball possession from defensive positions."
  },
  {
    id: 4, category: "tactical",
    question: "What is a 'half-space' in modern football tactics?",
    options: ["The area between the sideline and the centre", "The space between the wide areas and the central lane", "The area just inside the opponent's half", "A position occupied by a withdrawn striker"],
    correct: 1,
    explanation: "The half-spaces are zones between wide and central areas where players can receive the ball facing forward, creating dilemmas for defenders."
  },
  {
    id: 5, category: "physical",
    question: "Which energy system is primarily used during a sprint in football?",
    options: ["Aerobic system", "Phosphocreatine (ATP-PC) system", "Lactic acid system", "Glycolytic system"],
    correct: 1,
    explanation: "Short explosive sprints of 1-6 seconds rely on the phosphocreatine system, which provides immediate energy without oxygen."
  },
  {
    id: 6, category: "tactical",
    question: "What does 'switching play' mean?",
    options: ["Changing the formation mid-match", "Moving the ball quickly from one flank to the other", "Swapping player positions", "Playing through the centre after a wide attack"],
    correct: 1,
    explanation: "Switching play shifts the ball to the weak side where defensive pressure is lower, creating space for attack."
  },
  {
    id: 7, category: "mental",
    question: "What is 'transition' in football?",
    options: ["Substituting players", "The moment of switching between attack and defence (or vice versa)", "Moving between formations", "Half-time tactical changes"],
    correct: 1,
    explanation: "Transitions are the critical moments immediately after gaining or losing possession — the fastest teams exploit them most effectively."
  },
  {
    id: 8, category: "technical",
    question: "What is the purpose of a 'dummy run'?",
    options: ["A fake shot at goal", "Running to create space for a teammate by dragging defenders away", "A practice run before kick-off", "A player overlapping the winger"],
    correct: 1,
    explanation: "A dummy run pulls defenders away, creating space for a teammate to receive the ball in a better position."
  },
  {
    id: 9, category: "tactical",
    question: "In a 4-3-3 formation, what are the typical roles of the three midfielders?",
    options: ["All three attack", "Defensive pivot, box-to-box, and advanced playmaker", "Two defenders one attacker", "All press high"],
    correct: 1,
    explanation: "The classic 4-3-3 midfield triangle has a defensive midfielder protecting the backline and two others covering and creating."
  },
  {
    id: 10, category: "rules",
    question: "When is a player in an offside position?",
    options: ["Anywhere in the opponent's half", "When any part of the body they can score with is closer to the goal line than both the ball and the second-last defender", "When behind the last defender", "When ahead of the halfway line"],
    correct: 1,
    explanation: "Offside is judged by any body part that can touch the ball — head, torso, or feet — being beyond the second-last defender at the moment the ball is played."
  },
  {
    id: 11, category: "tactical",
    question: "What does 'pressing triggers' refer to in football?",
    options: ["Signals to attack", "Specific moments or actions that initiate collective pressing", "Referee warnings", "Set piece routines"],
    correct: 1,
    explanation: "Pressing triggers are pre-agreed cues (e.g. a back-pass, a poor touch) that tell the whole team to begin pressing simultaneously."
  },
  {
    id: 12, category: "physical",
    question: "What is the approximate total distance covered by an outfield player in a 90-minute match?",
    options: ["3–5 km", "7–8 km", "10–13 km", "15–18 km"],
    correct: 2,
    explanation: "Elite outfield players typically cover 10–13 km per match, with midfielders often covering the most ground."
  },
  {
    id: 13, category: "technical",
    question: "What is a 'first-time pass'?",
    options: ["The first pass of the match", "Passing the ball immediately without taking a touch to control it", "A pass played from kick-off", "A diagonal pass across the pitch"],
    correct: 1,
    explanation: "First-time passing keeps the ball moving quickly, reduces pressure on the receiver, and is harder for opponents to press."
  },
  {
    id: 14, category: "tactical",
    question: "What is the role of a 'false 9' in football?",
    options: ["A goalkeeper wearing number 9", "A striker who drops deep to create space and overload midfield", "A winger playing as a striker", "A defensive midfielder"],
    correct: 1,
    explanation: "A false 9 drops into midfield, dragging centre-backs out of position and creating space for advanced midfielders to exploit."
  },
  {
    id: 15, category: "mental",
    question: "What does 'game intelligence' (IQ) mean in football?",
    options: ["A player's academic ability", "The ability to read the game, anticipate plays, and make smart decisions quickly", "Technical passing accuracy", "Physical fitness level"],
    correct: 1,
    explanation: "Football IQ is the mental ability to understand space, timing, and positioning — often separating good players from great ones."
  },
  {
    id: 16, category: "tactical",
    question: "What is 'overloading' in football tactics?",
    options: ["Having too many players", "Creating a numerical advantage in a specific area of the pitch", "Playing too direct", "Running too many sprints"],
    correct: 1,
    explanation: "Overloading creates 2v1 or 3v2 situations in specific zones, forcing the opposition to defend with numerical disadvantages."
  },
  {
    id: 17, category: "rules",
    question: "What is the distance defenders must stand from the ball during a free kick?",
    options: ["8 yards", "10 yards (9.15 metres)", "12 yards", "6 yards"],
    correct: 1,
    explanation: "All opponents must stand at least 9.15 metres (10 yards) from the ball during a free kick until it is played."
  },
  {
    id: 18, category: "technical",
    question: "What is the 'weak foot' development important for?",
    options: ["Only for goalkeepers", "Creating unpredictability, improving balance, and expanding passing/shooting options", "Mainly for defenders", "Required for set pieces only"],
    correct: 1,
    explanation: "A strong weak foot makes a player harder to defend against and opens up more areas of the pitch for both passing and shooting."
  },
  {
    id: 19, category: "physical",
    question: "What does 'high intensity running' mean in football analytics?",
    options: ["Any running during the match", "Running at speeds above 19.8 km/h", "Sprinting only", "Running with the ball"],
    correct: 1,
    explanation: "High intensity running (HIR) at speeds above 19.8 km/h is a key metric for measuring a player's physical contribution."
  },
  {
    id: 20, category: "tactical",
    question: "What is a 'defensive line' and why does its height matter?",
    options: ["The goalkeeper's position", "The horizontal line defenders form — higher means more territory but more risk behind", "The number of defenders", "The direction defenders face"],
    correct: 1,
    explanation: "A high defensive line compresses space in midfield and traps opponents offside, but leaves space behind for fast forwards to exploit."
  },
  {
    id: 21, category: "mental",
    question: "What is 'composure' on the ball?",
    options: ["Being physically strong", "Remaining calm, making correct decisions, and executing skills under pressure", "Dribbling ability", "Stamina during a match"],
    correct: 1,
    explanation: "Composure allows players to take an extra fraction of a second to make the right decision in high-pressure situations."
  },
  {
    id: 22, category: "technical",
    question: "What is 'pressing high' and when is it effective?",
    options: ["Defenders attacking", "Applying pressure on opponents in their own defensive third — most effective when well-organised and opponent has poor ball retention", "Winger pressing the full-back", "All players moving forward on corners"],
    correct: 1,
    explanation: "A high press works best against teams that struggle to play under pressure and when your team has the energy and organisation to maintain intensity."
  },
  {
    id: 23, category: "tactical",
    question: "What does 'shape' mean in a tactical context?",
    options: ["The physical fitness of players", "The organised positioning and structure of a team when defending or attacking", "The formation only", "How players look on the pitch"],
    correct: 1,
    explanation: "Shape refers to how a team maintains its formation and positional structure relative to the ball in both defensive and attacking phases."
  },
  {
    id: 24, category: "physical",
    question: "What is 'explosive power' and why is it important in football?",
    options: ["Shooting power only", "The ability to generate maximum force in minimum time — critical for sprints, jumps, and direction changes", "Physical strength for heading", "Stamina for 90 minutes"],
    correct: 1,
    explanation: "Explosive power determines a player's ability to accelerate past opponents, win aerial duels, and change direction quickly."
  },
  {
    id: 25, category: "tactical",
    question: "What is 'width' in attacking play?",
    options: ["How wide the goal is", "Using the full width of the pitch to stretch the defence and create space centrally", "The number of attackers", "Playing on the wings only"],
    correct: 1,
    explanation: "Attacking with width forces defenders to spread out, creating gaps centrally for through balls and combinations."
  },
];

async function generateQuestionsWithAI(matchId: string, matchContext: string): Promise<Question[]> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return FALLBACK_QUESTIONS;

  const prompt = `You are a football coaching educator. Generate 25 multiple-choice questions about the following match context for players to learn from.

Match context: ${matchContext}

Return ONLY a valid JSON array with exactly 25 objects. Each object must have:
- id: number (1-25)
- question: string (specific to this match where possible, general tactical otherwise)
- options: string[] (exactly 4 options)
- correct: number (0-indexed, which option is correct)
- explanation: string (2 sentences explaining why that answer is correct)
- category: one of "tactical" | "technical" | "physical" | "mental" | "rules"

Mix match-specific questions (about phases, teams, strategies seen) with general football knowledge questions. Make questions educational and appropriate for grassroots players aged 13-25.

Return only the JSON array, no markdown.`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!res.ok) return FALLBACK_QUESTIONS;
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return FALLBACK_QUESTIONS;
    const questions = JSON.parse(jsonMatch[0]) as Question[];
    if (!Array.isArray(questions) || questions.length < 20) return FALLBACK_QUESTIONS;
    return questions.slice(0, 25);
  } catch {
    return FALLBACK_QUESTIONS;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  // Return cached questions if available
  if (cache.has(matchId)) {
    return NextResponse.json({ questions: cache.get(matchId) });
  }

  // Try to get match context from query param
  const url = new URL(req.url);
  const matchContext = url.searchParams.get("context") ?? `World Cup match ${matchId}`;

  const questions = await generateQuestionsWithAI(matchId, matchContext);
  cache.set(matchId, questions);

  return NextResponse.json({ questions });
}
