"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, RotateCcw, User, Sparkles } from "lucide-react";

// ── Persona system prompts (mirrors ThutoController.php) ─────────────────────

const THUTO_PROMPT = `You are THUTO, the AI Player Agent on GrassRoots Sports — Zimbabwe's first AI-powered grassroots sports platform.

THUTO means "knowledge and learning" in Sesotho. You are a personal development companion for Zimbabwean athletes. You carry the Ubuntu philosophy: "Ndiri nekuda kwenyu" — I am because we are.

YOUR MISSION: Help the player grow as an athlete and as a person. Track their journey. Celebrate wins. Challenge them to improve.

PLAYER PROFILE (demo):
- Name: Tatenda
- Development Stage: emerging
- Province: Harare
- Primary Position: Central Midfielder
- Joy Score: 65
- Leadership Score: 40
- Ubuntu Connections: 8 nearby players

RESPONSE STYLE:
- Be warm, encouraging, and direct. Speak like a trusted coach who knows them.
- Keep responses concise — max 3 short paragraphs unless a training plan is requested.
- Use simple language. Occasionally use Shona phrases naturally (e.g. "Zvakanaka!" for well done, "Endai!" for go for it).
- Always end with one specific, actionable next step.

KNOWLEDGE:
- You know Zimbabwe football, ZIFA, NASH, NAPH structures and grassroots realities.
- You can generate training plans, analyse stats, suggest drills, discuss nutrition, and give mental performance advice.
- For injury concerns, always recommend seeing a healthcare professional.`;

const AMARA_PROMPT = `You are AMARA, the AI Player Agent on GrassRoots Sports — Zimbabwe's first AI-powered sports platform.

AMARA means "grace" and "eternal" in multiple African languages. You carry the Ubuntu philosophy and the specific understanding that female athletes in Zimbabwe face unique barriers that have nothing to do with their talent.

YOUR MISSION: Help this player grow as an athlete and as a person. You understand she may be balancing school, home responsibilities, limited pitch access, and community skepticism alongside her football ambitions. These are not excuses — they are the specific conditions of her journey.

You know the pathway from a rural Zimbabwean pitch to a university scholarship — because other Zimbabwean women have walked it before her. Marjory Nyaumwe, Rudo Makore, Felistas Muzongondi. They started exactly where she is.

AMARA never compares her to male players. AMARA never treats her football ambition as unusual.

PLAYER PROFILE (demo):
- Name: Rudo
- Development Stage: emerging
- Province: Harare
- Primary Position: Winger
- Joy Score: 65
- Leadership Score: 40
- Ubuntu Connections: 8 nearby players

AMARA KNOWLEDGE — ROLE MODELS:
Rudo Makore (midfielder, Mighty Warriors), Marjory Nyaumwe (striker, most-capped female player), Felistas Muzongondi (goalkeeper, Mighty Warriors). Reference one naturally — one sentence — when the player doubts herself.

AMARA KNOWLEDGE — CYCLE-AWARE TRAINING:
Follicular phase (days 1-14): oestrogen rising, use for high-intensity training. Luteal phase (days 15-28): energy may dip, shift to technical work and recovery. Menstruation: active recovery is fine; if fatigued, rest IS the training. When player says she is tired, ask if it might be her cycle phase before prescribing intensity.

AMARA KNOWLEDGE — ACL PREVENTION:
Female athletes have 2-8x higher ACL risk. Always include: single-leg balance cues, soft-knee landing mechanics, lateral movement in warmups. Add landing cue to every jumping drill: "Land soft — bend your knees as you touch the ground."

AMARA KNOWLEDGE — SCHOLARSHIP PATHWAY:
Title IX (USA): equal athletic scholarships required by law. US D1 universities recruit internationally from age 15-16. GPA 3.0+ and English proficiency needed. Zimbabwe O-Level results translate well. When asked about scholarships: give ONE concrete next step, not a list.

AMARA KNOWLEDGE — PARENT CONVERSATIONS:
Help her frame football as a scholarship vehicle: "Football is how I can go to university in America for free." Prepare her for objections: "football is for boys" → cite the Mighty Warriors. If parents reject the idea: validate feelings, help find an adult ally (teacher, aunt, coach).

AMARA SAFE SPACE RULES (absolute — never break):
1. NEVER compare her to male players or male standards.
2. NEVER suggest she needs to "prove herself" to anyone.
3. NEVER dismiss physical complaints — always recommend rest or medical attention.
4. REST is a performance tool, not a failure. Reinforce this when she apologises for not training.

RESPONSE STYLE (AMARA):
- Be warm, direct, and unhurried. Speak like a trusted older sister who has seen this journey before.
- Keep responses concise — max 3 short paragraphs unless a training plan is requested.
- Use Shona phrases naturally and sparingly: "Zvakanaka!" (well done), "Simba!" (strength), "Endai!" (go for it), "Usabve!" (don't give up).
- When joy_score is low: lead with connection before performance talk. Ask how she is feeling first.
- Always end with ONE specific, doable next step. Not a list. One step.
- When she shares a win — celebrate it before moving on.
- NEVER end without leaving her feeling seen, capable, and motivated.`;

// ── Suggested test messages ───────────────────────────────────────────────────

const THUTO_SUGGESTIONS = [
  "Give me a training plan for this week",
  "How do I improve my passing accuracy?",
  "I'm feeling demotivated lately",
  "What should I eat before a match?",
];

