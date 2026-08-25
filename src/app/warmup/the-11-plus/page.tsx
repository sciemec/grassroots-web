"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, ChevronDown, ChevronUp,
  MapPin, Lightbulb, Timer, ImageIcon, Users, AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type AgeBand = "u9_12" | "u13_15" | "u16_18" | "senior";

interface AgeGuidance {
  id: string;
  age_band: AgeBand;
  part_number: 1 | 2 | 3;
  recommended_level: 1 | 2 | 3 | null;
  adjusted_dosage_note: string;
  coach_notes: string | null;
}

const AGE_BAND_LABELS: Record<AgeBand, string> = {
  u9_12:   "U9–12",
  u13_15:  "U13–15",
  u16_18:  "U16–18",
  senior:  "Senior / Adult",
};

interface Exercise {
  id: string;
  name: string;
  mediaAssetId: string;
  startingPosition: string;
  instructions: string;
  cues: string;
  dosage: string;
}

// ── Part 1: Running ────────────────────────────────────────────────────────────

const PART1: Exercise[] = [
  {
    id: "p1-1",
    name: "Running Straight Ahead",
    mediaAssetId: "11plus_p1_01_straight",
    startingPosition:
      "Stand at one end of the 10 m cone line, partner beside you. Comfortable spacing — no need to be right next to each other.",
    instructions:
      "Run alongside your partner from one cone to the other at a comfortable warm-up pace (50–60%). Run tall with arms relaxed at your sides. Walk back, then repeat.",
    cues:
      "Land on the ball of your foot — not the heel. Keep your core lightly braced. Hips stay level and square; avoid rocking side to side.",
    dosage: "2 × 10 m",
  },
  {
    id: "p1-2",
    name: "Hip Out",
    mediaAssetId: "11plus_p1_02_hip_out",
    startingPosition:
      "Stand beside your partner at the start cone, both facing the same direction.",
    instructions:
      "Run forward. With each stride, swing the leading knee outward (external hip rotation) before the foot plants. The foot lands normally, but the knee has arced outward on its way down.",
    cues:
      "Control the rotation — don't let the knee snap inward on contact. Keep your torso upright and arms swinging normally. Don't rush the movement.",
    dosage: "2 × 10 m",
  },
  {
    id: "p1-3",
    name: "Hip In",
    mediaAssetId: "11plus_p1_03_hip_in",
    startingPosition:
      "Stand beside your partner at the start cone, both facing the same direction.",
    instructions:
      "Run forward. With each stride, swing the leading knee inward (internal hip rotation) so it crosses toward the midline before the foot plants.",
    cues:
      "Use your arms to counter-rotate and maintain balance. Gaze stays forward. Keep your shoulders square to the direction of travel.",
    dosage: "2 × 10 m",
  },
  {
    id: "p1-4",
    name: "Circling Partner",
    mediaAssetId: "11plus_p1_04_circling",
    startingPosition:
      "Face your partner, approximately 1 m apart. Place both hands on each other's shoulders.",
    instructions:
      "Both players shuffle sideways to circle around each other while keeping hold of their partner's shoulders. Complete one full circle, then immediately reverse direction and repeat.",
    cues:
      "Keep your weight low — hips slightly below shoulder height. Bend your knees throughout. Push off the outside foot to drive the circle. Don't drag or pull your partner.",
    dosage: "2 circles each direction",
  },
  {
    id: "p1-5",
    name: "Jumping with Shoulder Contact",
    mediaAssetId: "11plus_p1_05_jump_contact",
    startingPosition:
      "Run side by side with your partner, approximately 50–60 cm apart.",
    instructions:
      "Run together at medium pace. Every third stride, both players jump and make brief shoulder-to-shoulder contact at the top of the jump. Land on both feet with bent knees to absorb the impact.",
    cues:
      "Contact must be shoulder only — no elbows or forearms. Land softly with knees bent and tracking over your toes. Lean slightly into the contact; don't shy away from it.",
    dosage: "2 × 10 m",
  },
  {
    id: "p1-6",
    name: "Running with Plant and Cut",
    mediaAssetId: "11plus_p1_06_plant_cut",
    startingPosition:
      "Stand at one end of the cones. Partner runs alongside you.",
    instructions:
      "Sprint at 75% effort toward the far cone. At the cone, plant your outside foot firmly and cut sharply back in the other direction. Sprint back. Alternate the cutting foot on each set.",
    cues:
      "Point the plant foot in the direction you came from. Drop your hips as you plant — stay low. Drive off the outer edge of the plant foot. Keep your centre of gravity low through the cut.",
    dosage: "2 × 10 m (1 cut per length)",
  },
];

// ── Part 2: Strength, Plyometrics & Balance (3 levels × 6 exercises) ──────────

