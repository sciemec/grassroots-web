"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronUp, ChevronDown, Trash2, Star, Upload, Film, Youtube, X, Plus,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";
const MAX_ITEMS = 12;

interface MediaItem {
  id: string;
  type: "photo" | "video";
  source: "arena" | "upload" | "youtube";
  arena_post_id: string | null;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  consent_ok: boolean;
}

interface ArenaPost {
  id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
}

interface Props {
  caseId: string;
  token: string | null;
}

export default function MediaManager({ caseId, token }: Props) {
  const [items,         setItems]         = useState<MediaItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [addMode,       setAddMode]       = useState<"photo" | "arena" | "youtube" | null>(null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);

  // Photo upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoCaption, setPhotoCaption] = useState("");

  // Arena picker
  const [arenaPosts,  setArenaPosts]  = useState<ArenaPost[]>([]);
  const [arenaLoading, setArenaLoading] = useState(false);
  const [arenaCaption, setArenaCaption] = useState("");

  // YouTube
  const [ytUrl,     setYtUrl]     = useState("");
  const [ytCaption, setYtCaption] = useState("");

  // Caption inline edit
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [editingCaption,setEditingCaption] = useState("");

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  // ── Load media ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${BASE}/sponsorships/${caseId}/media`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.data) setItems(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, token]);

  const notify = (msg: string, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  // ── Reorder (up / down arrow) ─────────────────────────────────────────────

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newItems = [...items];
    const target   = index + direction;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setItems(newItems);

    const ids = newItems.map((i) => i.id);
    await fetch(`${BASE}/sponsorships/${caseId}/media/reorder`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  };

  // ── Set cover ──────────────────────────────────────────────────────────────

  const setCover = async (mediaId: string) => {
    setSaving(true);
    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/${mediaId}/cover`, {
      method: "PATCH",
      headers,
    });
    if (r.ok) {
      setItems((prev) => prev.map((i) => ({ ...i, is_cover: i.id === mediaId })));
      notify("Cover photo updated.");
    }
    setSaving(false);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const deleteItem = async (mediaId: string) => {
    if (!confirm("Remove this item from the gallery?")) return;
    setSaving(true);
    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/${mediaId}`, {
      method: "DELETE",
      headers,
    });
    if (r.ok) {
      setItems((prev) => prev.filter((i) => i.id !== mediaId));
      notify("Item removed.");
    } else {
      notify("Could not delete. Try again.", true);
    }
    setSaving(false);
  };

  // ── Save caption inline ────────────────────────────────────────────────────

  const saveCaption = async (mediaId: string) => {
    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/${mediaId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ caption: editingCaption || null }),
    });
    if (r.ok) {
      setItems((prev) =>
        prev.map((i) => (i.id === mediaId ? { ...i, caption: editingCaption || null } : i))
      );
    }
    setEditingId(null);
  };

  // ── Upload photo ──────────────────────────────────────────────────────────

  const uploadPhoto = async (file: File) => {
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);
    if (photoCaption.trim()) fd.append("caption", photoCaption.trim());

    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: fd,
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.data) {
      setItems((prev) => [...prev, j.data]);
      setAddMode(null);
      setPhotoCaption("");
      notify("Photo added.");
    } else {
      notify((j as { message?: string }).message ?? "Upload failed.", true);
    }
    setSaving(false);
  };

  // ── Add Arena video ───────────────────────────────────────────────────────

  const loadArenaPicker = async () => {
    setArenaLoading(true);
    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/arena-picker`, { headers });
    const j = await r.json().catch(() => ({}));
    if (j.data) setArenaPosts(j.data);
    setArenaLoading(false);
  };

  const addArena = async (postId: string) => {
    setSaving(true);
    const body: Record<string, string> = { arena_post_id: postId };
    if (arenaCaption.trim()) body.caption = arenaCaption.trim();
    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/arena`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.data) {
      setItems((prev) => [...prev, j.data]);
      setAddMode(null);
      setArenaCaption("");
      notify("Video added.");
    } else {
      notify((j as { message?: string }).message ?? "Could not add video.", true);
    }
    setSaving(false);
  };

  // ── Add YouTube link ──────────────────────────────────────────────────────

  const addYoutube = async () => {
    if (!ytUrl.trim()) return;
    setSaving(true);
    const body: Record<string, string> = { url: ytUrl.trim() };
    if (ytCaption.trim()) body.caption = ytCaption.trim();
    const r = await fetch(`${BASE}/sponsorships/${caseId}/media/youtube`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.data) {
      setItems((prev) => [...prev, j.data]);
      setAddMode(null);
      setYtUrl("");
      setYtCaption("");
      notify("YouTube video added.");
    } else {
      notify((j as { message?: string }).message ?? "Invalid URL.", true);
    }
    setSaving(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-3 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const atCapacity = items.length >= MAX_ITEMS;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-gray-900 text-sm">Media Gallery</h2>
        <span className="text-xs text-gray-400">{items.length}/{MAX_ITEMS}</span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Add photos, Arena videos, or YouTube links. Set one as the cover for the public page.
      </p>

      {/* Notifications */}
      {success && (
        <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-medium text-green-800">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Item list */}
      {items.length > 0 ? (
        <div className="space-y-2 mb-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-xl border p-2 ${
                item.is_cover ? "border-[#1a5c2a] bg-[#1a5c2a]/5" : "border-gray-200"
              }`}
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                {item.thumbnail_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : item.type === "photo" ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Film size={20} />
                  </div>
                )}
                {item.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[7px] border-transparent border-l-white ml-0.5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {item.source === "youtube" ? "YouTube" : item.source === "arena" ? "Arena" : "Photo"}
                  </span>
                  {item.is_cover && (
                    <span className="text-xs font-semibold text-[#1a5c2a] bg-[#1a5c2a]/10 px-1.5 py-0.5 rounded-full">
                      Cover
                    </span>
                  )}
                  {!item.consent_ok && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      Hidden (consent)
                    </span>
                  )}
                </div>
                {/* Caption */}
                {editingId === item.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingCaption}
                      onChange={(e) => setEditingCaption(e.target.value)}
                      maxLength={200}
                      autoFocus
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1a5c2a]/30"
                      onKeyDown={(e) => { if (e.key === "Enter") saveCaption(item.id); if (e.key === "Escape") setEditingId(null); }}
                    />
                    <button onClick={() => saveCaption(item.id)} className="text-xs text-[#1a5c2a] font-medium">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingId(item.id); setEditingCaption(item.caption ?? ""); }}
                    className="text-xs text-gray-400 hover:text-gray-600 truncate block max-w-full text-left"
                  >
                    {item.caption ?? "Add caption…"}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0 || saving}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-25"
                  aria-label="Move up"
                >
                  <ChevronUp size={15} />
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1 || saving}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-25"
                  aria-label="Move down"
                >
                  <ChevronDown size={15} />
                </button>
                {!item.is_cover && (
                  <button
                    onClick={() => setCover(item.id)}
                    disabled={saving}
                    className="p-1 rounded text-gray-400 hover:text-[#c8962a] disabled:opacity-50"
                    title="Set as cover"
                  >
                    <Star size={15} />
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={saving}
                  className="p-1 rounded text-gray-400 hover:text-red-500 disabled:opacity-50"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-gray-400 mb-4">
          No media yet. Add a photo, Arena video, or YouTube link.
        </div>
      )}

      {/* Add controls */}
      {!atCapacity && addMode === null && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAddMode("photo")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:border-[#1a5c2a] hover:text-[#1a5c2a]"
          >
            <Upload size={13} /> Photo
          </button>
          <button
            onClick={() => { setAddMode("arena"); loadArenaPicker(); }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:border-[#1a5c2a] hover:text-[#1a5c2a]"
          >
            <Film size={13} /> Arena Video
          </button>
          <button
            onClick={() => setAddMode("youtube")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:border-[#1a5c2a] hover:text-[#1a5c2a]"
          >
            <Youtube size={13} /> YouTube
          </button>
        </div>
      )}
      {atCapacity && (
        <p className="text-xs text-gray-400 mt-2">Gallery is full (max {MAX_ITEMS} items).</p>
      )}

      {/* ── Add mode panels ──────────────────────────────────────────────── */}

      {addMode === "photo" && (
        <div className="mt-3 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Upload Photo</span>
            <button onClick={() => { setAddMode(null); setPhotoCaption(""); }} className="text-gray-400 hover:text-gray-700"><X size={15} /></button>
          </div>
          <input
            type="text"
            placeholder="Caption (optional)"
            value={photoCaption}
            onChange={(e) => setPhotoCaption(e.target.value)}
            maxLength={200}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPhoto(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={saving}
            className="w-full bg-[#1a5c2a] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#145222] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? "Uploading…" : <><Plus size={15} /> Choose Photo</>}
          </button>
          <p className="text-xs text-gray-400">JPG or PNG. Max 20 MB. EXIF stripped automatically.</p>
        </div>
      )}

      {addMode === "arena" && (
        <div className="mt-3 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Pick Arena Video</span>
            <button onClick={() => { setAddMode(null); setArenaCaption(""); }} className="text-gray-400 hover:text-gray-700"><X size={15} /></button>
          </div>
          <input
            type="text"
            placeholder="Caption (optional)"
            value={arenaCaption}
            onChange={(e) => setArenaCaption(e.target.value)}
            maxLength={200}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          {arenaLoading ? (
            <div className="text-xs text-gray-400 text-center py-4">Loading videos…</div>
          ) : arenaPosts.length === 0 ? (
            <div className="text-xs text-gray-400 text-center py-4">
              No Arena videos found for this player. Post videos in The Arena first.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {arenaPosts.map((p) => {
                const alreadyAdded = items.some((i) => i.arena_post_id === p.id);
                return (
                  <button
                    key={p.id}
                    disabled={saving || alreadyAdded}
                    onClick={() => addArena(p.id)}
                    className={`aspect-square rounded-lg overflow-hidden relative border-2 transition-colors ${
                      alreadyAdded
                        ? "border-green-400 opacity-60 cursor-not-allowed"
                        : "border-transparent hover:border-[#1a5c2a]"
                    }`}
                  >
                    {p.thumbnail_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Film size={18} />
                      </div>
                    )}
                    {alreadyAdded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {addMode === "youtube" && (
        <div className="mt-3 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">YouTube Link</span>
            <button onClick={() => { setAddMode(null); setYtUrl(""); setYtCaption(""); }} className="text-gray-400 hover:text-gray-700"><X size={15} /></button>
          </div>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={ytCaption}
            onChange={(e) => setYtCaption(e.target.value)}
            maxLength={200}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          />
          <button
            onClick={addYoutube}
            disabled={saving || !ytUrl.trim()}
            className="w-full bg-[#1a5c2a] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#145222] disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add Video"}
          </button>
        </div>
      )}
    </div>
  );
}
