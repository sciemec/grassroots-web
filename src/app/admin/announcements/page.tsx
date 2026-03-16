"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
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

// Placeholder list until the API is live
const PLACEHOLDER_ANNOUNCEMENTS: Announcement[] = [];

export default function AdminAnnouncementsPage() {
  // user kept for future auth-gating once API is ready
  useAuthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", target_role: "all" });

  const announcements: Announcement[] = PLACEHOLDER_ANNOUNCEMENTS;

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
            title="Backend coming soon"
            disabled
            className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-primary/50 px-4 py-2.5 text-sm font-semibold text-primary-foreground opacity-60"
          >
            {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            New Announcement
          </button>
        </div>

        {/* Coming Soon banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-400">Announcement API is being set up. Check back soon.</p>
            <p className="mt-0.5 text-sm text-amber-400/70">
              The form below is disabled until the backend endpoint is live.
            </p>
          </div>
        </div>

        {/* Create form — visible but fully disabled */}
        {formOpen && (
          <div className="mb-6 rounded-xl border bg-card p-5 opacity-60">
            <h2 className="mb-4 font-semibold text-white">Create Announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title…"
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border bg-background px-3 py-2.5 text-sm outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Body</label>
                <textarea
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Announcement content…"
                  disabled
                  className="w-full cursor-not-allowed resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Target Role</label>
                <select
                  value={form.target_role}
                  onChange={(e) => setForm((f) => ({ ...f, target_role: e.target.value }))}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border bg-background px-3 py-2.5 text-sm outline-none capitalize"
                >
                  {TARGET_ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">{r === "all" ? "All users" : r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  disabled
                  title="Backend coming soon"
                  className="flex cursor-not-allowed items-center gap-2 rounded-xl bg-primary/50 px-4 py-2.5 text-sm font-semibold text-primary-foreground opacity-50"
                >
                  Publish
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

        {/* Announcements list — empty state while API is pending */}
        {announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium text-white">No announcements yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Announcements will appear here once the API is live</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{a.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[a.target_role] ?? "bg-muted text-muted-foreground"}`}>
                        {a.target_role === "all" ? "All users" : a.target_role}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.is_active ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {a.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-ZW", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
