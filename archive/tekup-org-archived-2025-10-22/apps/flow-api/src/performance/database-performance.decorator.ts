import { EnhancedDatabasePerformanceService } from './enhanced-database-performance.service.js';

/**
 * Decorator for monitoring database query performance
 */
export function MonitorDatabasePerformance(metadata: {
  operation: string;
  table: string;
  expectedRows?: number;
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const performanceService: EnhancedDatabasePerformanceService = this.enhancedDatabasePerformanceService;
      
      if (!performanceService) {
        logger.warn(`EnhancedDatabasePerformanceService not found in ${target.constructor.name}. Executing without performance monitoring.`);
        return originalMethod.apply(this, args);
      }

      // Extract tenant ID from context or arguments
      const tenantId = this.extractTenantId?.(args) || 
                       (args[0] && typeof args[0] === 'string') ? args[0] : 
                       'unknown';

      const enhancedMetadata = {
        ...metadata,
        tenantId,
        parameters: args.length > 0 ? args : undefined,
      };

      return performanceService.measureQueryDetailed(
        () => originalMethod.apply(this, args),
        enhancedMetadata
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for monitoring critical database operations
 */
export function MonitorCriticalQuery(metadata: {
  operation: string;
  table: string;
  criticalThreshold?: number; // in milliseconds
}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const performanceService: EnhancedDatabasePerformanceService = this.enhancedDatabasePerformanceService;
      
      if (!performanceService) {
        logger.warn(`EnhancedDatabasePerformanceService not found in ${target.constructor.name}. Executing without performance monitoring.`);
        return originalMethod.apply(this, args);
      }

      const startTime = process.hrtime.bigint();
      const tenantId = this.extractTenantId?.(args) || 
                       (args[0] && typeof args[0] === 'string') ? args[0] : 
                       'unknown';

      try {
        const result = await performanceService.measureQueryDetailed(
          () => originalMethod.apply(this, args),
          {
            ...metadata,
            tenantId,
            parameters: args.length > 0 ? args : undefined,
          }
        );

        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1_000_000;
        const threshold = metadata.criticalThreshold || 5000;

        if (executionTime > threshold) {
          logger.error(
            `CRITICAL: ${metadata.operation} on ${metadata.table} exceeded threshold: ${executionTime}ms > ${threshold}ms`
          );
        }

        return result;
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1_000_000;
        
        logger.error(
          `ERROR in ${metadata.operation} on ${metadata.table}: ${error.message} (${executionTime}ms)`
        );
        
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Class decorator to automatically inject performance monitoring into all methods
 */
export function EnableDatabasePerformanceMonitoring(tableMapping: Record<string, string> = {}) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        
        // Automatically wrap methods that contain database operations
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype);
        
        methodNames.forEach(methodName => {
          if (methodName === 'constructor') return;
          
          const method = prototype[methodName];
          if (typeof method === 'function') {
            const originalMethod = method;
            
            // Check if method name suggests database operation
            if (this.isDatabaseMethod(methodName)) {
              const table = tableMapping[methodName] || this.extractTableFromMethodName(methodName);
              
              prototype[methodName] = async function (...args: any[]) {
                const performanceService: EnhancedDatabasePerformanceService = this.enhancedDatabasePerformanceService;
                
                if (!performanceService) {
                  return originalMethod.apply(this, args);
                }
                
                const tenantId = this.extractTenantId?.(args) || 'unknown';
                
                return performanceService.measureQueryDetailed(
                  () => originalMethod.apply(this, args),
                  {
                    operation: methodName,
                    table,
                    tenantId,
                    parameters: args.length > 0 ? args : undefined,
                  }
                );
              };
            }
          }
        });
      }
      
      isDatabaseMethod(methodName: string): boolean {
        const dbKeywords = [
          'find', 'create', 'update', 'delete', 'upsert', 'count',
          'findFirst', 'findMany', 'findUnique', 'createMany', 'updateMany', 'deleteMany'
        ];
        
        return dbKeywords.some(keyword => methodName.toLowerCase().includes(keyword.toLowerCase()));
      }
      
      extractTableFromMethodName(methodName: string): string {
        // Extract table name from method name patterns like findManyLeads -> lead
        const patterns = [
          /find.*?([A-Z][a-z]+)s?$/,
          /create.*?([A-Z][a-z]+)s?$/,
          /update.*?([A-Z][a-z]+)s?$/,
          /delete.*?([A-Z][a-z]+)s?$/,
        ];
        
        for (const pattern of patterns) {
          const match = methodName.match(pattern);
          if (match) {
            return match[1].toLowerCase();
          }
        }
        
        return 'unknown';
      }
    };
  };
}

/**
 * Method decorator for tracking slow query patterns
 */
export function TrackSlowQueries(options: {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-performance-');

  threshold?: number;
  alertOnSlow?: boolean;
  table?: string;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const threshold = options.threshold || 1000; // 1 second default

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;
        
        if (executionTime > threshold) {
          const table = options.table || 'unknown';
          const tenantId = this.extractTenantId?.(args) || 'unknown';
          
          if (options.alertOnSlow) {
            logger.warn(`Slow query detected: ${propertyName} on ${table} (${executionTime}ms) for tenant ${tenantId}`);
          }
          
          // Record slow query metrics if service is available
          const performanceService: EnhancedDatabasePerformanceService = this.enhancedDatabasePerformanceService;
          if (performanceService) {
            // The service will handle this through its regular monitoring
          }
        }
        
        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logger.error(`Query failed: ${propertyName} (${executionTime}ms)`, error);
        throw error;
      }
    };

    return descriptor;
  };
}