// CRITICAL: Import Sentry FIRST before any other code
import "./instrument";

import express from "express";
import type { Express } from "express";
import path from "path";
import { chatRouter } from "./routes/chat";
import { healthRouter } from "./routes/health";
import dashboardRouter from "./api/dashboardRoutes";
import emailApprovalRouter from "./api/emailApprovalRoutes";
import bookingRouter from "./api/bookingRoutes";
import cleaningPlanRouter from "./api/cleaningPlanRoutes";
import timeTrackingRouter from "./api/timeTrackingRoutes";
import invoiceRouter from "./api/invoiceRoutes";
import labelRouter from "./routes/labelRoutes";
import leadRouter from "./routes/leadRoutes";
import calendarRoutes from "./routes/calendar";
import leadsRouter from "./routes/leads";
import quoteRoutes from "./routes/quoteRoutes";
import serviceRoutes from "./routes/serviceRoutes";
import microsoftAgentRoutes from "./routes/microsoftAgentRoutes";
import calendarSyncRoutes from "./routes/calendarSyncRoutes";
import customerImportRoutes from "./routes/customerImportRoutes";
import emailMatchingRouter from "./routes/emailMatching";
import monitoringRouter from "./routes/monitoring";
import uptimeRouter from "./routes/uptime";
import sentryTestRouter from "./routes/sentryTest";
import { errorHandler } from "./middleware/errorHandler";
import { enrichContextMiddleware } from "./middleware/contextEnrichment";
import { initializeSentry } from "./services/sentryService";
import * as Sentry from "@sentry/node";
import { apiLimiter, chatLimiter, dashboardLimiter } from "./middleware/rateLimiter";
import { sanitizeInput, validateInputLength } from "./middleware/sanitizer";
import { requireAuth } from "./middleware/supabaseAuth";