const PART2: Record<1 | 2 | 3, Exercise[]> = {
  1: [
    {
      id: "p2-l1-1",
      name: "The Bench",
      mediaAssetId: "11plus_p2_01_bench_l1",
      startingPosition:
        "Lie face-down. Prop yourself up on your forearms and toes so your body is in a straight line from head to heels (forearm plank).",
      instructions:
        "Hold the plank position for 20–30 seconds with a straight line from head to heels. Lower under control. Rest briefly and repeat 2–3 times.",
      cues:
        "Don't let your hips sag toward the floor or rise into the air. Brace your core and squeeze your glutes. Breathe steadily — don't hold your breath.",
      dosage: "2–3 × 20–30 s hold",
    },
    {
      id: "p2-l1-2",
      name: "Lateral Hip Rotation",
      mediaAssetId: "11plus_p2_02_hip_rot_l1",
      startingPosition:
        "Lie on your side with hips stacked. Support yourself on your forearm with your elbow directly under your shoulder. Legs straight, feet stacked.",
      instructions:
        "Press into your forearm and raise your hips off the floor so your body forms a straight line from head to feet. Hold for 20–30 seconds. Lower and switch sides.",
      cues:
        "Keep your hips forward — don't let them rotate back. Squeeze the glute of the top leg. Keep your neck in line with your spine.",
      dosage: "2 × 20–30 s each side",
    },
    {
      id: "p2-l1-3",
      name: "Nordic Hamstring Curls",
      mediaAssetId: "11plus_p2_03_nordic_l1",
      startingPosition:
        "Kneel upright on a mat. A partner kneels behind you and holds both your ankles firmly against the floor.",
      instructions:
        "Keeping your body in a straight line from knees to head, slowly fall forward by letting your knees straighten. Lower as far as you can control, catch yourself with your hands, then push back up. 3–5 reps.",
      cues:
        "Resist the fall for as long as possible — the slower the descent, the more your hamstrings work. Keep your hips fully extended; don't hinge at the hip. Let yourself fall fast only at the very end.",
      dosage: "2 × 3–5 reps",
    },
    {
      id: "p2-l1-4",
      name: "Single-Leg Stance",
      mediaAssetId: "11plus_p2_04_balance_l1",
      startingPosition:
        "Stand upright near a wall (for safety). Lift one foot off the ground with the knee bent to about 90°.",
      instructions:
        "Hold the single-leg stance for 30 seconds with minimal wobble. Keep the standing knee slightly bent throughout. Swap legs and repeat.",
      cues:
        "Fix your gaze on a stationary point straight ahead — this helps balance. Keep the standing hip level; don't let the pelvis drop to the raised-leg side. Small arm adjustments are fine.",
      dosage: "2 × 30 s each leg",
    },
    {
      id: "p2-l1-5",
      name: "Squats + Calf Raises",
      mediaAssetId: "11plus_p2_05_squat_l1",
      startingPosition:
        "Stand with feet shoulder-width apart, toes pointed slightly outward. Arms can reach forward for balance.",
      instructions:
        "Slowly lower into a squat over 3 seconds. Hold at the bottom for 1 second. Rise slowly over 3 seconds. At the top, rise onto your toes for a calf raise. Lower your heels and go straight into the next rep.",
      cues:
        "Knees track over the second toe — never let them cave inward. Keep your chest up and your weight in your heels. Aim for thighs parallel to the floor at the bottom.",
      dosage: "3 × 10 reps",
    },
    {
      id: "p2-l1-6",
      name: "Jumping",
      mediaAssetId: "11plus_p2_06_jump_l1",
      startingPosition:
        "Stand with a line on the ground (or a flat cone) to your side. Feet together, knees slightly bent.",
      instructions:
        "Jump sideways back and forth over the line continuously for 30 seconds. Land on both feet with bent knees to absorb each landing. Aim for smooth, controlled rhythm.",
      cues:
        "Quiet landings = good absorption. Noisy, heavy landings mean your knees are too straight on contact. Keep your knees over your toes throughout. Stay light on your feet.",
      dosage: "3 × 30 s",
    },
  ],
  2: [
    {
      id: "p2-l2-1",
      name: "The Bench",
      mediaAssetId: "11plus_p2_01_bench_l2",
      startingPosition:
        "Forearm plank position — body straight, elbows under shoulders, toes on floor.",
      instructions:
        "While holding the plank, lift one foot off the ground and hold for 2 seconds. Lower it and lift the other. Alternate feet continuously for 20–30 seconds. Repeat 2–3 times.",
      cues:
        "Keep your hips perfectly square to the floor — don't rotate when you lift the leg. Core stays braced throughout. Breathe steadily.",
      dosage: "2–3 × 20–30 s",
    },
    {
      id: "p2-l2-2",
      name: "Lateral Hip Rotation",
      mediaAssetId: "11plus_p2_02_hip_rot_l2",
      startingPosition:
        "Side plank on forearm and feet, hips stacked, body in a straight line.",
      instructions:
        "While holding the side plank, lift the top leg upward as high as controlled and lower it slowly — 10 repetitions without dropping the hips. Repeat on the other side.",
      cues:
        "Control the leg lift — don't kick it up fast. Keep the top hip forward throughout; rotating back is cheating. Feel the glute medius of the standing side working hard.",
      dosage: "2 × 10 leg lifts each side",
    },
    {
      id: "p2-l2-3",
      name: "Nordic Hamstring Curls",
      mediaAssetId: "11plus_p2_03_nordic_l2",
      startingPosition:
        "Kneel upright. Partner holds ankles firmly to the floor.",
      instructions:
        "Lower slowly toward the floor — aim for a deeper range than Level 1. At the very end, catch with your hands and push back to upright. 7–10 reps per set.",
      cues:
        "Take at least 3 seconds on the way down. The eccentric phase is the whole point — rushing it is wasted effort. Try to go a little deeper than the previous set.",
      dosage: "2–3 × 7–10 reps",
    },
    {
      id: "p2-l2-4",
      name: "Single-Leg Stance",
      mediaAssetId: "11plus_p2_04_balance_l2",
      startingPosition:
        "Stand on one leg, standing knee slightly bent. Partner stands 2–3 m away with a ball.",
      instructions:
        "Partner throws a ball at varying heights and directions. Catch it and return it without touching the raised foot down. 30 seconds each leg.",
      cues:
        "Track the ball early and shift your weight before it arrives. Keep the standing knee stable — avoid it diving inward when you reach for the ball.",
      dosage: "2 × 30 s each leg",
    },
    {
      id: "p2-l2-5",
      name: "Squats + Jump",
      mediaAssetId: "11plus_p2_05_squat_l2",
      startingPosition:
        "Stand with feet shoulder-width apart.",
      instructions:
        "Lower into a full squat using the same technique as Level 1. At the bottom, pause briefly, then explode upward into a jump. Land softly with bent knees and immediately sink into the next squat. 3 × 10 reps.",
      cues:
        "Land as quietly as possible — aim for a silent landing. On contact, absorb force through hips, knees, and ankles simultaneously. Never land with locked knees.",
      dosage: "3 × 10 reps",
    },
    {
      id: "p2-l2-6",
      name: "Jumping",
      mediaAssetId: "11plus_p2_06_jump_l2",
      startingPosition:
        "Stand with a line on the ground in front of you. Feet together, knees slightly bent.",
      instructions:
        "Jump forward and backward over the line continuously for 30 seconds. After each landing, immediately spring into the next jump — minimise ground contact time.",
      cues:
        "Use your arms to generate and absorb force. Stay on the balls of your feet throughout. Think of it as reactive: the moment you land, you're already going again.",
      dosage: "3 × 30 s",
    },
  ],
  3: [
    {
      id: "p2-l3-1",
      name: "The Bench",
      mediaAssetId: "11plus_p2_01_bench_l3",
      startingPosition:
        "Forearm plank position.",
      instructions:
        "While holding the plank, simultaneously raise the right arm and left leg until they are level with the body. Hold 2 seconds. Switch to left arm and right leg. Alternate continuously for 20–30 seconds.",
      cues:
        "No hip rotation allowed — this is an anti-rotation exercise. Move slowly. The goal is to stay completely still in the hips while extending the limbs.",
      dosage: "2–3 × 20–30 s",
    },
    {
      id: "p2-l3-2",
      name: "Lateral Hip Rotation",
      mediaAssetId: "11plus_p2_02_hip_rot_l3",
      startingPosition:
        "Side plank on forearm and feet, body in one straight line.",
      instructions:
        "From the top position, slowly lower your hip toward the floor (without touching), then raise it back to the straight-body position. 15 repetitions. Switch sides.",
      cues:
        "Full range of motion — the hip should come close to the floor on the way down. Squeeze hard at the top. Keep the neck neutral throughout.",
      dosage: "2 × 15 reps each side",
    },
    {
      id: "p2-l3-3",
      name: "Nordic Hamstring Curls",
      mediaAssetId: "11plus_p2_03_nordic_l3",
      startingPosition:
        "Kneel upright. Partner holds ankles firmly to the floor.",
      instructions:
        "Lower all the way to the floor, touch with your chest, use your hands to push back up, then use your hamstrings to pull your body back to upright. Full range. 12–15 reps.",
      cues:
        "If you feel a sharp pulling sensation in the hamstring — reduce range immediately. Progress this exercise gradually over multiple sessions. Never rush it.",
      dosage: "3 × 12–15 reps",
    },
    {
      id: "p2-l3-4",
      name: "Single-Leg Stance",
      mediaAssetId: "11plus_p2_04_balance_l3",
      startingPosition:
        "Stand on one leg on an unstable surface (foam pad, folded mat, or balance disc).",
      instructions:
        "Balance for 30 seconds with eyes open. Once stable, close your eyes to challenge proprioception further. Try to remain still with minimal corrections. Swap legs.",
      cues:
        "Only close your eyes once you are stable with them open. Keep the standing knee slightly flexed — a locked knee reduces proprioceptive input. Arms out for micro-adjustments.",
      dosage: "2 × 30 s each leg",
    },
    {
      id: "p2-l3-5",
      name: "Single-Leg Squats",
      mediaAssetId: "11plus_p2_05_squat_l3",
      startingPosition:
        "Stand on one leg, the other leg extended slightly forward off the floor. Arms out to the sides for balance.",
      instructions:
        "Slowly bend the standing knee and lower your body — aim for the thigh to become parallel to the floor. Return to standing under full control. 2 × 10 each leg.",
      cues:
        "Watch that your knee tracks over the second toe — if it drifts inward, reduce depth until you have more strength. Keep your hips level throughout.",
      dosage: "2 × 10 reps each leg",
    },
    {
      id: "p2-l3-6",
      name: "Jumping",
      mediaAssetId: "11plus_p2_06_jump_l3",
      startingPosition:
        "Stand beside a raised surface (box or step, 20–30 cm high). Feet together.",
      instructions:
        "Jump laterally onto the box, land softly, then immediately jump back down to the other side. Continue back and forth for 30 seconds. Maximum effort on every rep.",
      cues:
        "Every landing must be controlled — a knee that collapses inward is a risk. Think 'light feet'. Push for maximum power on each takeoff, not just going through the motions.",
      dosage: "3 × 30 s",
    },
  ],
};

