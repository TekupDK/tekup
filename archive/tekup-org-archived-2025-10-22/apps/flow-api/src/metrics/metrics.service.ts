import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type Labels = Record<string, string | number | undefined>;

export interface MetricDefinition {
  name: string;
  help: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: string[];
  buckets?: number[];
}

export interface HistogramSeries {
  counts: number[];
  sum: number;
  count: number;
}

export interface SummarySeries {
  quantiles: Map<number, number>;
  sum: number;
  count: number;
  observations: number[];
}

export interface GaugeValue {
  value: number;
  timestamp: number;
}

/**
 * Service for in-memory metrics collection and Prometheus rendering.
 * @remarks Metrics are not persisted; intended for lightweight observability.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private counters: Record<string, Map<string, number>> = {};
  private gauges: Record<string, Map<string, GaugeValue>> = {};
  private histograms: Record<string, { buckets: number[]; series: Map<string, HistogramSeries> }> = {};
  private summaries: Record<string, { series: Map<string, SummarySeries> }> = {};
  private metrics: Map<string, MetricDefinition> = new Map();
  private aliases: Record<string, string> = {
    // Backward compatibility: new canonical name -> legacy source metric
    leads_new_total: 'lead_created_total'
  };
  private buildInfo: Record<string,string> | null = null;
  private readonly maxObservations = 1000; // Max observations to keep for summaries

  constructor(private readonly configService?: ConfigService) {
    this.initializeDefaultMetrics();
  }

  /**
   * Initialize default metrics definitions
   */
  private initializeDefaultMetrics(): void {
    // Existing metrics
    this.registerMetric({
      name: 'lead_created_total',
      help: 'Total leads created by tenant and source',
      type: 'counter',
      labels: ['tenant', 'source']
    });

    // Voice Agent metrics (planned, stubbed)
    this.registerMetric({
      name: 'voice_session_started_total',
      help: 'Total voice sessions started by tenant',
      type: 'counter',
      labels: ['tenant']
    });
    this.registerMetric({
      name: 'voice_command_executed_total',
      help: 'Total voice commands executed by tenant and intent',
      type: 'counter',
      labels: ['tenant', 'intent']
    });
    this.registerMetric({
      name: 'voice_command_failed_total',
      help: 'Total failed voice commands by tenant, intent, and reason',
      type: 'counter',
      labels: ['tenant', 'intent', 'reason']
    });
    this.registerMetric({
      name: 'voice_function_latency_seconds',
      help: 'Voice function execution latency (seconds) by tenant and intent',
      type: 'histogram',
      labels: ['tenant', 'intent'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });

    this.registerMetric({
      name: 'lead_status_transition_total',
      help: 'Status transitions by tenant',
      type: 'counter',
      labels: ['tenant', 'from', 'to']
    });

    this.registerMetric({
      name: 'ingestion_latency_seconds',
      help: 'Lead ingestion processing time',
      type: 'histogram',
      labels: ['tenant', 'source'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
    });

    // New metrics for duplicate detection
    this.registerMetric({
      name: 'duplicate_detection_total',
      help: 'Total duplicate detection attempts by strategy',
      type: 'counter',
      labels: ['strategy', 'tenant']
    });

    this.registerMetric({
      name: 'duplicate_detection_duration_seconds',
      help: 'Time spent in duplicate detection',
      type: 'histogram',
      labels: ['tenant'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2]
    });

    this.registerMetric({
      name: 'lead_duplicate_detected_total',
      help: 'Total duplicates detected by tenant',
      type: 'counter',
      labels: ['tenant', 'strategy']
    });

    // New metrics for source attribution
    this.registerMetric({
      name: 'email_source_classification_total',
      help: 'Total email classifications by source and confidence',
      type: 'counter',
      labels: ['source', 'confidence_level', 'tenant']
    });

    this.registerMetric({
      name: 'parser_success_total',
      help: 'Successful parsing attempts by parser type',
      type: 'counter',
      labels: ['parser', 'tenant']
    });

    this.registerMetric({
      name: 'parser_failure_total',
      help: 'Failed parsing attempts by parser type and reason',
      type: 'counter',
      labels: ['parser', 'reason', 'tenant']
    });

    // New metrics for compliance SLA tracking
    this.registerMetric({
      name: 'compliance_lead_created_total',
      help: 'Total compliance leads created by type and severity',
      type: 'counter',
      labels: ['type', 'severity', 'tenant']
    });

    this.registerMetric({
      name: 'sla_deadline_set_total',
      help: 'Total SLA deadlines set by severity',
      type: 'counter',
      labels: ['severity', 'tenant']
    });

    this.registerMetric({
      name: 'sla_approaching_total',
      help: 'Total SLA deadlines approaching by severity',
      type: 'counter',
      labels: ['severity', 'tenant']
    });

    this.registerMetric({
      name: 'sla_breached_total',
      help: 'Total SLA deadlines breached by severity',
      type: 'counter',
      labels: ['severity', 'tenant']
    });

    this.registerMetric({
      name: 'sla_monitoring_checks_total',
      help: 'Total SLA monitoring checks by result and type',
      type: 'counter',
      labels: ['result', 'type']
    });

    // SLA processing latency (time from lead creation to first status transition)
    this.registerMetric({
      name: 'sla_processing_duration_seconds',
      help: 'Time between lead creation and initial processing (first status transition)',
      type: 'histogram',
      labels: ['tenant'],
      buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600, 1800]
    });

    // Ingestion form metrics (existing code uses these names but they were not previously registered)
    this.registerMetric({
      name: 'lead_ingest_validation_failed_total',
      help: 'Total lead ingestion validation failures by reason',
      type: 'counter',
      labels: ['reason']
    });

    this.registerMetric({
      name: 'lead_ingest_duration_seconds',
      help: 'Lead ingestion form processing duration',
      type: 'histogram',
      labels: ['tenant', 'source'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
    });

    // Circuit breaker metrics (added to support circuit breaker service instrumentation)
    this.registerMetric({
      name: 'circuit_breaker_calls_total',
      help: 'Total circuit breaker wrapped calls by circuit, state and operation',
      type: 'counter',
      labels: ['circuit', 'state', 'operation']
    });

    this.registerMetric({
      name: 'circuit_breaker_state_changes_total',
      help: 'Total circuit breaker state changes by circuit and new state',
      type: 'counter',
      labels: ['circuit', 'state']
    });

    this.registerMetric({
      name: 'circuit_breaker_state',
      help: 'Gauge representing current state of circuit breaker (0=closed,1=half_open,2=open)',
      type: 'gauge',
      labels: ['circuit']
    });
  }

  /**
   * Calculate quantiles for summary metrics
   */
  private calculateQuantiles(series: SummarySeries): void {
    if (series.observations.length === 0) return;
    
    const sorted = [...series.observations].sort((a, b) => a - b);
    
    for (const [quantile] of series.quantiles) {
      const index = Math.ceil(quantile * sorted.length) - 1;
      const value = sorted[Math.max(0, index)];
      series.quantiles.set(quantile, value);
    }
  }

  /**
   * Get formatted label key
   */
  private getLabelKey(name: string, labels?: Labels): string {
    return this.key(name, labels).replace(new RegExp(`^${name}:`), '').replace(/^{|}$/g, '');
  }

  private key(name: string, labels?: Labels): string {
    if (!labels) return name;
    const parts = Object.entries(labels)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .sort();
    return `${name}:{${parts.join(',')}}`;
  }

  /**
   * Register a metric definition
   */
  /**
   * Register a metric definition.
   * @param definition - Metric metadata including type and labels
   */
  registerMetric(definition: MetricDefinition): void {
    this.metrics.set(definition.name, definition);
    
    // Initialize metric storage based on type
    switch (definition.type) {
      case 'counter':
        if (!this.counters[definition.name]) {
          this.counters[definition.name] = new Map();
        }
        break;
      case 'gauge':
        if (!this.gauges[definition.name]) {
          this.gauges[definition.name] = new Map();
        }
        break;
      case 'histogram':
        if (!this.histograms[definition.name]) {
          this.histograms[definition.name] = {
            buckets: definition.buckets || [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
            series: new Map(),
          };
        }
        break;
      case 'summary':
        if (!this.summaries[definition.name]) {
          this.summaries[definition.name] = { series: new Map() };
        }
        break;
    }
  }

  /**
   * Increment a counter metric
   */
  /**
   * Increment a counter.
   * @param name - Metric name
   * @param labels - Optional label map
   * @param value - Increment step (default 1)
   */
  increment(name: string, labels?: Labels, value = 1): void {
    const target = this.aliases[name] || name;
    const k = this.key(target, labels);
    
    if (!this.counters[target]) {
      this.counters[target] = new Map();
    }
    
    const map = this.counters[target];
    map.set(k, (map.get(k) || 0) + value);
  }

  /**
   * Decrement a counter metric
   */
  /**
   * Decrement a counter (implemented via negative increment).
   */
  decrement(name: string, labels?: Labels, value = 1): void {
    this.increment(name, labels, -value);
  }

  /**
   * Set a gauge metric value
   */
  /**
   * Set a gauge value.
   */
  gauge(name: string, value: number, labels?: Labels): void {
    const k = this.key(name, labels);
    
    if (!this.gauges[name]) {
      this.gauges[name] = new Map();
    }
    
    this.gauges[name].set(k, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Observe a value for histogram metric
   */
  /**
   * Observe a value for a histogram.
   */
  histogram(name: string, value: number, labels?: Labels, buckets?: number[]): void {
    if (!this.histograms[name]) {
      this.histograms[name] = {
        buckets: buckets || [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
        series: new Map(),
      };
    }
    
    const h = this.histograms[name];
    const labelKey = this.getLabelKey(name, labels);
    
    if (!h.series.has(labelKey)) {
      h.series.set(labelKey, {
        counts: new Array(h.buckets.length + 1).fill(0),
        sum: 0,
        count: 0,
      });
    }
    
    const series = h.series.get(labelKey)!;
    series.sum += value;
    series.count += 1;
    
    // Find the appropriate bucket
    for (let i = 0; i < h.buckets.length; i++) {
      if (value <= h.buckets[i]) {
        series.counts[i] += 1;
        return;
      }
    }
    
    // If value is larger than all buckets, add to the "+Inf" bucket
    series.counts[series.counts.length - 1] += 1;
  }

  /**
   * Observe a value for summary metric
   */
  /**
   * Observe a value for a summary.
   */
  summary(name: string, value: number, labels?: Labels, quantiles: number[] = [0.5, 0.9, 0.95, 0.99]): void {
    if (!this.summaries[name]) {
      this.summaries[name] = { series: new Map() };
    }
    
    const s = this.summaries[name];
    const labelKey = this.getLabelKey(name, labels);
    
    if (!s.series.has(labelKey)) {
      s.series.set(labelKey, {
        quantiles: new Map(quantiles.map(q => [q, 0])),
        sum: 0,
        count: 0,
        observations: [],
      });
    }
    
    const series = s.series.get(labelKey)!;
    series.sum += value;
    series.count += 1;
    series.observations.push(value);
    
    // Keep only the most recent observations
    if (series.observations.length > this.maxObservations) {
      series.observations = series.observations.slice(-this.maxObservations);
    }
    
    // Update quantiles
    this.calculateQuantiles(series);
  }

  /**
   * Legacy observe method for backward compatibility
   */
  observe(metric: string, value: number, labels?: Labels, buckets: number[] = [0.05,0.1,0.25,0.5,1,2,5]): void {
    this.histogram(metric, value, labels, buckets);
  }

  /**
   * Enhanced Prometheus metrics rendering
   */
  /**
   * Render all metrics in Prometheus exposition format.
   * @returns Multiline string suitable for /metrics endpoint
   */
  renderPrometheus(): string {
    const lines: string[] = [];
    
    // Add build info
    this.addBuildInfo(lines);
    
    // Add metric definitions and values
    this.addCounterMetrics(lines);
    this.addGaugeMetrics(lines);
    this.addHistogramMetrics(lines);
    this.addSummaryMetrics(lines);
    
    return lines.join('\n') + '\n';
  }

  private addBuildInfo(lines: string[]): void {
    lines.push('# HELP tekup_build_info Build and runtime information');
    lines.push('# TYPE tekup_build_info gauge');
    
    if (this.buildInfo) {
      const attrs = Object.entries(this.buildInfo)
        .map(([k, v]) => `${k}="${this.escapePrometheusValue(v)}"`)
        .join(',');
      lines.push(`tekup_build_info{${attrs}} 1`);
    } else {
      lines.push('tekup_build_info{version="unknown"} 1');
    }
    lines.push('');
  }

  private addCounterMetrics(lines: string[]): void {
    for (const [metricName, valueMap] of Object.entries(this.counters)) {
      const definition = this.metrics.get(metricName);
      
      lines.push(`# HELP ${metricName} ${definition?.help || 'Counter metric'}`);
      lines.push(`# TYPE ${metricName} counter`);
      
      for (const [fullKey, value] of valueMap.entries()) {
        const labelPart = this.extractLabelsFromKey(fullKey, metricName);
        if (labelPart) {
          lines.push(`${metricName}{${labelPart}} ${value}`);
        } else {
          lines.push(`${metricName} ${value}`);
        }
      }
      lines.push('');
    }
  }

  private addGaugeMetrics(lines: string[]): void {
    for (const [metricName, valueMap] of Object.entries(this.gauges)) {
      const definition = this.metrics.get(metricName);
      
      lines.push(`# HELP ${metricName} ${definition?.help || 'Gauge metric'}`);
      lines.push(`# TYPE ${metricName} gauge`);
      
      for (const [fullKey, gaugeValue] of valueMap.entries()) {
        const labelPart = this.extractLabelsFromKey(fullKey, metricName);
        if (labelPart) {
          lines.push(`${metricName}{${labelPart}} ${gaugeValue.value}`);
        } else {
          lines.push(`${metricName} ${gaugeValue.value}`);
        }
      }
      lines.push('');
    }
  }

  private addHistogramMetrics(lines: string[]): void {
    for (const [name, h] of Object.entries(this.histograms)) {
      const definition = this.metrics.get(name);
      
      lines.push(`# HELP ${name} ${definition?.help || 'Histogram metric'}`);
      lines.push(`# TYPE ${name} histogram`);
      
      for (const [labelKey, series] of h.series.entries()) {
        let cumulative = 0;
        const baseLabels = labelKey && labelKey.length ? 
          labelKey.split(',').map(kv => kv.replace(/=/, '="') + '"') : [];
        
        h.buckets.forEach((b, i) => {
          cumulative += series.counts[i];
          const labelStr = [...baseLabels, `le="${b}"`].filter(Boolean).join(',');
          lines.push(`${name}_bucket{${labelStr}} ${cumulative}`);
        });
        
        cumulative += series.counts[series.counts.length - 1];
        const infLabelStr = [...baseLabels, 'le="+Inf"'].filter(Boolean).join(',');
        lines.push(`${name}_bucket{${infLabelStr}} ${cumulative}`);
        
        if (baseLabels.length) {
          lines.push(`${name}_sum{${baseLabels.join(',')}} ${series.sum}`);
          lines.push(`${name}_count{${baseLabels.join(',')}} ${cumulative}`);
        } else {
          lines.push(`${name}_sum ${series.sum}`);
          lines.push(`${name}_count ${cumulative}`);
        }
      }
      lines.push('');
    }
  }

  private addSummaryMetrics(lines: string[]): void {
    for (const [name, s] of Object.entries(this.summaries)) {
      const definition = this.metrics.get(name);
      
      lines.push(`# HELP ${name} ${definition?.help || 'Summary metric'}`);
      lines.push(`# TYPE ${name} summary`);
      
      for (const [labelKey, series] of s.series.entries()) {
        const baseLabels = labelKey && labelKey.length ? 
          labelKey.split(',').map(kv => kv.replace(/=/, '="') + '"') : [];
        
        // Add quantiles
        for (const [quantile, value] of series.quantiles.entries()) {
          const labelStr = [...baseLabels, `quantile="${quantile}"`].filter(Boolean).join(',');
          lines.push(`${name}{${labelStr}} ${value}`);
        }
        
        // Add sum and count
        if (baseLabels.length) {
          lines.push(`${name}_sum{${baseLabels.join(',')}} ${series.sum}`);
          lines.push(`${name}_count{${baseLabels.join(',')}} ${series.count}`);
        } else {
          lines.push(`${name}_sum ${series.sum}`);
          lines.push(`${name}_count ${series.count}`);
        }
      }
      lines.push('');
    }
  }

  private extractLabelsFromKey(fullKey: string, metricName: string): string {
    const labelPart = fullKey.includes(':{') ? fullKey.substring(fullKey.indexOf(':{') + 2) : '';
    if (labelPart) {
      const inner = labelPart.slice(0, -1);
      return inner
        .split(',')
        .map((p) => p.split('='))
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
    }
    return '';
  }

  private escapePrometheusValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
  }

  setBuildInfo(info: Record<string,string>) {
    this.buildInfo = info;
  }
}