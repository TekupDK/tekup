/* Dev seed for ApiKeys per known tenants */
import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-tekup-crm-api-src-api-key');


const tenants = [
  { id: 'tenant-rendetalje', name: 'Rendetalje' },
  { id: 'tenant-foodtruck', name: 'Foodtruck Fiesta' },
  { id: 'tenant-tekup', name: 'Tekup' },
];

async function main() {
  const prisma = new PrismaClient();
  for (const t of tenants) {
    const raw = randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(raw).digest('hex');
    await prisma.apiKey.create({
      data: { tenantId: t.id, name: `${t.name}-default`, hash, permissions: ['crm:read', 'crm:write'] },
    });
    logger.info(`Seeded key for ${t.name}: ${raw}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});

