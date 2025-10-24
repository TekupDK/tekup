"use strict";
/**
 * Tekup Database - Seed Script
 *
 * Seeds the database with test data for development
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../../src/client");
const logger_1 = require("../../src/utils/logger");
async function seedVault() {
    logger_1.logger.info('Seeding vault schema...');
    // Seed vault documents
    await client_1.prisma.vaultDocument.createMany({
        data: [
            {
                source: 'github',
                repository: 'TekupDK/tekup',
                path: 'README.md',
                content: 'Sample README content for testing',
                metadata: { type: 'documentation', language: 'markdown' },
            },
            {
                source: 'github',
                repository: 'TekupDK/tekup',
                path: 'src/index.ts',
                content: 'Sample TypeScript code for testing',
                metadata: { type: 'code', language: 'typescript' },
            },
        ],
        skipDuplicates: true,
    });
    // Seed sync status
    await client_1.prisma.vaultSyncStatus.createMany({
        data: [
            {
                source: 'github',
                repository: 'TekupDK/tekup',
                status: 'success',
                lastSyncAt: new Date(),
            },
        ],
        skipDuplicates: true,
    });
    logger_1.logger.info('Vault schema seeded!');
}
async function seedBilly() {
    logger_1.logger.info('Seeding billy schema...');
    // Seed organization
    const org = await client_1.prisma.billyOrganization.create({
        data: {
            name: 'Test Organization',
            billyApiKey: 'encrypted_test_key',
            billyOrgId: 'test-org-123',
            settings: { cacheEnabled: true, auditEnabled: true },
        },
    });
    // Seed user
    await client_1.prisma.billyUser.create({
        data: {
            email: 'test@tekup.local',
            organizationId: org.id,
            role: 'admin',
            isActive: true,
        },
    });
    logger_1.logger.info('Billy schema seeded!');
}
async function seedShared() {
    logger_1.logger.info('Seeding shared schema...');
    // Seed shared user
    await client_1.prisma.sharedUser.create({
        data: {
            email: 'admin@tekup.dk',
            name: 'Admin User',
        },
    });
    logger_1.logger.info('Shared schema seeded!');
}
async function main() {
    try {
        logger_1.logger.info('Starting database seed...');
        await seedVault();
        await seedBilly();
        await seedShared();
        logger_1.logger.info('Database seeded successfully!');
    }
    catch (error) {
        logger_1.logger.error('Seed failed', error);
        throw error;
    }
    finally {
        await client_1.prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=seed.js.map