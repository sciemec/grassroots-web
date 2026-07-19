/**
 * Legacy Groq shim — now delegates to Gemini 2.0 Flash.
 * All call sites that imported groqText / groqVision continue to work
 * without changes. Env var required: GEMINI_API_KEY
 */

export { geminiText as groqText, geminiVision as groqVision } from "@/lib/gemini";