// ── Part 3: Running at High Speed ─────────────────────────────────────────────

const PART3: Exercise[] = [
  {
    id: "p3-1",
    name: "Running Straight Ahead at Speed",
    mediaAssetId: "11plus_p3_01_sprint",
    startingPosition:
      "Stand at the start cone, partner beside you. This is the same set-up as Part 1 Exercise 1, but the intensity is now much higher.",
    instructions:
      "Run the 10 m at 80–90% of your maximum pace. Maintain good running mechanics even at high speed. Walk back and repeat.",
    cues:
      "Don't lean forward excessively at high speed. Drive your arms powerfully to support leg speed. Stay relaxed in the face and hands even at high intensity — tension wastes energy.",
    dosage: "2 × 10 m at 80–90%",
  },
  {
    id: "p3-2",
    name: "Bounding",
    mediaAssetId: "11plus_p3_02_bounding",
    startingPosition:
      "Stand at the start cone, ready to run.",
    instructions:
      "Run the length with an exaggerated skipping action — drive the knee high on each stride and push off powerfully from the back foot to gain maximum height and distance per stride. Focus on power, not pace.",
    cues:
      "Think 'up and out' with every stride. Drive the knee above hip height. Maintain powerful arm drive matching each leg. Land on the ball of the foot and immediately load into the next stride.",
    dosage: "2 × 10 m",
  },
  {
    id: "p3-3",
    name: "Plant and Cut at Speed",
    mediaAssetId: "11plus_p3_03_cut",
    startingPosition:
      "Stand at the start cone. Same set-up as Part 1 Exercise 6 — but now at near-maximum intensity.",
    instructions:
      "Sprint at 85–90% toward the far cone. At the cone, plant your outside foot hard and cut sharply back. Sprint back. The technique is identical to Part 1 but performed with full intensity.",
    cues:
      "At high speed the plant foot matters even more — point it in the direction you came from and drive off the outer edge. Stay low through the cut. Don't decelerate before the plant; commit to the cut.",
    dosage: "2 × 10 m (1 cut per length)",
  },
];

