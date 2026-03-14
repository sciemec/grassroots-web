"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2, Circle, ArrowRight, Brain, Users, UserSearch,
  Trophy, Dumbbell, Shield, Star, Radio,
} from "lucide-react";
import { useAuthStore, roleHomePath } from "@/lib/auth-store";

interface Step { id: string; label: string; desc: string; href: string; icon: React.ElementType }

const STEPS_BY_ROLE: Record<string, Step[]> = {
  player: [
    { id: "profile",    label: "Complete your profile",    desc: "Add your position, height, and bio",         href: "/player/profile",      icon: Shield },
    { id: "drill",      label: "Try your first drill",     desc: "Pick a drill and start training with AI",    href: "/player/drills",       icon: Dumbbell },
    { id: "ai",         label: "Chat with your AI coach",  desc: "Ask a question and get instant feedback",    href: "/player/ai-coach",     icon: Brain },
    { id: "scout",      label: "Enable scout visibility",  desc: "Let scouts discover your talent",            href: "/player/profile",      icon: UserSearch },
    { id: "milestone",  label: "Check your milestones",    desc: "See your age-phase development targets",     href: "/player/milestones",   icon: Trophy },
  ],
  coach: [
    { id: "profile",    label: "Complete your profile",    desc: "Add your team name and coaching level",      href: "/coach/profile",   icon: Shield },
    { id: "squad",      label: "Build your squad",         desc: "Add up to 25 registered players",           href: "/coach/squad",     icon: Users },
    { id: "tactics",    label: "Set up your tactics",      desc: "Drag players onto your formation board",    href: "/coach/tactics",   icon: Star },
    { id: "ai",         label: "Get AI insights",          desc: "Analyse your squad with AI assistance",     href: "/coach/ai-insights", icon: Brain },
    { id: "stream",     label: "Watch live matches",       desc: "Follow Zimbabwe league fixtures",           href: "/streaming",       icon: Radio },
  ],
  scout: [
    { id: "profile",    label: "Complete your profile",    desc: "Add your organisation and scouting regions", href: "/scout/profile",   icon: Shield },
    { id: "discover",   label: "Find your first player",   desc: "Browse anonymised player profiles",         href: "/scout",           icon: UserSearch },
    { id: "shortlist",  label: "Add to shortlist",         desc: "Save promising players to your list",       href: "/scout/shortlist", icon: Star },
    { id: "report",     label: "Generate a scout report",  desc: "Export a ZIFA-formatted PDF report",        href: "/scout/reports",   icon: Trophy },
  ],
  fan: [
    { id: "discover",   label: "Discover players",         desc: "Browse Zimbabwe's emerging talent",         href: "/fan/discover",    icon: UserSearch },
    { id: "leaderboard",label: "Check the leaderboard",    desc: "See who is topping the charts",             href: "/fan/leaderboard", icon: Trophy },
    { id: "stream",     label: "Watch a live match",       desc: "Stream a Zimbabwe fixture live",            href: "/streaming",       icon: Radio },
  ],
};

const ROLE_CONFIG: Record<string, { color: string; bg: string; emoji: string; title: string; sub: string }> = {
  player:  { color: "text-green-400",  bg: "from-green-950 via-green-900 to-emerald-800", emoji: "🏃", title: "Welcome to Grassroots Sport!", sub: "Your AI-powered football journey starts here." },
  coach:   { color: "text-blue-400",   bg: "from-blue-950 via-blue-900 to-indigo-900",    emoji: "📋", title: "Welcome, Coach!",                sub: "Build your squad and unlock AI-powered insights." },
  scout:   { color: "text-purple-400", bg: "from-purple-950 via-purple-900 to-indigo-900",emoji: "🔍", title: "Welcome, Scout!",                sub: "Discover Zimbabwe's next generation of talent." },
  fan:     { color: "text-amber-400",  bg: "from-amber-950 via-orange-900 to-red-900",    emoji: "🎉", title: "Welcome, Fan!",                  sub: "Follow the talent, watch the matches, enjoy the game." },
};

const STORAGE_KEY = "gs_onboarding_done";

export default function WelcomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    if (stored) setCompleted(new Set(JSON.parse(stored)));
  }, [user, router]);

  if (!user) return null;

  const steps = STEPS_BY_ROLE[user.role] ?? [];
  const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.fan;
  const progress = steps.length ? Math.round((completed.size / steps.length) * 100) : 0;

  const markDone = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const finish = () => {
    localStorage.setItem(`${STORAGE_KEY}_${user.id}_finished`, "1");
    router.push(roleHomePath(user.role));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${cfg.bg} px-4 py-10 text-white`}>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 text-5xl">{cfg.emoji}</div>
          <h1 className="text-2xl font-black">{cfg.title}</h1>
          <p className={`mt-2 text-sm ${cfg.color}`}>{cfg.sub}</p>
        </div>

        {/* Progress */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium">{completed.size} of {steps.length} steps complete</span>
            <span className={`font-bold ${cfg.color}`}>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map(({ id, label, desc, href, icon: Icon }) => {
            const done = completed.has(id);
            return (
              <div
                key={id}
                className={`rounded-2xl border p-4 transition-all ${done ? "border-white/20 bg-white/10 opacity-70" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-white/60" />
                    ) : (
                      <Circle className="h-5 w-5 text-white/30" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold ${done ? "line-through opacity-60" : ""}`}>{label}</p>
                        <p className="mt-0.5 text-xs text-white/50">{desc}</p>
                      </div>
                      <Icon className="h-4 w-4 flex-shrink-0 text-white/30 mt-0.5" />
                    </div>
                    {!done && (
                      <div className="mt-3 flex gap-2">
                        <Link
                          href={href}
                          onClick={() => markDone(id)}
                          className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25 transition-colors"
                        >
                          Go <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button
                          onClick={() => markDone(id)}
                          className="rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                        >
                          Mark done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 space-y-3 text-center">
          <button
            onClick={finish}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-bold hover:bg-white/25 transition-colors"
          >
            {progress === 100 ? "🎉 All done — go to dashboard!" : "Skip to dashboard"} <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-xs text-white/30">
            You can always revisit these from your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
