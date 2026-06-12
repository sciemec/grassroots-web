"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Briefcase, MessageSquare, Home, Send } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL;
const GRS_GREEN = "#1a5c2a";
const BG = "#f4f2ee";

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

interface Thread {
  id: string;
  other_user: { id: string; name: string; role: string };
  last_message: string;
  last_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

function ArenaNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { href: "/arena",             label: "Feed",         icon: Home },
    { href: "/arena/network",     label: "Network",      icon: Users },
    { href: "/arena/clubs",       label: "Clubs",        icon: Users },
    { href: "/arena/recruitment", label: "Talent Board", icon: Briefcase },
    { href: "/arena/messages",    label: "Messages",     icon: MessageSquare },
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
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: GRS_GREEN }}>{initials}</div>
      </div>
    </header>
  );
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return "Just now";
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MessagesPage() {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [threads,       setThreads]       = useState<Thread[]>([]);
  const [activeThread,  setActiveThread]  = useState<Thread | null>(null);
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [draft,         setDraft]         = useState("");
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Pre-select user from query param (e.g. from network page "Message" button)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user");
    if (userId && threads.length > 0) {
      const t = threads.find((th) => th.other_user.id === userId);
      if (t) setActiveThread(t);
    }
  }, [threads]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/arena/messages/threads`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setThreads(safeArray(json.data ?? json)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!activeThread || !token) return;
    fetch(`${API}/arena/messages/threads/${activeThread.other_user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setMessages(safeArray(json.data ?? json)))
      .catch(() => {});
  }, [activeThread, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!draft.trim() || !activeThread || !token) return;
    setSending(true);
    const body = draft.trim();
    setDraft("");
    const optimistic: Message = { id: Date.now().toString(), sender_id: user?.id ?? "", body, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    try {
      await fetch(`${API}/arena/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipient_id: activeThread.other_user.id, body }),
      });
    } catch {}
    setSending(false);
  };

  if (!hasHydrated || !user) return null;
  const userName = user.name ?? "You";

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <ArenaNav userName={userName} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex" style={{ height: "calc(100vh - 130px)" }}>

          {/* Thread list */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm text-gray-900">Messages</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                [1,2,3].map((i) => (
                  <div key={i} className="px-4 py-3 flex gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                ))
              ) : threads.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No conversations yet. Connect with someone from Network to start messaging.
                </div>
              ) : threads.map((t) => {
                const initials = t.other_user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <button key={t.id} onClick={() => setActiveThread(t)}
                    className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeThread?.id === t.id ? "bg-gray-50" : ""}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: GRS_GREEN }}>{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-semibold text-sm text-gray-900 truncate">{t.other_user.name}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{timeAgo(t.last_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{t.last_message}</p>
                    </div>
                    {t.unread_count > 0 && (
                      <span className="w-5 h-5 rounded-full text-xs text-white flex items-center justify-center flex-shrink-0" style={{ background: GRS_GREEN }}>{t.unread_count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col">
            {!activeThread ? (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                Select a conversation
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: GRS_GREEN }}>
                    {activeThread.other_user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{activeThread.other_user.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{activeThread.other_user.role}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.map((m) => {
                    const isMine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${isMine ? "text-white" : "bg-gray-100 text-gray-900"}`}
                          style={isMine ? { background: GRS_GREEN } : {}}>
                          <p>{m.body}</p>
                          <p className={`text-xs mt-1 ${isMine ? "text-white/60" : "text-gray-400"}`}>{timeAgo(m.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Compose */}
                <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 rounded-full border border-gray-200 text-sm outline-none focus:border-gray-300"
                  />
                  <button onClick={sendMessage} disabled={sending || !draft.trim()}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40"
                    style={{ background: GRS_GREEN }}>
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
