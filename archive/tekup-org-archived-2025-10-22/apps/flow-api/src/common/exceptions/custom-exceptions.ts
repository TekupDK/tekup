import { HttpException, HttpStatus } from '@nestjs/common';

export enum ErrorCategory {
  BUSINESS_LOGIC = 'business_logic',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMITING = 'rate_limiting',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  CACHE = 'cache',
  NETWORK = 'network',
  SYSTEM = 'system',
  CONFIGURATION = 'configuration',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorDetails {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  retryAfter?: number;
  maxRetries?: number;
  correlationId?: string;
  requestId?: string;
  tenantId?: string;
  timestamp: Date;
  context?: Record<string, any>;
  userMessage?: string;
  technicalMessage?: string;
  suggestions?: string[];
  supportReference?: string;
}

export class BaseCustomException extends HttpException {
  public readonly details: ErrorDetails;

  constructor(
    message: string,
    status: HttpStatus,
    details: Partial<ErrorDetails> & Pick<ErrorDetails, 'code' | 'category'>
  ) {
    super(message, status);
    
    this.details = {
      ...details,
      severity: details.severity || ErrorSeverity.MEDIUM,
      retryable: details.retryable ?? false,
      timestamp: new Date(),
      technicalMessage: message,
      userMessage: details.userMessage || this.generateUserMessage(details.category),
    };
  }

  private generateUserMessage(category: ErrorCategory): string {
    switch (category) {
      case ErrorCategory.BUSINESS_LOGIC:
        return 'A business rule prevented this operation from completing.';
      case ErrorCategory.VALIDATION:
        return 'The provided data is invalid. Please check your input and try again.';
      case ErrorCategory.AUTHENTICATION:
        return 'Authentication failed. Please check your credentials.';
      case ErrorCategory.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ErrorCategory.RATE_LIMITING:
        return 'Too many requests. Please wait before trying again.';
      case ErrorCategory.EXTERNAL_SERVICE:
        return 'An external service is temporarily unavailable. Please try again later.';
      case ErrorCategory.DATABASE:
        return 'A database error occurred. Please try again later.';
      case ErrorCategory.CACHE:
        return 'A caching error occurred. The operation may be slower than usual.';
      case ErrorCategory.NETWORK:
        return 'A network error occurred. Please check your connection and try again.';
      case ErrorCategory.SYSTEM:
        return 'A system error occurred. Please try again later.';
      case ErrorCategory.CONFIGURATION:
        return 'A configuration error was detected. Please contact support.';
      default:
        return 'An unexpected error occurred. Please try again later.';
    }
  }
}

// Business Logic Exceptions
export class BusinessLogicException extends BaseCustomException {
  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message, HttpStatus.UNPROCESSABLE_ENTITY, {
      code,
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.LOW,
      retryable: false,
      context,
    });
  }
}

export class ValidationException extends BaseCustomException {
  constructor(message: string, errors: Record<string, string[]>, context?: Record<string, any>) {
    super(message, HttpStatus.BAD_REQUEST, {
      code: 'VALIDATION_ERROR',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      retryable: false,
      context: { ...context, validationErrors: errors },
      suggestions: ['Please check the provided data and correct any validation errors.'],
    });
  }
}

// Authentication & Authorization Exceptions
export class AuthenticationException extends BaseCustomException {
  constructor(message: string = 'Authentication failed', code: string = 'AUTH_FAILED') {
    super(message, HttpStatus.UNAUTHORIZED, {
      code,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      suggestions: ['Please check your API key or authentication credentials.'],
    });
  }
}

export class AuthorizationException extends BaseCustomException {
  constructor(message: string = 'Access denied', requiredPermission?: string) {
    super(message, HttpStatus.FORBIDDEN, {
      code: 'ACCESS_DENIED',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      context: requiredPermission ? { requiredPermission } : undefined,
      suggestions: ['Please contact your administrator to request the necessary permissions.'],
    });
  }
}

// Rate Limiting Exception
export class RateLimitException extends BaseCustomException {
  constructor(retryAfter: number, limit: number, window: number) {
    super('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS, {
      code: 'RATE_LIMIT_EXCEEDED',
      category: ErrorCategory.RATE_LIMITING,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryAfter,
      context: { limit, window },
      suggestions: [`Please wait ${retryAfter} seconds before making another request.`],
    });
  }
}

// External Service Exceptions
export class ExternalServiceException extends BaseCustomException {
  constructor(
    serviceName: string,
    message: string = 'External service unavailable',
    retryable: boolean = true
  ) {
    super(message, HttpStatus.BAD_GATEWAY, {
      code: 'EXTERNAL_SERVICE_ERROR',
      category: ErrorCategory.EXTERNAL_SERVICE,
      severity: ErrorSeverity.HIGH,
      retryable,
      retryAfter: retryable ? 30 : undefined,
      maxRetries: retryable ? 3 : undefined,
      context: { serviceName },
      suggestions: retryable 
        ? ['The service will retry automatically. Please wait a moment.']
        : ['Please contact support if this problem persists.'],
    });
  }
}

