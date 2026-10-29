"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, Loader2, Download, FileText,
  ExternalLink, ChevronDown, MapPin, TrendingUp, Users,
  UserCheck, Filter, X, Check, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";

// ── Constants ─────────────────────────────────────────────────────────────────
const GRS_GREEN = "#1a5c2a";
const GOLD = "#c8962a";
const BG = "#f4f2ee";

const MINOR_GROUPS = new Set(["U11", "U13", "U15", "U17", "under_13", "13_17"]);

const ROLE_TABS = ["all", "player", "coach", "scout", "fan", "analyst", "admin"] as const;
type RoleTab = (typeof ROLE_TABS)[number];

const ALL_ROLES = ["player", "coach", "scout", "fan", "analyst", "admin"] as const;

type FilterStatus = "all" | "suspended" | "verified" | "pending";

// ── Interfaces ────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  role: string;
  age_group?: string;
  province?: string;
  created_at: string;
  is_active: boolean;
  verified_at: string | null;
  last_active_at: string | null;
  scout_approved_at?: string | null;
}

interface PendingScout {
  id: string;
  name: string | null;
  email: string | null;
  province?: string | null;
  created_at: string;
}

interface ProvinceCount {
  province: string;
  count: number;
}

interface UsersMeta {
  total: number;
  last_page: number;
}

interface WeeklySnapshotCoach {
  coach_id: string;
  coach_name: string;
  coach_email: string;
  org_name: string;
  count: number;
}

