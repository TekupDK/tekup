/**
 * Integration Tests for Tekup Database
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/client';
import { vault } from '../src/client/vault';
import { billy } from '../src/client/billy';

describe('Database Connection', () => {
  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  it('should have all schemas', async () => {
    const schemas = await prisma.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name IN ('vault', 'billy', 'renos', 'crm', 'flow', 'shared')
    `;
    
    expect(schemas.length).toBe(6);
  });
});

describe('Vault Schema', () => {
  it('should create and find documents', async () => {
    const doc = await vault.createDocument({
      source: 'test',
      repository: 'test-repo',
      path: 'test.md',
      content: 'Test content',
      metadata: { test: true },
    });

    expect(doc.id).toBeDefined();
    expect(doc.content).toBe('Test content');

    // Cleanup
    await prisma.vaultDocument.delete({ where: { id: doc.id } });
  });

  it('should update sync status', async () => {
    await vault.updateSyncStatus('test', 'test-repo', 'success');
    
    const status = await vault.getSyncStatus('test', 'test-repo');
    expect(status[0]?.status).toBe('success');

    // Cleanup
    await prisma.vaultSyncStatus.deleteMany({
      where: { source: 'test', repository: 'test-repo' },
    });
  });
});

describe('Billy Schema', () => {
  it('should create organization', async () => {
    const org = await billy.createOrganization({
      name: 'Test Org',
      billyApiKey: 'test-key',
      billyOrgId: 'test-123',
    });

    expect(org.id).toBeDefined();
    expect(org.billyOrgId).toBe('test-123');

    // Cleanup
    await prisma.billyOrganization.delete({ where: { id: org.id } });
  });

  it('should handle cache operations', async () => {
    const org = await billy.createOrganization({
      name: 'Cache Test',
      billyApiKey: 'key',
      billyOrgId: 'cache-123',
    });

    await billy.setCachedInvoice(org.id, 'inv-1', { test: true }, 1);
    
    const cached = await billy.getCachedInvoice(org.id, 'inv-1');
    expect(cached?.data).toEqual({ test: true });

    // Cleanup
    await prisma.billyOrganization.delete({ where: { id: org.id } });
  });

  it('should track usage metrics', async () => {
    const org = await billy.createOrganization({
      name: 'Metrics Test',
      billyApiKey: 'key',
      billyOrgId: 'metrics-123',
    });

    await billy.trackUsage(org.id, 'list_invoices', true, 150);

    // Query with wider date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const metrics = await billy.getUsageMetrics(org.id, yesterday, tomorrow);

    expect(metrics.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.billyOrganization.delete({ where: { id: org.id } });
  });
});

describe('Shared Schema', () => {
  it('should create shared user', async () => {
    const user = await prisma.sharedUser.create({
      data: {
        email: 'test@tekup.dk',
        name: 'Test User',
      },
    });

    expect(user.id).toBeDefined();

    // Cleanup
    await prisma.sharedUser.delete({ where: { id: user.id } });
  });

  it('should create audit log', async () => {
    const user = await prisma.sharedUser.create({
      data: { email: 'audit@tekup.dk', name: 'Audit Test' },
    });

    const log = await prisma.sharedAuditLog.create({
      data: {
        userId: user.id,
        action: 'test_action',
        resourceType: 'test',
        resourceId: 'test-123',
        metadata: { test: true },
      },
    });

    expect(log.id).toBeDefined();

    // Cleanup
    await prisma.sharedAuditLog.delete({ where: { id: log.id } });
    await prisma.sharedUser.delete({ where: { id: user.id } });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
