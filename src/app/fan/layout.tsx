"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import { FanSidebar } from "@/components/layout/FanSidebar";
import dynamic from "next/dynamic";

const ThutoChatVisitor = dynamic(() => import("@/components/thuto/ThutoChatVisitor"), { ssr: false });

export default function FanLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user && user.role !== "fan" && user.role !== "admin") {
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

  return (
    <GuestGateProvider>
      <div className="flex min-h-screen bg-[#f4f2ee]">
        <FanSidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
          <GuestBanner />
          <main className="flex-1 pb-20 lg:pb-0">
            {children}
          </main>
        </div>
      </div>
      <ThutoChatVisitor />
    </GuestGateProvider>
  );
}
