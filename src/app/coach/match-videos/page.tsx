"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import {
  ArrowLeft, Film, Upload, Play, ChevronUp, Trash2, Share2,
  Check, Loader2, LinkIcon, Download, Eye, Plus, X, Lock, Link2, Globe,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoVisibility = "private" | "team" | "public";

interface MatchVideo {
  id: string;
  title: string;
  match_date: string;
  opponent: string | null;
  competition: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  arena_post_id: string | null;
  view_count: number;
  duration_seconds: number | null;
  visibility: VideoVisibility;
  created_at: string;
}

type ThumbState = "idle" | "generating" | "ready" | "skipped";

async function generateThumbnailSafe(file: File): Promise<Blob | null> {
  try {
    const { generateThumbnail } = await import("@/lib/ffmpeg-processor");
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
    return await Promise.race([generateThumbnail(file), timeout]);
  } catch {
    return null;
  }
}

const VISIBILITY_CONFIG: Record<VideoVisibility, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  private: { label: "Private", icon: <Lock  size={10} />, color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  team:    { label: "Team",    icon: <Link2 size={10} />, color: "#1a5c2a", bg: "#f0fdf4", border: "#bbf7d0" },
  public:  { label: "Public",  icon: <Globe size={10} />, color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({
  video,
  token,
  onDelete,
  onPosted,
  onVisibilityChange,
}: {
  video: MatchVideo;
  token: string | null;
  onDelete: (id: string) => void;
  onPosted: (id: string, arenaPostId: string) => void;
  onVisibilityChange: (id: string, v: VideoVisibility) => void;
}) {
  const [playing,          setPlaying]          = useState(false);
  const [posting,          setPosting]          = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  const watchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/watch/${video.id}`
    : `/watch/${video.id}`;

  async function handlePostToArena() {
    setPosting(true);
    try {
      const dateStr = formatDate(video.match_date);
      const parts = [
        `Match Video: ${video.title}`,
        video.opponent   ? `vs ${video.opponent}`   : null,
        video.competition ?? null,
        dateStr,
        "Watch the full match — link in the comments.",
      ].filter(Boolean);

      const res = await fetch(`${API}/arena/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          body: parts.join(" · "),
          post_type: "standard",
          visibility: "public",
          video_url: video.video_url,
          metadata: {
            match_video_id: video.id,
            watch_url: watchUrl,
            opponent: video.opponent,
            competition: video.competition,
          },
        }),
      });
      const d = await res.json();
      const arenaPostId: string | null = d?.data?.id ?? d?.id ?? null;
      if (arenaPostId) {
        await fetch(`${API}/coach/match-videos/${video.id}/arena`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ arena_post_id: arenaPostId }),
        }).catch(() => {});
        onPosted(video.id, arenaPostId);
      }
    } catch { /* silent */ } finally {
      setPosting(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this match video? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`${API}/coach/match-videos/${video.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token ?? ""}` },
    }).catch(() => {});
    onDelete(video.id);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(watchUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  }

  async function handleVisibilityChange(v: VideoVisibility) {
    if (v === video.visibility || savingVisibility) return;
    setSavingVisibility(true);
    try {
      await fetch(`${API}/coach/match-videos/${video.id}/visibility`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: v }),
      });
      onVisibilityChange(video.id, v);
    } catch { /* silent — optimistic update skipped on error */ } finally {
      setSavingVisibility(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-start gap-3 p-4">
        <div
          className="flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden"
          style={{ width: 40, height: 40, background: video.thumbnail_url ? undefined : "#f0fdf4" }}
        >
          {video.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={video.thumbnail_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Film size={18} color="#1a5c2a" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{video.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(video.match_date)}
            {video.opponent    ? ` · vs ${video.opponent}`    : ""}
            {video.competition ? ` · ${video.competition}`    : ""}
            {video.duration_seconds ? ` · ${formatDuration(video.duration_seconds)}` : ""}
          </p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye size={11} /> {video.view_count} view{video.view_count !== 1 ? "s" : ""}
            </span>
            {video.arena_post_id && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: "#7c3aed", background: "#f3e8ff" }}
              >
                On Arena
              </span>
            )}
            {/* Visibility selector */}
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 ml-auto">
              {(["private", "team", "public"] as VideoVisibility[]).map((v) => {
                const cfg = VISIBILITY_CONFIG[v];
                const active = video.visibility === v;
                return (
                  <button
                    key={v}
                    onClick={() => handleVisibilityChange(v)}
                    disabled={savingVisibility}
                    title={cfg.label}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-60"
                    style={{
                      background: active ? cfg.bg : "transparent",
                      color:      active ? cfg.color : "#9ca3af",
                      borderRight: v !== "public" ? "1px solid #e5e7eb" : undefined,
                    }}
                  >
                    {savingVisibility && active
                      ? <Loader2 size={9} className="animate-spin" />
                      : cfg.icon
                    }
                    {active && <span>{cfg.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete"
          className="flex-shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>

      {/* Inline player */}
      {playing && video.video_url && (
        <div className="px-4 pb-3">
          <video
            controls
            autoPlay
            src={video.video_url}
            className="w-full rounded-lg"
            style={{ backgroundColor: "#000", maxHeight: 400 }}
          />
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
        {/* Play/close */}
        {video.video_url ? (
          <button
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
            style={{ background: playing ? "#1a3d26" : "#1a5c2a" }}
          >
            {playing
              ? <><ChevronUp size={11} /> Close</>
              : <><Play size={11} className="fill-white" /> Play</>
            }
          </button>
        ) : (
          <span className="text-xs text-gray-400 italic">No video file</span>
        )}

        {/* Post to Arena */}
        {video.arena_post_id ? (
          <Link
            href="/arena"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={{ color: "#1a5c2a", background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <Check size={11} /> On Arena
          </Link>
        ) : (
          <button
            onClick={handlePostToArena}
            disabled={posting}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {posting
              ? <><Loader2 size={11} className="animate-spin" /> Posting…</>
              : <><Share2 size={11} /> Post to Arena</>
            }
          </button>
        )}

        {/* Copy watch link */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            borderColor: copied ? "#bbf7d0" : "#e5e7eb",
            background:  copied ? "#f0fdf4" : "#fff",
            color:       copied ? "#1a5c2a" : "#374151",
          }}
        >
          {copied ? <><Check size={11} /> Copied!</> : <><LinkIcon size={11} /> Copy Link</>}
        </button>

        {/* Download */}
        {video.video_url && (
          <a
            href={video.video_url}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50"
          >
            <Download size={11} /> Download
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Upload Form ──────────────────────────────────────────────────────────────

function UploadForm({ onUploaded }: { onUploaded: (v: MatchVideo) => void }) {
  const token = useAuthStore((s) => s.token);

  const [open,        setOpen]        = useState(false);
  const [title,       setTitle]       = useState("");
  const [matchDate,   setMatchDate]   = useState("");
  const [opponent,    setOpponent]    = useState("");
  const [competition, setCompetition] = useState("");
  const [file,        setFile]        = useState<File | null>(null);
  const [visibility,  setVisibility]  = useState<VideoVisibility>("team");
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [error,       setError]       = useState("");
  const [thumbState,  setThumbState]  = useState<ThumbState>("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !matchDate) {
      setError("Title and match date are required.");
      return;
    }
    setError("");
    setUploading(true);
    setProgress(0);
    setThumbState("idle");

    try {
      let videoUrl = "";
      let r2Key    = "";

      // Start thumbnail pipeline IN PARALLEL with the video upload — never blocks upload start
      let thumbnailUrlPromise: Promise<string | null> = Promise.resolve(null);
      if (file) {
        setThumbState("generating");
        thumbnailUrlPromise = (async () => {
          const blob = await generateThumbnailSafe(file);
          if (!blob) { setThumbState("skipped"); return null; }
          setThumbState("ready");
          try {
            const pr = await fetch("/api/upload/presigned", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: "thumbnail.jpg", contentType: "image/jpeg", source: "match_thumbnails" }),
            });
            const { uploadUrl: tUrl, publicUrl: tPublic } = await pr.json();
            if (tUrl) {
              await fetch(tUrl, { method: "PUT", body: blob, headers: { "Content-Type": "image/jpeg" } });
              return tPublic as string;
            }
          } catch { /* silent — thumbnail failure never blocks the main upload */ }
          return null;
        })();
      }

      // Upload video file to R2 (runs in parallel with thumbnailUrlPromise above)
      if (file) {
        const presignRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type || "video/mp4",
            source: "match_videos",
          }),
        });
        if (!presignRes.ok) throw new Error("Could not get upload URL. Please try again.");
        const { uploadUrl, publicUrl, key } = await presignRes.json();

        if (uploadUrl) {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", (ev) => {
              if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
            });
            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) resolve();
              else reject(new Error(`Upload failed (${xhr.status})`));
            });
            xhr.addEventListener("error", () => reject(new Error("Network error during upload.")));
            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
            xhr.send(file);
          });
          videoUrl = publicUrl ?? "";
          r2Key    = key ?? "";
        }
      }

      // Give thumbnail up to 5 extra seconds after the video upload completes
      const thumbnailUrl = await Promise.race([
        thumbnailUrlPromise,
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5_000)),
      ]);

      // Save record via Laravel
      const freshToken = useAuthStore.getState().token;
      if (!freshToken) throw new Error("Session expired — please log in again.");

      const saveRes = await fetch(`${API}/coach/match-videos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${freshToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title,
          match_date: matchDate,
          opponent:    opponent    || null,
          competition: competition || null,
          video_url:     videoUrl     || null,
          thumbnail_url: thumbnailUrl || null,
          r2_key:        r2Key        || null,
          duration_seconds: null,
          visibility,
        }),
      });

      if (!saveRes.ok) {
        const status = saveRes.status;
        if (status === 401) throw new Error("Session expired — please refresh and log in.");
        if (status === 422) throw new Error("Validation error — check your entries.");
        if (status === 500) throw new Error("Server error — please try again in a moment.");
        if (status === 502 || status === 503 || status === 504)
          throw new Error("Server is waking up — wait 30 s and try again.");
        throw new Error("Save failed — please try again.");
      }

      const saved = await saveRes.json();
      if (saved.data) {
        onUploaded(saved.data as MatchVideo);
        setTitle(""); setMatchDate(""); setOpponent(""); setCompetition("");
        setFile(null);
        setVisibility("team");
        setThumbState("idle");
        if (fileRef.current) fileRef.current.value = "";
        setOpen(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white mb-5"
        style={{ background: "#1a5c2a" }}
      >
        <Plus size={15} /> Add Match Video
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 mb-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Upload Match Video</p>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(""); }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Match Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. vs St George — NASH Cup QF"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Match Date *</label>
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Opponent</label>
          <input
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="e.g. Harare Lions FC"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Competition</label>
          <input
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            placeholder="e.g. NASH Cup 2026"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
      </div>

      {/* Visibility picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Who can see this video?</label>
        <div className="flex items-center gap-0 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 w-fit">
          {(["private", "team", "public"] as VideoVisibility[]).map((v) => {
            const cfg = VISIBILITY_CONFIG[v];
            const active = visibility === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors"
                style={{
                  background: active ? cfg.bg : "transparent",
                  color:      active ? cfg.color : "#9ca3af",
                  borderRight: v !== "public" ? "1px solid #e5e7eb" : undefined,
                }}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {visibility === "private" && "Only you can see this video."}
          {visibility === "team"    && "Anyone with the link can watch (share with parents)."}
          {visibility === "public"  && "Visible in public discovery feeds."}
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          Video File <span className="font-normal text-gray-400">(optional — add later if needed)</span>
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/quicktime,video/avi,video/webm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm w-full"
        />
        <p className="text-xs text-gray-400 mt-1">MP4, MOV, AVI or WebM — max 2 GB</p>
      </div>

      {uploading && (
        <div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "#1a5c2a" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Uploading… {progress}%</p>
          {thumbState !== "idle" && (
            <p className="text-xs mt-1" style={{
              color: thumbState === "ready" ? "#1a5c2a" : "#9ca3af",
            }}>
              {thumbState === "generating" && "Generating thumbnail (optional)…"}
              {thumbState === "ready"      && "✓ Thumbnail ready"}
              {thumbState === "skipped"    && "Thumbnail skipped — will use default icon"}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => { setOpen(false); setError(""); }}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={uploading || !title || !matchDate}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "#1a5c2a" }}
        >
          {uploading
            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
            : <><Upload size={14} /> {file ? "Upload & Save" : "Save Record"}</>
          }
        </button>
      </div>
    </form>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-100 rounded w-3/5" />
          <div className="h-3 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-2/5" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        {[60, 90, 75].map((w, i) => (
          <div key={i} className="h-7 bg-gray-100 rounded-lg" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CoachMatchVideosPage() {
  const token = useAuthStore((s) => s.token);

  const [videos,  setVideos]  = useState<MatchVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/coach/match-videos`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((d) => setVideos(Array.isArray(d.data) ? d.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function handleUploaded(v: MatchVideo) {
    setVideos((prev) => [v, ...prev]);
  }

  function handleDeleted(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  function handlePosted(id: string, arenaPostId: string) {
    setVideos((prev) => prev.map((v) => v.id === id ? { ...v, arena_post_id: arenaPostId } : v));
  }

  function handleVisibilityChange(id: string, visibility: VideoVisibility) {
    setVideos((prev) => prev.map((v) => v.id === id ? { ...v, visibility } : v));
  }

  return (
    <div className="flex h-screen" style={{ background: "#f4f2ee" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3.5 border-b border-gray-200"
          style={{ background: "#fff" }}
        >
          <Link href="/coach" className="text-gray-400 hover:text-gray-700 mr-1">
            <ArrowLeft size={18} />
          </Link>
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 34, height: 34, background: "#1a5c2a" }}
          >
            <Film size={16} color="#c8962a" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Match Videos</p>
            <p className="text-xs text-gray-500">
              {loading ? "Loading…" : `${videos.length} video${videos.length !== 1 ? "s" : ""} stored`}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-5">

          {/* How it works banner */}
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-xs text-amber-800 space-y-1"
          >
            <p className="font-bold">How this works</p>
            <p>
              Upload any match video. Share a watch link with parents and players — they can view without signing up.
              Post to The Arena to let the wider community see the match.
            </p>
          </div>

          {/* Upload form */}
          <UploadForm onUploaded={handleUploaded} />

          {/* Video list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="mx-auto flex items-center justify-center rounded-full mb-4"
                style={{ width: 56, height: 56, background: "#f0fdf4" }}
              >
                <Film size={26} color="#1a5c2a" />
              </div>
              <p className="font-bold text-gray-700 text-sm">No match videos yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                Upload your first match video and share the watch link with players and parents.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {videos.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  token={token}
                  onDelete={handleDeleted}
                  onPosted={handlePosted}
                  onVisibilityChange={handleVisibilityChange}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
