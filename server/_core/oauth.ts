import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Development login endpoint - Auto-login as OWNER
  // Supports both browser redirect and test mode (JSON response)
  app.get("/api/auth/login", async (req: Request, res: Response) => {
    console.log(
      "[AUTH] Dev-login endpoint called, NODE_ENV:",
      process.env.NODE_ENV
    );

    // Check if test mode (return JSON instead of redirect)
    const isTestMode = req.query.mode === "test" || req.query.test === "true";
    const userAgent = req.headers["user-agent"] || "";
    const isTestEnvironment =
      userAgent.includes("vitest") ||
      userAgent.includes("jsdom") ||
      req.headers["x-test-mode"] === "true";

    // Allow in development AND production for now (we can disable later)
    // if (ENV.isProduction) {
    //   res.status(404).json({ error: "Not found" });
    //   return;
    // }

    const ownerOpenId = ENV.ownerOpenId || "owner-friday-ai-dev";

    try {
      // Validate required environment variables
      if (!ENV.cookieSecret) {
        throw new Error(
          "JWT_SECRET is not configured. Set JWT_SECRET in .env file."
        );
      }
      if (!ENV.appId) {
        throw new Error(
          "VITE_APP_ID is not configured. Set VITE_APP_ID in .env file."
        );
      }
      if (!ownerOpenId) {
        throw new Error("OWNER_OPEN_ID is not configured.");
      }

      // Get or create OWNER user
      let user = await db.getUserByOpenId(ownerOpenId);

      if (!user) {
        // Create OWNER user if it doesn't exist
        // Role defaults to "user" in schema, but can be manually updated to "admin" in DB
        await db.upsertUser({
          openId: ownerOpenId,
          name: "Jonas",
          email: "jonas@rendetalje.dk",
          loginMethod: "dev",
          lastSignedIn: new Date().toISOString(),
        });
        user = await db.getUserByOpenId(ownerOpenId);
      }

      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(ownerOpenId, {
        name: user.name || "Jonas",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie with proper options
      // CRITICAL FIX: For localhost development, override sameSite/secure settings
      // The default production settings (sameSite="none" + secure=false) are INVALID
      // and cause browsers to reject the cookie entirely
      const finalCookieOptions = {
        maxAge: ONE_YEAR_MS,
        httpOnly: true,
        path: "/",
        domain: undefined,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
      };
      res.cookie(COOKIE_NAME, sessionToken, finalCookieOptions);

      console.log("[AUTH] Session cookie set successfully:", {
        cookieName: COOKIE_NAME,
        sameSite: finalCookieOptions.sameSite,
        secure: finalCookieOptions.secure,
        httpOnly: finalCookieOptions.httpOnly,
        maxAge: finalCookieOptions.maxAge,
        domain: finalCookieOptions.domain,
        path: finalCookieOptions.path,
      });

      // Return JSON in test mode, redirect otherwise
      if (isTestMode || isTestEnvironment) {
        return res.status(200).json({
          success: true,
          message: "Login successful",
          cookieName: COOKIE_NAME,
          cookieValue: sessionToken,
          user: {
            id: user.id,
            openId: user.openId,
            name: user.name,
            email: user.email,
          },
        });
      }

      // For browser mode: Return HTML with client-side redirect
      // This ensures cookie is set before redirect happens
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Logging in...</title>
            <meta http-equiv="refresh" content="0; url=/">
          </head>
          <body>
            <p>Logging in... Redirecting to home page.</p>
            <script>window.location.href = "/";</script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("[Auth] Dev login failed", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const statusCode = errorMessage.includes("session") ? 500 : 500;
      res.status(statusCode).json({
        error: "Login failed",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  });

  // OAuth callback (for future OAuth integration if needed)
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // OAuth callback not implemented yet (Manus removed)
    // This can be implemented for future OAuth providers
    res.status(501).json({ error: "OAuth callback not implemented" });
  });
}
