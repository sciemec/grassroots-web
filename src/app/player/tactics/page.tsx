"use client";
// src/app/player/tactics/page.tsx
// Position-aware Tactics Academy for players
// Free: 4-3-3 + 4-4-2, 3 simulations | Pro: all formations + unlimited sims

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Lock, ChevronLeft, ChevronDown, ChevronUp, Layers, Zap, CheckCircle2, XCircle } from "lucide-react";
import { FORMATION_LIBRARY } from "@/lib/thuto-tactics-knowledge";

// ── Types ──────────────────────────────────────────────────────────────────────

type PosKey = "GK" | "CB" | "FB" | "DM" | "CM" | "WM" | "AM" | "ST";

interface PitchToken { label: string; x: number; y: number; }
interface Duties { role: string; duties: [string, string, string]; tip: string; }

interface SimScenario {
  situation: string;
  question: string;
  options: { id: string; label: string }[];
  correct: string;
  explanation: string;
}

// ── Position detection ─────────────────────────────────────────────────────────

function detectPositionKey(raw: string | null | undefined): PosKey {
  if (!raw) return "CM";
  const p = raw.toLowerCase();
  if (p.includes("goalkeeper") || p.includes("gk")) return "GK";
  if (p.includes("centre-back") || p.includes("center back") || p.includes("cb")) return "CB";
  if (p.includes("full") || p.includes("fb") || p.includes("left back") || p.includes("right back")) return "FB";
  if (p.includes("defensive mid") || p.includes("holding") || p.includes("dm") || p.includes("cdm")) return "DM";
  if (p.includes("central mid") || p.includes("cm") || p.includes("box-to-box")) return "CM";
  if (p.includes("wing") || p.includes("winger") || p.includes("wm") || p === "lw" || p === "rw") return "WM";
  if (p.includes("attacking mid") || p.includes("number 10") || p.includes("am") || p.includes("cam")) return "AM";
  if (p.includes("striker") || p.includes("forward") || p.includes("st") || p.includes("centre forward")) return "ST";
  return "CM";
}

const POS_LABELS: Record<PosKey, string[]> = {
  GK: ["GK"],
  CB: ["CB"],
  FB: ["LB", "RB"],
  DM: ["DM"],
  CM: ["CM"],
  WM: ["LW", "RW", "RM", "LM"],
  AM: ["AM", "CAM"],
  ST: ["ST", "CF"],
};

const POS_DISPLAY: Record<PosKey, string> = {
  GK: "Goalkeeper",
  CB: "Centre-Back",
  FB: "Full-Back",
  DM: "Defensive Mid",
  CM: "Central Mid",
  WM: "Winger",
  AM: "Attacking Mid",
  ST: "Striker",
};

// ── Formations (SVG 150x210 viewBox) ──────────────────────────────────────────

const FORMATIONS: Record<string, PitchToken[]> = {
  "4-3-3": [
    { label: "GK", x: 75, y: 197 },
    { label: "RB", x: 120, y: 165 }, { label: "CB", x: 90, y: 153 },
    { label: "CB", x: 60, y: 153 }, { label: "LB", x: 30, y: 165 },
    { label: "CM", x: 112, y: 110 }, { label: "DM", x: 75, y: 118 }, { label: "CM", x: 38, y: 110 },
    { label: "RW", x: 122, y: 63 }, { label: "ST", x: 75, y: 50 }, { label: "LW", x: 28, y: 63 },
  ],
  "4-4-2": [
    { label: "GK", x: 75, y: 197 },
    { label: "RB", x: 120, y: 165 }, { label: "CB", x: 90, y: 155 },
    { label: "CB", x: 60, y: 155 }, { label: "LB", x: 30, y: 165 },
    { label: "RM", x: 122, y: 110 }, { label: "CM", x: 95, y: 118 },
    { label: "CM", x: 55, y: 118 }, { label: "LM", x: 28, y: 110 },
    { label: "ST", x: 100, y: 55 }, { label: "ST", x: 50, y: 55 },
  ],
  "4-2-3-1": [
    { label: "GK", x: 75, y: 197 },
    { label: "RB", x: 120, y: 165 }, { label: "CB", x: 90, y: 155 },
    { label: "CB", x: 60, y: 155 }, { label: "LB", x: 30, y: 165 },
    { label: "DM", x: 95, y: 120 }, { label: "DM", x: 55, y: 120 },
    { label: "RW", x: 120, y: 80 }, { label: "AM", x: 75, y: 80 }, { label: "LW", x: 30, y: 80 },
    { label: "ST", x: 75, y: 45 },
  ],
  "3-5-2": [
    { label: "GK", x: 75, y: 197 },
    { label: "CB", x: 112, y: 160 }, { label: "CB", x: 75, y: 152 }, { label: "CB", x: 38, y: 160 },
    { label: "RW", x: 128, y: 115 }, { label: "CM", x: 105, y: 110 },
    { label: "DM", x: 75, y: 118 }, { label: "CM", x: 45, y: 110 }, { label: "LW", x: 22, y: 115 },
    { label: "ST", x: 100, y: 55 }, { label: "ST", x: 50, y: 55 },
  ],
  "5-3-2": [
    { label: "GK", x: 75, y: 197 },
    { label: "RB", x: 130, y: 160 }, { label: "CB", x: 107, y: 152 },
    { label: "CB", x: 75, y: 148 }, { label: "CB", x: 43, y: 152 }, { label: "LB", x: 20, y: 160 },
    { label: "CM", x: 107, y: 108 }, { label: "DM", x: 75, y: 115 }, { label: "CM", x: 43, y: 108 },
    { label: "ST", x: 100, y: 55 }, { label: "ST", x: 50, y: 55 },
  ],
};

