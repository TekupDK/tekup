/**
 * API Monitoring Utility
 *
 * Tracks API call patterns, cache hits, and performance metrics
 * Useful for debugging and performance analysis
 */

interface APICallMetric {
  endpoint: string;
  timestamp: number;
  duration: number;
  success: boolean;
  fromCache: boolean;
  errorType?: string;
}

class APIMonitor {
  private metrics: APICallMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 calls
  private cacheHitCount = 0;
  private cacheMissCount = 0;

  /**
   * Track an API call
   */
  trackCall(
    endpoint: string,
    duration: number,
    success: boolean,
    fromCache: boolean = false,
    errorType?: string
  ): void {
    const metric: APICallMetric = {
      endpoint,
      timestamp: Date.now(),
      duration,
      success,
      fromCache,
      errorType,
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Update cache stats
    if (fromCache) {
      this.cacheHitCount++;
    } else {
      this.cacheMissCount++;
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.debug("[APIMonitor]", {
        endpoint,
        duration: `${duration}ms`,
        success,
        fromCache,
        errorType,
      });
    }
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const total = this.cacheHitCount + this.cacheMissCount;
    if (total === 0) return 0;
    return (this.cacheHitCount / total) * 100;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 50): APICallMetric[] {
    return this.metrics.slice(-limit);
  }

  /**
   * Get metrics by endpoint
   */
  getMetricsByEndpoint(endpoint: string): APICallMetric[] {
    return this.metrics.filter(m => m.endpoint === endpoint);
  }

  /**
   * Get average response time
   */
  getAverageResponseTime(endpoint?: string): number {
    const relevant = endpoint
      ? this.getMetricsByEndpoint(endpoint)
      : this.metrics;

    if (relevant.length === 0) return 0;

    const sum = relevant.reduce((acc, m) => acc + m.duration, 0);
    return Math.round(sum / relevant.length);
  }

  /**
   * Get error rate
   */
  getErrorRate(endpoint?: string): number {
    const relevant = endpoint
      ? this.getMetricsByEndpoint(endpoint)
      : this.metrics;

    if (relevant.length === 0) return 0;

    const errors = relevant.filter(m => !m.success).length;
    return (errors / relevant.length) * 100;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalCalls = this.metrics.length;
    const successfulCalls = this.metrics.filter(m => m.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const cacheHits = this.cacheHitCount;
    const cacheMisses = this.cacheMissCount;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      cacheHits,
      cacheMisses,
      cacheHitRate: this.getCacheHitRate(),
      averageResponseTime: this.getAverageResponseTime(),
      errorRate: this.getErrorRate(),
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }
}

// Singleton instance
export const apiMonitor = new APIMonitor();

// Expose for debugging (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).__apiMonitor = apiMonitor;
}
