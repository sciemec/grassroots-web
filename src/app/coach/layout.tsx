"use client";

import { useEffect, createContext } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import ThutoChatCoach from "@/components/thuto/ThutoChatCoach";

// 1. THIS IS THE CRITICAL EXPORT THAT CLEARS THE ERROR:
export const CoachSessionContext = createContext<any>(null);

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user && user.role !== "coach" && user.role !== "admin") {
      router.push(`/${user.role}`);
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Block render entirely for non-coach users — redirect fires in useEffect above.
  // This prevents the coach hub flashing for one frame before the redirect lands.
  if (!user || (user.role !== "coach" && user.role !== "admin")) {
    return null;
  }

  // 2. WRAP CHILDREN IN THE VALID PROVIDER VALUE:
  return (
    <CoachSessionContext.Provider value={{ coach: user }}>
      <GuestGateProvider>
        <GuestBanner />
        {children}
        <ThutoChatCoach />
      </GuestGateProvider>
    </CoachSessionContext.Provider>
  );
}