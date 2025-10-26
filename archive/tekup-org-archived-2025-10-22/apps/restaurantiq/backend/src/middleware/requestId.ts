/**
 * Request ID Middleware for RestaurantIQ
 * Adds unique request ID to each request for tracing and logging
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Add unique request ID to each request
 * Used for request tracing and correlation in logs
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  // Check if request ID is already provided in headers
  const existingId = req.get('X-Request-ID') || req.get('x-request-id');
  
  // Use existing ID or generate new one
  const id = existingId || uuidv4();
  
  // Add to request object
  req.requestId = id;
  
  // Add to response headers for client reference
  res.set('X-Request-ID', id);
  
  next();
};

export default requestId;
