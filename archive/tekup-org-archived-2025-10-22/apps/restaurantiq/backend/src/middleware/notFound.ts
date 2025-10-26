/**
 * 404 Not Found Handler Middleware for RestaurantIQ
 * Handles requests to non-existent endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { loggers } from '../config/logger';

/**
 * Handle 404 Not Found errors
 * This middleware should be added after all route definitions
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    tenantId: req.tenant?.id,
    userId: req.user?.id,
  };

  loggers.warn('Route not found', error);

  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.path} was not found on this server.`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    suggestions: getSuggestions(req.path),
  });
};

/**
 * Get route suggestions for common misspellings or similar routes
 */
function getSuggestions(path: string): string[] {
  const suggestions: string[] = [];
  
  // Common API endpoints that users might be looking for
  const commonRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/profile',
    '/api/tenants',
    '/api/locations',
    '/api/inventory',
    '/api/menu',
    '/api/employees',
    '/api/schedules',
    '/api/sales',
    '/api/analytics',
    '/api/reports',
    '/api/uploads',
    '/health',
  ];

  // Simple string similarity check
  const pathLower = path.toLowerCase();
  
  for (const route of commonRoutes) {
    const routeLower = route.toLowerCase();
    
    // Check for partial matches or common typos
    if (
      routeLower.includes(pathLower.slice(1)) || // Remove leading slash
      pathLower.includes(routeLower.slice(1)) ||
      levenshteinDistance(pathLower, routeLower) <= 3
    ) {
      suggestions.push(route);
    }
  }

  // Limit suggestions to avoid overwhelming the response
  return suggestions.slice(0, 3);
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for finding similar route names
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export default notFoundHandler;
