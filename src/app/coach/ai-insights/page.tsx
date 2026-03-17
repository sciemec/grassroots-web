"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Send, RotateCcw, ArrowLeft, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import { coachAiAssistantPrompt } from "@/config/prompts";
import { SportKey } from "@/config/sports";
import api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Analyse my squad fitness and injury risk",
  "Suggest a training session for this week",
  "What formation should I use against a 4-3-3?",
  "How do I improve our set piece attacking?",
  "Give me warm-up drills for a match day",
  "Which players need individual development focus?",
  "How do I motivate a losing team at half time?",
  "Plan a 4-week pre-season programme",
  "Recommend 3 drills for a striker with weak finishing",
  "Give me drills for a defender who loses the ball under pressure",
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`h-8 w-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
        isUser ? "bg-green-500 text-white" : "bg-purple-600 text-white"
      }`}>
        {isUser ? "Me" : <Brain className="h-4 w-4" />}
      </div>
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser ? "bg-green-600 text-white rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
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

export default function CoachAIInsightsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const systemPrompt = coachAiAssistantPrompt({
    sport: (user?.sport as SportKey) ?? "football",
    coachingLevel: user?.position ?? undefined,
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello Coach! I'm your AI coaching assistant powered by Claude.\n\nI can help you with squad management, tactics, training plans, player development, match analysis, and motivation strategies.\n\nWhat do you need help with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
  }, [user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
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

      let reply = "";

      // Step 1 — try Laravel backend (DeepSeek, works with valid token)
      try {
        const res = await api.post("/ask", {
          question: content,
          role: user?.role ?? "coach",
          language: "english",
        });
        reply = res.data?.answer ?? res.data?.response ?? res.data?.message ?? "";
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 401) throw err; // surface real errors (network, 500, etc.)
        // 401 → fall through to Claude proxy below
      }

      // Step 2 — fallback: Next.js proxy → Anthropic Claude (supports history)
      if (!reply) {
        const res = await fetch("/api/ai-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content, system_prompt: systemPrompt, history }),
        });
        const data = await res.json();
        reply = data?.response ?? data?.message ?? "";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: reply || "I couldn't process that. Please try again.", timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Check your internet connection and try again.",
          timestamp: new Date(),
        },
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
      content: "Chat cleared. What coaching challenge can I help with?",
      timestamp: new Date(),
    }]);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/coach" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-600">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">AI Coaching Assistant</h1>
              <p className="text-xs text-muted-foreground">Powered by Claude · Tactics, training & player development</p>
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

        {/* Suggested prompts */}
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
                placeholder="Ask your AI coaching assistant… (Enter to send)"
                className="w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
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
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            AI Coach supports English and Shona · Specialised for coaching & squad management
          </p>
        </div>
      </div>
    </div>
  );
}
