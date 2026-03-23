"use client";

/**
 * LanguageSwitcher — toggle between English, Shona, and Ndebele.
 * Persists the chosen language to localStorage.
 */

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import "@/lib/i18n";
import i18n from "i18next";

const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "sn", label: "ChiShona", short: "SN" },
  { code: "nd", label: "isiNdebele", short: "ND" },
] as const;

type LangCode = "en" | "sn" | "nd";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [current, setCurrent] = useState<LangCode>("en");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("grassroots_lang") as LangCode | null;
    if (saved && ["en", "sn", "nd"].includes(saved)) {
      setCurrent(saved);
    }
  }, []);

  const selectLang = (code: LangCode) => {
    setCurrent(code);
    localStorage.setItem("grassroots_lang", code);
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const currentLabel = LANGUAGES.find((l) => l.code === current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
        title="Change language"
      >
        <Globe className="h-3.5 w-3.5" />
        {compact ? currentLabel?.short : currentLabel?.label}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute bottom-full left-0 z-50 mb-1 w-36 rounded-xl border bg-card shadow-lg py-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => selectLang(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors ${
                  current === lang.code ? "font-semibold text-primary" : "text-foreground"
                }`}
              >
                <span>{lang.label}</span>
                <span className="text-xs text-muted-foreground">{lang.short}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
