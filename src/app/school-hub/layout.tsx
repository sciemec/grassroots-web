"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function SchoolHubLayout({ children }: { children: React.ReactNode }) {
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router      = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;
  return <>{children}</>;
}
