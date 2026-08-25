"use client";
// src/app/watch/[id]/page.tsx
// Public-facing video watch page — links are shared with parents/players.
// Authenticated users see the video player.
// Unauthenticated users see a sign-in prompt.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Calendar, Users, Trophy, Eye, Play, Lock,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface MatchVideo {
  id: string;
  title: string;
  match_date: string;
  opponent: string | null;
  competition: string | null;
  video_url: string | null;
  view_count: number;
  coach_id: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [video, setVideo]   = useState<MatchVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!id || !hasHydrated) return;

    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API}/coach/match-videos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setVideo(d.data ?? d))
      .catch((e) =>
        setError(e === 404 ? "Video not found." : "Could not load this video.")
      )
      .finally(() => setLoading(false));
  }, [id, token, hasHydrated]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!hasHydrated || loading) return <LoadingSkeleton />;

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, backgroundColor: "#1a3d26",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Lock size={28} color="#f0b429" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>
            Sign in to watch
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 24px", lineHeight: 1.6 }}>
            Create a free Fan account to watch match videos shared by your coach.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/login?next=/watch/${id}`}
              style={{ padding: "11px 24px", backgroundColor: "#1a5c2a", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}
            >
              Sign In
            </Link>
            <Link
              href="/register"
              style={{ padding: "11px 24px", backgroundColor: "#fff", color: "#374151", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14, border: "1px solid #d1d5db" }}
            >
              Register Free
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !video) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
            {error || "Video not found."}
          </p>
          <Link href="/arena" style={{ fontSize: 13, color: "#1a5c2a", textDecoration: "none" }}>
            ← Back to Arena
          </Link>
        </div>
      </div>
    );
  }

  // ── Player ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Nav bar */}
      <div style={{ backgroundColor: "#000", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid #1f1f1f" }}>
        <Link
          href={`/team-videos/${video.coach_id}`}
          style={{ color: "#9ca3af", display: "flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Team Videos
        </Link>
      </div>

      {/* Video player */}
      {video.video_url ? (
        <video
          src={video.video_url}
          controls
          playsInline
          preload="metadata"
          style={{ width: "100%", maxHeight: "65vh", backgroundColor: "#000", display: "block" }}
        />
      ) : (
        <div style={{ width: "100%", height: 240, backgroundColor: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Play size={44} color="#4b5563" style={{ display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>No video file uploaded for this match</p>
          </div>
        </div>
      )}

      {/* Metadata panel */}
      <div style={{ backgroundColor: "#fff", padding: "20px 20px 56px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 12px", lineHeight: 1.3 }}>
            {video.title}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            {video.match_date && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280" }}>
                <Calendar size={13} /> {formatDate(video.match_date)}
              </span>
            )}
            {video.opponent && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#6b7280" }}>
                <Users size={13} /> vs {video.opponent}
              </span>
            )}
            {video.competition && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#374151", backgroundColor: "#f3f4f6", padding: "3px 10px", borderRadius: 20 }}>
                <Trophy size={11} /> {video.competition}
              </span>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>
              <Eye size={12} /> {video.view_count} view{video.view_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <div style={{ height: 48, backgroundColor: "#000", borderBottom: "1px solid #1f1f1f" }} />
      <div style={{ height: 240, backgroundColor: "#111" }} />
      <div style={{ backgroundColor: "#fff", padding: "20px" }}>
        <div style={{ height: 22, width: "60%", backgroundColor: "#e5e7eb", borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 14, width: "40%", backgroundColor: "#f1f5f9", borderRadius: 5 }} />
      </div>
    </div>
  );
}
