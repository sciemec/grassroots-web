"use client";

import { useEffect, useRef, useState } from "react";

interface Story {
  id: string;
  user_name: string;
  sport: string | null;
  video_url: string;
  body: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h === 1) return "1h ago";
  return `${h}h ago`;
}

function initials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PlayerStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [active, setActive] = useState<Story | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/stories`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.data) && data.data.length > 0) {
          setStories(data.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (active && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [active]);

  if (stories.length === 0) return null;

  return (
    <>
      {/* Stories strip */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "10px 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1152,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {/* Label */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: 8,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#1a5c2a",
              }}
            >
              Player
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#c8962a",
              }}
            >
              Moments
            </span>
            <span style={{ fontSize: 8, color: "#9ca3af", marginTop: 2 }}>· 24h</span>
          </div>

          {/* Scrollable story bubbles */}
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: 2,
            }}
          >
            {stories.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {/* Gold ring avatar */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    padding: 2,
                    background: "linear-gradient(135deg, #f0b429 0%, #1a5c2a 100%)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "#1a5c2a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f0b429",
                      fontSize: 14,
                      fontWeight: 800,
                    }}
                  >
                    {initials(s.user_name)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: "#374151",
                    maxWidth: 52,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textAlign: "center",
                  }}
                >
                  {s.user_name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen story viewer */}
      {active && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#000",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={() => setActive(null)}
        >
          {/* Header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              padding: "16px 20px",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                padding: 2,
                background: "linear-gradient(135deg, #f0b429, #1a5c2a)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#1a5c2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f0b429",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {initials(active.user_name)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
                {active.user_name}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>
                {active.sport ?? "Player"} · {timeAgo(active.created_at)}
              </div>
            </div>
            <button
              onClick={() => setActive(null)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Video */}
          <video
            ref={videoRef}
            src={active.video_url}
            controls
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption */}
          {active.body && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "32px 20px 24px",
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p style={{ color: "#fff", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                {active.body}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
