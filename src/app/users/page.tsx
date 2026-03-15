"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import type { User, PaginatedResponse } from "@/types";
import {
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  CheckSquare,
  Square,
  Download,
  UserCheck,
  UserX,
  Trash2,
  X,
} from "lucide-react";

const roleBadge: Record<string, string> = {
  player: "bg-blue-500/15 text-blue-700",
  coach: "bg-purple-500/15 text-purple-700",
  scout: "bg-indigo-500/15 text-indigo-700",
  fan: "bg-amber-500/15 text-amber-700",
  admin: "bg-muted text-muted-foreground",
};

export default function UsersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ["users", page, search, role],
    queryFn: async () => {
      const res = await api.get("/admin/users", {
        params: { page, search: search || undefined, role: role || undefined },
      });
      return res.data;
    },
  });

  const toggle = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });

  // Selection helpers
  const users = data?.data ?? [];
  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));
  const someSelected = selected.size > 0;

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set<string>(users.map((u) => u.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  // Bulk actions
  const escapeCsv = (val: unknown): string => {
    const str = String(val ?? "");
    // Prevent CSV injection — prefix formula-starting chars with single quote
    if (/^[=+\-@\t\r]/.test(str)) return `"'${str.replace(/"/g, '""')}"`;
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const bulkAction = async (action: "activate" | "deactivate" | "delete" | "export") => {
    const ids = Array.from(selected);
    if (action === "export") {
      const csv = [
        "id,name,email,role,province,status",
        ...users
          .filter((u) => selected.has(u.id))
          .map((u) =>
            [u.id, u.name, u.email, u.role, u.province ?? "", u.is_active ? "active" : "inactive"]
              .map(escapeCsv)
              .join(",")
          ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (action === "delete" && !confirm(`Delete ${ids.length} user(s)? This cannot be undone.`)) return;

    setBulkLoading(true);
    try {
      await api.post(`/admin/users/bulk-${action}`, { ids });
      qc.invalidateQueries({ queryKey: ["users"] });
      clearSelection();
    } catch {
      alert(`Bulk ${action} failed. Please try again.`);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-balance">Users</h1>
        <p className="text-sm text-muted-foreground">Manage all registered users</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All roles</option>
          <option value="player">Player</option>
          <option value="coach">Coach</option>
          <option value="scout">Scout</option>
          <option value="fan">Fan</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => bulkAction("activate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" /> Activate
            </button>
            <button
              onClick={() => bulkAction("deactivate")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
            >
              <UserX className="h-3.5 w-3.5" /> Deactivate
            </button>
            <button
              onClick={() => bulkAction("export")}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-500/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button
              onClick={() => bulkAction("delete")}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
          <button
            onClick={clearSelection}
            className="ml-auto rounded-lg p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr className="text-left text-muted-foreground">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                    {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email / Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Province</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-muted/40 ${selected.has(u.id) ? "bg-primary/5" : ""}`}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleRow(u.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selected.has(u.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td
                    className="cursor-pointer px-4 py-3 font-medium"
                    onClick={() => router.push(`/users/${u.id}`)}
                  >
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{u.email}</div>
                    <div className="text-xs">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge[u.role] ?? ""}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.province ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.verified_at ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active
                          ? "bg-green-500/15 text-green-700"
                          : "bg-red-500/15 text-red-700"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle.mutate(u.id); }}
                      className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
                    >
                      {u.is_active ? (
                        <ToggleRight className="h-3 w-3 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-3 w-3 text-muted-foreground" />
                      )}
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {data.current_page} of {data.last_page} — {data.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === data.last_page}
                  className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
