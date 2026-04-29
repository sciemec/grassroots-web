"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { safeArray } from "@/lib/safe-array";
import { ArrowLeft, Megaphone, Loader2, Send, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface Announcement {
  id: number;
  title: string;
  body: string;
  audience: string;
  sent_at: string;
  recipient_count: number;
}

export default function AnnouncementsPage() {
  const router  = useRouter();
  const token   = useAuthStore((s) => s.token);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({ title: "", body: "", audience: "all_clubs" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/province-admin/announcements`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((j) => setAnnouncements(safeArray<Announcement>(j)))
      .catch(() => setError("Failed to load announcements."))
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setFormError("Title and message body are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch(`${API_URL}/province-admin/announcements`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      setAnnouncements((prev) => [json.data, ...prev]);
      setForm({ title: "", body: "", audience: "all_clubs" });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 max-w-3xl">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Province Administration
            </p>
            <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          </div>
        </div>

        {/* Compose form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-5 mb-8 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-4 w-4 text-pink-400" />
            <p className="text-sm font-semibold text-pink-300">New Announcement</p>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. League fixtures updated for June"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-[#f0b429]"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Message *</label>
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={4}
              placeholder="Write your message to all clubs in the province…"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-[#f0b429] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">Send To</label>
            <select
              value={form.audience}
              onChange={(e) => set("audience", e.target.value)}
              className="w-full bg-[#1a3d26] border border-white/20 rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-[#f0b429]"
            >
              <option value="all_clubs">All Clubs in Province</option>
              <option value="active_clubs">Active Clubs Only</option>
              <option value="coaches">All Coaches</option>
              <option value="players">All Players</option>
            </select>
          </div>

          {formError && (
            <p className="text-xs text-red-300">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#f0b429] hover:bg-amber-400 disabled:opacity-50 text-[#1a3a1a] font-bold text-sm transition-colors"
          >
            {sent ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Announcement Sent!
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : "Send Announcement"}
              </>
            )}
          </button>
        </form>

        {/* History */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Previous Announcements
          </p>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-300 text-sm">
              {error}
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-card/60 p-6 text-center">
              <p className="text-sm text-muted-foreground">No announcements sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-2xl border border-white/10 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.body}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.sent_at).toLocaleDateString("en-ZW")}
                      </p>
                      {a.recipient_count > 0 && (
                        <p className="text-xs text-accent mt-0.5">{a.recipient_count} recipients</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-pink-400/70 mt-2 capitalize">
                    → {a.audience.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
