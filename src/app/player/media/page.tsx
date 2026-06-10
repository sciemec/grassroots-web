"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Pencil, Check, X, Move, Video, Image as ImageIcon,
  ArrowUp, ArrowDown, Loader2, AlertCircle, Film
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";

const MAX_ITEMS = 10;

const CATEGORIES = [
  "general", "dribbling", "shooting", "passing", "defending",
  "match", "training", "freestyle",
];

interface MediaItem {
  id: string;
  url: string;
  media_type: "video" | "image";
  thumbnail_url: string | null;
  caption: string | null;
  media_category: string;
  display_order: number;
}

interface UploadForm {
  url: string;
  media_type: "video" | "image";
  thumbnail_url: string;
  caption: string;
  media_category: string;
}

const DEFAULT_FORM: UploadForm = {
  url: "",
  media_type: "video",
  thumbnail_url: "",
  caption: "",
  media_category: "general",
};

export default function PlayerMediaPage() {
  const router = useRouter();
  const user    = useAuthStore((s) => s.user);
  const token   = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s._hasHydrated);

  const [items, setItems]       = useState<MediaItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState<UploadForm>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  // Inline edit state
  const [editId, setEditId]       = useState<string | null>(null);
  const [editCaption, setEditCaption]   = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSaving, setEditSaving]     = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reorder saving indicator
  const [reordering, setReordering] = useState(false);
  const reorderTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    fetchItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user]);

  const apiUrl  = process.env.NEXT_PUBLIC_API_URL;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  async function fetchItems() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}/player/media`, { headers });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const raw = json?.data ?? json;
      setItems(Array.isArray(raw) ? raw : []);
    } catch {
      setError("Could not load your media. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url.trim()) { setAddError("URL is required."); return; }
    setSubmitting(true);
    setAddError("");
    try {
      const body: Record<string, string> = {
        url: form.url.trim(),
        media_type: form.media_type,
        media_category: form.media_category,
      };
      if (form.thumbnail_url.trim()) body.thumbnail_url = form.thumbnail_url.trim();
      if (form.caption.trim())       body.caption       = form.caption.trim();

      const res = await fetch(`${apiUrl}/player/media`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (res.status === 422) {
        const j = await res.json();
        setAddError(j.message ?? "Maximum 10 items reached.");
        return;
      }
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      const newItem = json?.data ?? json;
      setItems(prev => [...prev, newItem]);
      setForm(DEFAULT_FORM);
      setShowAdd(false);
    } catch {
      setAddError("Failed to add media. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this media item?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${apiUrl}/player/media/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.filter(i => i.id !== id));
    } catch {
      alert("Failed to delete. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(item: MediaItem) {
    setEditId(item.id);
    setEditCaption(item.caption ?? "");
    setEditCategory(item.media_category ?? "general");
  }

  async function saveEdit(id: string) {
    setEditSaving(true);
    try {
      const res = await fetch(`${apiUrl}/player/media/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ caption: editCaption || null, media_category: editCategory }),
      });
      if (!res.ok) throw new Error();
      setItems(prev => prev.map(i =>
        i.id === id ? { ...i, caption: editCaption || null, media_category: editCategory } : i
      ));
      setEditId(null);
    } catch {
      alert("Failed to save changes.");
    } finally {
      setEditSaving(false);
    }
  }

  function moveItem(index: number, direction: "up" | "down") {
    const newItems = [...items];
    const swap = direction === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= newItems.length) return;
    [newItems[index], newItems[swap]] = [newItems[swap], newItems[index]];
    setItems(newItems);
    // Debounce the reorder API call
    if (reorderTimeout.current) clearTimeout(reorderTimeout.current);
    setReordering(true);
    reorderTimeout.current = setTimeout(() => persistReorder(newItems), 800);
  }

  async function persistReorder(ordered: MediaItem[]) {
    try {
      await fetch(`${apiUrl}/player/media/reorder`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ ordered_ids: ordered.map(i => i.id) }),
      });
    } catch {
      // silently fail — user can refresh
    } finally {
      setReordering(false);
    }
  }

  if (!hydrated || !user) return null;

  const slotsFull = items.length >= MAX_ITEMS;

  return (
    <div className="min-h-screen" style={{ background: "#1a5c2a" }}>
      <div className="mx-auto max-w-lg px-4 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-1 text-xs text-[#f0b429]/40 hover:text-[#f0b429]/70"
            >
              ← Back
            </button>
            <h1 className="text-xl font-extrabold text-[#f0b429]">My Media Gallery</h1>
            <p className="text-xs text-[#f0b429]/50">
              {items.length}/{MAX_ITEMS} items · Videos &amp; images for your public profile
            </p>
          </div>
          {reordering && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#f0b429]/10 px-3 py-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-[#f0b429]/50" />
              <span className="text-[10px] text-[#f0b429]/50">Saving order…</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-24 animate-pulse rounded-2xl bg-[#f0b429]/5" />
            ))}
          </div>
        ) : (
          <>
            {/* Items list */}
            {items.length === 0 ? (
              <div className="rounded-2xl border border-[#f0b429]/15 bg-[#f0b429]/5 py-14 text-center">
                <Film className="mx-auto mb-3 h-10 w-10 text-[#f0b429]/20" />
                <p className="font-medium text-[#f0b429]/60">No media yet</p>
                <p className="mt-1 text-sm text-[#f0b429]/30">Add videos or images to your showcase</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#f0b429]/15 bg-[#f0b429]/5 overflow-hidden"
                  >
                    <div className="flex items-start gap-3 p-4">
                      {/* Thumbnail or icon */}
                      <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[#f0b429]/10 flex items-center justify-center">
                        {item.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail_url}
                            alt={item.caption ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : item.media_type === "video" ? (
                          <Video className="h-7 w-7 text-[#f0b429]/30" />
                        ) : (
                          <ImageIcon className="h-7 w-7 text-[#f0b429]/30" />
                        )}
                        {/* Type badge */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wide text-[#f0b429]/70">
                            {item.media_type}
                          </span>
                        </div>
                      </div>

                      {/* Info / Edit */}
                      <div className="flex-1 min-w-0">
                        {editId === item.id ? (
                          <div className="space-y-2">
                            <input
                              value={editCaption}
                              onChange={e => setEditCaption(e.target.value)}
                              placeholder="Caption (optional)"
                              className="w-full rounded-lg bg-[#f0b429]/10 px-3 py-1.5 text-sm text-[#f0b429] placeholder-[#f0b429]/30 outline-none border border-[#f0b429]/15 focus:border-[#f0b429]/50"
                            />
                            <select
                              value={editCategory}
                              onChange={e => setEditCategory(e.target.value)}
                              className="w-full rounded-lg bg-[#f0b429]/10 px-3 py-1.5 text-sm text-[#f0b429] outline-none border border-[#f0b429]/15 focus:border-[#f0b429]/50"
                            >
                              {CATEGORIES.map(c => (
                                <option key={c} value={c} className="bg-[#1a5c2a]">{c}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(item.id)}
                                disabled={editSaving}
                                className="flex items-center gap-1 rounded-lg bg-[#f0b429] px-3 py-1 text-xs font-bold text-[#1a3a1a] disabled:opacity-60"
                              >
                                {editSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                Save
                              </button>
                              <button
                                onClick={() => setEditId(null)}
                                className="flex items-center gap-1 rounded-lg bg-[#f0b429]/10 px-3 py-1 text-xs text-[#f0b429]/60"
                              >
                                <X className="h-3 w-3" /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-[#f0b429] truncate">
                              {item.caption || <span className="text-[#f0b429]/30 italic">No caption</span>}
                            </p>
                            <p className="mt-0.5 text-xs text-[#f0b429]/40 capitalize">{item.media_category}</p>
                            <p className="mt-1 text-[10px] text-[#f0b429]/25 break-all line-clamp-1">{item.url}</p>
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      {editId !== item.id && (
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => moveItem(idx, "up")}
                            disabled={idx === 0}
                            className="rounded-lg p-1.5 text-[#f0b429]/40 hover:bg-[#f0b429]/10 hover:text-[#f0b429]/70 disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <Move className="h-3 w-3 text-[#f0b429]/20" />
                          <button
                            onClick={() => moveItem(idx, "down")}
                            disabled={idx === items.length - 1}
                            className="rounded-lg p-1.5 text-[#f0b429]/40 hover:bg-[#f0b429]/10 hover:text-[#f0b429]/70 disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Edit/Delete footer */}
                    {editId !== item.id && (
                      <div className="flex border-t border-[#f0b429]/10">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-[#f0b429]/40 hover:bg-[#f0b429]/5 hover:text-[#f0b429]/70 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <div className="w-px bg-[#f0b429]/5" />
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs text-red-400/60 hover:bg-red-500/5 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {deletingId === item.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Trash2 className="h-3 w-3" />
                          }
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add item form / button */}
            {!slotsFull && (
              <div className="mt-4">
                {!showAdd ? (
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#f0b429]/30 py-4 text-sm font-medium text-[#f0b429]/70 hover:border-[#f0b429]/60 hover:text-[#f0b429] transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Add Media Item ({MAX_ITEMS - items.length} slots left)
                  </button>
                ) : (
                  <div className="rounded-2xl border border-[#f0b429]/15 bg-[#f0b429]/5 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-bold text-[#f0b429]">Add New Media</h3>
                      <button onClick={() => { setShowAdd(false); setAddError(""); setForm(DEFAULT_FORM); }}
                        className="text-xs text-[#f0b429]/40 hover:text-[#f0b429]/70">
                        Cancel
                      </button>
                    </div>

                    {addError && (
                      <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        <p className="text-xs text-red-300">{addError}</p>
                      </div>
                    )}

                    <form onSubmit={handleAdd} className="space-y-3">
                      {/* Media type */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#f0b429]/60">Type</label>
                        <div className="flex gap-2">
                          {(["video", "image"] as const).map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, media_type: t }))}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                form.media_type === t
                                  ? "bg-[#f0b429] text-[#1a3a1a]"
                                  : "bg-[#f0b429]/10 text-[#f0b429]/60 hover:bg-[#f0b429]/20"
                              }`}
                            >
                              {t === "video" ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* URL */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#f0b429]/60">
                          Media URL <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="url"
                          value={form.url}
                          onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                          placeholder="https://..."
                          className="w-full rounded-xl bg-[#f0b429]/10 px-4 py-2.5 text-sm text-[#f0b429] placeholder-[#f0b429]/30 outline-none border border-[#f0b429]/15 focus:border-[#f0b429]/50"
                          required
                        />
                      </div>

                      {/* Thumbnail URL */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#f0b429]/60">
                          Thumbnail URL <span className="text-[#f0b429]/30">(optional)</span>
                        </label>
                        <input
                          type="url"
                          value={form.thumbnail_url}
                          onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                          placeholder="https://... (JPEG thumbnail)"
                          className="w-full rounded-xl bg-[#f0b429]/10 px-4 py-2.5 text-sm text-[#f0b429] placeholder-[#f0b429]/30 outline-none border border-[#f0b429]/15 focus:border-[#f0b429]/50"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#f0b429]/60">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, media_category: c }))}
                              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                                form.media_category === c
                                  ? "bg-[#f0b429] text-[#1a3a1a]"
                                  : "bg-[#f0b429]/10 text-[#f0b429]/50 hover:bg-[#f0b429]/20"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-[#f0b429]/60">
                          Caption <span className="text-[#f0b429]/30">(optional, max 200 chars)</span>
                        </label>
                        <input
                          type="text"
                          value={form.caption}
                          onChange={e => setForm(f => ({ ...f, caption: e.target.value.slice(0, 200) }))}
                          placeholder="e.g. Training session — shooting drills"
                          className="w-full rounded-xl bg-[#f0b429]/10 px-4 py-2.5 text-sm text-[#f0b429] placeholder-[#f0b429]/30 outline-none border border-[#f0b429]/15 focus:border-[#f0b429]/50"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || !form.url.trim()}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] disabled:opacity-50"
                      >
                        {submitting
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding…</>
                          : <><Plus className="h-4 w-4" /> Add to Gallery</>
                        }
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {slotsFull && (
              <p className="mt-4 text-center text-xs text-[#f0b429]/40">
                Gallery full ({MAX_ITEMS}/{MAX_ITEMS}). Delete an item to add more.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
