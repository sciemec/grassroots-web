"use client";

/**
 * Football Skill Analysis — /player/capture
 *
 * 10-drill continuous testing loop:
 *   select → protocol → recording → uploading → feedback → (practice) → retest
 *
 * Features:
 * - Fetches player profile on mount (name, position, age_group, gender)
 * - THUTO (+ AMARA for female players) provides vision-based coaching
 * - Returns drill score (1–10) + qualitative feedback + 3-exercise practice plan
 * - Progress comparison: shows improvement vs previous best
 * - Practice plan with tick-boxes — "Retest Now" unlocks when all ticked
 * - Auto-saves to drill_analysis_results (feeds Talent Passport + Arena)
 * - Leaderboard link shows ranking in age group
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Video, Square, RotateCcw, CheckCircle,
  AlertCircle, Camera, ChevronRight, Trophy,
  Activity, Brain, Target, TrendingUp, TrendingDown,
  Minus, RefreshCw, CheckSquare, Square as SquareIcon,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DrillMetric {
  key:         string;
  label:       string;
  unit:        string;
  description: string;
}

interface DrillDef {
  id:          string;
  label:       string;
  emoji:       string;
  category:    "Technical" | "Cognitive" | "Physical";
  tagline:     string;
  diagram:     string;          // ASCII illustration shown before protocol steps
  protocol:    string[];        // English steps
  protocolSn:  string[];        // 75% English + 25% ChiShona mix
  protocolNd:  string[];        // 75% English + 25% isiNdebele mix
  cameraSetup: string;
  equipment:   string;          // uses local resources (bottles etc.)
  metrics:     DrillMetric[];
  focus:       string;
  maxDuration: number;
}

type Screen = "select" | "protocol" | "recording" | "uploading" | "feedback" | "error";

interface PracticeExercise {
  name:        string;
  duration:    string;
  reps:        string;
  description: string;
  why:         string;
}

interface THUTOFeedback {
  drill_score:          number;
  strength:             string;
  correction:           string;
  drillRecommendation:  string;
  practice_plan: {
    title:     string;
    exercises: PracticeExercise[];
  };
}

interface PlayerProfile {
  first_name?: string;
  name?:       string;
  position?:   string;
  age_group?:  string;
  gender?:     string;
}

// ─── Drill definitions ───────────────────────────────────────────────────────

const DRILLS: DrillDef[] = [
  {
    id: "first_touch",
    label: "First Touch & Control",
    emoji: "🦶",
    category: "Technical",
    tagline: "Dispersion radius · Release latency · Bilateral ratio",
    diagram:
      "       PARTNER\n" +
      "         (10-15m away)\n" +
      "              |\n" +
      "              |  ball incoming\n" +
      "              v\n" +
      "        +----------+\n" +
      "        | CONTROL  |  <- triangle zone\n" +
      "        |  ZONE    |     ~2m sides\n" +
      "        +----------+\n" +
      "          [ YOU ]",
    equipment: "Football · 3 sand-filled bottles (triangle markers) · partner",
    protocol: [
      "Put 3 bottles on the ground in a triangle shape — each side about 2 metres wide.",
      "Ask a partner to stand 10 to 15 metres away and kick or throw the ball to you.",
      "Stop the ball INSIDE the triangle using just your first touch.",
      "Right after touching the ball, pass it or shoot straight away — no extra dribbles.",
      "Do 5 touches with each foot — 10 touches in total.",
    ],
    protocolSn: [
      "Isa mabhodhoro matatu pasi mumutsara wetriangle — each side ingori 2 metres.",
      "Kumbira shamwari yako imire 10 kusvika 15 metres — ikande kana ikicker bhora kwamuri.",
      "Misa bhora MUKATI metriangle ne first touch yako chete.",
      "Mushure mekubata bhora, pfuura kana shaya nekukurumidza — no extra dribbles.",
      "Ita touches 5 ne gumbo rimwe nerimwe — 10 total.",
    ],
    protocolNd: [
      "Beka amabhodlela amathathu phansi ngomugqa wetriangle — each side ingaba 2 amamamitha.",
      "Cela umngane wakho ame amamamitha ali-10 kuya ku-15 — akulahle noma ashaye ibhola.",
      "Misa ibhola PHAKATHI kwetriangle ngokukhawuleza kokunye unyawo kuphela.",
      "Emva kokuthinta ibhola, dlulisela noma shaya ngokukhawuleza — ayikho ezinye izinyathelo.",
      "Yenza izinhlandla ezi-5 ngonyawo ngalinye — gu-10 isamba.",
    ],
    cameraSetup: "SIDE-ON · hip height · 4m from player · triangle bottles + full body in frame.",
    metrics: [
      { key: "dispersion_radius", label: "Touch Dispersion Radius", unit: "m",  description: "Average distance ball lands from triangle centre (lower = better)" },
      { key: "release_latency",   label: "Release Latency",         unit: "s",  description: "Time from ball arrival to your next action (lower = sharper)" },
      { key: "bilateral_ratio",   label: "Bilateral Ratio",         unit: "%",  description: "Weak-foot control quality vs dominant foot (100% = equal)" },
    ],
    focus: "first touch quality — cushioning technique, body shape at reception, distance of ball from target zone after touch, speed of second action, comparison between dominant and weak foot",
    maxDuration: 60,
  },
  {
    id: "rebound_strike",
    label: "Rebound Turn & Strike",
    emoji: "⚡",
    category: "Technical",
    tagline: "Turn sharpness · Strike accuracy · Body shield position",
    diagram:
      "  +--------------------+\n" +
      "  |   WALL / FENCE     |\n" +
      "  +--------+-----------+\n" +
      "           |  ball bounces back\n" +
      "           |  (5 metres)\n" +
      "      [ YOU ] <- stand with back to wall\n" +
      "           |\n" +
      "      Turn 180 degrees\n" +
      "           |\n" +
      "           v\n" +
      "    [B]         [B]   <- 2 bottles as gate\n" +
      "       (2m wide, 8m away)",
    equipment: "Football · wall or fence · 2 sand-filled bottles (gate markers)",
    protocol: [
      "Stand 5 metres from a wall with your BACK facing it.",
      "Place 2 bottles as a gate — 2 metres wide, 8 metres behind you.",
      "Kick the ball hard against the wall in front of you.",
      "When the ball comes back, receive it and turn to face the gate.",
      "Strike the ball through the gate in 2 touches or less. Do 8 turns — half left, half right.",
    ],
    protocolSn: [
      "Mira 5 metres kubva kumadziro, kumashure kwako kune wall.",
      "Isa mabhodhoro maviri segateway — 2 metres yakafara, 8 metres kumashure kwako.",
      "Shaya bhora nesimba kumadziro kumuneri wako.",
      "Bhora rikazoodzoka, bata wobva watendeuka ukatarisana negateway.",
      "Shaya bhora nepasi yegateway mukati me 2 touches — ita nhungamiro 8, hafu kuruboshwe hafu kurudyi.",
    ],
    protocolNd: [
      "Yima amamamitha ali-5 uvela odongeni, ngemuva kwakho kune uwall.",
      "Beka amabhodlela amabili njengesango — amamitha ama-2 ububanzi, amamamitha ali-8 ngemuva kwakho.",
      "Shaya ibhola ngamandla egangeni lakho.",
      "Ibhola libuyela, lilamukele bese uphenduka ubhekane nesango.",
      "Shaya ibhola ngaphandle kwesango ngezinyathelo ezi-2 noma ngaphansi — yenza ama-turn ama-8, ihhafu kwekhohlo ihhafu kwesokudla.",
    ],
    cameraSetup: "45° DIAGONAL · waist height · capture both the turn and the strike.",
    metrics: [
      { key: "turn_sharpness",       label: "Turn Sharpness",       unit: "s",   description: "Time from ball receipt to completed turn (lower = faster)" },
      { key: "strike_accuracy",      label: "Strike Accuracy",      unit: "/8",  description: "Number of strikes hitting the gate target" },
      { key: "body_shield_position", label: "Body Shield Position", unit: "pts", description: "AI rating: how well you use body to protect ball (1–10)" },
    ],
    focus: "back-to-goal receiving — body shield positioning, turn technique (inside/outside), transition from receive to strike, accuracy of the final shot, balance on non-dominant side",
    maxDuration: 60,
  },
  {
    id: "passing_accuracy",
    label: "Passing Accuracy",
    emoji: "🎯",
    category: "Technical",
    tagline: "Gate precision · Velocity control · Weak foot score",
    diagram:
      "    [ YOU ]\n" +
      "       |\n" +
      "       +---------> [B][B]  10m (inside foot)\n" +
      "       |\n" +
      "       +-------------------> [B][B]  15m (laces)\n" +
      "       |\n" +
      "       +----------------------------> [B][B]  20m (laces)\n" +
      "\n" +
      "  Each gate = 2 bottles, 50cm apart",
    equipment: "Football · 6 sand-filled bottles (2 per gate, 3 gates)",
    protocol: [
      "Make 3 gates using pairs of bottles — each gate 50cm wide.",
      "Put them at 10m, 15m, and 20m straight in front of you.",
      "Pass 4 times to each gate — use the inside of your foot for the 10m gate.",
      "Use your laces for the 15m and 20m gates.",
      "Your last 3 passes must use your weaker foot only.",
    ],
    protocolSn: [
      "Gadzira magates matatu ne mabhodhoro maviri maviri — each gate ingori 50cm yakafara.",
      "Aisei pa 10m, 15m, ne 20m pamberi pako.",
      "Pfuura bhora 4 times kune gate imwe neimwe — shandisa mukati megumbo kune 10m gate.",
      "Shandisa laces kune 15m ne 20m gates.",
      "Passes dzenyu dzekupedzisira 3 dzinofanirwa kushandisa gumbo rako rakaoma chete.",
    ],
    protocolNd: [
      "Yenza amasango amathathu ngamabhodlela amabili amabili — isango ngalinye 50cm ububanzi.",
      "Wabeka ku-10m, 15m, le-20m phambi kwakho.",
      "Dlulisa ibhola izikhathi ezine ku-isango ngalinye — sebenzisa indlela yangaphakathi yonyawo ku-10m.",
      "Sebenzisa izindosi ku-15m le-20m amasango.",
      "Izicelo zakho zokugcina ezi-3 kumele zisebenzise unyawo lwakho olubuthaka kuphela.",
    ],
    cameraSetup: "BEHIND the player · elevated · all 3 gates visible · shows pass trajectory.",
    metrics: [
      { key: "gate_precision",   label: "Gate Precision",   unit: "/12", description: "Passes through gate centre (both feet combined)" },
      { key: "velocity_control", label: "Velocity Control", unit: "pts", description: "AI rating: appropriate pace for each distance (1–10)" },
      { key: "weak_foot_score",  label: "Weak Foot Score",  unit: "/3",  description: "Number of weak-foot passes through gate" },
    ],
    focus: "passing technique — standing foot placement, hip rotation, follow-through, head down at contact, lace vs inside-of-foot selection, weight of pass appropriate to distance, weak foot mechanics",
    maxDuration: 90,
  },
  {
    id: "shooting",
    label: "Shooting",
    emoji: "🥅",
    category: "Technical",
    tagline: "Strike power · Placement accuracy · Non-dominant foot",
    diagram:
      "  [B]-------- GOAL (6m wide) --------[B]\n" +
      "   ^ top corner                top corner ^\n" +
      "\n" +
      "              * 11m  <- penalty spot\n" +
      "\n" +
      "           *  16m   <- free kick arc\n" +
      "\n" +
      "          [ YOU ]  aim for the corners",
    equipment: "Football · 4 sand-filled bottles (goal posts) · open wall or real goal",
    protocol: [
      "Mark a goal 6 metres wide using 2 bottles at each post.",
      "Series A — 3 shots from 11 metres (penalty spot). Aim: top left, top right, top left corner.",
      "Series B — 3 shots from 16 metres. Aim: low left corner, low right corner, your choice.",
      "Series C — 3 shots with your weaker foot from 11 metres.",
      "Wait 20 seconds between shots. No limit on your run-up.",
    ],
    protocolSn: [
      "Maka goal 6 metres wide ne mabhodhoro maviri pane post imwe neimwe.",
      "Series A — shaya 3 kubva pa 11 metres (penalty spot). Goneka: kona yekuruboshwe, kurudyi, kurudyi zvakare.",
      "Series B — shaya 3 kubva pa 16 metres. Goneka: kona yepasi kuruboshwe, kurudyi, iwe unosarudza.",
      "Series C — shaya 3 ne gumbo rako rakaoma kubva pa 11 metres.",
      "Mirira 20 seconds pakati peshots. Haina muganho pane kumhanya.",
    ],
    protocolNd: [
      "Maka isango esibanzi ama-6 amamamitha ngamabhodlela amabili ngepost ngayinye.",
      "Series A — shaya izi-3 ku-11 amamamitha (indawo ye-penalty). Miselela: ikhona ekhohlo, kwesokudla, ekhohlo futhi.",
      "Series B — shaya izi-3 ku-16 amamamitha. Miselela: ikhona ephansi kwekhohlo, kwesokudla, ukhetha.",
      "Series C — shaya izi-3 ngonyawo lwakho olubuthaka ku-11 amamamitha.",
      "Linda imizuzwana eli-20 phakathi kwezishayo. Alikho ithawela ekugijimeni.",
    ],
    cameraSetup: "BEHIND the goal · slightly elevated · capture both the striking foot AND the ball path.",
    metrics: [
      { key: "placement_accuracy", label: "Placement Accuracy", unit: "/9",  description: "Shots on target (within goal frame)" },
      { key: "strike_power",       label: "Strike Power",       unit: "pts", description: "AI rating: ball speed and contact quality (1–10)" },
      { key: "weak_foot_accuracy", label: "Weak Foot Accuracy", unit: "/3",  description: "Weak foot shots on target" },
    ],
    focus: "shooting technique — run-up angle, plant foot position, striking zone on boot (laces vs instep), follow-through, body lean, head position at contact, placement accuracy and power generation",
    maxDuration: 120,
  },
  {
    id: "crossing",
    label: "Crossing",
    emoji: "🌐",
    category: "Technical",
    tagline: "Landing zone accuracy · Delivery height · Both feet",
    diagram:
      "        [B]---- GOAL ----[B]\n" +
      "         |               |\n" +
      "  [B] <--+  TARGET ZONE  |   <- land cross here\n" +
      " (far     |  penalty spot|    (penalty spot to\n" +
      "  post)   +---------------+    far post)\n" +
      "              |\n" +
      "  ────────────●──── byline\n" +
      "              |\n" +
      "         [ YOU ] -> run from 35m and cross",
    equipment: "Football · 3 bottles (penalty spot + far post markers)",
    protocol: [
      "Put one bottle at the penalty spot and one at the far post — that is your TARGET ZONE.",
      "Start 35 metres from the goal near the side of the pitch.",
      "Run to the byline and then cross the ball into the target zone.",
      "Do 4 crosses from the left side and 4 from the right side — 8 total.",
      "Every cross must go above head height and arrive fast.",
    ],
    protocolSn: [
      "Isa bhodhoro rimwe pa penalty spot ne rimwe pamusuwo wekure — iyo ndiyo nzvimbo yako yegonekera.",
      "Tanga 35 metres kubva kugoal padivi repamucheto.",
      "Mhanya kubyline, wobva wakrossa bhora mukati menzvimbo yako.",
      "Ita ma-cross 4 kubva kuruboshwe ne 4 kubva kurudyi — 8 total.",
      "Cross imwe neimwe inofanira kupfuura pamwero wemusoro wemunhu ichibva nesimba.",
    ],
    protocolNd: [
      "Beka ibhodlela elilodwa endaweni ye-penalty spot elinye ku-far post — le yindawo yakho yokumiselela.",
      "Qala ku-35 amamamitha uvela esangweni eduze nzwangedge yenkundla.",
      "Gijima ku-byline bese uwela ibhola ngaphakathi kwendawo yakho.",
      "Yenza ama-cross ama-4 ohlangothini olwesokunxele nama-4 kwesokudla — gu-8 isamba.",
      "Yilelo cross kumele lidlule phezulu kwekhanda lomuntu lilandele ngamandla.",
    ],
    cameraSetup: "HIGH AND WIDE · 8m from crosser · capture run-up, contact, and ball flight.",
    metrics: [
      { key: "landing_accuracy", label: "Landing Zone Accuracy", unit: "/8",  description: "Crosses landing in the marked scoring zone" },
      { key: "delivery_height",  label: "Delivery Height",       unit: "pts", description: "AI rating: crosses clearing defensive line height (1–10)" },
      { key: "both_feet_ratio",  label: "Both Feet Ratio",       unit: "%",   description: "Quality of non-dominant foot crosses vs dominant" },
    ],
    focus: "crossing technique — approach angle, planting foot position, contact point on the ball (inside of laces), follow-through, bend and flight of delivery, height clearance over defenders, accuracy into target zone",
    maxDuration: 90,
  },
  {
    id: "free_kick",
    label: "Free Kick",
    emoji: "🌀",
    category: "Technical",
    tagline: "Bend accuracy · Strike elevation · Wall clearance",
    diagram:
      "  [B]------- GOAL (6m) -------[B]\n" +
      "   |                           |\n" +
      "   |   <- AIM: far corner      |\n" +
      "   +---------------------------+\n" +
      "              |\n" +
      "   [B][B][B]  |   <- 3-bottle WALL (9m from ball)\n" +
      "              |\n" +
      "         *    |   <- ball (25m out, slightly left)\n" +
      "\n" +
      "        [ YOU ]",
    equipment: "Football · 5 sand-filled bottles (3 for wall + 2 for goal posts)",
    protocol: [
      "Line up 3 bottles in a row 9 metres from the ball — this is your 'wall'.",
      "Mark a goal 6 metres wide with 2 bottles, 25 metres ahead of you.",
      "Place the ball 25 metres out, slightly to the left of the goal's centre.",
      "Try 5 free kicks — bend the ball over or around the bottle wall into the corner.",
      "Do 2 with your left foot, 2 with your right, 1 with the foot you choose. Shots hitting the wall do not count.",
    ],
    protocolSn: [
      "Teedzana mabhodhoro matatu mumutsara 9 metres kubva kubhora — iyo ndiyo 'wall' yako.",
      "Maka goal 6 metres wide ne mabhodhoro maviri, 25 metres pamberi pako.",
      "Isa bhora 25 metres mberi, kuruboshwe zvishoma kubva pakati pegoal.",
      "Edza ma free kicks mashanu — bengera bhora PAMUSORO kana KUNE RUDYI rwe wall yemabhodhoro upinde mukona.",
      "Ita 2 ne gumbo rerudyi, 2 ne reruboshwe, 1 ne gumbo raunosarudza. Kana ukabhurura wall hazvibvumirwe.",
    ],
    protocolNd: [
      "Beka amabhodlela amathathu ngomugqa amamamitha ali-9 uvela ebholeni — yiyo 'i-wall' yakho.",
      "Maka isango esibanzi ama-6 amamamitha ngamabhodlela amabili, amamamitha ali-25 phambi kwakho.",
      "Beka ibhola amamamitha ali-25 phambili, kancane kwesokudla ekhalfini yesango.",
      "Zama izishayo ezi-5 zamahhala — goba ibhola NGENHLA noma NXAZOMBILI kwe-wall yemabhodlela ushesha ekhoneni.",
      "Yenza ezi-2 ngonyawo lwesokudla, ezi-2 ngolwekhohlo, elilodwa ngowazikhethela. Izishayo ezihlaba uwall azibaliwe.",
    ],
    cameraSetup: "SIDE-ON · captures run-up, ball contact, and full flight path over the wall.",
    metrics: [
      { key: "wall_clearance",   label: "Wall Clearance",   unit: "/5",  description: "Kicks clearing the bottle wall" },
      { key: "target_accuracy",  label: "Target Accuracy",  unit: "/5",  description: "Kicks reaching the corner target zone" },
      { key: "strike_elevation", label: "Strike Elevation", unit: "pts", description: "AI rating: lift and flight trajectory quality (1–10)" },
    ],
    focus: "free kick technique — approach angle, standing foot position, striking zone (inside of laces for curl, instep for dip), follow-through direction, ball elevation, consistent contact point, mental routine and composure",
    maxDuration: 90,
  },
  {
    id: "heading_rosch",
    label: "Heading (Rosch Test)",
    emoji: "👤",
    category: "Technical",
    tagline: "Forehead contact · Attack angle · Bilateral coordination",
    diagram:
      "  +---------------------------+\n" +
      "  |   WALL   X  <- TARGET    |  20cm above arm reach\n" +
      "  |                          |\n" +
      "  +---------------------------+\n" +
      "\n" +
      "      ^ jump and attack\n" +
      "      |\n" +
      "   [ YOU ]  <- throw ball up, head at target",
    equipment: "Football · tape or chalk mark on wall (20cm above your reach height)",
    protocol: [
      "Make a mark on the wall 20cm higher than you can reach with your arm fully stretched up.",
      "Series A — Throw the ball up yourself and head it at the wall mark. Do 5 headers.",
      "Series B — Take 2 running steps, jump, and head the ball at the mark. Do 5 jumping headers.",
      "Series C — Head the ball as it comes from the left side, then the right side. 5 total.",
      "Ask a partner to throw the ball for Series B and C if you can.",
    ],
    protocolSn: [
      "Isa mako kumadziro 20cm kupfuura pakausvika ruoko rwako rwakatwasanurwa.",
      "Series A — Kandira bhora wega wobva uripapa richikanganisa mark yako. Ita 5.",
      "Series B — Mhanya nhanho mbiri, tsamira, upape bhora uchikanganisa mark. Ita 5.",
      "Series C — Pape bhora richidzooka kuruboshwe, wobva kurudyi. Total 5.",
      "Kana une shamwari, anokukanda bhora kune Series B ne C.",
    ],
    protocolNd: [
      "Beka uphawu odongeni olungama-20cm aphakamise ukwedlula lapho unyawo lwakho lungafinyelela khona.",
      "Series A — Phosa ibhola ngokwakho bese uthepha ukuze likhame uphawu. Yenza izi-5.",
      "Series B — Gijima izinyathelo ezi-2, xhuma, uthepha ibhola ukhame uphawu. Yenza izi-5.",
      "Series C — Thepha ibhola liza ohlangothini olwesokunxele, bese kwekhohlo. Izinhlandla ezi-5.",
      "Uma ulenqabathi, makakulahle ibhola ku-Series B naku-C.",
    ],
    cameraSetup: "FRONT-ON · 3m away · captures forehead contact point, neck position, and eyes.",
    metrics: [
      { key: "forehead_contact",   label: "Forehead Contact Accuracy", unit: "pts", description: "AI rating: consistent ball-to-forehead contact (1–10)" },
      { key: "attack_angle",       label: "Attack Angle",              unit: "pts", description: "AI rating: downward attack angle on the ball (1–10)" },
      { key: "bilateral_accuracy", label: "Bilateral Accuracy",        unit: "%",   description: "Header quality from weaker side vs stronger side" },
    ],
    focus: "heading technique — forehead contact (not crown of head), eyes open, neck muscles locked, attacking the ball (not waiting for it), body twist for power, jumping timing, neck strength and head stability on contact",
    maxDuration: 90,
  },
  {
    id: "ball_juggling",
    label: "Ball Juggling",
    emoji: "⚽",
    category: "Technical",
    tagline: "Consecutive count · Surface variety · Weak foot control",
    diagram:
      "         * keep it in the air!\n" +
      "        / | \\\n" +
      "      R   |   L    <- right foot, left foot\n" +
      "          |\n" +
      "          ^   <- thigh\n" +
      "          |\n" +
      "       [ YOU ]\n" +
      "\n" +
      "  Sequence: R x2 -> L x2 -> Thigh x1",
    equipment: "Football only — no extra equipment needed",
    protocol: [
      "Warm up — juggle the ball freely for 30 seconds to find your rhythm.",
      "Test 1 — Juggle with your feet only. Count how many in a row before it drops. Try twice.",
      "Test 2 — Follow this sequence for 30 seconds: right foot 2 times, left foot 2 times, thigh 1 time. Keep repeating.",
      "Test 3 — Juggle with your weaker foot only. Count how many in a row. Start from zero each time it drops.",
      "Rest 15 seconds between each test.",
    ],
    protocolSn: [
      "Warm up — juggla bhora pamwe chete for 30 seconds kuti uwane rhythm yako.",
      "Test 1 — Juggla ne magumbo chete. Verenga mangapi asina kudonha. Edzazvakare kaviri.",
      "Test 2 — Tevera sequence iyi for 30 seconds: gumbo rerudyi x2, reruboshwe x2, thigh x1. Dzokera kubvira.",
      "Test 3 — Juggla ne gumbo rako rakaoma chete. Verenga mangapi asina kudonha. Dzoka pazero pega drop.",
      "Zorora 15 seconds pakati petest imwe neimwe.",
    ],
    protocolNd: [
      "Warm up — juggla ibhola ngokukhululeka imizuzwana eli-30 ukuthola isigqi sakho.",
      "Test 1 — Juggla ngezinyawo kuphela. Bala ezingaphi zomugqa zingaweli. Zama kabili.",
      "Test 2 — Landela lena imizuzu eli-30: unyawo lwesokudla x2, lwesokuphakama x2, ithanga x1. Phinda usebenze.",
      "Test 3 — Juggla ngonyawo lwakho olubuthaka kuphela. Bala ezingaphi zomugqa. Buyela ku-zero ngalo lonke ukuwela.",
      "Phumula imizuzwana eli-15 phakathi kwabo bonke obavivinyo.",
    ],
    cameraSetup: "FRONT-ON · full body · waist height · all contact surfaces visible.",
    metrics: [
      { key: "max_consecutive",   label: "Max Consecutive Juggles", unit: "reps", description: "Best score from 2 attempts — feet only" },
      { key: "sequence_quality",  label: "Sequence Quality",        unit: "pts",  description: "AI rating: rhythm and surface variety in test 2 (1–10)" },
      { key: "weak_foot_juggles", label: "Weak Foot Consecutive",   unit: "reps", description: "Best consecutive count with non-dominant foot only" },
    ],
    focus: "juggling technique — ankle lock on contact, consistent contact point on foot, soft cushioning on receipt, body balance and core stability, height control (knee height), transition between surfaces, rhythm and relaxation",
    maxDuration: 120,
  },
  {
    id: "tennis_ball_cns",
    label: "Tennis Ball CNS Test",
    emoji: "🧠",
    category: "Cognitive",
    tagline: "Reaction time · Hand-eye coordination · Bilateral speed",
    diagram:
      "  +--------------------+\n" +
      "  |       WALL         |\n" +
      "  +----------+---------+\n" +
      "             |  ball bounces back\n" +
      "             |\n" +
      "   right <- (*) -> left   <- switch hands each time\n" +
      "             |\n" +
      "          [ YOU ]  1 metre from wall",
    equipment: "Tennis ball · wall or fence — no other equipment needed",
    protocol: [
      "Stand 1 metre from a wall or fence.",
      "Throw the tennis ball at the wall with your RIGHT hand. Catch it with your LEFT hand.",
      "Then throw with your LEFT hand. Catch with your RIGHT. That is 1 full cycle.",
      "Count how many full cycles you finish in 30 seconds. Rest 20 seconds. Do it again.",
      "Third test — same thing but CLOSE YOUR EYES right after throwing. Try to catch the ball by sound.",
    ],
    protocolSn: [
      "Mira 1 metre kubva kumadziro kana fence.",
      "Kanda bhora diki kumadziro ne RUOKO RWERUDYI. Ribate ne RUBOSHWE rwako.",
      "Wobva wakanda ne RUBOSHWE. Ribate ne RURUDYI. Iyo ndiyo cycle imwe yakazara.",
      "Verenga cycles dzakakwana muma 30 seconds. Zorora 20 seconds. Itazve.",
      "Test yechitatu — chinhu chimwe chete asi PFIGA MESO pashure pekukanda. Edza kubata nenzwi.",
    ],
    protocolNd: [
      "Yima amamitha alodwa uvela odongeni noma uthangeni.",
      "Phosa ibhola dike odongeni ngesandla SESOKUDLA. Sithathile ngesandla SEKHOHLO.",
      "Bese uphosa ngesandla SEKHOHLO. Sithathile ngesandla SESOKUDLA. Leyo ngu-cycle eyodwa ephelele.",
      "Bala izinhlangano eziphelele kwimizuzwana eli-30. Phumula imizuzwana eli-20. Phinda.",
      "Isivivinyo sesithathu — into efanayo kodwa VALA AMEHLO akho emva kokufosa. Zama ukubamba ngomsindo.",
    ],
    cameraSetup: "SIDE-ON · 1.5m distance · captures both hands and wall contact clearly.",
    metrics: [
      { key: "cycles_30s",      label: "Cycles per 30 seconds", unit: "reps", description: "Successful throw-switch-catch cycles (best of 2 attempts)" },
      { key: "bilateral_speed", label: "Bilateral Speed",       unit: "pts",  description: "AI rating: smooth hand switching without hesitation (1–10)" },
      { key: "eyes_closed",     label: "Eyes-Closed Catches",   unit: "reps", description: "Successful catches on the third (eyes-closed) test" },
    ],
    focus: "CNS reaction and coordination — speed of throw-catch cycle, smooth bilateral hand switching, eyes tracking the ball, anticipation of bounce angle, rhythm without hesitation, eyes-closed auditory-proprioceptive catch quality",
    maxDuration: 90,
  },
  {
    id: "throw_in",
    label: "Throw-In",
    emoji: "🙌",
    category: "Technical",
    tagline: "Distance reach · Non-dominant stance · Technique score",
    diagram:
      "  ball starts BEHIND your head\n" +
      "        |\n" +
      "     [ YOU ]  <- feet must stay behind this line ---\n" +
      "        |\n" +
      "        +-----------> [B]  10m target (bottle)\n" +
      "        |\n" +
      "        +------------------------------> [B]  15m target (bottle)",
    equipment: "Football · 2 sand-filled bottles (targets at 10m and 15m)",
    protocol: [
      "Put one bottle at 10 metres and another at 15 metres straight ahead of you.",
      "Test A — 4 throw-ins from standing still. Both feet must stay behind the line the whole time.",
      "Test B — 4 throw-ins with a short 3-step run-up. Your feet must not cross the line when you let go.",
      "Test C — 3 throw-ins with your less natural foot in front (swap which foot leads).",
      "The ball must start from behind your head and travel in a clean arc — no short arm throws.",
    ],
    protocolSn: [
      "Isa bhodhoro rimwe pa 10 metres ne rimwe pa 15 metres pamberi kwako.",
      "Test A — 4 throw-ins nemirira chete. Magumbo ako ose asare kumashure kwemutsetse.",
      "Test B — 4 throw-ins nemhanyamhanya mishanu mitatu. Gumbo rako harifanire kupfuura mutsetse paunorasa.",
      "Test C — 3 throw-ins netsika yako isina nguva (shandura gumbo riri pamberi).",
      "Bhora rinofanira kutanga kumashure kwemusoro wako risvetuke zvakanaka — zorodzera pasina kumhanya.",
    ],
    protocolNd: [
      "Beka ibhodlela elilodwa ku-10 amamamitha elinye ku-15 amamamitha phambi kwakho.",
      "Test A — ama-throw-in ama-4 uthe uzime. Zombi izinyawo kumele zihlale ngemuva komugqa.",
      "Test B — ama-throw-in ama-4 nokubaleka izinyathelo ezi-3 ezifushane. Izinyawo zakho azihlangabezi umugqa uma ukhipha.",
      "Test C — ama-throw-in ama-3 ngesimo sakho esingelona esejwayelekile (shintsha unyawo olungaphambili).",
      "Ibhola kumele liqale ngemuva kwekhanda lakho liwele ngendlela enhle — ungasheshi ngezandla.",
    ],
    cameraSetup: "SIDE-ON · full body · captures feet position, arm arc, and ball release point.",
    metrics: [
      { key: "max_distance",    label: "Maximum Distance",      unit: "m",   description: "Furthest legal throw-in (feet behind line, ball behind head)" },
      { key: "weak_accuracy",   label: "Non-Dominant Accuracy", unit: "%",   description: "Throws landing on target — opposite stance" },
      { key: "technique_score", label: "Throw Technique",       unit: "pts", description: "AI rating: feet, arc, arm symmetry, follow-through (1–10)" },
    ],
    focus: "throw-in technique — both feet on or behind line, ball starting behind head, equal contribution from both hands, arching trajectory, distance and accuracy to target, comparison between dominant and non-dominant stance, follow-through and body balance after release",
    maxDuration: 60,
  },
];

// ─── Vault helper ─────────────────────────────────────────────────────────────

const VAULT_KEY = "grassroots_highlight_vault";

function saveToVault(clip: { id: string; drill: string; videoUrl: string | null; feedback: THUTOFeedback; createdAt: string }) {
  try {
    const existing = JSON.parse(localStorage.getItem(VAULT_KEY) ?? "[]");
    const updated = [clip, ...existing].slice(0, 20);
    localStorage.setItem(VAULT_KEY, JSON.stringify(updated));
  } catch {}
}

// ─── Frame extraction ─────────────────────────────────────────────────────────

function extractFrame(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const vid  = document.createElement("video");
    vid.preload  = "metadata";
    vid.muted    = true;
    vid.playsInline = true;
    vid.src = url;
    vid.onloadedmetadata = () => { vid.currentTime = Math.min(vid.duration / 2, 15); };
    vid.onseeked = () => {
      try {
        const W = Math.min(vid.videoWidth || 640, 1280);
        const H = Math.min(vid.videoHeight || 480, 720);
        const canvas = document.createElement("canvas");
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(vid, 0, 0, W, H);
        const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
        URL.revokeObjectURL(url);
        resolve(base64);
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    vid.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not load video")); };
  });
}

// ─── R2 upload ────────────────────────────────────────────────────────────────

async function uploadToR2(blob: Blob, drillId: string): Promise<string | null> {
  try {
    const filename = `capture-${drillId}-${Date.now()}.webm`;
    const presignRes = await fetch("/api/upload/presigned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, content_type: "video/webm", folder: "captures" }),
    });
    if (!presignRes.ok) return null;
    const { uploadUrl, publicUrl } = (await presignRes.json()) as { uploadUrl: string; publicUrl: string | null };
    const putRes = await fetch(uploadUrl, { method: "PUT", body: blob, headers: { "Content-Type": "video/webm" } });
    if (!putRes.ok) return null;
    return publicUrl;
  } catch { return null; }
}

// ─── Typewriter hook ──────────────────────────────────────────────────────────

function useTypewriter(text: string, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}

// ─── Score colour helper ──────────────────────────────────────────────────────

function scoreColour(score: number) {
  if (score >= 7) return { bg: "#f0fdf4", border: "#bbf7d0", text: "#1a5c2a", label: "Strong" };
  if (score >= 5) return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", label: "Developing" };
  return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", label: "Needs Work" };
}

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: { id: DrillDef["category"]; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "Technical",  label: "Technical",  icon: <Target   className="h-4 w-4" />, color: "#1a5c2a" },
  { id: "Cognitive",  label: "Cognitive",  icon: <Brain    className="h-4 w-4" />, color: "#7c3aed" },
  { id: "Physical",   label: "Physical",   icon: <Activity className="h-4 w-4" />, color: "#c2410c" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function FootballSkillAnalysisPage() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // ── State ──
  const [screen,       setScreen]       = useState<Screen>("select");
  const [drillId,      setDrillId]      = useState<string>("");
  const [elapsed,      setElapsed]      = useState(0);
  const [feedback,     setFeedback]     = useState<THUTOFeedback | null>(null);
  const [videoUrl,     setVideoUrl]     = useState<string | null>(null);
  const [savedToVault, setSavedToVault] = useState(false);
  const [errorMsg,     setErrorMsg]     = useState("");
  const [cameraError,  setCameraError]  = useState(false);
  const [lang,         setLang]         = useState<"en" | "en-sn" | "en-nd">("en");

  // Profile + history
  const [profile,       setProfile]       = useState<PlayerProfile | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [rank,          setRank]          = useState<number | null>(null);
  const [improvement,   setImprovement]   = useState<number | null>(null);

  // Practice plan
  const [practiceTicks,    setPracticeTicks]    = useState<boolean[]>([]);
  const [practiceComplete, setPracticeComplete] = useState(false);

  // ── Refs ──
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef     = useRef<Blob | null>(null);

  // ── Typewriter ──
  const strengthText   = useTypewriter(screen === "feedback" ? (feedback?.strength ?? "")           : "", 20);
  const correctionText = useTypewriter(screen === "feedback" ? (feedback?.correction ?? "")          : "", 20);
  const drillText      = useTypewriter(screen === "feedback" ? (feedback?.drillRecommendation ?? "") : "", 20);

  const drill = DRILLS.find((d) => d.id === drillId) ?? null;

  // ── Fetch player profile on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!token || !user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data) setProfile(data.data);
        else if (data)  setProfile(data);
      })
      .catch(() => {});
  }, [token, user]);

  // ── Sync practice ticks with exercises count ──────────────────────────────
  useEffect(() => {
    const count = feedback?.practice_plan?.exercises?.length ?? 0;
    setPracticeTicks(Array(count).fill(false));
    setPracticeComplete(false);
  }, [feedback]);

  // ── Camera ────────────────────────────────────────────────────────────────

  const startCamera = async (): Promise<void> => {
    setCameraError(false);
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch { setCameraError(true); }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (screen === "recording") {
      startCamera().then(() => {
        setTimeout(() => { if (streamRef.current) startRecording(); }, 400);
      });
    }
    if (screen === "select" || screen === "protocol") stopStream();
    return () => { if (screen !== "recording") stopStream(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => () => stopStream(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Recording ─────────────────────────────────────────────────────────────

  const getMimeType = (): string => {
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    if (typeof MediaRecorder === "undefined") return "";
    return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    recorderRef.current = null;
    chunksRef.current   = [];
    const mimeType = getMimeType();
    const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
      blobRef.current = blob;
      handleUploadAndAnalyse(blob);
    };
    recorder.start(200);
    recorderRef.current = recorder;
    const maxSec = drill?.maxDuration ?? 60;
    setElapsed(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= maxSec - 1) { stopRecording(); return maxSec; }
        return prev + 1;
      });
    }, 1000);
  }, [drill]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setScreen("uploading");
  }, []);

  // ── Upload + Analyse ──────────────────────────────────────────────────────

  const handleUploadAndAnalyse = async (blob: Blob) => {
    if (!drill) return;
    try {
      let frame: string | null = null;
      try { frame = await extractFrame(blob); } catch {}

      const r2Url = await uploadToR2(blob, drill.id);
      setVideoUrl(r2Url);

      // Player profile context for THUTO / AMARA
      const playerName = profile?.first_name ?? (user?.name?.split(" ")[0]) ?? "Player";
      const position   = profile?.position ?? "footballer";
      const gender     = profile?.gender   ?? "";
      const age_group  = profile?.age_group ?? "";

      const res = await fetch("/api/capture/analyse", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          frame,
          drill:      drill.label,
          focus:      drill.focus,
          playerName,
          position,
          gender,
          age_group,
          videoUrl:   r2Url,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = (await res.json()) as THUTOFeedback;
      setFeedback(data);
      setScreen("feedback");

      // Save to drill_analysis_results + get rank/improvement from backend
      try {
        const saveRes = await api.post("/player/captures/drill-result", {
          drill_id:       drill.id,
          drill_name:     drill.label,
          overall_score:  data.drill_score,
          feedback:       `${data.strength} ${data.correction} ${data.drillRecommendation}`,
          video_url:      r2Url ?? undefined,
          age_group:      age_group || undefined,
          gender:         gender || undefined,
          position:       position !== "footballer" ? position : undefined,
          practice_plan:  data.practice_plan,
          sport:          "football",
        });
        const saved = saveRes.data?.data ?? saveRes.data;
        if (saved?.previous_score !== undefined) setPreviousScore(saved.previous_score);
        if (saved?.improvement    !== undefined) setImprovement(saved.improvement);
        if (saved?.rank           !== undefined) setRank(saved.rank);
      } catch {
        // Backend save failed silently — feedback still shown
      }

      // Also save to local vault
      try {
        saveToVault({ id: `${Date.now()}`, drill: drill.label, videoUrl: r2Url, feedback: data, createdAt: new Date().toISOString() });
      } catch {}

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setErrorMsg(msg);
      setScreen("error");
    }
  };

  // ── Practice tick ─────────────────────────────────────────────────────────

  const toggleTick = (index: number) => {
    setPracticeTicks((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      setPracticeComplete(updated.every(Boolean));
      return updated;
    });
  };

  // ── Retest (same drill, reset capture state) ──────────────────────────────

  const retest = () => {
    // Keep drillId — same drill
    blobRef.current = null;
    // previousScore stays as the old best (for next comparison)
    const lastScore = feedback?.drill_score ?? null;
    if (lastScore !== null) setPreviousScore(lastScore);
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setPracticeTicks([]);
    setPracticeComplete(false);
    setRank(null);
    setImprovement(null);
    setScreen("protocol");
  };

  // ── Full reset ────────────────────────────────────────────────────────────

  const reset = () => {
    blobRef.current = null;
    setFeedback(null);
    setVideoUrl(null);
    setSavedToVault(false);
    setElapsed(0);
    setPreviousScore(null);
    setRank(null);
    setImprovement(null);
    setPracticeTicks([]);
    setPracticeComplete(false);
    setScreen("select");
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const playerName = profile?.first_name ?? user?.name?.split(" ")[0] ?? "Player";
  const playerPos  = profile?.position ?? "";
  const playerAG   = profile?.age_group ?? "";

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#f4f2ee" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto">

        {/* ── Header ── */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3"
          style={{ backgroundColor: "#fff", borderColor: "#e5e5e5" }}
        >
          {screen === "select" ? (
            <Link
              href="/player"
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#e5e5e5" }}
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Link>
          ) : (
            <button
              onClick={() => {
                if (screen === "protocol")  setScreen("select");
                else if (screen === "recording" || screen === "feedback" || screen === "error") reset();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:bg-gray-100"
              style={{ borderColor: "#e5e5e5" }}
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate" style={{ color: "#1a5c2a" }}>
              Football Skill Analysis
            </h1>
            <p className="text-xs text-gray-500 truncate">
              {screen === "select"    && "Select a drill to analyse"}
              {screen === "protocol" && (drill?.label ?? "Setup & Protocol")}
              {screen === "recording" && `Recording — ${drill?.label}`}
              {screen === "uploading" && "THUTO is analysing..."}
              {screen === "feedback"  && `${drill?.label} — Feedback`}
              {screen === "error"     && "Analysis failed"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {/* THUTO badge */}
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: "#f0fdf4", color: "#1a5c2a", border: "1px solid #bbf7d0" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              THUTO
              {profile?.gender === "female" && <span className="ml-0.5 text-purple-600">+ AMARA</span>}
            </div>
            {/* Player chip */}
            {profile && (
              <p className="text-xs text-gray-400 truncate max-w-[140px]">
                {playerName}{playerPos ? ` · ${playerPos}` : ""}{playerAG ? ` · ${playerAG}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 1 — DRILL SELECT
              ════════════════════════════════════════════════════════════════ */}
          {screen === "select" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Select a drill · record your technique · get scored feedback.
                </p>
                <Link
                  href="/player/capture/leaderboard"
                  className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e5e5e5", color: "#1a5c2a" }}
                >
                  <Trophy className="h-3.5 w-3.5" />
                  Leaderboard
                </Link>
              </div>

              {/* Language selector */}
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Instructions language / Mutauro / Ulimi
                </p>
                <div className="flex gap-2">
                  {(
                    [
                      { id: "en",    label: "English only" },
                      { id: "en-sn", label: "English + ChiShona" },
                      { id: "en-nd", label: "English + isiNdebele" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setLang(opt.id)}
                      className="flex-1 rounded-xl border py-2 text-xs font-semibold transition-all"
                      style={
                        lang === opt.id
                          ? { backgroundColor: "#1a5c2a", color: "#fff", borderColor: "#1a5c2a" }
                          : { backgroundColor: "#fff", color: "#555", borderColor: "#e5e5e5" }
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {CATEGORIES.map((cat) => {
                const catDrills = DRILLS.filter((d) => d.category === cat.id);
                if (catDrills.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.icon}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {cat.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {catDrills.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => { setDrillId(d.id); setScreen("protocol"); }}
                          className="flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all hover:shadow-sm active:scale-[0.99]"
                          style={{ borderColor: "#e5e5e5" }}
                        >
                          <span className="text-2xl">{d.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>{d.label}</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{d.tagline}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 2 — PROTOCOL
              ════════════════════════════════════════════════════════════════ */}
          {screen === "protocol" && drill && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-white border p-5" style={{ borderColor: "#e5e5e5" }}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl">{drill.emoji}</span>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#1a5c2a" }}>{drill.label}</h2>
                    <p className="text-xs text-gray-500">{drill.tagline}</p>
                  </div>
                </div>
              </div>

              {previousScore !== null && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#1a5c2a" }}
                >
                  <TrendingUp className="h-4 w-4 flex-shrink-0" />
                  <span>Previous best: <strong>{previousScore.toFixed(1)}/10</strong> — can you beat it?</span>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Equipment needed</p>
                <p className="text-sm text-gray-700">{drill.equipment}</p>
              </div>

              {drill.diagram && (
                <div
                  className="rounded-2xl border p-4 overflow-x-auto"
                  style={{ backgroundColor: "#f8faff", borderColor: "#dbeafe" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2">Drill diagram</p>
                  <pre
                    className="text-xs leading-relaxed whitespace-pre"
                    style={{ color: "#1e3a5f", fontFamily: "monospace" }}
                  >
                    {drill.diagram}
                  </pre>
                </div>
              )}

              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Setup & Protocol</p>
                <ol className="space-y-2.5">
                  {(lang === "en-sn" ? drill.protocolSn : lang === "en-nd" ? drill.protocolNd : drill.protocol).map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5"
                        style={{ backgroundColor: "#1a5c2a" }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
              >
                <div className="flex items-start gap-2">
                  <Camera className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">Camera Position</p>
                    <p className="text-sm text-amber-800">{drill.cameraSetup}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">What THUTO will assess</p>
                <div className="space-y-3">
                  {drill.metrics.map((m) => (
                    <div key={m.key} className="flex items-start gap-3">
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                        style={{ backgroundColor: "#1a5c2a" }}
                      >
                        {m.unit.length <= 3 ? m.unit : "#"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{m.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setScreen("recording")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-bold text-white transition-all active:scale-95"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <Video className="h-5 w-5" />
                Start Recording ({drill.maxDuration}s max)
              </button>

              <p className="text-center text-xs text-gray-400">
                Follow the protocol above before pressing record.
                THUTO will analyse your technique from the video.
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 3 — RECORDING
              ════════════════════════════════════════════════════════════════ */}
          {screen === "recording" && drill && (
            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-2xl bg-black aspect-[9/16] max-h-[440px]">
                {cameraError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                    <Camera className="h-12 w-12 opacity-40" />
                    <p className="text-sm">Camera not available</p>
                    <button
                      onClick={startCamera}
                      className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                    >
                      Try again
                    </button>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                    <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-bold text-white">REC</span>
                    </div>
                    <div className="absolute top-4 right-4 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                      <span className="text-xs font-bold text-white tabular-nums">
                        {drill.maxDuration - elapsed}s
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-500 transition-all duration-1000"
                        style={{ width: `${(elapsed / drill.maxDuration) * 100}%` }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-xl bg-white border p-4 text-center" style={{ borderColor: "#e5e5e5" }}>
                <p className="text-2xl mb-1">{drill.emoji}</p>
                <p className="font-semibold text-sm" style={{ color: "#1a5c2a" }}>{drill.label}</p>
                <p className="text-xs text-gray-400 mt-1">{elapsed}s elapsed · max {drill.maxDuration}s</p>
              </div>

              {!cameraError && (
                <button
                  onClick={stopRecording}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 py-4 text-base font-bold transition-all active:scale-95"
                  style={{ borderColor: "#ef4444", color: "#ef4444", backgroundColor: "#fef2f2" }}
                >
                  <Square className="h-5 w-5 fill-red-500" />
                  Stop & Analyse
                </button>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 4 — UPLOADING / ANALYSING
              ════════════════════════════════════════════════════════════════ */}
          {screen === "uploading" && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full shadow-lg"
                  style={{ background: "linear-gradient(135deg, #1a5c2a, #16a34a)" }}
                >
                  <span className="text-4xl">🤖</span>
                </div>
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400">
                  <span className="h-2 w-2 rounded-full bg-yellow-600 animate-ping" />
                </span>
              </div>
              <h2 className="text-xl font-bold" style={{ color: "#1a5c2a" }}>THUTO is analysing</h2>
              <p className="mt-2 text-sm text-gray-500">
                Reviewing your {drill?.label.toLowerCase()} technique
              </p>
              <div className="mt-6 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-green-500"
                    style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
              <style>{`
                @keyframes bounce {
                  0%, 100% { transform: translateY(0); }
                  50%       { transform: translateY(-8px); }
                }
              `}</style>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 5 — FEEDBACK
              ════════════════════════════════════════════════════════════════ */}
          {screen === "feedback" && feedback && drill && (
            <div className="space-y-4">

              {/* THUTO header */}
              <div
                className="flex items-center gap-3 rounded-2xl border p-4"
                style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
              >
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #1a5c2a, #16a34a)" }}
                >
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: "#1a5c2a" }}>THUTO{profile?.gender === "female" ? " + AMARA" : ""}</p>
                  <p className="text-xs text-gray-500">{drill.label} · just now</p>
                </div>
              </div>

              {/* ── SCORE BADGE ── */}
              {(() => {
                const sc = scoreColour(feedback.drill_score);
                return (
                  <div
                    className="flex flex-col items-center rounded-2xl border p-5"
                    style={{ backgroundColor: sc.bg, borderColor: sc.border }}
                  >
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: sc.text }}>
                      THUTO Score
                    </p>
                    <p className="text-5xl font-black tabular-nums" style={{ color: sc.text }}>
                      {feedback.drill_score.toFixed(1)}
                      <span className="text-2xl font-bold">/10</span>
                    </p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: sc.text }}>{sc.label}</p>

                    {/* Progress vs previous */}
                    {previousScore !== null && improvement !== null && (
                      <div className="mt-3 flex items-center gap-2">
                        {improvement > 0 ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">
                              +{improvement.toFixed(1)} vs best ({previousScore.toFixed(1)})
                            </span>
                          </>
                        ) : improvement < 0 ? (
                          <>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-semibold text-red-600">
                              {improvement.toFixed(1)} vs best ({previousScore.toFixed(1)})
                            </span>
                          </>
                        ) : (
                          <>
                            <Minus className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-600">
                              Same as best ({previousScore.toFixed(1)})
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Rank */}
                    {rank !== null && rank <= 20 && (
                      <div
                        className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ backgroundColor: rank <= 3 ? "#c8962a" : "#1a5c2a", color: "#fff" }}
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        Ranked #{rank}
                        {playerAG ? ` in ${playerAG}` : ""}
                        {profile?.gender ? ` ${profile.gender === "female" ? "Female" : "Male"}` : ""}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Strength */}
              <div className="rounded-xl border p-4" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✅</span>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#1a5c2a" }}>
                    What you did well
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {strengthText}
                  {strengthText.length < (feedback.strength?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-green-600 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Correction */}
              <div className="rounded-xl border p-4" style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                    One thing to fix
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {correctionText}
                  {correctionText.length < (feedback.correction?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-amber-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* Drill recommendation */}
              <div className="rounded-xl border p-4" style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏋️</span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Drill to try right now
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-gray-800 min-h-[3rem]">
                  {drillText}
                  {drillText.length < (feedback.drillRecommendation?.length ?? 0) && (
                    <span className="inline-block h-4 w-0.5 bg-blue-500 animate-pulse ml-0.5 align-middle" />
                  )}
                </p>
              </div>

              {/* ── PRACTICE PLAN ── */}
              {feedback.practice_plan?.exercises?.length > 0 && (
                <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "#e5e5e5" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <RefreshCw className="h-4 w-4" style={{ color: "#1a5c2a" }} />
                    <p className="font-bold text-sm" style={{ color: "#1a5c2a" }}>
                      {feedback.practice_plan.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Tick each exercise when done. When all are ticked, Retest unlocks.
                  </p>

                  <div className="space-y-4">
                    {feedback.practice_plan.exercises.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => toggleTick(i)}
                        className="w-full flex items-start gap-3 rounded-xl p-3 text-left transition-colors"
                        style={{
                          backgroundColor: practiceTicks[i] ? "#f0fdf4" : "#f9fafb",
                          border: `1px solid ${practiceTicks[i] ? "#bbf7d0" : "#f3f4f6"}`,
                        }}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {practiceTicks[i]
                            ? <CheckSquare className="h-5 w-5 text-green-600" />
                            : <SquareIcon  className="h-5 w-5 text-gray-400" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold" style={{ color: practiceTicks[i] ? "#1a5c2a" : "#1a1a1a" }}>
                              {ex.name}
                            </p>
                            <span className="rounded-full px-2 py-0.5 text-xs"
                                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                              {ex.duration}
                            </span>
                            <span className="rounded-full px-2 py-0.5 text-xs"
                                  style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                              {ex.reps}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600 leading-relaxed">{ex.description}</p>
                          <p className="mt-1 text-xs italic text-gray-400">{ex.why}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Retest button */}
                  <button
                    onClick={retest}
                    disabled={!practiceComplete}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold transition-all"
                    style={practiceComplete
                      ? { backgroundColor: "#1a5c2a", color: "#fff" }
                      : { backgroundColor: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }
                    }
                  >
                    <RefreshCw className="h-5 w-5" />
                    {practiceComplete ? "Retest Now — Beat Your Score!" : `Complete all ${feedback.practice_plan.exercises.length} exercises to unlock Retest`}
                  </button>
                </div>
              )}

              {/* Secondary actions */}
              <div className="flex gap-3">
                <button
                  onClick={retest}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: "#1a5c2a", color: "#1a5c2a" }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Record Again
                </button>

                <Link
                  href={`/player/capture/leaderboard?drill_id=${drill.id}&age_group=${playerAG}&gender=${profile?.gender ?? ""}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border py-3.5 text-sm font-semibold transition-all hover:bg-gray-50 active:scale-95"
                  style={{ borderColor: "#e5e5e5", color: "#374151" }}
                >
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Link>
              </div>

              {videoUrl && !savedToVault && (
                <button
                  onClick={() => {
                    saveToVault({ id: `${Date.now()}`, drill: drill.label, videoUrl, feedback, createdAt: new Date().toISOString() });
                    setSavedToVault(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
                  style={{ backgroundColor: "#c8962a", color: "#fff" }}
                >
                  <CheckCircle className="h-4 w-4" />
                  Save Video to Vault
                </button>
              )}
              {savedToVault && (
                <Link
                  href="/player/vault"
                  className="block w-full rounded-xl border py-3 text-center text-sm text-gray-500 hover:bg-gray-50"
                  style={{ borderColor: "#e5e5e5" }}
                >
                  View in Highlight Vault →
                </Link>
              )}

              <button onClick={reset} className="block w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600">
                ← Choose a different drill
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              SCREEN 6 — ERROR
              ════════════════════════════════════════════════════════════════ */}
          {screen === "error" && (
            <div className="flex flex-col items-center py-16 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-bold text-gray-800">Analysis failed</h2>
              <p className="mt-2 max-w-xs text-sm text-gray-500">{errorMsg}</p>
              <button
                onClick={() => setScreen("protocol")}
                className="mt-8 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: "#1a5c2a" }}
              >
                <RotateCcw className="h-4 w-4" />
                Try again
              </button>
              <button onClick={reset} className="mt-3 text-xs text-gray-400 hover:text-gray-600">
                Choose different drill
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
