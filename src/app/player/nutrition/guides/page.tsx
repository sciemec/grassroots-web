"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Apple, Flame, Droplets, Brain, ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

type AgeGroup = "u13" | "u16" | "u19" | "senior";

const AGE_GROUPS: { id: AgeGroup; label: string; age: string; color: string; bg: string }[] = [
  { id: "u13",    label: "Under 13", age: "10–12 yrs", color: "#15803d", bg: "#f0fdf4" },
  { id: "u16",    label: "Under 16", age: "13–15 yrs", color: "#1d4ed8", bg: "#eff6ff" },
  { id: "u19",    label: "Under 19", age: "16–18 yrs", color: "#7e22ce", bg: "#faf5ff" },
  { id: "senior", label: "Senior",   age: "18+ yrs",   color: "#b45309", bg: "#fffbeb" },
];

type Meal = { time: string; name: string; foods: string[]; calories: number; protein: number; carbs: number; note: string };
type Guide = {
  headline: string;
  calorieTarget: string;
  proteinTarget: string;
  hydration: string;
  meals: Meal[];
  superfoods: { name: string; benefit: string; local: boolean }[];
  avoid: string[];
  shonaPhrase: string;
  shonaTranslation: string;
};

const GUIDES: Record<AgeGroup, Guide> = {
  u13: {
    headline: "Grow Strong, Play Long",
    calorieTarget: "2,200–2,600 kcal/day",
    proteinTarget: "1.2g per kg bodyweight",
    hydration: "6–8 glasses (250ml) per day",
    shonaPhrase: "Kudya zvakanaka kunoita muviri usimbe",
    shonaTranslation: "Eating well makes the body strong",
    meals: [
      { time: "7:00 AM", name: "Breakfast", foods: ["Sadza (1 cup)", "Eggs ×2 (boiled or scrambled)", "Banana", "Milk or mahewu (200ml)"], calories: 480, protein: 22, carbs: 68, note: "Eat 90 min before any morning training." },
      { time: "10:30 AM", name: "School Snack", foods: ["Groundnuts (small handful)", "Fruit (mango, guava, or orange)", "Water 250ml"], calories: 220, protein: 7, carbs: 28, note: "Avoid chips and sugary drinks at tuck shop." },
      { time: "1:00 PM", name: "Lunch", foods: ["Sadza (1.5 cups)", "Nyama (chicken or beef, palm-sized)", "Muriwo wehove (spinach/rape)", "Tomato + onion gravy"], calories: 680, protein: 34, carbs: 88, note: "Biggest meal on rest days, medium on training days." },
      { time: "4:30 PM", name: "After-School Snack", foods: ["Sweet potato (1 medium, boiled)", "Peanut butter (1 tbsp)", "Mahewu 200ml"], calories: 320, protein: 9, carbs: 52, note: "1 hour before afternoon training." },
      { time: "7:00 PM", name: "Dinner", foods: ["Sadza (1 cup)", "Fish (bream or matemba)", "Muriwo", "Pumpkin"], calories: 560, protein: 28, carbs: 72, note: "Light enough to sleep well. No heavy food after 8 PM." },
    ],
    superfoods: [
      { name: "Matemba (dried kapenta)", benefit: "High protein + iron for muscle growth", local: true },
      { name: "Muriwo (greens)", benefit: "Iron, calcium, folate — essential for young athletes", local: true },
      { name: "Sweet potato (batata)", benefit: "Slow-release carbs — great before training", local: true },
      { name: "Mahewu", benefit: "Natural probiotics + carbs, aids digestion", local: true },
      { name: "Groundnuts (nzungu)", benefit: "Protein + healthy fats, cheap and available everywhere", local: true },
    ],
    avoid: ["Fizzy drinks (Coke, Fanta) — strip calcium from bones", "Chips and vetkoek before training — cause sluggishness", "Energy drinks — not safe under 16", "Skipping breakfast — performance drops 20%"],
  },
  u16: {
    headline: "Build the Engine",
    calorieTarget: "2,800–3,200 kcal/day",
    proteinTarget: "1.4g per kg bodyweight",
    hydration: "8–10 glasses (250ml) per day",
    shonaPhrase: "Simba rinobva pakudya kwemarudzi",
    shonaTranslation: "Strength comes from eating the right foods",
    meals: [
      { time: "6:30 AM", name: "Pre-Training Breakfast", foods: ["Oats (1 cup) with milk + banana", "2 boiled eggs", "Orange juice 200ml"], calories: 560, protein: 26, carbs: 82, note: "Eat 45–60 min before morning training." },
      { time: "9:00 AM", name: "Post-Training Recovery", foods: ["Sadza (medium plate)", "Matemba + muriwo", "Full-fat milk 250ml"], calories: 680, protein: 38, carbs: 88, note: "Within 30 min of finishing training — critical window." },
      { time: "1:00 PM", name: "Lunch", foods: ["Sadza (large plate)", "Nyama (beef or chicken)", "Pumpkin + muriwo", "Bone broth or gravy"], calories: 880, protein: 48, carbs: 105, note: "Fuel for afternoon session." },
      { time: "4:00 PM", name: "Pre-Training Snack", foods: ["2 sweet potatoes (boiled)", "Groundnuts 60g", "Banana"], calories: 420, protein: 14, carbs: 65, note: "60 min before training. Skip if 2 sessions today." },
      { time: "7:30 PM", name: "Dinner", foods: ["Sadza (medium plate)", "Eggs ×3 or fish", "Muriwo + tomato", "Milk 200ml"], calories: 680, protein: 42, carbs: 78, note: "High protein dinner aids overnight muscle repair." },
    ],
    superfoods: [
      { name: "Beef liver (chiropa)", benefit: "Iron + B12 — prevents anaemia in growing athletes", local: true },
      { name: "Butternut (bhongi)", benefit: "Beta-carotene + potassium — reduces cramping", local: true },
      { name: "Kapenta (matemba)", benefit: "Calcium, omega-3 — joint and bone protection", local: true },
      { name: "Eggs", benefit: "Complete protein — the cheapest muscle food available", local: true },
      { name: "Milk", benefit: "Calcium + leucine — critical for bone development at 14-16", local: true },
    ],
    avoid: ["Skipping post-training meal — muscle breakdown starts within 45 min", "Energy drinks before training — dehydration + heart stress", "White bread + margarine as main carb source", "Alcohol — illegal under 18, catastrophic for development"],
  },
  u19: {
    headline: "Fuel Like a Professional",
    calorieTarget: "3,000–3,600 kcal/day",
    proteinTarget: "1.6g per kg bodyweight",
    hydration: "10–12 glasses (250ml) per day",
    shonaPhrase: "Muviri unofanirwa kudyeswa semota",
    shonaTranslation: "The body must be fed like an engine",
    meals: [
      { time: "6:00 AM", name: "Pre-Gym Meal", foods: ["Sadza (1 cup) or oats", "Eggs ×2", "Banana", "Coffee (optional, 1 cup)"], calories: 520, protein: 28, carbs: 72, note: "60–90 min before gym. Caffeine gives a 3% performance boost." },
      { time: "9:30 AM", name: "Post-Gym Recovery", foods: ["Protein shake (if available) or 3 eggs + milk", "Sadza (medium)", "Banana"], calories: 720, protein: 48, carbs: 88, note: "Protein within 45 min of gym. This is the most important meal." },
      { time: "1:00 PM", name: "Lunch", foods: ["Sadza (large plate)", "Nyama ×2 servings", "Muriwo + pumpkin", "Bone broth"], calories: 960, protein: 56, carbs: 110, note: "Largest meal of the day. Match your training load." },
      { time: "4:00 PM", name: "Pre-Training Snack", foods: ["2 sweet potatoes", "Groundnuts 80g", "Mahewu 300ml"], calories: 480, protein: 16, carbs: 72, note: "Load carbs 90 min before afternoon session." },
      { time: "7:00 PM", name: "Dinner", foods: ["Sadza (medium)", "Fish or eggs ×4", "Muriwo", "Milk 300ml"], calories: 760, protein: 52, carbs: 85, note: "High protein dinner. Aim for 40g+ protein to trigger overnight synthesis." },
    ],
    superfoods: [
      { name: "Eggs (mazai)", benefit: "1.6g leucine per egg — the key muscle-building amino acid", local: true },
      { name: "Beef (nyama yemombe)", benefit: "Creatine + iron + B12 — the performance trinity", local: true },
      { name: "Bream (bveni)", benefit: "Lean protein + omega-3 — reduces inflammation from hard training", local: true },
      { name: "Mahewu", benefit: "Carb replenishment + gut health — better than sports drinks", local: true },
      { name: "Pumpkin seeds (mhodzi yemubhora)", benefit: "Zinc + magnesium — testosterone support + sleep quality", local: true },
    ],
    avoid: ["Under-eating — the most common mistake at this age, stunts development", "Alcohol — disrupts sleep, kills testosterone, destroys recovery", "Energy drinks before gym — heart arrhythmia risk with heavy lifting", "Inconsistent meal timing — muscles need protein every 4–5 hours"],
  },
  senior: {
    headline: "Recover Fast, Perform Consistently",
    calorieTarget: "2,800–3,400 kcal/day (match days higher)",
    proteinTarget: "1.6–2.0g per kg bodyweight",
    hydration: "Minimum 500ml within 30 min of waking, 2–3L total on training days",
    shonaPhrase: "Kudya zvakanaka ndiko kuvhima nani",
    shonaTranslation: "Eating well is hunting well",
    meals: [
      { time: "7:00 AM", name: "Breakfast", foods: ["Sadza or oats (1.5 cups)", "Eggs ×3", "Banana + mahewu", "Coffee"], calories: 620, protein: 36, carbs: 82, note: "Consistent daily routine. Same time every day." },
      { time: "10:30 AM", name: "Mid-Morning Snack", foods: ["Groundnuts 80g", "Fruit", "Water 500ml"], calories: 280, protein: 11, carbs: 34, note: "Prevents energy crash before lunch." },
      { time: "1:00 PM", name: "Lunch", foods: ["Sadza (large)", "Nyama ×2 servings", "Pumpkin + muriwo + matemba", "Gravy"], calories: 1020, protein: 58, carbs: 120, note: "Main performance fuel. Adjust carbs to training load." },
      { time: "3:30 PM", name: "Pre-Training", foods: ["Sweet potato ×2", "Groundnuts 60g", "Mahewu 300ml"], calories: 440, protein: 14, carbs: 68, note: "90 min before session. Skip if fully rested + lunch was big." },
      { time: "7:30 PM", name: "Dinner", foods: ["Sadza (medium)", "Chicken/fish + matemba", "Muriwo + tomato", "Milk 300ml"], calories: 720, protein: 48, carbs: 80, note: "Recovery focus. High protein, moderate carbs on non-match days." },
    ],
    superfoods: [
      { name: "Tart cherry or baobab fruit", benefit: "Natural anti-inflammatory — reduces muscle soreness 24-48hr post-match", local: true },
      { name: "Beef (especially shin/bone-in)", benefit: "Collagen + creatine — joint repair + explosive power", local: true },
      { name: "Sweet potato", benefit: "Potassium + slow carbs — prevents cramping in second half", local: true },
      { name: "Watermelon", benefit: "Citrulline reduces muscle soreness 24hr post-match", local: true },
      { name: "Full-fat milk", benefit: "Casein protein — slow release overnight, feeds muscles during sleep", local: true },
    ],
    avoid: ["Match-day junk food (chips/greasy) — impairs explosive speed", "Alcohol within 48hr of a match — kills recovery completely", "Under-hydrating — even 2% dehydration = 10% drop in performance", "Same food every day — variety ensures all micronutrients covered"],
  },
};

