"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, ArrowLeft, Play, Loader2, Activity, ChevronDown, ChevronUp, Video } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/lib/auth-store";
import { postToArena } from "@/lib/arena-poster";
import { PoseCamera } from "@/components/video/pose-camera";
import { useGuestGate } from "@/components/ui/register-modal";
import api from "@/lib/api";

const FOCUS_AREAS = [
  "dribbling", "shooting", "passing", "defending",
  "goalkeeping", "fitness", "heading", "crossing",
  "set-pieces", "tactics", "agility", "strength",
];

// Areas that get the gold accent treatment
const SPECIAL_AREAS = ["shooting", "tactics", "fitness"];

const schema = z.object({
  focus_area: z.string().min(1, "Pick a focus area"),
  session_type: z.enum(["programme", "custom"]),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewSessionPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const { requireAuth } = useGuestGate();
  const [error, setError] = useState("");
  const [poseOpen, setPoseOpen] = useState(false);
  const [poseScore, setPoseScore] = useState<number | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { session_type: "custom", focus_area: "" },
  });

  const sessionType = watch("session_type");
  const focusArea = watch("focus_area");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) return; // guests allowed — form visible, submit requires auth
  }, [_hasHydrated, user, router]);

  const onSubmit = async (data: FormData) => {
    if (!user) { requireAuth("start a session"); return; }
    setError("");
    try {
      // Upload highlight video to R2 if one was selected
      let videoUrl: string | undefined;
      if (videoFile) {
        setVideoUploading(true);
        try {
          const presignRes = await fetch("/api/upload/presigned", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: videoFile.name,
              contentType: videoFile.type,
              source: "training",
            }),
          });
          const { uploadUrl, publicUrl } = await presignRes.json();
          if (uploadUrl) {
            await fetch(uploadUrl, {
              method: "PUT",
              body: videoFile,
              headers: { "Content-Type": videoFile.type },
            });
            videoUrl = publicUrl || undefined;
          }
        } catch { /* non-fatal — session still saves without video */ }
        setVideoUploading(false);
      }

      const payload = poseScore !== null
        ? { ...data, pre_session_pose_score: poseScore, ...(videoUrl ? { video_url: videoUrl } : {}) }
        : { ...data, ...(videoUrl ? { video_url: videoUrl } : {}) };
      const res = await api.post("/sessions", payload);
      const sessionId = res.data?.session?.id ?? res.data?.id ?? res.data?.data?.id;

      // Fire THUTO reflection prompt — fire-and-forget, never blocks navigation
      fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `I just completed a ${data.focus_area} session. Ask me one short reflection question about it.`,
          system_prompt: "You are THUTO, a supportive AI coach. Ask exactly one short, encouraging reflection question after a training session. Max 1 sentence.",
        }),
      })
        .then((r) => r.json())
        .then((json) => {
          const question = json?.response;
          if (question) {
            localStorage.setItem("thuto_preload_message", question);
            const prev = parseInt(localStorage.getItem("thuto_unread_count") ?? "0", 10);
            localStorage.setItem("thuto_unread_count", String(prev + 1));
          }
        })
        .catch(() => {}); // never surface to player

      // Arena: NURTURE pillar — training activity appears in social feed (with video if uploaded)
      postToArena(
        `Completed a ${data.focus_area} training session.`,
        { postType: "session_milestone", metadata: { focus_area: data.focus_area, session_type: data.session_type }, videoUrl }
      );

      if (sessionId) {
        router.push(`/sessions/${sessionId}`);
      } else {
        router.push("/player/sessions");
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to create session. Please try again.");
    }
  };

  if (!_hasHydrated) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Top nav */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/player" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, border: "1px solid #e5e7eb", backgroundColor: "#fff", color: "#374151", textDecoration: "none" }}>
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </Link>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", margin: 0 }}>Start New Session</p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>What are you working on today?</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 48px" }}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Session type */}
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Session Type</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { value: "custom", label: "Free Training", desc: "Choose any drills you want", icon: "🏃" },
                { value: "programme", label: "Programme", desc: "Follow your assigned programme", icon: "📋" },
              ].map(({ value, label, desc, icon }) => (
                <label
                  key={value}
                  style={{
                    cursor: "pointer",
                    borderRadius: 12,
                    border: sessionType === value ? "2px solid #1a5c2a" : "1px solid #e5e7eb",
                    padding: "14px 12px",
                    backgroundColor: sessionType === value ? "#f0f7f2" : "#fff",
                    transition: "all 0.15s",
                  }}
                >
                  <input {...register("session_type")} type="radio" value={value} style={{ display: "none" }} />
                  <p style={{ fontSize: 18, marginBottom: 4 }}>{icon}</p>
                  <p style={{ fontWeight: 700, fontSize: 13, color: sessionType === value ? "#1a5c2a" : "#111827", margin: 0 }}>{label}</p>
                  <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>{desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Focus area */}
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Focus Area</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FOCUS_AREAS.map((area) => {
                const isSelected = focusArea === area;
                const isSpecial = SPECIAL_AREAS.includes(area);
                return (
                  <label
                    key={area}
                    style={{
                      cursor: "pointer",
                      borderRadius: 20,
                      padding: "7px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      textTransform: "capitalize",
                      border: isSelected
                        ? "none"
                        : isSpecial
                          ? "1.5px solid #c8962a"
                          : "1px solid #e5e7eb",
                      backgroundColor: isSelected
                        ? (isSpecial ? "#c8962a" : "#1a5c2a")
                        : isSpecial
                          ? "#fffbeb"
                          : "#f9fafb",
                      color: isSelected ? "#fff" : isSpecial ? "#92400e" : "#374151",
                      transition: "all 0.15s",
                    }}
                  >
                    <input {...register("focus_area")} type="radio" value={area} style={{ display: "none" }} />
                    {area}
                  </label>
                );
              })}
            </div>
            {errors.focus_area && (
              <p style={{ marginTop: 8, fontSize: 12, color: "#dc2626" }}>{errors.focus_area.message}</p>
            )}
          </div>

          {/* Pre-session notes */}
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Session Notes <span style={{ fontWeight: 400, textTransform: "none", fontSize: 12, color: "#9ca3af" }}>(optional)</span>
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>How are you feeling? Any specific goals for today?</p>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="e.g. Feeling strong today, want to work on my weak foot crossing…"
              style={{
                width: "100%",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                backgroundColor: "#f9fafb",
                padding: "10px 12px",
                fontSize: 13,
                color: "#111827",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Session highlight video (optional) */}
          <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 20 }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Session Highlight <span style={{ fontWeight: 400, textTransform: "none", fontSize: 12, color: "#9ca3af" }}>(optional)</span>
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>Upload a clip — it auto-posts to your Arena feed.</p>
            {videoFile ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <Video style={{ width: 16, height: 16, color: "#1a5c2a", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#14532d", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videoFile.name}</span>
                <button type="button" onClick={() => setVideoFile(null)} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>Remove</button>
              </div>
            ) : (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderRadius: 10, border: "1.5px dashed #d1d5db", padding: "12px 14px", backgroundColor: "#f9fafb" }}>
                <Video style={{ width: 18, height: 18, color: "#9ca3af" }} />
                <span style={{ fontSize: 13, color: "#6b7280" }}>Tap to choose a video</span>
                <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) setVideoFile(f); }} />
              </label>
            )}
          </div>

          {error && (
            <div style={{ borderRadius: 12, backgroundColor: "#fef2f2", border: "1px solid #fca5a5", padding: "12px 16px", fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {/* Summary card — shown when focus area picked */}
          {focusArea && (
            <div style={{ borderRadius: 14, border: "1px solid #bbf7d0", backgroundColor: "#f0fdf4", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Dumbbell style={{ width: 20, height: 20, color: "#1a5c2a" }} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#14532d", margin: 0, textTransform: "capitalize" }}>
                  {sessionType === "custom" ? "Free Training" : "Programme"} · {focusArea}
                </p>
                <p style={{ fontSize: 11, color: "#16a34a", margin: "2px 0 0" }}>Ready to go · THUTO AI will analyse your performance</p>
              </div>
            </div>
          )}

          {/* Pose camera — pre-session form check */}
          <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", backgroundColor: "#fff", overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setPoseOpen((v) => !v)}
              style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Activity style={{ width: 16, height: 16, color: "#1a5c2a" }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>Check my form before starting</span>
                {poseScore !== null && (
                  <span style={{
                    borderRadius: 20,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    backgroundColor: poseScore >= 75 ? "#dcfce7" : poseScore >= 50 ? "#fef9c3" : "#fee2e2",
                    color: poseScore >= 75 ? "#14532d" : poseScore >= 50 ? "#92400e" : "#991b1b",
                  }}>
                    {poseScore}%
                  </span>
                )}
              </div>
              {poseOpen
                ? <ChevronUp style={{ width: 16, height: 16, color: "#9ca3af" }} />
                : <ChevronDown style={{ width: 16, height: 16, color: "#9ca3af" }} />
              }
            </button>
            {poseOpen && (
              <div style={{ borderTop: "1px solid #e5e7eb" }}>
                <PoseCamera
                  focusArea={focusArea || undefined}
                  onScore={(score) => setPoseScore(score)}
                />
              </div>
            )}
          </div>

          {/* Start button */}
          <button
            type="submit"
            disabled={isSubmitting || videoUploading || !focusArea}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 14,
              border: "none",
              backgroundColor: focusArea ? "#1a5c2a" : "#d1d5db",
              color: "#fff",
              padding: "15px 16px",
              fontSize: 15,
              fontWeight: 700,
              cursor: focusArea && !isSubmitting && !videoUploading ? "pointer" : "not-allowed",
              transition: "background-color 0.15s",
              opacity: isSubmitting || videoUploading ? 0.7 : 1,
            }}
          >
            {videoUploading ? (
              <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> Uploading video…</>
            ) : isSubmitting ? (
              <><Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> Creating session…</>
            ) : (
              <><Play style={{ width: 18, height: 18 }} /> Start Session</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
