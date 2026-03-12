"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import api from "@/lib/api";
import { Send, CheckCircle } from "lucide-react";

interface User {
  id: string;
  player_id: string;
  email: string;
  role: string;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { data: users } = useQuery<{ data: User[] }>({
    queryKey: ["users-select"],
    queryFn: async () => {
      const res = await api.get("/admin/users", { params: { per_page: 100 } });
      return res.data;
    },
  });

  const send = useMutation({
    mutationFn: () =>
      api.post("/admin/notifications/send", {
        user_id: userId || undefined,
        title,
        body,
      }),
    onSuccess: () => {
      setSent(true);
      setTitle("");
      setBody("");
      setUserId("");
      setTimeout(() => setSent(false), 4000);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to send notification.");
    },
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Push Notifications</h1>
        <p className="text-sm text-muted-foreground">Send FCM push notifications to users</p>
      </div>

      <div className="max-w-lg">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Recipient</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All users (broadcast)</option>
              {users?.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.player_id ?? u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification body…"
              rows={4}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {sent && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
              <CheckCircle className="h-4 w-4" /> Notification sent successfully.
            </div>
          )}

          <button
            onClick={() => { setError(""); send.mutate(); }}
            disabled={!title.trim() || !body.trim() || send.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {send.isPending ? "Sending…" : userId ? "Send to User" : "Broadcast to All"}
          </button>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Broadcast sends to all users with a registered FCM token. Individual sends target one user.
        </p>
      </div>
    </DashboardLayout>
  );
}
