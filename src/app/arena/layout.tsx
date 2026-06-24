"use client";
import { useAuthStore } from "@/lib/auth-store";
import GuestBanner from "@/components/ui/guest-banner";
import { GuestGateProvider } from "@/components/ui/register-modal";
import dynamic from "next/dynamic";

const ThutoChatVisitor = dynamic(() => import("@/components/thuto/ThutoChatVisitor"), { ssr: false });

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  if (!hasHydrated) return null;

  return (
    <GuestGateProvider>
      <GuestBanner />
      {children}
      <ThutoChatVisitor />
    </GuestGateProvider>
  );
}
