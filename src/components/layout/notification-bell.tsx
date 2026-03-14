"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
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

const TYPE_STYLES: Record<string, string> = {
  info:    "bg-blue-500/15 text-blue-600",
  success: "bg-green-500/15 text-green-600",
  warning: "bg-amber-500/15 text-amber-600",
  alert:   "bg-red-500/15 text-red-600",
};

export function NotificationBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data?.data ?? res.data ?? []);
    } catch { /* keep existing */ }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for real-time feel
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post("/notifications/mark-all-read").catch(() => {});
  };

  const notifLink = user?.role === "player" ? "/player/notifications" : user?.role === "coach" ? "/coach/notifications" : "/notifications";

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-80 rounded-2xl border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <CheckCheck className="h-3.5 w-3.5" /> All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="rounded p-0.5 hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${n.read ? "" : "bg-primary/5"}`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${TYPE_STYLES[n.type] ?? "bg-muted text-muted-foreground"}`}>
                    {n.type === "success" ? "✓" : n.type === "warning" ? "!" : n.type === "alert" ? "!" : "i"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${n.read ? "text-muted-foreground" : ""}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleDateString("en-ZW")}</p>
                  </div>
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="mt-0.5 rounded p-0.5 hover:bg-muted transition-colors flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-3">
            <Link
              href={notifLink}
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
