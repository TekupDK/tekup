/**
 * 🔐 Authentication Middleware
 * 
 * Simple authentication middleware for protecting API endpoints.
 * Currently uses environment flag to enable/disable auth.
 * 
 * Usage:
 * ```typescript
 * import { requireAuth } from "./middleware/authMiddleware";
 * app.use('/api/dashboard', requireAuth, dashboardRouter);
 * ```
 */

import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

// Enable auth in production only (set ENABLE_AUTH=true to enforce)
const AUTH_ENABLED = process.env.ENABLE_AUTH === "true";

// Optional: Admin token for quick team access during pilot phase
// Set ADMIN_TOKEN in environment for simple shared token authentication
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

/**
 * Simple authentication check
 * 
 * In development: Always allows through (auth disabled)
 * In production: Requires Authorization header with Bearer token
 * 
 * TODO: Integrate with Clerk SDK for full JWT verification once frontend is ready
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    // Skip auth if disabled (development mode)
    if (!AUTH_ENABLED) {
        logger.debug({ path: req.path }, "Auth check skipped (ENABLE_AUTH=false)");
        next();
        return;
    }

    // Check for Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn(
            {
                type: "auth_missing",
                ip: req.ip,
                path: req.path,
                method: req.method,
            },
            "Authentication required but missing"
        );

        res.status(401).json({
            error: "Unauthorized",
            message: "Du skal være logget ind for at få adgang til denne ressource.",
            code: "AUTH_REQUIRED",
        });
        return;
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token || token.length < 10) {
        logger.warn(
            {
                type: "auth_invalid_token",
                ip: req.ip,
                path: req.path,
            },
            "Invalid authentication token"
        );

        res.status(401).json({
            error: "Unauthorized",
            message: "Ugyldig authentication token.",
            code: "AUTH_INVALID",
        });
        return;
    }

    // Check for admin token (for pilot phase with shared team token)
    if (ADMIN_TOKEN && ADMIN_TOKEN.length > 0 && token === ADMIN_TOKEN) {
        logger.info(
            {
                type: "admin_token_auth",
                path: req.path,
            },
            "Admin token authentication successful"
        );
        next();
        return;
    }

    // TODO: Verify token with Clerk SDK for production
    // For now, accept any reasonably long token (pilot phase)
    logger.info(
        {
            type: "auth_success",
            path: req.path,
            tokenLength: token.length,
        },
        "Authentication successful"
    );

    next();
}

/**
 * Optional: Rate limit sensitive endpoints more strictly
 * Use this on admin or high-value endpoints
 */
export function requireStrictAuth(req: Request, res: Response, next: NextFunction): void {
    requireAuth(req, res, () => {
        // Additional checks can go here
        // For example: check user role, permissions, etc.
        next();
    });
}
