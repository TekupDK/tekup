/**
 * @fileoverview MCP Logger System
 * 
 * Structured logging with multiple transports, log levels, and
 * environment-specific configuration for MCP services.
 */

import winston from 'winston';
import { format } from 'winston';
import path from 'path';

// =============================================================================
// INTERFACES
// =============================================================================

export interface LoggerOptions {
  level?: string;
  service?: string;
  environment?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
  maxSize?: string;
  maxFiles?: number;
  enableJson?: boolean;
}

export interface LogContext {
  [key: string]: any;
}

// =============================================================================
// LOGGER CLASS
// =============================================================================

export class MCPLogger {
  private logger: winston.Logger;
  private service: string;
  private environment: string;
  
  constructor(service: string, options: LoggerOptions = {}) {
    this.service = service;
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    
    this.logger = this.createLogger(options);
  }
  
  /**
   * Create Winston logger with configured transports
   */
  private createLogger(options: LoggerOptions): winston.Logger {
    const logLevel = options.level || process.env.MCP_LOG_LEVEL || 'info';
    const enableConsole = options.enableConsole ?? true;
    const enableFile = options.enableFile ?? true;
    const enableJson = options.enableJson ?? (this.environment === 'production');
    
    // Create custom format
    const customFormat = format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      format.errors({ stack: true }),
      format.printf((info) => {
        const { timestamp, level, message, service, ...meta } = info;
        
        let logMessage = `${timestamp} [${level.toUpperCase()}] [${service || this.service}]`;
        
        if (typeof message === 'string') {
          logMessage += ` ${message}`;
        }
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
          if (enableJson) {
            logMessage += ` ${JSON.stringify(meta)}`;
          } else {
            logMessage += ` ${this.formatMetadata(meta)}`;
          }
        }
        
        return logMessage;
      })
    );
    
    // Create JSON format for production
    const jsonFormat = format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    );
    
    const transports: winston.transport[] = [];
    
    // Console transport
    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          level: logLevel,
          format: enableJson ? jsonFormat : format.combine(
            format.colorize(),
            customFormat
          )
        })
      );
    }
    
    // File transport
    if (enableFile) {
      const logDir = path.dirname(options.filePath || './logs/mcp-gateway.log');
      const filename = options.filePath || `./logs/${this.service}.log`;
      
      transports.push(
        new winston.transports.File({
          level: logLevel,
          filename,
          format: enableJson ? jsonFormat : customFormat,
          maxsize: this.parseSize(options.maxSize || '10MB'),
          maxFiles: options.maxFiles || 5,
          tailable: true
        })
      );
      
      // Separate error log file
      transports.push(
        new winston.transports.File({
          level: 'error',
          filename: filename.replace('.log', '.error.log'),
          format: enableJson ? jsonFormat : customFormat,
          maxsize: this.parseSize(options.maxSize || '10MB'),
          maxFiles: options.maxFiles || 5,
          tailable: true
        })
      );
    }
    
    return winston.createLogger({
      level: logLevel,
      defaultMeta: {
        service: this.service,
        environment: this.environment,
        pid: process.pid,
        hostname: require('os').hostname()
      },
      transports,
      exitOnError: false
    });
  }
  
  /**
   * Parse size string to bytes
   */
  private parseSize(sizeStr: string): number {
    const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    
    if (!match) {
      return 10 * 1024 * 1024; // Default 10MB
    }
    
    const [, size, unit] = match;
    return Math.floor(parseFloat(size) * units[unit.toUpperCase()]);
  }
  
  /**
   * Format metadata for readable output
   */
  private formatMetadata(meta: LogContext): string {
    const formatted: string[] = [];
    
    for (const [key, value] of Object.entries(meta)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (typeof value === 'object') {
        if (value instanceof Error) {
          formatted.push(`${key}=${value.message}`);
          if (value.stack && this.environment === 'development') {
            formatted.push(`stack=${value.stack}`);
          }
        } else {
          formatted.push(`${key}=${JSON.stringify(value)}`);
        }
      } else {
        formatted.push(`${key}=${value}`);
      }
    }
    
    return formatted.length > 0 ? `{${formatted.join(', ')}}` : '';
  }
  
  /**
   * Create child logger with additional context
   */
  child(context: LogContext): MCPLogger {
    const childLogger = new MCPLogger(this.service);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
  
  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }
  
  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }
  
  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }
  
  /**
   * Error level logging
   */
  error(message: string, error?: Error | LogContext, context?: LogContext): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack, ...context });
    } else {
      this.logger.error(message, error);
    }
  }
  
  /**
   * Fatal level logging (treated as error)
   */
  fatal(message: string, error?: Error | LogContext, context?: LogContext): void {
    this.error(`FATAL: ${message}`, error, context);
  }
  
  /**
   * Log HTTP requests
   */
  logRequest(req: any, res: any, responseTime: number): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      requestId: req.requestId
    });
  }
  
  /**
   * Log service events
   */
  logServiceEvent(event: string, serviceId: string, details?: LogContext): void {
    this.info(`Service Event: ${event}`, {
      serviceId,
      event,
      ...details
    });
  }
  
  /**
   * Log health check results
   */
  logHealthCheck(serviceId: string, healthy: boolean, responseTime: number, error?: string): void {
    const level = healthy ? 'info' : 'warn';
    const message = `Health Check: ${serviceId}`;
    
    this.logger[level](message, {
      serviceId,
      healthy,
      responseTime: `${responseTime}ms`,
      error
    });
  }
  
  /**
   * Log performance metrics
   */
  logMetrics(metrics: Record<string, any>): void {
    this.info('Performance Metrics', metrics);
  }
  
  /**
   * Log security events
   */
  logSecurityEvent(event: string, details: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      securityEvent: event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
  
  /**
   * Log configuration changes
   */
  logConfigChange(action: string, details: LogContext): void {
    this.info(`Configuration ${action}`, {
      configAction: action,
      ...details
    });
  }
  
  /**
   * Start a timer for measuring duration
   */
  startTimer(label: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Timer: ${label}`, { duration: `${duration}ms` });
      return duration;
    };
  }
  
  /**
   * Profile a function execution
   */
  async profile<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.debug(`Profile: ${label} completed`, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`Profile: ${label} failed`, error, { duration: `${duration}ms` });
      throw error;
    }
  }
  
  /**
   * Set log level dynamically
   */
  setLevel(level: string): void {
    this.logger.level = level;
    this.info(`Log level changed to: ${level}`);
  }
  
  /**
   * Get current log level
   */
  getLevel(): string {
    return this.logger.level;
  }
  
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled(level: string): boolean {
    return this.logger.isLevelEnabled(level);
  }
  
  /**
   * Flush all transports (useful for shutdown)
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      const transports = this.logger.transports;
      let pendingFlushes = transports.length;
      
      if (pendingFlushes === 0) {
        resolve();
        return;
      }
      
      transports.forEach((transport) => {
        if (typeof transport.flush === 'function') {
          transport.flush(() => {
            pendingFlushes--;
            if (pendingFlushes === 0) {
              resolve();
            }
          });
        } else {
          pendingFlushes--;
          if (pendingFlushes === 0) {
            resolve();
          }
        }
      });
    });
  }
  
  /**
   * Close logger and cleanup resources
   */
  close(): void {
    this.logger.close();
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create logger with default MCP configuration
 */
export function createMCPLogger(service: string, options?: Partial<LoggerOptions>): MCPLogger {
  const defaultOptions: LoggerOptions = {
    level: process.env.MCP_LOG_LEVEL || 'info',
    environment: process.env.NODE_ENV || 'development',
    enableConsole: true,
    enableFile: true,
    filePath: `./logs/${service}.log`,
    maxSize: '10MB',
    maxFiles: 5,
    enableJson: process.env.NODE_ENV === 'production'
  };
  
  return new MCPLogger(service, { ...defaultOptions, ...options });
}

/**
 * Create logger specifically for development
 */
export function createDevLogger(service: string): MCPLogger {
  return new MCPLogger(service, {
    level: 'debug',
    environment: 'development',
    enableConsole: true,
    enableFile: false,
    enableJson: false
  });
}

/**
 * Create logger specifically for production
 */
export function createProdLogger(service: string): MCPLogger {
  return new MCPLogger(service, {
    level: 'warn',
    environment: 'production',
    enableConsole: false,
    enableFile: true,
    filePath: `/var/log/mcp/${service}.log`,
    maxSize: '100MB',
    maxFiles: 10,
    enableJson: true
  });
}

export default MCPLogger;
