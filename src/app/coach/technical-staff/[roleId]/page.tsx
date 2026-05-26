"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
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
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Trash2,
  BookOpen,
} from "lucide-react";
import { getRoleConfig, type StaffRoleConfig } from "@/config/coaching-staff";
import { safeArray } from "@/lib/safe-array";
import { useAuthStore } from "@/lib/auth-store";

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

interface TrainingPlan {
  id: string;
  title: string;
  sport: string;
  description: string | null;
  duration: number | null;
  coaching_role: string | null;
  created_at: string;
}

function PlanSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  onDelete,
}: {
  plan: TrainingPlan;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const token = useAuthStore((s) => s.token);

  const handleDelete = async () => {
    if (!confirm(`Delete "${plan.title}"?`)) return;
    setDeleting(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coach/training-plans/${plan.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onDelete(plan.id);
    } finally {
      setDeleting(false);
    }
  };

  const date = new Date(plan.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-start justify-between gap-4 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-[14px] truncate mb-1">{plan.title}</h3>
        {plan.description && (
          <p className="text-gray-500 text-[13px] line-clamp-2 mb-2">{plan.description}</p>
        )}
        <div className="flex items-center gap-3 text-[12px] text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {date}
          </span>
          {plan.duration && (
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {plan.duration} min
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {plan.sport}
          </span>
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 mt-0.5"
        aria-label="Delete plan"
      >
        {deleting ? (
          <div className="w-4 h-4 border border-gray-300 border-t-red-400 rounded-full animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
}

export default function RoleWorkspacePage() {
  const params = useParams();
  const roleId = params?.roleId as string;
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [role, setRole] = useState<StaffRoleConfig | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "coach" && user.role !== "admin") { router.replace("/dashboard"); return; }
    const cfg = getRoleConfig(roleId);
    if (!cfg) { router.replace("/coach/technical-staff"); return; }
    setRole(cfg);
    setReady(true);
  }, [hasHydrated, user, router, roleId]);

  // Fetch plans for this role
  useEffect(() => {
    if (!ready || !token) return;
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/coach/training-plans`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        const all = safeArray<TrainingPlan>(res);
        // Filter to plans tagged with this coaching_role (or show all if untagged)
        const filtered = all.filter(
          (p) => !p.coaching_role || p.coaching_role === roleId
        );
        setPlans(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, token, roleId]);

  const handleDelete = (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  if (!ready || !role) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }} className="flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-green-700 rounded-full animate-spin" />
      </div>
    );
  }

  const Icon = ICON_MAP[role.icon] ?? Shield;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/coach/technical-staff"
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm transition-colors"
            >
              <ArrowLeft size={16} />
              Coaching Center
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
              {role.title}
            </span>
          </div>

          <Link
            href={`/coach/training-plans/new?role=${roleId}`}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full text-white transition-colors"
            style={{ backgroundColor: "#c8962a" }}
          >
            <Plus size={14} />
            New Plan
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Role identity header */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
          <div className={`h-1.5 w-full bg-gradient-to-r ${role.gradient}`} />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${role.gradient} text-white shrink-0`}>
                <Icon size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 mb-1">{role.title} Desk</h1>
                <p className="text-gray-500 text-[14px] mb-4">{role.description}</p>

                {/* Focus category pills */}
                <div className="flex flex-wrap gap-2">
                  {role.focusCategories.map((cat) => (
                    <span
                      key={cat}
                      className="text-[12px] font-medium px-3 py-1 rounded-full border border-gray-200 text-gray-700 bg-gray-50"
                    >
                      {cat.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Training plans feed */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen size={16} className="text-gray-400" />
            Training Plans
            {plans.length > 0 && (
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {plans.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <PlanSkeleton />
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">No training plans yet</p>
            <p className="text-gray-400 text-[13px] mb-5">
              Create your first plan for the {role.title} desk.
            </p>
            <Link
              href={`/coach/training-plans/new?role=${roleId}`}
              className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full text-white transition-colors"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              <Plus size={14} />
              Create First Plan
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