export function createServer(): Express {
    // Initialize Sentry first
    initializeSentry();

    const app = express();

    // Behind Render/NGINX/Proxies: honor X-Forwarded-* headers
    app.set('trust proxy', 1);

    // Sentry request handler must be the first middleware
    // Note: Sentry middleware temporarily disabled due to v10 compatibility issues
    // app.use(Sentry.requestHandler);
    // app.use(Sentry.tracingHandler);

    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: false }));

    // Avoid repeated 404s for favicon.ico in logs
    app.get('/favicon.ico', (_req, res) => res.sendStatus(204));

    // Security Headers Middleware (based on penetration test recommendations)
    app.use((req, res, next) => {
        // Content Security Policy - prevent XSS and data injection attacks
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://accounts.google.com https://*.clerk.accounts.dev https://*.clerk.com; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com data:; " +
            "img-src 'self' data: https: blob:; " +
            "connect-src 'self' https://api.renos.dk https://*.clerk.accounts.dev https://*.clerk.com https://accounts.google.com; " +
            "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com https://*.clerk.accounts.dev; " +
            "frame-ancestors 'self';"
        );

        // X-Frame-Options - prevent clickjacking attacks
        res.setHeader("X-Frame-Options", "SAMEORIGIN");

        // X-XSS-Protection - enable XSS filter in older browsers
        res.setHeader("X-XSS-Protection", "1; mode=block");

        // X-Content-Type-Options - prevent MIME type sniffing (already exists, keeping it)
        res.setHeader("X-Content-Type-Options", "nosniff");

        // Referrer-Policy - control referrer information
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions-Policy - disable unnecessary browser features
        res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

        // Strict-Transport-Security (HSTS) - enforce HTTPS
        if (process.env.NODE_ENV === "production") {
            res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }

        // X-Permitted-Cross-Domain-Policies - prevent Flash/PDF cross-domain issues
        res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

        // Cross-Origin-Embedder-Policy - Spectre attack protection
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

        next();
    });

    // Environment-based CORS configuration
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const corsOrigin = process.env.CORS_ORIGIN;

    // Build allowed origins list - REMOVED WILDCARD for security
    const allowedOrigins = process.env.NODE_ENV === "production"
        ? [
            frontendUrl,
            corsOrigin,
            "https://www.renos.dk",
            "https://renos.dk",
            "https://your-app.hostinger.site", // Hostinger subdomain
            "https://app.rendetalje.dk" // Custom domain
        ].filter(Boolean) // Remove undefined values
        : [
            "http://localhost:5173",
            "http://localhost:3000",
            frontendUrl,
            corsOrigin
        ].filter(Boolean); // Remove undefined values, NO WILDCARD

    console.log("CORS Configuration:", {
        frontendUrl,
        corsOrigin,
        allowedOrigins,
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === "production"
    });

    app.use((req, res, next) => {
        const origin = req.headers.origin;

        // Always set CORS headers in production for allowed origins
        if (process.env.NODE_ENV !== "production") {
            // Development: Allow all
            res.header("Access-Control-Allow-Origin", origin || "*");
        } else if (!origin) {
            // No origin header (health checks, direct browser visits) - allow
            res.header("Access-Control-Allow-Origin", "*");
        } else if (allowedOrigins.includes(origin)) {
            // Production: Only allow whitelisted origins
            res.header("Access-Control-Allow-Origin", origin);
        } else {
            console.log("CORS Blocked:", origin, "Allowed origins:", allowedOrigins);
        }

        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.header("Access-Control-Allow-Credentials", "true");

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            return res.sendStatus(200);
        }
        next();
    });

    // Health endpoint (no rate limiting for monitoring)
    app.use("/health", healthRouter);

    // Sentry Test Routes (development only)
    if (process.env.NODE_ENV !== "production") {
        app.use("/sentry", sentryTestRouter);
    }

    // Rate Limiting - Protect against DoS attacks
    app.use("/api/", apiLimiter); // General API protection

    // Dashboard API routes (with authentication, rate limiting)
    // NOTE: Auth currently disabled (set ENABLE_AUTH=true in production)
    app.use("/api/dashboard", requireAuth, dashboardLimiter, dashboardRouter);

    // Email Approval API routes (with authentication, rate limiting)
    app.use("/api/email-approval", requireAuth, dashboardLimiter, emailApprovalRouter);

    // Booking API routes (with authentication, rate limiting)
    app.use("/api/bookings", requireAuth, dashboardLimiter, bookingRouter);

    // Cleaning Plan API routes (with authentication, rate limiting) - Phase 1 Sprint 1
    app.use("/api/cleaning-plans", requireAuth, dashboardLimiter, cleaningPlanRouter);

    // Time Tracking API routes (with authentication, rate limiting) - Sprint 2
    app.use("/api/time-tracking", requireAuth, dashboardLimiter, timeTrackingRouter);

    // Invoice API routes (with authentication, rate limiting) - Sprint 3
    app.use("/api/invoices", requireAuth, dashboardLimiter, invoiceRouter);

    // Gmail Label Management API routes (with authentication, rate limiting)
    app.use("/api/labels", requireAuth, dashboardLimiter, labelRouter);

    // Lead Management API routes (duplicate detection, registration) - Legacy
    app.use("/api/lead", requireAuth, dashboardLimiter, leadRouter);

    // New Lead Processing API routes (parsing, estimation, full workflow)
    app.use("/api/leads", requireAuth, dashboardLimiter, leadsRouter);

    // Calendar & Slot Finder API routes (with authentication)
    app.use("/api/calendar", requireAuth, calendarRoutes);

    // Quote API routes
    app.use("/api/quotes", requireAuth, quoteRoutes);

    // Service API routes
    app.use("/api/services", requireAuth, apiLimiter, serviceRoutes);

    // Microsoft Agent Framework API routes (with authentication)
    app.use("/api/microsoft", requireAuth, apiLimiter, microsoftAgentRoutes);

    // Calendar Synchronization API routes (with authentication)
    app.use("/api/calendar-sync", requireAuth, apiLimiter, calendarSyncRoutes);

    // Customer Import API routes (with authentication)
    app.use("/api/customer-import", requireAuth, apiLimiter, customerImportRoutes);
    // Email Matching API routes (with authentication)
    app.use("/api/email-matching", requireAuth, apiLimiter, emailMatchingRouter);

    // Monitoring API routes (no authentication for health checks)
    app.use("/api/monitoring", monitoringRouter);

    // Uptime monitoring routes (no authentication)
    app.use("/api/uptime", uptimeRouter);

    // Chat endpoint (with authentication, strict rate limiting, sanitization, and validation)
    // NOTE: Auth currently disabled (set ENABLE_AUTH=true in production)
    app.use("/api/chat", requireAuth, chatLimiter, validateInputLength(5000), sanitizeInput, enrichContextMiddleware);
    app.use("/api/chat", chatRouter);

    // Serve static files from the React build directory (production only)
    if (process.env.NODE_ENV === "production") {
        const clientBuildPath = path.join(__dirname, "../client/dist");

        // Serve static assets with proper cache headers
        app.use(express.static(clientBuildPath, {
            maxAge: "1y", // Cache static assets for 1 year
            etag: true,
            lastModified: true
        }));

        // Catch-all route: serve index.html for all non-API routes
        // This allows React Router to handle client-side routing
        app.get("*", (req, res) => {
            // Don't serve index.html for API routes
            if (req.path.startsWith("/api/")) {
                return res.status(404).json({ error: "API endpoint not found" });
            }
            res.sendFile(path.join(clientBuildPath, "index.html"));
        });
    }

    // Error handling middleware (skal være sidst)
    // Note: Sentry error handler temporarily disabled due to v10 compatibility issues
    // app.use(Sentry.expressErrorHandler);
    app.use(errorHandler);

    return app;
}
