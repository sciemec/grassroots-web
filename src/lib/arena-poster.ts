// src/lib/arena-poster.ts
// Fire-and-forget utility — posts an activity to the Arena social feed.
// Never throws; callers do not need to await or catch.

export async function postToArena(
  body: string,
  options?: {
    postType?: "standard" | "milestone" | "achievement" | "session_milestone";
    metadata?: Record<string, unknown>;
    activityType?: string;
    activityData?: Record<string, unknown>;
    videoUrl?: string;
  }
): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token || token === "dev-token") return;

  const payload: Record<string, unknown> = {
    body,
    post_type: options?.postType ?? "standard",
    metadata:  options?.metadata ?? {},
    ...(options?.activityType && { activity_type: options.activityType }),
    ...(options?.activityData && { activity_data:  options.activityData }),
    ...(options?.videoUrl     && { video_url:       options.videoUrl }),
  };

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch(() => {}); // fire-and-forget — never surface errors to user
}
