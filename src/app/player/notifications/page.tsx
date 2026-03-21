"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell, Check, CheckCheck, Filter, ArrowLeft,
  Info, CheckCircle2, AlertTriangle, AlertCircle, Trash2,
} from "lucide-react";
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

const TYPE_ICON: Record<string, typeof Bell> = {
  info:    Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  alert:   AlertCircle,
};

const TYPE_ICON_COLOR: Record<string, string> = {
  info:    "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
  alert:   "text-red-500",
};

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;

  const groups: Record<string, Notification[]> = { Today: [], Yesterday: [], Earlier: [] };

  for (const n of notifications) {
    const d = new Date(n.created_at).getTime();
    if (d >= today) groups.Today.push(n);
    else if (d >= yesterday) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

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

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post("/notifications/mark-all-read").catch(() => {});
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    api.delete(`/notifications/${id}`).catch(() => {});
  };

  if (!user) return null;

  const unread = notifications.filter((n) => !n.read).length;
  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const groups = groupByDate(visible);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bell className="h-6 w-6" /> Notifications
                </h1>
                <p className="text-sm text-muted-foreground">
                  {unread > 0 ? `${unread} unread` : "All caught up"} · Updates on your training, achievements, and account
                </p>
              </div>
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

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <h3 className="font-semibold mb-1">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You've read everything!"
                  : "Complete training sessions to earn updates and achievements."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map(({ label, items }) => (
                <div key={label}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <div className="space-y-2">
                    {items.map((n) => {
                      const Icon = TYPE_ICON[n.type] ?? Bell;
                      const iconColor = TYPE_ICON_COLOR[n.type] ?? "text-muted-foreground";
                      const inner = (
                        <div
                          className={`flex items-start gap-4 rounded-xl border px-5 py-4 transition-colors ${
                            n.read ? "bg-card" : "bg-primary/5 border-primary/20"
                          } ${n.link ? "cursor-pointer hover:bg-muted/60" : ""}`}
                        >
                          {/* Type icon */}
                          <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-medium ${n.read ? "text-muted-foreground" : ""}`}>
                                {n.title}
                              </p>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[n.type] ?? "bg-muted text-muted-foreground"}`}>
                                {TYPE_LABEL[n.type] ?? "Info"}
                              </span>
                              {!n.read && (
                                <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(n.created_at).toLocaleString("en-ZW", {
                                hour: "2-digit", minute: "2-digit", hour12: true,
                              })}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 flex items-center gap-1.5 mt-0.5">
                            {!n.read && (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); markRead(n.id); }}
                                className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-muted transition-colors"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(n.id); }}
                              className="flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1.5 text-xs text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Dismiss"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );

                      return n.link ? (
                        <Link key={n.id} href={n.link} onClick={() => !n.read && markRead(n.id)}>
                          {inner}
                        </Link>
                      ) : (
                        <div key={n.id}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
