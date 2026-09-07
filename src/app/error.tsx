"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0e0e0e" }}
    >
      {/* Icon */}
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        <AlertTriangle size={36} color="#f0b429" />
      </div>

      {/* Label */}
      <p
        className="mb-1 text-xs font-bold uppercase tracking-widest"
        style={{ color: "#c8962a", letterSpacing: "1px" }}
      >
        Grassroots Sports
      </p>

      <h1 className="mb-3 text-2xl font-black text-white">Something went wrong</h1>
      <p className="mb-8 max-w-sm text-sm" style={{ color: "#777" }}>
        An unexpected error occurred. Your data is safe. Try again or return to the home page.
      </p>

      {/* Error detail — dev only */}
      {process.env.NODE_ENV === "development" && error.message && (
        <p
          className="mb-6 max-w-md rounded-xl px-4 py-2 font-mono text-xs"
          style={{ background: "#1a1a1a", color: "#e57373", border: "1px solid #3a1a1a" }}
        >
          {error.message}
        </p>
      )}

      {process.env.NODE_ENV === "development" && error.digest && (
        <p className="mb-4 font-mono text-[10px]" style={{ color: "#555" }}>
          Error ID: {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "#1a5c2a" }}
        >
          <RefreshCw size={15} />
          Try again
        </button>
        <a
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#1e1e1e", color: "#f0b429", border: "1px solid #2a2a2a" }}
        >
          <Home size={15} />
          Go to Home
        </a>
      </div>
    </div>
  );
}
