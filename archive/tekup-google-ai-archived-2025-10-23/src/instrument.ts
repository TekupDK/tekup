/**
 * Sentry Error Monitoring Configuration
 * MUST be imported before any other application code
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Only initialize Sentry in production or when explicitly enabled
const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || "development";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Integrations
    integrations: [
      nodeProfilingIntegration(),
    ],

    // Environment
    environment: NODE_ENV,

    // Send structured logs to Sentry
    enableLogs: true,

    // Performance Monitoring
    tracesSampleRate: NODE_ENV === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Profiling
    profileSessionSampleRate: NODE_ENV === "production" ? 0.1 : 1.0,
    profileLifecycle: "trace",

    // Privacy: Only send PII in development
    sendDefaultPii: NODE_ENV !== "production",

    // Release tracking
    release: process.env.RENDER_GIT_COMMIT || "development",

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in dry-run mode
      if (process.env.RUN_MODE === "dry-run") {
        console.log("🔍 [Sentry Dry-Run] Would send error:", event.message);
        return null;
      }

      // Filter out expected errors
      const error = hint.originalException;
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message).toLowerCase();
        
        // Don't send validation errors to Sentry (these are user errors)
        if (message.includes("validation") || message.includes("invalid input")) {
          return null;
        }
      }

      return event;
    },
  });

  console.log("✅ Sentry initialized for environment:", NODE_ENV);
} else {
  console.log("⚠️  Sentry disabled (no SENTRY_DSN configured)");
}

export default Sentry;
