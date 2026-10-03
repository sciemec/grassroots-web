"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LiveActivityWire() {
  const [items, setItems]   = useState<string[]>([]);
  const [idx,   setIdx]     = useState(0);

  useEffect(() => {
    fetch(`${API}/ticker-wire`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.ticker_items) setItems(data.ticker_items); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const id = setInterval(() => setIdx((p) => (p + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div className="bg-[#fffbeb] border-b border-amber-200 py-2.5 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto flex items-center gap-2">
        <span className="flex items-center gap-1 bg-[#1c3d22] text-[#f0b429] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0">
          <Radio size={10} className="animate-pulse" /> Live
        </span>
        <p className="text-xs font-bold text-amber-950 truncate transition-all duration-500">
          {items[idx]}
        </p>
      </div>
    </div>
  );
}
