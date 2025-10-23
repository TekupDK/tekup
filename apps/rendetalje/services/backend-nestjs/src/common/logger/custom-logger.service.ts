import { Injectable, LoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface LogMetadata {
  [key: string]: any;
}

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;
  private supabase: SupabaseClient | null = null;
  private context?: string;

  constructor(context?: string) {
    this.context = context;
    
    // Initialize Supabase client if credentials are available
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }

    // Winston logger configuration
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'backend-nestjs' },
      transports: [
        // Console output for local development
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
              return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
            })
          ),
        }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    this.writeLog('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.writeLog('error', message, context, { trace });
  }

  warn(message: any, context?: string) {
    this.writeLog('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.writeLog('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.writeLog('verbose', message, context);
  }

  private async writeLog(
    level: string,
    message: any,
    context?: string,
    metadata?: LogMetadata
  ) {
    const contextToUse = context || this.context;
    const logData = {
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      context: contextToUse,
      ...metadata,
    };

    // Write to Winston (console)
    this.logger.log(level, logData);

    // Write to Supabase if available and in production
    if (this.supabase && process.env.NODE_ENV === 'production') {
      try {
        await this.supabase.from('application_logs').insert({
          level,
          message: logData.message,
          service: 'backend-nestjs',
          metadata: metadata || {},
          context: contextToUse,
        });
      } catch (error) {
        // Don't throw if logging to Supabase fails
        this.logger.error('Failed to write log to Supabase', { error });
      }
    }
  }

  // Utility method for structured logging with user context
  async logWithUser(
    level: string,
    message: string,
    userId: string,
    metadata?: LogMetadata
  ) {
    if (this.supabase && process.env.NODE_ENV === 'production') {
      try {
        await this.supabase.from('application_logs').insert({
          level,
          message,
          service: 'backend-nestjs',
          user_id: userId,
          metadata: metadata || {},
        });
      } catch (error) {
        this.logger.error('Failed to write user log to Supabase', { error });
      }
    }

    // Always log to console/Winston
    this.logger.log(level, { message, userId, ...metadata });
  }
}
