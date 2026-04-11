"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveGoal } from "@/lib/success/storage";
import { getActionsForGoal } from "@/lib/success/actions";
import { scheduleDailyReminder, requestNotificationPermission } from "@/lib/success/notifications";
import { Target, Heart, Calendar, Bell, ChevronRight } from "lucide-react";

export default function GoalSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [goalText, setGoalText] = useState("");
  const [whyText, setWhyText] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [reminderHour, setReminderHour] = useState(7);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [saving, setSaving] = useState(false);

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateStr = minDate.toISOString().split("T")[0];

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  async function handleCommit() {
    if (!goalText.trim() || !whyText.trim() || !targetDate) return;
    setSaving(true);
    try {
      const actions = getActionsForGoal(goalText);
      const goal = {
        id: Date.now().toString(),
        goalText: goalText.trim(),
        whyText: whyText.trim(),
        targetDate,
        createdAt: new Date().toISOString().split("T")[0],
        actions,
        reminderHour,
        reminderMinute,
      };
      saveGoal(goal);
      const granted = await requestNotificationPermission();
      if (granted) await scheduleDailyReminder(reminderHour, reminderMinute);
      router.push("/player/success");
    } finally {
      setSaving(false);
    }
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F9A825] mb-1">
          THUTO Success Engine
        </p>
        <h1 className="text-2xl font-bold text-balance">Set Your Goal</h1>
        <p className="text-sm text-white/50 mt-1">
          Step {step} of 3 — {step === 1 ? "Your goal" : step === 2 ? "Your why" : "Reminder"}
        </p>
        {/* Progress bar */}
        <div className="mt-4 h-1 rounded-full bg-white/10">
          <div
            className="h-1 rounded-full bg-[#F9A825] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 px-5 pb-8">
        {/* Step 1 — Goal */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-[#F9A825]" />
                <span className="text-sm font-semibold text-[#F9A825]">Your Goal</span>
              </div>
              <p className="text-xs text-white/50 mb-3 leading-relaxed">
                Write your goal as a specific, ambitious statement. What do you want to achieve?
              </p>
              <textarea
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#F9A825] resize-none leading-relaxed"
                rows={4}
                maxLength={200}
                placeholder="e.g. Get selected for the Harare Province Under-20 football team by December 2026"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
              />
              <p className="text-xs text-white/30 mt-1 text-right">{goalText.length}/200</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={18} className="text-[#F9A825]" />
                <span className="text-sm font-semibold text-[#F9A825]">Target Date</span>
              </div>
              <p className="text-xs text-white/50 mb-3">
                When do you want to achieve this? Be realistic but ambitious.
              </p>
              <input
                type="date"
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#F9A825] [color-scheme:dark]"
                min={minDateStr}
                max={maxDateStr}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!goalText.trim() || !targetDate}
              className="w-full rounded-xl bg-[#1B5E20] py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e7d32] transition-colors"
            >
              Continue <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2 — Why */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={18} className="text-[#F9A825]" />
                <span className="text-sm font-semibold text-[#F9A825]">Your Why</span>
              </div>
              <p className="text-xs text-white/50 mb-3 leading-relaxed">
                Why does this goal matter to you? Your &quot;why&quot; keeps you going on hard days.
                Write from the heart.
              </p>
              <textarea
                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-[#F9A825] resize-none leading-relaxed"
                rows={5}
                maxLength={300}
                placeholder="e.g. My family sacrificed so much for me to train. I want to make them proud and show every kid from our area that we can make it."
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
              />
              <p className="text-xs text-white/30 mt-1 text-right">{whyText.length}/300</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-white/20 py-3.5 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!whyText.trim()}
                className="flex-[2] rounded-xl bg-[#1B5E20] py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e7d32] transition-colors"
              >
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Reminder */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={18} className="text-[#F9A825]" />
                <span className="text-sm font-semibold text-[#F9A825]">Daily Reminder</span>
              </div>
              <p className="text-xs text-white/50 mb-4 leading-relaxed">
                THUTO will remind you to check in every day at this time.
                Champions show up even when they don&apos;t feel like it.
              </p>

              <div className="flex gap-3 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1.5 block">Hour</label>
                  <select
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#F9A825]"
                    value={reminderHour}
                    onChange={(e) => setReminderHour(Number(e.target.value))}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h} className="bg-[#1a1a1a]">
                        {pad(h)}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/40 mb-1.5 block">Minute</label>
                  <select
                    className="w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#F9A825]"
                    value={reminderMinute}
                    onChange={(e) => setReminderMinute(Number(e.target.value))}
                  >
                    {minutes.map((m) => (
                      <option key={m} value={m} className="bg-[#1a1a1a]">
                        :{pad(m)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-center text-[#F9A825] font-semibold mt-3">
                Reminder set for {pad(reminderHour)}:{pad(reminderMinute)}
              </p>
            </div>

            {/* Goal summary */}
            <div className="rounded-2xl border border-[#1B5E20]/60 bg-[#1B5E20]/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#F9A825] mb-2">
                Your Commitment
              </p>
              <p className="text-sm text-white/90 leading-relaxed mb-2">&ldquo;{goalText}&rdquo;</p>
              <p className="text-xs text-white/50">Target: {targetDate}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 rounded-xl border border-white/20 py-3.5 text-sm font-medium hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCommit}
                disabled={saving}
                className="flex-[2] rounded-xl bg-[#F9A825] text-[#121212] py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving…" : "I COMMIT 🔥"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
