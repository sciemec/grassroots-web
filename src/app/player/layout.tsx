"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // If a logged-in user lands on the wrong hub, send them to their own.
  // Guests (no user) are welcome — no redirect.
  useEffect(() => {
    if (!hasHydrated) return;
    if (user && user.role !== "player" && user.role !== "admin") {
      router.push(`/${user.role}`);
    }
  }, [hasHydrated, user, router]);

  // Brief spinner only while Zustand rehydrates from localStorage
  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <GuestGateProvider>
      <GuestBanner />
      {children}
    </GuestGateProvider>
  );
}
