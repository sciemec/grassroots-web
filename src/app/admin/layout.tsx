// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useSidebarStore } from "@/lib/sidebar-store";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import dynamic from "next/dynamic";

const ThutoChatCoach = dynamic(() => import("@/components/thuto/ThutoChatCoach"), { ssr: false });
const GrassrootsNewsTicker = dynamic(() => import("@/components/ui/GrassrootsNewsTicker"), { ssr: false });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
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
        <main className={`flex-1 transition-[margin-left] duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-72'}`}>
          {children}
        </main>
      </div>
      <ThutoChatCoach />
      <GrassrootsNewsTicker />
    </>
  );
}