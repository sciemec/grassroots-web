"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, _hasHydrated } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return; // guests allowed
  }, [_hasHydrated, user, router]);
  if (!_hasHydrated) return null;
  return <>{children}</>;
}
