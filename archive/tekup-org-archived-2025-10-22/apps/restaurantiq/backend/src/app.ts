/**
 * RestaurantIQ Backend Application Entry Point
 * Initializes and starts the Express server with all configurations
 */

import 'dotenv/config';
import { createApp, startServer } from './config/server';
import { loggers } from './config/logger';
import { connectDb, runMigrations, runSeeds } from './config/database';
import { redis, healthCheck as redisHealthCheck } from './config/redis';

/**
 * Initialize the application
 */
async function initializeApp(): Promise<void> {
  try {
    loggers.info('Starting RestaurantIQ Backend Server', {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    });

    // Connect to database
    loggers.info('Connecting to database...');
    await connectDb();
    loggers.info('Database connected successfully');

    // Run migrations in production/staging
    if (process.env.NODE_ENV !== 'development') {
      loggers.info('Running database migrations...');
      await runMigrations();
      loggers.info('Database migrations completed');
    }

    // Run seeds in development if AUTO_SEED is true
    if (process.env.NODE_ENV === 'development' && process.env.AUTO_SEED === 'true') {
      loggers.info('Running database seeds...');
      await runSeeds();
      loggers.info('Database seeds completed');
    }

    // Test Redis connection
    loggers.info('Testing Redis connection...');
    const redisHealth = await redisHealthCheck();
    if (redisHealth.status === 'healthy') {
      loggers.info('Redis connected successfully');
    } else {
      loggers.warn('Redis connection issues detected', { error: redisHealth.error });
    }

    // Create Express app
    loggers.info('Initializing Express application...');
    const app = createApp();

    // Start server
    await startServer(app);
    
    loggers.info('RestaurantIQ Backend Server started successfully');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    loggers.error('Failed to initialize application', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Exit with error code
    process.exit(1);
  }
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', (reason, promise) => {
  loggers.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise,
  });

  // Exit gracefully
  process.exit(1);
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  loggers.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  // Exit immediately
  process.exit(1);
});

/**
 * Handle process warnings
 */
process.on('warning', (warning) => {
  loggers.warn('Process Warning', {
    name: warning.name,
    message: warning.message,
    stack: warning.stack,
  });
});

// Start the application
if (require.main === module) {
  initializeApp();
}

export { initializeApp };
export default initializeApp;
