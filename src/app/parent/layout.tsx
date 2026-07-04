"use client";
// src/app/parent/layout.tsx
// Auth guard for all /parent/* pages — same pattern as player/coach/scout layouts

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;
  return <>{children}</>;
}
