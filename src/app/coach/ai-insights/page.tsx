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
import { searchOffline, preloadOfflineAI } from "@/lib/offline-ai";
import { classifyQuestion, system2Protocols, type ThinkingSystem } from "@/lib/ai-routing";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Why should my team press high — and when is it the wrong choice?",
  "How do I adapt the Spain U23 pressing session for 20 grassroots players?",
  "When should my full-backs overlap vs stay back?",
  "How do I set up a high block defending session with cones only?",
  "Why do we keep conceding from set pieces — and how do I fix it?",
  "Design a 3-part session on defensive shape and transitions",
  "How do I explain pressing triggers to players who have never heard the term?",
  "When should I use a 4-3-3 vs a 4-2-3-1 against a physical team?",
  "How do I motivate a losing team at half time?",
  "Why is my striker not scoring despite getting chances — and how do I fix it?",
  "How do I run a passing circuit with finishing for U17s?",
  "Plan a 4-week pre-season programme for a Division 2 club",
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

interface SquadMember {
  id: string;
  player?: { name?: string };
  position?: string;
  shirt_no?: number;
  status?: string;
}

export default function CoachAIInsightsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  const [squad, setSquad] = useState<SquadMember[]>([]);

  // Load squad on mount so AI has context about fitness, injuries, cautions
  useEffect(() => {
    if (!user) return;
    api.get("/coach/squad")
      .then(res => setSquad(res.data?.data ?? res.data ?? []))
      .catch(() => {});
  }, [user]);

  const squadContext = squad.length > 0
    ? `\n\nCOACH'S SQUAD (${squad.length} players):\n` +
      `- Fit: ${squad.filter(m => m.status === "fit").length}, ` +
      `Injured: ${squad.filter(m => m.status === "injured").length}, ` +
      `Caution: ${squad.filter(m => m.status === "caution").length}\n` +
      squad.slice(0, 12).map(m =>
        `- #${m.shirt_no ?? "?"} ${m.player?.name ?? "Unknown"} (${m.position ?? "?"}) — ${m.status ?? "fit"}`
      ).join("\n")
    : "";

  const systemPrompt = coachAiAssistantPrompt({
    sport: (user?.sport as SportKey) ?? "football",
    coachingLevel: user?.position ?? undefined,
  }) + squadContext;

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
  const [thinkingSystem, setThinkingSystem] = useState<ThinkingSystem>("system1");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) router.replace("/login");
  }, [_hasHydrated, user, router]);

  if (!_hasHydrated || !user) return null;

  // Preload offline knowledge bases as soon as page mounts
  useEffect(() => { preloadOfflineAI(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
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

      // Classify question — Kahneman dual-process routing
      const { system } = classifyQuestion(content);
      setThinkingSystem(system);

      // Embed recent history into DeepSeek question for context
      const recentCtx = history.slice(-4).map(m =>
        `${m.role === "user" ? "Coach" : "AI"}: ${m.content.slice(0, 200)}`
      ).join("\n");
      const questionWithHistory = recentCtx
        ? `[Recent conversation:\n${recentCtx}]\n\nCoach: ${content}`
        : content;

      // Placeholder bubble for streaming
      const assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: new Date() }]);

      let replied = false;

      // System 2 (Slow Thinking) — go straight to Claude with Kahneman protocols
      if (system === "system2") {
        const enhancedSystem = systemPrompt + system2Protocols();
        try {
          const res = await fetch("/api/ai-coach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: content, system_prompt: enhancedSystem, history, stream: true }),
          });
          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              for (const line of chunk.split("\n")) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    fullText += parsed.delta.text;
                    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
                  }
                } catch { /* skip malformed SSE lines */ }
              }
            }
            if (fullText) replied = true;
          }
        } catch { /* fall through to DeepSeek */ }
      }

      // System 1 (Fast Thinking) — DeepSeek via Laravel (skip if System 2 already replied)
      if (!replied) try {
        const res = await api.post("/ask", {
          question: questionWithHistory,
          role: user?.role ?? "coach",
          language: "english",
        });
        const reply = res.data?.answer ?? "";
        if (reply) {
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: reply } : m));
          replied = true;
        }
      } catch {
        // 401 (guest/dev-bypass) or network error → fall through to Claude
      }

      // Step 2 — Claude Sonnet via Next.js proxy (FALLBACK — streaming)
      if (!replied) {
        try {
          const res = await fetch("/api/ai-coach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: content, system_prompt: systemPrompt, history, stream: true }),
          });
          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              for (const line of chunk.split("\n")) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") break;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    fullText += parsed.delta.text;
                    setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText } : m));
                  }
                } catch { /* skip malformed SSE lines */ }
              }
            }
            if (fullText) replied = true;
          }
        } catch {
          // fall through to offline
        }
      }

      // Step 3 — Offline knowledge base
      if (!replied) {
        const offline = await searchOffline(content);
        const fallback = offline
          ? `${offline.text}\n\n_📚 Offline response from: ${offline.source}_`
          : "Sorry, I'm unable to respond right now. Please check your connection and try again.";
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fallback } : m));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
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
              <div className="flex items-center gap-1.5 mt-0.5">
                {thinkingSystem === "system2" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                    🧠 Deep Analysis
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                    ⚡ Fast Response
                  </span>
                )}
              </div>
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
