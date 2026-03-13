"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Swords, Target, CircleDot } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const FORMATS = [
  {
    id: "rondo",
    label: "Rondo / Possession",
    icon: Users,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    desc: "Possession circles — track touches, passes, and pressure wins. 4v1, 5v2, 6v2 shapes.",
    examples: ["4v1 rondo", "5v2 rondo", "6v2 rondo", "Position rondo"],
    metrics: ["Touches per possession", "Successful passes", "Pressure wins", "Average possession time"],
  },
  {
    id: "ssg",
    label: "Small-Sided Game",
    icon: Swords,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    desc: "Competitive games on reduced pitch. Track goals, possession %, fouls, and team shape.",
    examples: ["3v3 with goals", "5v5 on half pitch", "7v7 with GKs", "Attack vs Defence"],
    metrics: ["Goals scored", "Goals conceded", "Possession %", "Fouls & cards"],
  },
  {
    id: "drills",
    label: "Cone Drills",
    icon: Target,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    desc: "Individual technical drills with cones. Sprint times, dribble accuracy, and juggling count.",
    examples: ["T-cone agility", "Box dribble", "Weave cones", "Juggling challenge"],
    metrics: ["Completion time", "Accuracy", "Reps completed", "vs benchmark"],
  },
  {
    id: "shooting",
    label: "Shooting Session",
    icon: CircleDot,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    desc: "Track shots per goal zone (3×3 grid). Record weak foot, volleys, and first-time finishes.",
    examples: ["Penalty practice", "Crossing & finishing", "Long-range shots", "1v1 vs GK"],
    metrics: ["Goals per zone", "On target %", "Weak foot accuracy", "First-time %"],
  },
];

export default function TrainingFormatsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Training Formats</h1>
            <p className="text-sm text-muted-foreground">Structured session types with live metrics tracking</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {FORMATS.map(({ id, label, icon: Icon, color, bg, border, desc, examples, metrics }) => (
            <Link key={id} href={`/player/training-formats/${id}`}
              className={`flex flex-col rounded-2xl border-2 ${border} ${bg} p-6 hover:scale-[1.01] transition-all`}>
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-background`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div>
                  <h2 className="font-bold">{label}</h2>
                  <p className="text-xs text-muted-foreground">Tap to start</p>
                </div>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">{desc}</p>

              <div className="mb-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Session types</p>
                <div className="flex flex-wrap gap-1.5">
                  {examples.map((e) => (
                    <span key={e} className="rounded-full bg-background/60 px-2.5 py-1 text-xs">{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tracked metrics</p>
                <ul className="space-y-1">
                  {metrics.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={`h-1 w-1 rounded-full ${color}`} /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
