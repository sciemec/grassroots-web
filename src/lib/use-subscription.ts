"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// Shape returned by GET /subscription/status on bhora-ai
interface SubStatus {
  is_premium:   boolean;
  is_community: boolean;
  subscription: string | null;
  plan_prices:  Record<string, number>;
}

/**
 * Returns the user's live subscription state.
 *
 * - `isPro`    — true when the backend confirms an active premium subscription.
 *                Falls back to the cached `user.is_pro` value while loading
 *                so there is no UI flash on return visits.
 * - `loading`  — true only on the first fetch; false after that.
 *
 * Side-effect: syncs `user.is_pro` into the Zustand auth store so all
 * other parts of the app (sidebar, ProGate, etc.) stay up to date.
 */
export function useSubscription() {
  const user       = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Seed from the cached store value — avoids a locked-UI flash on reload
  const [isPro, setIsPro]     = useState<boolean>(user?.is_pro ?? false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    // Admin always has full access — no API call needed
    if (user.role === "admin") {
      setIsPro(true);
      setLoading(false);
      return;
    }

    api
      .get<SubStatus>("/subscription/status")
      .then((res) => {
        // Backend returns is_premium (not is_active)
        const active = res.data?.is_premium ?? false;
        setIsPro(active);
        // Keep the auth store in sync so ProGate + sidebar reflect reality
        updateUser({ is_pro: active });
      })
      .catch(() => {
        // Network error — fall back to the cached value, don't lock the user out
        setIsPro(user?.is_pro ?? false);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // re-run only when the logged-in user changes

  return { isPro, loading };
}
