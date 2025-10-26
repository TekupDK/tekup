import { PerformanceService, QueryMetadata } from './performance.service.js';

/**
 * Decorator for measuring method performance
 */
export function MeasurePerformance(metadata: Omit<QueryMetadata, 'tenantId'>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const performanceService: PerformanceService = this.performanceService || this.performance;
      
      if (!performanceService) {
        logger.warn(`PerformanceService not found in ${target.constructor.name}. Executing method without performance tracking.`);
        return originalMethod.apply(this, args);
      }

      // Extract tenant ID from arguments (assume first arg or from context)
      const tenantId = args[0]?.tenantId || args[0] || 'unknown';
      
      const fullMetadata: QueryMetadata = {
        ...metadata,
        tenantId: typeof tenantId === 'string' ? tenantId : 'unknown',
      };

      return performanceService.measureQuery(
        () => originalMethod.apply(this, args),
        fullMetadata
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for database query methods
 */
export function MeasureQuery(operation: string, table: string) {
  return MeasurePerformance({ operation, table });
}

/**
 * Decorator for API endpoint methods
 */
export function MeasureEndpoint(endpoint: string) {
  return MeasurePerformance({ 
    operation: `endpoint_${endpoint}`, 
    table: 'api' 
  });
}

/**
 * Utility class for creating performance measurement metadata
 */
export class PerformanceMetadata {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-performance-');

  static forQuery(operation: string, table: string, estimatedRows?: number): Omit<QueryMetadata, 'tenantId'> {
    return { operation, table, estimatedRows };
  }

  static forEndpoint(endpoint: string): Omit<QueryMetadata, 'tenantId'> {
    return { 
      operation: `endpoint_${endpoint}`, 
      table: 'api' 
    };
  }

  static forService(serviceName: string, methodName: string): Omit<QueryMetadata, 'tenantId'> {
    return { 
      operation: `${serviceName}_${methodName}`, 
      table: 'service' 
    };
  }
}