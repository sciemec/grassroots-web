"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  province: string;
  created_at: string;
  is_verified: boolean;
  is_suspended: boolean;
}

interface UsersMeta {
  total: number;
  last_page: number;
}

const ROLE_TABS = ["all", "player", "coach", "scout", "fan"] as const;
type RoleTab = typeof ROLE_TABS[number];

const ROLE_COLORS: Record<string, string> = {
  admin:  "bg-purple-500/15 text-purple-700",
  coach:  "bg-green-500/15 text-green-700",
  scout:  "bg-orange-500/15 text-orange-700",
  player: "bg-blue-500/15 text-blue-700",
  fan:    "bg-pink-500/15 text-pink-700",
};

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("all");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const { data, isLoading } = useQuery<{ data: AdminUser[]; meta: UsersMeta }>({
    queryKey: ["admin-users", debouncedSearch, roleTab, page],
    queryFn: async () => {
      const res = await api.get("/admin/users", {
        params: {
          search: debouncedSearch || undefined,
          role: roleTab !== "all" ? roleTab : undefined,
          per_page: 20,
          page,
        },
      });
      return res.data;
    },
    enabled: !!user,
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Users — Vashandisi Vose</h1>
            <p className="text-sm text-muted-foreground">Manage all platform users</p>
          </div>
        </div>

        {/* Search + role filter */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setRoleTab(tab); setPage(1); }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  roleTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium text-white">No users found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Province</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[u.role] ?? "bg-muted text-muted-foreground"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.province || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_suspended
                          ? "bg-red-500/15 text-red-700"
                          : u.is_verified
                          ? "bg-green-500/15 text-green-700"
                          : "bg-amber-500/15 text-amber-700"
                      }`}>
                        {u.is_suspended ? "Suspended" : u.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {u.is_suspended ? (
                          <button
                            onClick={() => activateMutation.mutate(u.id)}
                            disabled={activateMutation.isPending}
                            className="flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                          >
                            {activateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendMutation.mutate(u.id)}
                            disabled={suspendMutation.isPending}
                            className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                          >
                            {suspendMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <p>{meta.total} users total</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-xs">
                Page {page} of {meta.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
