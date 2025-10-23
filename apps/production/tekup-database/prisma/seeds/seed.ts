/**
 * Tekup Database - Seed Script
 * 
 * Seeds the database with test data for development
 */

import { prisma } from '../../src/client';
import { logger } from '../../src/utils/logger';

async function seedVault() {
  logger.info('Seeding vault schema...');
  
  // Seed vault documents
  await prisma.vaultDocument.createMany({
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
  await prisma.vaultSyncStatus.createMany({
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

  logger.info('Vault schema seeded!');
}

async function seedBilly() {
  logger.info('Seeding billy schema...');
  
  // Seed organization
  const org = await prisma.billyOrganization.create({
    data: {
      name: 'Test Organization',
      billyApiKey: 'encrypted_test_key',
      billyOrgId: 'test-org-123',
      settings: { cacheEnabled: true, auditEnabled: true },
    },
  });

  // Seed user
  await prisma.billyUser.create({
    data: {
      email: 'test@tekup.local',
      organizationId: org.id,
      role: 'admin',
      isActive: true,
    },
  });

  logger.info('Billy schema seeded!');
}

async function seedShared() {
  logger.info('Seeding shared schema...');
  
  // Seed shared user
  await prisma.sharedUser.create({
    data: {
      email: 'admin@tekup.dk',
      name: 'Admin User',
    },
  });

  logger.info('Shared schema seeded!');
}

async function main() {
  try {
    logger.info('Starting database seed...');

    await seedVault();
    await seedBilly();
    await seedShared();

    logger.info('Database seeded successfully!');
  } catch (error) {
    logger.error('Seed failed', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
