"use client";

import Link from "next/link";

const ROLES = [
  {
    href: "/register/player",
    icon: "🏃",
    label: "Player",
    desc: "Track training, get scouted, receive AI coaching feedback and grow your game.",
    color: "from-green-600 to-emerald-500",
    border: "border-green-500/40 hover:border-green-400",
    badge: "Free to start",
    badgeColor: "bg-green-500/20 text-green-300",
  },
  {
    href: "/register/coach",
    icon: "📋",
    label: "Coach",
    desc: "Manage your squad, build tactics, stream matches and get AI-powered insights.",
    color: "from-blue-600 to-blue-500",
    border: "border-blue-500/40 hover:border-blue-400",
    badge: "Professional",
    badgeColor: "bg-blue-500/20 text-blue-300",
  },
  {
    href: "/register/scout",
    icon: "🔍",
    label: "Scout",
    desc: "Discover and contact verified talent across Zimbabwe. Generate AI scouting reports.",
    color: "from-purple-600 to-purple-500",
    border: "border-purple-500/40 hover:border-purple-400",
    badge: "Professional",
    badgeColor: "bg-purple-500/20 text-purple-300",
  },
  {
    href: "/register/fan",
    icon: "🎉",
    label: "Fan",
    desc: "Follow athletes, watch live matches, explore the leaderboard and support your team.",
    color: "from-amber-600 to-orange-500",
    border: "border-amber-500/40 hover:border-amber-400",
    badge: "Free forever",
    badgeColor: "bg-amber-500/20 text-amber-300",
  },
];

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-4xl">⚽</span>
            <span className="text-2xl font-bold tracking-tight">Grassroots Sport</span>
          </Link>
          <h1 className="mt-4 text-3xl font-black text-white">Join the platform</h1>
          <p className="mt-2 text-green-300">Choose your role to get started — each hub is built for you</p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {ROLES.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className={`group relative flex flex-col rounded-2xl border bg-white/5 p-6 backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-xl ${role.border}`}
            >
              {/* Badge */}
              <span className={`mb-4 self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${role.badgeColor}`}>
                {role.badge}
              </span>

              {/* Icon + label */}
              <div className="mb-3 flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} text-2xl shadow-lg`}>
                  {role.icon}
                </div>
                <h2 className="text-xl font-bold text-white">{role.label}</h2>
              </div>

              <p className="mb-6 flex-1 text-sm leading-relaxed text-green-200">{role.desc}</p>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white group-hover:underline">
                  Register as {role.label} →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-green-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-white hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
