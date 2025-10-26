/**
 * Winston Logger for Billy MCP Client
 * Following Tekup-Billy logging pattern
 */

import winston from 'winston';

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'billy-mcp-client'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for production (optional)
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: 'logs/billy-mcp-error.log',
        level: 'error'
      }),
      new winston.transports.File({
        filename: 'logs/billy-mcp-combined.log'
      })
    ] : [])
  ]
});

/**
 * Log levels:
 * - error: Failures requiring attention
 * - warn: Potential issues
 * - info: Important operations
 * - debug: Detailed debugging
 */

/**
 * Export logger for easy import
 * Usage: logger.info('message', { context })
 */
export default logger;