// ── Colour constants ───────────────────────────────────────────────────────────

const PART_COLORS = {
  1: "#1a5c2a",
  2: "#d97706",
  3: "#7c3aed",
} as const;

const LEVEL_STYLES: Record<1 | 2 | 3, { label: string; sub: string; color: string; bg: string; border: string }> = {
  1: { label: "Level 1", sub: "Beginner",     color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" },
  2: { label: "Level 2", sub: "Intermediate", color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  3: { label: "Level 3", sub: "Advanced",     color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ElevenPlusPage() {
  const [part2Level, setPart2Level]       = useState<1 | 2 | 3>(1);
  const [ageBand, setAgeBand]             = useState<AgeBand | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("gs_11plus_age_band");
    return (stored as AgeBand) ?? null;
  });
  const [ageGuidance, setAgeGuidance]     = useState<AgeGuidance[]>([]);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [programId, setProgramId]         = useState<string | null>(null);

  // Persist band selection across page refreshes
  const handleBandSelect = (band: AgeBand) => {
    setAgeBand(band);
    localStorage.setItem("gs_11plus_age_band", band);
  };

  // Resolve programme ID once on mount
  useEffect(() => {
    const base  = process.env.NEXT_PUBLIC_API_URL ?? "";
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    fetch(`${base}/warmup-programs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        const list: { id: string; code: string }[] = json?.data ?? [];
        const prog = list.find((p) => p.code === "FIFA_11_PLUS" || p.code === "the_11_plus");
        if (prog) setProgramId(prog.id);
      })
      .catch(() => {/* non-fatal — guidance just won't load */});
  }, []);

  // Fetch age guidance whenever band or programme ID changes
  useEffect(() => {
    if (!ageBand || !programId) return;
    const base  = process.env.NEXT_PUBLIC_API_URL ?? "";
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    setGuidanceLoading(true);
    fetch(`${base}/warmup-programs/${programId}/age-guidance?age_band=${ageBand}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => setAgeGuidance(json?.data ?? []))
      .catch(() => setAgeGuidance([]))
      .finally(() => setGuidanceLoading(false));
  }, [ageBand, programId]);

  const guidanceForPart = (part: 1 | 2 | 3): AgeGuidance | undefined =>
    ageGuidance.find((g) => g.part_number === part);

  // Auto-select the recommended Part 2 level when guidance loads
  useEffect(() => {
    const part2 = ageGuidance.find((g) => g.part_number === 2);
    if (part2?.recommended_level) setPart2Level(part2.recommended_level);
  }, [ageGuidance]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/warmup" style={{ color: "#6b7280", display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#111" }}>The 11+</p>
            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>FIFA injury-prevention warm-up</p>
          </div>
          <span style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, fontWeight: 700, color: "#1a5c2a",
            backgroundColor: "#f0fdf4", padding: "4px 10px",
            borderRadius: 20, border: "1px solid #bbf7d0", flexShrink: 0,
          }}>
            <Clock size={11} /> 20 min
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 80px" }}>

        {/* Overview card */}
        <Overview />

        {/* Age band selector */}
        <AgeBandSelector selected={ageBand} onSelect={handleBandSelect} />

        {/* Part 1 */}
        <PartSection number={1} title="Running" subtitle="Active stretching & controlled contact · ~8 min"
          guidance={guidanceForPart(1)} guidanceLoading={guidanceLoading && !!ageBand}>
          {PART1.map((ex) => <ExerciseCard key={ex.id} exercise={ex} />)}
        </PartSection>

        {/* Part 2 */}
        <PartSection number={2} title="Strength, Plyometrics & Balance" subtitle="Select your level below · ~10 min"
          guidance={guidanceForPart(2)} guidanceLoading={guidanceLoading && !!ageBand}>
          <LevelTabs level={part2Level} onSelect={setPart2Level}
            recommendedLevel={guidanceForPart(2)?.recommended_level ?? undefined} />
          {PART2[part2Level].map((ex) => <ExerciseCard key={ex.id} exercise={ex} />)}
        </PartSection>

        {/* Part 3 */}
        <PartSection number={3} title="Running at High Speed" subtitle="Full intensity · ~2 min"
          guidance={guidanceForPart(3)} guidanceLoading={guidanceLoading && !!ageBand}>
          {PART3.map((ex) => <ExerciseCard key={ex.id} exercise={ex} />)}
        </PartSection>

      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function Overview() {
  const parts = [
    { num: 1, title: "Running",            exercises: 6, duration: "~8 min",  note: null },
    { num: 2, title: "Strength & Balance", exercises: 6, duration: "~10 min", note: "3 levels" },
    { num: 3, title: "High-Speed Running", exercises: 3, duration: "~2 min",  note: null },
  ] as const;

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "20px", marginBottom: 24 }}>
      <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af" }}>
        Programme Overview
      </p>
      <h1 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#111" }}>FIFA 11+</h1>
      <p style={{ margin: "0 0 18px", fontSize: 13, color: "#4b5563", lineHeight: 1.6 }}>
        A complete warm-up designed to reduce football injury rates by up to 50%.
        Perform before every training session and match. Always complete all three parts in order.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {parts.map((p) => {
          const color = PART_COLORS[p.num];
          return (
            <div key={p.num} style={{ backgroundColor: "#f9fafb", borderRadius: 12, padding: "14px 12px", border: "1px solid #e5e7eb" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%", backgroundColor: color,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
              }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{p.num}</span>
              </div>
              <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, color: "#111", lineHeight: 1.3 }}>{p.title}</p>
              <p style={{ margin: "0 0 2px", fontSize: 11, color: "#6b7280" }}>{p.exercises} exercises</p>
              {p.note && (
                <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, color }}>{p.note}</p>
              )}
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{p.duration}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Part section wrapper ───────────────────────────────────────────────────────

function PartSection({
  number, title, subtitle, guidance, guidanceLoading, children,
}: {
  number: 1 | 2 | 3;
  title: string;
  subtitle: string;
  guidance?: AgeGuidance;
  guidanceLoading?: boolean;
  children: React.ReactNode;
}) {
  const color = PART_COLORS[number];
  return (
    <div style={{ marginBottom: 32 }}>
      {/* Part header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", backgroundColor: color,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{number}</span>
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#111" }}>
            Part {number}: {title}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{subtitle}</p>
        </div>
      </div>

      {/* Accent line */}
      <div style={{ height: 2, backgroundColor: color, borderRadius: 1, marginBottom: 14, opacity: 0.25 }} />

      {/* Age guidance card for this part */}
      {(guidanceLoading || guidance) && (
        <PartGuidanceCard guidance={guidance} loading={!!guidanceLoading} partColor={color} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

// ── Level tabs (Part 2 only) ──────────────────────────────────────────────────

function LevelTabs({
  level, onSelect, recommendedLevel,
}: {
  level: 1 | 2 | 3;
  onSelect: (l: 1 | 2 | 3) => void;
  recommendedLevel?: 1 | 2 | 3;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
      {([1, 2, 3] as const).map((l) => {
        const s = LEVEL_STYLES[l];
        const active = l === level;
        const isRecommended = l === recommendedLevel;
        return (
          <button
            key={l}
            onClick={() => onSelect(l)}
            style={{
              padding: "10px 8px",
              borderRadius: 10,
              border: `2px solid ${active ? s.border : "#e5e7eb"}`,
              backgroundColor: active ? s.bg : "#fff",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: active ? s.color : "#374151", lineHeight: 1.2 }}>
              {s.label}
            </p>
            <p style={{ margin: 0, fontSize: 10, color: active ? s.color : "#9ca3af", marginTop: 2 }}>
              {s.sub}
            </p>
            {isRecommended && (
              <p style={{ margin: "4px 0 0", fontSize: 9, fontWeight: 700, color: "#1a5c2a",
                textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ✓ For your age
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Age band selector ─────────────────────────────────────────────────────────

function AgeBandSelector({
  selected, onSelect,
}: {
  selected: AgeBand | null;
  onSelect: (band: AgeBand) => void;
}) {
  const bands: AgeBand[] = ["u9_12", "u13_15", "u16_18", "senior"];
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "16px", marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <Users size={14} color="#1a5c2a" />
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#374151" }}>
          Age-based dosage guidance
        </p>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6b7280" }}>
        Select your age group to see recommended adjustments for each part.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        {bands.map((band) => {
          const active = band === selected;
          return (
            <button
              key={band}
              onClick={() => onSelect(band)}
              style={{
                padding: "9px 10px",
                borderRadius: 10,
                border: `2px solid ${active ? "#1a5c2a" : "#e5e7eb"}`,
                backgroundColor: active ? "#f0fdf4" : "#fff",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: active ? "#1a5c2a" : "#374151" }}>
                {AGE_BAND_LABELS[band]}
              </p>
            </button>
          );
        })}
      </div>
      {selected && (
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
          Showing guidance for <strong style={{ color: "#374151" }}>{AGE_BAND_LABELS[selected]}</strong>
          {" "}— scroll down to see adjustments inside each part.
        </p>
      )}
    </div>
  );
}

// ── Part guidance card ────────────────────────────────────────────────────────

function PartGuidanceCard({
  guidance, loading, partColor,
}: {
  guidance?: AgeGuidance;
  loading: boolean;
  partColor: string;
}) {
  if (loading) {
    return (
      <div style={{
        marginBottom: 14, padding: "12px 14px",
        backgroundColor: "#f9fafb", borderRadius: 12,
        border: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ height: 11, width: "40%", backgroundColor: "#e5e7eb", borderRadius: 4 }} />
        <div style={{ height: 11, width: "90%", backgroundColor: "#e5e7eb", borderRadius: 4 }} />
        <div style={{ height: 11, width: "70%", backgroundColor: "#e5e7eb", borderRadius: 4 }} />
      </div>
    );
  }

  if (!guidance) return null;

  return (
    <div style={{
      marginBottom: 14, padding: "12px 14px",
      backgroundColor: "#f9fafb", borderRadius: 12,
      border: `1px solid ${partColor}40`,
      borderLeft: `4px solid ${partColor}`,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <AlertCircle size={13} color={partColor} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: partColor }}>
          Age guidance — {AGE_BAND_LABELS[guidance.age_band]}
        </span>
        {guidance.recommended_level && (
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 700,
            color: LEVEL_STYLES[guidance.recommended_level].color,
            backgroundColor: LEVEL_STYLES[guidance.recommended_level].bg,
            border: `1px solid ${LEVEL_STYLES[guidance.recommended_level].border}`,
            borderRadius: 20, padding: "2px 8px",
          }}>
            {LEVEL_STYLES[guidance.recommended_level].label}
          </span>
        )}
      </div>

      {/* Dosage note */}
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#374151", lineHeight: 1.5 }}>
        {guidance.adjusted_dosage_note}
      </p>

      {/* Coach notes */}
      {guidance.coach_notes && (
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.6, fontStyle: "italic" }}>
          {guidance.coach_notes}
        </p>
      )}
    </div>
  );
}

// ── Inline exercise illustrations ─────────────────────────────────────────────

function AnimatedSquat() {
  // 7 keyframes: stand → squat → hold squat → stand → toe-raise → hold → stand → loop
  const DUR = "3.4s";
  const REP = "indefinite";
  const KT  = "0;0.25;0.44;0.6;0.74;0.87;1";

  return (
    <svg
      width="100%" viewBox="0 0 400 295"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Animated squat with calf raise — body lowers into squat, rises, then toe raise, repeating"
      style={{ display: "block", backgroundColor: "#fff" }}
    >
      {/* Floor */}
      <line x1="110" y1="252" x2="290" y2="252" stroke="#d1d5db" strokeWidth="1.5" />

      <g stroke="#1a5c2a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">

        {/* Head */}
        <circle cx="200" cy="55" r="14" fill="#1a5c2a" stroke="none">
          <animate attributeName="cy" values="55;110;110;55;47;47;55" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </circle>

        {/* Spine (neck → hip) */}
        <line x1="200" y1="69" x2="200" y2="138">
          <animate attributeName="y1" values="69;124;124;69;63;63;69" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="138;193;193;138;138;138;138" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Left upper arm (shoulder → elbow) */}
        <line x1="175" y1="78" x2="160" y2="116">
          <animate attributeName="y1" values="78;133;133;78;78;78;78" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="x2" values="160;144;144;160;160;160;160" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="116;155;155;116;116;116;116" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Left forearm (elbow → hand) */}
        <line x1="160" y1="116" x2="156" y2="148">
          <animate attributeName="x1" values="160;144;144;160;160;160;160" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y1" values="116;155;155;116;116;116;116" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="x2" values="156;120;120;156;156;156;156" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="148;170;170;148;148;148;148" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Right upper arm */}
        <line x1="225" y1="78" x2="240" y2="116">
          <animate attributeName="y1" values="78;133;133;78;78;78;78" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="x2" values="240;256;256;240;240;240;240" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="116;155;155;116;116;116;116" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Right forearm */}
        <line x1="240" y1="116" x2="244" y2="148">
          <animate attributeName="x1" values="240;256;256;240;240;240;240" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y1" values="116;155;155;116;116;116;116" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="x2" values="244;280;280;244;244;244;244" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="148;170;170;148;148;148;148" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Left thigh (hip → knee) */}
        <line x1="200" y1="138" x2="183" y2="195">
          <animate attributeName="y1" values="138;193;193;138;138;138;138" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="x2" values="183;163;163;183;183;183;183" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="195;228;228;195;195;195;195" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Left shin (knee → foot) */}
        <line x1="183" y1="195" x2="177" y2="250">
          <animate attributeName="x1" values="183;163;163;183;183;183;183" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y1" values="195;228;228;195;195;195;195" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="250;250;250;250;236;236;250" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Right thigh */}
        <line x1="200" y1="138" x2="217" y2="195">
          <animate attributeName="y1" values="138;193;193;138;138;138;138" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="x2" values="217;237;237;217;217;217;217" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="195;228;228;195;195;195;195" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

        {/* Right shin */}
        <line x1="217" y1="195" x2="223" y2="250">
          <animate attributeName="x1" values="217;237;237;217;217;217;217" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y1" values="195;228;228;195;195;195;195" keyTimes={KT} dur={DUR} repeatCount={REP} />
          <animate attributeName="y2" values="250;250;250;250;236;236;250" keyTimes={KT} dur={DUR} repeatCount={REP} />
        </line>

      </g>

      <text x="200" y="278" fontSize="12" fill="#9ca3af" textAnchor="middle" fontFamily="sans-serif">
        squat · hold · rise · calf raise · repeat
      </text>
    </svg>
  );
}

function SingleLegStanceIllustration() {
  return (
    <svg
      width="100%"
      viewBox="0 0 680 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Single-leg stance — balance on one leg with standing knee soft, not locked"
      style={{ display: "block", backgroundColor: "#fff" }}
    >
      {/* Floor line */}
      <line x1="240" y1="270" x2="440" y2="270" stroke="#B4B2A9" strokeWidth="2" />

      <g stroke="#1a5c2a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="340" cy="90" r="16" fill="#1a5c2a" stroke="none" />
        <line x1="340" y1="106" x2="340" y2="190" />
        {/* Arms holding ball */}
        <line x1="340" y1="130" x2="300" y2="150" />
        <line x1="340" y1="130" x2="380" y2="150" />
        <circle cx="340" cy="160" r="14" stroke="#c8962a" strokeWidth="3" />
        {/* Standing leg */}
        <line x1="340" y1="190" x2="345" y2="270" />
        <line x1="345" y1="270" x2="345" y2="278" />
        {/* Lifted bent leg */}
        <line x1="340" y1="190" x2="310" y2="220" />
        <line x1="310" y1="220" x2="330" y2="240" />
      </g>

      <text x="340" y="300" fontSize="14" fill="#2C2C2A" textAnchor="middle" fontFamily="sans-serif">
        Hold 30 seconds each leg — standing knee soft, not locked
      </text>
    </svg>
  );
}

function StandingBroadJumpIllustration() {
  return (
    <svg
      width="100%"
      viewBox="0 0 680 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Standing broad jump — crouched takeoff, flight arc, two-foot landing"
      style={{ display: "block", backgroundColor: "#fff" }}
    >
      {/* Floor line */}
      <line x1="60" y1="230" x2="620" y2="230" stroke="#B4B2A9" strokeWidth="2" />
      {/* Takeoff line */}
      <line x1="140" y1="215" x2="140" y2="230" stroke="#2C2C2A" strokeWidth="3" />
      <text x="140" y="205" fontSize="12" fill="#2C2C2A" textAnchor="middle" fontFamily="sans-serif">takeoff line</text>

      {/* Crouch / takeoff figure */}
      <g stroke="#1a5c2a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="140" cy="150" r="15" fill="#1a5c2a" stroke="none" />
        <line x1="140" y1="165" x2="150" y2="195" />
        <line x1="140" y1="175" x2="105" y2="165" />
        <line x1="150" y1="195" x2="130" y2="225" />
        <line x1="130" y1="225" x2="115" y2="230" />
        <line x1="150" y1="195" x2="175" y2="225" />
        <line x1="175" y1="225" x2="165" y2="230" />
      </g>

      {/* Flight arc */}
      <path d="M 155 165 Q 340 60 480 165" fill="none" stroke="#c8962a" strokeWidth="2" strokeDasharray="6 6" />

      {/* Landing figure */}
      <g stroke="#1a5c2a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="480" cy="150" r="15" fill="#1a5c2a" stroke="none" />
        <line x1="480" y1="165" x2="480" y2="190" />
        <line x1="480" y1="170" x2="450" y2="150" />
        <line x1="480" y1="170" x2="510" y2="150" />
        <line x1="480" y1="190" x2="450" y2="225" />
        <line x1="480" y1="190" x2="500" y2="225" />
      </g>

      {/* Distance measurement */}
      <line x1="140" y1="250" x2="450" y2="250" stroke="#c8962a" strokeWidth="1.5" />
      <line x1="140" y1="245" x2="140" y2="255" stroke="#c8962a" strokeWidth="1.5" />
      <line x1="450" y1="245" x2="450" y2="255" stroke="#c8962a" strokeWidth="1.5" />
      <text x="295" y="270" fontSize="12" fill="#c8962a" textAnchor="middle" fontFamily="sans-serif">distance measured to nearest heel</text>

      <text x="340" y="30" fontSize="14" fill="#2C2C2A" textAnchor="middle" fontFamily="sans-serif">
        Bend knees, swing arms, jump forward — land on both feet
      </text>
    </svg>
  );
}

/** Map mediaAssetId → illustration component. Add more as illustrations are created. */
const EXERCISE_SVG: Partial<Record<string, React.ReactNode>> = {
  "11plus_p2_04_balance_l1": <SingleLegStanceIllustration />,
  "11plus_p2_04_balance_l2": <SingleLegStanceIllustration />,
  "11plus_p2_05_squat_l1":   <SquatIllustration />,
  "11plus_p2_06_jump_l2":    <StandingBroadJumpIllustration />,
};

// ── Exercise card (expandable) ────────────────────────────────────────────────

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>

      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        {/* Thumbnail placeholder */}
        <div style={{
          width: 48, height: 48, borderRadius: 8, backgroundColor: "#f1f5f9",
          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid #e5e7eb",
        }}>
          <ImageIcon size={18} color="#cbd5e1" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 14, color: "#111", lineHeight: 1.25 }}>
            {exercise.name}
          </p>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            fontSize: 11, fontWeight: 600, color: "#1a5c2a",
          }}>
            <Timer size={10} /> {exercise.dosage}
          </span>
        </div>

        <div style={{ flexShrink: 0, color: "#9ca3af" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div style={{ borderTop: "1px solid #f3f4f6" }}>

          {/* Illustration — inline SVG if available, placeholder otherwise */}
          {EXERCISE_SVG[exercise.mediaAssetId] ? (
            <div style={{ margin: "14px 16px 0", borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              {EXERCISE_SVG[exercise.mediaAssetId]}
            </div>
          ) : (
            <div style={{
              margin: "14px 16px 0",
              aspectRatio: "16 / 9",
              backgroundColor: "#f8fafc",
              borderRadius: 10,
              border: "1px dashed #cbd5e1",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <ImageIcon size={28} color="#cbd5e1" />
              <span style={{ fontSize: 10, color: "#cbd5e1", letterSpacing: "0.04em" }}>
                {exercise.mediaAssetId}
              </span>
            </div>
          )}

          <div style={{ padding: "14px 16px 16px" }}>

            {/* Dosage badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12,
              fontSize: 12, fontWeight: 700, color: "#1a5c2a",
              backgroundColor: "#f0fdf4", padding: "4px 10px",
              borderRadius: 20, border: "1px solid #bbf7d0",
            }}>
              <Timer size={11} /> {exercise.dosage}
            </div>

            {/* Starting position */}
            <InfoSection
              icon={<MapPin size={13} color="#2563eb" />}
              label="Starting Position"
              labelColor="#1d4ed8"
              bg="#eff6ff"
              border="#bfdbfe"
            >
              {exercise.startingPosition}
            </InfoSection>

            {/* Instructions */}
            <InfoSection
              icon={null}
              label="How To Do It"
              labelColor="#374151"
              bg="#f9fafb"
              border="#e5e7eb"
            >
              {exercise.instructions}
            </InfoSection>

            {/* Coaching cues */}
            <InfoSection
              icon={<Lightbulb size={13} color="#b45309" />}
              label="Coaching Cues"
              labelColor="#92400e"
              bg="#fffbeb"
              border="#fde68a"
            >
              {exercise.cues}
            </InfoSection>

          </div>
        </div>
      )}
    </div>
  );
}

// ── Info section (inside expanded card) ───────────────────────────────────────

function InfoSection({
  icon, label, labelColor, bg, border, children,
}: {
  icon: React.ReactNode;
  label: string;
  labelColor: string;
  bg: string;
  border: string;
  children: string;
}) {
  return (
    <div style={{ marginTop: 10, backgroundColor: bg, borderRadius: 9, border: `1px solid ${border}`, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        {icon}
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: labelColor }}>
          {label}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.65 }}>{children}</p>
    </div>
  );
}
