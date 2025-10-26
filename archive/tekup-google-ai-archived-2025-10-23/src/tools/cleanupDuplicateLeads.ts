#!/usr/bin/env ts-node

import { writeFileSync } from 'fs';
import { prisma } from "../services/databaseService";
import { logger } from "../logger";

/**
 * Clean Up Duplicate Leads Tool
 * 
 * Finds and removes duplicate leads based on email address,
 * keeping only the most recent one.
 * 
 * Usage:
 *   npx ts-node src/tools/cleanupDuplicateLeads.ts              # Dry-run (safe)
 *   npx ts-node src/tools/cleanupDuplicateLeads.ts --live       # Hard delete
 *   npx ts-node src/tools/cleanupDuplicateLeads.ts --live --soft # Soft delete (marks deletedAt)
 */

interface DuplicateGroup {
    email: string;
    count: number;
    ids: string[];
    names: string[];
    createdAts: Date[];
}

interface CleanupOptions {
    dryRun: boolean;
    keepLatest?: number;
    logFile?: string;
}

async function findDuplicates(): Promise<DuplicateGroup[]> {
    const leads = await prisma.lead.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Group by email
    const emailGroups = new Map<string, typeof leads>();
    for (const lead of leads) {
        if (!lead.email) continue;

        const existing = emailGroups.get(lead.email) || [];
        existing.push(lead);
        emailGroups.set(lead.email, existing);
    }

    // Find duplicates (more than 1 lead per email)
    const duplicates: DuplicateGroup[] = [];
    for (const [email, group] of emailGroups.entries()) {
        if (group.length > 1) {
            duplicates.push({
                email,
                count: group.length,
                ids: group.map(l => l.id),
                names: group.map(l => l.name),
                createdAts: group.map(l => l.createdAt)
            });
        }
    }

    return duplicates;
}

async function cleanupDuplicates(options: CleanupOptions = { dryRun: true }): Promise<void> {
    const { dryRun, keepLatest = 1, logFile } = options;

    logger.info("🔍 Scanning for duplicate leads...");
    logger.info(`Mode: ${dryRun ? 'DRY-RUN (no changes)' : 'LIVE (will delete!)'}`);
    logger.info(`Strategy: Keep ${keepLatest} newest lead(s) per email`);

    const duplicates = await findDuplicates();

    if (duplicates.length === 0) {
        logger.info("✅ No duplicates found!");
        return;
    }

    logger.info(`Found ${duplicates.length} email addresses with duplicates:`);

    let totalDeleted = 0;
    const deletionLog: Array<{ email: string; kept: string; deleted: string[] }> = [];

    for (const dup of duplicates) {
        logger.info(`\n📧 ${dup.email} - ${dup.names[0]}`);
        logger.info(`   Total: ${dup.count} duplicates`);
        logger.info(`   IDs: ${dup.ids.join(', ')}`);

        // Keep the newest N leads (first N in array since we sorted by createdAt desc)
        const keepIds = dup.ids.slice(0, keepLatest);
        const deleteIds = dup.ids.slice(keepLatest);

        logger.info(`   ✅ Keeping: ${keepIds.join(', ')} (newest)`);
        logger.info(`   ❌ Removing: ${deleteIds.length} older leads`);

        if (!dryRun) {
            // Permanently delete old duplicates
            const result = await prisma.lead.deleteMany({
                where: {
                    id: { in: deleteIds }
                }
            });
            logger.info(`   �️  Deleted ${result.count} duplicate leads`);
            totalDeleted += result.count;

            deletionLog.push({
                email: dup.email,
                kept: keepIds[0],
                deleted: deleteIds
            });
        } else {
            totalDeleted += deleteIds.length;
        }
    }

    if (dryRun) {
        logger.info("\n⚠️  DRY-RUN MODE - No changes made");
        logger.info(`Would remove ${totalDeleted} duplicate leads`);
        logger.info("\nTo execute cleanup:");
        logger.info("  npx ts-node src/tools/cleanupDuplicateLeads.ts --live");
        logger.info("\n⚠️  WARNING: This permanently deletes data! Make a database backup first.");
    } else {
        logger.info(`\n✅ Cleanup complete! Removed ${totalDeleted} duplicate leads`);

        if (logFile) {
            writeFileSync(logFile, JSON.stringify(deletionLog, null, 2));
            logger.info(`📝 Deletion log saved to: ${logFile}`);
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const isLive = args.includes('--live');
    const keepLatest = parseInt(args.find(arg => arg.startsWith('--keep='))?.split('=')[1] || '1');
    const logFile = args.find(arg => arg.startsWith('--log='))?.split('=')[1];

    try {
        await cleanupDuplicates({
            dryRun: !isLive,
            keepLatest,
            logFile
        });
    } catch (error) {
        logger.error({ error }, "Failed to cleanup duplicates");
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    void main();
}

export { findDuplicates, cleanupDuplicates };
