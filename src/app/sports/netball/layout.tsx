"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function NetballHubLayout({ children }: { children: React.ReactNode }) {
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
