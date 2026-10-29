"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Megaphone, ChevronUp, Plus, Trash2, Send, Loader2, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

// ── Constants ──────────────────────────────────────────────────────────────────
const GRS_GREEN = "#1a5c2a";
const BG        = "#f4f2ee";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Announcement {
  id: string;
  title: string;
  body: string;
  target_role: string;
  created_at: string;
  is_active: boolean;
  sent_to_count?: number;
}

const TARGET_ROLES = ["all", "player", "coach", "scout", "fan"] as const;

const ROLE_COLORS: Record<string, string> = {
  all:    "bg-gray-100 text-gray-600",
  player: "bg-blue-100 text-blue-700",
  coach:  "bg-green-100 text-green-700",
  scout:  "bg-orange-100 text-orange-700",
  fan:    "bg-pink-100 text-pink-700",
};

const LS_KEY = "gs_admin_announcements";
const API = process.env.NEXT_PUBLIC_API_URL;

// ── Page ───────────────────────────────────────────────────────────────────────
export default function AdminAnnouncementsPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const token       = useAuthStore((s) => s.token);

  const [formOpen, setFormOpen]       = useState(false);
  const [form, setForm]               = useState({ title: "", body: "", target_role: "all" });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [saving, setSaving]           = useState(false);
  const [fetchError, setFetchError]   = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{ sent_to?: number; ok: boolean } | null>(null);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "admin") { router.replace("/dashboard"); }
  }, [hasHydrated, user, router]);

  // Load announcements
  useEffect(() => {
    // Show localStorage data instantly while backend loads
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setAnnouncements(JSON.parse(stored));
    } catch {}

    if (!token) return;
    setFetchError(false);
    fetch(`${API}/admin/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((json) => {
        if (!json?.data) return;
        const fetched: Announcement[] = json.data.map((a: Record<string, unknown>) => ({
          id:            a.id as string,
          title:         a.title as string,
          body:          a.body as string,
          target_role:   a.target_role as string,
          created_at:    a.created_at as string,
          is_active:     true,
          sent_to_count: a.sent_to_count as number | undefined,
        }));
        setAnnouncements(fetched);
        try { localStorage.setItem(LS_KEY, JSON.stringify(fetched)); } catch {}
      })
      .catch(() => setFetchError(true));
  }, [token]);

  const persist = (updated: Announcement[]) => {
    setAnnouncements(updated);
    try { localStorage.setItem(LS_KEY, JSON.stringify(updated)); } catch {}
  };

  const publish = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setBroadcastResult(null);

    const newAnnouncement: Announcement = {
      id:          Date.now().toString(),
      title:       form.title.trim(),
      body:        form.body.trim(),
      target_role: form.target_role,
      created_at:  new Date().toISOString(),
      is_active:   true,
    };

    // 1. Write to every matching user's notification bell via Laravel
    let broadcastOk = false;
    let sentTo = 0;
    try {
      const res = await fetch(`${API}/admin/notifications/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({
          title:       form.title.trim(),
          body:        form.body.trim(),
          target_role: form.target_role,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        broadcastOk = true;
        sentTo = json.sent_to ?? 0;
      }
    } catch { /* silently log — still saves locally */ }

    // 2. Also fire FCM push (best-effort)
    try {
      await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          body:  form.body.trim(),
          data:  { type: "announcement", target_role: form.target_role },
        }),
      });
    } catch { /* FCM is best-effort */ }

    setBroadcastResult({ ok: broadcastOk, sent_to: sentTo });
    persist([newAnnouncement, ...announcements]);
    setForm({ title: "", body: "", target_role: "all" });
    setFormOpen(false);
    setSaving(false);
  };

  const remove = async (id: string) => {
    persist(announcements.filter((a) => a.id !== id));
    try {
      await fetch(`${API}/admin/announcements/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
    } catch { /* best-effort — already removed from local state */ }
  };

  if (!hasHydrated || !user) return null;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: BG }} className="overflow-auto p-6">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg p-1.5 transition-colors hover:bg-black/5"
            style={{ color: GRS_GREEN }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: GRS_GREEN }}>
              Announcements — Zvinorehwa
            </h1>
            <p className="text-sm text-gray-500">Broadcast notices to platform users</p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: GRS_GREEN }}
        >
          {formOpen ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          New Announcement
        </button>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          Failed to load announcements from server — showing cached data. Check your connection and refresh.
        </div>
      )}

      {/* Broadcast result banner */}
      {broadcastResult?.ok && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          ✓ Notification delivered to {broadcastResult.sent_to} user{broadcastResult.sent_to === 1 ? "" : "s"} — they will see it in their notification bell.
        </div>
      )}
      {broadcastResult && !broadcastResult.ok && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Announcement saved locally. In-app delivery failed — check the backend is running on Render and the admin token is valid.
        </div>
      )}

      {/* Create form */}
      {formOpen && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Create Announcement</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Platform maintenance on Saturday"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Body</label>
              <textarea
                rows={4}
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Announcement content…"
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Target Role</label>
              <select
                value={form.target_role}
                onChange={(e) => setForm((f) => ({ ...f, target_role: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 capitalize outline-none focus:border-transparent focus:ring-2 focus:ring-green-600"
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
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:opacity-90"
                style={{ backgroundColor: GRS_GREEN }}
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing…</>
                  : <><Send className="h-4 w-4" /> Publish &amp; Notify</>}
              </button>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-600">No announcements yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Use the button above to broadcast a message to users
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        ROLE_COLORS[a.target_role] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {a.target_role === "all" ? "All users" : a.target_role}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                    {a.sent_to_count !== undefined && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        Sent to {a.sent_to_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{a.body}</p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(a.created_at).toLocaleDateString("en-ZW", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => remove(a.id)}
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </main>
  );
}
