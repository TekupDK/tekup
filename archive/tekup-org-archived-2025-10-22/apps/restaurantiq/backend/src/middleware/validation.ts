/**
 * Validation Middleware for RestaurantIQ
 * Handles request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { loggers } from '../config/logger';

/**
 * Environment validation middleware
 * Ensures environment variables are properly validated
 */
export const validateEnv = (req: Request, res: Response, next: NextFunction): void => {
  // Environment is validated at startup in config/env.ts
  // This middleware just adds any runtime environment checks if needed
  next();
};

/**
 * Create validation middleware for request schemas
 */
export const validateRequest = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate route parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      // Validate headers
      if (schemas.headers) {
        // Note: We only validate specific headers, not all
        const headersToValidate = extractRelevantHeaders(req.headers);
        await schemas.headers.parseAsync(headersToValidate);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        loggers.warn('Request validation failed', {
          requestId: req.requestId,
          path: req.path,
          method: req.method,
          errors: validationErrors,
        });

        return res.status(400).json({
          error: 'Validation failed',
          message: 'Request validation failed. Please check the provided data.',
          details: validationErrors,
          code: 'VALIDATION_ERROR',
        });
      }

      // Handle unexpected validation errors
      loggers.error('Unexpected validation error', {
        requestId: req.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred during validation.',
        code: 'INTERNAL_VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: ZodSchema) => {
  return validateRequest({ body: schema });
};

/**
 * Validate query parameters only
 */
export const validateQuery = (schema: ZodSchema) => {
  return validateRequest({ query: schema });
};

/**
 * Validate route parameters only
 */
export const validateParams = (schema: ZodSchema) => {
  return validateRequest({ params: schema });
};

/**
 * Validate specific headers
 */
export const validateHeaders = (schema: ZodSchema) => {
  return validateRequest({ headers: schema });
};

/**
 * Extract relevant headers for validation
 * Only include headers that we care about validating
 */
function extractRelevantHeaders(headers: any): Record<string, string> {
  const relevantHeaders: Record<string, string> = {};
  
  // List of headers we might want to validate
  const headersToCheck = [
    'content-type',
    'authorization',
    'x-tenant-id',
    'x-request-id',
    'accept',
    'user-agent',
  ];

  headersToCheck.forEach(header => {
    if (headers[header]) {
      relevantHeaders[header] = headers[header];
    }
  });

  return relevantHeaders;
}

/**
 * Middleware to validate file uploads
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
  maxFiles?: number;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      required = false,
      maxFiles = 10,
    } = options;

    // Check if files are provided when required
    if (required && (!req.files || Object.keys(req.files).length === 0)) {
      return res.status(400).json({
        error: 'File required',
        message: 'At least one file must be uploaded.',
        code: 'FILE_REQUIRED',
      });
    }

    // If no files and not required, continue
    if (!req.files || Object.keys(req.files).length === 0) {
      return next();
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

    // Check number of files
    if (files.length > maxFiles) {
      return res.status(400).json({
        error: 'Too many files',
        message: `Maximum ${maxFiles} files allowed. ${files.length} files provided.`,
        code: 'TOO_MANY_FILES',
      });
    }

    // Validate each file
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileSizeMB = Math.round(file.size / (1024 * 1024));
        
        return res.status(400).json({
          error: 'File too large',
          message: `File "${file.name}" is ${fileSizeMB}MB. Maximum size allowed is ${maxSizeMB}MB.`,
          code: 'FILE_TOO_LARGE',
        });
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File "${file.name}" has type "${file.mimetype}". Allowed types: ${allowedTypes.join(', ')}.`,
          code: 'INVALID_FILE_TYPE',
        });
      }
    }

    loggers.debug('File upload validation passed', {
      requestId: req.requestId,
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.mimetype })),
    });

    next();
  };
};

/**
 * Middleware to validate pagination parameters
 */
export const validatePagination = (options: {
  maxLimit?: number;
  defaultLimit?: number;
} = {}) => {
  const { maxLimit = 100, defaultLimit = 20 } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || defaultLimit;
    const offset = (page - 1) * limit;

    // Validate page number
    if (page < 1) {
      return res.status(400).json({
        error: 'Invalid page number',
        message: 'Page number must be 1 or greater.',
        code: 'INVALID_PAGE',
      });
    }

    // Validate limit
    if (limit < 1) {
      return res.status(400).json({
        error: 'Invalid limit',
        message: 'Limit must be 1 or greater.',
        code: 'INVALID_LIMIT',
      });
    }

    if (limit > maxLimit) {
      return res.status(400).json({
        error: 'Limit too large',
        message: `Limit cannot exceed ${maxLimit}. Provided: ${limit}.`,
        code: 'LIMIT_TOO_LARGE',
      });
    }

    // Add pagination to request
    req.pagination = {
      page,
      limit,
      offset,
    };

    next();
  };
};

// Extend Request type to include pagination
declare module 'express-serve-static-core' {
  interface Request {
    pagination?: {
      page: number;
      limit: number;
      offset: number;
    };
  }
}

export default validateRequest;
