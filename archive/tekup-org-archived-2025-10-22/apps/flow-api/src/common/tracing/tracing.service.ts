import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, any>;
  logs: SpanLog[];
  status: SpanStatus;
  baggage: Record<string, string>;
}

export interface SpanLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

export enum SpanStatus {
  OK = 'OK',
  CANCELLED = 'CANCELLED',
  UNKNOWN = 'UNKNOWN',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  FAILED_PRECONDITION = 'FAILED_PRECONDITION',
  ABORTED = 'ABORTED',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  UNIMPLEMENTED = 'UNIMPLEMENTED',
  INTERNAL = 'INTERNAL',
  UNAVAILABLE = 'UNAVAILABLE',
  DATA_LOSS = 'DATA_LOSS',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage: Record<string, string>;
  samplingDecision: boolean;
}

export interface TracingConfig {
  enabled: boolean;
  samplingRate: number;
  maxSpansPerTrace: number;
  maxSpanDuration: number;
  exportEndpoint?: string;
  exportBatchSize: number;
  exportTimeout: number;
}

@Injectable()
export class TracingService {
  private readonly logger = new Logger(TracingService.name);
  private readonly asyncLocalStorage = new AsyncLocalStorage<TraceContext>();
  private readonly activeSpans = new Map<string, Span>();
  private readonly config: TracingConfig;
  private readonly exportQueue: Span[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly structuredLogger: StructuredLogger,
    private readonly metricsService: MetricsService
  ) {
    this.config = {
      enabled: this.configService.get('TRACING_ENABLED', 'true') === 'true',
      samplingRate: parseFloat(this.configService.get('TRACING_SAMPLING_RATE', '0.1')),
      maxSpansPerTrace: parseInt(this.configService.get('TRACING_MAX_SPANS_PER_TRACE', '1000')),
      maxSpanDuration: parseInt(this.configService.get('TRACING_MAX_SPAN_DURATION', '300000')), // 5 minutes
      exportEndpoint: this.configService.get('TRACING_EXPORT_ENDPOINT'),
      exportBatchSize: parseInt(this.configService.get('TRACING_EXPORT_BATCH_SIZE', '100')),
      exportTimeout: parseInt(this.configService.get('TRACING_EXPORT_TIMEOUT', '5000')),
    };

    if (this.config.enabled) {
      this.startExportTimer();
    }
  }

  /**
   * Start a new trace with root span
   */
  startTrace(operationName: string, tags: Record<string, any> = {}): Span | null {
    if (!this.config.enabled) return null;

    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    // Apply sampling decision
    const samplingDecision = this.shouldSample();
    if (!samplingDecision) {
      return null;
    }

    const span = this.createSpan(traceId, spanId, undefined, operationName, tags);
    
    const context: TraceContext = {
      traceId,
      spanId,
      baggage: {},
      samplingDecision,
    };

    // Store context in async local storage
    this.asyncLocalStorage.enterWith(context);

    this.metricsService.increment('tracing_spans_created_total', {
      operation: operationName,
      sampled: 'true',
    });

    return span;
  }

  /**
   * Start a child span within current trace
   */
  startSpan(operationName: string, tags: Record<string, any> = {}): Span | null {
    if (!this.config.enabled) return null;

    const context = this.asyncLocalStorage.getStore();
    if (!context || !context.samplingDecision) {
      return null;
    }

    const spanId = this.generateSpanId();
    const span = this.createSpan(
      context.traceId,
      spanId,
      context.spanId,
      operationName,
      tags
    );

    // Update context with new span
    const newContext: TraceContext = {
      ...context,
      spanId,
      parentSpanId: context.spanId,
    };

    this.asyncLocalStorage.enterWith(newContext);

    this.metricsService.increment('tracing_spans_created_total', {
      operation: operationName,
      sampled: 'true',
    });

    return span;
  }

