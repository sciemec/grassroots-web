"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Shield, Link2, BarChart3, Bell, Heart, ChevronRight,
  Activity, Trophy, AlertTriangle, MessageCircle
} from "lucide-react";

export default function ParentHubPage() {
  const router   = useRouter();
  const user        = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.push("/login"); return; }
    if ((user.role as string) !== "guardian" && (user.role as string) !== "parent") {
      // Allow admins to preview
      if (user.role !== "admin") router.push("/");
    }
  }, [hasHydrated, user, router]);

  if (!hasHydrated || !user) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <header style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e5e5e5",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={20} color="#1a5c2a" />
              <span style={{ fontWeight: 800, fontSize: 16, color: "#1a5c2a" }}>
                Guardian Hub
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#6b7280", backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px" }}>
              {user.name}
            </span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 6 }}>
            Welcome, {user.name?.split(" ")[0]}
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.5 }}>
            Stay connected to your child&apos;s athletic journey — from training progress to injury alerts.
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>

          <Link href="/parent/dashboard" style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "#1a5c2a",
              borderRadius: 16,
              padding: "20px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={22} color="#f0b429" />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>My Child&apos;s Dashboard</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Training, scores, milestones &amp; alerts</p>
                </div>
              </div>
              <ChevronRight size={18} color="rgba(255,255,255,0.6)" />
            </div>
          </Link>

          <Link href="/parent/link" style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 16,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10,
                  backgroundColor: "#eff6ff",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Link2 size={18} color="#2563eb" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 2 }}>Link a Child</p>
                  <p style={{ fontSize: 12, color: "#6b7280" }}>Enter the 6-digit invite code from your child</p>
                </div>
              </div>
              <ChevronRight size={16} color="#9ca3af" />
            </div>
          </Link>

          <Link href="/parent/subscribe" style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "#fff",
              border: "1px solid #fde68a",
              borderRadius: 16,
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10,
                  backgroundColor: "#fffbeb",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bell size={18} color="#d97706" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 2 }}>
                    Guardian Addon
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700,
                      backgroundColor: "#fef3c7", color: "#92400e",
                      padding: "1px 7px", borderRadius: 20 }}>$2/mo</span>
                  </p>
                  <p style={{ fontSize: 12, color: "#6b7280" }}>WhatsApp alerts, injury flags &amp; weekly reports</p>
                </div>
              </div>
              <ChevronRight size={16} color="#9ca3af" />
            </div>
          </Link>
        </div>

        {/* Feature cards */}
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280",
          textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
          What you can see
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
          {[
            { icon: Activity,       color: "#15803d", bg: "#dcfce7", label: "Movement Scores",    desc: "Biomechanics AI scores from training sessions" },
            { icon: Trophy,         color: "#b45309", bg: "#fef3c7", label: "Milestones",         desc: "Goals reached, badges earned, level-ups" },
            { icon: AlertTriangle,  color: "#dc2626", bg: "#fee2e2", label: "Injury Flags",       desc: "Fatigue + risk alerts when training load is high" },
            { icon: MessageCircle,  color: "#1d4ed8", bg: "#dbeafe", label: "Weekly Reports",     desc: "WhatsApp summary every Sunday morning" },
            { icon: Heart,          color: "#be185d", bg: "#fce7f3", label: "Training Streaks",   desc: "Consistency and adherence to their plan" },
            { icon: Shield,         color: "#1a5c2a", bg: "#dcfce7", label: "Privacy Controls",  desc: "You see what your child chooses to share" },
          ].map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} style={{
              backgroundColor: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 14,
              padding: "16px 14px",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: bg,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={16} color={color} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid #e5e5e5",
          borderRadius: 16,
          padding: "20px 20px",
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, color: "#111",
            textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
            How to get started
          </h2>
          {[
            { step: "1", text: "Ask your child to open their GrassRoots app and generate an invite code from their profile" },
            { step: "2", text: "Tap \"Link a Child\" above and enter the 6-character code" },
            { step: "3", text: "Your dashboard activates immediately. Upgrade to receive WhatsApp alerts for $2/month" },
          ].map(({ step, text }) => (
            <div key={step} style={{ display: "flex", gap: 12, marginBottom: step === "3" ? 0 : 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%",
                backgroundColor: "#1a5c2a", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, flexShrink: 0 }}>
                {step}
              </div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, paddingTop: 3 }}>{text}</p>
            </div>
          ))}
        </div>

        {/* Zimbabwe note */}
        <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5 }}>
          Built for Zimbabwean families. Payment via EcoCash &amp; InnBucks.
          <br />Your child&apos;s data is private by default.
        </p>
      </div>
    </div>
  );
}
