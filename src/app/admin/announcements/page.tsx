"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, ChevronUp, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";

interface Announcement {
  id: string;
  title: string;
  body: string;
  target_role: string;
  created_at: string;
  is_active: boolean;
}

const TARGET_ROLES = ["all", "player", "coach", "scout", "fan"] as const;

const ROLE_COLORS: Record<string, string> = {
  all:    "bg-muted text-muted-foreground",
  player: "bg-blue-500/15 text-blue-700",
  coach:  "bg-green-500/15 text-green-700",
  scout:  "bg-orange-500/15 text-orange-700",
  fan:    "bg-pink-500/15 text-pink-700",
};

const LS_KEY = "gs_admin_announcements";

export default function AdminAnnouncementsPage() {
  useAuthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target_role: "all" });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [saving, setSaving] = useState(false);
  const [pushResult, setPushResult] = useState<"sent" | "failed" | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setAnnouncements(JSON.parse(stored));
    } catch {}
  }, []);

  const persist = (updated: Announcement[]) => {
    setAnnouncements(updated);
    try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}
  };

  const publish = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setPushResult(null);

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: form.title.trim(),
      body: form.body.trim(),
      target_role: form.target_role,
      created_at: new Date().toISOString(),
      is_active: true,
    };

    // Fire push notification via existing Firebase route
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          data: { type: "announcement", target_role: form.target_role },
        }),
      });
      setPushResult(res.ok ? "sent" : "failed");
    } catch {
      setPushResult("failed");
    }

    persist([newAnnouncement, ...announcements]);
    setForm({ title: "", body: "", target_role: "all" });
    setFormOpen(false);
    setSaving(false);
  };

  const remove = (id: string) => {
    persist(announcements.filter((a) => a.id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="gs-watermark flex-1 overflow-auto p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Announcements — Zvinorehwa</h1>
              <p className="text-sm text-muted-foreground">Broadcast notices to platform users</p>
            </div>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {formOpen ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            New Announcement
          </button>
        </div>

        {/* Push result banner */}
        {pushResult === "sent" && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            ✓ Announcement published and push notification sent to all users.
          </div>
        )}
        {pushResult === "failed" && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Announcement saved. Push delivery failed — check FIREBASE_* env vars in Vercel.
          </div>
        )}

        {/* Create form */}
        {formOpen && (
          <div className="mb-6 rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold text-white">Create Announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Platform maintenance on Saturday"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Body</label>
                <textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Announcement content…"
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Target Role</label>
                <select
                  value={form.target_role}
                  onChange={(e) => setForm((f) => ({ ...f, target_role: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring capitalize"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">
                      {r === "all" ? "All users" : r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={publish}
                  disabled={!form.title.trim() || !form.body.trim() || saving}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
                    : <><Send className="h-4 w-4" /> Publish &amp; Notify</>}
                </button>
                <button
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements list */}
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-white">No announcements yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the button above to broadcast a message to users
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{a.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                          ROLE_COLORS[a.target_role] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.target_role === "all" ? "All users" : a.target_role}
                      </span>
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-700">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-ZW", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(a.id)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
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