// ── Duties per position per formation ─────────────────────────────────────────

const DUTIES: Record<string, Partial<Record<PosKey, Duties>>> = {
  "4-3-3": {
    GK: {
      role: "Sweeper Keeper",
      duties: ["Distribute quickly to full-backs to start attacks", "Come off line to claim crosses in the box", "Command your area — organise the back four loudly"],
      tip: "In a 4-3-3 pressing team your first touch should already be angled to the wide option."
    },
    CB: {
      role: "Ball-Playing Centre-Back",
      duties: ["Hold a high defensive line — trust your offside trap", "Step out aggressively to win the ball in midfield transition", "Drive into midfield when the DM drops to create a 3v2"],
      tip: "Watch the striker's shoulder before stepping — if they haven't turned, push out hard."
    },
    FB: {
      role: "Attacking Full-Back (Overlap)",
      duties: ["Overlap the winger to create a 2v1 on your flank", "Tuck in to a back-three when the team is out of possession", "Drive crosses early to the near post — don't wait for the perfect moment"],
      tip: "The winger curls in, you burst outside — that split timing is what creates space."
    },
    DM: {
      role: "Anchor / Holder",
      duties: ["Sit between the two centre-backs during build-up to form a 3-back shape", "Screen the back four — cut off passes through the middle thirds", "Recycle possession quickly — you are the pivot"],
      tip: "Your positioning at the start of every attack determines how fast your team can counter-press."
    },
    CM: {
      role: "Box-to-Box Midfielder",
      duties: ["Time your runs into the box to arrive late at the far post", "Press opposition midfielders within 1 second of them receiving", "Combine short then go — play the one-two and keep running"],
      tip: "Energy is your weapon. The coach needs you to cover more ground than any other player."
    },
    WM: {
      role: "Inverted Winger",
      duties: ["Receive on the outside, drive inside to shoot with your stronger foot", "Pin back the opposition full-back to create space for your overlapping FB", "Drop back to form a mid-block of 4 when out of possession"],
      tip: "The best cut inside is when the full-back is still stepping forward — punish their momentum."
    },
    ST: {
      role: "Pressing Striker / Target",
      duties: ["Lead the press from the front — start every defensive phase by cutting passing lanes", "Make runs in behind on every ball played into full-backs to stretch the defence", "Hold up and lay off — you are the link between midfield and goal"],
      tip: "Your pressing angle tells the whole team which way to push. Pick a side and be decisive."
    },
  },
  "4-4-2": {
    GK: {
      role: "Traditional Keeper",
      duties: ["Organise the flat back-four — be vocal on every set piece", "Distribute to midfield quickly after winning the ball", "Stay on your line — your defence is compact, trust them to hold shape"],
      tip: "In a 4-4-2 your distribution to the nearest CM triggers the press. Be fast."
    },
    CB: {
      role: "Stopper",
      duties: ["Mark the striker tightly — don't let them turn", "Cover your CB partner when they step out to win the ball", "Win second balls in the box and recycle to midfield"],
      tip: "A flat back-four means communication: call every move before it happens."
    },
    FB: {
      role: "Wide Defender",
      duties: ["Tuck in behind the wide midfielder to defend in a compact block of 8", "Overlap when the winger receives facing goal — overlap the overlap", "Win tackles in wide areas — don't dive in, show players inside"],
      tip: "Your job defensively is to keep your block compact. Don't be dragged wide unnecessarily."
    },
    DM: {
      role: "Central Midfielder (Holder)",
      duties: ["Hold shape in the central 4 — block the channels between lines", "Win the second ball after the strikers press and lay it off", "Distribute wide quickly to switch play"],
      tip: "In a flat 4-4-2 the CM roles overlap. The deepest one becomes the holder on every phase."
    },
    CM: {
      role: "Central Midfielder",
      duties: ["Support the strikers by arriving late into the box", "Press in pairs with your midfield partner — don't press alone", "Create the link between defence and attack through combination play"],
      tip: "Pair pressing is what makes the 4-4-2 work. When one goes, the other covers."
    },
    WM: {
      role: "Wide Midfielder",
      duties: ["Track back to defend — you have defensive responsibilities in a 4-4-2", "Deliver early crosses to the two strikers from wide positions", "Create 2v1s with your striker on the overlap"],
      tip: "In the 4-4-2 you are a midfielder first. Defend with the team, attack with the strikers."
    },
    ST: {
      role: "Striker (Partnership)",
      duties: ["Work in a pair with your strike partner — one holds, one makes runs", "Press together high — cut off the goalkeeper's options from kick-outs", "Alternate between target play and movement off the last defender"],
      tip: "Strike partnerships are about timing. One holds, one spins — never both do the same thing."
    },
  },
  "4-2-3-1": {
    GK: {
      role: "Sweeper Keeper",
      duties: ["Sweep behind the high line — come off your line quickly", "Distribute to the DM pivot to start attacks", "Command your back four during positional attacks"],
      tip: "In a 4-2-3-1 your build-up always starts through the double pivot. Be calm under pressure."
    },
    CB: {
      role: "Cover Centre-Back",
      duties: ["Push high to compress space with the defensive line", "Carry the ball into midfield when the pivot is under pressure", "Win headers at the near post on defensive set pieces"],
      tip: "You are last resort — don't gamble. Let the DMs do the dirty work."
    },
    FB: {
      role: "Overlapping Full-Back",
      duties: ["Combine with the wide AM to create overloads on the flank", "When the winger cuts inside, burst outside and drive an early cross", "Defend in a back 4 — tuck in when the team loses the ball"],
      tip: "4-2-3-1 gives you the license to attack — use it. The DMs cover your space when you go."
    },
    DM: {
      role: "Double Pivot Holder",
      duties: ["Sit side by side with your DM partner — never both press at once", "Create a passing triangle with the two centre-backs in build-up", "Screen — block the central channel and slow counter-attacks"],
      tip: "One holder, one presses. Agree with your partner before each phase begins."
    },
    AM: {
      role: "Number 10 / Attacking Mid",
      duties: ["Find pockets of space between the opposition's midfield and defence", "Link play between the DMs and the striker — you are the connector", "Arrive late to support the striker — don't be too high too early"],
      tip: "The 10 role is about timing. Too early and you get marked. Too late and the chance is gone."
    },
    WM: {
      role: "Wide Attacking Midfielder",
      duties: ["Play as a wide AM — drift inside to create 3v2s in the final third", "When your FB overlaps, cut inside and shoot or combine to the near post", "Press the opposition full-back high when the team presses"],
      tip: "In a 4-2-3-1 you have more freedom than a traditional winger. Use it."
    },
    ST: {
      role: "Target Striker",
      duties: ["Hold the ball up and bring the 3 AMs into play", "Spin off the shoulder of the last defender when the ball goes wide", "Make runs across the centre-back to open space for the AMs arriving late"],
      tip: "Your movement creates the space the 10 needs. Be the decoy as much as the finisher."
    },
  },
  "3-5-2": {
    GK: {
      role: "Organising Keeper",
      duties: ["Organise the back-three constantly — this shape requires communication", "Distribute to the wide midfielders to start attacks", "Cover the wide channels behind your wingbacks"],
      tip: "In a 3-5-2 the goalkeeper is the 4th member of the back three in possession."
    },
    CB: {
      role: "Centre-Back (of three)",
      duties: ["Cover the wide channels when your wingback pushes forward", "Step into midfield to win second balls when the block is compact", "Communicate constantly — the 3-back shape requires defensive organisation"],
      tip: "Three at the back only works when all three are talking. Be vocal every minute."
    },
    WM: {
      role: "Wingback",
      duties: ["You cover the full width of the pitch — attack and defend on the same run", "Get forward to support the two strikers in crossing positions", "Drop back quickly to defend the wide channel when possession is lost"],
      tip: "The wingback is the most demanding role on the pitch. Fitness is your weapon."
    },
    DM: {
      role: "Central Holder (of three mids)",
      duties: ["Sit between the two CMs and screen the back-three", "Dictate tempo — you touch the ball more than anyone in this formation", "Cover when one CM pushes forward to support the strikers"],
      tip: "As the central pivot in a 3-5-2, every attack starts through you."
    },
    CM: {
      role: "Box-to-Box Mid (of three)",
      duties: ["Support the strikers by making late runs from midfield", "Press quickly when possession is lost — the 3-5-2 counter-presses as a unit", "Combine with the wingback on your side to create overloads"],
      tip: "In the 3-5-2 you have a partner on each side. Use them — don't try to do everything alone."
    },
    ST: {
      role: "Strike Partner",
      duties: ["Work with your strike partner — split wide to stretch centre-backs", "Hold the ball up when the three midfielders push forward", "Attack the far post when your partner drives towards goal"],
      tip: "Two strikers vs three centre-backs — movement is how you beat the numbers."
    },
  },
  "5-3-2": {
    GK: {
      role: "Sweeper Keeper",
      duties: ["Organise the back-five — your voice sets the defensive line", "Distribute to the three midfielders to break the press quickly", "Don't hold the ball — release in under 3 seconds"],
      tip: "A 5-back shape is hard to break. Your job is to release quickly to start counters."
    },
    CB: {
      role: "Centre-Back (of five)",
      duties: ["Hold a deep, compact defensive line — protect the space behind you", "Step into the channel when the wingback is dragged wide", "Drive out with the ball in transition — turn defence into attack quickly"],
      tip: "In a 5-3-2 you win by being organised. Discipline before ambition."
    },
    FB: {
      role: "Wingback (Defensive)",
      duties: ["Stay wider in a 5 — your primary job is defensive width", "When possession is won, drive forward to support the two strikers", "Track the opposition winger all the way back — no freelancing"],
      tip: "In a 5-3-2 the wingback is more defender than attacker. Choose your moments to go forward."
    },
    DM: {
      role: "Midfield Anchor",
      duties: ["Sit deep to protect the back five and stop quick transitions", "Recycle possession under pressure — you are the safety valve", "Win the second ball when the strikers press and the ball breaks"],
      tip: "Three midfielders means you are outnumbered in a deep block. Positioning saves energy."
    },
    CM: {
      role: "Supporting Midfielder",
      duties: ["Support the striker nearest to you on counter-attacks", "Press in pairs — one goes, one stays. Agree before each press", "Drive box-to-box to support both the defence and the two strikers"],
      tip: "Three in midfield needs runners. When possession is won, get forward fast."
    },
    ST: {
      role: "Counter-Attack Striker",
      duties: ["Hold the ball up to allow your team to transition from defence to attack", "Make quick forward runs in behind on every defensive clearance", "Partner your striker — split wide to create space for each other"],
      tip: "In a 5-3-2 your team defends deep. When the ball comes, make it count — be clinical."
    },
  },
};

