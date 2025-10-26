import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-scripts-rotate-t');


// Simple utility script to rotate (or create) a pk_ style API key for tenant 'tekup'.
// Usage (from repo root):
// pnpm --filter @tekup/flow-api ts-node scripts/rotate-tekup-key.ts

async function main() {
  const prisma = new PrismaClient();
  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'tekup' } });
    if (!tenant) {
      throw new Error("Tenant 'tekup' not found. Ensure migration/seed created it.");
    }

    const plainKey = 'pk_' + crypto.randomBytes(24).toString('base64url'); // ~32 chars after prefix
    const hashed = await bcrypt.hash(plainKey, 12);
    const keyPrefix = plainKey.slice(0, 8);

    // Find current active key(s) for rotation bookkeeping
    const existing = await prisma.apiKey.findFirst({ where: { tenantId: tenant.id, active: true }, orderBy: { createdAt: 'desc' } });

    const apiKey = await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        hashedKey: hashed,
        keyPrefix,
        active: true,
        rotationCount: existing ? existing.rotationCount + 1 : 0,
        rotatedFrom: existing ? existing.id : null,
        scopes: [],
        permissions: [],
        description: 'TekUp integration key',
        environment: 'production'
      }
    });

    // Optionally deactivate old key AFTER overlap window handled externally
    // await prisma.apiKey.update({ where: { id: existing.id }, data: { active: false, revokedAt: new Date(), revokedReason: 'rotated' } });

    if (existing) {
      await prisma.apiKeyRotationHistory.create({
        data: {
          apiKeyId: apiKey.id,
          oldKeyPrefix: existing.keyPrefix ?? existing.key?.substring(0,8) ?? null,
          newKeyPrefix: keyPrefix,
          reason: 'scheduled_rotation'
        }
      });
    }

    logger.info(JSON.stringify({ tenant: 'tekup', prefix: keyPrefix, plain: plainKey }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { logger.error(e); process.exit(1); });
