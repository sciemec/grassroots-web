"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Users,
  Flame,
  ShieldAlert,
  Target,
  Activity,
  Dumbbell,
  HeartPulse,
  Briefcase,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { COACHING_STAFF_ROLES, type StaffRoleConfig } from "@/config/coaching-staff";
import { useAuthStore } from "@/lib/auth-store";
import { useEffect, useState } from "react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: string | number; className?: string }>> = {
  Shield,
  Users,
  Flame,
  ShieldAlert,
  Target,
  Activity,
  Dumbbell,
  HeartPulse,
  Briefcase,
};

function RoleCard({ role }: { role: StaffRoleConfig }) {
  const Icon = ICON_MAP[role.icon] ?? Shield;

  return (
    <Link
      href={`/coach/technical-staff/${role.id}`}
      className="group block rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Gradient header strip */}
      <div className={`h-2 w-full bg-gradient-to-r ${role.gradient}`} />

      <div className="p-5">
        {/* Icon + title */}
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${role.gradient} text-white`}>
            <Icon size={22} />
          </div>
          <ChevronRight
            size={18}
            className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all mt-1"
          />
        </div>

        <h3 className="font-semibold text-gray-900 text-[15px] mb-1 leading-tight">
          {role.title}
        </h3>
        <p className="text-gray-500 text-[13px] leading-snug mb-4 line-clamp-2">
          {role.description}
        </p>

        {/* Focus category pills */}
        <div className="flex flex-wrap gap-1.5">
          {role.focusCategories.slice(0, 3).map((cat) => (
            <span
              key={cat}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
            >
              {cat.replace(/_/g, " ")}
            </span>
          ))}
          {role.focusCategories.length > 3 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              +{role.focusCategories.length - 3} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TechnicalStaffPage() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "coach" && user.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    setReady(true);
  }, [hasHydrated, user, router]);

  if (!ready) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  const roles = COACHING_STAFF_ROLES["football"] ?? [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky top nav */}
      <nav
        className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/coach"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Coach Hub
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">Technical Staff</span>
          </div>

          <Link
            href="/coach/training-plans/new"
            className="text-sm font-semibold px-4 py-1.5 rounded-full text-white transition-colors"
            style={{ backgroundColor: "#c8962a" }}
          >
            + New Training Plan
          </Link>
        </div>
      </nav>

      {/* Page body */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Coaching Center</h1>
          <p className="text-gray-500 text-[15px]">
            Select a department to manage training plans, drills, and resources for each coaching role.
          </p>
        </div>

        {/* 9-desk grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>

        {/* Quick link bar */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/coach/training-plans"
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            All Training Plans
          </Link>
          <Link
            href="/coach/live-match"
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Live Match
          </Link>
          <Link
            href="/coach/patterns"
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Strategic Patterns
          </Link>
          <Link
            href="/coach/set-pieces"
            className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Set Pieces
          </Link>
        </div>
      </div>
    </div>
  );
}
