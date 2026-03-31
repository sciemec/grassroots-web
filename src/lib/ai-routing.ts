/**
 * AI Routing — Kahneman Dual-Process Model
 *
 * System 1 (Fast Thinking) → DeepSeek via Laravel
 *   Quick, pattern-based, automatic. Handles familiar and simple questions cheaply.
 *
 * System 2 (Slow Thinking) → Claude Sonnet via Next.js proxy
 *   Deliberate, analytical, deep. Triggered by complex questions that need rigorous reasoning.
 *   Applies Kahneman cognitive protocols: WYSIATI check, Premortem, De-anchoring,
 *   Regression watch, and Substitution alert.
 *
 * Reference: Daniel Kahneman — Thinking, Fast and Slow
 */

export type ThinkingSystem = "system1" | "system2";

// Keywords that signal the question needs deep analytical thinking (System 2)
const SYSTEM2_TRIGGERS = [
  // Analysis & evaluation
  "analys", "evaluate", "assess", "review", "diagnose", "investigate",
  // Strategy & planning
  "strategy", "plan", "programme", "design", "build", "create a session",
  "training plan", "pre-season", "periodis",
  // Causality & problem-solving
  "why", "why do", "why are", "why is", "why keep", "why am i",
  "what is wrong", "what went wrong", "how do i fix", "how do i improve",
  "reason", "cause", "root cause",
  // Comparison & decision
  "compare", "versus", "vs", "should i", "which is better", "difference between",
  "when should", "best formation",
  // Failure & risk
  "failing", "losing", "conceding", "weakness", "mistake", "error",
  "risk", "problem", "issue", "concern", "struggling",
  // Deep coaching concepts
  "tactical", "pressing trigger", "transition", "shape", "block", "structure",
  "periodisation", "develop", "potential", "long term",
  // Kahneman-specific requests
  "premortem", "pre-mortem", "failure scenario", "what could go wrong",
  "what am i missing", "blind spot", "challenge my thinking",
];

/**
 * Classify a question as System 1 (fast) or System 2 (slow).
 * Returns the system to use and a reason for transparency.
 */
export function classifyQuestion(question: string): {
  system: ThinkingSystem;
  reason: string;
} {
  const lower = question.toLowerCase();

  // Long questions almost always need deeper thinking
  if (question.length > 120) {
    return { system: "system2", reason: "complex question — deep analysis" };
  }

  const trigger = SYSTEM2_TRIGGERS.find(t => lower.includes(t));
  if (trigger) {
    return { system: "system2", reason: `analytical question (detected: "${trigger}")` };
  }

  return { system: "system1", reason: "quick question — fast response" };
}

/**
 * Build the Kahneman System 2 protocol additions for the Claude system prompt.
 * These instruct Claude to behave as a rigorous analytical thinker.
 */
export function system2Protocols(): string {
  return `

━━━ KAHNEMAN SYSTEM 2 PROTOCOLS — ACTIVE ━━━
You are operating in DEEP ANALYSIS MODE (System 2 — Slow Thinking).
Apply ALL of the following cognitive protocols before answering:

1. WYSIATI CHECK (What You See Is All There Is)
   Before answering, explicitly identify what KEY INFORMATION IS MISSING from this question.
   State it clearly: "To give you a complete answer, I'd also need to know: [X, Y, Z]"
   Do not build your answer only on what was provided — flag the gaps.

2. PREMORTEM
   For any plan, strategy, or decision: generate ONE specific failure scenario.
   Format: "⚠️ Failure scenario: Imagine it is 3 months from now and this plan failed.
   The most likely reason is: [specific reason]."
   This is not pessimism — it is how professional analysts protect their clients.

3. DE-ANCHORING
   If numbers, statistics, or specific figures appear in the question (scores, percentages, rankings),
   form your independent assessment BEFORE referencing those numbers.
   Flag if the numbers may be anchoring the analysis incorrectly.

4. REGRESSION WATCH
   If the question involves predicting performance or outcomes:
   Flag when results described are statistically extreme (very high or very low).
   Remind the coach that extreme results naturally regress toward average — not because of any action taken.

5. SUBSTITUTION ALERT
   Answer the ACTUAL question asked — not an easier version of it.
   If you detect yourself substituting "how well did this go?" for "will this work long-term?",
   catch it and answer the harder question directly.

6. CONFIDENCE CALIBRATION
   End every System 2 response with a brief honest statement:
   "Confidence: [High/Medium/Low] — [one sentence explaining why]"

━━━ END PROTOCOLS ━━━
`;
}
