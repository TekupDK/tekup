import { Counter, Histogram, collectDefaultMetrics, Registry } from 'prom-client';

const registry = new Registry();
collectDefaultMetrics({ register: registry });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});
registry.registerMetric(httpRequestDuration);

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});
registry.registerMetric(httpRequestsTotal);

export const aiTokensTotal = new Counter({
  name: 'ai_tokens_total',
  help: 'Total AI tokens processed',
  labelNames: ['model', 'tenant']
});
registry.registerMetric(aiTokensTotal);

export const tenantQueryDenied = new Counter({
  name: 'tenant_query_denied_total',
  help: 'Cross-tenant or missing-tenant query attempts blocked',
  labelNames: ['model']
});
registry.registerMetric(tenantQueryDenied);

export function metricsSnapshot() {
  return registry.metrics();
}

export function getRegistry() { return registry; }
