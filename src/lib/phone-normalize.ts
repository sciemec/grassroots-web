// src/lib/phone-normalize.ts
// Normalises any phone number to E.164 format (+263XXXXXXXXX for Zimbabwe).
// Used by registration forms, profile WhatsApp field, and the THUTO webhook.
//
// Twilio always sends WhatsApp numbers as E.164 (e.g. +263712345678).
// The DB must store numbers in the same format so lookups match.

export function normalizePhone(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");

  // Already full international — just add +
  if (digits.startsWith("263") && digits.length === 12) return `+${digits}`;
  // South Africa
  if (digits.startsWith("27") && digits.length === 11) return `+${digits}`;
  // Zimbabwe local: 07XXXXXXXX (10 digits)
  if (digits.startsWith("0") && digits.length === 10) return `+263${digits.slice(1)}`;
  // Zimbabwe without leading zero: 7XXXXXXXX (9 digits)
  if (digits.length === 9) return `+263${digits}`;
  // Any other format — prepend + and trust the user
  return `+${digits}`;
}
