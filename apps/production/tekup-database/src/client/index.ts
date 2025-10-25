/**
 * Tekup Database - Prisma Client
 *
 * Main database client with connection pooling and logging
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

// Export client helpers
export { vault } from "./vault";
export { billy } from "./billy";
export { renos } from "./renos";
export { crm } from "./crm";
export { flow } from "./flow";

// Connection pool configuration (unused but kept for future use)
// const connectionConfig = {
//   pool: {
//     min: parseInt(process.env.DB_POOL_MIN || '2'),
//     max: parseInt(process.env.DB_POOL_MAX || '10'),
//     idleTimeoutMillis: 30000,
//   },
// };

// Prisma client instance
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],

  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info("Shutting down Prisma client...");
  await prisma.$disconnect();
  logger.info("Prisma client disconnected");
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error("Database connection failed", error);
    return false;
  }
}

// Export prisma client
export default prisma;
