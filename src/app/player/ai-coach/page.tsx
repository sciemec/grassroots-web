"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Send, Mic, Loader2, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { playerAiCoachPrompt, ageGroupMatchFeedbackPrompt } from "@/config/prompts";
import { SportKey } from "@/config/sports";
import api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "How do I improve my shooting accuracy?",
  "Give me a warm-up routine for today",
  "Why is my first touch poor?",
  "Ndisimudze sei pamutambo wefootball?",
  "What drills should I do for speed?",
  "How do I recover after an intense session?",
  "Analyse my last match and give me feedback",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
        isUser ? "bg-green-500 text-white" : "bg-purple-600 text-white"
      }`}>
        {isUser ? "Me" : <Brain className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-green-600 text-white rounded-tr-sm"
          : "bg-muted text-foreground rounded-tl-sm"
      }`}>
        {msg.content.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < msg.content.split("\n").length - 1 && <br />}
          </span>
        ))}
        <p className={`mt-1 text-xs opacity-60 ${isUser ? "text-right" : ""}`}>
          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

export default function AICoachPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Wait for Zustand persist to rehydrate from localStorage before running the
  // auth guard — same race condition fix as DashboardLayout.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.push("/login");
  }, [hydrated, user, router]);

  /** Build system prompt from user profile. Falls back to sensible defaults. */
  const systemPrompt = playerAiCoachPrompt({
    sport: (user?.sport as SportKey) ?? "football",
    position: user?.position ?? undefined,
    ageGroup: user?.age_group ?? undefined,
    province: user?.province ?? undefined,
    name: user?.name ?? undefined,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Coach, powered by Claude. I know your training history and I'm here to help you improve.\n\nAsk me anything about technique, fitness, tactics, nutrition, or recovery. I also understand Shona — ndingakubatsira nerurimi rwechiShona.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * callAI — routes the request to the right AI service:
   *
   * Real users  → POST /api/v1/ask  (Laravel → DeepSeekService::answerFootballQuestion)
   *               request:  { question, role, language }
   *               response: { answer }
   *
   * Dev-bypass  → POST /api/ai-coach (Next.js server route → DeepSeek API directly)
   * or 401 fallback  request:  { message, system_prompt, history }
   *               response: { response }
   *
   * The Next.js route preserves conversation history; the Laravel /ask endpoint
   * handles each message independently (backend limitation — no history param).
   */
  const callAI = async (message: string, systemP: string, history: { role: string; content: string }[]) => {
    try {
      // Primary: POST /ask via Laravel backend
      const res = await api.post("/ask", {
        question: message,
        role: user?.role ?? "player",
        language: "english",
      });
      return res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 401) throw err; // surface real errors (network, 500, etc.)
      // 401 → fall through to the Next.js proxy below
    }

    // Fallback: Next.js server route → Anthropic API (supports conversation history)
    const res = await fetch("/api/ai-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, system_prompt: systemP, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `AI service error (${res.status})`);
    }
    const data = await res.json();
    return data.response ?? data.reply ?? "";
  };

  const sendWithMatchFeedback = async (matchStats: string) => {
    const ageGroup = user?.age_group ?? "senior";
    const system = ageGroupMatchFeedbackPrompt({ ageGroup, matchStats });
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: `Analyse my recent match:\n${matchStats}`, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const reply = await callAI(userMsg.content, system, []);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: reply || "Analysis complete.", timestamp: new Date() }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "I couldn't analyse the match right now. Please try again.";
      setMessages((prev) => [...prev, { id: crypto.randomUUID() + "e", role: "assistant", content: msg, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    if (content === "Analyse my last match and give me feedback") {
      sendWithMatchFeedback("No match stats provided — give general post-match feedback advice and ask the player to share their stats.");
      return;
    }
    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const reply = await callAI(content, systemPrompt, history);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply || "I couldn't process that. Please try again.", timestamp: new Date() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sorry, I'm having trouble connecting right now.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: msg, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "Chat cleared. What would you like to work on?",
      timestamp: new Date(),
    }]);
  };

  if (!hydrated || !user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/player" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">AI Coach</h1>
              <p className="text-xs text-muted-foreground">Powered by Claude · Knows your training history</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear chat
          </button>
        </div>

        {/* Suggested prompts — show when only welcome message */}
        {messages.length === 1 && (
          <div className="border-b px-6 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 scroll-smooth overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-600">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking…</span>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask your AI Coach… (Enter to send, Shift+Enter for new line)"
                className="w-full resize-none rounded-xl border bg-card px-4 py-3 pr-12 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                style={{ maxHeight: 120, overflowY: "auto" }}
              />
            </div>
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
            <button
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border bg-card text-muted-foreground hover:bg-muted transition-colors"
              title="Voice input (coming soon)"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI Coach supports English and Shona · Responses based on your real training data
          </p>
        </div>
      </div>
    </div>
  );
}
