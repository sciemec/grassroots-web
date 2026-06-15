// src/app/player/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import PlayerBottomNav from "@/components/layout/PlayerBottomNav";
import dynamic from "next/dynamic";

// Dynamically import Thuto AI Coach widget without Server-Side Rendering
const ThutoChat = dynamic(() => import("@/components/thuto/ThutoChat"), { ssr: false });

// ── AdBanner intentionally removed from this layout ───────────────────────
// The banner-below-nav AdBanner was causing severe visual corruption on
// mobile (the striped/glitched pattern seen on the Player and Admin hubs).
// When the slot has no active ad and no fallback prop, it rendered an empty
// 728×90 div that overflowed and corrupted everything below it on small screens.
// Solution: removed completely from layout. Can be re-added inside individual
// pages using <AdBanner slot="banner-below-nav" fallback={false} /> if needed.

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    // If a logged-in user lands on the wrong hub, send them to their own dashboard.
    // Unauthenticated guests (no user) are welcome — no /login enforcement redirect.
    if (user && user.role !== "player" && user.role !== "admin") {
      router.push(`/${user.role}`);
    }
  }, [hasHydrated, user, router]);

  // Brief spinner while Zustand rehydrates state from localStorage
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

        {/* ── Desktop sidebar (hidden on mobile — bottom nav used instead) ── */}
        <Sidebar />

        {/* ── Main content area ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Guest awareness banner */}
          <GuestBanner />

          {/* Page content — lg:ml-64 accounts for desktop sidebar width */}
          <main className="flex-1 p-4 sm:p-6 lg:ml-0 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom navigation bar ──────────────────────────────────
           Appears only on screens smaller than md (768px).
           Gives instant access to the 5 core player screens without
           needing to open the hamburger drawer.                           */}
      <PlayerBottomNav />

      {/* ── Persistent THUTO AI assistant ─────────────────────────────── */}
      <ThutoChat />
    </GuestGateProvider>
  );
}