// ── Simulation scenarios (3 per position) ─────────────────────────────────────

const SIM_SCENARIOS: Record<PosKey, SimScenario[]> = {
  GK: [
    {
      situation: "The opposition striker is through on goal one-on-one.",
      question: "What is your best action as the goalkeeper?",
      options: [
        { id: "a", label: "Stay on your line and wait" },
        { id: "b", label: "Rush out quickly to narrow the angle" },
        { id: "c", label: "Dive early to guess the direction" },
        { id: "d", label: "Back up into the goal" },
      ],
      correct: "b",
      explanation: "Coming out quickly narrows the angle and forces the striker to make a decision under pressure. Staying on the line gives the striker too much space to pick their spot.",
    },
    {
      situation: "Your team wins the ball deep. The striker drops to receive.",
      question: "Where should you distribute the ball?",
      options: [
        { id: "a", label: "Long ball to the striker directly" },
        { id: "b", label: "To the nearest defender" },
        { id: "c", label: "Quick throw to the full-back to start the attack wide" },
        { id: "d", label: "Wait until players are in better positions" },
      ],
      correct: "c",
      explanation: "A quick throw to the full-back exploits the space left by the opposition's attacking shape. Playing through the full-back starts the counter before the opponent can reorganise.",
    },
    {
      situation: "A corner is about to be taken. Three opposition players are in your box.",
      question: "What should you do before the ball is kicked?",
      options: [
        { id: "a", label: "Organise your defenders to mark them man-for-man" },
        { id: "b", label: "Stay deep on your goal line and react" },
        { id: "c", label: "Call for a zonal marking shape near the 6-yard box" },
        { id: "d", label: "Focus only on the ball" },
      ],
      correct: "a",
      explanation: "Organising your defenders before the ball is kicked puts you in control. Vocal leadership on set pieces is one of a goalkeeper's most important duties.",
    },
  ],
  CB: [
    {
      situation: "The opposition striker turns with the ball 25 metres from goal.",
      question: "What is the correct defensive response?",
      options: [
        { id: "a", label: "Sprint towards them immediately and attempt to tackle" },
        { id: "b", label: "Hold your shape — drop back and stay goal-side" },
        { id: "c", label: "Push forward to play offside" },
        { id: "d", label: "Switch off and watch your teammate deal with it" },
      ],
      correct: "b",
      explanation: "Holding shape and staying goal-side forces the striker back. Diving in creates space behind you. Let them come to you, not you to them.",
    },
    {
      situation: "Your team has the ball and a teammate plays it back to you from midfield under pressure.",
      question: "What is the safest action?",
      options: [
        { id: "a", label: "Head it long immediately" },
        { id: "b", label: "Dribble past the pressing forward" },
        { id: "c", label: "Play it back to the goalkeeper calmly" },
        { id: "d", label: "Drive forward into midfield" },
      ],
      correct: "c",
      explanation: "Playing back to the goalkeeper under pressure recycles the attack safely. It resets the shape without risking losing the ball in a dangerous area.",
    },
    {
      situation: "A winger receives the ball in the right channel and cuts inside.",
      question: "As the left centre-back, what do you do?",
      options: [
        { id: "a", label: "Rush across to close down the winger" },
        { id: "b", label: "Shift across with your partner, hold shape, and track the movement" },
        { id: "c", label: "Stay in your zone and ignore the ball" },
        { id: "d", label: "Push high to catch the striker offside" },
      ],
      correct: "b",
      explanation: "Shifting as a unit is the key principle. Moving across together closes the space without leaving a gap. Your partner steps to the ball, you cover behind.",
    },
  ],
  FB: [
    {
      situation: "You are in possession on the right flank. The winger is making a run inside.",
      question: "What is the best option?",
      options: [
        { id: "a", label: "Pass inside to the central midfielder" },
        { id: "b", label: "Overlap the winger and receive a return pass on the outside" },
        { id: "c", label: "Hold the ball and wait for the winger to come back" },
        { id: "d", label: "Play a long ball to the striker" },
      ],
      correct: "b",
      explanation: "When the winger cuts inside, the overlap is the natural movement. Their run in creates space outside. Your overlap stretches the defence and creates a 2v1 situation.",
    },
    {
      situation: "The ball is lost in midfield. You are 30 metres up the pitch.",
      question: "What is your immediate response?",
      options: [
        { id: "a", label: "Continue your run forward and hope to win the ball back high" },
        { id: "b", label: "Sprint back into your defensive position as quickly as possible" },
        { id: "c", label: "Press the opposition's nearest player" },
        { id: "d", label: "Walk back — the other defenders will cover" },
      ],
      correct: "b",
      explanation: "The full-back's first duty when possession is lost is recovery. Sprinting back before the opposition can exploit the space you left is essential. No other option is safer.",
    },
    {
      situation: "The opposition winger has the ball on the touchline and is faster than you.",
      question: "How do you defend this situation?",
      options: [
        { id: "a", label: "Sprint and try to win the ball with a tackle" },
        { id: "b", label: "Show them inside — away from the touchline" },
        { id: "c", label: "Show them outside and let them run into the corner" },
        { id: "d", label: "Drop off and let them cross" },
      ],
      correct: "c",
      explanation: "Showing a fast winger into the corner limits the damage. If they beat you going outside, they can only cross from a bad angle. If they beat you inside, they can shoot or play in a striker.",
    },
  ],
  DM: [
    {
      situation: "The opposition plays a ball through the gap between you and the centre-backs.",
      question: "What should you have done to prevent this?",
      options: [
        { id: "a", label: "Pressed the player on the ball higher up the pitch" },
        { id: "b", label: "Stayed deeper to close the gap and screen the back four" },
        { id: "c", label: "Left it to the centre-backs" },
        { id: "d", label: "Tracked the runner making the run through" },
      ],
      correct: "b",
      explanation: "The DM's role is to screen the defence. Staying deeper closes the gap and prevents through balls. Going too high leaves space that the opposition will exploit.",
    },
    {
      situation: "Your team is under pressure in the build-up and the goalkeeper passes to you.",
      question: "What is the right action?",
      options: [
        { id: "a", label: "Attempt a skill move to get past the pressing forward" },
        { id: "b", label: "Play back to the goalkeeper immediately" },
        { id: "c", label: "Look to play it quickly to the full-back who has space wide" },
        { id: "d", label: "Hold the ball until your teammates make runs" },
      ],
      correct: "c",
      explanation: "As the DM you are the build-up pivot. Playing it quickly wide to the full-back relieves pressure and starts the attack. You should already know where the full-back is before you receive.",
    },
    {
      situation: "A dangerous counter-attack is developing. You are the only player between the opposition and your goal.",
      question: "What do you do?",
      options: [
        { id: "a", label: "Sprint to tackle the player on the ball" },
        { id: "b", label: "Delay — slow the attack down and buy time for teammates to recover" },
        { id: "c", label: "Leave it to the goalkeeper" },
        { id: "d", label: "Try to win the ball — tackle hard" },
      ],
      correct: "b",
      explanation: "Delaying a counter-attack is the right call. Sprint tackles are risky — if you miss, there is no one behind you. Slowing the attack down gives your teammates time to recover and recover positions.",
    },
  ],
  CM: [
    {
      situation: "Your striker holds the ball up under pressure. You are 20 metres behind.",
      question: "What is the best movement to make?",
      options: [
        { id: "a", label: "Stay in position and wait for the ball to come back" },
        { id: "b", label: "Make a run beyond the striker into the box" },
        { id: "c", label: "Run to support the striker at short range" },
        { id: "d", label: "Drop deep to give the goalkeeper an option" },
      ],
      correct: "c",
      explanation: "Supporting the striker at short range gives them a quick option to relieve pressure. Your run into their path as a combination option is the classic CM support run.",
    },
    {
      situation: "Possession is won and the team has a chance to counter-attack quickly.",
      question: "As the box-to-box CM, what do you do?",
      options: [
        { id: "a", label: "Stay back and keep your defensive shape" },
        { id: "b", label: "Sprint forward to support the attacking transition" },
        { id: "c", label: "Pass to the nearest safe option" },
        { id: "d", label: "Look for a long ball over the top" },
      ],
      correct: "b",
      explanation: "The box-to-box CM must transition from defence to attack immediately when possession is won. Your forward run creates an extra option and puts your team in a numerical advantage.",
    },
    {
      situation: "The opposition has the ball in midfield. Your DM is pushing slightly high.",
      question: "What should you do?",
      options: [
        { id: "a", label: "Press together with the DM to overwhelm the player on the ball" },
        { id: "b", label: "Drop slightly deeper to cover the space behind the DM" },
        { id: "c", label: "Press the nearest opposition player" },
        { id: "d", label: "Hold your position and wait" },
      ],
      correct: "b",
      explanation: "When the DM goes high, you must provide cover. Dropping slightly to cover the space behind prevents the opposition from playing through you with one pass.",
    },
  ],
  WM: [
    {
      situation: "You receive the ball on the right wing. Your full-back is overlapping outside you.",
      question: "What is the best option to exploit the overlap?",
      options: [
        { id: "a", label: "Cut inside immediately and shoot" },
        { id: "b", label: "Slow down, draw the defender, then release the FB with a through ball" },
        { id: "c", label: "Play back to the central midfielder" },
        { id: "d", label: "Dribble past the defender one-on-one" },
      ],
      correct: "b",
      explanation: "Drawing the defender creates the 2v1. When the defender comes to you, the full-back is free. Your timing — slow down, attract, release — is what makes the overlap count.",
    },
    {
      situation: "Your team is defending a corner. The corner is cleared but only to the edge of the box.",
      question: "As the wide midfielder, where should you be positioned?",
      options: [
        { id: "a", label: "Already making your run to counter-attack" },
        { id: "b", label: "On the edge of the box, ready to defend the second ball or transition" },
        { id: "c", label: "On the far side of the pitch making a decoy run" },
        { id: "d", label: "Inside the penalty box marking a player" },
      ],
      correct: "b",
      explanation: "Wingers on corners need to be ready for the second ball. Positioning at the edge of the box allows you to defend if the ball is cleared short, or transition quickly if your team wins it.",
    },
    {
      situation: "The opposition full-back is very defensively positioned and not giving you space.",
      question: "How do you create space?",
      options: [
        { id: "a", label: "Ask for the ball anyway and beat them in a 1v1" },
        { id: "b", label: "Drop deep and overload the midfield to create space behind the FB" },
        { id: "c", label: "Stay wide and wait for them to make a mistake" },
        { id: "d", label: "Switch flanks and attack on the other side" },
      ],
      correct: "b",
      explanation: "Dropping deep drags the full-back forward. When they follow, you can spin in behind, or your striker can exploit the gap left. Positional intelligence beats pace every time.",
    },
  ],
  AM: [
    {
      situation: "The ball is with your striker who is held up under pressure. You are 12 metres behind.",
      question: "What is your ideal movement?",
      options: [
        { id: "a", label: "Stay in your zone and wait for the ball" },
        { id: "b", label: "Make an angled run into the space beside the striker" },
        { id: "c", label: "Drop into midfield to receive the lay-off" },
        { id: "d", label: "Make a run beyond the striker into the box" },
      ],
      correct: "c",
      explanation: "The number 10 is the link player. Dropping into midfield gives the striker a quick lay-off option and lets you turn and attack with time. That dropped position is where you are most dangerous.",
    },
    {
      situation: "You receive the ball under pressure in the middle third. There is no immediate forward pass.",
      question: "What should you do?",
      options: [
        { id: "a", label: "Force a forward pass through the press" },
        { id: "b", label: "Hold the ball, shield it, and wait for a teammate to offer" },
        { id: "c", label: "Play it back safely to the defensive midfielder" },
        { id: "d", label: "Shoot from distance" },
      ],
      correct: "c",
      explanation: "Losing the ball in the middle third when under pressure is dangerous. Playing back to the DM recycles and keeps shape. Don't force it — your moment will come.",
    },
    {
      situation: "Your team is on a counter-attack. You are behind the striker who is running at goal.",
      question: "Where should you position yourself?",
      options: [
        { id: "a", label: "Sprint to get ahead of the striker and be the target" },
        { id: "b", label: "Run parallel and slightly behind — support the striker without going ahead" },
        { id: "c", label: "Stay in midfield to protect against the counter" },
        { id: "d", label: "Make a wide run to the left flank" },
      ],
      correct: "b",
      explanation: "On the counter, running parallel and slightly behind gives the striker options without you going offside or taking the space they need. If they are stopped, you arrive with the second ball.",
    },
  ],
  ST: [
    {
      situation: "The ball is played to you with your back to goal. A centre-back is tightly marking you.",
      question: "What is the best action?",
      options: [
        { id: "a", label: "Try to turn immediately" },
        { id: "b", label: "Control, hold, and lay the ball off to the supporting midfielder" },
        { id: "c", label: "Flick it on with your head" },
        { id: "d", label: "Pass it straight back to the player who gave it" },
      ],
      correct: "b",
      explanation: "Holding up play and laying off to the midfielder is the target striker's most important skill. It brings your team forward, relieves the press, and creates the next attack.",
    },
    {
      situation: "Your team is being pressed high. The goalkeeper has the ball.",
      question: "What pressing run should you make?",
      options: [
        { id: "a", label: "Chase the goalkeeper directly" },
        { id: "b", label: "Cut off the pass to the right centre-back, forcing the ball one direction" },
        { id: "c", label: "Drop deep to offer a passing option" },
        { id: "d", label: "Stay high and wait — you'll get the chance later" },
      ],
      correct: "b",
      explanation: "A smart pressing run cuts off one passing lane. Your angle of press tells your whole team which side to push. Don't just chase — guide the press with your run.",
    },
    {
      situation: "You have a chance on goal from a cross — but you are at the far post and the ball is low.",
      question: "What technique gives you the best chance?",
      options: [
        { id: "a", label: "Hit it with your laces as hard as possible" },
        { id: "b", label: "Place it inside the near post with your instep" },
        { id: "c", label: "Side-foot it across the goalkeeper to the far corner" },
        { id: "d", label: "Attempt a bicycle kick" },
      ],
      correct: "c",
      explanation: "Side-footing across the goalkeeper to the far corner is the highest probability finish from that position. Hard shots from wide angles hit the side netting. Accuracy beats power in the box.",
    },
  ],
};

