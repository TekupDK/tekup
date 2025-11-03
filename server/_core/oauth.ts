import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
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
          lastSignedIn: new Date(),
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
      const cookieOptions = getSessionCookieOptions(req);
      console.log("[AUTH] Setting session cookie:", {
        cookieName: COOKIE_NAME,
        options: cookieOptions,
        domain: req.get("host"),
      });

      // Cookie options for tests need to be more permissive
      const finalCookieOptions = {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
        httpOnly: false, // Allow frontend to read for debugging
        secure: false, // Allow over HTTP in development
        sameSite: isTestMode || isTestEnvironment ? "none" : "lax", // Most permissive for tests
        path: "/",
      };

      res.cookie(COOKIE_NAME, sessionToken, finalCookieOptions);

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

      // Redirect to home (browser mode)
      res.redirect(302, "/");
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
