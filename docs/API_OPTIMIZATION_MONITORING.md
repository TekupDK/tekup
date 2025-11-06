# API Optimering - Monitoring & Debugging Guide

**Dato:** ${new Date().toISOString().split('T')[0]}

## 🔍 Debugging Tools

### Browser Console Commands

#### Request Queue Status

```javascript
// Check queue status
window.__requestQueue?.getQueueSize();
window.__requestQueue?.isRateLimited();

// Clear rate limit manually (if needed)
window.__requestQueue?.clearRateLimit();

// Check queue contents (development only)
window.__requestQueue?.queue; // Array of queued requests
```

#### API Monitoring

```javascript
// Get API call statistics
window.__apiMonitor?.getSummary();

// Cache hit rate
window.__apiMonitor?.getCacheHitRate(); // Returns percentage

// Recent API calls
window.__apiMonitor?.getRecentMetrics(20);

// Metrics for specific endpoint
window.__apiMonitor?.getMetricsByEndpoint("inbox.email.list");

// Average response time
window.__apiMonitor?.getAverageResponseTime(); // All endpoints
window.__apiMonitor?.getAverageResponseTime("inbox.email.list"); // Specific endpoint

// Error rate
window.__apiMonitor?.getErrorRate(); // All endpoints
window.__apiMonitor?.getErrorRate("inbox.email.list"); // Specific endpoint

// Clear metrics
window.__apiMonitor?.clear();
```

## 📊 Monitoring Example

### Check Performance After 10 Minutes

```javascript
// Run in browser console after 10 minutes of use
const summary = window.__apiMonitor?.getSummary();

console.log("📊 API Performance Summary:", {
  "Total Calls": summary.totalCalls,
  "Success Rate": `${summary.successRate.toFixed(1)}%`,
  "Cache Hit Rate": `${summary.cacheHitRate.toFixed(1)}%`,
  "Average Response Time": `${summary.averageResponseTime}ms`,
  "Error Rate": `${summary.errorRate.toFixed(1)}%`,
});
```

### Check Rate Limit Status

```javascript
// Check if currently rate limited
const isLimited = window.__requestQueue?.isRateLimited();
const queueSize = window.__requestQueue?.getQueueSize();

console.log("⚠️ Rate Limit Status:", {
  "Is Rate Limited": isLimited,
  "Queue Size": queueSize,
});
```

## 🔍 Console Log Patterns

### Rate Limit Detection

```
[Rate Limit] {
  retryAfter: "2025-01-15T14:30:00.000Z",
  message: "User-rate limit exceeded. Retry after...",
  queueSize: 3
}
```

### Request Queue Activity

```
[RequestQueue] Rate limit active until: 2025-01-15T14:30:00.000Z (45s) Queue size: 3
[RequestQueue] Rate limit cleared. Processing queue... Queue size: 3
[RequestQueue] Queue empty
```

### Adaptive Polling Activity

```
[AdaptivePolling] Interval adjusted: 45000ms → 90000ms (user inactive)
[AdaptivePolling] Polling paused (page hidden)
[AdaptivePolling] Polling resumed (page visible)
```

### API Monitor (Development Only)

```
[APIMonitor] {
  endpoint: "inbox.email.list",
  duration: "245ms",
  success: true,
  fromCache: false
}
```

## 📈 Performance Metrics to Track

### Daily Monitoring

1. **Cache Hit Rate**
   - Target: >80%
   - Check: `window.__apiMonitor?.getCacheHitRate()`

2. **Error Rate**
   - Target: <1%
   - Check: `window.__apiMonitor?.getErrorRate()`

3. **Average Response Time**
   - Target: <500ms
   - Check: `window.__apiMonitor?.getAverageResponseTime()`

4. **Rate Limit Occurrences**
   - Target: 0 in normal use
   - Check console for `[Rate Limit]` warnings

### Weekly Review

1. Export metrics summary
2. Review cache hit rates per endpoint
3. Identify slow endpoints
4. Check for rate limit patterns

## 🐛 Troubleshooting

### High Error Rate

```javascript
// Find which endpoints are failing
const metrics = window.__apiMonitor?.getRecentMetrics(100);
const errors = metrics.filter(m => !m.success);
console.table(
  errors.map(m => ({
    endpoint: m.endpoint,
    errorType: m.errorType,
    timestamp: new Date(m.timestamp).toLocaleString(),
  }))
);
```

### Low Cache Hit Rate

```javascript
// Check which endpoints have low cache usage
const summary = window.__apiMonitor?.getSummary();
console.log("Cache Stats:", {
  hits: summary.cacheHits,
  misses: summary.cacheMisses,
  hitRate: `${summary.cacheHitRate.toFixed(1)}%`,
});

// If low, check QueryClient staleTime settings
```

### Rate Limit Issues

```javascript
// Check rate limit state
const isLimited = window.__requestQueue?.isRateLimited();
if (isLimited) {
  console.warn("⚠️ Currently rate limited!");
  console.log("Queue size:", window.__requestQueue?.getQueueSize());

  // Manual clear if needed (use with caution)
  // window.__requestQueue?.clearRateLimit();
}
```

## 💡 Best Practices

1. **Regular Monitoring**: Check metrics weekly
2. **Alert Thresholds**: Set alerts for error rate >5% or cache hit rate <70%
3. **Debug Mode**: Enable detailed logging in development
4. **Metrics Export**: Export metrics for analysis

## 📝 Notes

- All monitoring tools are **development only** (not exposed in production)
- Metrics are kept in memory (cleared on page refresh)
- Max 1000 metrics stored (rolling window)

---

**For more details:** See `API_OPTIMIZATION_IMPLEMENTATION_NOTES.md`
