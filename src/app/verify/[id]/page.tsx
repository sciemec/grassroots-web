import { notFound } from "next/navigation";

interface VerifyData {
  id: string;
  first_name: string;
  surname: string;
  date_of_birth: string;
  sport: string | null;
  position: string | null;
  organisation_name: string;
  registered_at: string;
  match_status: "unmatched" | "pending_confirmation" | "confirmed" | "standalone_confirmed";
  confirmed_at: string | null;
}

async function getRegistration(id: string): Promise<VerifyData | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/verify/${id}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default async function VerifyPage({
  params,
}: {
  params: { id: string };
}) {
  const reg = await getRegistration(params.id);

  if (!reg) {
    notFound();
  }

  const isConfirmed = reg.match_status === "confirmed" || reg.match_status === "standalone_confirmed";
  const isStandalone = reg.match_status === "standalone_confirmed";
  const isPending = reg.match_status === "pending_confirmation";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f2ee",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: "#1a5c2a",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "#c8962a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            color: "#fff",
            fontSize: 16,
          }}
        >
          G
        </div>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>
          GrassRoots Sports
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            marginLeft: 4,
          }}
        >
          — Registration Verification
        </span>
      </header>

      {/* Main */}
      <main
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "32px 16px 64px",
        }}
      >
        {/* Status banner */}
        <div
          style={{
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            backgroundColor: isConfirmed
              ? "#f0fdf4"
              : isPending
              ? "#fefce8"
              : "#f8fafc",
            border: `2px solid ${
              isConfirmed ? "#86efac" : isPending ? "#fde047" : "#e2e8f0"
            }`,
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              backgroundColor: isConfirmed
                ? "#dcfce7"
                : isPending
                ? "#fef9c3"
                : "#f1f5f9",
            }}
          >
            {isConfirmed ? "✅" : isPending ? "⏳" : "📋"}
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: isConfirmed
                  ? "#166534"
                  : isPending
                  ? "#854d0e"
                  : "#1e293b",
                marginBottom: 4,
              }}
            >
              {isStandalone
                ? "Confirmed by Academy"
                : isConfirmed
                ? "Verified — Identity Linked"
                : isPending
                ? "Registered — Awaiting Confirmation"
                : "Registered — Awaiting Platform Match"}
            </div>
            <div
              style={{
                fontSize: 13,
                color: isConfirmed
                  ? "#15803d"
                  : isPending
                  ? "#92400e"
                  : "#64748b",
                lineHeight: 1.5,
              }}
            >
              {isStandalone
                ? `This registration has been manually confirmed by ${reg.organisation_name}. The record is complete and the certificate is valid.`
                : isConfirmed
                ? "This player's registration has been verified and their identity confirmed on the GrassRoots Sports platform."
                : isPending
                ? "This registration is awaiting final confirmation from the registering coach."
                : "This registration is authentic. The player has not yet joined GrassRoots Sports."}
            </div>
          </div>
        </div>

        {/* Certificate card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)",
            marginBottom: 24,
          }}
        >
          {/* Card header stripe */}
          <div
            style={{
              background: "linear-gradient(135deg, #1a5c2a 0%, #2d7a42 100%)",
              padding: "20px 24px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#c8962a",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 4,
              }}
            >
              GrassRoots Sports · Official Record
            </div>
            <div
              style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}
            >
              {reg.first_name} {reg.surname}
            </div>
          </div>

          {/* Fields */}
          <div style={{ padding: "20px 24px" }}>
            <Field label="Date of Birth" value={formatDate(reg.date_of_birth)} />
            {reg.sport && <Field label="Sport" value={reg.sport} />}
            {reg.position && <Field label="Position" value={reg.position} />}
            <Field label="Registered With" value={reg.organisation_name} />
            <Field
              label="Registration Date"
              value={formatDateTime(reg.registered_at)}
            />
            {isConfirmed && reg.confirmed_at && (
              <Field
                label="Confirmed On Platform"
                value={formatDateTime(reg.confirmed_at)}
              />
            )}
            <Field
              label="GRS Reference"
              value={`GRS-${reg.id.replace(/-/g, "").substring(0, 8).toUpperCase()}`}
              mono
            />
          </div>

          {/* Footer stripe */}
          <div
            style={{
              borderTop: "1px solid #f1f5f9",
              padding: "12px 24px",
              backgroundColor: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              Verified at grassrootssports.live
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color:
                  isConfirmed
                    ? "#16a34a"
                    : isPending
                    ? "#d97706"
                    : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {isStandalone
                ? "● Academy Confirmed"
                : isConfirmed
                ? "● Confirmed"
                : isPending
                ? "● Pending"
                : "● Registered"}
            </span>
          </div>
        </div>

        {/* What this means */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            About This Record
          </div>
          <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>
            This page confirms that{" "}
            <strong>
              {reg.first_name} {reg.surname}
            </strong>{" "}
            was officially registered by{" "}
            <strong>{reg.organisation_name}</strong> on{" "}
            <strong>{formatDate(reg.registered_at)}</strong>. This record serves as
            provenance documentation — a timestamped entry on the GrassRoots Sports
            platform establishing where and when this player was active. It cannot be
            backdated or altered after creation.
          </p>
        </div>

        {/* CTA */}
        <div
          style={{
            textAlign: "center",
            padding: "24px 16px",
            borderRadius: 12,
            backgroundColor: "#1a5c2a",
          }}
        >
          <div
            style={{ color: "#fff", fontWeight: 600, fontSize: 15, marginBottom: 6 }}
          >
            Are you {reg.first_name}?
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 13,
              marginBottom: 16,
              lineHeight: 1.5,
            }}
          >
            Claim your profile on GrassRoots Sports and link this provenance record
            to your Talent Passport — free, always.
          </div>
          <a
            href="https://grassrootssports.live/register"
            style={{
              display: "inline-block",
              backgroundColor: "#c8962a",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            Create Your Free Profile
          </a>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#94a3b8",
            marginTop: 24,
            lineHeight: 1.6,
          }}
        >
          This is an official verification page generated by GrassRoots Sports.
          <br />
          Record ID: {reg.id}
        </p>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "8px 0",
        borderBottom: "1px solid #f1f5f9",
        gap: 16,
      }}
    >
      <span style={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: "#1e293b",
          fontWeight: 500,
          textAlign: "right",
          fontFamily: mono ? "monospace" : undefined,
        }}
      >
        {value}
      </span>
    </div>
  );
}
