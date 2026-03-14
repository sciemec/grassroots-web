"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/api";
import {
  User, Lock, Bell, Trash2, CheckCircle2, Eye, EyeOff, Loader2, AlertTriangle,
} from "lucide-react";

type Tab = "profile" | "security" | "notifications" | "danger";

interface ProfileForm { name: string; phone: string }
interface PasswordForm { current_password: string; password: string; password_confirmation: string }
interface NotifForm {
  email_sessions: boolean; email_achievements: boolean;
  email_scout_requests: boolean; email_platform_news: boolean;
  push_sessions: boolean; push_achievements: boolean;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile",       label: "Profile",        icon: User },
  { id: "security",      label: "Security",       icon: Lock },
  { id: "notifications", label: "Notifications",  icon: Bell },
  { id: "danger",        label: "Danger Zone",    icon: Trash2 },
];

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [tab, setTab]       = useState<Tab>("profile");
  const [saved, setSaved]   = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const inputCls = "w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring";
  const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(""), 3000); };

  /* ── Profile ── */
  const profileForm = useForm<ProfileForm>({ defaultValues: { name: user?.name ?? "", phone: "" } });
  const saveProfile = useMutation({
    mutationFn: (d: ProfileForm) => api.patch("/profile", d),
    onSuccess: () => flash("Profile updated"),
  });

  /* ── Password ── */
  const pwForm = useForm<PasswordForm>();
  const savePw = useMutation({
    mutationFn: (d: PasswordForm) => api.post("/auth/password/change", d),
    onSuccess: () => { flash("Password changed"); pwForm.reset(); },
  });

  /* ── Notifications ── */
  const notifForm = useForm<NotifForm>({
    defaultValues: {
      email_sessions: true, email_achievements: true,
      email_scout_requests: true, email_platform_news: false,
      push_sessions: false, push_achievements: true,
    },
  });
  const saveNotif = useMutation({
    mutationFn: (d: NotifForm) => api.patch("/profile/notifications", d),
    onSuccess: () => flash("Notification preferences saved"),
  });

  /* ── Delete account ── */
  const deleteAccount = useMutation({
    mutationFn: () => api.delete("/auth/account"),
    onSuccess: () => logout(),
  });

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" /> {saved}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar tabs */}
        <nav className="flex gap-1 lg:w-48 lg:flex-col">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                tab === id
                  ? id === "danger"
                    ? "bg-red-500/10 text-red-600"
                    : "bg-primary/10 text-primary"
                  : id === "danger"
                  ? "text-red-500 hover:bg-red-500/5"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-xl">

          {/* ── Profile tab ── */}
          {tab === "profile" && (
            <form onSubmit={profileForm.handleSubmit((d) => saveProfile.mutate(d))}
              className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold">Personal Information</h2>

              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Full name</label>
                <input {...profileForm.register("name", { required: true })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone number</label>
                <input {...profileForm.register("phone")} className={inputCls} placeholder="+263 7…" />
              </div>
              <div>
                <label className={labelCls}>Email address</label>
                <input value={user?.email} readOnly className={`${inputCls} cursor-not-allowed bg-muted/30`} />
                <p className="mt-1 text-xs text-muted-foreground">Email changes require identity verification. Contact support.</p>
              </div>

              <button type="submit" disabled={saveProfile.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                {saveProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save profile
              </button>
              {saveProfile.isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}
            </form>
          )}

          {/* ── Security tab ── */}
          {tab === "security" && (
            <form onSubmit={pwForm.handleSubmit((d) => savePw.mutate(d))}
              className="rounded-xl border bg-card p-6 space-y-4">
              <h2 className="text-sm font-semibold">Change Password</h2>
              <p className="text-xs text-muted-foreground">Choose a strong password of at least 8 characters.</p>

              {[
                { name: "current_password" as const, label: "Current password", show: showCur, toggle: () => setShowCur(!showCur) },
                { name: "password" as const,          label: "New password",     show: showNew, toggle: () => setShowNew(!showNew) },
                { name: "password_confirmation" as const, label: "Confirm new password", show: showCfm, toggle: () => setShowCfm(!showCfm) },
              ].map(({ name, label, show, toggle }) => (
                <div key={name}>
                  <label className={labelCls}>{label}</label>
                  <div className="relative">
                    <input
                      {...pwForm.register(name, { required: true, minLength: name === "current_password" ? 1 : 8 })}
                      type={show ? "text" : "password"}
                      className={`${inputCls} pr-10`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}

              <button type="submit" disabled={savePw.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                {savePw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Update password
              </button>
              {savePw.isError && (
                <p className="text-sm text-destructive">
                  {(savePw.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to update password."}
                </p>
              )}
            </form>
          )}

          {/* ── Notifications tab ── */}
          {tab === "notifications" && (
            <form onSubmit={notifForm.handleSubmit((d) => saveNotif.mutate(d))}
              className="rounded-xl border bg-card p-6 space-y-5">
              <h2 className="text-sm font-semibold">Notification Preferences</h2>

              {[
                { section: "Email Notifications", items: [
                  { name: "email_sessions" as const,       label: "Session summaries",      sub: "After each training session" },
                  { name: "email_achievements" as const,   label: "Achievements & milestones", sub: "When you earn XP or badges" },
                  { name: "email_scout_requests" as const, label: "Scout contact requests", sub: "When a scout wants to connect" },
                  { name: "email_platform_news" as const,  label: "Platform news",          sub: "Updates and new features" },
                ]},
                { section: "Push Notifications", items: [
                  { name: "push_sessions" as const,       label: "Session reminders",   sub: "Daily training reminders" },
                  { name: "push_achievements" as const,   label: "Achievement alerts",  sub: "Real-time achievement pings" },
                ]},
              ].map(({ section, items }) => (
                <div key={section}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section}</p>
                  <div className="space-y-3">
                    {items.map(({ name, label, sub }) => (
                      <label key={name} className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{sub}</p>
                        </div>
                        <input {...notifForm.register(name)} type="checkbox"
                          className="h-4 w-4 rounded accent-primary" />
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button type="submit" disabled={saveNotif.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                {saveNotif.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save preferences
              </button>
            </form>
          )}

          {/* ── Danger zone tab ── */}
          {tab === "danger" && (
            <div className="rounded-xl border border-destructive/30 bg-card p-6 space-y-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                <div>
                  <h2 className="text-sm font-semibold text-destructive">Delete Account</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                    Your personal data will be removed within 30 days per our Privacy Policy.
                  </p>
                </div>
              </div>

              <ul className="ml-4 list-disc space-y-1 text-xs text-muted-foreground">
                <li>All training sessions and progress data</li>
                <li>Your player/coach/scout profile</li>
                <li>Messages and scout contact history</li>
                <li>Active subscriptions (no refund for unused period)</li>
              </ul>

              <div>
                <label className={labelCls}>
                  Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                </label>
                <input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  className={`${inputCls} border-destructive/30`}
                  placeholder="DELETE"
                />
              </div>

              <button
                onClick={() => deleteAccount.mutate()}
                disabled={deleteConfirm !== "DELETE" || deleteAccount.isPending}
                className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {deleteAccount.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Trash2 className="h-4 w-4" />
                Delete my account permanently
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
