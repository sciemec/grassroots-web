// app/admin/users/[id]/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Dumbbell,
  CreditCard,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

/* ─── constants ─────────────────────────────────────────── */
const GRS_GREEN = "#1a5c2a";

const ROLE_PILL: Record<string, { bg: string; text: string }> = {
  player:  { bg: "#dcfce7", text: "#166534" },
  coach:   { bg: "#dbeafe", text: "#1d4ed8" },
  scout:   { bg: "#f3e8ff", text: "#7e22ce" },
  fan:     { bg: "#fef9c3", text: "#854d0e" },
  admin:   { bg: "#fee2e2", text: "#991b1b" },
  analyst: { bg: "#e0f2fe", text: "#0369a1" },
};

const ALL_ROLES = ["player", "coach", "scout", "fan", "admin", "analyst"];

/* ─── types ──────────────────────────────────────────────── */
interface UserProfile {
  first_name?: string;
  surname?: string;
  sport?: string;
  position_primary?: string;
  club?: string;
  school?: string;
  bio?: string;
  avatar_url?: string;
  height_cm?: number;
  weight_kg?: number;
  profile_complete_pct?: number;
}

interface Verification {
  id: string;
  status: string;
  created_at: string;
  reviewed_at?: string;
}

interface TrainingSession {
  id: string;
  session_date: string;
  type: string;
  duration: number;
  intensity?: string;
}

interface Subscription {
  plan?: string;
  status?: string;
  current_period_end?: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  province?: string;
  age_group?: string;
  is_active: boolean;
  is_suspended?: boolean;
  created_at: string;
  last_active_at?: string;
  profile?: UserProfile;
  stats?: Record<string, unknown>[];
  subscription?: Subscription;
  identity_verifications?: Verification[];
  training_sessions?: TrainingSession[];
}

