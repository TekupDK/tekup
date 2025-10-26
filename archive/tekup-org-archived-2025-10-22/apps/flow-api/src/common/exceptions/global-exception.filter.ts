import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseCustomException, ErrorCategory, ErrorSeverity } from './custom-exceptions.js';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    timestamp: string;
    path: string;
    method: string;
    requestId?: string;
    correlationId?: string;
    retryable: boolean;
    retryAfter?: number;
    suggestions?: string[];
    supportReference?: string;
    details?: Record<string, any>;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorInfo = this.processException(exception, request);
    
    // Log the error
    this.logError(exception, errorInfo, request);
    
    // Record metrics
    this.recordErrorMetrics(errorInfo, request);

    // Send response
    response
      .status(errorInfo.status)
      .json(this.formatErrorResponse(errorInfo, request));
  }

  private processException(exception: unknown, request: Request) {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let category = ErrorCategory.SYSTEM;
    let severity = ErrorSeverity.CRITICAL;
    let retryable = false;
    let retryAfter: number | undefined;
    let suggestions: string[] = [];
    let supportReference: string | undefined;
    let details: Record<string, any> = {};
    let userMessage: string | undefined;

    if (exception instanceof BaseCustomException) {
      // Our custom exceptions
      status = exception.getStatus();
      code = exception.details.code;
      message = exception.message;
      category = exception.details.category;
      severity = exception.details.severity;
      retryable = exception.details.retryable;
      retryAfter = exception.details.retryAfter;
      suggestions = exception.details.suggestions || [];
      supportReference = exception.details.supportReference;
      details = exception.details.context || {};
      userMessage = exception.details.userMessage;
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus();
      const response = exception.getResponse();
      
      if (typeof response === 'object' && response !== null) {
        const responseObj = response as any;
        message = responseObj.message || exception.message;
        code = responseObj.error || this.getErrorCodeFromStatus(status);
        
        if (Array.isArray(responseObj.message)) {
          // Validation errors
          category = ErrorCategory.VALIDATION;
          severity = ErrorSeverity.LOW;
          details = { validationErrors: responseObj.message };
          suggestions = ['Please correct the validation errors and try again.'];
        }
      } else {
        message = exception.message;
        code = this.getErrorCodeFromStatus(status);
      }

      category = this.getCategoryFromStatus(status);
      severity = this.getSeverityFromStatus(status);
      retryable = this.isStatusRetryable(status);
    } else if (exception instanceof Error) {
      // Generic errors
      message = exception.message;
      code = exception.name || 'UNKNOWN_ERROR';
      
      // Try to categorize based on error properties
      if (this.isDatabaseError(exception)) {
        category = ErrorCategory.DATABASE;
        severity = ErrorSeverity.HIGH;
        retryable = true;
        retryAfter = 5;
        suggestions = ['Database operation failed. The system will retry automatically.'];
      } else if (this.isNetworkError(exception)) {
        category = ErrorCategory.NETWORK;
        severity = ErrorSeverity.MEDIUM;
        retryable = true;
        retryAfter = 10;
        suggestions = ['Network error occurred. Please check your connection.'];
      } else if (this.isCacheError(exception)) {
        category = ErrorCategory.CACHE;
        severity = ErrorSeverity.MEDIUM;
        retryable = true;
        retryAfter = 2;
        suggestions = ['Cache operation failed. The system will continue but may be slower.'];
      }
    }

    // Generate support reference for critical errors
    if (severity === ErrorSeverity.CRITICAL && !supportReference) {
      supportReference = this.generateSupportReference();
      suggestions.push(`Please contact support with reference: ${supportReference}`);
    }

    return {
      status,
      code,
      message,
      category,
      severity,
      retryable,
      retryAfter,
      suggestions,
      supportReference,
      details,
      userMessage: userMessage || this.generateUserMessage(category, message),
      originalException: exception,
    };
  }

  private logError(exception: unknown, errorInfo: any, request: Request): void {
    const context = this.contextService.toLogContext();
    
    const logContext = {
      ...context,
      errorCode: errorInfo.code,
      errorCategory: errorInfo.category,
      errorSeverity: errorInfo.severity,
      statusCode: errorInfo.status,
      retryable: errorInfo.retryable,
      supportReference: errorInfo.supportReference,
      metadata: {
        ...context.metadata,
        path: request.path,
        method: request.method,
        userAgent: request.get('User-Agent'),
        details: errorInfo.details,
      },
    };

    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.structuredLogger.fatal(errorInfo.message, logContext, this.getStackTrace(exception));
    } else if (errorInfo.severity === ErrorSeverity.HIGH) {
      this.structuredLogger.error(errorInfo.message, logContext, this.getStackTrace(exception));
    } else if (errorInfo.severity === ErrorSeverity.MEDIUM) {
      this.structuredLogger.warn(errorInfo.message, logContext);
    } else {
      this.structuredLogger.debug(errorInfo.message, logContext);
    }

    // Log security events for auth/authz errors
    if (errorInfo.category === ErrorCategory.AUTHENTICATION || 
        errorInfo.category === ErrorCategory.AUTHORIZATION) {
      this.structuredLogger.logSecurityEvent(
        errorInfo.code.toLowerCase(),
        errorInfo.severity,
        logContext
      );
    }
  }

  private recordErrorMetrics(errorInfo: any, request: Request): void {
    const tenantId = (request as any).tenantId || 'unknown';
    
    // Record error counter
    this.metricsService.increment('http_errors_total', {
      code: errorInfo.code,
      category: errorInfo.category,
      severity: errorInfo.severity,
      status: errorInfo.status.toString(),
      tenant: tenantId,
      endpoint: request.path,
      method: request.method,
    });

    // Record retryable errors separately
    if (errorInfo.retryable) {
      this.metricsService.increment('http_retryable_errors_total', {
        code: errorInfo.code,
        category: errorInfo.category,
        tenant: tenantId,
      });
    }

    // Record critical errors
    if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      this.metricsService.increment('http_critical_errors_total', {
        code: errorInfo.code,
        tenant: tenantId,
        supportReference: errorInfo.supportReference,
      });
    }
  }

  private formatErrorResponse(errorInfo: any, request: Request): ErrorResponse {
    const context = this.contextService.getContext();
    
    return {
      error: {
        code: errorInfo.code,
        message: errorInfo.userMessage,
        category: errorInfo.category,
        severity: errorInfo.severity,
        timestamp: new Date().toISOString(),
        path: request.path,
        method: request.method,
        requestId: context?.requestId,
        correlationId: context?.correlationId,
        retryable: errorInfo.retryable,
        retryAfter: errorInfo.retryAfter,
        suggestions: errorInfo.suggestions,
        supportReference: errorInfo.supportReference,
        ...(Object.keys(errorInfo.details).length > 0 && {
          details: this.sanitizeDetails(errorInfo.details),
        }),
      },
    };
  }

  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive information
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'authorization'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getStackTrace(exception: unknown): string | undefined {
    if (exception instanceof Error) {
      return exception.stack;
    }
    return undefined;
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 422: return 'UNPROCESSABLE_ENTITY';
      case 429: return 'TOO_MANY_REQUESTS';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'HTTP_ERROR';
    }
  }

  private getCategoryFromStatus(status: number): ErrorCategory {
    if (status === 400 || status === 422) return ErrorCategory.VALIDATION;
    if (status === 401) return ErrorCategory.AUTHENTICATION;
    if (status === 403) return ErrorCategory.AUTHORIZATION;
    if (status === 404) return ErrorCategory.BUSINESS_LOGIC;
    if (status === 429) return ErrorCategory.RATE_LIMITING;
    if (status >= 500) return ErrorCategory.SYSTEM;
    return ErrorCategory.SYSTEM;
  }

  private getSeverityFromStatus(status: number): ErrorSeverity {
    if (status < 400) return ErrorSeverity.LOW;
    if (status < 500) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.HIGH;
  }

  private isStatusRetryable(status: number): boolean {
    return status >= 500 && status !== 501; // 5xx except Not Implemented
  }

  private isDatabaseError(error: Error): boolean {
    const dbErrorPatterns = [
      /connection/i,
      /database/i,
      /prisma/i,
      /query/i,
      /transaction/i,
    ];
    return dbErrorPatterns.some(pattern => pattern.test(error.message));
  }

  private isNetworkError(error: Error): boolean {
    const networkErrors = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'];
    return networkErrors.includes((error as any).code);
  }

  private isCacheError(error: Error): boolean {
    return error.message.toLowerCase().includes('cache') ||
           error.message.toLowerCase().includes('redis');
  }

  private generateSupportReference(): string {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  private generateUserMessage(category: ErrorCategory, technicalMessage: string): string {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 'Please check your input and correct any errors.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please check your credentials.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.RATE_LIMITING:
        return 'Too many requests. Please wait before trying again.';
      case ErrorCategory.DATABASE:
        return 'A database error occurred. Please try again later.';
      case ErrorCategory.EXTERNAL_SERVICE:
        return 'An external service is temporarily unavailable.';
      case ErrorCategory.NETWORK:
        return 'A network error occurred. Please check your connection.';
      case ErrorCategory.CACHE:
        return 'The system is running slower than usual due to a caching issue.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}
