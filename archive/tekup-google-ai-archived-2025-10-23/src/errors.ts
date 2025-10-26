import { ZodError } from "zod";
import { logger } from "./logger";

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, 400, details);
    this.name = "ValidationError";
  }
}

export class IntegrationError extends AppError {
  constructor(message: string, details?: unknown) {
    super("INTEGRATION_ERROR", message, 502, details);
    this.name = "IntegrationError";
  }
}

export function createErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: error.issues,
        timestamp,
      },
    };
  }

  if (error instanceof Error) {
    logger.error({ err: error }, "Unhandled error occurred");
    return {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
        timestamp,
      },
    };
  }

  logger.error({ error }, "Unknown error type");
  return {
    error: {
      code: "UNKNOWN_ERROR",
      message: "An unknown error occurred",
      timestamp,
    },
  };
}

export function errorHandler(
  error: unknown,
  statusCode: number = 500
): { response: ErrorResponse; statusCode: number } {
  const errorResponse = createErrorResponse(error);

  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else if (error instanceof ZodError) {
    statusCode = 400;
  }

  return { response: errorResponse, statusCode };
}
