import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, Tracer } from '@opentelemetry/api';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

let initialized = false;

export interface InitTracingOptions {
  serviceName?: string;
  environment?: string;
  otlpEndpoint?: string; // OTLP endpoint for traces
  enableConsoleExporter?: boolean;
}

export function initTracing(opts: InitTracingOptions = {}): Tracer {
  if (initialized) return trace.getTracer('default');
  
  const serviceName = opts.serviceName || process.env.SERVICE_NAME || 'unknown-service';
  const environment = opts.environment || process.env.NODE_ENV || 'development';
  const otlpEndpoint = opts.otlpEndpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment
    })
  });

  // Add OTLP exporter if endpoint configured
  if (otlpEndpoint) {
    try {
      // Dynamic import to avoid hard dependency
      const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
      const otlpExporter = new OTLPTraceExporter({
        url: otlpEndpoint,
        headers: {
          'Authorization': process.env.OTEL_EXPORTER_OTLP_HEADERS || ''
        }
      });
      provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
    } catch (e) {
      console.warn('OTLP exporter not available:', e.message);
    }
  }

  // Add console exporter for development (simplified)
  if (opts.enableConsoleExporter || (environment === 'development' && !otlpEndpoint)) {
    // Use simple console logging instead of formal exporter
    console.log(`[Tracing] Console output enabled for service: ${serviceName}`);
  }

  provider.register();
  initialized = true;
  return trace.getTracer(serviceName);
}

export function getTracer(name?: string): Tracer {
  return trace.getTracer(name || 'default');
}
