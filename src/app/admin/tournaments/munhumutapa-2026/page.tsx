"use client";

import { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Trophy,
  Users,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
} from "lucide-react";

interface TournamentPlayer {
  name: string;
  dob: string;
  position: string;
  school: string;
}

interface Registration {
  id: string;
  clubName: string;
  coachName: string;
  coachPhone: string;
  coachEmail: string;
  province: string;
  category: string;
  players: TournamentPlayer[];
  registeredAt: string;
  status: "pending" | "confirmed" | "rejected";
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "u14-boys", label: "U14 Boys" },
  { value: "u14-girls", label: "U14 Girls" },
  { value: "u16-boys", label: "U16 Boys" },
  { value: "u16-girls", label: "U16 Girls" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  confirmed: "bg-green-500/20 text-green-400 border border-green-500/30",
  rejected:  "bg-red-500/20 text-red-400 border border-red-500/30",
};

const STATUS_ICONS = {
  pending:   Clock,
  confirmed: CheckCircle2,
  rejected:  XCircle,
};

export default function MunhumutapaAdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load from localStorage (primary source until Laravel is live)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("munhumutapa_2026_registrations");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRegistrations(parsed);
      }
    } catch {
      // ignore parse errors
    }

    // Also try to fetch from API
    fetch("/api/tournaments/register")
      .then((r) => r.json())
      .then((d) => {
        const apiData = d.data ?? [];
        if (Array.isArray(apiData) && apiData.length > 0) {
          setRegistrations(apiData);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return registrations.filter((r) => {
      const matchesSearch =
        !search ||
        r.clubName.toLowerCase().includes(search.toLowerCase()) ||
        r.coachName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || r.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [registrations, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total   = registrations.length;
    const pending  = registrations.filter((r) => r.status === "pending").length;
    const confirmed = registrations.filter((r) => r.status === "confirmed").length;
    const totalPlayers = registrations.reduce((acc, r) => acc + r.players.length, 0);
    const byCategory = CATEGORIES.slice(1).map((c) => ({
      label: c.label,
      count: registrations.filter((r) => r.category === c.value).length,
    }));
    return { total, pending, confirmed, totalPlayers, byCategory };
  }, [registrations]);

  const updateStatus = (id: string, status: "pending" | "confirmed" | "rejected") => {
    setRegistrations((prev) => {
      const updated = prev.map((r) => r.id === id ? { ...r, status } : r);
      localStorage.setItem("munhumutapa_2026_registrations", JSON.stringify(updated));
      return updated;
    });
  };

  const exportCSV = () => {
    const rows: string[] = [
      "ID,Club,Coach,Phone,Email,Province,Category,Players,Status,Registered"
    ];
    filtered.forEach((r) => {
      rows.push(
        [
          r.id, r.clubName, r.coachName, r.coachPhone, r.coachEmail,
          r.province, r.category, r.players.length, r.status,
          new Date(r.registeredAt).toLocaleDateString()
        ].join(",")
      );
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "munhumutapa-2026-registrations.csv";
    a.click();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 gs-watermark">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#f0b429]/20 p-2.5">
              <Trophy className="h-6 w-6 text-[#f0b429]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Munhumutapa Challenge Cup 2026</h1>
              <p className="text-sm text-muted-foreground">Admin Registration Dashboard · ZIFA Harare Province</p>
            </div>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg bg-[#f0b429] px-4 py-2 text-sm font-semibold text-[#1a3a1a] hover:bg-[#e6a820] transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Clubs", value: stats.total, icon: Shield, color: "text-blue-400" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-400" },
            { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-green-400" },
            { label: "Total Players", value: stats.totalPlayers, icon: Users, color: "text-[#f0b429]" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
              <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="mb-6 rounded-xl border border-[#f0b429]/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Registrations by Category
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.byCategory.map((c) => (
              <div key={c.label} className="rounded-lg bg-white/5 px-3 py-2 text-center">
                <p className="text-xl font-bold text-[#f0b429]">{c.count}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search club or coach..."
              className="w-full rounded-lg border border-[#f0b429]/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#f0b429]/10 bg-white/5 px-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent py-2 pr-2 text-sm text-white focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value} className="bg-[#1a3d26]">{c.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-[#f0b429]/10 bg-white/5 px-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent py-2 pr-2 text-sm text-white focus:outline-none"
            >
              <option value="all" className="bg-[#1a3d26]">All Statuses</option>
              <option value="pending" className="bg-[#1a3d26]">Pending</option>
              <option value="confirmed" className="bg-[#1a3d26]">Confirmed</option>
              <option value="rejected" className="bg-[#1a3d26]">Rejected</option>
            </select>
          </div>

          <p className="text-sm text-muted-foreground ml-auto">
            {filtered.length} of {registrations.length} clubs
          </p>
        </div>

        {/* Registrations List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-[#f0b429]/10 bg-white/5 p-12 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {registrations.length === 0
                ? "No registrations yet. Share the tournament page with clubs."
                : "No clubs match the current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((reg) => {
              const StatusIcon = STATUS_ICONS[reg.status];
              const isExpanded = expandedId === reg.id;

              return (
                <div
                  key={reg.id}
                  className="rounded-xl border border-[#f0b429]/10 bg-white/5 overflow-hidden"
                >
                  {/* Row header */}
                  <div
                    className="flex cursor-pointer items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                  >
                    <div className="flex-shrink-0">
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{reg.clubName}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[reg.status]}`}>
                          <StatusIcon className="h-3 w-3" />
                          {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                        </span>
                        <span className="rounded-full bg-[#f0b429]/20 px-2 py-0.5 text-xs font-medium text-[#f0b429]">
                          {CATEGORIES.find((c) => c.value === reg.category)?.label ?? reg.category}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{reg.players.length} players</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{reg.province}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(reg.registeredAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {reg.status !== "confirmed" && (
                        <button
                          onClick={() => updateStatus(reg.id, "confirmed")}
                          className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {reg.status !== "rejected" && (
                        <button
                          onClick={() => updateStatus(reg.id, "rejected")}
                          className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-[#f0b429]/10 px-4 pb-4 pt-3">
                      {/* Coach contact */}
                      <div className="mb-4 grid gap-2 sm:grid-cols-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-white">{reg.coachName}</span>
                          <span className="text-muted-foreground">(Coach)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                          <a href={`tel:${reg.coachPhone}`} className="text-[#f0b429] hover:underline">{reg.coachPhone}</a>
                        </div>
                        {reg.coachEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            <a href={`mailto:${reg.coachEmail}`} className="text-[#f0b429] hover:underline truncate">{reg.coachEmail}</a>
                          </div>
                        )}
                      </div>

                      {/* Player list */}
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Player Squad ({reg.players.length})
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#f0b429]/10 text-xs text-muted-foreground">
                              <th className="pb-2 text-left font-medium">#</th>
                              <th className="pb-2 text-left font-medium">Name</th>
                              <th className="pb-2 text-left font-medium">DOB</th>
                              <th className="pb-2 text-left font-medium">Position</th>
                              <th className="pb-2 text-left font-medium">School</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reg.players.map((p, i) => (
                              <tr key={i} className="border-b border-[#f0b429]/5 last:border-0">
                                <td className="py-1.5 text-muted-foreground">{i + 1}</td>
                                <td className="py-1.5 text-white font-medium">{p.name}</td>
                                <td className="py-1.5 text-muted-foreground">{p.dob}</td>
                                <td className="py-1.5 text-muted-foreground capitalize">{p.position}</td>
                                <td className="py-1.5 text-muted-foreground">{p.school || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Registration ID */}
                      <p className="mt-3 text-xs text-muted-foreground/60">
                        Registration ID: {reg.id}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
