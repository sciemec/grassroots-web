"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { UserMinus, MapPin, Star, Users, Trophy } from "lucide-react";

interface FollowedPlayer {
  id: string;
  initials: string;
  position?: string;
  province?: string;
  age_group?: string;
  sport?: string;
  talent_score?: number;
  sessions_count?: number;
  overall_score?: number;
}

export default function FanFollowingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) return; // guests allowed
    if (user.role !== "fan" && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [hydrated, user, router]);

  const { data: following = [], isLoading } = useQuery<FollowedPlayer[]>({
    queryKey: ["fan-following"],
    queryFn: async () => {
      const res = await api.get("/fan/following");
      return res.data?.data ?? res.data ?? [];
    },
    enabled: hydrated && !!user,
  });

  const unfollow = useMutation({
    mutationFn: (id: string) => api.delete(`/fan/follow/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fan-following"] }),
  });

  if (!hydrated) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Following — Vatambi Vaunotevera</h1>
            <p className="text-sm text-muted-foreground">
              Athletes you&apos;re tracking — {following.length} total
            </p>
          </div>
          <Link href="/fan/discover"
            className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Users className="h-4 w-4" /> Discover more
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : following.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-5xl">🏆</div>
            <p className="text-lg font-semibold">Not following anyone yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover Zimbabwe&apos;s emerging talent and follow players to track their progress.
            </p>
            <Link href="/fan/discover"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
              <Users className="h-4 w-4" /> Browse athletes
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {following.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {p.initials}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{p.position ?? "Athlete"}</p>
                    {p.age_group && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium uppercase">
                        {p.age_group}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    {p.province && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.province}
                      </span>
                    )}
                    {p.sessions_count != null && (
                      <span>{p.sessions_count} sessions</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  {p.talent_score != null && (
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                      <Star className="h-3 w-3" /> {p.talent_score}
                    </div>
                  )}
                  {p.overall_score != null && (
                    <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-600">
                      <Trophy className="h-3 w-3" /> {p.overall_score}%
                    </div>
                  )}
                  <button
                    onClick={() => unfollow.mutate(p.id)}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                  >
                    <UserMinus className="h-3.5 w-3.5" /> Unfollow
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
