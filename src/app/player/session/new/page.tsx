"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

interface SessionFormData {
  focusArea: string;
  duration: number;
  feeling: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const token  = useAuthStore((s) => s.token);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [form, setForm] = useState<SessionFormData>({ focusArea: "", duration: 60, feeling: "good" });
  const [saving, setSaving] = useState(false);

  const handleSaveSession = async (formData: SessionFormData) => {
    setSaving(true);
    let videoUrl: string | null = null;

    if (videoFile) {
      const presignedRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ filename: videoFile.name, contentType: videoFile.type, folder: "training" }),
      });
      const { uploadUrl, publicUrl } = await presignedRes.json() as { uploadUrl: string; publicUrl: string };
      await fetch(uploadUrl, { method: "PUT", body: videoFile, headers: { "Content-Type": videoFile.type } });
      videoUrl = publicUrl;
    }

    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/training/sessions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ focus_area: formData.focusArea, duration: formData.duration, feeling: formData.feeling, video_url: videoUrl }),
    });

    if (sessionRes.ok) {
      const arenaBody = `Completed a ${formData.focusArea} training session!${formData.feeling === "amazing" ? " Feeling amazing!" : ""}`;
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: arenaBody, video_url: videoUrl, post_type: "session_milestone", metadata: { focus_area: formData.focusArea, duration: formData.duration, feeling: formData.feeling } }),
      }).catch(() => {});
      router.push("/player/training");
    }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "1.5rem" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ marginBottom: "1rem", background: "none", border: "none", cursor: "pointer", color: "#1a5c2a", fontWeight: 600 }}>
          &larr; Back
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1a5c2a", marginBottom: "1.5rem" }}>Log Training Session</h1>

        <div style={{ background: "#fff", borderRadius: 16, padding: "1.5rem", border: "1px solid #e5e5e5" }}>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Focus Area</span>
            <input
              type="text"
              value={form.focusArea}
              onChange={(e) => setForm((f) => ({ ...f, focusArea: e.target.value }))}
              placeholder="e.g. Dribbling, Shooting, Fitness"
              style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.95rem" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Duration (minutes)</span>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
              min={5} max={300}
              style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.95rem" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>How did you feel?</span>
            <select
              value={form.feeling}
              onChange={(e) => setForm((f) => ({ ...f, feeling: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 8, fontSize: "0.95rem" }}
            >
              <option value="tough">Tough</option>
              <option value="ok">OK</option>
              <option value="good">Good</option>
              <option value="great">Great</option>
              <option value="amazing">Amazing</option>
            </select>
          </label>

          <label style={{ display: "block", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>Video (optional)</span>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              style={{ display: "block", marginTop: 4, fontSize: "0.875rem" }}
            />
          </label>

          <button
            onClick={() => handleSaveSession(form)}
            disabled={saving || !form.focusArea}
            style={{
              width: "100%", padding: "0.75rem", borderRadius: 10, border: "none", cursor: saving || !form.focusArea ? "not-allowed" : "pointer",
              backgroundColor: saving || !form.focusArea ? "#d1d5db" : "#1a5c2a", color: "#fff", fontWeight: 700, fontSize: "1rem",
            }}
          >
            {saving ? "Saving..." : "Save Session"}
          </button>
        </div>
      </div>
    </div>
  );
}
