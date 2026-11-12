"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Shield,
  Smartphone,
  PiggyBank,
  AlertTriangle,
  Award,
} from "lucide-react";

// ─── Lesson content ───────────────────────────────────────────────────────────

const LESSONS = [
  {
    id: "budgeting",
    icon: PiggyBank,
    color: "#1a5c2a",
    title: "Budgeting Basics",
    body: `A budget is a plan for your money. Before you spend anything, write down what you earn (income) and what you need to pay for (expenses).

The golden rule: **spend less than you earn**. Even $1 saved every day becomes $365 in a year.

For sponsorship money, treat every dollar as belonging to the purpose it was given for. Kit money buys kit — nothing else. If you have leftover funds, save them for future needs related to your sport.

**Simple budget formula:**
Income − Fixed expenses = What you have to work with
What you have to work with − Savings goal = Spending money`,
  },
  {
    id: "saving",
    icon: Shield,
    color: "#0369a1",
    title: "Save First, Spend Second",
    body: `Most people save what is left over after spending. Wealthy people save first and spend what is left over. This one habit changes everything.

**Emergency fund:** Try to save at least one month of your expenses. This protects you when unexpected costs arrive — a broken boot, transport to a trial, a medical fee.

**Goal-based saving:** When you receive sponsorship money, divide it immediately:
- Amount needed for stated purpose (non-negotiable)
- Small buffer for cost increases (10%)
- Nothing else should touch this money

Keeping sponsorship money in a separate mobile money wallet (Ecocash, InnBucks) with a different PIN stops accidental spending.`,
  },
  {
    id: "scams",
    icon: AlertTriangle,
    color: "#dc2626",
    title: "Scams & Debt Traps",
    body: `Zimbabwe has seen a rise in sports-related scams targeting young athletes. Know the warning signs:

**Red flags — walk away immediately:**
- "Pay a registration fee to join our academy"
- "Send money first and we will confirm your trial place"
- "We will double your sponsorship if you invest it with us"
- Any request for your Ecocash PIN or OTP

**Debt traps:** Microloans with interest rates above 20% per month will grow faster than you can repay them. If you need money urgently, speak to a trusted adult or contact your coach before borrowing.

**Rule:** Legitimate sponsors and academies never ask you to send money. They send money TO you, not the other way around.`,
  },
  {
    id: "mobile-money",
    icon: Smartphone,
    color: "#7c3aed",
    title: "Mobile Money Safety",
    body: `Ecocash and InnBucks are how most sponsorship payments move in Zimbabwe. Use them safely:

**Protect your PIN:**
- Never share your PIN with anyone — including family, coaches, or "GRS staff"
- Change your PIN if you think it has been compromised
- Never read your OTP out loud to someone on the phone

**Verify before sending:**
- Confirm the recipient's number twice before hitting Send
- For amounts above $20, call the recipient to confirm they are expecting it
- Take a screenshot of every transaction for your records

**Saving on mobile money:**
- Ecocash Savings Wallet earns interest
- InnBucks has a "Safe" feature for locked savings
- Use these for sport-related funds to keep them separate`,
  },
  {
    id: "sponsorship",
    icon: Trophy,
    color: "#c8962a",
    title: "Using Sponsorship Money Responsibly",
    body: `When someone sponsors you, they are making an investment in your future. They trust you to use the money exactly as you said you would.

**Your obligations:**
1. **Use it for the stated purpose** — if the case said "trial registration fee", that is all it covers
2. **Keep receipts** — take photos of every payment you make
3. **Post proof** — upload your proof of use to your GRS case page so the sponsor can see their money at work
4. **Communicate** — if something changes (the trial was postponed, the kit price increased), let GRS know immediately

**What happens if you misuse sponsorship funds:**
- Your case will be closed and removed from the platform
- Your account will be flagged, making future cases impossible
- In serious cases, it may become a legal matter

**The bigger picture:** Every time an athlete uses sponsorship responsibly, it makes it easier for the next Zimbabwean athlete to get sponsored. You are building trust for the whole community.`,
  },
];

