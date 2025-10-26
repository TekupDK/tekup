#!/usr/bin/env node

/**
 * Prepack script - Copy required files for npm package
 *
 * This script copies README.md and LICENSE from the project root
 * to the backend directory for npm package distribution.
 * Replaces the Unix-specific `cp` command for Windows compatibility.
 */

import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-backend-script');


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const projectRoot = join(__dirname, "../..");
const backendDir = join(__dirname, "..");
const readmePath = join(projectRoot, "README.md");
const licensePath = join(projectRoot, "LICENSE");
const targetReadmePath = join(backendDir, "README.md");
const targetLicensePath = join(backendDir, "LICENSE");

// Copy README.md
if (existsSync(readmePath)) {
  try {
    copyFileSync(readmePath, targetReadmePath);
    logger.info("✅ Copied README.md");
  } catch (error) {
    logger.error("❌ Failed to copy README.md:", error.message);
    process.exit(1);
  }
} else {
  logger.error("❌ README.md not found at:", readmePath);
  process.exit(1);
}

// Copy LICENSE
if (existsSync(licensePath)) {
  try {
    copyFileSync(licensePath, targetLicensePath);
    logger.info("✅ Copied LICENSE");
  } catch (error) {
    logger.error("❌ Failed to copy LICENSE:", error.message);
    process.exit(1);
  }
} else {
  logger.error("❌ LICENSE not found at:", licensePath);
  process.exit(1);
}

logger.info("✅ Prepack completed successfully");