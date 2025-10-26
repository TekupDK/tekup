import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import * as winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

export interface LogContext {
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  [key: string]: any;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  correlationId?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    operation: string;
  };
  metadata?: Record<string, any>;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

@Injectable({ scope: Scope.DEFAULT })
export class StructuredLoggerService implements LoggerService {
  private readonly logger: winston.Logger;
  private readonly asyncLocalStorage = new AsyncLocalStorage<LogContext>();
  private readonly serviceName: string;
  private readonly environment: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'project-x-api';
    this.environment = process.env.NODE_ENV || 'development';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf((info) => {
          const contextData = this.getContextualData();
          const logEntry: StructuredLogEntry = {
            timestamp: info.timestamp as string,
            level: info.level as string,
            message: info.message as string,
            ...contextData,
            context: info.context as Record<string, any> | undefined,
            error: info.error as any,
            performance: info.performance as any,
            metadata: {
              ...(info.metadata as Record<string, any> || {}),
              service: this.serviceName,
              environment: this.environment,
              version: process.env.npm_package_version || '1.0.0',
            },
          };

          return JSON.stringify(logEntry);
        })
      ),
      transports: [
        new winston.transports.Console({
          format: this.environment === 'development' 
            ? winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf((info) => {
                  const context = this.getContextualData();
                  const contextStr = context.correlationId 
                    ? `[${context.correlationId}${context.tenantId ? `:${context.tenantId}` : ''}] `
                    : '';
                  return `${info.timestamp} ${info.level}: ${contextStr}${info.message}`;
                })
              )
            : winston.format.json()
        }),
      ],
    });

    // Add file transport for production
    if (this.environment === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }));

      this.logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }));
    }
  }

  /**
   * Set context for the current async operation
   */
  setContext(context: LogContext): void {
    const currentContext = this.asyncLocalStorage.getStore() || {};
    this.asyncLocalStorage.enterWith({ ...currentContext, ...context });
  }

  /**
   * Run a function with a specific logging context
   */
  runWithContext<T>(context: LogContext, fn: () => T): T {
    const currentContext = this.asyncLocalStorage.getStore() || {};
    return this.asyncLocalStorage.run({ ...currentContext, ...context }, fn);
  }

  /**
   * Get current contextual data
   */
  getContextualData(): LogContext {
    return this.asyncLocalStorage.getStore() || {};
  }

  /**
   * Generate a new correlation ID
   */
  generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Set correlation ID for current context
   */
  setCorrelationId(correlationId?: string): string {
    const id = correlationId || this.generateCorrelationId();
    this.setContext({ correlationId: id });
    return id;
  }

  /**
   * Set tenant ID for current context
   */
  setTenantId(tenantId: string): void {
    this.setContext({ tenantId });
  }

  /**
   * Set user ID for current context
   */
  setUserId(userId: string): void {
    this.setContext({ userId });
  }

  /**
   * Set request ID for current context
   */
  setRequestId(requestId: string): void {
    this.setContext({ requestId });
  }

  /**
   * Set trace and span IDs for distributed tracing
   */
  setTraceContext(traceId: string, spanId?: string): void {
    this.setContext({ traceId, spanId });
  }

  /**
   * Log an error with structured data
   */
  error(message: string, error?: Error | string, context?: Record<string, any>): void {
    const errorData = this.formatError(error);
    this.logger.error(message, {
      context,
      error: errorData,
    });
  }

  /**
   * Log a warning with structured data
   */
  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, { context });
  }

  /**
   * Log info with structured data
   */
  log(message: string, context?: Record<string, any>): void {
    this.info(message, context);
  }

  /**
   * Log info with structured data
   */
  info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, { context });
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, { context });
  }

  /**
   * Log verbose information
   */
  verbose(message: string, context?: Record<string, any>): void {
    this.logger.verbose(message, { context });
  }

  /**
   * Log HTTP request/response information
   */
  http(message: string, context?: Record<string, any>): void {
    this.logger.http(message, { context });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.logger.info(`Performance: ${operation}`, {
      context,
      performance: {
        operation,
        duration,
      },
    });
  }

  /**
   * Log database query performance
   */
  queryPerformance(query: string, duration: number, rowCount?: number, context?: Record<string, any>): void {
    this.logger.info('Database query executed', {
      context: {
        ...context,
        query: this.sanitizeQuery(query),
        rowCount,
      },
      performance: {
        operation: 'database_query',
        duration,
      },
    });
  }

  /**
   * Log cache operations
   */
  cacheOperation(operation: string, key: string, hit?: boolean, duration?: number, context?: Record<string, any>): void {
    this.logger.info(`Cache ${operation}`, {
      context: {
        ...context,
        cacheKey: key,
        cacheHit: hit,
      },
      performance: duration ? {
        operation: `cache_${operation}`,
        duration,
      } : undefined,
    });
  }

  /**
   * Log API request/response
   */
  apiRequest(method: string, url: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    this.logger.http(`${method} ${url} ${statusCode}`, {
      context: {
        ...context,
        method,
        url: this.sanitizeUrl(url),
        statusCode,
      },
      performance: {
        operation: 'api_request',
        duration,
      },
    });
  }

  /**
   * Log business events
   */
  businessEvent(event: string, data?: Record<string, any>, context?: Record<string, any>): void {
    this.logger.info(`Business event: ${event}`, {
      context: {
        ...context,
        event,
        eventData: data,
      },
    });
  }

  // Backwards compatibility wrapper used by existing services (signature: event, entity, subject, context)
  logBusinessEvent(event: string, entity: string, subject: string, context?: Record<string, any>): void {
    this.businessEvent(event, { entity, subject, ...(context?.metadata ? { metadata: context.metadata } : {}) }, context);
  }

  /**
   * Log security events
   */
  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: Record<string, any>): void {
    this.logger.warn(`Security event: ${event}`, {
      context: {
        ...context,
        securityEvent: event,
        severity,
      },
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): StructuredLoggerService {
    const childLogger = new StructuredLoggerService();
    childLogger.setContext({ ...this.getContextualData(), ...context });
    return childLogger;
  }

  /**
   * Format error for logging
   */
  private formatError(error?: Error | string): any {
    if (!error) return undefined;

    if (typeof error === 'string') {
      return { message: error };
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
    };
  }

  /**
   * Sanitize SQL query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data from queries
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/token\s*=\s*'[^']*'/gi, "token='***'")
      .replace(/key\s*=\s*'[^']*'/gi, "key='***'")
      .substring(0, 500); // Limit query length
  }

  /**
   * Sanitize URL for logging (remove sensitive parameters)
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, 'http://localhost');
      
      // Remove sensitive query parameters
      const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key'];
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '***');
        }
      });

      return urlObj.pathname + urlObj.search;
    } catch {
      // If URL parsing fails, return sanitized string
      return url.replace(/([?&])(password|token|key|secret|api_key)=[^&]*/gi, '$1$2=***');
    }
  }

  /**
   * Get current log level
   */
  getLogLevel(): string {
    return this.logger.level;
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logger.level = level;
  }

  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: LogLevel): boolean {
    return this.logger.isLevelEnabled(level);
  }

  /**
   * Flush all pending logs (useful for testing)
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }

  /**
   * Get logger statistics
   */
  getStats(): Record<string, any> {
    return {
      level: this.logger.level,
      transports: this.logger.transports.length,
      service: this.serviceName,
      environment: this.environment,
    };
  }
}

// Type alias for backwards compatibility
export type StructuredLogger = StructuredLoggerService;

// Export instance for convenience
export const createLogger = (context?: Record<string, any>) => {
  const logger = new StructuredLoggerService();
  if (context) {
    logger.setContext(context);
  }
  return logger;
};