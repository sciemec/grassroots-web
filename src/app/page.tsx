"use client";

import Link from "next/link";
import AuthRedirect from "@/components/ui/AuthRedirect";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { SchoolPitchSection } from "@/components/landing/SchoolPitchSection";
import { AdBanner } from "@/components/ui/AdBanner";
import ThutoChatVisitor from "@/components/thuto/ThutoChatVisitor";
import { ApkDownloadButton } from "@/components/ui/apk-download-button";
import { ZimPresidentBanner, ZimIndependenceSection } from "@/components/ui/zim-independence";
import {
  Trophy, ChevronRight, Zap, Star, Heart,
  Brain, Activity, Video, BarChart3, Globe, Shield,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   LANDING PAGE — Concept B (light palette)
   Background: #f4f2ee  |  Cards: white  |  Primary: #1a5c2a  |  Accent: #c8962a
   ───────────────────────────────────────────────────────────────────────── */

const SPORTS = [
  "⚽ Football", "🏉 Rugby", "🏃 Athletics", "🏐 Netball",
  "🏀 Basketball", "🏏 Cricket", "🏊 Swimming", "🎾 Tennis",
  "🏐 Volleyball", "🏑 Hockey",
];

const HUB_CARDS = [
  {
    title: "Player Hub",
    sub: "Build your profile. Get scouted.",
    bg: "linear-gradient(135deg, #1a5c2a 0%, #2e7d32 100%)",
    href: "/register?role=player",
    cta: "Join as Player",
  },
  {
    title: "Coach Hub",
    sub: "Squad tools. Live match analysis.",
    bg: "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
    href: "/register?role=coach",
    cta: "Join as Coach",
  },
  {
    title: "Scout Hub",
    sub: "Discover talent. Generate reports.",
    bg: "linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)",
    href: "/register?role=scout",
    cta: "Join as Scout",
  },
  {
    title: "Fan Hub",
    sub: "Follow players. Watch highlights.",
    bg: "linear-gradient(135deg, #c8962a 0%, #e6a817 100%)",
    href: "/register?role=fan",
    cta: "Join as Fan",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Coaching (THUTO)",
    desc: "Zimbabwe's first AI sports coach. Training plans, EQ support, and live match insights — all in your pocket.",
  },
  {
    icon: Activity,
    title: "Biomechanics Analysis",
    desc: "ML Kit pose detection in the mobile app scores every drill rep. Coaches see real form data in the Scout Hub.",
  },
  {
    icon: Video,
    title: "Match Eye Video AI",
    desc: "Upload a match video. Gemini 1.5 Pro watches the full footage. Claude writes the tactical report.",
  },
  {
    icon: BarChart3,
    title: "Talent Leaderboard",
    desc: "THUTO ranks every player by projected peak level — from amateur to continental. Public. Filterable. Free.",
  },
  {
    icon: Globe,
    title: "The Arena",
    desc: "A social graph for Zimbabwean sport. Post milestones, connect with coaches, apply to talent board listings.",
  },
  {
    icon: Shield,
    title: "Verified Profiles",
    desc: "Selfie + ID document verification. QR code on every approved profile — scouts scan to confirm authenticity.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "#6b7280",
    features: ["Player profile", "Basic stats", "THUTO AI (10 msgs/day)", "Arena feed access"],
    cta: "Get Started",
    href: "/register",
    primary: false,
  },
  {
    name: "Pro",
    price: "$25",
    period: "/ month",
    color: "#1a5c2a",
    features: ["Everything in Free", "Unlimited THUTO AI", "Scout PDF reports", "Video analysis", "Chemistry matrix", "Priority support"],
    cta: "Start Free Trial",
    href: "/register",
    primary: true,
  },
  {
    name: "School",
    price: "$10",
    period: "/ month",
    color: "#1565c0",
    features: ["Up to 3 sports", "20 video uploads/month", "NASH/NAPH leagues", "Coach + player accounts", "Team analytics"],
    cta: "Register School",
    href: "/register?role=coach&school=true",
    primary: false,
  },
];

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: "#f4f2ee", minHeight: "100vh", color: "#1a1a1a" }}>
      <AuthRedirect />
      <PublicNavbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            backgroundColor: "rgba(26,92,42,0.08)", borderRadius: 999,
            padding: "6px 16px", marginBottom: "1.5rem",
            fontSize: "0.8rem", fontWeight: 600, color: "#1a5c2a",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#1a5c2a", display: "inline-block" }} />
            Zimbabwe&apos;s First AI Sports Platform
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: "1.25rem", color: "#1a1a1a" }}>
            Train Anywhere in Zimbabwe.{" "}
            <span style={{ color: "#1a5c2a" }}>Use AI to Get Recognized.</span>
          </h1>

          <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "#555", maxWidth: 580, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            GrassRoots Sports gives every Zimbabwean athlete, coach, and scout the tools
            that only elite clubs could previously afford — across all 10 major sports.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            <Link href="/register" style={{
              backgroundColor: "#1a5c2a", color: "#fff",
              padding: "14px 32px", borderRadius: 12, fontWeight: 700,
              fontSize: "1rem", textDecoration: "none", display: "inline-flex",
              alignItems: "center", gap: 6,
            }}>
              Get Started Free <ChevronRight size={16} />
            </Link>
            <Link href="/login" style={{
              backgroundColor: "#fff", color: "#1a5c2a",
              border: "2px solid #1a5c2a",
              padding: "14px 32px", borderRadius: 12, fontWeight: 700,
              fontSize: "1rem", textDecoration: "none",
            }}>
              Sign In
            </Link>
          </div>

          <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { value: "10", label: "Sports" },
              { value: "10+", label: "Provinces" },
              { value: "AI", label: "Powered" },
              { value: "Free", label: "To Start" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1a5c2a" }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "#888", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPORTS STRIP ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "1.25rem 0", overflowX: "auto" }}>
        <div style={{ display: "flex", gap: 10, padding: "0 1.5rem", width: "max-content", margin: "0 auto" }}>
          {SPORTS.map((s) => (
            <span key={s} style={{
              backgroundColor: "rgba(26,92,42,0.07)", color: "#1a5c2a",
              padding: "6px 16px", borderRadius: 999, fontSize: "0.85rem",
              fontWeight: 600, whiteSpace: "nowrap",
            }}>
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* ── HUB CARDS ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Choose Your Hub
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
          One platform. Four roles. All Zimbabwean sports.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {HUB_CARDS.map((card) => (
            <Link key={card.title} href={card.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: card.bg, borderRadius: 16, padding: "1.5rem",
                minHeight: 140, display: "flex", flexDirection: "column",
                justifyContent: "space-between", cursor: "pointer",
                transition: "transform 0.15s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{card.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.78rem" }}>{card.sub}</div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.78rem", fontWeight: 600, marginTop: 12 }}>
                  {card.cta} →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── SCHOOL PITCH ──────────────────────────────────────────────────── */}
      <SchoolPitchSection />

      {/* ── AD BANNER ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <AdBanner slot="landing-mid" />
      </div>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Tools That Change the Game
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2.5rem" }}>
          Everything a Zimbabwean athlete needs. Nothing they don&apos;t.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card-african" style={{
                backgroundColor: "#fff", borderRadius: 16, padding: "1.5rem",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  backgroundColor: "rgba(26,92,42,0.09)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1rem",
                }}>
                  <Icon size={20} color="#1a5c2a" />
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: "#666", fontSize: "0.85rem", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── THUTO AI HIGHLIGHT ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              backgroundColor: "rgba(26,92,42,0.08)", borderRadius: 999,
              padding: "6px 14px", marginBottom: "1rem",
              fontSize: "0.78rem", fontWeight: 600, color: "#1a5c2a",
            }}>
              <Zap size={13} /> AI COACH
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
              Meet THUTO — Your AI Sports Coach
            </h2>
            <p style={{ color: "#555", lineHeight: 1.7, marginBottom: "1.25rem", fontSize: "0.92rem" }}>
              THUTO understands Zimbabwean sport. It speaks your language — Shona, Ndebele, or English.
              It follows FIFA methodology, knows every player profile, and never stops coaching.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
              {["Personalised training plans", "Emotional intelligence support", "Formation diagrams in chat", "Shona & Ndebele responses"].map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.88rem", color: "#444" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "rgba(26,92,42,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Star size={10} color="#1a5c2a" fill="#1a5c2a" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{
              backgroundColor: "#1a5c2a", color: "#fff",
              padding: "12px 24px", borderRadius: 10, fontWeight: 700,
              fontSize: "0.9rem", textDecoration: "none", display: "inline-block",
            }}>
              Try THUTO Free
            </Link>
          </div>

          {/* Chat preview */}
          <div style={{ flex: "1 1 260px" }}>
            <div style={{
              backgroundColor: "#f4f2ee", borderRadius: 16, padding: "1.25rem",
              border: "1px solid rgba(0,0,0,0.08)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {[
                { from: "player", text: "Coach, I keep losing the ball under pressure. What should I do?" },
                { from: "thuto", text: "Ndinzwa izvozvo. Work on receiving on your front foot — toes down, ankle locked. This lets you play away from pressure immediately. Try our Front Foot Passing drill today. 🦁" },
                { from: "player", text: "Can you show me a 4-3-3 formation?" },
                { from: "thuto", text: "Yes! Here is how 4-3-3 looks with the press triggers activated..." },
              ].map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.from === "player" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
                    fontSize: "0.82rem", lineHeight: 1.5,
                    backgroundColor: msg.from === "player" ? "#1a5c2a" : "#fff",
                    color: msg.from === "player" ? "#fff" : "#1a1a1a",
                    border: msg.from === "thuto" ? "1px solid rgba(0,0,0,0.07)" : "none",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    {msg.from === "thuto" && (
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1a5c2a", marginBottom: 4 }}>THUTO AI</div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Simple, Honest Pricing
        </h2>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "2.5rem" }}>
          Start free. Upgrade when you&apos;re ready.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              backgroundColor: plan.primary ? plan.color : "#fff",
              borderRadius: 20, padding: "2rem",
              border: plan.primary ? "none" : "1px solid rgba(0,0,0,0.08)",
              boxShadow: plan.primary ? "0 8px 32px rgba(26,92,42,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
              display: "flex", flexDirection: "column",
            }}>
              {plan.primary && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4, marginBottom: "0.75rem",
                  backgroundColor: "#c8962a", color: "#fff", borderRadius: 999,
                  padding: "4px 12px", fontSize: "0.72rem", fontWeight: 700, width: "fit-content",
                }}>
                  <Heart size={11} fill="#fff" /> MOST POPULAR
                </div>
              )}
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: plan.primary ? "#fff" : "#1a1a1a", marginBottom: 4 }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: "1.25rem" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: plan.primary ? "#fff" : plan.color }}>{plan.price}</span>
                <span style={{ color: plan.primary ? "rgba(255,255,255,0.7)" : "#888", fontSize: "0.85rem", marginLeft: 4 }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.85rem", color: plan.primary ? "rgba(255,255,255,0.88)" : "#555" }}>
                    <span style={{ marginTop: 2, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{
                display: "block", textAlign: "center",
                backgroundColor: plan.primary ? "#c8962a" : plan.color,
                color: "#fff", padding: "12px 0", borderRadius: 10,
                fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── ZIM INDEPENDENCE ──────────────────────────────────────────────── */}
      <ZimIndependenceSection />

      {/* ── DOWNLOAD APP ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)", borderBottom: "1px solid rgba(0,0,0,0.06)", padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📱</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Download the Mobile App
          </h2>
          <p style={{ color: "#555", lineHeight: 1.7, marginBottom: "1.75rem", fontSize: "0.92rem" }}>
            The GrassRoots Sports APK includes ML Kit biomechanics analysis, offline training,
            and THUTO AI coaching — optimised for Zimbabwe&apos;s 2G/3G networks.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <ApkDownloadButton />
            <Link href="/register" style={{
              backgroundColor: "#f4f2ee", color: "#1a5c2a",
              border: "2px solid #1a5c2a",
              padding: "12px 24px", borderRadius: 10, fontWeight: 700,
              fontSize: "0.9rem", textDecoration: "none",
            }}>
              Use Web App
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <div style={{
          backgroundColor: "#1a5c2a", borderRadius: 24, padding: "3rem 2rem", textAlign: "center",
          backgroundImage: "repeating-linear-gradient(-45deg, transparent 0px, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 10px)",
        }}>
          <Trophy size={28} color="#c8962a" style={{ marginBottom: "1rem" }} />
          <h2 style={{ color: "#fff", fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Ready to Get Recognized?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7, marginBottom: "2rem", maxWidth: 480, margin: "0 auto 2rem", fontSize: "0.95rem" }}>
            Join thousands of Zimbabwean athletes, coaches, and scouts already using GrassRoots Sports. It&apos;s free to start.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" style={{
              backgroundColor: "#c8962a", color: "#fff",
              padding: "14px 32px", borderRadius: 12, fontWeight: 700,
              fontSize: "1rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              Create Free Account <ChevronRight size={16} />
            </Link>
            <Link href="/arena" style={{
              backgroundColor: "rgba(255,255,255,0.12)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.25)",
              padding: "14px 32px", borderRadius: 12, fontWeight: 700,
              fontSize: "1rem", textDecoration: "none",
            }}>
              Browse The Arena
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "#fff", borderTop: "1px solid rgba(0,0,0,0.08)", padding: "3rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap", marginBottom: "2rem", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#1a5c2a", marginBottom: 8 }}>
                GrassRoots Sports
              </div>
              <p style={{ color: "#888", fontSize: "0.82rem", lineHeight: 1.6, maxWidth: 220 }}>
                Zimbabwe&apos;s first AI-powered grassroots sports platform. Train anywhere. Get recognized.
              </p>
            </div>
            {[
              {
                heading: "Platform",
                links: [
                  { label: "The Arena", href: "/arena" },
                  { label: "Talent Leaderboard", href: "/talent-leaderboard" },
                  { label: "Business Hub", href: "/business-hub" },
                  { label: "Fan Hub", href: "/fan-hub" },
                ],
              },
              {
                heading: "Register",
                links: [
                  { label: "Player", href: "/register?role=player" },
                  { label: "Coach", href: "/register?role=coach" },
                  { label: "Scout", href: "/register?role=scout" },
                  { label: "Fan", href: "/register?role=fan" },
                ],
              },
              {
                heading: "Legal",
                links: [
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ],
              },
            ].map((col) => (
              <div key={col.heading} style={{ flex: "0 0 auto" }}>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#333", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {col.heading}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} style={{ color: "#666", fontSize: "0.85rem", textDecoration: "none" }}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={{ color: "#999", fontSize: "0.8rem" }}>© 2026 GrassRoots Sports. All rights reserved.</span>
            <span style={{ color: "#999", fontSize: "0.8rem" }}>Made with ❤️ in Zimbabwe 🇿🇼</span>
          </div>
        </div>
      </footer>

      <ZimPresidentBanner />
      <ThutoChatVisitor />
    </div>
  );
}