// ─── Quiz questions ───────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    question: "You receive sponsorship money for kit. What should you do first?",
    options: [
      "Spend it on food because you are hungry",
      "Set it aside in a separate wallet only for kit",
      "Lend it to a friend who will pay you back",
      "Invest it in a business for one week",
    ],
    correct: 1,
    explanation: "Sponsorship money must stay reserved for its stated purpose.",
  },
  {
    question: "What is the best savings habit?",
    options: [
      "Save first, then spend what is left over",
      "Spend freely, then save whatever remains",
      "Spend everything and start fresh next month",
      "Only save when you have a lot of money",
    ],
    correct: 0,
    explanation: "Saving first ensures the saving actually happens.",
  },
  {
    question: "An agency says: 'Pay $50 to register for a trial.' What should you do?",
    options: [
      "Pay immediately so you don't miss your chance",
      "Ask your coach to pay for you",
      "Refuse — legitimate trials never charge athletes",
      "Borrow the money and pay it back after the trial",
    ],
    correct: 2,
    explanation: "Legitimate academies and trials never ask athletes to pay registration fees.",
  },
  {
    question: "Someone calls claiming to be from your sponsor and asks for your Ecocash PIN to 'verify your identity'. You should:",
    options: [
      "Give them the PIN — it sounds official",
      "Never give your PIN to anyone, including people claiming to be from GRS",
      "Give them the first two digits only",
      "Call GRS later to check if it was real",
    ],
    correct: 1,
    explanation: "No legitimate organisation will ever ask for your mobile money PIN.",
  },
  {
    question: "Your sponsorship case was funded for a trial registration fee. The trial is postponed. You should:",
    options: [
      "Spend the money on something else and replace it later",
      "Keep the money safe and notify GRS about the change",
      "Return the money immediately without telling anyone",
      "Use half the money and save the rest",
    ],
    correct: 1,  // corrected index — answer B maps to index 1
    explanation: "Always keep sponsors informed of changes. The money stays reserved.",
  },
  {
    question: "Which of these is a warning sign of a financial scam?",
    options: [
      "A promise to 'double your money' if you invest your sponsorship funds",
      "A sponsor asking for proof of purchase",
      "GRS asking you to upload a receipt",
      "A coach asking you to show your kit",
    ],
    correct: 0,
    explanation: "Promises of quick doubling of money are always scams.",
  },
  {
    question: "An emergency fund should cover at least:",
    options: [
      "One day of expenses",
      "One week of expenses",
      "One month of expenses",
      "One year of expenses",
    ],
    correct: 2,
    explanation: "One month gives you enough buffer to handle most unexpected costs.",
  },
  {
    question: "When a sponsor pays for kit, GRS recommends the sponsor pays:",
    options: [
      "The athlete directly",
      "The vendor or supplier directly",
      "The athlete's parent",
      "GRS, who then pays the vendor",
    ],
    correct: 1,
    explanation: "Direct vendor payment removes any chance of fund misuse.",
  },
  {
    question: "Why is it important to post proof of use on your GRS case?",
    options: [
      "It builds trust and helps the next athlete get sponsored",
      "It gives you extra points on your profile",
      "It is required by ZIFA regulations",
      "It helps GRS make money",
    ],
    correct: 0,
    explanation: "Every responsible use of funds builds trust for all Zimbabwean athletes.",
  },
  {
    question: "A microloan charges 25% interest per month. You borrow $100. After 3 months (without payments) you owe approximately:",
    options: [
      "$125",
      "$150",
      "$195",
      "$300",
    ],
    correct: 2,
    explanation: "$100 × 1.25³ ≈ $195. High-interest debt grows very fast.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Phase = "lessons" | "quiz" | "result";

interface CompletionStatus {
  passed: boolean;
  quiz_score: number;
  quiz_total: number;
  completed_at: string;
}

export default function FinancialLiteracyPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [phase, setPhase] = useState<Phase>("lessons");
  const [lessonIndex, setLessonIndex] = useState(0);
  const [readLessons, setReadLessons] = useState<Set<number>>(new Set());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(10).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ passed: boolean; quiz_score: number; message: string } | null>(null);
  const [existingCompletion, setExistingCompletion] = useState<CompletionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "";

  // Load existing completion on mount
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/financial-literacy/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setExistingCompletion(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, [token, API]);

  const markLessonRead = (idx: number) => {
    setReadLessons((prev) => new Set([...prev, idx]));
  };

  const allLessonsRead = readLessons.size >= LESSONS.length;

  const handleAnswer = (optionIdx: number) => {
    if (submitted) return;
    const next = [...answers];
    next[questionIndex] = optionIdx;
    setAnswers(next);
  };

  const handleSubmitQuiz = async () => {
    if (answers.some((a) => a === null)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/financial-literacy/submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      setResult(json.data);
      setSubmitted(true);
      setPhase("result");
    } catch {
      // silent — user stays on quiz
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1a5c2a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  // ── Already passed ─────────────────────────────────────────────────────────
  if (existingCompletion?.passed && phase !== "result") {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "24px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a5c2a", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginBottom: 24 }}>
            <ChevronLeft size={18} /> Back
          </button>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <Award size={56} color="#c8962a" style={{ marginBottom: 16 }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Financial Literacy Badge Earned</h1>
            <p style={{ color: "#555", marginBottom: 4 }}>You scored {existingCompletion.quiz_score}/{existingCompletion.quiz_total}</p>
            <p style={{ color: "#888", fontSize: 13 }}>Completed {new Date(existingCompletion.completed_at).toLocaleDateString("en-ZW", { year: "numeric", month: "long", day: "numeric" })}</p>
            <div style={{ marginTop: 24, padding: "12px 20px", background: "#f0fdf4", borderRadius: 10, border: "1px solid #bbf7d0", color: "#166534", fontSize: 14 }}>
              Your badge is active on your profile and all your sponsorship cases.
            </div>
            <button
              onClick={() => setPhase("lessons")}
              style={{ marginTop: 20, padding: "10px 24px", background: "#f4f2ee", border: "1px solid #e5e5e5", borderRadius: 8, cursor: "pointer", color: "#555", fontSize: 14 }}
            >
              Review lessons again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Result screen ──────────────────────────────────────────────────────────
  if (phase === "result" && result) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "24px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            {result.passed ? (
              <>
                <Award size={56} color="#c8962a" style={{ marginBottom: 16 }} />
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Badge Earned!</h1>
              </>
            ) : (
              <>
                <XCircle size={56} color="#dc2626" style={{ marginBottom: 16 }} />
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>Almost There</h1>
              </>
            )}
            <p style={{ color: "#555", marginBottom: 20, lineHeight: 1.6 }}>{result.message}</p>

            {/* Answer review */}
            <div style={{ textAlign: "left", marginBottom: 24 }}>
              {QUESTIONS.map((q, qi) => {
                const userAnswer = answers[qi];
                const correct = q.correct;
                const isRight = userAnswer === correct;
                return (
                  <div key={qi} style={{ marginBottom: 12, padding: 12, borderRadius: 10, background: isRight ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isRight ? "#bbf7d0" : "#fecaca"}` }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      {isRight
                        ? <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                        : <XCircle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                      }
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", marginBottom: 2 }}>Q{qi + 1}. {q.question}</p>
                        {!isRight && (
                          <p style={{ fontSize: 12, color: "#555" }}>
                            Your answer: <span style={{ color: "#dc2626" }}>{userAnswer !== null ? q.options[userAnswer] : "No answer"}</span><br />
                            Correct: <span style={{ color: "#16a34a" }}>{q.options[correct]}</span>
                          </p>
                        )}
                        <p style={{ fontSize: 12, color: "#666", marginTop: 2, fontStyle: "italic" }}>{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {result.passed ? (
              <button
                onClick={() => router.push("/player")}
                style={{ padding: "12px 28px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
              >
                Back to Player Hub
              </button>
            ) : (
              <button
                onClick={() => {
                  setPhase("lessons");
                  setLessonIndex(0);
                  setAnswers(Array(10).fill(null));
                  setQuestionIndex(0);
                  setSubmitted(false);
                  setResult(null);
                }}
                style={{ padding: "12px 28px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 10, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
              >
                Review Lessons & Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    const q = QUESTIONS[questionIndex];
    const answered = answers.filter((a) => a !== null).length;

    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "24px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <button onClick={() => setPhase("lessons")} style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a5c2a", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
            <ChevronLeft size={18} /> Back to lessons
          </button>

          {/* Progress */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#555", marginBottom: 6 }}>
              <span>Question {questionIndex + 1} of {QUESTIONS.length}</span>
              <span>{answered}/{QUESTIONS.length} answered</span>
            </div>
            <div style={{ height: 4, background: "#e5e5e5", borderRadius: 2 }}>
              <div style={{ height: 4, background: "#1a5c2a", borderRadius: 2, width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Question card */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 20, lineHeight: 1.5 }}>{q.question}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt, oi) => {
                const selected = answers[questionIndex] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(oi)}
                    style={{
                      padding: "12px 16px",
                      border: `2px solid ${selected ? "#1a5c2a" : "#e5e5e5"}`,
                      borderRadius: 10,
                      background: selected ? "#f0fdf4" : "#fff",
                      color: selected ? "#1a5c2a" : "#1a1a1a",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: selected ? 600 : 400,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ marginRight: 10, fontWeight: 700 }}>{String.fromCharCode(65 + oi)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={questionIndex === 0}
              style={{ padding: "10px 20px", border: "1px solid #e5e5e5", borderRadius: 8, background: "#fff", cursor: questionIndex === 0 ? "default" : "pointer", opacity: questionIndex === 0 ? 0.4 : 1, fontSize: 14 }}
            >
              <ChevronLeft size={16} style={{ display: "inline", verticalAlign: "middle" }} /> Prev
            </button>

            {questionIndex < QUESTIONS.length - 1 ? (
              <button
                onClick={() => setQuestionIndex((i) => i + 1)}
                style={{ padding: "10px 20px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
              >
                Next <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} />
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={answered < QUESTIONS.length || submitting}
                style={{
                  padding: "10px 24px",
                  background: answered < QUESTIONS.length ? "#9ca3af" : "#1a5c2a",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: answered < QUESTIONS.length ? "default" : "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {submitting ? "Submitting…" : answered < QUESTIONS.length ? `Answer all (${answered}/10)` : "Submit Quiz"}
              </button>
            )}
          </div>

          {/* Question dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
            {QUESTIONS.map((_, qi) => (
              <button
                key={qi}
                onClick={() => setQuestionIndex(qi)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: `2px solid ${qi === questionIndex ? "#1a5c2a" : "#e5e5e5"}`,
                  background: answers[qi] !== null ? "#1a5c2a" : "#fff",
                  color: answers[qi] !== null ? "#fff" : "#555",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {qi + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Lessons screen ─────────────────────────────────────────────────────────
  const lesson = LESSONS[lessonIndex];
  const LessonIcon = lesson.icon;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", padding: "24px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a5c2a", fontWeight: 600, background: "none", border: "none", cursor: "pointer", marginBottom: 16 }}>
          <ChevronLeft size={18} /> Back
        </button>

        {/* Header */}
        <div style={{ background: "#1a5c2a", borderRadius: 16, padding: "20px 24px", marginBottom: 20, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BookOpen size={28} color="#f0b429" />
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Financial Literacy</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 }}>Complete all 5 lessons, then pass the 10-question quiz (80%) to earn your badge</p>
            </div>
          </div>

          {/* Lesson progress dots */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {LESSONS.map((l, li) => (
              <button
                key={li}
                onClick={() => { setLessonIndex(li); markLessonRead(li); }}
                title={l.title}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: `2px solid ${li === lessonIndex ? "#f0b429" : "rgba(255,255,255,0.3)"}`,
                  background: readLessons.has(li) ? "#f0b429" : "rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {readLessons.has(li)
                  ? <CheckCircle2 size={16} color="#1a5c2a" />
                  : <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{li + 1}</span>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Lesson card */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${lesson.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LessonIcon size={24} color={lesson.color} />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Lesson {lessonIndex + 1} of {LESSONS.length}</p>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{lesson.title}</h2>
            </div>
          </div>

          <div style={{ color: "#374151", fontSize: 15, lineHeight: 1.75 }}>
            {lesson.body.split("\n\n").map((para, pi) => {
              if (para.startsWith("**") && para.endsWith("**")) {
                return <p key={pi} style={{ fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>{para.replace(/\*\*/g, "")}</p>;
              }
              // Render inline bold
              const parts = para.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={pi} style={{ marginBottom: 14 }}>
                  {parts.map((part, partIdx) =>
                    part.startsWith("**") && part.endsWith("**")
                      ? <strong key={partIdx}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              );
            })}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button
            onClick={() => { setLessonIndex((i) => Math.max(0, i - 1)); }}
            disabled={lessonIndex === 0}
            style={{ padding: "10px 20px", border: "1px solid #e5e5e5", borderRadius: 8, background: "#fff", cursor: lessonIndex === 0 ? "default" : "pointer", opacity: lessonIndex === 0 ? 0.4 : 1, fontSize: 14 }}
          >
            <ChevronLeft size={16} style={{ display: "inline", verticalAlign: "middle" }} /> Prev
          </button>

          {lessonIndex < LESSONS.length - 1 ? (
            <button
              onClick={() => { markLessonRead(lessonIndex); setLessonIndex((i) => i + 1); }}
              style={{ padding: "10px 20px", background: "#1a5c2a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              Next lesson <ChevronRight size={16} style={{ display: "inline", verticalAlign: "middle" }} />
            </button>
          ) : (
            <button
              onClick={() => { markLessonRead(lessonIndex); }}
              style={{ padding: "10px 20px", background: readLessons.has(lessonIndex) ? "#f0fdf4" : "#1a5c2a", color: readLessons.has(lessonIndex) ? "#16a34a" : "#fff", border: `1px solid ${readLessons.has(lessonIndex) ? "#bbf7d0" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
            >
              {readLessons.has(lessonIndex) ? <><CheckCircle2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Read</> : "Mark as read"}
            </button>
          )}
        </div>

        {/* Take quiz CTA */}
        <div style={{
          background: allLessonsRead ? "#1a5c2a" : "#f4f2ee",
          border: allLessonsRead ? "none" : "2px dashed #d1d5db",
          borderRadius: 14,
          padding: 20,
          textAlign: "center",
          transition: "all 0.3s",
        }}>
          {allLessonsRead ? (
            <>
              <Trophy size={28} color="#f0b429" style={{ marginBottom: 8 }} />
              <p style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>You&apos;re ready for the quiz!</p>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 16 }}>10 questions — score 8 or more to earn your badge</p>
              <button
                onClick={() => setPhase("quiz")}
                style={{ padding: "12px 32px", background: "#f0b429", color: "#1a3a1a", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 15 }}
              >
                Start Quiz
              </button>
            </>
          ) : (
            <>
              <BookOpen size={24} color="#9ca3af" style={{ marginBottom: 8 }} />
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 4 }}>Read all {LESSONS.length} lessons to unlock the quiz</p>
              <p style={{ color: "#9ca3af", fontSize: 12 }}>{readLessons.size}/{LESSONS.length} lessons read</p>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
