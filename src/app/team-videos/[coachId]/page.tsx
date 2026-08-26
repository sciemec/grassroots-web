"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Play, Calendar, Users, Film, ExternalLink,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface CoachProfile {
  id: string;
  name: string;
  first_name: string | null;
  surname: string | null;
  avatar_url: string | null;
  province: string | null;
  sport: string | null;
  initials: string;
}

interface MatchVideo {
  id: string;
  title: string;
  match_date: string;
  opponent: string | null;
  competition: string | null;
  arena_post_id: string;
  view_count: number;
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0)  return "Today";
  if (days === 1)  return "Yesterday";
  if (days < 30)   return `${days}d ago`;
  if (days < 365)  return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function TeamVideosPage() {
  const params = useParams<{ coachId: string }>();
  const coachId = params?.coachId;
  const token = useAuthStore((s) => s.token);

  const [coach, setCoach]   = useState<CoachProfile | null>(null);
  const [videos, setVideos] = useState<MatchVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!coachId) return;

    Promise.allSettled([
      fetch(`${API}/coaches/${coachId}`).then((r) => r.ok ? r.json() : null),
      fetch(`${API}/coaches/${coachId}/match-videos`).then((r) => r.json()),
    ])
      .then(([profileResult, videosResult]) => {
        if (profileResult.status === "fulfilled" && profileResult.value) {
          const d = profileResult.value;
          setCoach(d.data ?? d);
        }
        if (videosResult.status === "fulfilled") {
          setVideos(Array.isArray(videosResult.value?.data) ? videosResult.value.data : []);
        } else {
          setError("Could not load videos.");
        }
      })
      .finally(() => setLoading(false));
  }, [coachId]);

  const displayName = coach
    ? [coach.first_name, coach.surname].filter(Boolean).join(" ") || coach.name || "Coach"
    : "";

  const sport = coach?.sport
    ? coach.sport.charAt(0).toUpperCase() + coach.sport.slice(1)
    : "";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Nav */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/arena" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> The Arena
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14 }}>
          {loading ? "Team Videos" : `${displayName} — Match Videos`}
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 64px" }}>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 15 }}>{error}</p>
            <Link href="/arena" style={{ fontSize: 13, color: "#1a5c2a" }}>← Back to Arena</Link>
          </div>
        ) : (
          <>
            {/* Coach header card */}
            <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, border: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                {coach?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coach.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{coach?.initials ?? displayName.charAt(0)}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#111" }}>{displayName}</h1>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {sport && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "2px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
                      {sport}
                    </span>
                  )}
                  {coach?.province && (
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{coach.province}</span>
                  )}
                  <span style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 4 }}>
                    <Film size={12} /> {videos.length} video{videos.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Link href="/arena" style={{ fontSize: 12, color: "#1a5c2a", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <ExternalLink size={12} /> Arena
              </Link>
            </div>

            {/* Sign-in banner for unauthenticated users */}
            {!token && (
              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13, color: "#92400e" }}>Sign in to watch videos</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#78350f" }}>
                    Parents: create a free Fan account to watch and comment.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <Link href="/register" style={{ padding: "7px 14px", backgroundColor: "#1a5c2a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 12 }}>
                    Register Free
                  </Link>
                  <Link href="/login" style={{ padding: "7px 14px", backgroundColor: "#fff", color: "#374151", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 12, border: "1px solid #d1d5db" }}>
                    Sign In
                  </Link>
                </div>
              </div>
            )}

            {/* Video list */}
            {videos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "56px 24px", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
                <Film size={40} color="#d1d5db" style={{ margin: "0 auto 14px", display: "block" }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: "#374151", margin: "0 0 6px" }}>No match videos yet</p>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                  {displayName} hasn&apos;t posted any match videos to the Arena yet.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {videos.map((v) => (
                  <VideoCard key={v.id} video={v} token={token} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, token }: { video: MatchVideo; token: string | null }) {
  const href = token ? `/watch/${video.id}` : "/login";

  return (
    <Link
      href={href}
      style={{ backgroundColor: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", textDecoration: "none", display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1a5c2a"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#e5e7eb"; }}
    >
      {/* Play thumbnail */}
      <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: "#1a3d26", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Play size={20} color="#c8962a" fill="#c8962a" />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {video.title}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
            <Calendar size={11} /> {formatDate(video.match_date)}
          </span>
          {video.opponent && (
            <span style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={11} /> vs {video.opponent}
            </span>
          )}
          {video.competition && (
            <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", backgroundColor: "#f3f4f6", padding: "1px 8px", borderRadius: 10 }}>
              {video.competition}
            </span>
          )}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af" }}>
          {video.view_count} view{video.view_count !== 1 ? "s" : ""} · {timeAgo(video.match_date)}
        </p>
      </div>

      {/* Lock or play cue */}
      <div style={{ flexShrink: 0 }}>
        {token ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
            Watch
          </span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#92400e", backgroundColor: "#fffbeb", padding: "4px 10px", borderRadius: 20, border: "1px solid #fde68a" }}>
            Sign in
          </span>
        )}
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div style={{ backgroundColor: "#fff", borderRadius: 16, padding: "20px 24px", marginBottom: 24, border: "1px solid #e5e7eb", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#e5e7eb", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 18, width: "40%", backgroundColor: "#e5e7eb", borderRadius: 6, marginBottom: 10 }} />
          <div style={{ height: 12, width: "25%", backgroundColor: "#f1f5f9", borderRadius: 6 }} />
        </div>
      </div>
      {/* Video skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ backgroundColor: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e5e7eb", display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: "#e5e7eb", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: "55%", backgroundColor: "#e5e7eb", borderRadius: 5, marginBottom: 10 }} />
            <div style={{ height: 11, width: "35%", backgroundColor: "#f1f5f9", borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
