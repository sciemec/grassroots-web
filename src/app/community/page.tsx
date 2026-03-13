"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Trash2, Plus } from "lucide-react";

interface District {
  id: string;
  name: string;
  province: string;
  created_at: string;
}

export default function CommunityPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [error, setError] = useState("");

  const { data: districts, isLoading } = useQuery<District[]>({
    queryKey: ["poverty-districts"],
    queryFn: async () => {
      const res = await api.get("/admin/poverty-districts");
      return res.data?.data ?? res.data;
    },
  });

  const add = useMutation({
    mutationFn: () => api.post("/admin/poverty-districts", { name, province }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["poverty-districts"] });
      setName("");
      setProvince("");
      setError("");
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to add district.");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/poverty-districts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["poverty-districts"] }),
  });

  const provinces = [
    "Harare", "Bulawayo", "Manicaland", "Masvingo",
    "Mashonaland East", "Mashonaland West", "Mashonaland Central",
    "Matabeleland North", "Matabeleland South", "Midlands",
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-balance">Community Access</h1>
        <p className="text-sm text-muted-foreground">
          Manage poverty districts — players in these areas get free premium access
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Add district */}
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Add Poverty District</h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">District Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Epworth"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Province</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select province</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              onClick={() => add.mutate()}
              disabled={!name.trim() || !province || add.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {add.isPending ? "Adding…" : "Add District"}
            </button>
          </div>
        </div>

        {/* District list */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Registered Districts</h2>
            <p className="text-xs text-muted-foreground">{districts?.length ?? 0} districts</p>
          </div>
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : (
            <ul className="divide-y">
              {districts?.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.province}</p>
                  </div>
                  <button
                    onClick={() => remove.mutate(d.id)}
                    disabled={remove.isPending}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {!districts?.length && (
                <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                  No districts added yet
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
