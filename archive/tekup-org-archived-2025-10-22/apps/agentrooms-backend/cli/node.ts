#!/usr/bin/env node
/**
 * Node.js-specific entry point
 *
 * This module handles Node.js-specific initialization including CLI argument parsing,
 * Claude CLI validation, and server startup using the NodeRuntime.
 */

// Load environment variables from .env file (root and local)
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Load from root .env first
const __dirname = import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "../../../");
const rootEnv = await load({ envPath: join(rootDir, ".env") });

// Then load local .env (if exists) to override
const localEnv = await load({ envPath: ".env" }).catch(() => ({}));

// Apply all env vars to Deno.env (root first, then local overrides)
for (const [key, value] of Object.entries({ ...rootEnv, ...localEnv })) {
  Deno.env.set(key, value);
}

import { createApp } from "../app.ts";
import { NodeRuntime } from "../runtime/node.ts";
import { parseCliArgs } from "./args.ts";
import { validateClaudeCli } from "./validation.ts";
import { relative } from "node:path";

async function main(runtime: NodeRuntime) {
  // Parse CLI arguments
  const args = parseCliArgs(runtime);

  // Validate Claude CLI availability and get the validated path
  const validatedClaudePath = await validateClaudeCli(runtime, args.claudePath);

  if (args.debug) {
    logger.info("🐛 Debug mode enabled");
  }

  // Calculate static path relative to current working directory
  // Node.js 20.11.0+ compatible with fallback for older versions
  const __dirname =
    import.meta.dirname ?? dirname(fileURLToPath(import.meta.url));
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-cli-no');

  const staticAbsPath = join(__dirname, "../dist/static");
  let staticRelPath = relative(process.cwd(), staticAbsPath);
  // Handle edge case where relative() returns empty string
  if (staticRelPath === "") {
    staticRelPath = ".";
  }

  // Create application
  const app = createApp(runtime, {
    debugMode: args.debug,
    staticPath: staticRelPath,
    claudePath: validatedClaudePath,
  });

  // Start server (only show this message when everything is ready)
  logger.info(`🚀 Server starting on ${args.host}:${args.port}`);
  runtime.serve(args.port, args.host, app.fetch);
}

// Run the application
const runtime = new NodeRuntime();
main(runtime).catch((error) => {
  logger.error("Failed to start server:", error);
  runtime.exit(1);
});
