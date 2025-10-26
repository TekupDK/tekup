#!/usr/bin/env node

import { cache } from "../services/cacheService";
import { logger } from "../logger";

/**
 * CLI tool for monitoring and managing cache
 * 
 * Usage:
 *   npm run cache:stats      - Show cache statistics
 *   npm run cache:clear      - Clear all cache
 *   npm run cache:cleanup    - Remove expired entries
 */

function displayStats(): void {
    const stats = cache.getStats();
    const hitRate = cache.getHitRate();

    console.log("\n📊 Cache Statistics\n");
    console.log("━".repeat(50));
    console.log(`Total Hits:      ${stats.hits}`);
    console.log(`Total Misses:    ${stats.misses}`);
    console.log(`Hit Rate:        ${(hitRate * 100).toFixed(2)}%`);
    console.log(`Current Size:    ${stats.size} entries`);
    console.log("━".repeat(50));
    console.log();
}

function clearCache(): void {
    console.log("\n🧹 Clearing cache...\n");
    cache.clear();
    console.log("✅ Cache cleared successfully!\n");
}

function cleanupCache(): void {
    console.log("\n🧹 Cleaning up expired entries...\n");
    const removed = cache.cleanup();
    console.log(`✅ Removed ${removed} expired entries\n`);
    displayStats();
}

function main(): void {
    const command = process.argv[2];

    try {
        switch (command) {
            case "stats":
                displayStats();
                break;

            case "clear":
                clearCache();
                break;

            case "cleanup":
                cleanupCache();
                break;

            default:
                console.log("\n📦 Cache Monitor Tool\n");
                console.log("Available commands:");
                console.log("  stats      - Show cache statistics");
                console.log("  clear      - Clear all cache");
                console.log("  cleanup    - Remove expired entries");
                console.log("\nExample:");
                console.log("  npm run cache:stats");
                console.log();
                break;
        }
    } catch (error) {
        logger.error({ error }, "Cache monitor tool failed");
        console.error("\n❌ Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
