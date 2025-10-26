import { SetMetadata } from '@nestjs/common';

export const LOG_CONTEXT_KEY = 'log_context';
export const LOG_PERFORMANCE_KEY = 'log_performance';
export const LOG_BUSINESS_EVENT_KEY = 'log_business_event';

/**
 * Decorator to add logging context to a method or class
 */
export const LogContext = (context: Record<string, any>) => 
  SetMetadata(LOG_CONTEXT_KEY, context);

/**
 * Decorator to enable performance logging for a method
 */
export const LogPerformance = (operation?: string) => 
  SetMetadata(LOG_PERFORMANCE_KEY, { operation });

/**
 * Decorator to log business events
 */
export const LogBusinessEvent = (eventName: string, includeArgs: boolean = false) =>
  SetMetadata(LOG_BUSINESS_EVENT_KEY, { eventName, includeArgs });

/**
 * Method decorator to automatically log method execution
 */
export function LogMethod(options: {
  level?: 'debug' | 'info' | 'warn' | 'error';
  includeArgs?: boolean;
  includeResult?: boolean;
  operation?: string;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const {
      level = 'debug',
      includeArgs = false,
      includeResult = false,
      operation = `${target.constructor.name}.${propertyName}`,
    } = options;

    descriptor.value = async function (...args: any[]) {
      const logger = this.logger || console; // Fallback to console if no logger
      const startTime = Date.now();

      try {
        // Log method entry
        const context: any = {
          operation,
          method: propertyName,
          class: target.constructor.name,
        };

        if (includeArgs) {
          context.arguments = args;
        }

        if (logger.debug) {
          logger.debug(`Entering ${operation}`, context);
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        // Log method success
        const successContext: any = {
          ...context,
          duration,
          success: true,
        };

        if (includeResult) {
          successContext.result = result;
        }

        if (logger[level]) {
          logger[level](`Completed ${operation}`, successContext);
        }

        // Log performance if method took too long
        if (duration > 1000 && logger.performance) {
          logger.performance(operation, duration, context);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Log method error
        const errorContext = {
          operation,
          method: propertyName,
          class: target.constructor.name,
          duration,
          success: false,
        };

        if (includeArgs) {
          errorContext['arguments'] = args;
        }

        if (logger.error) {
          logger.error(`Failed ${operation}`, error, errorContext);
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Class decorator to add logging context to all methods
 */
export function LogClass(context: Record<string, any>) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        
        // Add logging context to all methods
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype)
          .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');

        methodNames.forEach(methodName => {
          const originalMethod = this[methodName];
          if (typeof originalMethod === 'function') {
            this[methodName] = function (...args: any[]) {
              const logger = this.logger;
              if (logger && logger.setContext) {
                logger.setContext(context);
              }
              return originalMethod.apply(this, args);
            };
          }
        });
      }
    };
  };
}

/**
 * Parameter decorator to inject correlation ID
 */
export const CorrelationId = () => {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // This would be implemented with a custom parameter decorator
    // For now, it's a placeholder for the concept
  };
};