// Database Exceptions
export class DatabaseException extends BaseCustomException {
  constructor(
    operation: string,
    originalError?: Error,
    retryable: boolean = true
  ) {
    super(`Database error during ${operation}`, HttpStatus.INTERNAL_SERVER_ERROR, {
      code: 'DATABASE_ERROR',
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.HIGH,
      retryable,
      retryAfter: retryable ? 5 : undefined,
      maxRetries: retryable ? 3 : undefined,
      context: { 
        operation,
        originalError: originalError?.message,
      },
      suggestions: retryable
        ? ['The operation will be retried automatically.']
        : ['Please contact support if this problem persists.'],
    });
  }
}

// Cache Exceptions
export class CacheException extends BaseCustomException {
  constructor(operation: string, originalError?: Error) {
    super(`Cache error during ${operation}`, HttpStatus.INTERNAL_SERVER_ERROR, {
      code: 'CACHE_ERROR',
      category: ErrorCategory.CACHE,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryAfter: 1,
      maxRetries: 2,
      context: { 
        operation,
        originalError: originalError?.message,
      },
      suggestions: ['The system will continue to function but may be slower than usual.'],
    });
  }
}

// Network Exceptions
export class NetworkException extends BaseCustomException {
  constructor(message: string = 'Network error occurred', timeout?: number) {
    super(message, HttpStatus.REQUEST_TIMEOUT, {
      code: 'NETWORK_ERROR',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      retryAfter: 5,
      maxRetries: 3,
      context: timeout ? { timeout } : undefined,
      suggestions: ['Please check your network connection and try again.'],
    });
  }
}

// System Exceptions
export class SystemException extends BaseCustomException {
  constructor(message: string, code: string = 'SYSTEM_ERROR', context?: Record<string, any>) {
    const supportRef = `SUP-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, {
      code,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      context,
      supportReference: supportRef,
      suggestions: ['Please contact support with the provided reference number.'],
    });
  }

  // generateSupportReference removed (inlined to avoid using this before super)
}

// Configuration Exception
export class ConfigurationException extends BaseCustomException {
  constructor(configKey: string, expectedType?: string) {
    super(`Configuration error: ${configKey}`, HttpStatus.INTERNAL_SERVER_ERROR, {
      code: 'CONFIGURATION_ERROR',
      category: ErrorCategory.CONFIGURATION,
      severity: ErrorSeverity.CRITICAL,
      retryable: false,
      context: { configKey, expectedType },
      supportReference: `CFG-${Date.now()}`,
      suggestions: ['Please contact your system administrator.'],
    });
  }
}

// Tenant-specific exceptions
export class TenantNotFoundException extends BaseCustomException {
  constructor(tenantId: string) {
    super(`Tenant not found: ${tenantId}`, HttpStatus.NOT_FOUND, {
      code: 'TENANT_NOT_FOUND',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.MEDIUM,
      retryable: false,
      context: { tenantId },
      suggestions: ['Please check the tenant ID and try again.'],
    });
  }
}

export class LeadNotFoundException extends BaseCustomException {
  constructor(leadId: string, tenantId?: string) {
    super(`Lead not found: ${leadId}`, HttpStatus.NOT_FOUND, {
      code: 'LEAD_NOT_FOUND',
      category: ErrorCategory.BUSINESS_LOGIC,
      severity: ErrorSeverity.LOW,
      retryable: false,
      context: { leadId, tenantId },
      suggestions: ['Please check the lead ID and try again.'],
    });
  }
}

// Helper function to determine if an error is retryable
export function isRetryableError(error: any): boolean {
  if (error instanceof BaseCustomException) {
    return error.details.retryable;
  }

  // Database connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return true;
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.name === 'TimeoutError') {
    return true;
  }

  // HTTP 5xx errors (except 501)
  if (error.status >= 500 && error.status !== 501) {
    return true;
  }

  return false;
}

// Helper function to get retry delay
export function getRetryDelay(error: any, attempt: number): number {
  if (error instanceof BaseCustomException && error.details.retryAfter) {
    return error.details.retryAfter * 1000; // Convert to milliseconds
  }

  // Exponential backoff with jitter
  const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
  return baseDelay + jitter;
}

// Helper function to get max retries
export function getMaxRetries(error: any): number {
  if (error instanceof BaseCustomException && error.details.maxRetries) {
    return error.details.maxRetries;
  }

  // Default retry counts based on error type
  if (error.code === 'ECONNREFUSED') return 3;
  if (error.code === 'ETIMEDOUT') return 2;
  if (error.status >= 500) return 3;

  return 0; // No retries by default
}