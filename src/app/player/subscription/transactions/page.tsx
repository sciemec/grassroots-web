"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { Sidebar } from "@/components/layout/sidebar";
import api from "@/lib/api";

interface Transaction {
  id: string;
  amount_usd: string;
  payment_method: string;
  status: string;
  reference_number: string;
  attempted_at: string;
  completed_at: string | null;
}

interface Paginated {
  data: Transaction[];
  current_page: number;
  last_page: number;
  total: number;
}

const METHOD_LABELS: Record<string, string> = {
  ecocash:  "EcoCash",
  innbucks: "InnBucks",
  onemoney: "OneMoney",
  stripe:   "Card (Stripe)",
  card:     "Card",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-700">
      <CheckCircle2 className="h-3 w-3" /> Completed
    </span>
  );
  if (status === "failed" || status === "disputed") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
      <XCircle className="h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZW", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function TransactionsPage() {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [page, setPage]             = useState(1);
  const [data, setData]             = useState<Paginated | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!hasHydrated) return;
    setLoading(true);
    setError("");
    api.get<Paginated>(`/subscription/transactions?page=${page}`)
      .then((res) => setData(res.data))
      .catch(() => setError("Could not load transactions. Please try again."))
      .finally(() => setLoading(false));
  }, [page, hasHydrated]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/player/subscription" className="rounded-lg p-1.5 hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Transaction History</h1>
            <p className="text-sm text-muted-foreground">All your payment records</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border bg-card" />
            ))}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <Link href="/player/subscription" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              View subscription plans
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Reference</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.data.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.attempted_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {METHOD_LABELS[tx.payment_method] ?? tx.payment_method}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {tx.reference_number}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        ${Number(tx.amount_usd).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.last_page > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <p>{data.total} transaction{data.total !== 1 ? "s" : ""}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 1}
                    className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-40 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>Page {page} of {data.last_page}</span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === data.last_page}
                    className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-40 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
