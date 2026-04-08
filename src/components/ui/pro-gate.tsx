"use client";

/**
 * ProGate — subscription enforcement component.
 *
 * Wraps any Pro-only feature. Shows a locked overlay if the user is on the free tier.
 * Free tier users see a blurred preview with an "Upgrade to Pro" CTA.
 *
 * Usage:
 *   <ProGate feature="AI Scouting Reports">
 *     <YourComponent />
 *   </ProGate>
 */

import { useAuthStore } from "@/lib/auth-store";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface ProGateProps {
  feature: string;
  children: React.ReactNode;
  /** Show a blurred preview of the children instead of hiding completely */
  preview?: boolean;
}

function isPro(subscription?: string): boolean {
  return ["basic", "pro", "elite"].includes(subscription ?? "free");
}

export function ProGate({ feature, children, preview = true }: ProGateProps) {
  const user = useAuthStore((s) => s.user);

  // Admins always have full access
  if (!user || user.role === "admin" || isPro(user.subscription)) {
    return <>{children}</>;
  }

  if (!preview) {
    // Full block — show nothing except the upgrade prompt
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/5 p-10 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b429]/10 border border-[#f0b429]/30">
          <Lock className="h-6 w-6 text-[#f0b429]" />
        </div>
        <h3 className="text-base font-bold text-white">{feature}</h3>
        <p className="mt-1.5 max-w-xs text-sm text-white/50">
          Upgrade to Pro to unlock this feature and everything else on the platform.
        </p>
        <Link
          href="/player/subscription"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#f0b429] px-5 py-2.5 text-sm font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Pro — $5/month
        </Link>
      </div>
    );
  }

  // Preview mode — blurred children + floating overlay
  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm opacity-40">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0d1f12]/80 backdrop-blur-sm">
        <div className="mx-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0b429]/10 border border-[#f0b429]/40">
            <Lock className="h-5 w-5 text-[#f0b429]" />
          </div>
          <p className="text-sm font-bold text-white">{feature}</p>
          <p className="mt-1 text-xs text-white/50 max-w-[200px]">
            Pro feature — upgrade to unlock
          </p>
          <Link
            href="/player/subscription"
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#f0b429] px-4 py-2 text-xs font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Hook version — returns true if user has Pro access */
export function useIsPro(): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.role === "admin") return true;
  return isPro(user.subscription);
}
