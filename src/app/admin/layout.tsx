// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import dynamic from "next/dynamic";

const ThutoChatCoach = dynamic(() => import("@/components/thuto/ThutoChatCoach"), { ssr: false });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hasHydrated) return;
    
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push(`/${user.role}`);
    }
    setIsLoading(false);
  }, [hasHydrated, user, router]);

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex h-screen bg-[#f4f2ee] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1a5c2a] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-[#f4f2ee]">
        <AdminSidebar />
        <main className="flex-1 lg:ml-72">
          {children}
        </main>
      </div>
      <ThutoChatCoach />
    </>
  );
}