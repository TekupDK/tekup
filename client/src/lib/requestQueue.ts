/**
 * Request Queue System
 *
 * Queues rate-limited requests and processes them after retry-after period
 * Supports priority-based queuing for critical vs non-critical requests
 */

export interface QueuedRequest {
  id: string;
  priority: "high" | "normal" | "low";
  execute: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  timestamp: number;
  retryAfter?: Date;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private rateLimitUntil: Date | null = null;
  private processingTimeout: NodeJS.Timeout | null = null;

  /**
   * Add request to queue
   */
  enqueue(request: Omit<QueuedRequest, "id" | "timestamp">): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      // Insert based on priority (high priority first)
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      const insertIndex = this.queue.findIndex(
        req =>
          priorityOrder[req.priority] > priorityOrder[queuedRequest.priority]
      );

      if (insertIndex === -1) {
        this.queue.push(queuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest);
      }

      // Start processing if not already processing
      this.processQueue();
    });
  }

  /**
   * Set rate limit period (block requests until this time)
   */
  setRateLimitUntil(retryAfter: Date): void {
    this.rateLimitUntil = retryAfter;
    const now = new Date();
    const msUntilRetry = Math.max(0, retryAfter.getTime() - now.getTime());

    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[RequestQueue] Rate limit active until:",
        retryAfter.toISOString(),
        `(${Math.ceil(msUntilRetry / 1000)}s)`,
        `Queue size: ${this.queue.length}`
      );
    }

    // Schedule processing when rate limit expires

    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }

    if (msUntilRetry > 0) {
      this.processingTimeout = setTimeout(() => {
        this.rateLimitUntil = null;
        this.processQueue();
      }, msUntilRetry + 100); // Small buffer
    }
  }

  /**
   * Clear rate limit (manual override)
   */
  clearRateLimit(): void {
    this.rateLimitUntil = null;
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[RequestQueue] Rate limit cleared. Processing queue...",
        `Queue size: ${this.queue.length}`
      );
    }

    this.processQueue();
  }

  /**
   * Check if queue is rate limited
   */
  isRateLimited(): boolean {
    if (!this.rateLimitUntil) return false;
    const now = new Date();
    return now < this.rateLimitUntil;
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    if (this.queue.length === 0) return;

    // Wait if rate limited
    if (this.isRateLimited()) {
      return;
    }

    this.processing = true;

    try {
      // Process first request in queue
      const request = this.queue.shift();
      if (!request) {
        this.processing = false;
        return;
      }

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    } finally {
      this.processing = false;

      // Process next request after small delay (prevent burst)
      if (this.queue.length > 0 && !this.isRateLimited()) {
        setTimeout(() => this.processQueue(), 100);
      } else if (
        this.queue.length === 0 &&
        process.env.NODE_ENV === "development"
      ) {
        console.log("[RequestQueue] Queue empty");
      }
    }
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    this.queue.forEach(req => {
      req.reject(new Error("Request queue cleared"));
    });
    this.queue = [];
    this.processing = false;
  }
}

// Singleton instance
export const requestQueue = new RequestQueue();

// Expose for debugging (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__requestQueue = requestQueue;
}

/**
 * Helper to queue a TRPC request
 */
export async function queueTRPCRequest<T>(
  procedure: () => Promise<T>,
  priority: "high" | "normal" | "low" = "normal"
): Promise<T> {
  return requestQueue.enqueue({
    priority,
    execute: procedure,
    resolve: () => {}, // Will be set by Promise
    reject: () => {}, // Will be set by Promise
  }) as Promise<T>;
}
