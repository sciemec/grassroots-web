"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import Link from "next/link";

interface ScoutViewBadgeProps {
  playerId: string;
}

export function ScoutViewBadge({ playerId }: ScoutViewBadgeProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/players/${playerId}/view-count`)
      .then((r) => r.json())
      .then((data) => setCount(data.view_count ?? 0))
      .catch(() => setCount(0));
  }, [playerId]);

  if (count === null) {
    // Loading skeleton
    return (
      <div className="h-10 w-64 animate-pulse rounded-xl bg-white/10" />
    );
  }

  if (count === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-[#f0b429]/10 px-4 py-2.5">
        <Eye className="h-4 w-4 text-white/30 flex-shrink-0" />
        <p className="text-xs text-white/50">
          No scout views yet.{" "}
          <Link href="/player/profile" className="text-[#f0b429] hover:underline">
            Complete your profile to get noticed.
          </Link>
        </p>
      </div>
    );
  }

  if (count >= 5) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#f0b429]/30 bg-[#f0b429]/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#f0b429] flex-shrink-0" />
          <p className="text-xs font-semibold text-[#f0b429]">
            {count} scouts viewed your profile this week.
          </p>
        </div>
        <Link
          href="/player/subscription"
          className="flex-shrink-0 rounded-lg bg-[#f0b429] px-3 py-1 text-[10px] font-bold text-[#1a3a1a] hover:bg-[#f0b429]/90 transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-[#f0b429]/10 px-4 py-2.5">
      <Eye className="h-4 w-4 text-[#f0b429] flex-shrink-0" />
      <p className="text-xs text-[#f0b429] font-medium">
        {count} scout{count !== 1 ? "s" : ""} viewed your profile this week.
      </p>
    </div>
  );
}
