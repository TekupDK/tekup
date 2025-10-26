import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { LogContext } from './structured-logger.service.js';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  tenantId?: string;
  userId?: string;
  startTime: number;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AsyncContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * Run a function within a request context
   */
  run<T>(context: RequestContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get the current request context
   */
  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get correlation ID from current context
   */
  getCorrelationId(): string | undefined {
    return this.getContext()?.correlationId;
  }

  /**
   * Get request ID from current context
   */
  getRequestId(): string | undefined {
    return this.getContext()?.requestId;
  }

  /**
   * Get tenant ID from current context
   */
  getTenantId(): string | undefined {
    return this.getContext()?.tenantId;
  }

  /**
   * Get user ID from current context
   */
  getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  /**
   * Update context with additional data
   */
  updateContext(updates: Partial<RequestContext>): void {
    const current = this.getContext();
    if (current) {
      Object.assign(current, updates);
    }
  }

  /**
   * Add metadata to current context
   */
  addMetadata(key: string, value: any): void {
    const context = this.getContext();
    if (context) {
      if (!context.metadata) {
        context.metadata = {};
      }
      context.metadata[key] = value;
    }
  }

  /**
   * Get request duration from context
   */
  getRequestDuration(): number | undefined {
    const context = this.getContext();
    return context ? Date.now() - context.startTime : undefined;
  }

  /**
   * Convert context to log context
   */
  toLogContext(): LogContext {
    const context = this.getContext();
    if (!context) {
      return {};
    }

    return {
      correlationId: context.correlationId,
      requestId: context.requestId,
      tenantId: context.tenantId,
      userId: context.userId,
      endpoint: context.endpoint,
      method: context.method,
      userAgent: context.userAgent,
      ip: context.ip,
      duration: this.getRequestDuration(),
      metadata: context.metadata,
    };
  }

  /**
   * Execute a function with enhanced context
   */
  withEnhancedContext<T>(
    enhancement: Partial<RequestContext>,
    fn: () => T
  ): T {
    const current = this.getContext();
    if (!current) {
      throw new Error('No active context found');
    }

    const enhanced = { ...current, ...enhancement };
    return this.asyncLocalStorage.run(enhanced, fn);
  }

  /**
   * Create a context-aware function wrapper
   */
  wrap<T extends (...args: any[]) => any>(fn: T): T {
    const context = this.getContext();
    if (!context) {
      return fn;
    }

    return ((...args: any[]) => {
      return this.asyncLocalStorage.run(context, () => fn(...args));
    }) as T;
  }

  /**
   * Create a Promise that maintains context
   */
  async runAsync<T>(context: RequestContext, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.asyncLocalStorage.run(context, async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