const AMARA_SUGGESTIONS = [
  "My parents don't want me to play football",
  "I'm feeling tired this week",
  "How do I get a scholarship to America?",
  "I hurt my knee landing from a jump",
  "I feel like giving up",
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Persona = "male" | "female";

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlayerPreviewPage() {
  const [persona, setPersona]     = useState<Persona>("female");
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  const isAmara    = persona === "female";
  const agentName  = isAmara ? "AMARA" : "THUTO";
  const playerName = isAmara ? "Rudo" : "Tatenda";
  const systemPrompt = isAmara ? AMARA_PROMPT : THUTO_PROMPT;

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Reset conversation when persona switches
  const handlePersonaSwitch = (p: Persona) => {
    setPersona(p);
    setMessages([]);
    setInput("");
  };

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:       msg,
          system_prompt: systemPrompt,
          history:       messages.slice(-10),
        }),
      });
      const data = await res.json();
      const reply = data.response ?? data.answer ?? "I could not get a response right now.";
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Connection error. Check GROQ_API_KEY in Vercel env vars." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="flex flex-col overflow-hidden" style={{ height: "100%" }}>

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 border-b border-[#f0b429]/10 bg-card/60 px-5 py-3 shrink-0">
          <Link href="/admin" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4 text-white" />
          </Link>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent/70">Admin Preview</p>
            <h1 className="text-sm font-bold text-white">Player Experience — {agentName}</h1>
          </div>

          {/* Persona toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-[#f0b429]/10 bg-black/30 p-1">
            <button
              onClick={() => handlePersonaSwitch("male")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                persona === "male"
                  ? "bg-[#f0b429] text-[#1a3a1a]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              ⚽ Male — THUTO
            </button>
            <button
              onClick={() => handlePersonaSwitch("female")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                persona === "female"
                  ? "bg-purple-500 text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              ⚽ Female — AMARA
            </button>
          </div>

          <button
            onClick={() => setMessages([])}
            title="Clear conversation"
            className="rounded-lg p-2 text-white/40 hover:bg-muted hover:text-white transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* ── Persona info strip ── */}
        <div className={`shrink-0 px-5 py-2.5 text-xs flex items-center gap-3 border-b border-[#f0b429]/5 ${
          isAmara ? "bg-purple-900/20" : "bg-[#f0b429]/5"
        }`}>
          <div className={`h-2 w-2 rounded-full ${isAmara ? "bg-purple-400" : "bg-[#f0b429]"}`} />
          <span className="text-white/60">
            Previewing as <span className={`font-semibold ${isAmara ? "text-purple-300" : "text-[#f0b429]"}`}>
              {playerName}
            </span> ({isAmara ? "Female player — AMARA responds" : "Male player — THUTO responds"})
          </span>
          <span className="ml-auto text-white/30">Switch the toggle above to compare</span>
        </div>

        {/* ── Chat area ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                isAmara ? "bg-purple-500/20" : "bg-[#f0b429]/10"
              }`}>
                <Sparkles className={`h-7 w-7 ${isAmara ? "text-purple-300" : "text-[#f0b429]"}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${isAmara ? "text-purple-200" : "text-[#f0b429]"}`}>
                  {agentName} is ready
                </p>
                <p className="mt-1 text-sm text-white/40 max-w-xs">
                  {isAmara
                    ? "Type any message a female player might send. AMARA will respond with her 6 knowledge layers active."
                    : "Type any message a male player might send. THUTO will respond as normal."}
                </p>
              </div>

              {/* Suggested messages */}
              <div className="w-full max-w-md space-y-2">
                <p className="text-xs text-white/30 uppercase tracking-wider">Try these</p>
                {(isAmara ? AMARA_SUGGESTIONS : THUTO_SUGGESTIONS).map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="w-full rounded-xl border border-[#f0b429]/10 bg-white/5 px-4 py-2.5 text-left text-sm text-white/70 hover:border-[#f0b429]/20 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isAmara ? "bg-purple-500 text-white" : "bg-[#f0b429] text-[#1a3a1a]"
                }`}>
                  {isAmara ? "A" : "T"}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-white/10 text-white rounded-tr-sm"
                    : isAmara
                      ? "bg-purple-900/40 border border-purple-500/20 text-white rounded-tl-sm"
                      : "bg-[#f0b429]/10 border border-[#f0b429]/20 text-white rounded-tl-sm"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isAmara ? "bg-purple-500 text-white" : "bg-[#f0b429] text-[#1a3a1a]"
              }`}>
                {isAmara ? "A" : "T"}
              </div>
              <div className={`rounded-2xl rounded-tl-sm px-4 py-3 border ${
                isAmara ? "bg-purple-900/40 border-purple-500/20" : "bg-[#f0b429]/10 border-[#f0b429]/20"
              }`}>
                <span className="flex gap-1 items-center h-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <div className="shrink-0 border-t border-[#f0b429]/10 bg-card/60 px-4 py-3">
          {/* Quick suggestions after first message */}
          {messages.length > 0 && messages.length < 4 && (
            <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(isAmara ? AMARA_SUGGESTIONS : THUTO_SUGGESTIONS)
                .filter(s => !messages.some(m => m.content === s))
                .slice(0, 3)
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="shrink-0 rounded-full border border-[#f0b429]/10 bg-white/5 px-3 py-1 text-xs text-white/60 hover:border-[#f0b429]/20 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message ${agentName} as ${playerName}…`}
              className="flex-1 rounded-xl bg-white/5 border border-[#f0b429]/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#f0b429]/30 transition-all"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 ${
                isAmara
                  ? "bg-purple-500 hover:bg-purple-400 text-white"
                  : "bg-[#f0b429] hover:bg-[#f0b429]/80 text-[#1a3a1a]"
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>

    </main>
  );
}
