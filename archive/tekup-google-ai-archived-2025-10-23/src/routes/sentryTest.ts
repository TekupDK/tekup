/**
 * Sentry Test Route - Trigger test errors for verification
 */

import express from "express";
import * as Sentry from "@sentry/node";

const router = express.Router();

/**
 * Test endpoint to trigger a Sentry error capture
 * GET /sentry/test
 */
router.get("/test", (req, res) => {
  try {
    // Log before throwing error
    Sentry.captureMessage("Test error triggered manually", "info");
    
    // Trigger intentional error
    throw new Error("🧪 Test error from RenOS - Sentry integration working!");
  } catch (error) {
    // Capture error in Sentry
    Sentry.captureException(error);
    
    res.status(500).json({
      error: "Test error sent to Sentry",
      message: "Check your Sentry dashboard for the error",
      sentryEventId: Sentry.lastEventId(),
    });
  }
});

/**
 * Test performance monitoring
 * GET /sentry/trace
 */
router.get("/trace", async (req, res) => {
  await Sentry.startSpan(
    {
      op: "test.performance",
      name: "Performance Test Span",
    },
    async () => {
      // Simulate some work
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      Sentry.getCurrentScope().setTag("test_type", "performance");
      Sentry.getCurrentScope().setContext("test_data", {
        endpoint: "/sentry/trace",
        timestamp: new Date().toISOString(),
      });
      
      res.json({
        message: "Performance trace sent to Sentry",
        timestamp: new Date().toISOString(),
      });
    }
  );
});

/**
 * Test different error levels
 * GET /sentry/levels
 */
router.get("/levels", (req, res) => {
  // Info level
  Sentry.captureMessage("Info: System health check", "info");
  
  // Warning level
  Sentry.captureMessage("Warning: High memory usage detected", "warning");
  
  // Error level
  Sentry.captureMessage("Error: Database connection timeout", "error");
  
  res.json({
    message: "Sent 3 messages with different severity levels",
    levels: ["info", "warning", "error"],
  });
});

export default router;
