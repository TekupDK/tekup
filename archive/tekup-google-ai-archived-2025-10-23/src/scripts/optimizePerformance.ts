import { prisma } from "../services/databaseService";
import { logger } from "../logger";
import { redisService } from "../services/redisService";

/**
 * Performance optimization script
 * - Add database indexes
 * - Optimize queries
 * - Setup caching
 * - Clean up old data
 */
async function optimizePerformance() {
  try {
    logger.info("Starting performance optimization");

    // 1. Add database indexes for better query performance
    logger.info("Adding database indexes...");
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "EmailThread_customerId_idx" ON "EmailThread"("customerId");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "EmailThread_isMatched_idx" ON "EmailThread"("isMatched");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "EmailThread_lastMessageAt_idx" ON "EmailThread"("lastMessageAt");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "EmailMessage_threadId_idx" ON "EmailMessage"("threadId");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "EmailMessage_sentAt_idx" ON "EmailMessage"("sentAt");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Lead_email_idx" ON "Lead"("email");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Booking_customerId_idx" ON "Booking"("customerId");
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Booking_startTime_idx" ON "Booking"("startTime");
    `;

    logger.info("Database indexes added successfully");

    // 2. Test Redis connection
    logger.info("Testing Redis connection...");
    const redisStats = await redisService.getStats();
    if (redisStats.connected) {
      logger.info({ memory: redisStats.memory }, "Redis connected successfully");
    } else {
      logger.warn("Redis not available, using in-memory cache only");
    }

    // 3. Clean up old data
    logger.info("Cleaning up old data...");
    
    // Delete old email ingest runs (keep last 10)
    const oldIngestRuns = await prisma.emailIngestRun.findMany({
      orderBy: { createdAt: 'desc' },
      skip: 10,
      select: { id: true }
    });
    
    if (oldIngestRuns.length > 0) {
      await prisma.emailIngestRun.deleteMany({
        where: { id: { in: oldIngestRuns.map(r => r.id) } }
      });
      logger.info({ deleted: oldIngestRuns.length }, "Deleted old email ingest runs");
    }

    // Delete old email messages (keep last 1000)
    const oldMessages = await prisma.emailMessage.findMany({
      orderBy: { sentAt: 'desc' },
      skip: 1000,
      select: { id: true }
    });
    
    if (oldMessages.length > 0) {
      await prisma.emailMessage.deleteMany({
        where: { id: { in: oldMessages.map(m => m.id) } }
      });
      logger.info({ deleted: oldMessages.length }, "Deleted old email messages");
    }

    // 4. Analyze database performance
    logger.info("Analyzing database performance...");
    
    const tableStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats 
      WHERE schemaname = 'public'
      ORDER BY tablename, attname;
    `;

    logger.info({ tableStats }, "Database statistics");

    // 5. Test query performance
    logger.info("Testing query performance...");
    
    const startTime = Date.now();
    
    // Test dashboard stats query
    const dashboardStats = await prisma.customer.aggregate({
      _count: true
    });
    
    const queryTime = Date.now() - startTime;
    logger.info({ 
      queryTime: `${queryTime}ms`,
      customerCount: dashboardStats._count 
    }, "Dashboard query performance test");

    // 6. Setup cache warming
    logger.info("Warming up cache...");
    
    // Cache frequently accessed data
    const customers = await prisma.customer.findMany({
      select: { id: true, name: true, email: true }
    });
    
    await redisService.set('customers:all', JSON.stringify(customers), 3600); // 1 hour
    
    const leads = await prisma.lead.findMany({
      select: { id: true, email: true, status: true },
      take: 100
    });
    
    await redisService.set('leads:recent', JSON.stringify(leads), 1800); // 30 minutes

    logger.info("Performance optimization completed successfully");

  } catch (error) {
    logger.error({ error }, "Performance optimization failed");
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  optimizePerformance()
    .then(() => {
      logger.info("Performance optimization completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, "Performance optimization failed");
      process.exit(1);
    });
}

export { optimizePerformance };