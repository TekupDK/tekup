/**
 * Centralized logging utility for Tekup-Billy MCP Server
 * 
 * Features:
 * - PII redaction (email, phone, API keys)
 * - Structured logging with Winston
 * - Environment-specific log levels
 * - JSON formatting for production
 * - Console formatting for development
 */

import winston from 'winston';

// PII fields to redact
const PII_FIELDS = ['email', 'phone', 'apiKey', 'password', 'token', 'billy_api_key', 'billyApiKey'];

/**
 * Redact PII from log objects
 */
function redactPII(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactPII(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_FIELDS.includes(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactPII(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Custom format for console output (development)
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(redactPII(meta))}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

/**
 * Custom format for file/production output
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format((info) => {
    return redactPII(info);
  })()
);

/**
 * Determine log level based on environment
 */
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

/**
 * Winston logger instance
 */
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  defaultMeta: { 
    service: 'tekup-billy-mcp',
    version: '1.3.0'
  },
  transports: [
    // Console output (always enabled)
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat
    }),
    
    // File output (only in production or when LOG_TO_FILE=true)
    ...(process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true'
      ? [
          new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          }),
          new winston.transports.File({ 
            filename: 'logs/combined.log',
            maxsize: 5242880, // 5MB
            maxFiles: 5
          })
        ]
      : []
    )
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

/**
 * Helper functions for common log patterns
 */
export const log = {
  /**
   * Log info message
   */
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  /**
   * Log error message
   */
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else {
      logger.error(message, { ...meta, error });
    }
  },

  /**
   * Log warning message
   */
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  /**
   * Log debug message (only in development)
   */
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  /**
   * Log Billy.dk API call
   */
  billyApi: (method: string, endpoint: string, meta?: Record<string, any>) => {
    logger.info('Billy.dk API call', {
      method,
      endpoint,
      ...meta
    });
  },

  /**
   * Log MCP tool execution
   */
  mcpTool: (toolName: string, status: 'start' | 'success' | 'error', meta?: Record<string, any>) => {
    const level = status === 'error' ? 'error' : 'info';
    logger.log(level, `MCP tool: ${toolName}`, {
      tool: toolName,
      status,
      ...meta
    });
  },

  /**
   * Log Supabase operation
   */
  supabase: (operation: string, table: string, meta?: Record<string, any>) => {
    logger.debug('Supabase operation', {
      operation,
      table,
      ...meta
    });
  }
};

// Log startup
logger.info('Logger initialized', {
  level: LOG_LEVEL,
  environment: process.env.NODE_ENV || 'development',
  logToFile: process.env.LOG_TO_FILE === 'true' || process.env.NODE_ENV === 'production'
});

