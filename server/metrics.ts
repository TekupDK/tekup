/**
 * A/B Testing Metrics
 * Track user behavior and feature performance for optimization
 */

export type MetricEvent =
  | "suggestion_shown"
  | "suggestion_accepted"
  | "suggestion_rejected"
  | "suggestion_ignored"
  | "action_executed"
  | "action_failed"
  | "dry_run_performed"
  | "rollout_check";

interface MetricData {
  userId: number;
  event: MetricEvent;
  feature?: string;
  actionType?: string;
  suggestionId?: string;
  conversationId?: number;
  timeToAction?: number; // ms from suggestion shown to accepted
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * In-memory metrics store (for development)
 * In production, send to analytics service (Mixpanel, Amplitude, etc.)
 */
const metricsStore: MetricData[] = [];
const MAX_METRICS_IN_MEMORY = 10000;

/**
 * Track a metric event
 */
export function trackMetric(
  userId: number,
  event: MetricEvent,
  data?: {
    feature?: string;
    actionType?: string;
    suggestionId?: string;
    conversationId?: number;
    timeToAction?: number;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): void {
  const metric: MetricData = {
    userId,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Log to console for visibility
  console.log(
    `[METRICS] ${event} - user=${userId} ${data?.actionType ? `action=${data.actionType}` : ""} ${data?.timeToAction ? `time=${data.timeToAction}ms` : ""}`
  );

  // Store in memory (with size limit)
  metricsStore.push(metric);
  if (metricsStore.length > MAX_METRICS_IN_MEMORY) {
    metricsStore.shift(); // Remove oldest
  }

  // TODO: Send to analytics service
  // Example: mixpanel.track(event, { userId, ...data });
}

/**
 * Calculate suggestion acceptance rate for a user or globally
 */
export function getSuggestionAcceptanceRate(userId?: number): {
  shown: number;
  accepted: number;
  rejected: number;
  ignored: number;
  acceptanceRate: number;
} {
  const metrics = userId
    ? metricsStore.filter(m => m.userId === userId)
    : metricsStore;

  const shown = metrics.filter(m => m.event === "suggestion_shown").length;
  const accepted = metrics.filter(
    m => m.event === "suggestion_accepted"
  ).length;
  const rejected = metrics.filter(
    m => m.event === "suggestion_rejected"
  ).length;
  const ignored = metrics.filter(m => m.event === "suggestion_ignored").length;

  const acceptanceRate = shown > 0 ? Math.round((accepted / shown) * 100) : 0;

  return {
    shown,
    accepted,
    rejected,
    ignored,
    acceptanceRate,
  };
}

/**
 * Calculate average time from suggestion shown to accepted
 */
export function getAverageTimeToAction(userId?: number): number {
  const metrics = userId
    ? metricsStore.filter(m => m.userId === userId)
    : metricsStore;

  const acceptedMetrics = metrics.filter(
    m => m.event === "suggestion_accepted" && m.timeToAction
  );

  if (acceptedMetrics.length === 0) return 0;

  const totalTime = acceptedMetrics.reduce(
    (sum, m) => sum + (m.timeToAction || 0),
    0
  );

  return Math.round(totalTime / acceptedMetrics.length);
}

/**
 * Get error rate for action execution
 */
export function getActionErrorRate(actionType?: string): {
  executed: number;
  failed: number;
  errorRate: number;
} {
  let metrics = metricsStore;

  if (actionType) {
    metrics = metrics.filter(m => m.actionType === actionType);
  }

  const executed = metrics.filter(m => m.event === "action_executed").length;
  const failed = metrics.filter(m => m.event === "action_failed").length;

  const errorRate =
    executed + failed > 0
      ? Math.round((failed / (executed + failed)) * 100)
      : 0;

  return {
    executed,
    failed,
    errorRate,
  };
}

/**
 * Get top performing actions by acceptance rate
 */
export function getTopActions(limit: number = 5): Array<{
  actionType: string;
  shown: number;
  accepted: number;
  acceptanceRate: number;
}> {
  const actionStats = new Map<string, { shown: number; accepted: number }>();

  metricsStore.forEach(m => {
    if (!m.actionType) return;

    if (!actionStats.has(m.actionType)) {
      actionStats.set(m.actionType, { shown: 0, accepted: 0 });
    }

    const stats = actionStats.get(m.actionType)!;

    if (m.event === "suggestion_shown") {
      stats.shown++;
    } else if (m.event === "suggestion_accepted") {
      stats.accepted++;
    }
  });

  return Array.from(actionStats.entries())
    .map(([actionType, stats]) => ({
      actionType,
      shown: stats.shown,
      accepted: stats.accepted,
      acceptanceRate:
        stats.shown > 0 ? Math.round((stats.accepted / stats.shown) * 100) : 0,
    }))
    .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
    .slice(0, limit);
}

/**
 * Get metrics summary for admin dashboard
 */
export function getMetricsSummary(): {
  totalUsers: number;
  totalSuggestions: number;
  totalActions: number;
  globalAcceptanceRate: number;
  averageTimeToAction: number;
  errorRate: number;
  topActions: ReturnType<typeof getTopActions>;
} {
  const uniqueUsers = new Set(metricsStore.map(m => m.userId)).size;
  const suggestionStats = getSuggestionAcceptanceRate();
  const actionStats = getActionErrorRate();

  return {
    totalUsers: uniqueUsers,
    totalSuggestions: suggestionStats.shown,
    totalActions: actionStats.executed + actionStats.failed,
    globalAcceptanceRate: suggestionStats.acceptanceRate,
    averageTimeToAction: getAverageTimeToAction(),
    errorRate: actionStats.errorRate,
    topActions: getTopActions(),
  };
}

/**
 * Clear old metrics (for memory management)
 */
export function clearOldMetrics(olderThanHours: number = 24): number {
  const cutoffTime = new Date(
    Date.now() - olderThanHours * 60 * 60 * 1000
  ).toISOString();

  const initialLength = metricsStore.length;
  const recentMetrics = metricsStore.filter(m => m.timestamp > cutoffTime);

  metricsStore.length = 0;
  metricsStore.push(...recentMetrics);

  const removed = initialLength - metricsStore.length;
  console.log(
    `[METRICS] Cleared ${removed} metrics older than ${olderThanHours}h`
  );

  return removed;
}

// Auto-cleanup every 6 hours
setInterval(
  () => {
    clearOldMetrics(24);
  },
  6 * 60 * 60 * 1000
);