/* ─── helpers ────────────────────────────────────────────── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZW", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    active:    { bg: "#dcfce7", text: "#166534", label: "Active" },
    trialing:  { bg: "#dbeafe", text: "#1d4ed8", label: "Trial" },
    pro:       { bg: "#f3e8ff", text: "#7e22ce", label: "Pro" },
    cancelled: { bg: "#fee2e2", text: "#991b1b", label: "Cancelled" },
    free:      { bg: "#f3f4f6", text: "#374151", label: "Free" },
  };
  const s = map[status] ?? map.free;
  return (
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function VerifyBadge({ status }: { status: string }) {
  if (status === "approved")
    return <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle2 className="h-3 w-3" /> Approved</span>;
  if (status === "rejected")
    return <span className="flex items-center gap-1 text-xs text-red-600"><AlertTriangle className="h-3 w-3" /> Rejected</span>;
  return <span className="flex items-center gap-1 text-xs text-amber-600"><Clock className="h-3 w-3" /> Pending</span>;
}

/* ─── page ───────────────────────────────────────────────── */
export default function AdminUserDetailPage() {
  const router      = useRouter();
  const { id }      = useParams<{ id: string }>();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const qc          = useQueryClient();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") router.replace("/dashboard");
  }, [hasHydrated, user, router]);

  const { data, isLoading, isError } = useQuery<AdminUser>({
    queryKey: ["admin-user", id],
    queryFn: () => api.get(`/admin/users/${id}`).then((r) => r.data),
    enabled: !!id && hasHydrated && user?.role === "admin",
  });

  const toggleMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user", id] }),
  });

  const roleMutation = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/users/${id}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user", id] }),
  });

  if (!hasHydrated || !user) return null;

  if (isLoading) {
    return (
      <main className="gs-watermark min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/20" />
          ))}
        </div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="gs-watermark min-h-screen p-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/admin/users" className="mb-6 flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to Users
          </Link>
          <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
            <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-red-400" />
            <p className="font-semibold text-red-700">User not found</p>
          </div>
        </div>
      </main>
    );
  }

  const u       = data;
  const rp      = ROLE_PILL[u.role] ?? { bg: "#f3f4f6", text: "#374151" };
  const subPlan = u.subscription?.status ?? "free";
  const active  = u.is_active !== false && !u.is_suspended;

  return (
    <main className="gs-watermark min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">

        {/* Back */}
        <Link
          href="/admin/users"
          className="mb-2 flex w-fit items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All Users
        </Link>

        {/* Header card */}
        <div className="rounded-2xl border border-white/10 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
                style={{ backgroundColor: GRS_GREEN }}
              >
                {(u.name ?? "?")[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{u.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
                    style={{ backgroundColor: rp.bg, color: rp.text }}
                  >
                    {u.role}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={
                      active
                        ? { backgroundColor: "#dcfce7", color: "#166534" }
                        : { backgroundColor: "#fee2e2", color: "#991b1b" }
                    }
                  >
                    {active ? "Active" : "Suspended"}
                  </span>
                  {u.age_group && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 capitalize">
                      {u.age_group}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {/* Role change */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    const dropdown = (e.currentTarget.nextSibling as HTMLElement);
                    dropdown.classList.toggle("hidden");
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Change role <ChevronDown className="h-3 w-3" />
                </button>
                <div className="absolute right-0 top-full z-30 mt-1 hidden w-32 rounded-xl border border-gray-100 bg-white shadow-lg">
                  {ALL_ROLES.filter((r) => r !== u.role).map((r) => {
                    const rp2 = ROLE_PILL[r] ?? { bg: "#f3f4f6", text: "#374151" };
                    return (
                      <button
                        key={r}
                        onClick={() => roleMutation.mutate(r)}
                        disabled={roleMutation.isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs capitalize hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                        style={{ color: rp2.text }}
                      >
                        {roleMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suspend / Activate */}
              <button
                onClick={() => toggleMutation.mutate()}
                disabled={toggleMutation.isPending}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {toggleMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {active ? "Suspend" : "Activate"}
              </button>
            </div>
          </div>
        </div>

        {/* Contact + meta */}
        <div className="rounded-2xl border border-white/10 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Contact & Account</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="truncate">{u.email}</span>
            </div>
            {u.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{u.phone}</span>
              </div>
            )}
            {u.province && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <span>{u.province}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
              <span>Joined {fmtDate(u.created_at)}</span>
            </div>
            {u.last_active_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                <span>Last active {timeAgo(u.last_active_at)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="mr-1">Subscription</span>
              <StatusBadge status={subPlan} />
            </div>
          </div>
        </div>

        {/* Profile */}
        {u.profile && (
          <div className="rounded-2xl border border-white/10 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User className="h-4 w-4 text-gray-400" /> Profile
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {u.profile.sport && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Sport:</span> {u.profile.sport}</p>
              )}
              {u.profile.position_primary && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Position:</span> {u.profile.position_primary}</p>
              )}
              {u.profile.club && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Club:</span> {u.profile.club}</p>
              )}
              {u.profile.school && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">School:</span> {u.profile.school}</p>
              )}
              {u.profile.height_cm && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Height:</span> {u.profile.height_cm} cm</p>
              )}
              {u.profile.weight_kg && (
                <p className="text-sm text-gray-600"><span className="font-medium text-gray-700">Weight:</span> {u.profile.weight_kg} kg</p>
              )}
              {typeof u.profile.profile_complete_pct === "number" && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium text-gray-500">Profile completion</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${u.profile.profile_complete_pct}%`, backgroundColor: GRS_GREEN }}
                    />
                  </div>
                  <p className="mt-0.5 text-right text-xs text-gray-400">{u.profile.profile_complete_pct}%</p>
                </div>
              )}
              {u.profile.bio && (
                <p className="sm:col-span-2 text-sm text-gray-600 italic">"{u.profile.bio}"</p>
              )}
            </div>
          </div>
        )}

        {/* Identity verifications */}
        {u.identity_verifications && u.identity_verifications.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Shield className="h-4 w-4 text-gray-400" /> Identity Verifications
            </h2>
            <div className="space-y-2">
              {u.identity_verifications.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">{fmtDate(v.created_at)}</span>
                  <VerifyBadge status={v.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training sessions */}
        {u.training_sessions && u.training_sessions.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Dumbbell className="h-4 w-4 text-gray-400" /> Recent Training Sessions
            </h2>
            <div className="space-y-2">
              {u.training_sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium text-gray-700 capitalize">{s.type}</p>
                    <p className="text-[11px] text-gray-400">{fmtDate(s.session_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{s.duration} min</p>
                    {s.intensity && (
                      <p className="text-[11px] capitalize text-gray-400">{s.intensity}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats summary */}
        {u.stats && u.stats.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-gray-700">Stats Entries</h2>
            <p className="text-sm text-gray-500">{u.stats.length} stat record{u.stats.length !== 1 ? "s" : ""} on file</p>
          </div>
        )}

      </div>
    </main>
  );
}