  /**
   * Finish a span
   */
  finishSpan(span: Span | null, status: SpanStatus = SpanStatus.OK): void {
    if (!span || !this.config.enabled) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;

    // Remove from active spans
    this.activeSpans.delete(span.spanId);

    // Add to export queue
    this.exportQueue.push(span);

    // Record metrics
    this.metricsService.increment('tracing_spans_finished_total', {
      operation: span.operationName,
      status: status.toString(),
    });

    this.metricsService.histogram('tracing_span_duration_ms', span.duration, {
      operation: span.operationName,
    });

    // Log span completion
    this.structuredLogger.debug(
      `Span completed: ${span.operationName}`,
      {
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        duration: span.duration,
        status: status.toString(),
        tags: span.tags,
      }
    );
  }

  /**
   * Add tags to current span
   */
  addTags(tags: Record<string, any>): void {
    if (!this.config.enabled) return;

    const context = this.asyncLocalStorage.getStore();
    if (!context) return;

    const span = this.activeSpans.get(context.spanId);
    if (span) {
      Object.assign(span.tags, tags);
    }
  }

  /**
   * Add log entry to current span
   */
  addLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const context = this.asyncLocalStorage.getStore();
    if (!context) return;

    const span = this.activeSpans.get(context.spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        level,
        message,
        fields,
      });
    }
  }

  /**
   * Set baggage item (propagated across span boundaries)
   */
  setBaggage(key: string, value: string): void {
    if (!this.config.enabled) return;

    const context = this.asyncLocalStorage.getStore();
    if (context) {
      context.baggage[key] = value;
    }
  }

  /**
   * Get baggage item
   */
  getBaggage(key: string): string | undefined {
    if (!this.config.enabled) return undefined;

    const context = this.asyncLocalStorage.getStore();
    return context?.baggage[key];
  }

  /**
   * Get current trace context
   */
  getCurrentContext(): TraceContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Execute function within a span
   */
  async withSpan<T>(
    operationName: string,
    fn: (span: Span | null) => Promise<T>,
    tags: Record<string, any> = {}
  ): Promise<T> {
    const span = this.startSpan(operationName, tags);
    
    try {
      const result = await fn(span);
      this.finishSpan(span, SpanStatus.OK);
      return result;
    } catch (error) {
      this.addLog('error', 'Operation failed', { error: error.message });
      this.addTags({ error: true, 'error.message': error.message });
      this.finishSpan(span, SpanStatus.INTERNAL);
      throw error;
    }
  }

  /**
   * Execute function within a new trace
   */
  async withTrace<T>(
    operationName: string,
    fn: (span: Span | null) => Promise<T>,
    tags: Record<string, any> = {}
  ): Promise<T> {
    const span = this.startTrace(operationName, tags);
    
    try {
      const result = await fn(span);
      this.finishSpan(span, SpanStatus.OK);
      return result;
    } catch (error) {
      this.addLog('error', 'Trace failed', { error: error.message });
      this.addTags({ error: true, 'error.message': error.message });
      this.finishSpan(span, SpanStatus.INTERNAL);
      throw error;
    }
  }

  /**
   * Inject trace context into headers (for outgoing requests)
   */
  injectHeaders(headers: Record<string, string> = {}): Record<string, string> {
    if (!this.config.enabled) return headers;

    const context = this.asyncLocalStorage.getStore();
    if (!context) return headers;

    const injectedHeaders = { ...headers };
    
    // W3C Trace Context standard
    injectedHeaders['traceparent'] = `00-${context.traceId}-${context.spanId}-01`;
    
    // Baggage
    if (Object.keys(context.baggage).length > 0) {
      const baggageString = Object.entries(context.baggage)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join(',');
      injectedHeaders['baggage'] = baggageString;
    }

    return injectedHeaders;
  }

  /**
   * Extract trace context from headers (for incoming requests)
   */
  extractContext(headers: Record<string, string>): TraceContext | null {
    if (!this.config.enabled) return null;

    const traceparent = headers['traceparent'];
    if (!traceparent) return null;

    // Parse W3C Trace Context
    const parts = traceparent.split('-');
    if (parts.length !== 4) return null;

    const [version, traceId, parentSpanId, flags] = parts;
    if (version !== '00') return null;

    // Parse baggage
    const baggage: Record<string, string> = {};
    const baggageHeader = headers['baggage'];
    if (baggageHeader) {
      baggageHeader.split(',').forEach(item => {
        const [key, value] = item.trim().split('=');
        if (key && value) {
          baggage[key] = decodeURIComponent(value);
        }
      });
    }

    return {
      traceId,
      spanId: this.generateSpanId(),
      parentSpanId,
      baggage,
      samplingDecision: this.shouldSample(),
    };
  }

  /**
   * Set trace context from extracted context
   */
  setContext(context: TraceContext): void {
    if (!this.config.enabled) return;
    this.asyncLocalStorage.enterWith(context);
  }

  /**
   * Get trace statistics
   */
  getTraceStats(): {
    activeSpans: number;
    queuedSpans: number;
    totalSpansCreated: number;
    samplingRate: number;
  } {
    return {
      activeSpans: this.activeSpans.size,
      queuedSpans: this.exportQueue.length,
      totalSpansCreated: 0, // Would need to be tracked
      samplingRate: this.config.samplingRate,
    };
  }

  private createSpan(
    traceId: string,
    spanId: string,
    parentSpanId: string | undefined,
    operationName: string,
    tags: Record<string, any>
  ): Span {
    const span: Span = {
      traceId,
      spanId,
      parentSpanId,
      operationName,
      startTime: Date.now(),
      tags: {
        ...tags,
        'service.name': 'project-x-api',
        'service.version': this.configService.get('API_VERSION', '1.0.0'),
      },
      logs: [],
      status: SpanStatus.OK,
      baggage: {},
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  private generateTraceId(): string {
    return randomUUID().replace(/-/g, '');
  }

  private generateSpanId(): string {
    return randomUUID().replace(/-/g, '').substring(0, 16);
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  private startExportTimer(): void {
    setInterval(() => {
      this.exportSpans();
    }, this.config.exportTimeout);
  }

  private async exportSpans(): Promise<void> {
    if (this.exportQueue.length === 0) return;

    const spansToExport = this.exportQueue.splice(0, this.config.exportBatchSize);
    
    try {
      if (this.config.exportEndpoint) {
        await this.exportToEndpoint(spansToExport);
      } else {
        // Log spans for development/debugging
        this.logSpans(spansToExport);
      }

      this.metricsService.increment('tracing_spans_exported_total', {
        count: spansToExport.length.toString(),
      });

    } catch (error) {
      this.logger.error('Failed to export spans:', error);
      
      // Re-queue spans for retry (with some limit)
      if (this.exportQueue.length < this.config.maxSpansPerTrace) {
        this.exportQueue.unshift(...spansToExport);
      }

      this.metricsService.increment('tracing_export_failures_total');
    }
  }

  private async exportToEndpoint(spans: Span[]): Promise<void> {
    if (!this.config.exportEndpoint) return;

    // Convert spans to OTLP format or custom format
    const exportData = {
      spans: spans.map(span => ({
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        operationName: span.operationName,
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        tags: span.tags,
        logs: span.logs,
        status: span.status,
      })),
    };

    // Send to tracing backend (Jaeger, Zipkin, etc.)
    const response = await fetch(this.config.exportEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exportData),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status} ${response.statusText}`);
    }
  }

  private logSpans(spans: Span[]): void {
    for (const span of spans) {
      this.structuredLogger.debug(
        `Exported span: ${span.operationName}`,
        {
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentSpanId,
          duration: span.duration,
          status: span.status,
          tags: span.tags,
          logCount: span.logs.length,
        }
      );
    }
  }
}