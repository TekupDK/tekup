# @tekup/observability

Lightweight observability toolkit (logging, tracing, request context) for the Tekup monorepo.

## Features
- Pino structured logger with service/ env metadata
- Optional pretty mode in development
- OpenTelemetry tracer bootstrap (plug your own exporter)
- AsyncLocalStorage request context (traceId / tenantId / requestId)
- NestJS global module helper

## Usage
```ts
import { createLogger, initTracing, runWithContext, getContext } from '@tekup/observability';

const logger = createLogger({ serviceName: 'flow-api' });
logger.info('Service starting');

initTracing({ serviceName: 'flow-api' });

runWithContext({ traceId: 'abc123', tenantId: 't1' }, () => {
  logger.info({ ctx: getContext() }, 'Inside contextual scope');
});
```

### NestJS
```ts
@Module({ imports: [ObservabilityModule.forRoot({ serviceName: 'flow-api', enableTracing: true })] })
export class AppModule {}
```

## Environment Variables
- `LOG_LEVEL` (default: info)
- `SERVICE_NAME` (fallback if not provided)
- `NODE_ENV` controls pretty printing (development only)

## Extending
Add metrics (Prometheus / OTEL) by creating a new `metrics.ts` and exporting counters.
