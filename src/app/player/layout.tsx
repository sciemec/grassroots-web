"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import { AdBanner } from "@/components/ui/AdBanner";
import dynamic from "next/dynamic";

// Dynamically import Thuto AI Coach widget without Server-Side Rendering
const ThutoChat = dynamic(() => import("@/components/thuto/ThutoChat"), { ssr: false });

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
    // Unauthenticated Guests (no user) are welcome — no /login enforcement redirect.
    if (user && user.role !== "player" && user.role !== "admin") {
      router.push(`/${user.role}`);
    }
  }, [hasHydrated, user, router]);

  // Brief clean spinner while Zustand rehydrates state properties from localStorage
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
        {/* Navigation Sidebar Component */}
        <Sidebar />
        
        {/* Main Viewport Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Guest awareness banners and advertising containers */}
          <GuestBanner />
          <AdBanner slot="banner-below-nav" className="w-full" />
          
          <main className="flex-1 p-4 sm:p-6 lg:ml-64">
            {children}
          </main>
        </div>
      </div>
      
      {/* Persistent Academy AI Engine Assistant */}
      <ThutoChat />
    </GuestGateProvider>
  );
}