function MealCard({ meal, color, bg }: { meal: Meal; color: string; bg: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className="text-[10px] font-black w-14 shrink-0" style={{ color }}>{meal.time}</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">{meal.name}</p>
          <p className="text-[10px] text-gray-500">{meal.calories} kcal · {meal.protein}g protein</p>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3" style={{ background: bg }}>
          <ul className="space-y-1">
            {meal.foods.map((f, i) => (
              <li key={i} className="text-sm text-gray-800 flex gap-2">
                <span style={{ color }}>•</span>{f}
              </li>
            ))}
          </ul>
          <div className="flex gap-3 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700">{meal.calories} kcal</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">{meal.protein}g protein</span>
            <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">{meal.carbs}g carbs</span>
          </div>
          <p className="text-[11px] italic text-gray-500 border-l-2 pl-2" style={{ borderColor: color }}>{meal.note}</p>
        </div>
      )}
    </div>
  );
}

export default function NutritionGuidesPage() {
  const user  = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [activeAge, setActiveAge] = useState<AgeGroup>("u16");
  const [mealInput,    setMealInput]    = useState("");
  const [aiFeedback,   setAiFeedback]   = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiError,      setAiError]      = useState("");

  const guide = GUIDES[activeAge];
  const ageConfig = AGE_GROUPS.find(a => a.id === activeAge)!;

  async function handleAiFeedback() {
    if (!mealInput.trim() || aiLoading) return;
    setAiLoading(true);
    setAiFeedback("");
    setAiError("");
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message: `I'm a ${activeAge} footballer in Zimbabwe. Here's what I ate today: "${mealInput}". Based on the nutrition guide for my age group (${ageConfig.label}), give me 3 short bullet points of specific feedback — what's good, what's missing, and one swap I can make using local Zimbabwean foods.`,
          system_prompt: "You are THUTO, a nutrition coach for Zimbabwean footballers. Be specific, practical, and always suggest local food alternatives (sadza, matemba, muriwo, groundnuts, sweet potato, mahewu, bream). Keep each bullet to one sentence. Always be encouraging.",
        }),
      });
      const data = await res.json();
      setAiFeedback(data.response || data.answer || "");
    } catch {
      setAiError("Could not get feedback right now. Try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href="/player/nutrition" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={16} className="text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <Apple size={16} className="text-[#1a5c2a]" />
          <span className="font-bold text-gray-900 text-sm">Nutrition Guides</span>
        </div>
        <Link
          href="/player/nutrition"
          className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "#1a5c2a", color: "#fff" }}
        >
          Daily Plan
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Age Group Selector */}
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Select Age Group</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AGE_GROUPS.map(ag => (
              <button
                key={ag.id}
                onClick={() => setActiveAge(ag.id)}
                className="rounded-xl border-2 px-3 py-2.5 text-sm font-black transition-all"
                style={{
                  borderColor: activeAge === ag.id ? ag.color : "#e5e7eb",
                  background:  activeAge === ag.id ? ag.bg : "#fff",
                  color:       activeAge === ag.id ? ag.color : "#6b7280",
                }}
              >
                {ag.label}
                <span className="block text-[10px] font-normal opacity-70">{ag.age}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Headline */}
        <div className="rounded-2xl p-5" style={{ background: ageConfig.bg, borderLeft: `4px solid ${ageConfig.color}` }}>
          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: ageConfig.color }}>
            {ageConfig.label} Nutrition
          </p>
          <h2 className="text-lg font-black text-gray-900 mb-3">{guide.headline}</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Flame size={12} />, label: "Calories",   value: guide.calorieTarget },
              { icon: <Apple size={12} />, label: "Protein",    value: guide.proteinTarget },
              { icon: <Droplets size={12} />, label: "Water",   value: guide.hydration },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-white rounded-xl p-3">
                <div className="flex items-center gap-1 mb-1" style={{ color: ageConfig.color }}>{icon}
                  <span className="text-[9px] font-black uppercase">{label}</span>
                </div>
                <p className="text-[10px] text-gray-700 font-semibold leading-tight">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs italic text-gray-500">&ldquo;{guide.shonaPhrase}&rdquo; — {guide.shonaTranslation}</p>
        </div>

        {/* Meal Plan */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Daily Meal Plan</p>
          <div className="space-y-2">
            {guide.meals.map((meal, i) => (
              <MealCard key={i} meal={meal} color={ageConfig.color} bg={ageConfig.bg} />
            ))}
          </div>
        </div>

        {/* Superfoods */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Zimbabwe Superfoods for Athletes</p>
          <div className="space-y-2">
            {guide.superfoods.map((sf, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex gap-3">
                <span className="text-lg flex-shrink-0">🌱</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{sf.name}</p>
                  <p className="text-xs text-gray-600">{sf.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avoid */}
        <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-3">Avoid These</p>
          <ul className="space-y-2">
            {guide.avoid.map((item, i) => (
              <li key={i} className="text-sm text-red-800 flex gap-2">
                <span className="text-red-400 flex-shrink-0">✗</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* AI Meal Log Feedback */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-[#1a5c2a]" />
            <p className="text-sm font-black text-gray-900">Log What You Ate — Get AI Feedback</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">Type what you ate today and THUTO will tell you what was good, what was missing, and one simple swap.</p>
          <textarea
            value={mealInput}
            onChange={(e) => setMealInput(e.target.value)}
            placeholder="e.g. Sadza and matemba for lunch, sweet potato and groundnuts before training, milk at night..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:border-[#1a5c2a]"
            rows={3}
          />
          <button
            onClick={handleAiFeedback}
            disabled={!mealInput.trim() || aiLoading}
            className="mt-2 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity"
            style={{ background: "#1a5c2a" }}
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {aiLoading ? "Analysing..." : "Get Feedback"}
          </button>

          {aiFeedback && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-2">THUTO says</p>
              <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{aiFeedback}</p>
            </div>
          )}
          {aiError && (
            <p className="mt-3 text-xs text-red-600">{aiError}</p>
          )}
        </div>

      </div>
    </div>
  );
}
