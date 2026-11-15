"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, MinusCircle,
  AlertCircle, Handshake, ExternalLink, Trash2, FileText,
} from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type IntroCase = {
  id: string;
  title: string;
  category: string;
  sport: string;
  cover_image_url: string | null;
  status: string;
};

type Intro = {
  id: string;
  case_id: string;
  offer_cents: number | null;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "withdrawn" | "expired";
  responded_at: string | null;
  response_note: string | null;
  intro_sent: boolean;
  created_at: string;
  case: IntroCase;
};

const STATUS_CONFIG: Record<
  Intro["status"],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  pending:   { label: "Pending",   color: "#92400e", bg: "#fef3c7", icon: <Clock size={14} />        },
  accepted:  { label: "Accepted",  color: "#065f46", bg: "#d1fae5", icon: <CheckCircle2 size={14} /> },
  declined:  { label: "Declined",  color: "#7f1d1d", bg: "#fee2e2", icon: <XCircle size={14} />      },
  withdrawn: { label: "Withdrawn", color: "#374151", bg: "#f3f4f6", icon: <MinusCircle size={14} />  },
  expired:   { label: "Expired",   color: "#374151", bg: "#f3f4f6", icon: <AlertCircle size={14} />  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default function MyIntroductionsPage() {
  const router      = useRouter();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);

  const [intros,    setIntros]    = useState<Intro[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) { router.replace("/login"); return; }

    fetch(`${BASE}/sponsor/introductions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => setIntros(Array.isArray(json.data) ? json.data : []))
      .catch(() => setError("Could not load your introduction requests."))
      .finally(() => setLoading(false));
  }, [hasHydrated, user, token, router]);

  const handleWithdraw = async (introId: string) => {
    if (!confirm("Withdraw this introduction request?")) return;
    setWithdrawing(introId);
    try {
      const res = await fetch(`${BASE}/sponsor/introductions/${introId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIntros((prev) =>
          prev.map((i) => i.id === introId ? { ...i, status: "withdrawn" } : i)
        );
      }
    } finally {
      setWithdrawing(null);
    }
  };

  if (!hasHydrated || !user) return null;

  const active   = intros.filter((i) => i.status === "pending" || i.status === "accepted");
  const resolved = intros.filter((i) => i.status === "declined" || i.status === "withdrawn" || i.status === "expired");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f2ee" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">My Introduction Requests</h1>
            <p className="text-sm text-gray-500">Cases you have asked to connect with</p>
          </div>
          <Link
            href="/sponsorships"
            className="ml-auto rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            Browse Cases
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-8">

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && intros.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
            <Handshake size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">No introduction requests yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Browse sponsorship cases and request to connect with an athlete.
            </p>
            <Link
              href="/sponsorships"
              className="mt-4 inline-block rounded-lg px-5 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              Browse Cases
            </Link>
          </div>
        )}

        {/* Active */}
        {!loading && active.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Active ({active.length})
            </h2>
            <div className="space-y-3">
              {active.map((intro) => (
                <IntroCard
                  key={intro.id}
                  intro={intro}
                  withdrawing={withdrawing}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          </section>
        )}

        {/* Resolved */}
        {!loading && resolved.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Past ({resolved.length})
            </h2>
            <div className="space-y-3">
              {resolved.map((intro) => (
                <IntroCard
                  key={intro.id}
                  intro={intro}
                  withdrawing={withdrawing}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function IntroCard({
  intro,
  withdrawing,
  onWithdraw,
}: {
  intro: Intro;
  withdrawing: string | null;
  onWithdraw: (id: string) => void;
}) {
  const cfg = STATUS_CONFIG[intro.status];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        {/* Cover thumbnail */}
        {intro.case?.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={intro.case.cover_image_url}
            alt=""
            className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-white text-lg font-bold"
            style={{ backgroundColor: "#1a5c2a" }}
          >
            {(intro.case?.title ?? "?")[0].toUpperCase()}
          </div>
        )}

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/sponsorships/${intro.case_id}`}
              className="font-semibold text-gray-900 hover:underline truncate"
            >
              {intro.case?.title ?? "Untitled case"}
            </Link>
            <ExternalLink size={13} className="flex-shrink-0 text-gray-400" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {intro.case?.sport && <span className="capitalize">{intro.case.sport}</span>}
            {intro.case?.category && <span>· {intro.case.category}</span>}
            <span>· Submitted {formatDate(intro.created_at)}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Status badge */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ color: cfg.color, backgroundColor: cfg.bg }}
            >
              {cfg.icon}
              {cfg.label}
            </span>

            {/* Intro sent badge */}
            {intro.status === "accepted" && intro.intro_sent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                <CheckCircle2 size={12} />
                Introduction Sent
              </span>
            )}

            {/* Offer */}
            {intro.offer_cents != null && (
              <span className="text-xs text-gray-500">
                Offer: {formatCents(intro.offer_cents)}
              </span>
            )}
          </div>

          {/* Response note (declined) */}
          {intro.response_note && (
            <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 italic">
              &ldquo;{intro.response_note}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* Action row */}
      {(intro.status === "pending" || intro.status === "accepted") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          {intro.status === "accepted" && (
            <Link
              href={`/sponsorships/${intro.case_id}/introductions/${intro.id}/agreement`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "#1a5c2a" }}
            >
              <FileText size={13} />
              View Agreement
            </Link>
          )}
          <button
            onClick={() => onWithdraw(intro.id)}
            disabled={withdrawing === intro.id}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Trash2 size={13} />
            {withdrawing === intro.id ? "Withdrawing…" : "Withdraw"}
          </button>
        </div>
      )}
    </div>
  );
}
