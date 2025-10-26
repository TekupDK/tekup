/**
 * Deno-specific entry point
 *
 * This module handles Deno-specific initialization including CLI argument parsing,
 * Claude CLI validation, and server startup using the DenoRuntime.
 */

import { createApp } from "../app.ts";
import { DenoRuntime } from "../runtime/deno.ts";
import { parseCliArgs } from "./args.ts";
import { validateClaudeCli } from "./validation.ts";
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-cli-de');


async function main(runtime: DenoRuntime) {
  // Parse CLI arguments
  const args = parseCliArgs(runtime);

  // Validate Claude CLI availability and get the validated path
  const validatedClaudePath = await validateClaudeCli(runtime, args.claudePath);

  if (args.debug) {
    logger.info("🐛 Debug mode enabled");
  }

  // Get API keys from environment variables
  const anthropicApiKey = runtime.getEnv("ANTHROPIC_API_KEY");
  const openaiApiKey = runtime.getEnv("OPENAI_API_KEY");

  if (args.debug) {
    logger.info("🔑 API Keys configured:");
    logger.info(`   Anthropic: ${anthropicApiKey ? '✓' : '✗'}`);
    logger.info(`   OpenAI: ${openaiApiKey ? '✓' : '✗'}`);
  }

  // Create application
  const app = createApp(runtime, {
    debugMode: args.debug,
    staticPath: new URL("../dist/static", import.meta.url).pathname,
    claudePath: validatedClaudePath,
    anthropicApiKey,
    openaiApiKey,
  });

  // Start server (only show this message when everything is ready)
  logger.info(`🚀 Server starting on ${args.host}:${args.port}`);
  runtime.serve(args.port, args.host, app.fetch);
}

// Run the application
if (import.meta.main) {
  const runtime = new DenoRuntime();
  main(runtime).catch((error) => {
    logger.error("Failed to start server:", error);
    runtime.exit(1);
  });
}
