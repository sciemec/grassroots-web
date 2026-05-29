"use client";

import { useState, useEffect, useRef } from "react";
import { POSITION_FOCUS_MAP, type PositionFocusConfig } from "@/config/position-focus";
import { useAuthStore } from "@/lib/auth-store";

const POSITION_TABS = [
  { id: "striker",       label: "Striker" },
  { id: "winger",        label: "Winger" },
  { id: "midfielder",    label: "Midfielder" },
  { id: "defensive_mid", label: "Def. Mid" },
  { id: "defender",      label: "Center Back" },
  { id: "fullback",      label: "Full Back" },
  { id: "goalkeeper",    label: "Goalkeeper" },
];

export default function PlayerHub() {
  const user = useAuthStore(s => s.user);
  // Read position from player profile — fall back to selector
  const [positionId, setPositionId] = useState<string>(
    user?.position ?? "striker"
  );
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const pos: PositionFocusConfig = POSITION_FOCUS_MAP[positionId];

  // Reset chat when position changes
  useEffect(() => {
    setMessages([{ role: "assistant", content: pos.thutoGreeting }]);
  }, [positionId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || aiLoading) return;
    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setAiLoading(true);

    try {
      const res = await fetch("/api/thuto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          systemPrompt: pos.thutoSystemPrompt,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#f4f2ee" }}>
      {/* Header */}
      <div style={{ background: "#1a5c2a" }} className="px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 tracking-wider mb-0.5">GRASSROOTS SPORTS · PLAYER ACADEMY</p>
          <h1 className="text-white text-lg font-medium">{pos.title}</h1>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${pos.badgeColor}`}>
          {pos.title.split("/")[0].trim()}
        </span>
      </div>

      {/* Position tabs */}
      <div className="flex gap-2 px-4 py-2.5 bg-white border-b border-gray-200 overflow-x-auto">
        {POSITION_TABS.map(t => (
          <button key={t.id} onClick={() => setPositionId(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${
              positionId === t.id
                ? "text-white border-transparent"
                : "text-gray-500 border-gray-200"
            }`}
            style={positionId === t.id ? { background: "#1a5c2a", borderColor: "#1a5c2a" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {/* Attributes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-2">Position profile</p>
          <p className="text-sm font-medium text-gray-900 mb-2">{pos.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {pos.primaryAttributes.map(a => (
              <span key={a} className={`text-xs font-medium px-2.5 py-1 rounded-full border ${pos.badgeColor}`}>{a}</span>
            ))}
          </div>
        </div>

        {/* Physical */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-2">Physical focus</p>
          <div className="grid grid-cols-1 gap-1.5">
            {pos.physicalFocus.map(p => (
              <div key={p} className="flex items-center gap-2 text-xs text-gray-700 bg-stone-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#c8962a" }} />
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Drills */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-2">Your drill categories</p>
          <div className="flex flex-col gap-1.5">
            {pos.targetDrillCategories.map(d => (
              <div key={d} className="flex items-center gap-2 text-xs text-gray-700 bg-stone-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#1a5c2a" }} />
                {d.replace(/_/g, " ")}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-2">Success metrics</p>
          <div className="grid grid-cols-2 gap-2">
            {pos.successMetrics.map(m => (
              <div key={m.label} className="bg-stone-50 rounded-xl p-2.5">
                <p className="text-[10px] text-gray-400">{m.label}</p>
                <p className="text-base font-medium mt-0.5" style={{ color: pos.accentColor }}>—</p>
                <p className="text-[10px] text-gray-400">target: {m.target}</p>
              </div>
            ))}
          </div>
        </div>

        {/* THUTO AI - full width */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium mb-3">Thuto AI — your {pos.title.split("/")[0].trim().toLowerCase()} coach</p>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 mb-3">
            {pos.quickPrompts.map(q => (
              <button key={q} onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-stone-50 transition-colors"
                style={{ color: "#1a5c2a" }}>
                {q}
              </button>
            ))}
          </div>

          {/* Chat */}
          <div ref={chatRef} className="flex flex-col gap-2 max-h-52 overflow-y-auto mb-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm rounded-xl px-3 py-2 leading-relaxed max-w-[86%] ${
                m.role === "user"
                  ? "self-end text-white rounded-br-sm"
                  : "self-start text-gray-900 bg-stone-50 rounded-bl-sm"
              }`} style={m.role === "user" ? { background: "#1a5c2a" } : {}}>
                {m.content}
              </div>
            ))}
            {aiLoading && (
              <div className="self-start text-sm text-gray-400 bg-stone-50 rounded-xl rounded-bl-sm px-3 py-2 italic">
                Thuto is thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask your position coach anything…"
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-900 outline-none focus:border-green-700" />
            <button onClick={() => sendMessage(input)} disabled={aiLoading || !input.trim()}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ background: "#c8962a" }}>
              Ask →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}