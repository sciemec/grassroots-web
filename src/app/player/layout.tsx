"use client";

/**
 * Player hub layout — auth guard.
 *
 * Waits for Zustand to rehydrate from localStorage before checking auth.
 * This prevents the "flicker redirect" where user = null on first render
 * causes every protected page to immediately push to /login.
 *
 * Middleware (src/middleware.ts) handles the server-side cookie check.
 * This layout handles the client-side state hydration gap.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const user          = useAuthStore((s) => s.user);
  const hasHydrated   = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;              // wait for localStorage to load
    if (!user) { router.push("/login"); return; }
    if (user.role !== "player" && user.role !== "admin") {
      router.push(`/${user.role}`);        // wrong hub — send them to their own
    }
  }, [hasHydrated, user, router]);

  // Show a spinner while waiting for Zustand to rehydrate from localStorage.
  // Returning null here was the source of the persistent black page.
  if (!hasHydrated || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
