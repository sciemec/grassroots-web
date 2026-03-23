"use client";

import Link from "next/link";
import { Lock, Zap, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
}

const PRO_PERKS = [
  "Business Hub — budget planner, sponsor finder, event planner",
  "Analyst Hub — xG analysis, pass maps, AI tactical reports",
  "Unlimited data saves & exports",
  "Priority AI responses",
];

export function ProGate({ children, feature }: ProGateProps) {
  const user = useAuthStore((s) => s.user);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Not yet hydrated — render nothing to avoid flash
  if (!_hasHydrated) return null;

  // Admin always bypasses
  if (user?.role === "admin") return <>{children}</>;

  // Pro users pass through
  if (user?.is_pro) return <>{children}</>;

  // Non-pro or logged-out → show upgrade wall
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
          <Lock className="h-8 w-8 text-amber-500" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">
          {feature ?? "This feature"} is Pro
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Upgrade to Grassroots Pro to unlock the full platform — built for coaches,
          clubs and sports organisations across Zimbabwe.
        </p>

        <div className="mb-6 rounded-xl border bg-card p-5 text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What you get with Pro
          </p>
          <ul className="space-y-2">
            {PRO_PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/player/subscription"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
        >
          <Zap className="h-4 w-4" /> Upgrade to Pro
        </Link>

        {!user && (
          <p className="mt-4 text-sm text-muted-foreground">
            Already have a Pro account?{" "}
            <Link href="/login" className="font-semibold text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
