"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.push("/login");
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;
  return <>{children}</>;
}
