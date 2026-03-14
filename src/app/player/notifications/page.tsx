"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Filter } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "alert";
  read: boolean;
  created_at: string;
  link?: string;
}

const TYPE_BADGE: Record<string, string> = {
  info:    "bg-blue-500/15 text-blue-700",
  success: "bg-green-500/15 text-green-700",
  warning: "bg-amber-500/15 text-amber-700",
  alert:   "bg-red-500/15 text-red-700",
};

const TYPE_LABEL: Record<string, string> = {
  info: "Info", success: "Achievement", warning: "Warning", alert: "Alert",
};

export default function PlayerNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data ?? res.data ?? []);
    } catch { /* network error — keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [user, router, fetchNotifications]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post("/notifications/mark-all-read").catch(() => {});
  };

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;
  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" /> Notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "All caught up"} · Updates on your training, achievements, and account
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors self-start"
            >
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}
          >
            <Filter className="h-3.5 w-3.5" /> All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === "unread" ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}
          >
            Unread ({unread})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold mb-1">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === "unread" ? "You've read everything!" : "Complete training sessions to earn updates and achievements."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors ${n.read ? "bg-card" : "bg-primary/5 border-primary/20"}`}
              >
                <div className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[n.type] ?? "bg-muted text-muted-foreground"}`}>
                  {TYPE_LABEL[n.type] ?? "Info"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${n.read ? "text-muted-foreground" : ""}`}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-ZW")}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="mt-0.5 flex-shrink-0 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" /> Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
