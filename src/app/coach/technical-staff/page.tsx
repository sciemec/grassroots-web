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
  UserCheck,
} from "lucide-react";
import { COACHING_STAFF_ROLES, type StaffRoleConfig } from "@/config/coaching-staff";
import { getDepartmentStats } from "@/lib/department-drills";
import { useAuthStore } from "@/lib/auth-store";
import { useEffect, useState } from "react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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

interface StaffMember {
  name: string;
  phone: string;
  email: string;
}
type StaffRoster = Record<string, StaffMember>;

const ROSTER_KEY = "gs_staff_roster";

function loadRoster(): StaffRoster {
  try {
    return JSON.parse(localStorage.getItem(ROSTER_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function RoleCard({
  role,
  staff,
}: {
  role: StaffRoleConfig;
  staff?: StaffMember;
}) {
  const Icon = ICON_MAP[role.icon] ?? Shield;
  const stats = getDepartmentStats();
  const drillCount =
    role.department === "all"
      ? stats.total
      : (stats[role.department as keyof typeof stats] as number | undefined) ?? 0;

  return (
    <Link
      href={`/coach/technical-staff/${role.id}`}
      className="group block rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${role.gradient}`} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${role.gradient} text-white`}
          >
            <Icon size={20} />
          </div>
          <div className="flex items-center gap-2">
            {staff ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <UserCheck size={9} />
                Assigned
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                Vacant
              </span>
            )}
            <ChevronRight
              size={14}
              className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all"
            />
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 text-[14px] mb-0.5 leading-tight">
          {role.title}
        </h3>
        {staff ? (
          <p className="text-[12px] text-[#1a5c2a] font-medium mb-3">
            {staff.name}
          </p>
        ) : (
          <p className="text-[12px] text-gray-400 mb-3 line-clamp-1">
            {role.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {role.focusCategories.slice(0, 2).map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                {cat.replace(/_/g, " ")}
              </span>
            ))}
            {role.focusCategories.length > 2 && (
              <span className="text-[10px] text-gray-400 px-1.5 py-0.5">
                +{role.focusCategories.length - 2}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 shrink-0 ml-2">
            {drillCount} drills
          </span>
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
  const [roster, setRoster] = useState<StaffRoster>({});

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
    setRoster(loadRoster());
    setReady(true);
  }, [hasHydrated, user, router]);

  if (!ready) {
    return (
      <div
        style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}
        className="flex items-center justify-center"
      >
        <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  const roles = COACHING_STAFF_ROLES["football"] ?? [];
  const stats = getDepartmentStats();
  const assignedCount = Object.keys(roster).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
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
            <span className="text-sm font-semibold text-gray-900">
              Technical Staff
            </span>
          </div>
          <Link
            href="/coach/training-plans/new"
            className="text-sm font-semibold px-4 py-1.5 rounded-full text-white transition-colors"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            + New Plan
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Department Hub
          </h1>
          <p className="text-gray-500 text-[14px]">
            Assign staff, manage drills, and build training plans for each coaching department.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            {
              label: "Departments",
              value: roles.length,
              icon: <Users size={15} className="text-gray-400" />,
            },
            {
              label: "Total Drills",
              value: stats.total,
              icon: <Dumbbell size={15} className="text-gray-400" />,
            },
            {
              label: "Staff Assigned",
              value: `${assignedCount} / ${roles.length}`,
              icon: <UserCheck size={15} className="text-green-600" />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-gray-200 bg-white p-4 text-center"
            >
              <div className="flex items-center justify-center mb-1.5">
                {icon}
              </div>
              <div className="text-xl font-black text-gray-900">{value}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Role grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} staff={roster[role.id]} />
          ))}
        </div>

        {/* Quick links */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Quick Access
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { href: "/coach/training-plans", label: "All Training Plans" },
              { href: "/coach/drills", label: "Drill Library" },
              { href: "/coach/live-match", label: "Live Match" },
              { href: "/coach/set-pieces", label: "Set Pieces" },
              { href: "/coach/tactics/simulator", label: "Tactics Simulator" },
              { href: "/coach/chemistry", label: "Team Chemistry" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
