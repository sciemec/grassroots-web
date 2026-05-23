"use client";

import Link from "next/link";
import AuthRedirect from "@/components/ui/AuthRedirect";
import {
  UserCircle2, ClipboardList, Search, Video,
  BarChart2, Network, ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────
   LANDING PAGE — Clean white palette
   Background: #fff  |  Primary: #1a5c2a  |  Accent: #c8962a
   ───────────────────────────────────────────────────────────────────────── */

const HUBS = [
  {
    icon: <UserCircle2 size={22} color="#1a5c2a" />,
    title: "Player Hub",
    desc: "THUTO AI coach, training plans, drills, development prediction, market valuation, Football Business School.",
    href: "/player",
    featured: false,
    badge: null,
  },
  {
    icon: <ClipboardList size={22} color="#1a5c2a" />,
    title: "Coach Hub",
    desc: "Squad management, AI tactical insights, live match dashboard, set piece analytics, WhatsApp match reports.",
    href: "/coach",
    featured: false,
    badge: null,
  },
  {
    icon: <Search size={22} color="#1a5c2a" />,
    title: "Scout Hub",
    desc: "National talent database — filter by sport, province, position, age, and THUTO Score. Verified scouts only.",
    href: "/scout",
    featured: false,
    badge: null,
  },
  {
    icon: <Video size={22} color="#1a5c2a" />,
    title: "Fan Hub",
    desc: "Live highlights, match clips, AI-generated analysis. Upload from any phone. Watch from anywhere.",
    href: "/fan-hub",
    featured: false,
    badge: null,
  },
  {
    icon: <BarChart2 size={22} color="#1a5c2a" />,
    title: "Analysis Hub",
    desc: "Match Eye AI video analysis — heatmaps, possession stats, xG, tactical reports from uploaded footage.",
    href: "/analyst",
    featured: false,
    badge: null,
  },
  {
    icon: <Network size={22} color="#c8962a" />,
    title: "The Arena",
    desc: "Sports social community — performance feed, club discovery, talent wanted board, direct connections.",
    href: "/arena",
    featured: true,
    badge: "New",
  },
];

const NAV_LINKS = [
  { label: "Platform", href: "/", active: true },
  { label: "Player Passport", href: "/talent-leaderboard", active: false },
  { label: "Scout Hub", href: "/scout", active: false },
  { label: "For Schools", href: "/school-leagues", active: false },
  { label: "The Arena", href: "/arena", active: false },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)", background: "#fff", color: "#111", minHeight: "100vh" }}>
      <AuthRedirect />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        background: "#fff",
        borderBottom: "3px solid #c8962a",
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        gap: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 32, flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1a5c2a" }}>
            Grassroots <span style={{ color: "#c8962a" }}>Sports</span>
          </span>
        </div>

        {/* Nav links — hidden on small screens */}
        <div style={{ display: "flex", gap: 0 }} className="landing-nav-links">
          {NAV_LINKS.map((nl) => (
            <Link
              key={nl.href}
              href={nl.href}
              style={{
                padding: "0 14px",
                height: 56,
                display: "flex",
                alignItems: "center",
                fontSize: 13,
                fontWeight: 700,
                color: nl.active ? "#1a5c2a" : "#111",
                textDecoration: "none",
                borderBottom: nl.active ? "3px solid #c8962a" : "3px solid transparent",
                marginBottom: -3,
                whiteSpace: "nowrap",
              }}
            >
              {nl.label}
            </Link>
          ))}
        </div>

        {/* Right buttons */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <Link
            href="/login"
            style={{
              padding: "7px 16px",
              border: "2px solid #1a5c2a",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              color: "#1a5c2a",
              background: "#fff",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/register/who"
            style={{
              padding: "7px 18px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: "#1a5c2a",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Join free
          </Link>
        </div>
      </nav>

      {/* ── HUBS SECTION ─────────────────────────────────────────────────── */}
      <section style={{ padding: "56px 28px 64px", background: "#fff" }}>
        <div style={{ fontSize: 11, color: "#c8962a", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontWeight: 700, textAlign: "center" }}>
          Platform
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1a5c2a", textAlign: "center", marginBottom: 6 }}>
          Six hubs. One ecosystem.
        </h1>
        <div style={{ width: 56, height: 4, background: "linear-gradient(90deg,#ce1126,#f5c518,#c8962a)", borderRadius: 2, margin: "0 auto 16px" }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: "#333", textAlign: "center", maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.8 }}>
          Everything an athlete, coach, scout, and fan needs — built together so data from a training session flows through to the feed, the scout hub, and the talent pipeline automatically.
        </p>

        {/* Hub cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          maxWidth: 880,
          margin: "0 auto",
        }}>
          {HUBS.map((hub) => (
            <div
              key={hub.href}
              style={{
                background: "#fff",
                border: hub.featured ? "2px solid #c8962a" : "1.5px solid #ccc",
                borderLeft: hub.featured ? "4px solid #f5c518" : "4px solid #c8962a",
                borderRadius: 8,
                padding: "22px 20px 18px",
              }}
            >
              {/* Icon */}
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 8,
                background: hub.featured ? "#fff8e8" : "#e8f5e9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}>
                {hub.icon}
              </div>

              {/* Title */}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1a5c2a", marginBottom: 7, display: "flex", alignItems: "center", gap: 7 }}>
                {hub.title}
                {hub.badge && (
                  <span style={{
                    fontSize: 9,
                    background: "rgba(200,150,42,0.15)",
                    color: "#c8962a",
                    padding: "2px 8px",
                    borderRadius: 8,
                    fontWeight: 700,
                    border: "1px solid rgba(200,150,42,0.4)",
                  }}>
                    {hub.badge}
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, fontWeight: 600, color: "#333", lineHeight: 1.65, marginBottom: 16 }}>
                {hub.desc}
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: "#e0e0e0", marginBottom: 12 }} />

              {/* Explore link */}
              <Link
                href={hub.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: hub.featured ? "#c8962a" : "#1a5c2a",
                  padding: "5px 14px",
                  borderRadius: 14,
                  background: hub.featured ? "#fff8e8" : "#e8f5e9",
                  border: hub.featured ? "1px solid rgba(200,150,42,0.35)" : "1px solid rgba(26,92,42,0.2)",
                  textDecoration: "none",
                }}
              >
                <span>Explore</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ background: "#0f3a1a", borderTop: "3px solid #c8962a", padding: "32px 28px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 24, maxWidth: 880, margin: "0 auto 24px" }}>
          {/* Brand */}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#c8962a", marginBottom: 4 }}>Grassroots Sports</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>grassrootssports.live</div>
          </div>

          {/* Platform */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Platform</div>
            {[
              { label: "Player Hub", href: "/player" },
              { label: "Coach Hub", href: "/coach" },
              { label: "Scout Hub", href: "/scout" },
              { label: "Fan Hub", href: "/fan-hub" },
              { label: "Analysis Hub", href: "/analyst" },
              { label: "The Arena", href: "/arena" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Features */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Features</div>
            {[
              { label: "Player Passport", href: "/talent-leaderboard" },
              { label: "THUTO AI", href: "/player/ai-coach" },
              { label: "Football Business School", href: "/player" },
              { label: "School Leagues", href: "/school-leagues" },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6, textDecoration: "none" }}>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Partners */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Partners</div>
            {[
              "Teach For Zimbabwe",
              "Ministry of Education",
            ].map((l) => (
              <div key={l} style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>{l}</div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 880, margin: "0 auto", flexWrap: "wrap", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)" }}>
            © 2026 Grassroots Sports. All rights reserved.
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#c8962a", fontStyle: "italic" }}>
            It costs your school nothing. It gives your students everything.
          </span>
        </div>
      </footer>
    </div>
  );
}
