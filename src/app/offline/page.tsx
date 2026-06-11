"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-green-950 via-green-900 to-emerald-900 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
        <WifiOff className="h-10 w-10 text-green-300" />
      </div>

      <h1 className="text-3xl font-black text-white">You&apos;re offline</h1>
      <p className="mt-3 max-w-sm text-sm text-green-300">
        No internet connection. The pages below are cached and available right now.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-400"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-[#f0b429]/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Go home
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-xl w-full text-left">
        <div className="rounded-2xl border border-[#f0b429]/10 bg-white/5 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#f0b429]">Player Hub</p>
          <ul className="space-y-1.5 text-sm text-green-200">
            <li><Link href="/player" className="hover:text-white">Player Hub home</Link></li>
            <li><Link href="/player/profile" className="hover:text-white">Profile</Link></li>
            <li><Link href="/player/sessions" className="hover:text-white">Training sessions</Link></li>
            <li><Link href="/player/drills" className="hover:text-white">Drills library</Link></li>
            <li><Link href="/player/stats" className="hover:text-white">Stats history</Link></li>
            <li><Link href="/player/milestones" className="hover:text-white">Milestones</Link></li>
            <li><Link href="/player/nutrition" className="hover:text-white">Nutrition</Link></li>
            <li><Link href="/player/ai-coach" className="hover:text-white">AI Coach</Link></li>
            <li><Link href="/player/goal" className="hover:text-white">Goal engine</Link></li>
            <li><Link href="/player/notifications" className="hover:text-white">Notifications</Link></li>
          </ul>
        </div>

        <div className="rounded-2xl border border-[#f0b429]/10 bg-white/5 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#f0b429]">Coach Hub</p>
          <ul className="space-y-1.5 text-sm text-green-200">
            <li><Link href="/coach" className="hover:text-white">Coach Hub home</Link></li>
            <li><Link href="/coach/squad" className="hover:text-white">Squad list</Link></li>
            <li><Link href="/coach/matches" className="hover:text-white">Matches</Link></li>
            <li><Link href="/coach/training-plans" className="hover:text-white">Training plans</Link></li>
            <li><Link href="/coach/live-match" className="hover:text-white">Live match</Link></li>
            <li><Link href="/coach/tactics" className="hover:text-white">Tactics board</Link></li>
            <li><Link href="/coach/stats" className="hover:text-white">Team stats</Link></li>
            <li><Link href="/coach/set-pieces" className="hover:text-white">Set pieces</Link></li>
            <li><Link href="/coach/ai-insights" className="hover:text-white">AI insights</Link></li>
          </ul>
        </div>
      </div>

      <p className="mt-6 text-xs text-green-500">
        API data cached for 24 hours — you may see data from your last online session.
      </p>
    </div>
  );
}
