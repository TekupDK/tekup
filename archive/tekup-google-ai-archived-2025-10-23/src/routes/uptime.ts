import { Router, Request, Response } from "express";
import { logger } from "../logger";

const router = Router();

/**
 * POST /api/uptime/webhook
 * Webhook endpoint for UptimeRobot monitoring
 */
router.post("/webhook", (req: Request, res: Response) => {
  try {
    const { alertType, monitorFriendlyName, monitorURL, alertDetails } = req.body;
    
    logger.info({
      alertType,
      monitorFriendlyName,
      monitorURL,
      alertDetails
    }, "UptimeRobot webhook received");

    // Log different alert types
    switch (alertType) {
      case 1: // Up
        logger.info({ monitor: monitorFriendlyName }, "Service is back online");
        break;
      case 2: // Down
        logger.error({ monitor: monitorFriendlyName, details: alertDetails }, "Service is down");
        break;
      case 3: // Pause
        logger.warn({ monitor: monitorFriendlyName }, "Monitoring paused");
        break;
      case 4: // Start
        logger.info({ monitor: monitorFriendlyName }, "Monitoring started");
        break;
      default:
        logger.info({ alertType, monitor: monitorFriendlyName }, "Unknown alert type");
    }

    res.json({ success: true, message: "Webhook received" });
  } catch (error) {
    logger.error({ error }, "UptimeRobot webhook error");
    res.status(500).json({ success: false, error: "Webhook processing failed" });
  }
});

/**
 * GET /api/uptime/status
 * Simple status endpoint for UptimeRobot
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;