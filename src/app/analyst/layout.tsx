"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";

export default function AnalystLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) return; // guests allowed — shows GuestBanner
    if (user.role !== "analyst" && user.role !== "admin") {
      router.push(`/${user.role}`);
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated) return null;

  return (
    <GuestGateProvider>
      <GuestBanner />
      {children}
    </GuestGateProvider>
  );
}
