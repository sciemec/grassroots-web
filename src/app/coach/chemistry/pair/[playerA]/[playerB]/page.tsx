"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import PairDetail, { type PairData } from "@/components/chemistry/PairDetail";
import api from "@/lib/api";

export default function ChemistryPairPage() {
  const rawParams = useParams<{ playerA: string; playerB: string }>();
  const params    = rawParams ?? { playerA: "", playerB: "" };
  const [pair, setPair]       = useState<PairData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  // Player names fetched from squad for display
  const [nameA, setNameA]     = useState("Player A");
  const [nameB, setNameB]     = useState("Player B");

  useEffect(() => {
    if (!params.playerA || !params.playerB) return;

    const fetchData = async () => {
      try {
        // Fetch the pair chemistry data
        const pairRes = await api.get(`/chemistry/pair/${params.playerA}/${params.playerB}`);
        const pairData = pairRes.data?.data ?? pairRes.data;
        if (!pairData || typeof pairData !== "object") {
          setError("Chemistry data not found for this pair. The nightly job may not have processed them yet.");
          return;
        }
        setPair(pairData as PairData);

        // Silently fetch squad to get player names
        try {
          const squadRes = await api.get("/coach/squad");
          const rawSquad = squadRes.data?.data ?? squadRes.data;
          if (Array.isArray(rawSquad)) {
            const findName = (id: string) => {
              const m = rawSquad.find(
                (p: Record<string, unknown>) =>
                  String(p.user_id ?? p.id ?? "") === id
              );
              if (!m) return null;
              const fn = String(m.first_name ?? "");
              const sn = String(m.surname ?? "");
              return `${fn} ${sn}`.trim() || String(m.name ?? null);
            };
            const nA = findName(params.playerA);
            const nB = findName(params.playerB);
            if (nA) setNameA(nA);
            if (nB) setNameB(nB);
          }
        } catch { /* player names are cosmetic — swallow */ }

      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg.includes("404") ? "No chemistry data exists for this pair yet." : "Failed to load pair chemistry.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.playerA, params.playerB]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-xl">

          {/* Back link */}
          <Link
            href="/coach/chemistry"
            className="flex items-center gap-1.5 text-[#f0b429]/50 hover:text-white text-xs mb-5 transition-colors"
          >
            <ArrowLeft size={12} /> Squad Chemistry Matrix
          </Link>

          <h1 className="text-xl font-black text-white mb-5">Pair Chemistry</h1>

          {loading && (
            <div className="rounded-2xl border border-[#f0b429]/10 bg-card/60 p-10 text-center text-[#f0b429]/40 text-sm">
              Loading pair chemistry…
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300 text-sm space-y-2">
              <p className="font-semibold">Could not load pair data</p>
              <p>{error}</p>
              <Link href="/coach/chemistry" className="text-xs text-[#f0b429]/50 hover:text-white underline block mt-3">
                Return to chemistry matrix
              </Link>
            </div>
          )}

          {pair && !loading && (
            <PairDetail
              pair={pair}
              playerAName={nameA}
              playerBName={nameB}
            />
          )}
        </div>
      </main>
    </div>
  );
}
