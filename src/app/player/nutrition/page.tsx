"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Droplets, Flame, Apple, Clock, Brain } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

// Zimbabwe-specific food data
const DAILY_MEALS = [
  {
    time: "6:00 AM", label: "Pre-Training Fuel", emoji: "🌅",
    foods: ["Sadza (small plate)", "2 boiled eggs", "Banana"],
    calories: 420, protein: 18, carbs: 65, note: "Light — training in 30–45 min"
  },
  {
    time: "9:00 AM", label: "Post-Training Recovery", emoji: "💪",
    foods: ["Sadza (medium plate)", "Matemba (dried kapenta)", "Muriwo wehove (spinach)", "Orange"],
    calories: 680, protein: 32, carbs: 85, note: "Within 30 min of finishing session"
  },
  {
    time: "1:00 PM", label: "Lunch", emoji: "☀️",
    foods: ["Sadza (large plate)", "Nyama (beef/chicken)", "Muriwo", "Matemba sauce"],
    calories: 820, protein: 42, carbs: 95, note: "Biggest meal of the day"
  },
  {
    time: "4:00 PM", label: "Pre-Evening Snack", emoji: "🍌",
    foods: ["Sweet potato", "Groundnuts (50g)", "Mango"],
    calories: 380, protein: 12, carbs: 55, note: "Before evening training or study"
  },
  {
    time: "7:00 PM", label: "Dinner", emoji: "🌙",
    foods: ["Sadza (medium plate)", "Fish (bream or tilapia)", "Muriwo", "Tomato gravy"],
    calories: 620, protein: 38, carbs: 72, note: "Lighter than lunch, good recovery"
  },
];

const HYDRATION_GUIDE = [
  { when: "On waking", amount: "500ml", tip: "Replenish overnight loss" },
  { when: "Before training", amount: "400ml", tip: "30 min before" },
  { when: "During training", amount: "150–200ml", tip: "Every 15–20 minutes" },
  { when: "After training", amount: "500ml+", tip: "Until urine is pale yellow" },
  { when: "With meals", amount: "250ml", tip: "Aid digestion" },
];

const DAILY_TOTALS = { calories: 2920, protein: 142, carbs: 372, fat: 68 };

export default function NutritionPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [water, setWater] = useState(0); // glasses (250ml each)

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nutrition Hub</h1>
            <p className="text-sm text-muted-foreground">Fuel your game with Zimbabwe&apos;s best foods</p>
          </div>
        </div>

        {/* Daily macro summary */}
        <div className="mb-6 grid grid-cols-4 gap-3">
          {[
            { label: "Calories", value: DAILY_TOTALS.calories, unit: "kcal", color: "text-orange-500", icon: Flame },
            { label: "Protein", value: DAILY_TOTALS.protein, unit: "g", color: "text-blue-500", icon: Apple },
            { label: "Carbs", value: DAILY_TOTALS.carbs, unit: "g", color: "text-green-500", icon: Flame },
            { label: "Fat", value: DAILY_TOTALS.fat, unit: "g", color: "text-yellow-500", icon: Apple },
          ].map(({ label, value, unit, color, icon: Icon }) => (
            <div key={label} className="rounded-xl border bg-card p-4">
              <Icon className={`h-4 w-4 ${color} mb-1`} />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{unit} {label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Link href="/player/nutrition/foods" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors">
            <Apple className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold">Food Browser</p>
              <p className="text-xs text-muted-foreground">Search Zimbabwe foods</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <Link href="/player/nutrition/plan" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors">
            <Brain className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-semibold">AI Meal Plan</p>
              <p className="text-xs text-muted-foreground">Claude-generated weekly plan</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-semibold">Hydration</p>
              <p className="text-xs text-muted-foreground">{water * 250}ml / 2000ml today</p>
            </div>
          </div>
        </div>

        {/* Hydration tracker */}
        <div className="mb-6 rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" /> Hydration Tracker
            </h2>
            <span className="text-sm font-bold text-blue-500">{water}/8 glasses</span>
          </div>
          <div className="mb-3 flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <button key={i} onClick={() => setWater(i + 1)}
                className={`flex-1 h-10 rounded-lg border transition-all ${
                  i < water ? "bg-blue-500 border-blue-500" : "bg-muted border-muted hover:border-blue-400"
                }`}>
                {i < water ? <Droplets className="mx-auto h-4 w-4 text-white" /> : null}
              </button>
            ))}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(water / 8) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {water === 0 ? "Tap a glass to log your water intake" :
             water < 4 ? "Keep drinking — you're under halfway" :
             water < 8 ? "Good progress! Keep it up" :
             "🎉 Daily hydration goal achieved!"}
          </p>
        </div>

        {/* Daily meal plan */}
        <div className="mb-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Today&apos;s Meal Plan — Zimbabwe Athlete Edition
          </h2>
          <div className="space-y-3">
            {DAILY_MEALS.map((meal) => (
              <div key={meal.time} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meal.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{meal.label}</p>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {meal.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{meal.note}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-orange-500">{meal.calories} kcal</p>
                    <p className="text-xs text-muted-foreground">{meal.protein}g protein</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {meal.foods.map((f) => (
                    <span key={f} className="rounded-full bg-muted px-2.5 py-1 text-xs">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hydration guide */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" /> Hydration Guide for Athletes
          </h2>
          <div className="space-y-2">
            {HYDRATION_GUIDE.map(({ when, amount, tip }) => (
              <div key={when} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{when}</p>
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
                <span className="text-sm font-bold text-blue-600">{amount}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
