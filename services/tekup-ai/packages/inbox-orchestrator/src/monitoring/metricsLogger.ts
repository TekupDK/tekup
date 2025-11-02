/**
 * Metrics Logger for Friday AI
 *
 * Logs performance metrics for every request:
 * - Token usage (prompt + completion)
 * - Latency
 * - Cost estimation
 * - Quality scores (optional)
 */

export interface RequestMetrics {
  requestId: string;
  timestamp: string;
  intent?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latency: number; // milliseconds
  cost: number; // DKK
  qualityScore?: number; // 0-100, optional
  endpoint: string;
  success: boolean;
  error?: string;
}

interface MetricsStorage {
  metrics: RequestMetrics[];
  maxSize: number;
}

// In-memory storage for testing
// In production, this should be stored in database or external service
const storage: MetricsStorage = {
  metrics: [],
  maxSize: 1000, // Keep last 1000 requests
};

/**
 * Log metrics for a request
 */
export function logMetrics(metrics: RequestMetrics): void {
  storage.metrics.push(metrics);

  // Keep only last maxSize metrics
  if (storage.metrics.length > storage.maxSize) {
    storage.metrics.shift();
  }

  // In development, also log to console (only if not in test mode)
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NODE_ENV !== "test"
  ) {
    console.warn("[METRICS]", {
      intent: metrics.intent,
      tokens: `${metrics.promptTokens}+${metrics.completionTokens}=${metrics.totalTokens}`,
      latency: `${metrics.latency}ms`,
      cost: `${metrics.cost.toFixed(6)} DKK`,
    });
  }
}

/**
 * Get all metrics (for testing/analysis)
 */
export function getAllMetrics(): RequestMetrics[] {
  return [...storage.metrics];
}

/**
 * Get metrics summary
 */
export function getMetricsSummary(timeWindow?: number): {
  totalRequests: number;
  averageTokens: number;
  averageLatency: number;
  totalCost: number;
  successRate: number;
  requestsByIntent: Record<string, number>;
} {
  const now = Date.now();
  const cutoff = timeWindow ? now - timeWindow : 0;

  const relevantMetrics = storage.metrics.filter((m) => {
    const metricTime = new Date(m.timestamp).getTime();
    return metricTime >= cutoff;
  });

  if (relevantMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageTokens: 0,
      averageLatency: 0,
      totalCost: 0,
      successRate: 0,
      requestsByIntent: {},
    };
  }

  const totalTokens = relevantMetrics.reduce(
    (sum, m) => sum + m.totalTokens,
    0
  );
  const totalLatency = relevantMetrics.reduce((sum, m) => sum + m.latency, 0);
  const totalCost = relevantMetrics.reduce((sum, m) => sum + m.cost, 0);
  const successful = relevantMetrics.filter((m) => m.success).length;

  const requestsByIntent: Record<string, number> = {};
  relevantMetrics.forEach((m) => {
    if (m.intent) {
      requestsByIntent[m.intent] = (requestsByIntent[m.intent] || 0) + 1;
    }
  });

  return {
    totalRequests: relevantMetrics.length,
    averageTokens: Math.round(totalTokens / relevantMetrics.length),
    averageLatency: Math.round(totalLatency / relevantMetrics.length),
    totalCost: totalCost,
    successRate: (successful / relevantMetrics.length) * 100,
    requestsByIntent,
  };
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  storage.metrics = [];
}
