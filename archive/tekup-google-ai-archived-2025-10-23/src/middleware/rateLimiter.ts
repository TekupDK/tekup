/**
 * 🛡️ Rate Limiting Middleware
 * 
 * Beskytter RenOS API mod DoS (Denial of Service) attacks ved at
 * begrænse antal requests per IP addresse i et tidsvind ue.
 * 
 * Limiters:
 * - API Limiter: 100 requests per 15 minutter (general protection)
 * - Chat Limiter: 10 messages per minut (spam protection)
 * - Dashboard Limiter: 60 requests per minut (data protection)
 */

import rateLimit from "express-rate-limit";
import { logger } from "../logger";

/**
 * General API rate limiter
 * Anvendes på alle /api/* endpoints
 * Development: 500 req/15min, Production: 100 req/15min
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutter
    max: process.env.NODE_ENV === "production" ? 100 : 500, // Development: mere generous
    message: {
        error: "For mange forespørgsler fra denne IP, prøv igen senere",
        retryAfter: "15 minutes",
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn({
            type: "rate_limit_exceeded",
            ip: req.ip,
            path: req.path,
            limit: "api",
            environment: process.env.NODE_ENV,
        }, "API rate limit exceeded");

        res.status(429).json({
            error: "For mange forespørgsler fra denne IP, prøv igen senere",
            retryAfter: "15 minutes",
        });
    },
});

/**
 * Chat-specific rate limiter
 * Strammere limits for chat endpoints (spam prevention)
 * Development: 50 req/min, Production: 20 req/min
 */
export const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minut
    max: process.env.NODE_ENV === "production" ? 20 : 50, // Development: mere generous
    message: {
        error: "Du sender for mange beskeder, vent et øjeblik",
        retryAfter: "1 minute",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    handler: (req, res) => {
        logger.warn({
            type: "rate_limit_exceeded",
            ip: req.ip,
            path: req.path,
            limit: "chat",
            environment: process.env.NODE_ENV,
        }, "Chat rate limit exceeded");

        res.status(429).json({
            error: "Du sender for mange beskeder, vent et øjeblik",
            retryAfter: "1 minute",
        });
    },
});

/**
 * Dashboard-specific rate limiter
 * Medium limits for dashboard data endpoints
 * Development: 500 req/min, Production: 300 req/min
 * 
 * NOTE: Dashboard makes 7-10 simultaneous API calls on load:
 * - /api/dashboard/stats/overview
 * - /api/dashboard/cache/stats  
 * - /api/dashboard/leads
 * - /api/dashboard/bookings/upcoming
 * - /api/dashboard/revenue
 * - /api/dashboard/services
 * - + monitoring widgets (conflicts, email quality, follow-up, rate limits)
 * 
 * 300 req/min allows ~20 full dashboard loads per minute (15s between loads)
 * which is reasonable for multiple concurrent admin users.
 */
export const dashboardLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minut
    max: process.env.NODE_ENV === "production" ? 300 : 500, // 5x more headroom to prevent burst 429 errors
    message: {
        error: "For mange dashboard forespørgsler, prøv igen om lidt",
        retryAfter: "1 minute",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({
            type: "rate_limit_exceeded",
            ip: req.ip,
            path: req.path,
            limit: "dashboard",
            environment: process.env.NODE_ENV,
        }, "Dashboard rate limit exceeded");

        res.status(429).json({
            error: "For mange dashboard forespørgsler, prøv igen om lidt",
            retryAfter: "1 minute",
        });
    },
});

/**
 * Strict rate limiter for authentication endpoints
 * Very tight limits to prevent brute force attacks
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutter
    max: 5, // Max 5 login attempts per 15 minutter
    message: {
        error: "For mange login forsøg, prøv igen senere",
        retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
    handler: (req, res) => {
        logger.error({
            type: "rate_limit_exceeded",
            ip: req.ip,
            path: req.path,
            limit: "auth",
            severity: "high",
        }, "Auth rate limit exceeded - possible brute force attack");

        res.status(429).json({
            error: "For mange login forsøg, prøv igen senere",
            retryAfter: "15 minutes",
        });
    },
});
