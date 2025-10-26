#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Copy frontend build files to dist/static (Deno version)
 *
 * This script copies the built frontend files from ../frontend/dist
 * to dist/static so they can be served by the bundled CLI application.
 */

import { copy, ensureDir, exists } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-script');


// Get current script directory
const currentFile = new URL(import.meta.url).pathname;
const currentDir = dirname(currentFile);

// Paths
const frontendDistPath = join(currentDir, "../../frontend/dist");
const backendStaticPath = join(currentDir, "../dist/static");

try {
  // Check if frontend build exists
  if (!(await exists(frontendDistPath))) {
    logger.error("❌ Frontend build not found at:", frontendDistPath);
    logger.error("   Please run 'cd ../frontend && npm run build' first");
    Deno.exit(1);
  }

  // Ensure target directory exists
  await ensureDir(dirname(backendStaticPath));

  // Copy frontend files
  await copy(frontendDistPath, backendStaticPath, { overwrite: true });
  logger.info("✅ Frontend files copied to dist/static");
} catch (error) {
  logger.error("❌ Failed to copy frontend files:", error.message);
  Deno.exit(1);
}