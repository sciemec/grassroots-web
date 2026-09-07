"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Position = {
  id: string;
  label: string;
  role: string;
  x: number; // 0–100 percent across pitch width
  y: number; // 0–100 percent down pitch height (0 = attack end, 100 = GK end)
};

type Formation = {
  id: string;
  name: string;
  description: string;
  positions: Position[];
};

// ── Formation data ─────────────────────────────────────────────────────────────

const FORMATIONS: Formation[] = [
  {
    id: "4-3-3",
    name: "4-3-3",
    description:
      "Wide attacking shape. Three forwards pin fullbacks. Press as a unit or not at all.",
    positions: [
      {
        id: "gk",
        label: "GK",
        role: "Goalkeeper — last line of defence. Commands the box, distributes quickly, organises the defensive line. Must sweep behind a high defensive line.",
        x: 50,
        y: 90,
      },
      {
        id: "rb",
        label: "RB",
        role: "Right Back — defends wide right and supports attacks by overlapping the right winger. Must track runs from opposing left wingers and recover quickly.",
        x: 82,
        y: 73,
      },
      {
        id: "rcb",
        label: "RCB",
        role: "Right Centre Back — covers the right channel, wins aerial duels, and plays out from the back confidently. Slides across when the LCB steps.",
        x: 63,
        y: 73,
      },
      {
        id: "lcb",
        label: "LCB",
        role: "Left Centre Back — covers the left channel and organises the defensive line. The sweeper of the pair — reads the game behind the RCB.",
        x: 37,
        y: 73,
      },
      {
        id: "lb",
        label: "LB",
        role: "Left Back — defends wide left and overlaps the left winger to create 2v1 situations. Key to the width of the team in possession.",
        x: 18,
        y: 73,
      },
      {
        id: "rcm",
        label: "RCM",
        role: "Right Central Midfielder — box-to-box role. Arrives late into the box from deep, supports the right forward on counter-attacks.",
        x: 72,
        y: 52,
      },
      {
        id: "dm",
        label: "DM",
        role: "Defensive Midfielder (No. 6) — sits in front of the back four. Intercepts, recycles, dictates tempo. Must never be caught in possession in dangerous areas. Zimbabwe example: Marvelous Nakamba.",
        x: 50,
        y: 57,
      },
      {
        id: "lcm",
        label: "LCM",
        role: "Left Central Midfielder — supports the left forward and provides defensive cover. High work rate. Presses with the front three when the trigger fires.",
        x: 28,
        y: 52,
      },
      {
        id: "rw",
        label: "RW",
        role: "Right Winger — hugs the touchline to pin the fullback, then cuts inside or delivers early crosses. Must track back and press from the front.",
        x: 82,
        y: 25,
      },
      {
        id: "cf",
        label: "CF",
        role: "Centre Forward — leads the attack, holds the ball up under pressure, makes runs in behind the defensive line, and finishes chances. The team's reference point.",
        x: 50,
        y: 18,
      },
      {
        id: "lw",
        label: "LW",
        role: "Left Winger — mirrors the right winger on the opposite flank. Creates goal threats from wide and must contribute to the press when the team is out of possession.",
        x: 18,
        y: 25,
      },
    ],
  },
  {
    id: "4-4-2",
    name: "4-4-2",
    description:
      "The classic. Two compact banks of four press together. Strikers hunt in a pair.",
    positions: [
      {
        id: "gk",
        label: "GK",
        role: "Goalkeeper — organises the compact defensive block. Quick distribution to restart attacks quickly is vital. Sweeps crosses from wide.",
        x: 50,
        y: 90,
      },
      {
        id: "rb",
        label: "RB",
        role: "Right Back — stays disciplined in the defensive block. Supports the right midfielder when the team attacks and recovers fast on transition.",
        x: 82,
        y: 73,
      },
      {
        id: "rcb",
        label: "RCB",
        role: "Right Centre Back — strong in the air and in the tackle. Keeps the defensive line tight with the LCB and wins second balls.",
        x: 63,
        y: 73,
      },
      {
        id: "lcb",
        label: "LCB",
        role: "Left Centre Back — covers the LCB. Sweeps behind the rest of the line and is the last resort before the goalkeeper.",
        x: 37,
        y: 73,
      },
      {
        id: "lb",
        label: "LB",
        role: "Left Back — tracks the opposing right winger tightly. Occasionally overlaps but must stay disciplined in the defensive shape.",
        x: 18,
        y: 73,
      },
      {
        id: "rm",
        label: "RM",
        role: "Right Midfielder — works up and down the right channel all game. A key press trigger from wide — shows the opposition fullback down the line.",
        x: 82,
        y: 52,
      },
      {
        id: "rcm",
        label: "RCM",
        role: "Right Central Midfielder — presses centrally alongside the LCM. Blocks the central passing lanes and arrives in the box late from deep.",
        x: 62,
        y: 55,
      },
      {
        id: "lcm",
        label: "LCM",
        role: "Left Central Midfielder — screens the defence with the RCM. Breaks up attacks and starts counter-attacks with simple forward passes.",
        x: 38,
        y: 55,
      },
      {
        id: "lm",
        label: "LM",
        role: "Left Midfielder — works the left channel like the RM works the right. Creates width and presses the opposition right back into mistakes.",
        x: 18,
        y: 52,
      },
      {
        id: "rs",
        label: "RS",
        role: "Right Striker — one half of the strike partnership. Leads the press from the front, targets the right channel, and links with the LS in and around the box.",
        x: 65,
        y: 24,
      },
      {
        id: "ls",
        label: "LS",
        role: "Left Striker — the other half of the partnership. Holds up play when the RS presses, and runs in behind when the RS drops deep to link play.",
        x: 35,
        y: 24,
      },
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    description:
      "Dominant midfield shape. Double pivot protects defence. The No. 10 links everything.",
    positions: [
      {
        id: "gk",
        label: "GK",
        role: "Goalkeeper — sweeper-keeper role. Steps up aggressively to deal with balls played over the high defensive line. Comfortable with the ball at feet.",
        x: 50,
        y: 90,
      },
      {
        id: "rb",
        label: "RB",
        role: "Right Back — pushes high to create a back-three in possession. Overlaps the right AM and creates 2v1s down the flank.",
        x: 82,
        y: 73,
      },
      {
        id: "rcb",
        label: "RCB",
        role: "Right Centre Back — holds the defensive line when the RB attacks. Comfortable on the ball and able to play long switches.",
        x: 63,
        y: 73,
      },
      {
        id: "lcb",
        label: "LCB",
        role: "Left Centre Back — mirrors the RCB. Important for the team's build-up play — the team starts from the back in this system.",
        x: 37,
        y: 73,
      },
      {
        id: "lb",
        label: "LB",
        role: "Left Back — overlaps the left AM and creates 2v1s down the left side. Provides the same width the LM would give in a 4-4-2.",
        x: 18,
        y: 73,
      },
      {
        id: "rdm",
        label: "RDM",
        role: "Right Defensive Midfielder (Double Pivot) — one half of the pivot. Screens the defence and covers space when the LDM pushes forward.",
        x: 62,
        y: 60,
      },
      {
        id: "ldm",
        label: "LDM",
        role: "Left Defensive Midfielder (Double Pivot) — the other half of the pivot. Works with the RDM — both must never be caught forward at the same time.",
        x: 38,
        y: 60,
      },
      {
        id: "ram",
        label: "RAM",
        role: "Right Attacking Midfielder — runs beyond the striker from the right half-space. Creates overloads and provides a second goal threat from deep.",
        x: 78,
        y: 36,
      },
      {
        id: "cam",
        label: "CAM",
        role: "Central Attacking Midfielder (No. 10) — the creative hub of the team. Drops between the lines, turns under pressure, and unlocks defences with through-balls.",
        x: 50,
        y: 38,
      },
      {
        id: "lam",
        label: "LAM",
        role: "Left Attacking Midfielder — mirrors the RAM on the left. Provides width and cuts inside to shoot or slip the striker in behind.",
        x: 22,
        y: 36,
      },
      {
        id: "st",
        label: "ST",
        role: "Striker — lone focal point of the attack. Holds the ball up under heavy pressure, links with the CAM, and makes intelligent runs in behind the defensive line.",
        x: 50,
        y: 16,
      },
    ],
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    description:
      "Overloaded midfield. Wing-backs provide the width. Three CBs cover the wide channels.",
    positions: [
      {
        id: "gk",
        label: "GK",
        role: "Goalkeeper — communicates constantly with the three centre backs. Sweeps behind them aggressively when the wing-backs push forward.",
        x: 50,
        y: 90,
      },
      {
        id: "rcb",
        label: "RCB",
        role: "Right Centre Back — covers the channel vacated by the RWB when they attack. Must be mobile and able to recover quickly in behind.",
        x: 72,
        y: 75,
      },
      {
        id: "cb",
        label: "CB",
        role: "Central Centre Back — the leader of the three-man line. Reads the game, wins everything aerial, organises the unit, and sweeps up loose balls.",
        x: 50,
        y: 77,
      },
      {
        id: "lcb",
        label: "LCB",
        role: "Left Centre Back — covers the LWB channel. Must be as mobile and comfortable on the ball as the other two CBs in this system.",
        x: 28,
        y: 75,
      },
      {
        id: "rwb",
        label: "RWB",
        role: "Right Wing-Back — the entire right side of the team. Sprints forward to join attacks, delivers crosses, then sprints back to defend. Must be an elite athlete.",
        x: 88,
        y: 52,
      },
      {
        id: "rcm",
        label: "RCM",
        role: "Right Central Midfielder — supports the RWB in attack and covers the right channel when the RWB is forward. High defensive awareness needed.",
        x: 68,
        y: 54,
      },
      {
        id: "cm",
        label: "CM",
        role: "Central Midfielder — the engine of the five-man midfield. Wins second balls, dictates tempo, breaks up attacks. The most important cog in this system.",
        x: 50,
        y: 57,
      },
      {
        id: "lcm",
        label: "LCM",
        role: "Left Central Midfielder — mirrors the RCM on the left. Covers when the LWB pushes forward and provides an extra man in central pressing situations.",
        x: 32,
        y: 54,
      },
      {
        id: "lwb",
        label: "LWB",
        role: "Left Wing-Back — mirrors the RWB on the left side. Provides the width a left midfielder would give in a 4-man midfield. End-to-end athlete.",
        x: 12,
        y: 52,
      },
      {
        id: "rs",
        label: "RS",
        role: "Right Striker — targets the space between the centre back and where the right back would be. Links play with the LS and the midfield runners.",
        x: 65,
        y: 22,
      },
      {
        id: "ls",
        label: "LS",
        role: "Left Striker — the other half of the partnership. One striker holds up, one runs in behind — which role each player takes depends on the situation.",
        x: 35,
        y: 22,
      },
    ],
  },
];

// ── Lesson data ───────────────────────────────────────────────────────────────

const MODULES = [
  {
    id: "positioning",
    title: "Positioning & Shape",
    color: "#22c55e",
    bg: "#052e16",
    lessons: [
      {
        title: "Why Shape Matters",
        body: `A team's shape is its skeleton. Without it, players drift, space opens up, and the opposition exploits gaps easily.

A good shape means every player knows exactly where to stand when your team has the ball (attacking shape) and where to stand when you don't (defensive shape).

Key principle: Compact when defending. Stretched when attacking. The transition between the two must be fast.`,
      },
      {
        title: "Defensive Line Height",
        body: `The defensive line is the imaginary horizontal line your back four or three hold together.

Too deep → you invite pressure and give the opposition too much space to play in front of you.
Too high → you risk being caught by a ball over the top.

The rule: your line should be as high as the last confident ball the opposition can play. Communicate constantly. If the goalkeeper steps forward, the line moves up.`,
      },
      {
        title: "Cover & Balance",
        body: `Cover: one player marks the ball, another covers in behind them in case the first is beaten.
Balance: a third player positions on the weak side to stop a switch of play causing danger.

Example: right winger has the ball → right back engages → centre back slides across to cover → left back tucks in for balance. This triangle is the foundation of all defensive positioning.`,
      },
      {
        title: "Movement Off the Ball",
        body: `Most of a footballer's work happens without the ball. Movement off the ball creates space for teammates and options for the player in possession.

Three types of run:
1. Run in behind — exploits a high defensive line.
2. Run across — drags a defender out of position to create space for another player.
3. Checking run — move toward the ball to receive to feet, then spin away.

Always ask: where do I need to be so my teammate has an option?`,
      },
    ],
  },
  {
    id: "formations",
    title: "Formations & Roles",
    color: "#f0b429",
    bg: "#291805",
    lessons: [
      {
        title: "4-3-3: Attacking Width",
        body: `The 4-3-3 uses width to stretch defences. Two wide forwards hug the touchlines to pin fullbacks back, leaving space in the half-spaces between the centre back and fullback.

The three midfielders split into one holding role (DM) who stays disciplined, and two box-to-box midfielders who link defence to attack.

Key demand: the wide forwards must track back. A 4-3-3 that doesn't press is a 4-3-3 that leaks on the counter.`,
      },
      {
        title: "4-4-2: Compact Pressing",
        body: `The classic. Two banks of four — a tight, compact shape designed to press in pairs and deny the opposition time.

The two strikers press the centre backs and channel the ball wide. The midfield four squeeze across and cut off passing lanes. At its best, the 4-4-2 is relentless.

Weakness: the space between the lines. A skilful 10 dropping between the two banks can cause problems. The midfield must step and squeeze aggressively to close this gap.`,
      },
      {
        title: "3-5-2: Overloading Midfield",
        body: `Three at the back frees two wing-backs to push high and join attacks. The five-man midfield outnumbers most opponents.

The three centre backs form a triangle: the central one reads the game, the two wide ones cover the channels left by the wing-backs going forward.

Key: the wing-backs must be athletes. They need the stamina to sprint end-to-end throughout the game.`,
      },
      {
        title: "Role: The Deep-Lying Midfielder",
        body: `The engine room of the team. This player sits in front of the back line, receives the ball under pressure, and pings it out quickly to restart attacks.

What they must do:
— Never be caught in possession in their own half.
— Always offer an easy pass to the centre backs under pressure.
— Read second balls and intercept.
— Dictate the tempo — slow it down or speed it up.

In Zimbabwe, this player is often called the "water carrier." Great example globally: Sergio Busquets, Marvelous Nakamba.`,
      },
    ],
  },
  {
    id: "pressing",
    title: "Pressing & Transitions",
    color: "#60a5fa",
    bg: "#0c1a2e",
    lessons: [
      {
        title: "What Is Pressing?",
        body: `Pressing is coordinated, high-intensity pressure on the ball carrier to win the ball back quickly or force a mistake.

It is NOT random chasing. When one player presses, the rest of the team must simultaneously move to block passing options. Press as a unit or not at all.

The trigger to press: a poor touch, a backwards pass, a throw-in, a goalkeeper with the ball.`,
      },
      {
        title: "The Press Trap",
        body: `A press trap is a designed move to force the ball into a pre-planned area where your team outnumbers the opposition.

Classic trap: allow the opposition full back to have the ball. Show them toward the touchline. As they receive, the wide midfielder closes, the central midfielder cuts off the inside pass, and the forward blocks the return to the centre back. The full back is trapped — they must play long or lose the ball.`,
      },
      {
        title: "Transition: Defending After Losing the Ball",
        body: `The 3–5 seconds immediately after losing possession are the most dangerous moment in football. The opposition is in motion, your team is out of shape.

Counter-press rule: the 2 or 3 nearest players immediately close the ball. Don't retreat. Win it back before the opposition can organise.

If you cannot win it back within 5 seconds, drop into your shape and defend organised.`,
      },
      {
        title: "Transition: Attacking After Winning the Ball",
        body: `The moment you win the ball, the opposition is disorganised. This is the best moment to attack — directly and quickly.

Rule: look forward first. If there is a run in behind and a pass available, play it immediately. Don't slow down to be safe.

Vertical passes that bypass lines of defenders are worth more than 10 safe sideways passes.`,
      },
    ],
  },
  {
    id: "decision",
    title: "Decision-Making",
    color: "#c084fc",
    bg: "#1a0a2e",
    lessons: [
      {
        title: "Scan Before You Receive",
        body: `The best players know what they will do with the ball BEFORE it arrives at their feet. This is called scanning — looking around to build a picture of the game.

Scan every 2–3 seconds. Check over your shoulder, especially in the half-second before the ball arrives.

What to scan for: the position of defenders, the runs of teammates, space behind the defensive line.`,
      },
      {
        title: "The 3-Option Rule",
        body: `Every time you have the ball, identify at least 3 options before you decide.

Option 1 — the forward pass (most dangerous to the opponent).
Option 2 — the pass across (maintains possession, changes the angle).
Option 3 — the backward pass (recycles to try again).

Always attempt Option 1 first. Only move to 2 or 3 if Option 1 is blocked. Players who always go backwards never break lines.`,
      },
      {
        title: "When to Dribble, When to Pass",
        body: `Dribble when:
— You are 1v1 with a clear path to goal or a key area.
— You can draw a second defender and then release.
— There is no forward passing option.

Pass when:
— A teammate is in a better position than you.
— A dribble would put you under pressure in a dangerous area.
— The run in behind is on and you can find it.

The most common mistake: dribbling when a pass was clearly better. The second most common: passing safe when a dribble would have won the game.`,
      },
      {
        title: "Reading the Game",
        body: `The best players see patterns before they happen. They recognise when:
— The defensive line is too high (play in behind).
— The midfield is too narrow (switch to the wide player).
— A teammate is making a run (release early).

How to improve game-reading: watch football. Not just highlight clips — watch full games. Predict what will happen next. Pause and think about why the coach made a substitution.

Study the game. Zimbabwe has produced players who read the game at the highest level. Train your mind as hard as you train your body.`,
      },
    ],
  },
];

// ── Tactical Board Component ──────────────────────────────────────────────────

const PITCH_W = 300;
const PITCH_H = 400;
const MARGIN = 12;
const INNER_W = PITCH_W - MARGIN * 2;
const INNER_H = PITCH_H - MARGIN * 2;

function toSvg(px: number, py: number) {
  return {
    cx: MARGIN + (px / 100) * INNER_W,
    cy: MARGIN + (py / 100) * INNER_H,
  };
}

function TacticalBoard() {
  const [selectedFormation, setSelectedFormation] = useState<string>("4-3-3");
  const [selectedPlayer, setSelectedPlayer] = useState<Position | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);

  const formation = FORMATIONS.find((f) => f.id === selectedFormation)!;

  async function getAiBreakdown() {
    setAiLoading(true);
    setAiText(null);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Give me a concise tactical breakdown of the ${formation.name} formation for a grassroots Zimbabwean football team. Cover: (1) key strengths, (2) main vulnerabilities, (3) the most important player role, and (4) one pressing trigger the coach should drill. Keep it practical and under 200 words.`,
          system_prompt:
            "You are an experienced football tactician and coach educator. Explain formations in plain language that a grassroots Zimbabwean coach or player can immediately apply. Be direct and actionable.",
        }),
      });
      const data = await res.json();
      setAiText(data.response ?? data.answer ?? "No response received.");
    } catch {
      setAiText("Could not reach the AI. Check your connection and try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div style={{ padding: "0 16px 24px" }}>
      <div
        style={{
          background: "#111",
          borderRadius: 16,
          border: "1px solid #222",
          overflow: "hidden",
        }}
      >
        {/* Board header */}
        <div style={{ padding: "14px 16px 10px" }}>
          <div
            style={{
              color: "#c8962a",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Tactical Board
          </div>
          <p style={{ color: "#777", fontSize: 12, margin: 0 }}>
            Tap a player dot to learn their role
          </p>
        </div>

        {/* Formation selector */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 16px 12px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {FORMATIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setSelectedFormation(f.id);
                setSelectedPlayer(null);
                setAiText(null);
              }}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 999,
                border: `1px solid ${selectedFormation === f.id ? "#c8962a" : "#333"}`,
                background: selectedFormation === f.id ? "#2a1e05" : "transparent",
                color: selectedFormation === f.id ? "#c8962a" : "#777",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Formation description */}
        <div style={{ padding: "0 16px 12px" }}>
          <p style={{ color: "#888", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            {formation.description}
          </p>
        </div>

        {/* SVG Pitch */}
        <div style={{ padding: "0 16px 16px" }}>
          <svg
            viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
            style={{ width: "100%", borderRadius: 10, display: "block" }}
          >
            {/* Pitch background */}
            <rect x={0} y={0} width={PITCH_W} height={PITCH_H} fill="#0d3d1a" rx={10} />

            {/* Alternating pitch stripes */}
            {[0, 1, 2, 3, 4].map((i) => (
              <rect
                key={i}
                x={MARGIN}
                y={MARGIN + i * (INNER_H / 5)}
                width={INNER_W}
                height={INNER_H / 5}
                fill={i % 2 === 0 ? "#0f4520" : "#0d3d1a"}
              />
            ))}

            {/* Outer pitch border */}
            <rect
              x={MARGIN}
              y={MARGIN}
              width={INNER_W}
              height={INNER_H}
              fill="none"
              stroke="#2a7a3c"
              strokeWidth={1.5}
            />

            {/* Centre line */}
            <line
              x1={MARGIN}
              y1={PITCH_H / 2}
              x2={PITCH_W - MARGIN}
              y2={PITCH_H / 2}
              stroke="#2a7a3c"
              strokeWidth={1}
            />

            {/* Centre circle */}
            <circle
              cx={PITCH_W / 2}
              cy={PITCH_H / 2}
              r={32}
              fill="none"
              stroke="#2a7a3c"
              strokeWidth={1}
            />
            <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={2} fill="#2a7a3c" />

            {/* Top penalty area (attack end) */}
            <rect
              x={PITCH_W / 2 - 65}
              y={MARGIN}
              width={130}
              height={58}
              fill="none"
              stroke="#2a7a3c"
              strokeWidth={1}
            />
            {/* Top 6-yard box */}
            <rect
              x={PITCH_W / 2 - 28}
              y={MARGIN}
              width={56}
              height={22}
              fill="none"
              stroke="#2a7a3c"
              strokeWidth={1}
            />
            {/* Top penalty spot */}
            <circle cx={PITCH_W / 2} cy={MARGIN + 38} r={2} fill="#2a7a3c" />

            {/* Bottom penalty area (GK end) */}
            <rect
              x={PITCH_W / 2 - 65}
              y={PITCH_H - MARGIN - 58}
              width={130}
              height={58}
              fill="none"
              stroke="#2a7a3c"
              strokeWidth={1}
            />
            {/* Bottom 6-yard box */}
            <rect
              x={PITCH_W / 2 - 28}
              y={PITCH_H - MARGIN - 22}
              width={56}
              height={22}
              fill="none"
              stroke="#2a7a3c"
              strokeWidth={1}
            />
            {/* Bottom penalty spot */}
            <circle cx={PITCH_W / 2} cy={PITCH_H - MARGIN - 38} r={2} fill="#2a7a3c" />

            {/* Attack direction label */}
            <text
              x={PITCH_W / 2}
              y={MARGIN - 3}
              textAnchor="middle"
              fill="#2a7a3c"
              fontSize={7}
              fontWeight="600"
            >
              ▲ ATTACK
            </text>

            {/* Player dots */}
            {formation.positions.map((pos) => {
              const { cx, cy } = toSvg(pos.x, pos.y);
              const isSelected = selectedPlayer?.id === pos.id;
              return (
                <g
                  key={pos.id}
                  onClick={() =>
                    setSelectedPlayer(isSelected ? null : pos)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 14 : 12}
                    fill={isSelected ? "#c8962a" : "#1a3d26"}
                    stroke={isSelected ? "#fac775" : "#22c55e"}
                    strokeWidth={isSelected ? 2 : 1.5}
                  />
                  <text
                    x={cx}
                    y={cy + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? "#fff" : "#c0dd97"}
                    fontSize={pos.label.length > 2 ? 6 : 7}
                    fontWeight="700"
                  >
                    {pos.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Role info panel */}
        {selectedPlayer && (
          <div
            style={{
              margin: "0 16px 16px",
              background: "#1a3d26",
              border: "1px solid #2d6b42",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                color: "#c8962a",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              {selectedPlayer.label} — Role
            </div>
            <p
              style={{
                color: "#c0dd97",
                fontSize: 12.5,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {selectedPlayer.role}
            </p>
          </div>
        )}

        {/* AI breakdown button */}
        <div style={{ padding: "0 16px 16px" }}>
          <button
            onClick={getAiBreakdown}
            disabled={aiLoading}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 10,
              border: "none",
              background: aiLoading ? "#333" : "#c8962a",
              color: aiLoading ? "#888" : "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: aiLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {aiLoading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {aiLoading ? "Analysing…" : `Get AI Breakdown — ${formation.name}`}
          </button>

          {aiText && (
            <div
              style={{
                marginTop: 12,
                background: "#0c1a2e",
                border: "1px solid #1e3a5f",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  color: "#60a5fa",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                AI Tactical Analysis
              </div>
              {aiText.split("\n").filter(Boolean).map((line, i) => (
                <p
                  key={i}
                  style={{
                    color: "#93c5fd",
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    margin: i === 0 ? 0 : "8px 0 0",
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TacticalAcademyPage() {
  const [expandedModule, setExpandedModule] = useState<string | null>("positioning");
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: 64 }}>

      {/* Header */}
      <div style={{ padding: "24px 16px 16px" }}>
        <Link
          href="/player"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#c8962a",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          <ArrowLeft size={16} />
          Player Hub
        </Link>

        <div
          style={{
            color: "#c8962a",
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          Grassroots Sports
        </div>
        <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0 }}>
          Tactical Academy
        </h1>
        <p style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
          Positioning · Formations · Pressing · Decision-making
        </p>
      </div>

      {/* Intro card */}
      <div style={{ padding: "0 16px 20px" }}>
        <div
          style={{
            background: "#1a3d26",
            border: "1px solid #2d6b42",
            borderRadius: 12,
            padding: "14px 16px",
          }}
        >
          <p style={{ color: "#c0dd97", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            The best players in the world understand the game as well as they play it.
            Use the tactical board below to explore formations, then study the lesson modules
            to sharpen your positioning, shape, and decision-making.
          </p>
        </div>
      </div>

      {/* Tactical Board */}
      <TacticalBoard />

      {/* Modules */}
      <div style={{ padding: "0 16px" }}>
        {MODULES.map((mod) => {
          const isOpen = expandedModule === mod.id;
          return (
            <div
              key={mod.id}
              style={{ marginBottom: 12, borderRadius: 14, overflow: "hidden", border: `1px solid ${mod.color}22` }}
            >
              {/* Module header */}
              <button
                onClick={() => setExpandedModule(isOpen ? null : mod.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: mod.bg,
                  border: "none",
                  padding: "14px 16px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{ color: mod.color, fontSize: 14, fontWeight: 700 }}>{mod.title}</span>
                <span style={{ color: mod.color, opacity: 0.7 }}>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>

              {/* Lessons */}
              {isOpen && (
                <div style={{ background: "#111" }}>
                  {mod.lessons.map((lesson, li) => {
                    const lessonKey = `${mod.id}-${li}`;
                    const lessonOpen = expandedLesson === lessonKey;
                    return (
                      <div
                        key={lessonKey}
                        style={{ borderTop: `1px solid #1e1e1e` }}
                      >
                        <button
                          onClick={() => setExpandedLesson(lessonOpen ? null : lessonKey)}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "transparent",
                            border: "none",
                            padding: "12px 16px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: "50%",
                                background: `${mod.color}22`,
                                border: `1px solid ${mod.color}55`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                color: mod.color,
                                flexShrink: 0,
                              }}
                            >
                              {li + 1}
                            </div>
                            <span style={{ color: "#e5e7eb", fontSize: 13, fontWeight: 500 }}>
                              {lesson.title}
                            </span>
                          </div>
                          <span style={{ color: "#555", flexShrink: 0, marginLeft: 8 }}>
                            {lessonOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        </button>

                        {lessonOpen && (
                          <div style={{ padding: "0 16px 16px 48px" }}>
                            {lesson.body.trim().split("\n\n").map((para, pi) => (
                              <p
                                key={pi}
                                style={{
                                  color: "#9ca3af",
                                  fontSize: 13,
                                  lineHeight: 1.7,
                                  margin: pi === 0 ? 0 : "10px 0 0",
                                }}
                              >
                                {para}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "24px 16px 0", textAlign: "center" }}>
        <p style={{ color: "#444", fontSize: 11.5 }}>
          Study the game. Train the mind. Get recognised.
        </p>
      </div>
    </div>
  );
}
