import { Router, Request, Response } from "express";
import { prisma } from "../services/databaseService";
import { logger } from "../logger";
import { captureMessage } from "../services/sentryService";

const router = Router();

/**
 * GET /api/monitoring/health
 * Comprehensive health check endpoint
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = "unknown";
    let dbResponseTime = 0;
    
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
      dbStatus = "healthy";
    } catch (error) {
      dbStatus = "unhealthy";
      logger.error({ error }, "Database health check failed");
      captureMessage("Database health check failed", "error");
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    };

    // Check uptime
    const uptime = process.uptime();
    const uptimeHours = Math.round(uptime / 3600 * 100) / 100;

    // Overall health status
    const overallStatus = dbStatus === "healthy" ? "healthy" : "degraded";
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: `${uptimeHours}h`,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      database: {
        status: dbStatus,
        responseTime: `${dbResponseTime}ms`,
      },
      memory: memoryUsageMB,
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    // Log health check
    logger.info({
      status: overallStatus,
      responseTime,
      dbStatus,
      memoryUsage: memoryUsageMB.rss
    }, "Health check completed");

    // Set appropriate HTTP status
    const httpStatus = overallStatus === "healthy" ? 200 : 503;
    res.status(httpStatus).json(healthData);

  } catch (error) {
    logger.error({ error }, "Health check failed");
    captureMessage("Health check endpoint failed", "error");
    
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Basic metrics endpoint
 */
router.get("/metrics", async (req: Request, res: Response) => {
  try {
    // Get basic counts from database
    const [customers, leads, bookings, quotes, emailThreads] = await Promise.all([
      prisma.customer.count(),
      prisma.lead.count(),
      prisma.booking.count(),
      prisma.quote.count(),
      prisma.emailThread.count(),
    ]);

    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        customers,
        leads,
        bookings,
        quotes,
        emailThreads,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };

    res.json(metrics);
  } catch (error) {
    logger.error({ error }, "Failed to fetch metrics");
    res.status(500).json({
      error: "Failed to fetch metrics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/monitoring/status
 * Simple status endpoint for load balancers
 */
router.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;