// src/lib/wa-link.ts
// Returns a wa.me deep-link pre-populated with the given text.
// Returns null when NEXT_PUBLIC_WHATSAPP_NUMBER is not set — callers hide buttons.
//
// NEXT_PUBLIC_WHATSAPP_NUMBER: E.164 digits only, no + prefix.
// Example: NEXT_PUBLIC_WHATSAPP_NUMBER=263713825479

const BOT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

/**
 * Build a wa.me link pre-populated with `text`.
 * Returns null when the env var is missing.
 */
export function waLink(text: string): string | null {
  if (!BOT_NUMBER) return null;
  return `https://wa.me/${BOT_NUMBER}?text=${encodeURIComponent(text)}`;
}
