"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Users, Search, UserPlus } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";
import type { SquadMember } from "@/types";

const POSITIONS = [
  "Goalkeeper", "Right Back", "Left Back", "Centre Back",
  "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
  "Right Winger", "Left Winger", "Centre Forward", "Striker",
];

const STATUS_STYLES: Record<string, string> = {
  fit:     "bg-green-500/15 text-green-700",
  injured: "bg-red-500/15 text-red-700",
  caution: "bg-amber-500/15 text-amber-700",
};

interface AddForm { player_email: string; shirt_no: string; position: string }

export default function CoachSquadPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [squad, setSquad] = useState<SquadMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ player_email: "", shirt_no: "", position: "" });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // guests allowed — no login redirect
    fetchSquad();
  }, [user, router]);

  const fetchSquad = () => {
    setLoading(true);
    api.get("/coach/squad")
      .then((res) => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/coach/squad/${id}`, { status }).catch(() => {});
    setSquad((prev) => prev.map((m) => m.id === id ? { ...m, status: status as SquadMember["status"] } : m));
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this player from your squad?")) return;
    await api.delete(`/coach/squad/${id}`).catch(() => {});
    setSquad((prev) => prev.filter((m) => m.id !== id));
  };

  const addPlayer = async () => {
    if (!addForm.player_email || !addForm.shirt_no || !addForm.position) {
      setAddError("All fields are required."); return;
    }
    setAdding(true);
    setAddError("");
    try {
      await api.post("/coach/squad", {
        player_email: addForm.player_email,
        shirt_no: Number(addForm.shirt_no),
        position: addForm.position,
      });
      setAddForm({ player_email: "", shirt_no: "", position: "" });
      setShowAdd(false);
      fetchSquad();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAddError(msg ?? "Failed to add player. Check the email is registered.");
    } finally {
      setAdding(false);
    }
  };

  const filtered = squad.filter((m) => {
    const matchSearch = !search ||
      m.player?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.position?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });


  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">My Squad</h1>
              <p className="text-sm text-muted-foreground">{squad.length} players registered</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add player
          </button>
        </div>

        {/* Add player form */}
        {showAdd && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Add player to squad</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Player email</label>
                <input
                  type="email"
                  placeholder="player@email.com"
                  value={addForm.player_email}
                  onChange={(e) => setAddForm((f) => ({ ...f, player_email: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Shirt number</label>
                <input
                  type="number"
                  min={1} max={99}
                  placeholder="10"
                  value={addForm.shirt_no}
                  onChange={(e) => setAddForm((f) => ({ ...f, shirt_no: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Position</label>
                <select
                  value={addForm.position}
                  onChange={(e) => setAddForm((f) => ({ ...f, position: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select position…</option>
                  {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {addError && <p className="mt-2 text-sm text-destructive">{addError}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={addPlayer}
                disabled={adding}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {adding ? "Adding…" : "Add to squad"}
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddError(""); }}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Search + filter */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or position…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {["all", "fit", "caution", "injured"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Squad table */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[68px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{squad.length === 0 ? "No players yet" : "No players match your filter"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {squad.length === 0 ? "Add players using the button above" : "Try a different search or status filter"}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">#</th>
                    <th className="px-4 py-3 font-medium">Player</th>
                    <th className="px-4 py-3 font-medium">Position</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {m.shirt_no}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{m.player?.name ?? "—"}</td>
                      <td className="px-4 py-3.5 capitalize text-muted-foreground">{m.position}</td>
                      <td className="px-4 py-3.5">
                        <select
                          value={m.status}
                          onChange={(e) => updateStatus(m.id, e.target.value)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium cursor-pointer ${STATUS_STYLES[m.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          <option value="fit">Fit</option>
                          <option value="caution">Caution</option>
                          <option value="injured">Injured</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {new Date(m.joined_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => remove(m.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
