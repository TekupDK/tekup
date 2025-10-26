/**
 * Tenant Resolution Middleware for RestaurantIQ
 * Handles multi-tenant architecture by resolving tenant from request
 */

import { Request, Response, NextFunction } from 'express';
import { loggers } from '../config/logger';
import { tenantCache } from '../config/redis';

interface TenantInfo {
  id: string;
  subdomain: string;
  settings: {
    name: string;
    locale: string;
    currency: string;
    timezone: string;
    features: string[];
    limits: {
      locations: number;
      employees: number;
      storage: number;
    };
  };
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  updatedAt: string;
}

/**
 * Resolve tenant from request context
 * Supports resolution by:
 * 1. Subdomain (restaurant.restaurantiq.dk)
 * 2. Custom domain (restaurant.example.com)
 * 3. Header (X-Tenant-ID)
 * 4. Query parameter (tenant_id)
 */
export const tenantResolver = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let tenantIdentifier: string | undefined;
    let resolveMethod: string;

    // Method 1: Extract from subdomain
    const host = req.get('host') || '';
    const hostParts = host.split('.');
    
    // Check if it's a subdomain request (e.g., tenant.restaurantiq.dk)
    if (hostParts.length >= 3 && hostParts[1] === 'restaurantiq') {
      tenantIdentifier = hostParts[0];
      resolveMethod = 'subdomain';
    }
    // Method 2: Custom domain (will need domain mapping in database)
    else if (hostParts.length >= 2 && !host.includes('restaurantiq')) {
      tenantIdentifier = host;
      resolveMethod = 'custom_domain';
    }
    
    // Method 3: Header override
    const headerTenant = req.get('X-Tenant-ID');
    if (headerTenant) {
      tenantIdentifier = headerTenant;
      resolveMethod = 'header';
    }
    
    // Method 4: Query parameter override (useful for development/testing)
    const queryTenant = req.query.tenant_id as string;
    if (queryTenant) {
      tenantIdentifier = queryTenant;
      resolveMethod = 'query';
    }

    // Skip tenant resolution for health checks and public endpoints
    const publicPaths = ['/health', '/api/auth/register', '/api/webhooks'];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
    
    if (!tenantIdentifier && !isPublicPath) {
      loggers.warn('Tenant not resolved', {
        requestId: req.requestId,
        host,
        path: req.path,
        method: req.method,
      });
      
      return res.status(400).json({
        error: 'Tenant not found',
        message: 'Unable to determine tenant from request. Please check your domain or headers.',
        code: 'TENANT_NOT_FOUND',
      });
    }

    // If no tenant needed (public endpoint), continue
    if (!tenantIdentifier) {
      return next();
    }

    // Try to get tenant from cache first
    let tenant = await tenantCache.get<TenantInfo>('info', tenantIdentifier);
    
    if (!tenant) {
      // TODO: Load tenant from database
      // For now, we'll simulate a database lookup
      tenant = await loadTenantFromDatabase(tenantIdentifier, resolveMethod);
      
      if (!tenant) {
        loggers.warn('Tenant not found in database', {
          requestId: req.requestId,
          tenantIdentifier,
          resolveMethod,
        });
        
        return res.status(404).json({
          error: 'Tenant not found',
          message: 'The specified tenant does not exist or has been deactivated.',
          code: 'TENANT_NOT_EXISTS',
        });
      }
      
      // Cache tenant info for 15 minutes
      await tenantCache.set('info', tenant, tenantIdentifier, 15 * 60);
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      loggers.warn('Tenant access suspended', {
        requestId: req.requestId,
        tenantId: tenant.id,
      });
      
      return res.status(403).json({
        error: 'Tenant suspended',
        message: 'This tenant account has been suspended. Please contact support.',
        code: 'TENANT_SUSPENDED',
      });
    }

    // Add tenant to request object
    req.tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
      settings: tenant.settings,
    };

    loggers.debug('Tenant resolved', {
      requestId: req.requestId,
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
      method: resolveMethod,
    });

    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    loggers.error('Tenant resolution error', {
      requestId: req.requestId,
      error: errorMessage,
    });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to resolve tenant information.',
      code: 'TENANT_RESOLUTION_ERROR',
    });
  }
};

/**
 * Load tenant information from database
 * TODO: Replace with actual database query
 */
async function loadTenantFromDatabase(
  identifier: string, 
  method: string
): Promise<TenantInfo | null> {
  try {
    // TODO: Implement actual database query using Knex
    // This is a temporary mock implementation
    
    // Simulate database lookup delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // For development, create a mock tenant
    if (identifier === 'demo' || identifier.includes('localhost')) {
      return {
        id: 'tenant_demo_123',
        subdomain: 'demo',
        settings: {
          name: 'Demo Restaurant',
          locale: 'da_DK',
          currency: 'DKK',
          timezone: 'Europe/Copenhagen',
          features: ['inventory', 'menu', 'staff', 'analytics', 'pos_integration'],
          limits: {
            locations: 3,
            employees: 50,
            storage: 5 * 1024 * 1024 * 1024, // 5GB
          },
        },
        status: 'active' as const,
        createdAt: new Date('2024-01-01').toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    loggers.error('Database tenant lookup error', { identifier, method, error });
    return null;
  }
}

/**
 * Middleware to require tenant context
 * Use this for endpoints that must have a tenant
 */
export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.tenant) {
    return res.status(400).json({
      error: 'Tenant required',
      message: 'This endpoint requires a valid tenant context.',
      code: 'TENANT_REQUIRED',
    });
  }
  
  next();
};

/**
 * Get tenant database connection name
 * For multi-tenant database isolation
 */
export const getTenantDbConnection = (tenantId: string): string => {
  // For now, we use a shared database with tenant isolation
  // In the future, this could route to tenant-specific databases
  return 'default';
};

export default tenantResolver;
