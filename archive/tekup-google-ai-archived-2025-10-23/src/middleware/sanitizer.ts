/**
 * 🧹 Input Sanitization Middleware
 * 
 * Beskytter RenOS mod XSS (Cross-Site Scripting) attacks ved at
 * fjerne eller escape farlige HTML tags og JavaScript fra user input.
 * 
 * Sanitization niveauer:
 * - Strict: Ingen HTML tags tilladt (chat messages)
 * - Moderate: Basale formatting tags tilladt (beskrivelser)
 * - Permissive: Flere tags tilladt (admin content)
 */

import sanitizeHtml from "sanitize-html";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

/**
 * Strict sanitization - NO HTML tags allowed
 * Bruges til chat messages og kritiske input fields
 */
export const sanitizeOptions = {
    strict: {
        allowedTags: [], // No HTML tags
        allowedAttributes: {},
        disallowedTagsMode: "escape" as const,
    },
    moderate: {
        allowedTags: ["b", "i", "em", "strong", "u", "br"], // Basic formatting
        allowedAttributes: {},
        disallowedTagsMode: "escape" as const,
    },
    permissive: {
        allowedTags: [
            "b", "i", "em", "strong", "u", "br", "p",
            "ul", "ol", "li", "a", "blockquote"
        ],
        allowedAttributes: {
            a: ["href", "title"],
        },
        disallowedTagsMode: "escape" as const,
        allowedSchemes: ["http", "https", "mailto"],
    },
};

/**
 * Sanitizer funktioner
 */
export const sanitize = {
    /**
     * Strict - ingen HTML
     */
    strict: (input: string): string => {
        return sanitizeHtml(input, sanitizeOptions.strict);
    },

    /**
     * Moderate - basale tags
     */
    moderate: (input: string): string => {
        return sanitizeHtml(input, sanitizeOptions.moderate);
    },

    /**
     * Permissive - flere tags (admin brug)
     */
    permissive: (input: string): string => {
        return sanitizeHtml(input, sanitizeOptions.permissive);
    },

    /**
     * Sanitize all string properties in an object recursively
     */
    object: (obj: Record<string, unknown>, level: "strict" | "moderate" | "permissive" = "strict"): Record<string, unknown> => {
        const sanitizeFunc = sanitize[level];
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "string") {
                result[key] = sanitizeFunc(value);
            } else if (Array.isArray(value)) {
                result[key] = value.map((item: unknown) =>
                    typeof item === "string" ? sanitizeFunc(item) : item
                );
            } else if (value && typeof value === "object") {
                result[key] = sanitize.object(value as Record<string, unknown>, level);
            } else {
                result[key] = value;
            }
        }

        return result;
    },
};

/**
 * Express middleware for strict sanitization (default)
 * Bruges på chat endpoints
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
    try {
        // Sanitize body
        if (req.body && typeof req.body === "object") {
            req.body = sanitize.object(req.body as Record<string, unknown>, "strict");
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === "object") {
            req.query = sanitize.object(req.query as Record<string, unknown>, "strict") as typeof req.query;
        }

        // Log if dangerous content was removed
        const originalBody = JSON.stringify(req.body);
        const hasScript = /<script|javascript:|onerror=|onclick=/i.test(originalBody);

        if (hasScript) {
            logger.warn({
                type: "xss_attempt_blocked",
                ip: req.ip,
                path: req.path,
                method: req.method,
                userAgent: req.headers["user-agent"],
            }, "Potential XSS attempt blocked by sanitizer");
        }

        next();
    } catch (error) {
        logger.error({ err: error }, "Sanitization middleware error");
        next(error);
    }
}

/**
 * Moderate sanitization middleware
 * Tillader basale formatting tags
 */
export function sanitizeModerate(req: Request, res: Response, next: NextFunction): void {
    try {
        if (req.body && typeof req.body === "object") {
            req.body = sanitize.object(req.body as Record<string, unknown>, "moderate");
        }

        if (req.query && typeof req.query === "object") {
            req.query = sanitize.object(req.query as Record<string, unknown>, "moderate") as typeof req.query;
        }

        next();
    } catch (error) {
        logger.error({ err: error }, "Sanitization middleware error");
        next(error);
    }
}

/**
 * Validering af input længde
 * Forhindrer memory exhaustion attacks
 */
export function validateInputLength(
    maxLength: number = 10000
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction): void => {
        const bodyString = JSON.stringify(req.body);

        if (bodyString.length > maxLength) {
            logger.warn({
                type: "input_too_large",
                ip: req.ip,
                path: req.path,
                size: bodyString.length,
                maxSize: maxLength,
            }, "Input too large, rejected");

            res.status(413).json({
                error: "Input for stort",
                message: `Maksimal størrelse er ${maxLength} tegn`,
            });
            return;
        }

        next();
    };
}

/**
 * Validering af tegn (kun danske bogstaver, tal, basic punctuation)
 * Streng validering for high-risk endpoints
 */
export function validateCharacters(req: Request, res: Response, next: NextFunction): void {
    const message = (req.body as { message?: unknown })?.message;

    if (typeof message !== "string") {
        next();
        return;
    }

    // Allow: Danish letters, numbers, spaces, basic punctuation
    const allowedPattern = /^[a-zA-ZæøåÆØÅ0-9\s.,!?;:()\-'"@\n]+$/;

    if (!allowedPattern.test(message)) {
        logger.warn({
            type: "invalid_characters",
            ip: req.ip,
            path: req.path,
            message: message.substring(0, 100), // Log first 100 chars
        }, "Invalid characters detected in input");

        res.status(400).json({
            error: "Ugyldige tegn i besked",
            message: "Kun danske bogstaver, tal og basale tegn er tilladt",
        });
        return;
    }

    next();
}
