"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Clock, ArrowRight, ArrowLeft, Dumbbell, Star } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://bhora-ai.onrender.com/api/v1";

interface WarmupProgram {
  id: string;
  code: string;
  name: string;
  description: string | null;
  source: string | null;
  total_duration_minutes: number | null;
}

function backHref(role: string | undefined): string {
  if (role === "coach") return "/coach";
  if (role === "player") return "/player";
  if (role === "fan") return "/fan";
  return "/dashboard";
}

export default function WarmupListPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const [programs, setPrograms] = useState<WarmupProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/warmup-programs`, {
      headers: { Authorization: `Bearer ${useAuthStore.getState().token ?? ""}` },
    })
      .then((r) => r.json())
      .then((j) => setPrograms(Array.isArray(j.data) ? j.data : []))
      .catch(() => setError("Could not load warm-up programmes."))
      .finally(() => setLoading(false));
  }, [token]);

  const role = (user as { role?: string } | null)?.role;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Nav */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "12px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={backHref(role)} style={{ color: "#6b7280", display: "flex", alignItems: "center", gap: 4, textDecoration: "none", fontSize: 14 }}>
          <ArrowLeft size={15} /> Dashboard
        </Link>
        <span style={{ color: "#d1d5db" }}>›</span>
        <span style={{ fontWeight: 700, color: "#1a5c2a", fontSize: 14 }}>Warm-Up Programmes</span>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "28px 16px 64px" }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#111" }}>Warm-Up Programmes</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            Guided injury-prevention and activation routines. Follow step-by-step before training or matches.
          </p>
        </div>

        {/* FIFA 11+ — hardcoded featured card */}
        <FeaturedProgramCard />

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div style={{ textAlign: "center", padding: "48px 24px", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#dc2626", fontWeight: 600, fontSize: 14, margin: 0 }}>{error}</p>
          </div>
        ) : programs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
            <Dumbbell size={40} color="#d1d5db" style={{ margin: "0 auto 14px", display: "block" }} />
            <p style={{ fontWeight: 700, fontSize: 15, color: "#374151", margin: "0 0 6px" }}>No programmes yet</p>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>Warm-up programmes will appear here once seeded.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {programs.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedProgramCard() {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 14 }}>
      <div style={{ height: 4, backgroundColor: "#1a5c2a" }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111", lineHeight: 1.3 }}>FIFA 11+</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#92400e", backgroundColor: "#fffbeb", padding: "3px 8px", borderRadius: 20, border: "1px solid #fde68a" }}>
              <Star size={10} /> Featured
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0", whiteSpace: "nowrap" }}>
              <Clock size={11} /> 20 min
            </span>
          </div>
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>
          FIFA&apos;s complete injury-prevention warm-up. 3 parts: Running · Strength &amp; Balance · High-Speed Running.
          Reduces injury rates by up to 50% when done consistently.
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>Source: FIFA Medical Assessment and Research Centre (F-MARC)</p>
        <Link
          href="/warmup/the-11-plus"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            backgroundColor: "#1a5c2a", color: "#fff",
            padding: "10px 20px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}
        >
          Start Programme <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function ProgramCard({ program }: { program: WarmupProgram }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
      {/* Green accent bar */}
      <div style={{ height: 4, backgroundColor: "#1a5c2a" }} />
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111", lineHeight: 1.3 }}>{program.name}</h2>
          {program.total_duration_minutes && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "#1a5c2a", backgroundColor: "#f0fdf4", padding: "4px 10px", borderRadius: 20, border: "1px solid #bbf7d0", whiteSpace: "nowrap", flexShrink: 0 }}>
              <Clock size={11} /> {program.total_duration_minutes} min
            </span>
          )}
        </div>

        {program.description && (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#4b5563", lineHeight: 1.55 }}>{program.description}</p>
        )}

        {program.source && (
          <p style={{ margin: "0 0 16px", fontSize: 11, color: "#9ca3af", fontStyle: "italic" }}>{program.source}</p>
        )}

        <Link
          href={`/warmup/${program.id}`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            backgroundColor: "#1a5c2a", color: "#fff",
            padding: "10px 20px", borderRadius: 10,
            textDecoration: "none", fontWeight: 700, fontSize: 13,
          }}
        >
          Start Programme <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1, 2].map((i) => (
        <div key={i} style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ height: 4, backgroundColor: "#e5e7eb" }} />
          <div style={{ padding: "20px 24px" }}>
            <div style={{ height: 18, width: "60%", backgroundColor: "#e5e7eb", borderRadius: 6, marginBottom: 12 }} />
            <div style={{ height: 13, width: "85%", backgroundColor: "#f1f5f9", borderRadius: 5, marginBottom: 6 }} />
            <div style={{ height: 13, width: "70%", backgroundColor: "#f1f5f9", borderRadius: 5, marginBottom: 18 }} />
            <div style={{ height: 36, width: 140, backgroundColor: "#e5e7eb", borderRadius: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
