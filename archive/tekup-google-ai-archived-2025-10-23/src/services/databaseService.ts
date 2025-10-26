import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { databaseConfig } from '../config';

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection test failed');
    return false;
  }
}

/**
 * Initialize database with health check
 */
export async function initializeDatabase(): Promise<void> {
  logger.info('Testing database connection...');

  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    logger.error('Failed to establish database connection');
    throw new Error('Database connection failed');
  }

  logger.info('Database connection established successfully');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: databaseConfig.DB_LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] :
      databaseConfig.DB_LOG_LEVEL === 'info' ? ['info', 'warn', 'error'] :
        ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from database');
  }
}
