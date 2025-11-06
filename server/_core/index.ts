import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import net from "net";
import * as db from "../db";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { ENV } from "./env";
import { logger } from "./logger";
import { registerOAuthRoutes } from "./oauth";
import { serveStatic, setupVite } from "./vite";

/**
 * Check if historical data import is needed and run it automatically
 */
async function runAutoImportIfNeeded() {
  try {
    // Get the owner user (created via dev-login or OAuth)
    const ownerUser = await db.getUserByOpenId(ENV.ownerOpenId);

    if (!ownerUser) {
      logger.info(
        "[Auto-Import] No owner user found, skipping import (user needs to login first)"
      );
      return;
    }

    // Check if user already has leads
    const hasLeads = await db.hasUserLeads(ownerUser.id);

    if (hasLeads) {
      logger.info(
        "[Auto-Import] User already has leads, skipping historical import"
      );
      return;
    }

    logger.info(
      "[Auto-Import] No leads found, starting historical data import from July 2025..."
    );

    // Import historical data
    const { importHistoricalData } = await import("../import-historical-data");
    const fromDate = new Date("2025-07-01");
    const result = await importHistoricalData(ownerUser.id, fromDate);

    logger.info(
      `[Auto-Import] ✅ Import complete! Created ${result.leadsCreated} leads and ${result.customersCreated} customer profiles`
    );

    if (result.errors.length > 0) {
      logger.warn(
        `[Auto-Import] ⚠️  ${result.errors.length} errors occurred during import`
      );
      result.errors
        .slice(0, 5)
        .forEach(error => logger.warn({ err: error }, `[Auto-Import] Error`));
    }
  } catch (error) {
    logger.error(
      { err: error },
      "[Auto-Import] ❌ Error during automatic import"
    );
    // Don't throw - server should still start even if import fails
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // CORS configuration for cookie support
  app.use(
    cors({
      origin: true, // Allow all origins in development
      credentials: true, // CRITICAL: Allow cookies
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );

  // Rate limiting middleware
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: ENV.isProduction ? 100 : 1000, // Limit each IP to 100 requests per windowMs (1000 in dev)
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  // Apply rate limiting to all API routes
  app.use("/api/", limiter);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Inbound email webhook endpoint
  const { handleInboundEmail } = await import("../api/inbound-email");
  app.post("/api/inbound/email", handleInboundEmail);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    logger.warn(
      { preferredPort, port },
      `Port ${preferredPort} is busy, using port ${port} instead`
    );
  }

  server.listen(port, async () => {
    logger.info(
      { port, env: process.env.NODE_ENV },
      `Server running on http://localhost:${port}/`
    );

    // Run automatic historical data import if needed (non-blocking)
    // This only runs if no leads exist in the database
    runAutoImportIfNeeded().catch(error => {
      logger.error(
        { err: error },
        "[Auto-Import] Failed to run automatic import"
      );
    });
  });
}

startServer().catch(err => logger.error({ err }, "Server start failed"));
