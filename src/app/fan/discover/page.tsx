"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import { UserPlus, UserCheck, Search, MapPin, Star } from "lucide-react";

const PROVINCES = [
  "All Provinces","Harare","Bulawayo","Manicaland","Mashonaland Central",
  "Mashonaland East","Mashonaland West","Masvingo",
  "Matabeleland North","Matabeleland South","Midlands",
];
const SPORTS = [
  { key: "all",        label: "All Sports",  emoji: "🏆" },
  { key: "football",   label: "Football",    emoji: "⚽" },
  { key: "rugby",      label: "Rugby",       emoji: "🏉" },
  { key: "netball",    label: "Netball",     emoji: "🏐" },
  { key: "basketball", label: "Basketball",  emoji: "🏀" },
  { key: "cricket",    label: "Cricket",     emoji: "🏏" },
  { key: "athletics",  label: "Athletics",   emoji: "🏃" },
];
const AGE_GROUPS = ["All Ages", "U13", "U17", "U20", "Senior"];

interface Player {
  id: string;
  initials: string;
  position?: string;
  province?: string;
  age_group?: string;
  sport?: string;
  talent_score?: number;
  is_following?: boolean;
}

export default function FanDiscoverPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch]     = useState("");
  const [province, setProvince] = useState("All Provinces");
  const [sport, setSport]       = useState("all");
  const [ageGroup, setAgeGroup] = useState("All Ages");

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
    if (!user) { router.push("/login"); return; }
    if (user.role !== "fan" && user.role !== "admin") { router.push("/dashboard"); return; }
  }, [hydrated, user, router]);

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["discover-players", province, sport, ageGroup],
    queryFn: async () => {
      const res = await api.get("/players/discover", {
        params: {
          province: province !== "All Provinces" ? province : undefined,
          sport: sport !== "all" ? sport : undefined,
          age_group: ageGroup !== "All Ages" ? ageGroup.toLowerCase() : undefined,
        },
      });
      return res.data?.data ?? res.data ?? [];
    },
    enabled: hydrated && !!user,
  });

  const follow = useMutation({
    mutationFn: (id: string) => api.post(`/fan/follow/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discover-players"] }),
  });
  const unfollow = useMutation({
    mutationFn: (id: string) => api.delete(`/fan/follow/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discover-players"] }),
  });

  if (!hydrated || !user) return null;

  const filtered = players.filter((p) =>
    !search || p.initials?.toLowerCase().includes(search.toLowerCase()) ||
    p.position?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Discover Talent — Tsvaga Nyeredzi</h1>
          <p className="text-sm text-muted-foreground">
            Browse Zimbabwe&apos;s emerging talent — profiles shown as initials to protect player privacy
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by initials or position…"
              className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {SPORTS.map((s) => (
              <button key={s.key} onClick={() => setSport(s.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${sport === s.key ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                <span>{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <select value={province} onChange={(e) => setProvince(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring">
              {PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </select>
            {AGE_GROUPS.map((ag) => (
              <button key={ag} onClick={() => setAgeGroup(ag)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${ageGroup === ag ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                {ag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Star className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="font-medium">No players found</p>
            <p className="mt-1 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {p.initials}
                  </div>
                  {p.talent_score != null && (
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600">
                      <Star className="h-3 w-3" /> {p.talent_score}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-sm">
                  <p className="font-medium">{p.position ?? "Unknown position"}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.province ?? "Zimbabwe"}
                    {p.age_group && <span className="ml-2 rounded-full bg-muted px-1.5 uppercase">{p.age_group}</span>}
                  </div>
                </div>

                <button
                  onClick={() => p.is_following ? unfollow.mutate(p.id) : follow.mutate(p.id)}
                  className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    p.is_following
                      ? "border border-border text-muted-foreground hover:bg-muted"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {p.is_following ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <Link href="/fan/following"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View athletes you&apos;re following →
          </Link>
        </div>
      </main>
    </div>
  );
}
