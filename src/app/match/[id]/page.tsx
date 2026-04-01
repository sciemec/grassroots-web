"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { LiveFundraiser } from "@/components/match/live-fundraiser";
import { Loader2, CheckCircle2, AlertCircle, Phone, X } from "lucide-react";

const PRESET_AMOUNTS = ["1.00", "2.00", "5.00", "10.00"];

export default function MatchDayPage() {
  const params  = useParams();
  const eventId = params.id as string;

  const [showDonate, setShowDonate]       = useState(false);
  const [amount, setAmount]               = useState("2.00");
  const [customAmount, setCustomAmount]   = useState("");
  const [phone, setPhone]                 = useState("");
  const [name, setName]                   = useState("");
  const [donating, setDonating]           = useState(false);
  const [pollUrl, setPollUrl]             = useState<string | null>(null);
  const [status, setStatus]               = useState<"idle" | "pending" | "paid" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const finalAmount = customAmount || amount;

  // Poll payment status every 3s while pending
  useEffect(() => {
    if (!pollUrl || status !== "pending") return;

    const check = async () => {
      try {
        const res  = await fetch(`/api/payments/paynow/status?pollUrl=${encodeURIComponent(pollUrl)}`);
        const data = await res.json() as { paid: boolean; status: string };
        if (data.paid) {
          setStatus("paid");
          setPollUrl(null);
        }
      } catch {
        // Ignore poll errors — keep trying
      }
    };

    const interval = setInterval(check, 3_000);
    return () => clearInterval(interval);
  }, [pollUrl, status]);

  const initiateDonation = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) {
      setStatus("error");
      setStatusMessage("Please enter a valid phone number.");
      return;
    }
    if (parseFloat(finalAmount) < 0.01) {
      setStatus("error");
      setStatusMessage("Please enter a valid amount.");
      return;
    }

    setDonating(true);
    setStatus("idle");
    setStatusMessage("");

    try {
      const res = await fetch("/api/payments/match-donate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id:   eventId,
          amount:     finalAmount,
          phone,
          donor_name: name.trim() || undefined,
        }),
      });
      const data = await res.json() as { poll_url?: string; error?: string };

      if (!res.ok || data.error) {
        setStatus("error");
        setStatusMessage(data.error ?? "Payment failed. Please try again.");
        return;
      }

      setPollUrl(data.poll_url ?? null);
      setStatus("pending");
      setStatusMessage("Check your phone and approve the EcoCash / InnBucks prompt.");
    } catch {
      setStatus("error");
      setStatusMessage("Could not reach payment service. Check your connection.");
    } finally {
      setDonating(false);
    }
  };

  const openDonate = () => {
    setShowDonate(true);
    setStatus("idle");
    setStatusMessage("");
    setPollUrl(null);
  };

  return (
    <div
      className="min-h-screen bg-[#1a5c2a]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent 0px, transparent 8px, rgba(180,160,0,0.06) 8px, rgba(180,160,0,0.06) 10px)," +
          "repeating-linear-gradient(45deg, transparent 0px, transparent 8px, rgba(180,160,0,0.06) 8px, rgba(180,160,0,0.06) 10px)",
      }}
    >
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="text-xs text-green-400/60 uppercase tracking-wider font-semibold mb-1">
            Grassroots Sports · Match Day
          </p>
          <h1 className="text-2xl font-black text-white leading-tight">Live Fundraiser</h1>
          <p className="mt-1 text-sm text-green-300/60">Support your team in real time</p>
        </div>

        {/* Live fundraiser widget */}
        <LiveFundraiser eventId={eventId} onDonateClick={openDonate} />

        {/* Post-donation banner */}
        {status === "paid" && !showDonate && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Payment received! Thank you for supporting the team 🏆
          </div>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-green-400/30">
          Powered by{" "}
          <span className="text-green-400/60 font-semibold">Grassroots Sports</span>
          {" · "}grassrootssports.live
        </p>
      </div>

      {/* Donate modal */}
      {showDonate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-[#1a3d26] p-6 space-y-4 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Support the Team 🏅</h2>
              <button
                onClick={() => setShowDonate(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Amount selector */}
            <div>
              <p className="text-xs text-green-300/70 uppercase tracking-wide font-semibold mb-2">
                Choose amount (USD)
              </p>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                      a === amount && !customAmount
                        ? "bg-amber-500 text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    ${a}
                  </button>
                ))}
              </div>
              <input
                type="number"
                placeholder="Custom amount ($)"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
                min="0.01"
                step="0.01"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-amber-400"
              />
            </div>

            {/* Donor name */}
            <input
              type="text"
              placeholder="Your name (optional — shows in shoutouts)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-amber-400"
            />

            {/* Phone number */}
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400/60" />
              <input
                type="tel"
                placeholder="EcoCash / InnBucks number (07X XXX XXXX)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder-green-400/40 outline-none focus:border-amber-400"
              />
            </div>

            {/* Status feedback */}
            {status === "pending" && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2.5">
                <Loader2 className="h-3.5 w-3.5 mt-0.5 animate-spin text-amber-300 shrink-0" />
                <p className="text-xs text-amber-300">{statusMessage}</p>
              </div>
            )}
            {status === "paid" && (
              <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/30 px-3 py-2.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-300 shrink-0" />
                <p className="text-xs text-green-300">Payment received! Thank you 🏆</p>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-red-300 shrink-0" />
                <p className="text-xs text-red-300">{statusMessage}</p>
              </div>
            )}

            {/* Pay button */}
            {status !== "paid" && (
              <button
                onClick={initiateDonation}
                disabled={donating || status === "pending"}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-bold text-black hover:from-amber-400 hover:to-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {donating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Pay $${finalAmount || amount}`
                )}
              </button>
            )}

            {status === "paid" && (
              <button
                onClick={() => setShowDonate(false)}
                className="w-full rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-sm font-bold text-green-300 hover:bg-green-500/20 transition-all"
              >
                Done ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
