"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

interface HealthCheck {
  status: "healthy" | "degraded";
  passing: number;
  failing: number;
  checked_at: string;
  checks: {
    tables: Record<string, { label: string; status: string }>;
    env: Record<string, { label: string; status: string }>;
    services: Record<string, { label: string; status: string }>;
    migrations: {
      pending_count: number;
      pending: string[];
      status: string;
    };
  };
}

function StatusRow({ name, label, status }: { name: string; label: string; status: string }) {
  const ok = status === "ok";
  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-2.5 ${ok ? "bg-green-500/5" : "bg-red-500/10"}`}>
      <div className="flex items-center gap-3">
        {ok
          ? <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
          : <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />}
        <div>
          <p className="text-sm font-medium font-mono">{name}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      <span className={`text-xs font-bold ${ok ? "text-green-600" : "text-red-600"}`}>
        {status.toUpperCase()}
      </span>
    </div>
  );
}

export default function HealthPage() {
  const [data, setData]       = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      const json = await res.json();
      setData(json);
    } catch {
      setError("Could not reach the backend. Is Render awake?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(); }, []);

  const tables   = Object.entries(data?.checks?.tables   ?? {});
  const env      = Object.entries(data?.checks?.env      ?? {});
  const services = Object.entries(data?.checks?.services ?? {});
  const migrations = data?.checks?.migrations;

  const missing = [
    ...tables.filter(([, v]) => v.status !== "ok"),
    ...env.filter(([, v]) => v.status !== "ok"),
    ...services.filter(([, v]) => v.status !== "ok"),
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Health</h1>
          <p className="text-sm text-muted-foreground">
            Every table, env var, and service — green means built and working
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking…" : "Re-check"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <>
          {/* Summary */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className={`rounded-xl border p-5 text-center ${data.status === "healthy" ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
              <p className="text-3xl font-extrabold">{data.status === "healthy" ? "✅" : "⚠️"}</p>
              <p className={`mt-1 font-bold capitalize ${data.status === "healthy" ? "text-green-700" : "text-red-700"}`}>{data.status}</p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-3xl font-extrabold text-green-600">{data.passing}</p>
              <p className="mt-1 text-sm text-muted-foreground">Passing</p>
            </div>
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className={`text-3xl font-extrabold ${data.failing > 0 ? "text-red-600" : "text-muted-foreground"}`}>{data.failing}</p>
              <p className="mt-1 text-sm text-muted-foreground">Failing</p>
            </div>
          </div>

          {/* Problems first */}
          {missing.length > 0 && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h2 className="font-bold text-red-700">Action Required — {missing.length} issue{missing.length > 1 ? "s" : ""}</h2>
              </div>
              <div className="space-y-2">
                {missing.map(([name, v]) => (
                  <div key={name} className="rounded-lg bg-white/70 px-4 py-2 text-sm">
                    <span className="font-mono font-bold text-red-700">{name}</span>
                    <span className="ml-2 text-red-600">{v.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending migrations */}
          {migrations && migrations.pending_count > 0 && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h2 className="font-bold text-amber-700">{migrations.pending_count} migration{migrations.pending_count > 1 ? "s" : ""} not yet run</h2>
              </div>
              <p className="mb-3 text-sm text-amber-700">Run <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">php artisan migrate --force</code> on Render</p>
              {migrations.pending.map((m) => (
                <p key={m} className="font-mono text-xs text-amber-800">{m}</p>
              ))}
            </div>
          )}

          {/* DB tables */}
          <div className="mb-6 rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Database Tables ({tables.filter(([, v]) => v.status === "ok").length}/{tables.length})</h2>
              <p className="text-xs text-muted-foreground">Every feature table — missing = migration not run</p>
            </div>
            <div className="space-y-1.5 p-4">
              {tables.map(([name, v]) => <StatusRow key={name} name={name} label={v.label} status={v.status} />)}
            </div>
          </div>

          {/* Env vars */}
          <div className="mb-6 rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Environment Variables ({env.filter(([, v]) => v.status === "ok").length}/{env.length})</h2>
              <p className="text-xs text-muted-foreground">Missing = feature broken in production</p>
            </div>
            <div className="space-y-1.5 p-4">
              {env.map(([name, v]) => <StatusRow key={name} name={name} label={v.label} status={v.status} />)}
            </div>
          </div>

          {/* Services */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Services</h2>
            </div>
            <div className="space-y-1.5 p-4">
              {services.map(([name, v]) => <StatusRow key={name} name={name} label={v.label} status={v.status} />)}
              {migrations && (
                <StatusRow
                  name="migrations"
                  label={migrations.pending_count === 0 ? "All migrations run" : `${migrations.pending_count} pending`}
                  status={migrations.status}
                />
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Last checked: {new Date(data.checked_at).toLocaleString()}
          </p>
        </>
      )}
    </DashboardLayout>
  );
}
