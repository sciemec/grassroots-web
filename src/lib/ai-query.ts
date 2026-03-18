/**
 * queryAI — unified 3-step AI routing used everywhere in the app.
 *
 * Step 1: Laravel backend  POST /api/v1/ask
 * Step 2: Claude proxy     POST /api/ai-coach  (Next.js route)
 * Step 3: Offline KB       searchOffline()
 */
import api from "@/lib/api";
import { searchOffline } from "@/lib/offline-ai";

export async function queryAI(
  message: string,
  role: string = "player",
): Promise<string> {
  // Step 1 — Laravel backend
  try {
    const res = await api.post("/ask", { question: message, role, language: "english" });
    const reply = res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
    if (reply) return reply;
  } catch { /* fall through */ }

  // Step 2 — Claude proxy
  try {
    const res = await fetch("/api/ai-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const data = await res.json();
      const reply = data.response ?? data.reply ?? "";
      if (reply) return reply;
    }
  } catch { /* fall through */ }

  // Step 3 — Offline knowledge base
  const offline = await searchOffline(message);
  if (offline) return `${offline.text}\n\n_📚 Offline: ${offline.source}_`;

  throw new Error("Unable to connect to AI. Please check your connection.");
}
