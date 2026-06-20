"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import { Sidebar } from "@/components/layout/sidebar";

export default function ScoutLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user && user.role !== "scout" && user.role !== "admin") {
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
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <GuestBanner />
          <main className="flex-1 p-4 sm:p-6 md:ml-64 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
    </GuestGateProvider>
  );
}