interface WeeklySnapshot {
  since: string;
  new_coaches: number;
  new_platform_players: number;
  new_registered_players: number;
  total_new_players: number;
  by_coach: WeeklySnapshotCoach[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local?.[0] ?? "*"}***@${domain}`;
}

function maskPhone(phone?: string | null): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `****${digits.slice(-4)}`;
}

function isMinorOrUnknown(ag?: string | null): boolean {
  return !ag || MINOR_GROUPS.has(ag);
}

function displayName(name: string | null | undefined, ag?: string | null): string {
  if (!name) return "—";
  if (!isMinorOrUnknown(ag)) return name;
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? "?";
  const lastInit = parts[1]?.[0] ? `${parts[1][0]}.` : "";
  return [first, lastInit].filter(Boolean).join(" ");
}

function ini(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function userStatus(u: AdminUser): { label: string; bg: string; text: string } {
  if (!u.is_active) return { label: "Suspended", bg: "#fee2e2", text: "#b91c1c" };
  if (u.verified_at)  return { label: "Verified",   bg: "#dcfce7", text: "#15803d" };
  return                     { label: "Pending",    bg: "#fef3c7", text: "#b45309" };
}

const ROLE_PILL: Record<string, { bg: string; text: string }> = {
  admin:   { bg: "#f3e8ff", text: "#7e22ce" },
  coach:   { bg: "#dcfce7", text: "#15803d" },
  scout:   { bg: "#ffedd5", text: "#c2410c" },
  player:  { bg: "#dbeafe", text: "#1d4ed8" },
  fan:     { bg: "#fce7f3", text: "#be185d" },
  analyst: { bg: "#e0f2fe", text: "#0369a1" },
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-100" />
        </div>
      </div>
      <div className="h-3 w-24 rounded bg-gray-100" />
    </div>
  );
}

// ── ApprovalCard ──────────────────────────────────────────────────────────────
function ApprovalCard({
  scout,
  onApprove,
  onReject,
  approving,
  rejecting,
}: {
  scout: PendingScout;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const [confirm, setConfirm] = useState<"approve" | "reject" | null>(null);

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: GRS_GREEN }}
        >
          {ini(scout.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{scout.name}</p>
          <p className="text-xs text-gray-500 truncate">{maskEmail(scout.email)}</p>
          {scout.province && (
            <p className="text-[11px] text-gray-400">{scout.province}</p>
          )}
          <p className="text-[11px] text-gray-400">Applied {timeAgo(scout.created_at)}</p>
        </div>
      </div>

      {confirm === null ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setConfirm("approve")}
            className="flex-1 rounded-lg py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: GRS_GREEN }}
          >
            Approve
          </button>
          <button
            onClick={() => setConfirm("reject")}
            className="flex-1 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            Reject
          </button>
        </div>
      ) : confirm === "approve" ? (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-2">
          <p className="mb-2 text-xs font-semibold text-green-800">Approve this scout account?</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onApprove(scout.id); setConfirm(null); }}
              disabled={approving}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: GRS_GREEN }}
            >
              {approving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Yes, approve
            </button>
            <button
              onClick={() => setConfirm(null)}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2">
          <p className="text-xs font-semibold text-red-800">Reject and suspend this account?</p>
          <p className="mt-0.5 mb-2 text-[11px] text-red-600">Account will be suspended. You can reactivate later.</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onReject(scout.id); setConfirm(null); }}
              disabled={rejecting}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              {rejecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              Reject
            </button>
            <button
              onClick={() => setConfirm(null)}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── UserCard (mobile) ─────────────────────────────────────────────────────────
function UserCard({
  u,
  onToggle,
  toggling,
}: {
  u: AdminUser;
  onToggle: () => void;
  toggling: boolean;
}) {
  const safeName = displayName(u.name, u.age_group);
  const st = userStatus(u);
  const rp = ROLE_PILL[u.role] ?? { bg: "#f3f4f6", text: "#374151" };
  const minor = isMinorOrUnknown(u.age_group);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: GRS_GREEN }}
        >
          {ini(safeName)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/admin/users/${u.id}`}
              className="text-sm font-semibold text-gray-900 hover:underline"
            >
              {safeName}
            </Link>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
              style={{ backgroundColor: rp.bg, color: rp.text }}
            >
              {u.role}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-gray-500 truncate">{maskEmail(u.email)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: st.bg, color: st.text }}
            >
              {st.label}
            </span>
            {u.age_group && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                {minor ? "Minor" : u.age_group}
              </span>
            )}
            {u.province && (
              <span className="text-[11px] text-gray-400">{u.province}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Link
            href={`/admin/users/${u.id}`}
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            View <ExternalLink className="h-3 w-3" />
          </Link>
          <button
            onClick={onToggle}
            disabled={toggling}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium disabled:opacity-50 transition-colors ${
              !u.is_active
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {toggling && <Loader2 className="h-3 w-3 animate-spin" />}
            {!u.is_active ? "Activate" : "Suspend"}
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-gray-50 pt-2">
        <p className="text-[11px] text-gray-400">{maskPhone(u.phone)}</p>
        <p className="text-[11px] text-gray-400">Joined {timeAgo(u.created_at)}</p>
      </div>
    </div>
  );
}

// ── Export helpers (masked — no raw email/phone in export) ────────────────────
function exportCSV(users: AdminUser[]) {
  const headers = ["Name", "Role", "Province", "Age Group", "Joined", "Status"];
  const rows = users.map((u) => [
    displayName(u.name, u.age_group),
    u.role,
    u.province ?? "",
    u.age_group ?? "",
    new Date(u.created_at).toLocaleDateString("en-ZW"),
    userStatus(u).label,
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
  doc.text("GrassRoots Sports — User Export (Admin)", 10, 12);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleString("en-ZW"), 250, 12);

  autoTable(doc, {
    startY: 22,
    head: [["Name", "Role", "Province", "Age Group", "Joined", "Status"]],
    body: users.map((u) => [
      displayName(u.name, u.age_group),
      u.role,
      u.province ?? "—",
      u.age_group ?? "—",
      new Date(u.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" }),
      userStatus(u).label,
    ]),
    headStyles: { fillColor: [26, 92, 42], fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: [244, 242, 238] },
  });

  doc.save(`grassroots-users-${new Date().toISOString().slice(0, 10)}.pdf`);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleTab, setRoleTab] = useState<RoleTab>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close role dropdown when clicking outside
  useEffect(() => {
    if (!roleDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-role-dropdown]")) {
        setRoleDropdownOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleDropdownOpen]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<{ data: AdminUser[]; meta: UsersMeta }>({
    queryKey: ["admin-users", debouncedSearch, roleTab, filterStatus, page],
    queryFn: async () => {
      const res = await api.get("/admin/users", {
        params: {
          search: debouncedSearch || undefined,
          role: roleTab !== "all" ? roleTab : undefined,
          per_page: 25,
          page,
        },
      });
      return res.data;
    },
    enabled: !!user,
  });

  // Per-role counts — 6 parallel queries each fetching 1 row for the meta.total
  const { data: roleCounts } = useQuery<Record<string, number>>({
    queryKey: ["admin-role-counts"],
    queryFn: async () => {
      const roles = ["player", "coach", "scout", "fan", "analyst", "admin"];
      const results = await Promise.allSettled(
        roles.map(async (r) => {
          const res = await api.get("/admin/users", { params: { role: r, per_page: 1 } });
          return [r, (res.data?.meta?.total ?? 0)] as [string, number];
        })
      );
      return Object.fromEntries(
        results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
      );
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  // Pending scout approvals
  const { data: pendingScoutsData } = useQuery<{ data: PendingScout[] }>({
    queryKey: ["admin-pending-scouts"],
    queryFn: async () => {
      const res = await api.get("/admin/scout-approvals");
      return res.data;
    },
    staleTime: 60_000,
    enabled: !!user,
  });

  const { data: snapshotData } = useQuery<WeeklySnapshot>({
    queryKey: ["admin-weekly-snapshot"],
    queryFn: async () => {
      const res = await api.get("/admin/users/weekly-snapshot");
      return res.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: provincesData } = useQuery<{ data: ProvinceCount[] }>({
    queryKey: ["admin-users-provinces"],
    queryFn: async () => {
      const res = await api.get("/admin/users/provinces");
      return res.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-role-counts"] });
      setRoleDropdownOpen(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/scout-approvals/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-scouts"] });
      qc.invalidateQueries({ queryKey: ["admin-role-counts"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setApprovingId(null);
    },
  });

  // Reject = suspend until dedicated reject endpoint is built in commit 2
  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/toggle-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-pending-scouts"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setRejectingId(null);
    },
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const users = data?.data ?? [];
  const meta = data?.meta;
  const provinces = provincesData?.data ?? [];
  const maxProvinceCount = provinces[0]?.count ?? 1;
  const pendingScouts = pendingScoutsData?.data ?? [];

  const filteredUsers = useMemo(() => {
    if (filterStatus === "all") return users;
    return users.filter((u) => {
      if (filterStatus === "suspended") return !u.is_active;
      if (filterStatus === "verified")  return u.is_active && !!u.verified_at;
      if (filterStatus === "pending")   return u.is_active && !u.verified_at;
      return true;
    });
  }, [users, filterStatus]);

  const suspendedCount = useMemo(() => users.filter((u) => !u.is_active).length, [users]);
  const pendingVerifyCount = useMemo(() => users.filter((u) => u.is_active && !u.verified_at).length, [users]);

  const setRoleFilter = (r: RoleTab) => {
    setRoleTab(r);
    setPage(1);
    setFilterStatus("all");
  };

  const setStatusFilter = (s: FilterStatus) => {
    setFilterStatus((prev) => (prev === s ? "all" : s));
    setPage(1);
  };

  const clearFilters = () => {
    setRoleTab("all");
    setFilterStatus("all");
    setSearch("");
    setPage(1);
  };

  const hasFilters = roleTab !== "all" || filterStatus !== "all" || !!search;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{ backgroundColor: BG, minHeight: "100vh" }} className="overflow-auto p-4 sm:p-6">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ color: GRS_GREEN }}>Users</h1>
          <p className="text-xs text-gray-500">Manage all platform users</p>
        </div>

        {/* Export */}
        <div className="relative" ref={exportRef}>
          <button
            onClick={() => setExportOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export
            <ChevronDown className="h-3 w-3" />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-xl border border-gray-100 bg-white shadow-lg">
              <button
                onClick={() => { exportCSV(users); setExportOpen(false); }}
                className="flex w-full items-center gap-2 rounded-t-xl px-3 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> CSV (this page)
              </button>
              <button
                onClick={() => { exportPDF(users); setExportOpen(false); }}
                className="flex w-full items-center gap-2 rounded-b-xl px-3 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" /> PDF (this page)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Weekly snapshot */}
      {snapshotData && (
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              This Week&nbsp;
              <span className="normal-case font-normal">
                (since {new Date(snapshotData.since).toLocaleDateString("en-ZW", { day: "numeric", month: "short" })})
              </span>
            </p>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: "New coaches",      value: snapshotData.new_coaches,            color: "#15803d", Icon: UserCheck },
              { label: "Joined platform",  value: snapshotData.new_platform_players,   color: "#1d4ed8", Icon: Users },
              { label: "Coach-registered", value: snapshotData.new_registered_players, color: "#b45309", Icon: Users },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-gray-50 px-3 py-2.5 text-center">
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="mt-0.5 text-[11px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          {snapshotData.by_coach.length > 0 && (
            <div className="space-y-1.5">
              {snapshotData.by_coach.slice(0, 5).map((c) => (
                <div key={c.coach_id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-medium text-gray-800 truncate">{c.coach_name}</span>
                    <span className="block text-[11px] text-gray-400 truncate">{c.org_name || maskEmail(c.coach_email)}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          backgroundColor: GOLD,
                          width: `${Math.round((c.count / snapshotData.by_coach[0].count) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="w-5 text-right text-xs font-bold" style={{ color: GOLD }}>{c.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Province breakdown */}
      {provinces.length > 0 && (
        <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" style={{ color: GOLD }} />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Users by Province</p>
          </div>
          <div className="space-y-1.5">
            {provinces.map((row) => (
              <div key={row.province} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-xs text-gray-500">{row.province}</span>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: GRS_GREEN,
                      width: `${Math.round((row.count / maxProvinceCount) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right text-xs font-semibold text-gray-700">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending approvals section */}
      {pendingScouts.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-amber-800">
              {pendingScouts.length} Scout{pendingScouts.length !== 1 ? "s" : ""} awaiting approval
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingScouts.map((scout) => (
              <ApprovalCard
                key={scout.id}
                scout={scout}
                onApprove={(id) => { setApprovingId(id); approveMutation.mutate(id); }}
                onReject={(id)  => { setRejectingId(id);  rejectMutation.mutate(id); }}
                approving={approvingId === scout.id && approveMutation.isPending}
                rejecting={rejectingId === scout.id && rejectMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Summary row */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setRoleFilter("all")}
          className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          style={
            roleTab === "all" && filterStatus === "all"
              ? { backgroundColor: GRS_GREEN, color: "#fff" }
              : { backgroundColor: "#fff", color: "#374151", border: "1px solid #e5e7eb" }
          }
        >
          All {meta?.total ? `(${meta.total})` : ""}
        </button>

        {Object.entries(roleCounts ?? {}).map(([role, count]) => {
          const rp = ROLE_PILL[role] ?? { bg: "#f3f4f6", text: "#374151" };
          const active = roleTab === role;
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role as RoleTab)}
              className="rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-opacity hover:opacity-80"
              style={{
                backgroundColor: rp.bg,
                color: rp.text,
                border: active ? `2px solid ${rp.text}` : "2px solid transparent",
              }}
            >
              {role} ({count})
            </button>
          );
        })}

        {pendingScouts.length > 0 && (
          <span className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" />
            {pendingScouts.length} pending approval
          </span>
        )}

        {suspendedCount > 0 && (
          <button
            onClick={() => setStatusFilter("suspended")}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              filterStatus === "suspended"
                ? { backgroundColor: "#b91c1c", color: "#fff", borderColor: "#b91c1c" }
                : { backgroundColor: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" }
            }
          >
            Suspended
          </button>
        )}

        {pendingVerifyCount > 0 && (
          <button
            onClick={() => setStatusFilter("pending")}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              filterStatus === "pending"
                ? { backgroundColor: "#b45309", color: "#fff", borderColor: "#b45309" }
                : { backgroundColor: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }
            }
          >
            Unverified
          </button>
        )}
      </div>

      {/* Search + Filters toggle */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-transparent focus:ring-2 focus:ring-green-700"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium transition-colors ${
            showFilters
              ? "border-gray-800 bg-gray-800 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters
          {hasFilters && (
            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
              !
            </span>
          )}
        </button>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Role</p>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_TABS.map((tab) => {
                  const rp = tab !== "all" ? (ROLE_PILL[tab] ?? null) : null;
                  const active = roleTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setRoleFilter(tab)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-opacity hover:opacity-80"
                      style={
                        active
                          ? rp
                            ? { backgroundColor: rp.text, color: "#fff", border: "none" }
                            : { backgroundColor: GRS_GREEN, color: "#fff", border: "none" }
                          : rp
                          ? { backgroundColor: rp.bg, color: rp.text, border: "1px solid transparent" }
                          : { backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" }
                      }
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {(["all", "verified", "pending", "suspended"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      filterStatus === s
                        ? "border-gray-800 bg-gray-800 text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-3 w-3" /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <AlertTriangle className="mx-auto mb-3 h-9 w-9 text-red-400" />
          <p className="font-semibold text-red-700">Could not load users</p>
          <p className="mt-1 text-sm text-red-500">Check your connection and try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 mx-auto flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: GRS_GREEN }}
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : isLoading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <div className="hidden lg:block space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-white border border-gray-100" />
            ))}
          </div>
        </>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-14 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-600">
            {hasFilters ? "No users match your filters" : "No users yet"}
          </p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm font-medium underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: GRS_GREEN }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {filteredUsers.map((u) => (
              <UserCard
                key={u.id}
                u={u}
                onToggle={() => toggleMutation.mutate(u.id)}
                toggling={toggleMutation.isPending && (toggleMutation.variables as string) === u.id}
              />
            ))}
          </div>

          {/* Wide-screen table */}
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["User", "Contact", "Role", "Province", "Joined", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((u) => {
                  const safeName = displayName(u.name, u.age_group);
                  const st = userStatus(u);
                  const rp = ROLE_PILL[u.role] ?? { bg: "#f3f4f6", text: "#374151" };
                  const minor = isMinorOrUnknown(u.age_group);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: GRS_GREEN }}
                          >
                            {ini(safeName)}
                          </div>
                          <div>
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="group flex items-center gap-1 text-sm font-semibold text-gray-900 hover:underline"
                            >
                              {safeName}
                              <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
                            </Link>
                            {u.age_group && (
                              <span className="text-[11px] text-gray-400">{minor ? "Minor" : u.age_group}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact — masked */}
                      <td className="px-4 py-3">
                        <span className="block text-xs text-gray-600">{maskEmail(u.email)}</span>
                        <span className="block text-[11px] text-gray-400">{maskPhone(u.phone)}</span>
                      </td>

                      {/* Role with inline change */}
                      <td className="px-4 py-3">
                        <div className="relative inline-block" data-role-dropdown>
                          <button
                            onClick={() => setRoleDropdownOpen(roleDropdownOpen === u.id ? null : u.id)}
                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                            style={{ backgroundColor: rp.bg, color: rp.text }}
                          >
                            {u.role} <ChevronDown className="h-2.5 w-2.5" />
                          </button>
                          {roleDropdownOpen === u.id && (
                            <div className="absolute left-0 top-full z-30 mt-1 w-28 rounded-xl border border-gray-100 bg-white shadow-lg">
                              {ALL_ROLES.filter((r) => r !== u.role).map((r) => {
                                const rp2 = ROLE_PILL[r] ?? { bg: "#f3f4f6", text: "#374151" };
                                return (
                                  <button
                                    key={r}
                                    onClick={() => roleMutation.mutate({ id: u.id, role: r })}
                                    disabled={roleMutation.isPending && roleMutation.variables?.id === u.id}
                                    className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-xs capitalize hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                                    style={{ color: rp2.text }}
                                  >
                                    {roleMutation.isPending && roleMutation.variables?.id === u.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                    {r}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">{u.province || "—"}</td>

                      {/* Joined */}
                      <td className="px-4 py-3">
                        <span className="block text-xs font-medium text-gray-700">
                          {new Date(u.created_at).toLocaleDateString("en-ZW", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                        <span className="block text-[11px] text-gray-400">{timeAgo(u.created_at)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: st.bg, color: st.text }}
                        >
                          {st.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => toggleMutation.mutate(u.id)}
                            disabled={toggleMutation.isPending}
                            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium disabled:opacity-50 transition-colors ${
                              !u.is_active
                                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            }`}
                          >
                            {toggleMutation.isPending &&
                              (toggleMutation.variables as string) === u.id && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                            {!u.is_active ? "Activate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && !isError && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {meta.total} total · page {page} of {meta.last_page}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
