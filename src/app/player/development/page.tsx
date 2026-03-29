"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const PHASES = [
  {
    id: "foundation",
    label: "Foundation Phase",
    age: "U6–U9",
    emoji: "🌱",
    color: "text-green-500",
    border: "border-green-500",
    bg: "bg-green-500/10",
    description: "Building fundamental movement skills — agility, balance, coordination. Fun and exploration first.",
    focus: ["Fun & enjoyment", "Basic motor skills", "Ball familiarity", "Social development"],
    milestones: [
      "Dribble with both feet 10m without losing control",
      "Kick a stationary ball 10m accurately",
      "Receive a rolling ball and control it",
      "Complete a 1v1 dribble against a passive defender",
    ],
    weekly_hours: "3–5",
    match_ratio: "80% fun games, 20% coaching",
  },
  {
    id: "development",
    label: "Development Phase",
    age: "U10–U13",
    emoji: "🌿",
    color: "text-blue-500",
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    description: "Developing technical skills. Introducing positional concepts. Beginning competitive play.",
    focus: ["Technical skills", "1v1 defending & attacking", "Small-sided games", "Basic tactics"],
    milestones: [
      "Consistent weak foot passing over 15m",
      "Complete a shoulder drop turn under pressure",
      "Win 3/5 one-on-one duels",
      "Score from outside the penalty area",
    ],
    weekly_hours: "5–8",
    match_ratio: "60% technical, 40% game-play",
  },
  {
    id: "performance",
    label: "Performance Phase",
    age: "U14–U17",
    emoji: "🌳",
    color: "text-yellow-500",
    border: "border-yellow-500",
    bg: "bg-yellow-500/10",
    description: "Physical development, tactical sophistication, position specialisation.",
    focus: ["Position-specific skills", "Tactical awareness", "Physical development", "Mental resilience"],
    milestones: [
      "Sprint 40m in under 5.5 seconds",
      "Complete 90 min at high intensity",
      "Execute assigned position role for full match",
      "Score or assist in 3 consecutive matches",
    ],
    weekly_hours: "8–12",
    match_ratio: "40% technical, 60% tactical",
  },
  {
    id: "professional",
    label: "Professional Phase",
    age: "U18–Senior",
    emoji: "🏆",
    color: "text-orange-500",
    border: "border-orange-500",
    bg: "bg-orange-500/10",
    description: "Elite preparation. Scout visibility. Professional trial readiness.",
    focus: ["Elite fitness", "Leadership", "Consistency", "Scout-ready profile"],
    milestones: [
      "Maintain >85% session score average across 10 sessions",
      "Complete full 90-min match without substitution",
      "Profile viewed by 3+ verified scouts",
      "Receive approved contact request from a club",
    ],
    weekly_hours: "12–20",
    match_ratio: "30% technical, 70% match preparation",
  },
];

export default function DevelopmentPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState<string | null>("performance");

  useEffect(() => {
    // guests allowed — no login redirect
  }, [user, router]);


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Development Phases</h1>
            <p className="text-sm text-muted-foreground">Zimbabwe Football Association Long-Term Player Development</p>
          </div>
        </div>

        {/* Phase timeline */}
        <div className="mb-8 flex items-center gap-0">
          {PHASES.map((phase, i) => (
            <div key={phase.id} className="flex flex-1 items-center">
              <button onClick={() => setExpanded(expanded === phase.id ? null : phase.id)}
                className={`flex flex-1 flex-col items-center rounded-xl border-2 p-3 transition-all ${
                  expanded === phase.id ? `${phase.border} ${phase.bg}` : "border-muted hover:border-muted-foreground"
                }`}>
                <span className="text-2xl">{phase.emoji}</span>
                <p className={`mt-1 text-xs font-bold ${expanded === phase.id ? phase.color : "text-muted-foreground"}`}>
                  {phase.age}
                </p>
              </button>
              {i < PHASES.length - 1 && <div className="h-0.5 w-3 bg-muted" />}
            </div>
          ))}
        </div>

        {/* Phase detail cards */}
        <div className="space-y-3">
          {PHASES.map((phase) => (
            <div key={phase.id} className={`rounded-xl border-2 overflow-hidden transition-all ${
              expanded === phase.id ? `${phase.border}` : "border-muted"
            }`}>
              <button
                onClick={() => setExpanded(expanded === phase.id ? null : phase.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-muted/20 transition-colors"
              >
                <span className="text-3xl">{phase.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold">{phase.label}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${phase.bg} ${phase.color}`}>
                      {phase.age}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{phase.description}</p>
                </div>
                {expanded === phase.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded === phase.id && (
                <div className="border-t px-5 py-5">
                  <p className="mb-4 text-sm text-muted-foreground">{phase.description}</p>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div className="rounded-lg bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Weekly hours</p>
                      <p className="font-bold">{phase.weekly_hours}h</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-3 sm:col-span-3">
                      <p className="text-xs text-muted-foreground">Training balance</p>
                      <p className="font-medium text-sm">{phase.match_ratio}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Training Focus</h4>
                      <ul className="space-y-1.5">
                        {phase.focus.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <span className={`h-1.5 w-1.5 rounded-full ${phase.bg.replace("10", "60")} ${phase.color}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key Milestones</h4>
                      <ul className="space-y-1.5">
                        {phase.milestones.map((m) => (
                          <li key={m} className="flex items-start gap-2 text-sm">
                            <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
