"use client";

import { useState } from "react";
import { Send, ChevronDown, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const REQUEST_TYPES = [
  { value: "trial",       label: "Trial Invitation" },
  { value: "signing",     label: "Professional Signing" },
  { value: "scholarship", label: "Scholarship Offer" },
  { value: "loan",        label: "Loan Move" },
  { value: "general",     label: "General Enquiry" },
] as const;

interface Props {
  playerId: string;
  playerName: string;
}

type Status = "idle" | "submitting" | "success" | "rate_limited" | "error";

export function RepresentationForm({ playerId, playerName }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({
    scout_name: "",
    scout_email: "",
    organisation: "",
    request_type: "trial" as typeof REQUEST_TYPES[number]["value"],
    message: "",
    professional_status: false,
  });

  const messageLen = form.message.length;
  const valid =
    form.scout_name.trim().length > 0 &&
    form.scout_email.includes("@") &&
    form.request_type &&
    messageLen >= 30 &&
    messageLen <= 2000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus("submitting");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/representation-requests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, player_id: playerId }),
        }
      );
      if (res.status === 429) { setStatus("rate_limited"); return; }
      if (!res.ok) { setStatus("error"); return; }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  // Success state
  if (status === "success") {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#f0b429]" />
        <h3 className="font-bold text-white">Enquiry Received</h3>
        <p className="mt-1.5 text-sm text-white/60">
          GrassRoots Sports will facilitate introductions between you and {playerName}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Toggle button */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border border-[#f0b429]/30 bg-[#f0b429]/10 px-5 py-4 text-left transition-colors hover:bg-[#f0b429]/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[#f0b429]">Send a Representation Enquiry</p>
              <p className="mt-0.5 text-xs text-white/50">
                Scouts &amp; agents — contact GrassRoots to arrange introductions
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-[#f0b429]/60" />
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-white">Representation Enquiry</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-white/40 hover:text-white/70"
            >
              Close
            </button>
          </div>

          <p className="mb-4 text-xs text-white/50 leading-relaxed">
            This enquiry goes to the GrassRoots Sports team, who will verify your credentials
            and facilitate introductions with {playerName} and their representative.
          </p>

          {/* Error banners */}
          {status === "rate_limited" && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">
                Too many enquiries. Please wait 24 hours before sending another.
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">
                Something went wrong. Please try again or email nigel@grassrootssports.live.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Scout name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Your Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.scout_name}
                onChange={e => setForm(f => ({ ...f, scout_name: e.target.value }))}
                placeholder="e.g. James Mutasa"
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-[#f0b429]/50"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.scout_email}
                onChange={e => setForm(f => ({ ...f, scout_email: e.target.value }))}
                placeholder="you@club.com"
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-[#f0b429]/50"
                required
              />
            </div>

            {/* Organisation */}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Club / Organisation <span className="text-white/30">(optional)</span>
              </label>
              <input
                type="text"
                value={form.organisation}
                onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
                placeholder="e.g. Dynamos FC"
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-[#f0b429]/50"
              />
            </div>

            {/* Request type */}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Enquiry Type <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {REQUEST_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, request_type: t.value }))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.request_type === t.value
                        ? "bg-[#f0b429] text-[#1a3a1a]"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="mb-1 block text-xs font-medium text-white/60">
                Message <span className="text-red-400">*</span>
                <span className="ml-2 text-white/30">(min 30 chars)</span>
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={5}
                placeholder={`Introduce yourself and explain why you are interested in ${playerName}...`}
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-[#f0b429]/50 resize-none"
                required
              />
              <div className="mt-1 flex justify-between">
                <span className={`text-[10px] ${messageLen < 30 ? "text-amber-400" : "text-white/30"}`}>
                  {messageLen < 30 ? `${30 - messageLen} more characters needed` : ""}
                </span>
                <span className={`text-[10px] ${messageLen > 2000 ? "text-red-400" : "text-white/30"}`}>
                  {messageLen}/2000
                </span>
              </div>
            </div>

            {/* Professional status */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/5 px-4 py-3">
              <input
                type="checkbox"
                checked={form.professional_status}
                onChange={e => setForm(f => ({ ...f, professional_status: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded accent-[#f0b429]"
              />
              <span className="text-xs text-white/60 leading-relaxed">
                I confirm I am a licensed professional scout, registered agent, or accredited sports organisation.
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={!valid || status === "submitting"}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#f0b429] py-3 text-sm font-bold text-[#1a3a1a] transition-opacity disabled:opacity-50"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Enquiry to GrassRoots
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-white/25 leading-relaxed">
              Your details will be verified by the GrassRoots Sports team before any introduction is made.
              This is not a direct message to the player.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
