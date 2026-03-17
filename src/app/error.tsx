"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. If this keeps happening, please contact support.
      </p>

      {/* Show real error message so it can be reported and fixed */}
      {error.message && (
        <p className="mt-3 max-w-md rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-xs text-destructive">
          {error.message}
        </p>
      )}

      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <a
          href="/"
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
        >
          <Home className="h-4 w-4" />
          Go home
        </a>
      </div>
    </div>
  );
}
