import { PrismaClient } from '@prisma/client';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-scripts-seed');


async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.tenant.count();
  if (count > 0) { logger.info('Tenants already seeded'); return; }
  const tenants = [
    { slug: 'rendetalje', name: 'Rendetalje' },
    { slug: 'foodtruck', name: 'Foodtruck Fiesta' },
    { slug: 'tekup', name: 'TekUp' }
  ];
  for (const t of tenants) {
    const tenant = await prisma.tenant.create({ data: t });
    await prisma.apiKey.create({ data: { tenantId: tenant.id, key: crypto.randomUUID().replace(/-/g, '') } });
  }
  logger.info('Seeded tenants + api keys');
  const rows = await prisma.apiKey.findMany({ include: { tenant: true } });
  for (const r of rows) logger.info(`${r.tenant.slug}: ${r.key}`);
  await prisma.$disconnect();
}

main().catch(e => { logger.error(e); process.exit(1); });
