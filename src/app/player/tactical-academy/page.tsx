"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

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

// ── Component ─────────────────────────────────────────────────────────────────

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
            Study these modules to improve your positioning, reading of the game, and decision-making.
          </p>
        </div>
      </div>

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
