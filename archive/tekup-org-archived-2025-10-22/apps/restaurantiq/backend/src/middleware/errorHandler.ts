/**
 * Error Handler Middleware for RestaurantIQ
 * Centralized error handling with logging and standardized responses
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { loggers } from '../config/logger';

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`External service error (${service}): ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, details);
  }
}

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  code: string;
  details?: any;
  stack?: string;
  requestId?: string;
  timestamp: string;
}

/**
 * Main error handling middleware
 */
export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid resource ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    message = getMulterErrorMessage(error as any);
  } else if ((error as any).code === 'ENOENT') {
    statusCode = 404;
    errorCode = 'FILE_NOT_FOUND';
    message = 'Requested file not found';
  } else if ((error as any).code === 'EACCES') {
    statusCode = 403;
    errorCode = 'FILE_ACCESS_DENIED';
    message = 'Access denied to file system resource';
  } else if ((error as any).code === 'ENOSPC') {
    statusCode = 507;
    errorCode = 'INSUFFICIENT_STORAGE';
    message = 'Insufficient storage space';
  }

  // Log error with appropriate level
  const errorLog = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    statusCode,
    errorCode,
    message: error.message,
    stack: error.stack,
    userId: req.user?.id,
    tenantId: req.tenant?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  };

  // Log based on error severity
  if (statusCode >= 500) {
    loggers.error('Server error', errorLog);
  } else if (statusCode >= 400) {
    loggers.warn('Client error', errorLog);
  } else {
    loggers.info('Request error', errorLog);
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    error: getErrorTitle(statusCode),
    message,
    code: errorCode,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Get error title based on status code
 */
function getErrorTitle(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    case 507:
      return 'Insufficient Storage';
    default:
      return 'Error';
  }
}

/**
 * Get human-readable error message for Multer errors
 */
function getMulterErrorMessage(error: any): string {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return 'File too large';
    case 'LIMIT_FILE_COUNT':
      return 'Too many files';
    case 'LIMIT_FIELD_KEY':
      return 'Field name too long';
    case 'LIMIT_FIELD_VALUE':
      return 'Field value too long';
    case 'LIMIT_FIELD_COUNT':
      return 'Too many fields';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Unexpected file field';
    case 'MISSING_FIELD_NAME':
      return 'Missing field name';
    default:
      return 'File upload error';
  }
}

/**
 * Async error handler wrapper
 * Use this to wrap async route handlers to automatically catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create standardized API response
 */
export const createResponse = (
  data: any,
  message: string = 'Success',
  meta?: any
) => {
  const response: any = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    response.meta = meta;
  }

  return response;
};

/**
 * Create paginated response
 */
export const createPaginatedResponse = (
  data: any[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  },
  message: string = 'Success'
) => {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return createResponse(data, message, {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPreviousPage: pagination.page > 1,
    },
  });
};

export default errorHandler;
