"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Film, Upload, X, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

const CATEGORY_LABELS: Record<string, string> = {
  drill:     "Drill",
  match:     "Match",
  skills:    "Skills",
  physical:  "Physical",
  interview: "Interview",
  other:     "Other",
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  drill:     { bg: "#dcfce7", color: "#15803d" },
  match:     { bg: "#dbeafe", color: "#1d4ed8" },
  skills:    { bg: "#f3e8ff", color: "#7e22ce" },
  physical:  { bg: "#ffedd5", color: "#c2410c" },
  interview: { bg: "#fef9c3", color: "#854d0e" },
  other:     { bg: "#f1f5f9", color: "#475569" },
};

interface ReelClip {
  id: string;
  r2_url: string;
  thumbnail_url?: string;
  title: string;
  category: string;
  created_at: string;
}

export default function ScholarshipReelPage() {
  const router      = useRouter();
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [clips,       setClips]       = useState<ReelClip[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  // Form state
  const [title,        setTitle]        = useState("");
  const [category,     setCategory]     = useState("drill");
  const [videoUrl,     setVideoUrl]     = useState("");
  const [thumbUrl,     setThumbUrl]     = useState("");
  const [uploadMode,   setUploadMode]   = useState<"url" | "file">("url");
  const [uploadPct,    setUploadPct]    = useState(0);
  const [uploading,    setUploading]    = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState("");
  const [deleteId,     setDeleteId]     = useState<string | null>(null);
  const [toast,        setToast]        = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) router.replace("/login");
  }, [hasHydrated, user, router]);

  // Load clips
  useEffect(() => {
    if (!hasHydrated || !user || !token) return;
    fetch(`${API}/player/scholarship-reel/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        const arr = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
        setClips(arr);
      })
      .catch(() => setClips([]))
      .finally(() => setLoading(false));
  }, [hasHydrated, user, token]);

  if (!hasHydrated || !user) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Upload file to R2 via presigned URL
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadPct(0);
    setFormError("");
    try {
      const ext = file.name.split(".").pop() ?? "mp4";
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: `reel-${Date.now()}.${ext}`, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Could not get upload URL");
      const { uploadUrl, publicUrl } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload  = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setVideoUrl(publicUrl ?? "");
      setUploadPct(100);
    } catch (err: any) {
      setFormError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Save clip to backend
  const handleSave = async () => {
    if (!title.trim()) { setFormError("Title is required"); return; }
    if (!videoUrl.trim()) { setFormError("Video URL is required — upload a file or paste a URL"); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch(`${API}/player/scholarship-reel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          r2_url:        videoUrl.trim(),
          thumbnail_url: thumbUrl.trim() || undefined,
          title:         title.trim(),
          category,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Failed to save clip");
        return;
      }
      setClips((prev) => [...prev, json.data]);
      setTitle(""); setCategory("drill"); setVideoUrl(""); setThumbUrl("");
      setUploadPct(0); setShowForm(false);
      showToast("Clip added to your Scholarship Reel");
    } catch {
      setFormError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  // Delete clip
  const handleDelete = async (clipId: string) => {
    setDeleteId(clipId);
    try {
      const res = await fetch(`${API}/player/scholarship-reel/${clipId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setClips((prev) => prev.filter((c) => c.id !== clipId));
        showToast("Clip removed");
      }
    } catch {
      /* silently ignore */
    } finally {
      setDeleteId(null);
    }
  };

  const isFull = clips.length >= 10;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f2ee", fontFamily: "var(--font-sans, system-ui)" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#1a5c2a", color: "#fff", padding: "10px 20px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, zIndex: 100, display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          <CheckCircle size={15} /> {toast}
        </div>
      )}

      {/* Nav */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/player/pathway" style={{ color: "#1a5c2a", display: "flex", alignItems: "center" }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Scholarship Reel</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {clips.length}/10 clips · shown on your Talent Passport
          </div>
        </div>
        {!isFull && (
          <button
            onClick={() => { setShowForm(true); setFormError(""); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Add Clip
          </button>
        )}
      </div>

      <div style={{ padding: "16px", maxWidth: 640, margin: "0 auto" }}>

        {/* Full warning */}
        {isFull && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
            Your reel is full (10/10). Remove a clip to add a new one.
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div style={{ background: "#fff", borderRadius: 12, padding: "18px 16px", marginBottom: 16, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Add a clip</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                <X size={18} />
              </button>
            </div>

            {/* Title */}
            <label style={{ display: "block", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Title *</div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. U17 Provincial Match – Sprint Goal"
                maxLength={150}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </label>

            {/* Category */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
                  const col = CATEGORY_COLORS[key];
                  const active = category === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      style={{
                        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer",
                        border: active ? "none" : "1px solid #d1d5db",
                        background: active ? col.bg : "#fff",
                        color: active ? col.color : "#6b7280",
                      }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video source toggle */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Video</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {(["url", "file"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => { setUploadMode(mode); setVideoUrl(""); setUploadPct(0); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: "pointer",
                      border: uploadMode === mode ? "1.5px solid #1a5c2a" : "1px solid #d1d5db",
                      background: uploadMode === mode ? "#f0fdf4" : "#fff",
                      color: uploadMode === mode ? "#1a5c2a" : "#6b7280",
                    }}>
                    {mode === "url" ? "Paste URL" : "Upload File"}
                  </button>
                ))}
              </div>

              {uploadMode === "url" ? (
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://... (R2, YouTube, or any video URL)"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                />
              ) : (
                <div>
                  <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  {!videoUrl ? (
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      style={{ width: "100%", padding: "20px", border: "2px dashed #d1d5db", borderRadius: 10, background: "#fafafa", cursor: uploading ? "not-allowed" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      {uploading ? (
                        <>
                          <div style={{ width: "100%", height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                            <div style={{ height: "100%", width: `${uploadPct}%`, background: "#1a5c2a", borderRadius: 3, transition: "width 0.2s" }} />
                          </div>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>Uploading… {uploadPct}%</span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} color="#9ca3af" />
                          <span style={{ fontSize: 12, color: "#6b7280" }}>Tap to select video (mp4, mov)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
                      <CheckCircle size={15} color="#16a34a" />
                      <span style={{ fontSize: 12, color: "#166534", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Uploaded
                      </span>
                      <button onClick={() => setVideoUrl("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280" }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail URL (optional) */}
            <label style={{ display: "block", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Thumbnail URL <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></div>
              <input
                value={thumbUrl}
                onChange={(e) => setThumbUrl(e.target.value)}
                placeholder="https://... image for preview"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </label>

            {formError && (
              <div style={{ fontSize: 12, color: "#b91c1c", background: "#fef2f2", padding: "8px 12px", borderRadius: 8, marginBottom: 12 }}>
                {formError}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving || uploading}
              style={{
                width: "100%", padding: "12px", borderRadius: 10, background: saving ? "#9ca3af" : "#1a5c2a",
                color: "#fff", border: "none", fontWeight: 700, fontSize: 14,
                cursor: saving || uploading ? "not-allowed" : "pointer",
              }}>
              {saving ? "Saving…" : "Add to Reel"}
            </button>
          </div>
        )}

        {/* Clips list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 80, background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        ) : clips.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: 56, height: 56, background: "#e5e7eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Film size={24} color="#9ca3af" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>No clips yet</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
              Add up to 10 video clips that showcase your talent to scouts and scholarship programs.
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: "10px 24px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              Add your first clip
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clips.map((clip) => {
              const col = CATEGORY_COLORS[clip.category] ?? CATEGORY_COLORS.other;
              const isPlaying = activeVideo === clip.id;
              return (
                <div key={clip.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
                    {/* Thumbnail or placeholder */}
                    <div
                      onClick={() => setActiveVideo(isPlaying ? null : clip.id)}
                      style={{
                        width: 72, height: 52, borderRadius: 8, flexShrink: 0, cursor: "pointer",
                        background: clip.thumbnail_url ? "transparent" : "#f0fdf4",
                        border: "1px solid #e5e7eb", overflow: "hidden",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative",
                      }}>
                      {clip.thumbnail_url ? (
                        <img src={clip.thumbnail_url} alt={clip.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <Film size={22} color="#1a5c2a" />
                      )}
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 0, height: 0, borderStyle: "solid", borderWidth: "5px 0 5px 9px", borderColor: "transparent transparent transparent #1a5c2a", marginLeft: 2 }} />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {clip.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 12, background: col.bg, color: col.color }}>
                          {CATEGORY_LABELS[clip.category] ?? clip.category}
                        </span>
                        <span style={{ fontSize: 11, color: "#9ca3af" }}>
                          {new Date(clip.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(clip.id)}
                      disabled={deleteId === clip.id}
                      style={{ background: "none", border: "none", cursor: deleteId === clip.id ? "not-allowed" : "pointer", color: "#9ca3af", padding: 4, flexShrink: 0 }}
                      title="Remove clip">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Inline video player */}
                  {isPlaying && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <video
                        src={clip.r2_url}
                        controls
                        playsInline
                        autoPlay
                        style={{ width: "100%", borderRadius: 8, maxHeight: 260, background: "#000" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {clips.length > 0 && (
          <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 12, color: "#166534", fontWeight: 600, marginBottom: 3 }}>
              Scouts can view your reel
            </div>
            <div style={{ fontSize: 12, color: "#4b7c5a" }}>
              These clips appear on your public Talent Passport and are visible to coaches, scouts, and scholarship programs without login.
            </div>
            <Link href="/player/passport" style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600, color: "#1a5c2a", textDecoration: "none" }}>
              View Talent Passport →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
