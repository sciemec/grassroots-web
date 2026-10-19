"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";

const DISMISS_KEY        = "banner_dismissed";
const MINOR_DISMISS_KEY  = "minor_banner_dismissed";
const DISMISS_DAYS = 7;

type UserExtra = { subscription_tier?: string; age_group?: string };

function isMinorAge(ageGroup: string | undefined | null): boolean {
  return ageGroup === "under_13" || ageGroup === "13_17";
}

function wasDismissedRecently(key: string): boolean {
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const daysAgo = (Date.now() - parseInt(raw, 10)) / (1000 * 60 * 60 * 24);
  return daysAgo < DISMISS_DAYS;
}

export function ProUpgradeBanner() {
  const user = useAuthStore((s) => s.user);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "player") return;
    const { subscription_tier, age_group } = user as typeof user & UserExtra;

    if (isMinorAge(age_group)) {
      if (!wasDismissedRecently(MINOR_DISMISS_KEY)) setVisible(true);
      return;
    }

    // Adult free-tier only
    if (subscription_tier && subscription_tier !== "free") return;
    if (!wasDismissedRecently(DISMISS_KEY)) setVisible(true);
  }, [user]);

  const dismiss = () => {
    const { age_group } = (user ?? {}) as UserExtra;
    const key = isMinorAge(age_group) ? MINOR_DISMISS_KEY : DISMISS_KEY;
    localStorage.setItem(key, Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  const { age_group } = (user ?? {}) as UserExtra;

  if (isMinorAge(age_group)) {
    const under13 = age_group === "under_13";
    return (
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5">
        <p className="text-sm font-medium text-blue-800">
          <span className="mr-1">🔒</span>
          {under13
            ? "Under-13 profiles are kept private for your safety. Your coach and guardian can see your progress."
            : "Your profile is private until a parent or guardian approves sharing. Ask them to open the Guardian Dashboard so scouts can discover you."}
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss banner"
          className="flex-shrink-0 rounded-full p-1 hover:bg-blue-200/60 transition-colors"
        >
          <X className="h-4 w-4 text-blue-700" />
        </button>
      </div>
    );
  }

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
