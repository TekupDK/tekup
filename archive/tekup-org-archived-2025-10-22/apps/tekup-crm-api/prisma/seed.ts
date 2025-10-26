import { PrismaClient } from '@prisma/client';
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-tekup-crm-api-prisma-seed');


const prisma = new PrismaClient();

async function main() {
  // Create default deal stages for each tenant
  const tenants = await prisma.tenant.findMany();
  
  for (const tenant of tenants) {
    const existingStages = await prisma.dealStage.findMany({
      where: { tenantId: tenant.id }
    });
    
    if (existingStages.length === 0) {
      logger.info(`Creating default deal stages for tenant: ${tenant.name}`);
      
      const stages = [
        { name: 'Prospecting', order: 1, isClosed: false, isWon: false },
        { name: 'Qualification', order: 2, isClosed: false, isWon: false },
        { name: 'Needs Analysis', order: 3, isClosed: false, isWon: false },
        { name: 'Proposal', order: 4, isClosed: false, isWon: false },
        { name: 'Negotiation', order: 5, isClosed: false, isWon: false },
        { name: 'Closed Won', order: 6, isClosed: true, isWon: true },
        { name: 'Closed Lost', order: 7, isClosed: true, isWon: false }
      ];
      
      for (const stage of stages) {
        await prisma.dealStage.create({
          data: {
            ...stage,
            tenantId: tenant.id
          }
        });
      }
    }
  }
  
  logger.info('Seeding completed!');
}

main()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });