import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StructuredLoggerService } from '../logging/structured-logger.service.js';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  correlationId?: string;
  requestId?: string;
  retryable: boolean;
  retryAfter?: number;
  details?: any;
  stack?: string;
}

export interface RetryableError {
  isRetryable: boolean;
  retryAfter?: number;
  maxRetries?: number;
  backoffStrategy?: 'linear' | 'exponential' | 'fixed';
}

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CustomExceptionFilter.name);

  constructor(private readonly structuredLogger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorInfo = this.extractErrorInfo(exception);
    const retryInfo = this.determineRetryability(exception, errorInfo.status);

    const errorResponse: ErrorResponse = {
      statusCode: errorInfo.status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorInfo.message,
      error: errorInfo.name,
      correlationId: (request as any).correlationId,
      requestId: (request as any).requestId,
      retryable: retryInfo.isRetryable,
      retryAfter: retryInfo.retryAfter,
      details: errorInfo.details,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = errorInfo.stack;
    }

    // Set retry headers if applicable
    if (retryInfo.isRetryable && retryInfo.retryAfter) {
      response.setHeader('Retry-After', retryInfo.retryAfter);
      response.setHeader('X-Retry-After', retryInfo.retryAfter);
    }

    // Add custom headers for client guidance
    response.setHeader('X-Error-Retryable', retryInfo.isRetryable.toString());
    if (retryInfo.maxRetries) {
      response.setHeader('X-Max-Retries', retryInfo.maxRetries.toString());
    }

    // Log the error with structured logging
    this.logError(exception, errorResponse, request);

    response.status(errorInfo.status).json(errorResponse);
  }

  /**
   * Extract error information from various exception types
   */
  private extractErrorInfo(exception: unknown): {
    status: number;
    message: string;
    name: string;
    details?: any;
    stack?: string;
  } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return {
        status: exception.getStatus(),
        message: typeof response === 'string' ? response : (response as any).message || exception.message,
        name: exception.name,
        details: typeof response === 'object' ? response : undefined,
        stack: exception.stack,
      };
    }

    if (exception instanceof Error) {
      return {
        status: this.mapErrorToHttpStatus(exception),
        message: exception.message || 'Internal server error',
        name: exception.name,
        stack: exception.stack,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unknown error occurred',
      name: 'UnknownError',
    };
  }

  /**
   * Map specific error types to HTTP status codes
   */
  private mapErrorToHttpStatus(error: Error): number {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();

    // Database errors
    if (errorName.includes('prisma') || errorName.includes('database')) {
      if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
        return HttpStatus.CONFLICT;
      }
      if (errorMessage.includes('not found') || errorMessage.includes('record not found')) {
        return HttpStatus.NOT_FOUND;
      }
      if (errorMessage.includes('foreign key') || errorMessage.includes('reference')) {
        return HttpStatus.BAD_REQUEST;
      }
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    // Network errors
    if (errorName.includes('timeout') || errorMessage.includes('timeout')) {
      return HttpStatus.REQUEST_TIMEOUT;
    }

    if (errorName.includes('network') || errorMessage.includes('network')) {
      return HttpStatus.SERVICE_UNAVAILABLE;
    }

    // Validation errors
    if (errorName.includes('validation') || errorMessage.includes('validation')) {
      return HttpStatus.BAD_REQUEST;
    }

    // Authentication/Authorization errors
    if (errorName.includes('unauthorized') || errorMessage.includes('unauthorized')) {
      return HttpStatus.UNAUTHORIZED;
    }

    if (errorName.includes('forbidden') || errorMessage.includes('forbidden')) {
      return HttpStatus.FORBIDDEN;
    }

    // Rate limiting
    if (errorName.includes('rate') && errorName.includes('limit')) {
      return HttpStatus.TOO_MANY_REQUESTS;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Determine if an error is retryable and calculate retry delay
   */
  private determineRetryability(exception: unknown, statusCode: number): RetryableError {
    // Non-retryable client errors (4xx except specific cases)
    if (statusCode >= 400 && statusCode < 500) {
      const retryableClientErrors = [
        HttpStatus.REQUEST_TIMEOUT, // 408
        HttpStatus.TOO_MANY_REQUESTS, // 429
      ];

      if (!retryableClientErrors.includes(statusCode)) {
        return { isRetryable: false };
      }
    }

    // Server errors (5xx) are generally retryable
    if (statusCode >= 500) {
      return {
        isRetryable: true,
        retryAfter: this.calculateRetryDelay(statusCode),
        maxRetries: 3,
        backoffStrategy: 'exponential',
      };
    }

    // Specific retryable cases
    switch (statusCode) {
      case HttpStatus.REQUEST_TIMEOUT:
        return {
          isRetryable: true,
          retryAfter: 5, // 5 seconds
          maxRetries: 3,
          backoffStrategy: 'linear',
        };

      case HttpStatus.TOO_MANY_REQUESTS:
        return {
          isRetryable: true,
          retryAfter: this.extractRetryAfterFromException(exception) || 60, // 1 minute default
          maxRetries: 5,
          backoffStrategy: 'exponential',
        };

      case HttpStatus.SERVICE_UNAVAILABLE:
        return {
          isRetryable: true,
          retryAfter: 30, // 30 seconds
          maxRetries: 3,
          backoffStrategy: 'exponential',
        };

      default:
        return { isRetryable: false };
    }
  }

  /**
   * Calculate retry delay based on status code and attempt number
   */
  private calculateRetryDelay(statusCode: number, attempt: number = 1): number {
    const baseDelay = {
      [HttpStatus.INTERNAL_SERVER_ERROR]: 5,
      [HttpStatus.BAD_GATEWAY]: 10,
      [HttpStatus.SERVICE_UNAVAILABLE]: 30,
      [HttpStatus.GATEWAY_TIMEOUT]: 15,
    }[statusCode] || 10;

    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    
    return Math.min(exponentialDelay + jitter, 300); // Max 5 minutes
  }

  /**
   * Extract retry-after value from exception if available
   */
  private extractRetryAfterFromException(exception: unknown): number | undefined {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        return (response as any).retryAfter;
      }
    }

    if (exception instanceof Error) {
      const match = exception.message.match(/retry.*?(\d+)/i);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return undefined;
  }

  /**
   * Log error with structured logging
   */
  private logError(exception: unknown, errorResponse: ErrorResponse, request: Request): void {
    const context = {
      path: request.url,
      method: request.method,
      statusCode: errorResponse.statusCode,
      correlationId: errorResponse.correlationId,
      requestId: errorResponse.requestId,
      userAgent: request.headers['user-agent'],
      ip: this.getClientIp(request),
      retryable: errorResponse.retryable,
      retryAfter: errorResponse.retryAfter,
    };

    if (errorResponse.statusCode >= 500) {
      this.structuredLogger.error(
        `Server error: ${errorResponse.message}`,
        exception instanceof Error ? exception : new Error(errorResponse.message),
        context
      );
    } else if (errorResponse.statusCode >= 400) {
      this.structuredLogger.warn(
        `Client error: ${errorResponse.message}`,
        context
      );
    } else {
      this.structuredLogger.info(
        `Request completed with status ${errorResponse.statusCode}`,
        context
      );
    }

    // Log security events for suspicious activity
    if (this.isSuspiciousError(errorResponse.statusCode, request)) {
      this.structuredLogger.securityEvent(
        'suspicious_request_pattern',
        'medium',
        {
          ...context,
          reason: 'Multiple client errors or potential attack pattern',
        }
      );
    }
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    ) as string;
  }

  /**
   * Determine if error pattern is suspicious
   */
  private isSuspiciousError(statusCode: number, request: Request): boolean {
    const suspiciousPatterns = [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.NOT_FOUND,
    ];

    const suspiciousPaths = [
      '/admin',
      '/wp-admin',
      '/.env',
      '/config',
      '/api/v1/admin',
    ];

    return (
      suspiciousPatterns.includes(statusCode) ||
      suspiciousPaths.some(pattern => request.path.includes(pattern))
    );
  }
}