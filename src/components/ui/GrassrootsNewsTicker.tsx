"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

interface FeedItem {
  id: string;
  type: string;
  initials: string;
  location: string;
  message: string;
  encouragement: string;
  joined_ago: string;
}

const ROLE_ICON: Record<string, string> = {
  coach:         "🏋️",
  scout:         "🔍",
  fan:           "👨‍👩‍👧",
  international: "🌍",
  member:        "👋",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function GrassrootsNewsTicker() {
  const token = useAuthStore((s) => s.token);

  const [items, setItems]         = useState<FeedItem[]>([]);
  const [current, setCurrent]     = useState(0);
  const [visible, setVisible]     = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch feed on mount and every 30 seconds
  const fetchFeed = async () => {
    try {
      const res = await fetch(`${API_URL}/activity-feed`);
      if (!res.ok) return;
      const json = await res.json();
      const data: FeedItem[] = Array.isArray(json.data) ? json.data : [];
      if (data.length > 0) {
        setItems(data);
        setDismissed(false);
        setVisible(true);
      }
    } catch {
      // silent — never crash the page for a news ticker
    }
  };

  useEffect(() => {
    fetchFeed();
    const poll = setInterval(fetchFeed, 30_000);
    return () => clearInterval(poll);
  }, []);

  // Rotate through items every 6 seconds
  useEffect(() => {
    if (items.length === 0) return;
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 6_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [items]);

  const handleFollow = async (userId: string) => {
    if (!token || following.has(userId)) return;
    try {
      const res = await fetch(`${API_URL}/arena/follow/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) setFollowing((prev) => new Set([...prev, userId]));
    } catch {
      // silent
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!visible || dismissed || items.length === 0) return null;

  const item = items[current];
  const icon = ROLE_ICON[item.type] ?? "👋";
  const isFollowed = following.has(item.id);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "24px",
        zIndex: 50,
        width: "min(300px, calc(100vw - 32px))",
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: "14px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        overflow: "hidden",
        animation: "tickerSlideUp 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#1a5c2a",
          padding: "7px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#f0b429", fontWeight: 700, fontSize: "11px", letterSpacing: "0.05em" }}>
          🇿🇼 GRASSROOTS NEWS
        </span>
        <button
          onClick={handleDismiss}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 2px" }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 10px" }}>
        {/* Avatar + meta */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              background: "#f0fdf4",
              border: "2px solid #bbf7d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
              fontWeight: 700,
              color: "#1a5c2a",
              flexShrink: 0,
            }}
          >
            {item.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", color: "#111827", fontWeight: 600, lineHeight: 1.3 }}>
              {icon} {item.message}
            </div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
              {item.joined_ago}
            </div>
          </div>
        </div>

        {/* Encouragement */}
        <div style={{ fontSize: "12px", color: "#374151", marginBottom: "10px", fontStyle: "italic" }}>
          {item.encouragement} 👋
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href={`/arena`}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "6px 0",
              borderRadius: "8px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#1a5c2a",
              fontSize: "12px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Say Hi 👋
          </a>
          {token && (
            <button
              onClick={() => handleFollow(item.id)}
              disabled={isFollowed}
              style={{
                flex: 1,
                padding: "6px 0",
                borderRadius: "8px",
                background: isFollowed ? "#f3f4f6" : "#1a5c2a",
                border: "none",
                color: isFollowed ? "#9ca3af" : "#fff",
                fontSize: "12px",
                fontWeight: 600,
                cursor: isFollowed ? "default" : "pointer",
              }}
            >
              {isFollowed ? "Following ✓" : "Follow +"}
            </button>
          )}
        </div>

        {/* Dot indicators */}
        {items.length > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "8px" }}>
            {items.map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: i === current ? "16px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  background: i === current ? "#1a5c2a" : "#d1fae5",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes tickerSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
