"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, Download, FileText, ExternalLink, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  age_group?: string;
  province: string;
  created_at: string;
  is_active: boolean;
  verified_at: string | null;
}

interface UsersMeta {
  total: number;
  last_page: number;
}

const ROLE_TABS = ["all", "player", "coach", "scout", "fan"] as const;
type RoleTab = typeof ROLE_TABS[number];

const ALL_ROLES = ["player", "coach", "scout", "fan", "admin"] as const;
type UserRole = typeof ALL_ROLES[number];

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

function exportCSV(users: AdminUser[]) {
  const headers = ["Name", "Email", "Phone", "Role", "Province", "Joined", "Status"];
  const rows = users.map((u) => [
    u.name,
    u.email,
    u.phone ?? "",
    u.role,
    u.province ?? "",
    new Date(u.created_at).toLocaleDateString("en-ZW"),
    !u.is_active ? "Suspended" : u.verified_at ? "Verified" : "Unverified",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `grassroots-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(users: AdminUser[]) {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFillColor(26, 92, 42);
  doc.rect(0, 0, 297, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("GrassRoots Sports — User Export", 10, 12);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleString("en-ZW"), 250, 12);

  autoTable(doc, {
    startY: 22,
    head: [["Name", "Email", "Phone", "Role", "Province", "Joined", "Status"]],
    body: users.map((u) => [
      u.name,
      u.email,
      u.phone ?? "—",
      u.role,
      u.province ?? "—",
      new Date(u.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" }),
      !u.is_active ? "Suspended" : u.verified_at ? "Verified" : "Unverified",
    ]),
    headStyles: { fillColor: [26, 92, 42], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 250, 246] },
  });

  doc.save(`grassroots-users-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("all");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Role change dropdown open state per row
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // Consolidated toggle mutation (replaces separate suspend/activate)
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelected(new Set());
    },
  });

  // Role change mutation
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleDropdownOpen(null);
    },
  });

  // Bulk suspend/activate
  const bulkToggleMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => api.post(`/admin/users/${id}/toggle-active`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSelected(new Set());
    },
  });

  const users = data?.data ?? [];
  const meta = data?.meta;

  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  }, [allSelected, users]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <main className="gs-watermark overflow-auto p-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Users — Vashandisi Vose</h1>
          <p className="text-sm text-muted-foreground">Manage all platform users</p>
        </div>

        {/* Export button */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
            <ChevronDown className="h-3 w-3" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border bg-card shadow-lg">
              <button
                onClick={() => { exportCSV(users); setExportOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-muted transition-colors rounded-t-xl"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                onClick={() => { exportPDF(users); setExportOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs hover:bg-muted transition-colors rounded-b-xl"
              >
                <FileText className="h-3.5 w-3.5" /> Export PDF
              </button>
            </div>
          )}
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
        <div className="flex gap-1 flex-wrap">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setRoleTab(tab); setPage(1); setSelected(new Set()); }}
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5">
          <span className="text-xs font-medium text-primary">{selected.size} selected</span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => bulkToggleMutation.mutate(Array.from(selected))}
              disabled={bulkToggleMutation.isPending}
              className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
            >
              {bulkToggleMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Toggle Active
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

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
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-400 accent-primary cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Province</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-muted/20 transition-colors ${selected.has(u.id) ? "bg-primary/5" : ""}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleSelectOne(u.id)}
                      className="rounded border-gray-400 accent-primary cursor-pointer"
                    />
                  </td>

                  {/* Name + view link */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="flex items-center gap-1 font-medium text-white hover:text-primary transition-colors group"
                    >
                      {u.name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>

                  {/* Role — inline dropdown to change */}
                  <td className="px-4 py-3">
                    <div className="relative inline-block">
                      <button
                        onClick={() => setRoleDropdownOpen(roleDropdownOpen === u.id ? null : u.id)}
                        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize transition-colors ${ROLE_COLORS[u.role] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {u.role}
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>
                      {roleDropdownOpen === u.id && (
                        <div className="absolute left-0 top-full z-30 mt-1 w-28 rounded-xl border bg-card shadow-lg">
                          {ALL_ROLES.filter((r) => r !== u.role).map((r) => (
                            <button
                              key={r}
                              onClick={() => roleMutation.mutate({ id: u.id, role: r })}
                              disabled={roleMutation.isPending}
                              className={`flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs capitalize transition-colors hover:bg-muted first:rounded-t-xl last:rounded-b-xl`}
                            >
                              {roleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                              {r}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">{u.province || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      !u.is_active
                        ? "bg-red-500/15 text-red-700"
                        : u.verified_at
                        ? "bg-green-500/15 text-green-700"
                        : "bg-amber-500/15 text-amber-700"
                    }`}>
                      {!u.is_active ? "Suspended" : u.verified_at ? "Verified" : "Unverified"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                          !u.is_active
                            ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-700 hover:bg-red-500/20"
                        }`}
                      >
                        {toggleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {!u.is_active ? "Activate" : "Suspend"}
                      </button>
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
  );
}
