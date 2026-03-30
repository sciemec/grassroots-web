"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Filter, Users, Trophy, AlertTriangle } from "lucide-react";
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

const TYPE_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  info:    { label: "Info",        badge: "bg-blue-500/15 text-blue-700",   icon: Bell },
  success: { label: "Achievement", badge: "bg-green-500/15 text-green-700", icon: Trophy },
  warning: { label: "Warning",     badge: "bg-amber-500/15 text-amber-700", icon: AlertTriangle },
  alert:   { label: "Alert",       badge: "bg-red-500/15 text-red-700",     icon: AlertTriangle },
};

export default function CoachNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data ?? res.data ?? []);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user) return; // guests see empty notifications
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

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
              Squad updates, match alerts, and platform announcements
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                <CheckCheck className="h-4 w-4" /> Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Unread", value: unread, icon: Bell, color: "text-primary" },
            { label: "Total", value: notifications.length, icon: Filter, color: "text-muted-foreground" },
            { label: "Squad alerts", value: notifications.filter(n => n.type === "warning" || n.type === "alert").length, icon: Users, color: "text-amber-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border bg-card px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}
            >
              {f} {f === "all" ? `(${notifications.length})` : `(${unread})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h3 className="font-semibold mb-1">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              You&apos;ll see squad injury alerts, match reminders, and platform updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((n) => {
              const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
              const Icon = config.icon;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors ${n.read ? "bg-card" : "bg-primary/5 border-primary/20"}`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.badge}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-medium ${n.read ? "text-muted-foreground" : ""}`}>{n.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>{config.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
