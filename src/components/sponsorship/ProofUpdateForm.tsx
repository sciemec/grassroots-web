"use client";

// Owner form to post an items-received proof update (body + optional photo URLs).

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface NeedItem {
  id: string;
  item: string;
  total_cents: number;
}

interface ProofUpdate {
  id: string;
  body: string;
  photo_urls: string[] | null;
  need_item_id: string | null;
  created_at: string;
}

interface Props {
  caseId: string;
  token: string;
  needItems: NeedItem[];
  onProofAdded: (p: ProofUpdate) => void;
}

export default function ProofUpdateForm({ caseId, token, needItems, onProofAdded }: Props) {
  const [body,          setBody]          = useState("");
  const [needItemId,    setNeedItemId]    = useState("");
  const [photoUrl1,     setPhotoUrl1]     = useState("");
  const [photoUrl2,     setPhotoUrl2]     = useState("");
  const [photoUrl3,     setPhotoUrl3]     = useState("");
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState(false);
  const [showPhotos,    setShowPhotos]    = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!body.trim()) {
      setError("Please describe what was received.");
      return;
    }

    const photoUrls = [photoUrl1, photoUrl2, photoUrl3]
      .map((u) => u.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const res = await fetch(`${BASE}/sponsorships/${caseId}/proof-updates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          body: body.trim(),
          need_item_id: needItemId || undefined,
          photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Could not post proof update.");
        return;
      }

      onProofAdded(json.data);
      setBody("");
      setNeedItemId("");
      setPhotoUrl1("");
      setPhotoUrl2("");
      setPhotoUrl3("");
      setShowPhotos(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900 text-sm">Post a Proof Update</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Share evidence that items or support have been received.
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Proof update posted successfully.
        </div>
      )}

      {/* Body */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">What was received</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. The football boots arrived today. Kit distributed to all 11 players…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
        />
      </div>

      {/* Link to need item */}
      {needItems.length > 0 && (
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">
            Linked to need item <span className="text-gray-400">(optional)</span>
          </label>
          <select
            value={needItemId}
            onChange={(e) => setNeedItemId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
          >
            <option value="">— general proof update —</option>
            {needItems.map((ni) => (
              <option key={ni.id} value={ni.id}>{ni.item}</option>
            ))}
          </select>
        </div>
      )}

      {/* Photo URLs (optional, expandable) */}
      <div>
        <button
          type="button"
          onClick={() => setShowPhotos((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#1a5c2a] hover:underline"
        >
          <Camera size={13} />
          {showPhotos ? "Hide photo URLs" : "Add photo URLs (optional, up to 3)"}
        </button>
        {showPhotos && (
          <div className="mt-2 space-y-2">
            {[photoUrl1, photoUrl2, photoUrl3].map((url, idx) => (
              <input
                key={idx}
                type="url"
                value={url}
                onChange={(e) => {
                  const v = e.target.value;
                  if (idx === 0) setPhotoUrl1(v);
                  else if (idx === 1) setPhotoUrl2(v);
                  else setPhotoUrl3(v);
                }}
                maxLength={2000}
                placeholder={`Photo URL ${idx + 1} — https://…`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a5c2a]/30"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving || !body.trim()}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1a5c2a] hover:bg-[#154a22] disabled:opacity-50 rounded-lg px-4 py-2 transition-colors"
        >
          {saving && <Loader2 size={12} className="animate-spin" />}
          Post proof update
        </button>
      </div>
    </div>
  );
}
