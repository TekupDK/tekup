import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "../logger";

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    logger.warn("SENTRY_DSN not set - error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],
    beforeSend(event) {
      // Filter out development errors in production
      if (process.env.NODE_ENV === "production") {
        // Don't send errors from localhost or test domains
        if (event.request?.url?.includes("localhost") || 
            event.request?.url?.includes("127.0.0.1")) {
          return null;
        }
      }
      return event;
    },
  });

  logger.info("Sentry initialized for error tracking");
}

/**
 * Capture an exception with Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setContext(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message with Sentry
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; name?: string }): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Get Sentry instance for advanced usage
 */
export { Sentry };