"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { SPORTS, SPORT_MAP, SportKey } from "@/config/sports";

const ROLES = [
  {
    key: "player",
    icon: "🏃",
    label: "Player",
    desc: "Log your stats, upload match footage, get AI performance feedback and get scouted.",
    badge: "Free to start",
    badgeColor: "bg-green-500/20 text-green-300",
    border: "border-green-500/40 hover:border-green-400",
    gradient: "from-green-600 to-emerald-500",
  },
  {
    key: "coach",
    icon: "📋",
    label: "Coach",
    desc: "Analyse match video, track squad stats, get AI tactical insights and run live sessions.",
    badge: "Professional",
    badgeColor: "bg-blue-500/20 text-blue-300",
    border: "border-blue-500/40 hover:border-blue-400",
    gradient: "from-blue-600 to-blue-500",
  },
  {
    key: "scout",
    icon: "🔍",
    label: "Scout",
    desc: "Discover verified talent, compare players and generate AI-powered scouting reports.",
    badge: "Professional",
    badgeColor: "bg-purple-500/20 text-purple-300",
    border: "border-purple-500/40 hover:border-purple-400",
    gradient: "from-purple-600 to-purple-500",
  },
  {
    key: "fan",
    icon: "🎉",
    label: "Fan",
    desc: "Follow athletes, watch live matches and explore the leaderboard.",
    badge: "Free forever",
    badgeColor: "bg-amber-500/20 text-amber-300",
    border: "border-amber-500/40 hover:border-amber-400",
    gradient: "from-amber-600 to-orange-500",
  },
];

// What the platform does per sport — shown on the sport card
const SPORT_FOCUS: Record<string, string> = {
  football:   "Player development · Tactics · Scouting",
  rugby:      "Video analysis · Game stats · Coaching insights",
  netball:    "Video analysis · Game stats · Coaching insights",
  basketball: "Video analysis · Game stats · Coaching insights",
  cricket:    "Video analysis · Match stats · Batting & bowling analytics",
  athletics:  "Performance tracking · PB records · Event analytics",
  swimming:   "Performance tracking · Split times · Event analytics",
  tennis:     "Match analytics · Serve stats · Performance review",
  volleyball: "Video analysis · Game stats · Coaching insights",
  hockey:     "Video analysis · Game stats · Coaching insights",
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("sport") as SportKey | null;
  const validPreselect = preselected && SPORT_MAP[preselected] ? preselected : null;

  const [step, setStep] = useState<"sport" | "role">(validPreselect ? "role" : "sport");
  const [sport, setSport] = useState<SportKey | null>(validPreselect);

  function selectSport(key: SportKey) {
    setSport(key);
    setStep("role");
  }

  function goToRegister(roleKey: string) {
    router.push(`/register/${roleKey}?sport=${sport}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            {sport
              ? <span className="text-3xl">{SPORTS.find(s => s.key === sport)?.emoji}</span>
              // eslint-disable-next-line @next/next/no-img-element
              : <img src="/logo_v2.png" alt="Grassroots Sport" width={40} height={40} />
            }
            <span className="text-2xl font-bold tracking-tight">Grassroots Sport</span>
          </Link>
        </div>

        {/* ── STEP 1: Pick Sport ── */}
        {step === "sport" && (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-black text-white">Pick your sport</h1>
              <p className="mt-2 text-green-300">
                Video analytics, game statistics and AI coaching for 10 sports
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-3">
              {SPORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => selectSport(s.key)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
                    {s.emoji}
                  </span>
                  <span className="text-sm font-bold text-white">{s.label}</span>
                  <span className="text-[10px] leading-tight text-center text-green-400/80">
                    {s.governingBody}
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-green-400">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-white hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: Pick Role ── */}
        {step === "role" && sport && (() => {
          const cfg = SPORTS.find(s => s.key === sport)!;
          return (
            <>
              <div className="mb-6 text-center">
                <div className="mb-3 flex items-center justify-center gap-3">
                  <span className="text-4xl">{cfg.emoji}</span>
                  <div className="text-left">
                    <h1 className="text-2xl font-black text-white">{cfg.label}</h1>
                    <p className="text-xs text-green-400">{SPORT_FOCUS[sport]}</p>
                  </div>
                </div>
                <p className="text-sm text-green-300">
                  What is your role on this platform?
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => goToRegister(role.key)}
                    className={`group relative flex flex-col rounded-2xl border bg-white/5 p-5 text-left backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-xl ${role.border}`}
                  >
                    <span className={`mb-3 self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${role.badgeColor}`}>
                      {role.badge}
                    </span>
                    <div className="mb-2 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${role.gradient} text-xl shadow-lg`}>
                        {role.icon}
                      </div>
                      <h2 className="text-lg font-bold text-white">{role.label}</h2>
                    </div>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-green-200">{role.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white group-hover:underline">
                        Register as {role.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-green-400" />
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep("sport")}
                className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-green-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Change sport
              </button>

              <p className="mt-4 text-center text-sm text-green-400">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-white hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
