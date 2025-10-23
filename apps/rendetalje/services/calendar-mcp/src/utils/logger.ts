/**
 * RenOS Calendar Intelligence MCP - Logger
 * Winston-based logging with console and file output
 */

import winston from 'winston';
import config from '../config.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  return log;
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.server.isDevelopment ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: combine(
        colorize(),
        logFormat
      ),
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Export convenient logging methods
export function log(message: string, meta?: Record<string, unknown>) {
  logger.info(message, meta);
}

export function logError(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
  if (error instanceof Error) {
    logger.error(message, { ...meta, error: error.message, stack: error.stack });
  } else {
    logger.error(message, { ...meta, error });
  }
}

export function logWarn(message: string, meta?: Record<string, unknown>) {
  logger.warn(message, meta);
}

export function logDebug(message: string, meta?: Record<string, unknown>) {
  logger.debug(message, meta);
}

export default logger;

