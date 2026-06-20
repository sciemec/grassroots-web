"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Info, CheckCircle2, AlertTriangle, AlertCircle, Star, Trash2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

interface ArenaNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "alert" | "opportunity";
  read: boolean;
  link?: string;
  created_at: string;
}

function safeArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const inner = (v as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner as T[];
  }
  return [];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

function isToday(iso: string)     { const d = new Date(iso); const t = new Date(); return d.toDateString() === t.toDateString(); }
function isYesterday(iso: string) { const d = new Date(iso); const y = new Date(Date.now() - 86400000); return d.toDateString() === y.toDateString(); }

function TypeIcon({ type }: { type: ArenaNotification["type"] }) {
  const cls = "w-5 h-5 flex-shrink-0";
  if (type === "success")     return <CheckCircle2  className={cls} color="#16a34a" />;
  if (type === "warning")     return <AlertTriangle className={cls} color="#d97706" />;
  if (type === "alert")       return <AlertCircle   className={cls} color="#dc2626" />;
  if (type === "opportunity") return <Star          className={cls} color="#c8962a" />;
  return <Info className={cls} color="#6b7280" />;
}

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena",             label: "Feed" },
    { href: "/arena/network",     label: "Network" },
    { href: "/arena/clubs",       label: "Clubs" },
    { href: "/arena/recruitment", label: "Talent Board" },
    { href: "/arena/messages",    label: "Messages" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/arena" className="font-bold text-lg flex-shrink-0" style={{ color: GRS_GREEN }}>The Arena</Link>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${pathname === href ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
              style={pathname === href ? { background: GRS_GREEN } : {}}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

export default function ArenaNotificationsPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [notifications, setNotifications] = useState<ArenaNotification[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    if (!hasHydrated || !token) return;
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json) => setNotifications(safeArray<ArenaNotification>(json)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hasHydrated, token]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await fetch(`${API}/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch(`${API}/notifications/mark-all-read`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  };

  const dismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`${API}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  };

  const handleClick = (n: ArenaNotification) => {
    if (!n.read) markRead(n.id);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const todayItems      = notifications.filter((n) => isToday(n.created_at));
  const yesterdayItems  = notifications.filter((n) => isYesterday(n.created_at));
  const earlierItems    = notifications.filter((n) => !isToday(n.created_at) && !isYesterday(n.created_at));

  if (!hasHydrated) return <div className="flex h-screen items-center justify-center" style={{ background: BG }}><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: GRS_GREEN, borderTopColor: "transparent" }} /></div>;

  function NotifRow({ n }: { n: ArenaNotification }) {
    return (
      <div onClick={() => handleClick(n)}
        className="relative bg-white rounded-xl border p-4 flex gap-3 items-start cursor-pointer hover:shadow-sm transition-shadow"
        style={{ borderColor: n.read ? "#e5e7eb" : "#bbf7d0", borderLeftWidth: n.read ? 1 : 3, borderLeftColor: n.read ? "#e5e7eb" : GRS_GREEN }}>
        <TypeIcon type={n.type} />
        <div className="flex-1 min-w-0">
          {n.link ? (
            <Link href={n.link} className="font-medium text-sm text-gray-900 hover:underline">{n.title}</Link>
          ) : (
            <p className="font-medium text-sm text-gray-900">{n.title}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
        </div>
        {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: GRS_GREEN }} />}
        <button onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
          className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG }}>
      <ArenaNav userName={user?.name ?? "A"} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell size={20} style={{ color: GRS_GREEN }} /> Arena Alerts
            </h1>
            {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm font-medium hover:underline" style={{ color: GRS_GREEN }}>
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full" />
                  <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-full" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
            <Link href="/arena" className="text-sm font-medium mt-3 inline-block hover:underline" style={{ color: GRS_GREEN }}>
              Go to Arena Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {todayItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Today</p>
                <div className="space-y-2">{todayItems.map((n) => <NotifRow key={n.id} n={n} />)}</div>
              </div>
            )}
            {yesterdayItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Yesterday</p>
                <div className="space-y-2">{yesterdayItems.map((n) => <NotifRow key={n.id} n={n} />)}</div>
              </div>
            )}
            {earlierItems.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Earlier</p>
                <div className="space-y-2">{earlierItems.map((n) => <NotifRow key={n.id} n={n} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
