"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, MessageCircle, Send, Loader2, Play, Download } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface MatchVideo {
  id: string;
  title: string;
  match_date: string;
  opponent: string | null;
  competition: string | null;
  video_url: string;
  thumbnail_url: string | null;
  arena_post_id: string | null;
  view_count: number;
  coach_name?: string;
  team_name?: string;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  user: { id: string; name: string; role: string };
}

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function WatchMatchVideoPage() {
  const _params = useParams<{ videoId: string }>();
  const videoId = _params?.videoId;
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [video, setVideo]       = useState<MatchVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError]     = useState("");

  const [comments, setComments] = useState<Comment[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [newComment, setNewComment]   = useState("");
  const [submitting, setSubmitting]   = useState(false);

  // Fetch match video metadata
  useEffect(() => {
    if (!videoId) return;
    fetch(`${API}/coach/match-videos/${videoId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (r.status === 403) throw new Error("PRIVATE");
        if (r.status === 404) throw new Error("NOT_FOUND");
        if (!r.ok) throw new Error("ERROR");
        return r.json();
      })
      .then((d) => setVideo(d.data ?? d))
      .catch((e: Error) => setVideoError(e.message))
      .finally(() => setVideoLoading(false));
  }, [videoId, token]);

  // Fetch Arena comments (if posted to Arena)
  useEffect(() => {
    if (!video?.arena_post_id) return;
    setCommLoading(true);
    fetch(`${API}/arena/posts/${video.arena_post_id}/comments`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setComments(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setCommLoading(false));
  }, [video?.arena_post_id, token]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !video?.arena_post_id || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/arena/posts/${video.arena_post_id}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: newComment.trim() }),
      });
      const d = await res.json();
      const created: Comment | null = d.data ?? d ?? null;
      if (created?.id) {
        setComments((prev) => [...prev, created]);
        setNewComment("");
      }
    } catch { /* silent */ } finally {
      setSubmitting(false);
    }
  }

  const dateStr = video?.match_date
    ? new Date(video.match_date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Nav */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/arena" style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> The Arena
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 600, color: "#1a5c2a", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {video?.title ?? "Match Video"}
        </span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px 64px" }}>

        {videoLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
            <Loader2 size={32} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
            Loading video…
          </div>
        ) : videoError === "PRIVATE" ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 8 }}>This video is private</p>
            <p style={{ color: "#6b7280", fontSize: 14, maxWidth: 340, margin: "0 auto" }}>
              The coach hasn&apos;t made this video publicly viewable. If you&apos;re a parent or player expecting access, contact your coach to share the link.
            </p>
          </div>
        ) : videoError ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ color: "#dc2626", fontWeight: 600, marginBottom: 16 }}>Video not found or the link may have expired.</p>
            {!token && (
              <Link href="/login" style={{ display: "inline-block", padding: "10px 24px", backgroundColor: "#1a5c2a", color: "#fff", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
                Sign in to watch
              </Link>
            )}
          </div>
        ) : video ? (
          <>
            {/* Video player */}
            <div style={{ marginBottom: 20 }}>
              {video.video_url ? (
                <video
                  controls
                  autoPlay
                  src={video.video_url}
                  poster={video.thumbnail_url ?? undefined}
                  style={{ width: "100%", display: "block", borderRadius: 12, backgroundColor: "#000", maxHeight: 480 }}
                />
              ) : (
                <div style={{ height: 280, backgroundColor: "#000", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                  <Play size={48} color="#374151" style={{ marginBottom: 12 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>Video processing — check back shortly.</p>
                </div>
              )}
            </div>

            {/* Match info */}
            <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "18px 20px", marginBottom: 20, border: "1px solid #e5e7eb" }}>
              <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#111" }}>{video.title}</h1>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>{dateStr}</p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {video.opponent && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0" }}>
                    vs {video.opponent}
                  </span>
                )}
                {video.competition && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", backgroundColor: "#f3f4f6", padding: "4px 10px", borderRadius: 20, border: "1px solid #e5e7eb" }}>
                    {video.competition}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#9ca3af", padding: "4px 0" }}>
                  {video.view_count} view{video.view_count !== 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
                {video.video_url && (
                  <a href={video.video_url} download target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", backgroundColor: "#f3f4f6", color: "#374151", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none", border: "1px solid #e5e7eb" }}>
                    <Download size={11} /> Download
                  </a>
                )}
                {video.arena_post_id && (
                  <Link href="/arena" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", fontSize: 12, color: "#1a5c2a", textDecoration: "none", fontWeight: 700, backgroundColor: "#f0fdf4", borderRadius: 7, border: "1px solid #bbf7d0" }}>
                    <MessageCircle size={11} /> View on The Arena
                  </Link>
                )}
              </div>
            </div>

            {/* Not signed in CTA */}
            {!token && (
              <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
                <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: "#92400e" }}>Sign in to comment</p>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#78350f" }}>
                  Parents: create a free Fan account at grassrootssports.live/register
                </p>
                <Link href="/login" style={{ display: "inline-block", padding: "8px 20px", backgroundColor: "#1a5c2a", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
                  Sign In
                </Link>
              </div>
            )}

            {/* Comments section (only if posted to Arena) */}
            {video.arena_post_id && (
              <div style={{ backgroundColor: "#fff", borderRadius: 14, padding: "18px 20px", border: "1px solid #e5e7eb" }}>
                <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 15, color: "#111", display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageCircle size={16} color="#1a5c2a" />
                  Comments ({comments.length})
                </p>

                {commLoading ? (
                  <p style={{ color: "#9ca3af", fontSize: 13 }}>Loading comments…</p>
                ) : comments.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 16px" }}>No comments yet. Be the first to comment!</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                    {comments.map((c) => (
                      <div key={c.id} style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{initials(c.user.name)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{c.user.name}</span>
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>{timeAgo(c.created_at)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                {token && user && (
                  <form onSubmit={handleComment} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: "#1a5c2a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{initials(user.name ?? "U")}</span>
                    </div>
                    <div style={{ flex: 1, position: "relative" }}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(e as unknown as React.FormEvent); } }}
                        placeholder="Add a comment… (Enter to post)"
                        rows={2}
                        style={{ width: "100%", padding: "9px 44px 9px 12px", borderRadius: 10, border: "1px solid #d1d5db", fontSize: 13, resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                      />
                      <button type="submit" disabled={submitting || !newComment.trim()}
                        style={{ position: "absolute", right: 8, bottom: 8, background: "none", border: "none", cursor: submitting || !newComment.trim() ? "not-allowed" : "pointer", color: submitting || !newComment.trim() ? "#d1d5db" : "#1a5c2a", padding: 4 }}>
                        {submitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
