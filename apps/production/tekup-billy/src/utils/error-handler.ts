/**
 * Error handling utilities for Billy MCP tools
 * Extracts and formats Billy API error messages for user-friendly responses
 */

import { log as logger } from './logger.js';

/**
 * Extract user-friendly error message from Billy API error
 * @param error - The error object (should have billyDetails if from Billy API)
 * @returns User-friendly error message string
 */
export function extractBillyErrorMessage(error: any): string {
  // Extract Billy API error details from multiple possible locations
  // Billy API returns errors in error.response.data.errorMessage
  // makeRequest stores this in error.billyDetails.data.errorMessage AND error.billyDetails.billyErrorMessage
  const billyError = 
    error.billyDetails?.billyErrorMessage ||  // makeRequest's extracted field
    error.billyDetails?.data?.errorMessage || // Billy API's actual field
    error.billyDetails?.errorMessage;          // Fallback
  
  const billyErrorCode = 
    error.billyDetails?.billyErrorCode ||      // makeRequest's extracted field
    error.billyDetails?.data?.errorCode ||     // Billy API's actual field
    error.billyDetails?.errorCode;             // Fallback
  
  const validationErrors = 
    error.billyDetails?.validationErrors ||    // makeRequest's extracted field
    error.billyDetails?.data?.errors ||        // Billy API field
    error.billyDetails?.data?.meta?.fieldErrors; // Alternative Billy API field
  
  // Build user-friendly error message
  let errorMessage = error.message || 'Unknown error';
  
  if (billyError) {
    errorMessage = `Billy API: ${billyError}`;
    if (billyErrorCode) {
      errorMessage += ` (${billyErrorCode})`;
    }
  }
  
  if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
    errorMessage += `\n\nValidation errors:\n${validationErrors.map((e: any) => `  - ${e}`).join('\n')}`;
  }
  
  return errorMessage;
}

/**
 * Create a standardized error response for MCP tools
 * @param error - The error object
 * @param actionName - Name of the action that failed (for logging)
 * @returns MCP tool error response object
 */
export function createErrorResponse(error: any, actionName: string) {
  const errorMessage = extractBillyErrorMessage(error);
  
  logger.error(`${actionName} error`, error instanceof Error ? error : new Error(String(error)), {
    userMessage: errorMessage,
    billyError: error.billyDetails?.billyErrorMessage,
    billyErrorCode: error.billyDetails?.billyErrorCode,
    validationErrors: error.billyDetails?.validationErrors,
    originalMessage: error.message,
  });
  
  return {
    content: [{
      type: 'text' as const,
      text: `Error ${actionName}: ${errorMessage}`,
    }],
    isError: true,
  };
}
