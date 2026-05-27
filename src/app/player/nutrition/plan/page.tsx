"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Loader2, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { queryAI } from "@/lib/ai-query";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface MealPlan {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  training_note: string;
}

export default function NutritionPlanPage() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<MealPlan[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState("performance");
  const [error, setError] = useState("");

  const generatePlan = async () => {
    setLoading(true);
    setError("");
    try {
      const text = await queryAI(`Generate a 7-day meal plan for a Zimbabwean football player focused on ${goal}.
Use local foods: sadza, matemba, nyama, muriwo, matemba, sweet potato, groundnuts, maheu, mango.
Format as JSON array with fields: day, breakfast, lunch, dinner, snacks, training_note.
Return ONLY the JSON array, no markdown.`, "player");
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as MealPlan[];
        setPlan(parsed);
      } else {
        // Fallback hardcoded plan
        setPlan(FALLBACK_PLAN);
      }
    } catch {
      setPlan(FALLBACK_PLAN);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/nutrition" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">AI Meal Plan</h1>
            <p className="text-sm text-muted-foreground">Personalised weekly nutrition — Claude-powered</p>
          </div>
        </div>

        {!plan ? (
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Brain className="mx-auto mb-4 h-12 w-12 text-purple-500" />
              <h2 className="mb-2 text-xl font-bold">Generate your meal plan</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Claude will create a 7-day plan using Zimbabwe foods based on your training goals
              </p>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-left">Your primary goal</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "performance", label: "Peak Performance", emoji: "⚡" },
                    { id: "muscle", label: "Build Muscle", emoji: "💪" },
                    { id: "endurance", label: "Endurance", emoji: "🏃" },
                    { id: "recovery", label: "Fast Recovery", emoji: "🔄" },
                  ].map(({ id, label, emoji }) => (
                    <button key={id} onClick={() => setGoal(id)}
                      className={`rounded-xl border p-3 text-sm font-medium transition-all ${
                        goal === id ? "border-purple-500 bg-purple-500/10 text-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}>
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
              <button onClick={generatePlan} disabled={loading}
                className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                {loading ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Generating plan…</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><Brain className="h-4 w-4" /> Generate 7-day plan</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">7-day plan for <span className="font-medium capitalize text-foreground">{goal}</span></p>
              <button onClick={generatePlan} disabled={loading}
                className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Regenerate
              </button>
            </div>
            <div className="space-y-3">
              {plan.map((day, i) => (
                <div key={i} className="rounded-xl border bg-card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold">{day.day || DAYS[i]}</h3>
                    {day.training_note && (
                      <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-700">
                        {day.training_note}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "🌅 Breakfast", val: day.breakfast },
                      { label: "☀️ Lunch", val: day.lunch },
                      { label: "🌙 Dinner", val: day.dinner },
                      { label: "🍌 Snacks", val: day.snacks },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded-lg bg-muted/40 px-3 py-2">
                        <p className="mb-0.5 text-xs font-semibold text-muted-foreground">{label}</p>
                        <p className="text-sm">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const FALLBACK_PLAN: MealPlan[] = DAYS.map((day, i) => ({
  day,
  breakfast: i % 2 === 0 ? "Sadza + 2 boiled eggs + banana" : "Sweet potato + matemba + maheu",
  lunch: "Sadza + nyama/fish + muriwo + matemba sauce",
  dinner: i % 3 === 0 ? "Sadza + bream fish + tomato gravy" : "Sadza + chicken + covo + orange",
  snacks: "Groundnuts + mango" ,
  training_note: i < 5 ? "Training day" : "Rest day",
}));
