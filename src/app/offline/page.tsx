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
        No internet connection detected. Some pages are available offline — check your connection and try again.
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
          className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Go home
        </Link>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-left max-w-sm w-full">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-green-400">Available offline</p>
        <ul className="space-y-2 text-sm text-green-200">
          <li>✓ Login page</li>
          <li>✓ Register page</li>
          <li>✓ Previously visited pages</li>
          <li>✓ Cached match data</li>
        </ul>
      </div>
    </div>
  );
}