// ── Constants ──────────────────────────────────────────────────────────────────

const FREE_FORMATIONS = ["4-3-3", "4-4-2"];
const FREE_SIM_COUNT = 3;
const GRS_GREEN = "#1a5c2a";
const GRS_GOLD = "#f0b429";

// ── SVG Pitch component ────────────────────────────────────────────────────────

function PitchSVG({
  tokens,
  highlightLabels,
}: {
  tokens: PitchToken[];
  highlightLabels: string[];
}) {
  return (
    <svg viewBox="0 0 150 210" className="w-full max-w-[220px] mx-auto" style={{ display: "block" }}>
      {/* Pitch background */}
      <rect x="0" y="0" width="150" height="210" rx="4" fill="#2d5a1b" />
      {/* Pitch markings */}
      <rect x="8" y="8" width="134" height="194" rx="2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
      <line x1="8" y1="105" x2="142" y2="105" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <circle cx="75" cy="105" r="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <circle cx="75" cy="105" r="1.2" fill="rgba(255,255,255,0.4)" />
      {/* Top penalty area */}
      <rect x="32" y="8" width="86" height="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <rect x="50" y="8" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <circle cx="75" cy="30" r="1.2" fill="rgba(255,255,255,0.4)" />
      {/* Bottom penalty area */}
      <rect x="32" y="166" width="86" height="36" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <rect x="50" y="184" width="50" height="18" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" />
      <circle cx="75" cy="180" r="1.2" fill="rgba(255,255,255,0.4)" />
      {/* Goals */}
      <rect x="58" y="5" width="34" height="6" rx="1" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      <rect x="58" y="199" width="34" height="6" rx="1" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />

      {/* Player tokens */}
      {tokens.map((t, i) => {
        const isHighlighted = highlightLabels.some(
          (hl) => t.label.toUpperCase() === hl.toUpperCase()
        );
        return (
          <g key={i}>
            <circle
              cx={t.x}
              cy={t.y}
              r={isHighlighted ? 9 : 7}
              fill={isHighlighted ? GRS_GOLD : "rgba(255,255,255,0.85)"}
              stroke={isHighlighted ? "#c8962a" : "rgba(255,255,255,0.4)"}
              strokeWidth={isHighlighted ? 1.5 : 1}
            />
            <text
              x={t.x}
              y={t.y + 0.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={isHighlighted ? "5.5" : "4.5"}
              fontWeight="bold"
              fill="#1a3a1a"
            >
              {t.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Locked Formation overlay ───────────────────────────────────────────────────

function LockedFormation({ formation }: { formation: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
        <Lock size={18} className="text-gray-400" />
      </div>
      <p className="text-sm font-bold text-gray-700">{formation}</p>
      <p className="text-xs text-gray-400 text-center">Unlock this formation with Pro</p>
      <Link
        href="/player/subscription"
        className="text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full text-white"
        style={{ backgroundColor: GRS_GREEN }}
      >
        Upgrade
      </Link>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function PlayerTacticsPage() {
  const user = useAuthStore((s) => s.user);

  // Monetization flag — wire up to subscription status when billing is live
  const isPro = false;

  const rawPosition = (user as { position?: string } | null)?.position ?? null;
  const [posKey, setPosKey] = useState<PosKey>(detectPositionKey(rawPosition));
  const [activeTab, setActiveTab] = useState<"position" | "simulate">("position");
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [intelOpen, setIntelOpen] = useState(false);

  // Simulation state
  const [simIndex, setSimIndex] = useState(0);
  const [simCount, setSimCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const allFormations = Object.keys(FORMATIONS);
  const scenarios = SIM_SCENARIOS[posKey];
  const scenario = scenarios[simIndex % scenarios.length];
  const simLocked = !isPro && simCount >= FREE_SIM_COUNT;

  const duties = DUTIES[selectedFormation]?.[posKey] ?? null;
  const tokens = FORMATIONS[selectedFormation] ?? [];
  const highlightLabels = POS_LABELS[posKey];

  function handleAnswer(id: string) {
    if (answered) return;
    setSelected(id);
    setAnswered(true);
    setSimCount((c) => c + 1);
  }

  function nextScenario() {
    setSimIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div className="flex items-center gap-3">
              <Link href="/player" className="flex items-center gap-1 text-gray-400 hover:text-gray-700">
                <ChevronLeft size={16} />
              </Link>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Tactics Academy</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>
                  {POS_DISPLAY[posKey]} · {selectedFormation}
                </div>
              </div>
            </div>
            <Link
              href="/coach/tactics/board"
              className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-colors hover:bg-green-50"
              style={{ color: GRS_GREEN, borderColor: GRS_GREEN }}
            >
              Board
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Position picker */}
        <div className="mb-5">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Your Position</p>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(POS_DISPLAY) as PosKey[]).map((pk) => (
              <button
                key={pk}
                onClick={() => { setPosKey(pk); setSimIndex(0); setSelected(null); setAnswered(false); }}
                className="rounded-xl py-2 text-center transition-all"
                style={{
                  backgroundColor: posKey === pk ? GRS_GREEN : "#fff",
                  border: `1.5px solid ${posKey === pk ? GRS_GREEN : "#e5e7eb"}`,
                  color: posKey === pk ? "#fff" : "#374151",
                }}
              >
                <div className="text-[11px] font-black">{pk}</div>
                <div className="text-[9px] font-medium mt-0.5 opacity-70">
                  {POS_DISPLAY[pk].split(" ")[0]}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["position", "simulate"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              style={{
                backgroundColor: activeTab === tab ? GRS_GREEN : "#fff",
                color: activeTab === tab ? "#fff" : "#6b7280",
                border: `1.5px solid ${activeTab === tab ? GRS_GREEN : "#e5e7eb"}`,
              }}
            >
              {tab === "position" ? "My Position" : "Simulate"}
            </button>
          ))}
        </div>

        {/* MY POSITION TAB */}
        {activeTab === "position" && (
          <div className="space-y-5">
            {/* Formation selector */}
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">Formation</p>
              <div className="flex gap-2 flex-wrap">
                {allFormations.map((f) => {
                  const isLocked = !isPro && !FREE_FORMATIONS.includes(f);
                  return (
                    <button
                      key={f}
                      onClick={() => !isLocked && setSelectedFormation(f)}
                      disabled={isLocked}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                      style={{
                        backgroundColor: selectedFormation === f ? GRS_GREEN : isLocked ? "#f3f4f6" : "#fff",
                        color: selectedFormation === f ? "#fff" : isLocked ? "#9ca3af" : "#374151",
                        border: `1.5px solid ${selectedFormation === f ? GRS_GREEN : "#e5e7eb"}`,
                        cursor: isLocked ? "default" : "pointer",
                      }}
                    >
                      {isLocked && <Lock size={10} />}
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pitch + Duties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
                  {selectedFormation} · <span style={{ color: GRS_GOLD }}>You are highlighted</span>
                </p>
                <PitchSVG tokens={tokens} highlightLabels={highlightLabels} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                {duties ? (
                  <div className="space-y-3">
                    <div>
                      <span
                        className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: GRS_GREEN }}
                      >
                        {duties.role}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {duties.duties.map((duty, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black"
                            style={{
                              backgroundColor: i === 0 ? "#f0fdf4" : i === 1 ? "#fef3c7" : "#ede9fe",
                              color: i === 0 ? GRS_GREEN : i === 1 ? "#d97706" : "#7c3aed",
                            }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-xs text-gray-700 leading-snug">{duty}</p>
                        </div>
                      ))}
                    </div>
                    <div
                      className="rounded-xl p-3 mt-2"
                      style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-1">
                        Coach Tip
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">{duties.tip}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <Layers size={24} className="text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">
                      No specific duties for {POS_DISPLAY[posKey]} in {selectedFormation} yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Formation Intel */}
            {(() => {
              const intel = FORMATION_LIBRARY.find((f) => f.code === selectedFormation);
              if (!intel) return null;
              return (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => setIntelOpen((v) => !v)}
                  >
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">Formation Intel</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: GRS_GREEN }}>
                        {intel.name}
                        <span className="font-normal text-gray-500"> · {intel.style.charAt(0).toUpperCase() + intel.style.slice(1)} style · {intel.era}</span>
                      </p>
                    </div>
                    {intelOpen
                      ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                      : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                  </button>

                  {intelOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider mb-1.5" style={{ color: GRS_GREEN }}>Strengths</p>
                          <ul className="space-y-1.5">
                            {intel.strengths.map((s) => (
                              <li key={s} className="flex gap-1.5 items-start">
                                <CheckCircle2 size={11} style={{ color: GRS_GREEN }} className="mt-0.5 shrink-0" />
                                <span className="text-[11px] text-gray-700 leading-snug">{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-wider mb-1.5 text-red-600">Weaknesses</p>
                          <ul className="space-y-1.5">
                            {intel.weaknesses.map((w) => (
                              <li key={w} className="flex gap-1.5 items-start">
                                <XCircle size={11} className="text-red-400 mt-0.5 shrink-0" />
                                <span className="text-[11px] text-gray-700 leading-snug">{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Best For */}
                      <div
                        className="rounded-xl p-2.5 text-[11px]"
                        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                      >
                        <span className="font-black uppercase tracking-wider" style={{ color: GRS_GREEN }}>Best For: </span>
                        <span className="text-gray-700">{intel.bestFor}</span>
                      </div>

                      {/* Famous Use */}
                      <div className="text-[11px] text-gray-500 italic">
                        <span className="font-semibold not-italic text-gray-600">Famous Use: </span>
                        {intel.famousUse}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Locked formations */}
            {!isPro && (
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">Pro Formations</p>
                <div className="grid grid-cols-3 gap-3">
                  {allFormations.filter((f) => !FREE_FORMATIONS.includes(f)).map((f) => (
                    <LockedFormation key={f} formation={f} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SIMULATE TAB */}
        {activeTab === "simulate" && (
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">Simulations used</p>
                <p className="text-[10px] font-bold text-gray-600">
                  {simCount} / {isPro ? "unlimited" : FREE_SIM_COUNT}
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: isPro ? "0%" : `${Math.min((simCount / FREE_SIM_COUNT) * 100, 100)}%`,
                    backgroundColor: simCount >= FREE_SIM_COUNT && !isPro ? "#dc2626" : GRS_GREEN,
                  }}
                />
              </div>
            </div>

            {simLocked ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100">
                  <Lock size={22} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-800">Free simulations used</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Upgrade to Pro for unlimited position simulations across all formations.
                  </p>
                </div>
                <Link
                  href="/player/subscription"
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: GRS_GREEN }}
                >
                  Unlock Pro
                </Link>
                <button
                  onClick={() => { setSimCount(0); setSimIndex(0); setSelected(null); setAnswered(false); }}
                  className="text-xs text-gray-400 underline"
                >
                  Reset (demo)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-100">
                      <Zap size={15} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1">Situation</p>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{scenario.situation}</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-gray-900 mb-3">{scenario.question}</p>
                  <div className="space-y-2">
                    {scenario.options.map((opt) => {
                      const isCorrect = opt.id === scenario.correct;
                      const isSelected = opt.id === selected;
                      let bg = "#f9fafb";
                      let border = "#e5e7eb";
                      let textColor = "#374151";

                      if (answered) {
                        if (isCorrect) { bg = "#f0fdf4"; border = "#86efac"; textColor = "#166534"; }
                        else if (isSelected) { bg = "#fef2f2"; border = "#fca5a5"; textColor = "#991b1b"; }
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleAnswer(opt.id)}
                          disabled={answered}
                          className="w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 transition-all"
                          style={{ backgroundColor: bg, border: `1.5px solid ${border}`, color: textColor }}
                        >
                          <span className="text-[11px] font-black uppercase opacity-60">{opt.id}</span>
                          <span className="text-xs font-semibold">{opt.label}</span>
                          {answered && isCorrect && <CheckCircle2 size={14} className="ml-auto text-green-600" />}
                          {answered && isSelected && !isCorrect && <XCircle size={14} className="ml-auto text-red-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {answered && (
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor: selected === scenario.correct ? "#f0fdf4" : "#fef2f2",
                      border: `1px solid ${selected === scenario.correct ? "#86efac" : "#fca5a5"}`,
                    }}
                  >
                    <p
                      className="text-[9px] font-black uppercase tracking-[0.18em] mb-1"
                      style={{ color: selected === scenario.correct ? "#166534" : "#991b1b" }}
                    >
                      {selected === scenario.correct ? "Correct" : "Not quite"}
                    </p>
                    <p className="text-xs text-gray-700 leading-relaxed">{scenario.explanation}</p>
                    <button
                      onClick={nextScenario}
                      className="mt-3 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: GRS_GREEN }}
                    >
                      Next scenario
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom link */}
        <div className="mt-8 text-center">
          <Link href="/coach/tactics/learn" className="text-xs text-gray-400 underline">
            View full Tactics Academy (Coach view)
          </Link>
        </div>
      </div>
    </div>
  );
}
