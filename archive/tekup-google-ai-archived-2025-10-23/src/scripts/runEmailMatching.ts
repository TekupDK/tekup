#!/usr/bin/env node

import { rerunEmailMatching } from "./rerunEmailMatching";
import { logger } from "../logger";

/**
 * CLI script to run email matching
 * Usage: npm run email-matching
 */
async function main() {
  try {
    logger.info("Starting email matching script");
    await rerunEmailMatching();
    logger.info("Email matching script completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Email matching script failed");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}