import { TracingService } from './tracing.service.js';

interface TracingOptions {
  operationName?: string;
  tags?: Record<string, any>;
  logResult?: boolean;
  logError?: boolean;
}

/**
 * Decorator to automatically trace a method execution
 */
export function Trace(options: TracingOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracingService: TracingService = this.tracingService;
      
      if (!tracingService) {
        logger.warn(`TracingService not found in ${target.constructor.name}. Executing method without tracing.`);
        return originalMethod.apply(this, args);
      }

      const operationName = options.operationName || 
        `${target.constructor.name}.${propertyName}`;

      const tags = {
        'component': target.constructor.name.toLowerCase(),
        'method': propertyName,
        ...options.tags,
      };

      return await tracingService.withSpan(operationName, async (span) => {
        // Add initial tags
        if (span) {
          tracingService.addTags(tags);
          
          // Log method arguments (be careful with sensitive data)
          if (args.length > 0) {
            tracingService.addLog('debug', 'Method called', {
              argumentCount: args.length,
              firstArgType: typeof args[0],
            });
          }
        }

        try {
          const result = await originalMethod.apply(this, args);
          
          if (span && options.logResult && result !== undefined) {
            tracingService.addLog('debug', 'Method returned result', {
              resultType: typeof result,
              hasResult: result !== null && result !== undefined,
            });
          }

          return result;
        } catch (error) {
          if (span && options.logError !== false) {
            tracingService.addLog('error', 'Method threw error', {
              errorType: error.constructor.name,
              errorMessage: error.message,
            });
          }
          throw error;
        }
      }, tags);
    };

    return descriptor;
  };
}

/**
 * Decorator to trace database operations
 */
export function TraceDatabase(options: {
  operation?: string;
  table?: string;
  tags?: Record<string, any>;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracingService: TracingService = this.tracingService;
      
      if (!tracingService) {
        return originalMethod.apply(this, args);
      }

      const operation = options.operation || propertyName;
      const operationName = `db.${operation}`;

      const tags = {
        'component': 'database',
        'db.type': 'postgresql',
        'db.operation': operation,
        'db.table': options.table || 'unknown',
        'span.kind': 'client',
        ...options.tags,
      };

      return await tracingService.withSpan(operationName, async (span) => {
        if (span) {
          tracingService.addTags(tags);
          
          // Add tenant context if available
          const tenantId = tracingService.getBaggage('tenant.id');
          if (tenantId) {
            tracingService.addTags({ 'db.tenant_id': tenantId });
          }
        }

        const startTime = Date.now();
        
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          
          if (span) {
            tracingService.addTags({
              'db.duration_ms': duration,
              'db.success': true,
            });

            // Log result metadata
            if (result && typeof result === 'object') {
              if (Array.isArray(result)) {
                tracingService.addTags({ 'db.rows_affected': result.length });
              } else if (result.count !== undefined) {
                tracingService.addTags({ 'db.rows_affected': result.count });
              }
            }
            
            tracingService.addLog('debug', 'Database operation completed', {
              duration,
              resultType: typeof result,
            });
          }

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          if (span) {
            tracingService.addTags({
              'db.duration_ms': duration,
              'db.success': false,
              'error': true,
              'error.message': error.message,
            });
            
            tracingService.addLog('error', 'Database operation failed', {
              duration,
              error: error.message,
            });
          }
          
          throw error;
        }
      }, tags);
    };

    return descriptor;
  };
}

/**
 * Decorator to trace cache operations
 */
export function TraceCache(options: {
  operation?: 'get' | 'set' | 'delete' | 'invalidate';
  tags?: Record<string, any>;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracingService: TracingService = this.tracingService;
      
      if (!tracingService) {
        return originalMethod.apply(this, args);
      }

      const operation = options.operation || propertyName;
      const operationName = `cache.${operation}`;

      const tags = {
        'component': 'cache',
        'cache.operation': operation,
        'cache.type': 'redis',
        'span.kind': 'client',
        ...options.tags,
      };

      return await tracingService.withSpan(operationName, async (span) => {
        if (span) {
          tracingService.addTags(tags);
          
          // Add cache key if it's the first argument
          if (args.length > 0 && typeof args[0] === 'string') {
            tracingService.addTags({ 'cache.key': args[0].substring(0, 100) }); // Truncate long keys
          }
        }

        const startTime = Date.now();
        
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          
          if (span) {
            const hit = operation === 'get' && result !== null && result !== undefined;
            
            tracingService.addTags({
              'cache.duration_ms': duration,
              'cache.hit': hit,
              'cache.success': true,
            });
            
            tracingService.addLog('debug', 'Cache operation completed', {
              duration,
              hit,
              resultType: typeof result,
            });
          }

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          if (span) {
            tracingService.addTags({
              'cache.duration_ms': duration,
              'cache.success': false,
              'error': true,
              'error.message': error.message,
            });
            
            tracingService.addLog('error', 'Cache operation failed', {
              duration,
              error: error.message,
            });
          }
          
          throw error;
        }
      }, tags);
    };

    return descriptor;
  };
}

/**
 * Decorator to trace external service calls
 */
export function TraceExternalService(options: {
  serviceName?: string;
  operation?: string;
  tags?: Record<string, any>;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracingService: TracingService = this.tracingService;
      
      if (!tracingService) {
        return originalMethod.apply(this, args);
      }

      const serviceName = options.serviceName || 'external-service';
      const operation = options.operation || propertyName;
      const operationName = `${serviceName}.${operation}`;

      const tags = {
        'component': 'http-client',
        'service.name': serviceName,
        'service.operation': operation,
        'span.kind': 'client',
        ...options.tags,
      };

      return await tracingService.withSpan(operationName, async (span) => {
        if (span) {
          tracingService.addTags(tags);
          
          // Inject tracing headers for downstream services
          if (args.length > 0 && typeof args[0] === 'object' && args[0].headers) {
            const headers = tracingService.injectHeaders(args[0].headers);
            args[0].headers = headers;
            
            tracingService.addLog('debug', 'Injected tracing headers', {
              headerCount: Object.keys(headers).length,
            });
          }
        }

        const startTime = Date.now();
        
        try {
          const result = await originalMethod.apply(this, args);
          const duration = Date.now() - startTime;
          
          if (span) {
            tracingService.addTags({
              'external.duration_ms': duration,
              'external.success': true,
            });
            
            // Add response status if available
            if (result && result.status) {
              tracingService.addTags({ 'http.status_code': result.status });
            }
            
            tracingService.addLog('debug', 'External service call completed', {
              duration,
              resultType: typeof result,
            });
          }

          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          
          if (span) {
            tracingService.addTags({
              'external.duration_ms': duration,
              'external.success': false,
              'error': true,
              'error.message': error.message,
            });
            
            tracingService.addLog('error', 'External service call failed', {
              duration,
              error: error.message,
            });
          }
          
          throw error;
        }
      }, tags);
    };

    return descriptor;
  };
}

/**
 * Class decorator to inject TracingService
 */
export function TracingEnabled(target: any) {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-common-traci');

  // This would typically be handled by NestJS dependency injection
  // This is a placeholder for the concept
  return target;
}