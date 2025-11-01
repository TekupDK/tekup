/**
 * Logger utility using Winston
 * Following Tekup standard logging patterns
 */

import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Custom log format
 */
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  
  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

/**
 * Winston logger instance
 */
export const log = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
  ],
});

/**
 * Helper to log errors with proper formatting
 */
export function logError(message: string, error: unknown): void {
  if (error instanceof Error) {
    log.error(message, {
      error: error.message,
      stack: error.stack,
    });
  } else {
    log.error(message, { error: String(error) });
  }
}

export default log;
