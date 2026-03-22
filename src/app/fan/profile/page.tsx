"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Save, Loader2, Heart } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

export default function FanProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);

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
    setDisplayName((user as { display_name?: string; name?: string }).display_name ?? (user as { name?: string }).name ?? "");
  }, [hydrated, user, router]);

  const { data: followingData } = useQuery<{ data: unknown[] }>({
    queryKey: ["fan-following-count"],
    queryFn: () => api.get("/fan/following").then((r) => r.data),
    enabled: hydrated && !!user,
  });

  const saveName = useMutation({
    mutationFn: (name: string) => api.patch("/profile", { display_name: name }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (!hydrated || !user) return null;

  const initials = displayName
    ? displayName.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const phone = (user as { phone?: string }).phone ?? "";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/fan" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-sm text-accent/80 italic">Pfupiso yangu — Your fan identity</p>
          </div>
        </div>

        {/* Avatar + name card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-3xl font-black text-primary">
              {initials}
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white">{displayName || "Fan"}</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0b429]/15 px-2.5 py-0.5 text-xs font-semibold text-[#f0b429]">
                <Heart className="h-3 w-3" /> Fan
              </span>
              {phone && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {phone}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit display name */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <User className="h-4 w-4" /> Display Name
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name…"
              maxLength={60}
              className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={() => saveName.mutate(displayName)}
              disabled={saveName.isPending || !displayName.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saveName.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : saved
                ? <><Save className="h-4 w-4" /> Saved!</>
                : <><Save className="h-4 w-4" /> Save</>}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            This name is shown on your profile. Player names are kept private.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm text-center">
            <Heart className="mx-auto mb-2 h-5 w-5 text-red-400" />
            <p className="text-2xl font-black text-white">{followingData?.data?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Athletes followed</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur-sm text-center">
            <span className="mb-2 block text-xl">🇿🇼</span>
            <p className="text-2xl font-black text-white">Fan</p>
            <p className="text-xs text-muted-foreground">Account type</p>
          </div>
        </div>

      </main>
    </div>
  );
}
