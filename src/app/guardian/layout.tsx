"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function GuardianLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.push("/login?redirect=/guardian");
      return;
    }
    if (user.role !== "guardian" && user.role !== "admin") {
      router.push("/login");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;
  if (user.role !== "guardian" && user.role !== "admin") return null;

  return <>{children}</>;
}
