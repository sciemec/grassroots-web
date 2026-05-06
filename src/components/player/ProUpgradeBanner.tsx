"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const DISMISS_KEY = "banner_dismissed";
const DISMISS_DAYS = 7;

export function ProUpgradeBanner() {
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show for players on free tier
    if (!user || user.role !== "player") return;
    const tier = (user as { subscription_tier?: string }).subscription_tier;
    if (tier && tier !== "free") return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysAgo = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysAgo < DISMISS_DAYS) return;
    }

    setVisible(true);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-500 px-4 py-2.5">
      <p className="text-sm font-medium text-green-900">
        <span className="mr-1">⚽</span>
        Your profile is visible to scouts right now.{" "}
        <Link
          href="/player/subscription"
          className="underline font-bold hover:no-underline"
        >
          Upgrade to Pro
        </Link>{" "}
        to unlock your full Player Passport and make sure scouts can contact you directly.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="flex-shrink-0 rounded-full p-1 hover:bg-amber-600/40 transition-colors"
      >
        <X className="h-4 w-4 text-green-900" />
      </button>
    </div>
  );
}
