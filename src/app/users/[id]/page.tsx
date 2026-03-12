"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface UserDetail {
  id: string;
  player_id: string;
  email: string;
  phone: string;
  role: string;
  age_group: string;
  province: string;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
  profile: {
    first_name?: string;
    last_name?: string;
    position?: string;
    height_cm?: number;
    weight_kg?: number;
    bio?: string;
  } | null;
  stats: {
    total_sessions?: number;
    total_drills?: number;
    avg_session_score?: number;
  } | null;
  subscription: {
    plan_type: string;
    status: string;
    ends_at: string;
  } | null;
  identity_verifications: {
    id: string;
    status: string;
    ai_confidence_score: number;
    created_at: string;
  }[];
  training_sessions: {
    id: string;
    session_type: string;
    focus_area: string;
    overall_score: number | null;
    status: string;
    created_at: string;
  }[];
}

const roleBadge: Record<string, string> = {
  player: "bg-blue-100 text-blue-700",
  coach: "bg-purple-100 text-purple-700",
  scout: "bg-indigo-100 text-indigo-700",
  admin: "bg-gray-100 text-gray-700",
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">{user.player_id ?? user.email}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}>{user.role}</span>
              </div>
              {user.is_active ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ["Email", user.email],
                ["Phone", user.phone],
                ["Province", user.province ?? "—"],
                ["Age Group", user.age_group ?? "—"],
                ["Verified", user.verified_at ? new Date(user.verified_at).toLocaleDateString() : "Not verified"],
                ["Joined", new Date(user.created_at).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Subscription */}
          {user.subscription && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">Subscription</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Plan", user.subscription.plan_type],
                  ["Status", user.subscription.status.replace(/_/g, " ")],
                  ["Expires", new Date(user.subscription.ends_at).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Stats */}
          {user.stats && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">Stats</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Total Sessions", user.stats.total_sessions ?? 0],
                  ["Total Drills", user.stats.total_drills ?? 0],
                  ["Avg Score", user.stats.avg_session_score?.toFixed(1) ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          {user.profile && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 font-semibold">Player Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                {[
                  ["Position", user.profile.position ?? "—"],
                  ["Height", user.profile.height_cm ? `${user.profile.height_cm} cm` : "—"],
                  ["Weight", user.profile.weight_kg ? `${user.profile.weight_kg} kg` : "—"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              {user.profile.bio && <p className="mt-3 text-sm text-muted-foreground">{user.profile.bio}</p>}
            </div>
          )}

          {/* Recent sessions */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 font-semibold">Recent Sessions</h3>
            {user.training_sessions.length ? (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Focus</th>
                    <th className="pb-2 font-medium">Score</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {user.training_sessions.map((s) => (
                    <tr key={s.id} className="py-2">
                      <td className="py-2 capitalize">{s.session_type}</td>
                      <td className="py-2 capitalize text-muted-foreground">{s.focus_area?.replace(/_/g, " ") ?? "—"}</td>
                      <td className="py-2 font-mono font-semibold">{s.overall_score ?? "—"}</td>
                      <td className="py-2 capitalize">{s.status}</td>
                      <td className="py-2 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No sessions recorded.</p>
            )}
          </div>

          {/* Verifications */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="mb-3 font-semibold">Verification History</h3>
            {user.identity_verifications.length ? (
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">AI Score</th>
                    <th className="pb-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {user.identity_verifications.map((v) => (
                    <tr key={v.id}>
                      <td className="py-2 capitalize">{v.status}</td>
                      <td className="py-2 font-mono">{v.ai_confidence_score}%</td>
                      <td className="py-2 text-muted-foreground">{new Date(v.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground">No verifications submitted.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
