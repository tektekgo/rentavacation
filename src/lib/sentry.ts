import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_SUPABASE_URL?.includes("oukbxqnlxnkainnligfz")
      ? "development"
      : "production",
    release: `rav-website@${import.meta.env.VITE_APP_VERSION || "0.9.0"}`,

    // Capture 100% of errors, 10% of transactions for performance
    sampleRate: 1.0,
    tracesSampleRate: 0.1,

    // Filter out noisy/irrelevant errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "originalCreateNotification",
      "canvas.contentDocument",
      // Network errors users can't control
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // ResizeObserver (benign, from browser layout)
      "ResizeObserver loop",
    ],

    beforeSend(event) {
      // Strip PII from error reports
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    },
  });
}

/**
 * Set the current user context for Sentry error reports.
 * Only sends user ID and role — no email/PII.
 */
export function setSentryUser(userId: string | null, role?: string) {
  if (!SENTRY_DSN) return;
  if (userId) {
    Sentry.setUser({ id: userId, ...(role ? { role } : {}) });
  } else {
    Sentry.setUser(null);
  }
}

export { Sentry };
