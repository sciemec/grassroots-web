// src/lib/arena-poster.ts
// Fire-and-forget utility — posts an activity to the Arena social feed.
// Never throws; callers do not need to await or catch.

export async function postToArena(
  body: string,
  options?: {
    postType?: "standard" | "milestone" | "achievement" | "session_milestone";
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token || token === "dev-token") return;

  fetch(`${process.env.NEXT_PUBLIC_API_URL}/arena/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body,
      post_type: options?.postType ?? "standard",
      metadata: options?.metadata ?? {},
    }),
  }).catch(() => {}); // fire-and-forget — never surface errors to user
}
