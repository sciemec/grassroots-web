import api from "@/lib/api";

interface RegistrationFailure {
  phone?: string;
  role?: string;
  step?: string;
  error: unknown;
}

/**
 * Silently reports a registration failure to the backend.
 * Never throws — never blocks the user.
 * Backend sends WhatsApp alert to admin and logs to DB.
 */
export function reportRegistrationFailure({ phone, role, step, error }: RegistrationFailure): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Unknown error";

  // Fire and forget — do not await, do not catch visibly
  api
    .post("/admin/registration-alert", {
      phone:     phone ?? "unknown",
      role:      role  ?? "unknown",
      step:      step  ?? "unknown",
      error:     message,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      timestamp: new Date().toISOString(),
    })
    .catch(() => {
      // Swallow silently — alerting must never break the user's experience
    });
}
