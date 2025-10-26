/*
  Simple rotation CLI (dev): rotates ApiKey for given tenant/name.
  Usage: pnpm --filter @tekup/crm-api exec ts-node src/api-keys/scripts/rotate-keys.ts <tenantId> <name>
*/
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-tekup-crm-api-src-api-key');


async function main() {
  const [tenantId, name] = process.argv.slice(2);
  if (!tenantId || !name) {
    logger.error('Usage: rotate-keys <tenantId> <name>');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const raw = randomBytes(32).toString('base64url');
  const hash = createHash('sha256').update(raw).digest('hex');
  await prisma.apiKey.upsert({
    where: { hash },
    update: { name, tenantId },
    create: { tenantId, name, hash, permissions: ['crm:read', 'crm:write'] },
  });
  logger.info(JSON.stringify({ tenantId, name, apiKey: raw }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});

