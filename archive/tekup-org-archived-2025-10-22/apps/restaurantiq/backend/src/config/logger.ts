/**
 * Winston Logger Configuration for RestaurantIQ
 * Structured logging with Danish timezone support
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from './env';

// Custom format for Danish timestamp
const danishTimestamp = winston.format.timestamp({
  format: () => {
    return new Date().toLocaleString('da-DK', {
      timeZone: 'Europe/Copenhagen',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  },
});

// Custom format for console output
const consoleFormat = winston.format.combine(
  danishTimestamp,
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, userId, tenantId, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    
    if (service) log += ` [${service}]`;
    if (tenantId) log += ` [tenant:${tenantId}]`;
    if (userId) log += ` [user:${userId}]`;
    
    log += `: ${message}`;
    
    // Add metadata if present
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return log + metaStr;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  danishTimestamp,
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Custom format for database logging
const dbFormat = winston.format.combine(
  danishTimestamp,
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, query, duration, ...meta }) => {
    let log = `${timestamp} [${level}] [DB]`;
    
    if (duration) log += ` [${duration}ms]`;
    log += `: ${message}`;
    
    if (query && config.features.isDevelopment) {
      log += `\n  Query: ${query}`;
    }
    
    const metaStr = Object.keys(meta).length ? `\n  Meta: ${JSON.stringify(meta)}` : '';
    return log + metaStr;
  })
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport (always enabled in development)
  new winston.transports.Console({
    level: config.features.isDevelopment ? 'debug' : config.logging.level,
    format: consoleFormat,
  }),
];

// File transport (if enabled)
if (config.logging.file.enabled) {
  // General application logs
  transports.push(
    new DailyRotateFile({
      filename: config.logging.file.path.replace('.log', '-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      level: config.logging.level,
      format: fileFormat,
      auditFile: 'logs/audit.json',
    })
  );

  // Error logs (separate file)
  transports.push(
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: config.logging.file.maxSize,
      maxFiles: config.logging.file.maxFiles,
      level: 'error',
      format: fileFormat,
      auditFile: 'logs/error-audit.json',
    })
  );

  // Database logs (separate file if query logging is enabled)
  if (config.database.logging.queries) {
    transports.push(
      new DailyRotateFile({
        filename: 'logs/database-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        level: 'debug',
        format: dbFormat,
        auditFile: 'logs/database-audit.json',
      })
    );
  }
}

// Create the main logger
export const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: {
    service: 'restaurantiq-backend',
    version: config.app.version,
    environment: config.app.env,
  },
  transports,
  // Handle uncaught exceptions and promise rejections
  exceptionHandlers: config.logging.file.enabled
    ? [
        new winston.transports.Console({
          format: consoleFormat,
        }),
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
        }),
      ]
    : [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
  rejectionHandlers: config.logging.file.enabled
    ? [
        new winston.transports.Console({
          format: consoleFormat,
        }),
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
        }),
      ]
    : [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
});

// Create specialized loggers
export const dbLogger = winston.createLogger({
  level: 'debug',
  defaultMeta: {
    service: 'restaurantiq-database',
  },
  transports: [
    new winston.transports.Console({
      level: config.features.isDevelopment ? 'debug' : 'warn',
      format: dbFormat,
    }),
    ...(config.logging.file.enabled
      ? [
          new DailyRotateFile({
            filename: 'logs/database-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '7d',
            format: fileFormat,
          }),
        ]
      : []),
  ],
});

export const auditLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'restaurantiq-audit',
  },
  transports: [
    ...(config.logging.file.enabled
      ? [
          new DailyRotateFile({
            filename: 'logs/audit-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '90d', // Keep audit logs longer
            format: fileFormat,
          }),
        ]
      : []),
    ...(config.features.isDevelopment
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              danishTimestamp,
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level, message, userId, tenantId, action, resource, ...meta }) => {
                let log = `${timestamp} [${level}] [AUDIT]`;
                
                if (tenantId) log += ` [tenant:${tenantId}]`;
                if (userId) log += ` [user:${userId}]`;
                if (action) log += ` [${action}]`;
                if (resource) log += ` [${resource}]`;
                
                log += `: ${message}`;
                
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return log + metaStr;
              })
            ),
          }),
        ]
      : []),
  ],
});

// Performance logger for API timing
export const performanceLogger = winston.createLogger({
  level: 'info',
  defaultMeta: {
    service: 'restaurantiq-performance',
  },
  transports: [
    ...(config.logging.file.enabled
      ? [
          new DailyRotateFile({
            filename: 'logs/performance-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '50m',
            maxFiles: '14d',
            format: fileFormat,
          }),
        ]
      : []),
  ],
});

// Helper functions for structured logging
export const loggers = {
  // General application logging
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),

  // Database operations
  dbQuery: (query: string, duration?: number, meta?: Record<string, unknown>) =>
    dbLogger.info('Database query executed', { query, duration, ...meta }),
  
  dbError: (message: string, query?: string, error?: Error, meta?: Record<string, unknown>) =>
    dbLogger.error(message, { query, error: error?.message, stack: error?.stack, ...meta }),

  // Audit logging for compliance
  audit: (action: string, resource: string, userId?: string, tenantId?: string, meta?: Record<string, unknown>) =>
    auditLogger.info(`${action} ${resource}`, { action, resource, userId, tenantId, ...meta }),

  // Performance tracking
  performance: (operation: string, duration: number, success: boolean, meta?: Record<string, unknown>) =>
    performanceLogger.info(`${operation} completed`, { operation, duration, success, ...meta }),

  // Authentication events
  authSuccess: (userId: string, tenantId: string, method: string, ip?: string) =>
    auditLogger.info('Authentication successful', { 
      action: 'AUTH_SUCCESS', 
      userId, 
      tenantId, 
      method, 
      ip,
      timestamp: new Date().toISOString() 
    }),

  authFailure: (email: string, tenantDomain: string, reason: string, ip?: string) =>
    auditLogger.warn('Authentication failed', { 
      action: 'AUTH_FAILURE', 
      email, 
      tenantDomain, 
      reason, 
      ip,
      timestamp: new Date().toISOString() 
    }),

  // Business operations
  businessOperation: (operation: string, tenantId: string, userId?: string, data?: Record<string, unknown>) =>
    logger.info(`Business operation: ${operation}`, { operation, tenantId, userId, ...data }),

  // Security events
  securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: Record<string, unknown>) =>
    logger.warn(`Security event: ${event}`, { event, severity, ...details }),
};

// Create logs directory if it doesn't exist
import { promises as fs } from 'fs';
import { dirname } from 'path';

if (config.logging.file.enabled) {
  const logDir = dirname(config.logging.file.path);
  fs.mkdir(logDir, { recursive: true }).catch(() => {
    // Ignore errors - directory might already exist
  });
}

export default logger;
