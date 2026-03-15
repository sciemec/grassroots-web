"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "./sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Zustand `persist` rehydrates from localStorage asynchronously — even with
  // a synchronous storage adapter the update is deferred. Without this guard,
  // the auth check below fires with user=null before the stored session is
  // restored, causing the redirect loop.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return; // wait for localStorage session to be restored
    if (!user) router.replace("/login");
  }, [hydrated, user, router]);

  // Render nothing until we know the auth state — prevents flash of redirect
  if (!hydrated || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  );
}
