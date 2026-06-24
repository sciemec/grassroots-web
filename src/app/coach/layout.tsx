// src/app/coach/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { CoachSidebar } from "@/components/layout/CoachSidebar";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import dynamic from "next/dynamic";

const ThutoChatCoach = dynamic(() => import("@/components/thuto/ThutoChatCoach"), { ssr: false });

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    // Redirect wrong-role logged-in users to their own hub.
    // Guests (no user) are welcome — no /login redirect.
    if (user && user.role !== "coach" && user.role !== "admin") {
      router.push(`/${user.role}`);
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1a5c2a] border-t-transparent" />
      </div>
    );
  }

  return (
    <GuestGateProvider>
      <div className="flex min-h-screen bg-[#f4f2ee]">
        <CoachSidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
          <GuestBanner />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      <ThutoChatCoach />
    </GuestGateProvider>
  );
}