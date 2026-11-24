"use client";

import { useState } from "react";
import Link from "next/link";
import { FIVE_TIPS } from "@/data/sponsorship-guide";

export default function StrongCaseTip() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-[#1a5c2a]/5 border border-[#1a5c2a]/20 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-[#1a5c2a]">
          How to build a strong case
        </span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`text-[#1a5c2a] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-4">
          <ol className="space-y-2 mb-3">
            {FIVE_TIPS.map((t, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                <span className="text-base flex-shrink-0">{t.icon}</span>
                <span className="leading-relaxed">{t.tip}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/sponsorships/guide"
            className="text-xs font-semibold text-[#1a5c2a] hover:underline"
          >
            Read the full guide →
          </Link>
        </div>
      )}
    </div>
  );
}
