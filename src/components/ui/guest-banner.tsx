"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

export default function GuestBanner() {
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [dismissed, setDismissed] = useState(false);

  // Only show for guests — never for logged-in users
  if (!hasHydrated || user || dismissed) return null;

  return (
    <div className="w-full bg-[#f0b429] text-[#1a3a1a] px-4 py-2.5 flex items-center justify-between gap-4 text-sm font-medium z-50">
      <span className="flex items-center gap-2">
        <span>⚡</span>
        <span className="hidden sm:inline">You&apos;re exploring GrassRoots Sports as a guest.</span>
        <span className="sm:hidden">Exploring as guest.</span>
        <span className="opacity-70">Register free to save your progress.</span>
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/register"
          className="px-3 py-1 rounded-lg bg-[#1a3a1a] text-[#f0b429] text-xs font-semibold hover:bg-[#0f2614] transition-colors"
        >
          Register Free
        </Link>
        <Link
          href="/login"
          className="px-3 py-1 rounded-lg border border-[#1a3a1a]/30 text-[#1a3a1a] text-xs font-semibold hover:bg-[#1a3a1a]/10 transition-colors"
        >
          Sign In
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="ml-1 text-[#1a3a1a]/50 hover:text-[#1a3a1a] transition-colors text-base leading-none"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
