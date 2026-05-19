"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCircle2, Info, AlertTriangle, AlertCircle,
  Star, ChevronLeft, Trash2, CheckCheck,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { safeArray } from "@/lib/safe-array";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArenaNotification {
  id: string | number;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "alert" | "opportunity";
  read: boolean;
  link: string | null;
  created_at: string;
}

// ─── ArenaNav ─────────────────────────────────────────────────────────────────

function ArenaNav() {
  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/arena" className="text-lg font-bold" style={{ color: "#1a5c2a" }}>
          The Arena
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm">
          <Link href="/arena" className="text-gray-600 hover:text-gray-900">Feed</Link>
          <Link href="/arena/network" className="text-gray-600 hover:text-gray-900">Network</Link>
          <Link href="/arena/discover" className="text-gray-600 hover:text-gray-900">Discover</Link>
          <Link href="/arena/recruitment" className="text-gray-600 hover:text-gray-900">Talent Board</Link>
          <Link href="/arena/messages" className="text-gray-600 hover:text-gray-900">Messages</Link>
        </div>
      </div>
      <div className="relative group">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
          style={{ backgroundColor: "#1a5c2a" }}
        >
          {initials}
        </div>
        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-40 hidden group-hover:block z-50">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type: ArenaNotification["type"]) {
  switch (type) {
    case "success":     return <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />;
    case "warning":     return <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
    case "alert":       return <AlertCircle size={18} className="text-red-500 flex-shrink-0" />;
    case "opportunity": return <Star size={18} style={{ color: "#c8962a" }} className="flex-shrink-0" />;
    default:            return <Info size={18} className="text-blue-500 flex-shrink-0" />;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "Just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-ZW", { day: "numeric", month: "short" });
}

function groupByDate(notifs: ArenaNotification[]): Record<string, ArenaNotification[]> {
  const groups: Record<string, ArenaNotification[]> = {};
  const now = new Date();

  for (const n of notifs) {
    const d    = new Date(n.created_at);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const key  = diff === 0 ? "Today" : diff === 1 ? "Yesterday" : "Earlier";
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  }
  return groups;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArenaNotificationsPage() {
  const token  = useAuthStore((s) => s.token);
  const router = useRouter();

  const [notifs, setNotifs]     = useState<ArenaNotification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) { router.replace("/login"); return; }
    fetch(`${API}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const _r = json.data ?? json;
        setNotifs(safeArray<ArenaNotification>(_r));
      })
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  }, [API, token, router]);

  const markRead = async (id: string | number) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Silently fail — UI already updated
    }
  };

  const dismiss = async (id: string | number) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`${API}/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Silently fail
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch(`${API}/notifications/mark-all-read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotifClick = (n: ArenaNotification) => {
    if (!n.read) markRead(n.id);
    if (n.link) router.push(n.link);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;
  const groups      = groupByDate(notifs);
  const GROUP_ORDER = ["Today", "Yesterday", "Earlier"];

  if (!token) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      <ArenaNav />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Back + Header */}
        <Link
          href="/arena"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeft size={16} />
          Back to Arena
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} style={{ color: "#1a5c2a" }} />
              Arena Alerts
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">
                {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse flex gap-3">
                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-4 text-sm text-center">
            {error}
          </div>
        ) : notifs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <Bell size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              You will be notified when scouts view your profile, players connect with you, and more.
            </p>
            <Link
              href="/arena"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Go to Arena Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {GROUP_ORDER.filter((g) => groups[g]?.length).map((group) => (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  {group}
                </p>
                <div className="space-y-2">
                  {groups[group].map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 cursor-pointer hover:shadow-md transition-shadow"
                      style={!n.read ? { borderLeftWidth: 3, borderLeftColor: "#1a5c2a" } : {}}
                    >
                      {/* Unread dot */}
                      {!n.read && (
                        <div
                          className="absolute top-4 right-10 w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: "#1a5c2a" }}
                        />
                      )}

                      {/* Icon */}
                      <div className="mt-0.5">{typeIcon(n.type)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${n.read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                        className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 self-start mt-0.5"
                        title="Dismiss"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
