// Monitoring: Sentry integration
// IMPORTANT: The DSN is intentionally not hardcoded in source.
// Set VITE_SENTRY_DSN in your deployment environment/build platform.

import * as Sentry from "@sentry/react";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  if (import.meta.env.DEV) return;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: "production",
    tracesSampleRate: 0.05,
  });

  initialized = true;
}

export default { initSentry };
