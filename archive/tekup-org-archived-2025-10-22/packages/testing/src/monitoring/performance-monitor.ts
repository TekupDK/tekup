import { EventEmitter } from 'events';
import { faker } from '@faker-js/faker';

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  component: string;
  metric: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  metadata?: any;
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  metric: string;
  threshold: number;
  currentValue: number;
  status: 'active' | 'resolved';
  resolvedAt?: Date;
}

export interface PerformanceBaseline {
  component: string;
  metric: string;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
  stdDev: number;
  lastUpdated: Date;
  sampleCount: number;
}

export interface PerformanceReport {
  id: string;
  startTime: Date;
  endTime: Date;
  summary: {
    totalMetrics: number;
    alerts: number;
    criticalAlerts: number;
    performanceScore: number; // 0-100
  };
  components: Array<{
    name: string;
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    score: number;
  }>;
  trends: Array<{
    metric: string;
    trend: 'improving' | 'stable' | 'degrading';
    changePercent: number;
  }>;
  recommendations: string[];
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private baselines: Map<string, PerformanceBaseline> = new Map();
  private thresholds: Map<string, { warning: number; error: number; critical: number }> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeDefaultThresholds();
    this.initializeDefaultBaselines();
  }

  // Start performance monitoring
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      logger.info('⚠️ Performance monitoring is already running');
      return;
    }

    logger.info('🚀 Starting performance monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.updateBaselines();
    }, intervalMs);

    this.emit('monitoring:started', { timestamp: new Date() });
  }

  // Stop performance monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      logger.info('⚠️ Performance monitoring is not running');
      return;
    }

    logger.info('🛑 Stopping performance monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.emit('monitoring:stopped', { timestamp: new Date() });
  }

  // Collect performance metrics
  private collectMetrics(): void {
    const components = ['voice-agent', 'mobile-agent', 'mcp-server', 'database', 'api-gateway'];
    const metrics = ['response_time', 'throughput', 'error_rate', 'memory_usage', 'cpu_usage'];

    components.forEach(component => {
      metrics.forEach(metric => {
        const value = this.generateMetricValue(component, metric);
        const metricData: PerformanceMetric = {
          id: faker.string.uuid(),
          timestamp: new Date(),
          component,
          metric,
          value,
          unit: this.getMetricUnit(metric),
          tags: {
            environment: 'production',
            version: '1.0.0',
          },
          metadata: {
            source: 'performance-monitor',
            collectionMethod: 'automated',
          },
        };

        this.metrics.push(metricData);
        this.emit('metric:collected', metricData);
      });
    });

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  // Check performance thresholds and generate alerts
  private checkThresholds(): void {
    this.metrics.slice(-50).forEach(metric => {
      const key = `${metric.component}:${metric.metric}`;
      const threshold = this.thresholds.get(key);

      if (threshold) {
        let severity: 'warning' | 'error' | 'critical' | null = null;

        if (metric.value >= threshold.critical) {
          severity = 'critical';
        } else if (metric.value >= threshold.error) {
          severity = 'error';
        } else if (metric.value >= threshold.warning) {
          severity = 'warning';
        }

        if (severity) {
          this.createAlert(metric, severity, threshold[severity]);
        }
      }
    });
  }

  // Update performance baselines
  private updateBaselines(): void {
    const componentMetrics = new Map<string, Map<string, number[]>>();

    // Group metrics by component and metric type
    this.metrics.forEach(metric => {
      if (!componentMetrics.has(metric.component)) {
        componentMetrics.set(metric.component, new Map());
      }
      
      const componentMap = componentMetrics.get(metric.component)!;
      if (!componentMap.has(metric.metric)) {
        componentMap.set(metric.metric, []);
      }
      
      componentMap.get(metric.metric)!.push(metric.value);
    });

    // Update baselines for each component and metric
    componentMetrics.forEach((metrics, component) => {
      metrics.forEach((values, metric) => {
        const key = `${component}:${metric}`;
        const baseline = this.calculateBaseline(values);
        
        this.baselines.set(key, {
          ...baseline,
          component,
          metric,
          lastUpdated: new Date(),
          sampleCount: values.length,
        });
      });
    });
  }

  // Create performance alert
  private createAlert(metric: PerformanceMetric, severity: 'warning' | 'error' | 'critical', threshold: number): void {
    const existingAlert = this.alerts.find(
      alert => alert.component === metric.component && 
               alert.metric === metric.metric && 
               alert.status === 'active'
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.currentValue = metric.value;
      existingAlert.timestamp = new Date();
      this.emit('alert:updated', existingAlert);
    } else {
      // Create new alert
      const alert: PerformanceAlert = {
        id: faker.string.uuid(),
        timestamp: new Date(),
        severity,
        component: metric.component,
        message: `${metric.metric} exceeded ${severity} threshold (${threshold}${metric.unit})`,
        metric: metric.metric,
        threshold,
        currentValue: metric.value,
        status: 'active',
      };

      this.alerts.push(alert);
      this.emit('alert:created', alert);
      
      // Log critical alerts immediately
      if (severity === 'critical') {
        logger.error(`🚨 CRITICAL ALERT: ${alert.message} - Current: ${metric.value}${metric.unit}`);
      }
    }
  }

  // Resolve performance alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      this.emit('alert:resolved', alert);
    }
  }

  // Generate performance report
  generateReport(startTime: Date, endTime: Date): PerformanceReport {
    const filteredMetrics = this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    const filteredAlerts = this.alerts.filter(
      a => a.timestamp >= startTime && a.timestamp <= endTime
    );

    const components = this.getUniqueComponents(filteredMetrics);
    const componentReports = components.map(component => {
      const componentMetrics = filteredMetrics.filter(m => m.component === component);
      const componentAlerts = filteredAlerts.filter(a => a.component === component);
      const score = this.calculateComponentScore(componentMetrics, componentAlerts);

      return {
        name: component,
        metrics: componentMetrics,
        alerts: componentAlerts,
        score,
      };
    });

    const trends = this.calculateTrends(filteredMetrics);
    const recommendations = this.generateRecommendations(componentReports, trends);

    const report: PerformanceReport = {
      id: faker.string.uuid(),
      startTime,
      endTime,
      summary: {
        totalMetrics: filteredMetrics.length,
        alerts: filteredAlerts.length,
        criticalAlerts: filteredAlerts.filter(a => a.severity === 'critical').length,
        performanceScore: this.calculateOverallScore(componentReports),
      },
      components: componentReports,
      trends,
      recommendations,
    };

    this.emit('report:generated', report);
    return report;
  }

  // Get real-time performance dashboard data
  getDashboardData(): {
    currentMetrics: PerformanceMetric[];
    activeAlerts: PerformanceAlert[];
    systemHealth: number;
    topIssues: string[];
  } {
    const currentMetrics = this.metrics.slice(-20); // Last 20 metrics
    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    
    const systemHealth = this.calculateSystemHealth();
    const topIssues = this.identifyTopIssues();

    return {
      currentMetrics,
      activeAlerts,
      systemHealth,
      topIssues,
    };
  }

  // Helper methods
  private generateMetricValue(component: string, metric: string): number {
    const baseValues: Record<string, Record<string, { min: number; max: number }>> = {
      'voice-agent': {
        'response_time': { min: 100, max: 500 },
        'throughput': { min: 50, max: 200 },
        'error_rate': { min: 0, max: 5 },
        'memory_usage': { min: 128, max: 512 },
        'cpu_usage': { min: 10, max: 60 },
      },
      'mobile-agent': {
        'response_time': { min: 150, max: 800 },
        'throughput': { min: 30, max: 100 },
        'error_rate': { min: 0, max: 8 },
        'memory_usage': { min: 256, max: 1024 },
        'cpu_usage': { min: 15, max: 70 },
      },
      'mcp-server': {
        'response_time': { min: 50, max: 300 },
        'throughput': { min: 100, max: 500 },
        'error_rate': { min: 0, max: 3 },
        'memory_usage': { min: 512, max: 2048 },
        'cpu_usage': { min: 20, max: 80 },
      },
      'database': {
        'response_time': { min: 10, max: 100 },
        'throughput': { min: 200, max: 1000 },
        'error_rate': { min: 0, max: 2 },
        'memory_usage': { min: 1024, max: 4096 },
        'cpu_usage': { min: 25, max: 85 },
      },
      'api-gateway': {
        'response_time': { min: 20, max: 150 },
        'throughput': { min: 150, max: 800 },
        'error_rate': { min: 0, max: 4 },
        'memory_usage': { min: 256, max: 1024 },
        'cpu_usage': { min: 15, max: 65 },
      },
    };

    const config = baseValues[component]?.[metric];
    if (config) {
      return faker.number.float({ min: config.min, max: config.max, precision: 0.1 });
    }

    return faker.number.float({ min: 0, max: 100, precision: 0.1 });
  }

  private getMetricUnit(metric: string): string {
    const units: Record<string, string> = {
      'response_time': 'ms',
      'throughput': 'req/s',
      'error_rate': '%',
      'memory_usage': 'MB',
      'cpu_usage': '%',
    };
    return units[metric] || 'units';
  }

  private calculateBaseline(values: number[]): Omit<PerformanceBaseline, 'component' | 'metric' | 'lastUpdated' | 'sampleCount'> {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    return {
      p50: sorted[Math.floor(n * 0.5)] || 0,
      p90: sorted[Math.floor(n * 0.9)] || 0,
      p95: sorted[Math.floor(n * 0.95)] || 0,
      p99: sorted[Math.floor(n * 0.99)] || 0,
      mean: values.reduce((sum, val) => sum + val, 0) / n,
      stdDev: this.calculateStandardDeviation(values),
    };
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private getUniqueComponents(metrics: PerformanceMetric[]): string[] {
    return [...new Set(metrics.map(m => m.component))];
  }

  private calculateComponentScore(metrics: PerformanceMetric[], alerts: PerformanceAlert[]): number {
    if (metrics.length === 0) return 100;

    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const errorAlerts = alerts.filter(a => a.severity === 'error').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;

    let score = 100;
    score -= criticalAlerts * 20;
    score -= errorAlerts * 10;
    score -= warningAlerts * 5;

    return Math.max(0, score);
  }

  private calculateOverallScore(componentReports: Array<{ score: number }>): number {
    if (componentReports.length === 0) return 100;
    
    const totalScore = componentReports.reduce((sum, comp) => sum + comp.score, 0);
    return Math.round(totalScore / componentReports.length);
  }

  private calculateTrends(metrics: PerformanceMetric[]): Array<{ metric: string; trend: 'improving' | 'stable' | 'degrading'; changePercent: number }> {
    const trends: Array<{ metric: string; trend: 'improving' | 'stable' | 'degrading'; changePercent: number }> = [];
    const metricGroups = new Map<string, PerformanceMetric[]>();

    // Group metrics by metric type
    metrics.forEach(metric => {
      if (!metricGroups.has(metric.metric)) {
        metricGroups.set(metric.metric, []);
      }
      metricGroups.get(metric.metric)!.push(metric);
    });

    // Calculate trends for each metric
    metricGroups.forEach((metricList, metricName) => {
      if (metricList.length < 2) return;

      const sorted = metricList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
      const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length;

      const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      let trend: 'improving' | 'stable' | 'degrading';
      if (changePercent < -5) trend = 'improving';
      else if (changePercent > 5) trend = 'degrading';
      else trend = 'stable';

      trends.push({ metric: metricName, trend, changePercent: Math.round(changePercent * 100) / 100 });
    });

    return trends;
  }

  private generateRecommendations(componentReports: Array<{ name: string; score: number; alerts: PerformanceAlert[] }>, trends: Array<{ metric: string; trend: string }>): string[] {
    const recommendations: string[] = [];

    // Component-specific recommendations
    componentReports.forEach(component => {
      if (component.score < 70) {
        recommendations.push(`Investigate performance issues in ${component.name} component`);
      }
      
      const criticalAlerts = component.alerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0) {
        recommendations.push(`Address ${criticalAlerts.length} critical alerts in ${component.name}`);
      }
    });

    // Trend-based recommendations
    trends.forEach(trend => {
      if (trend.trend === 'degrading') {
        recommendations.push(`Monitor ${trend.metric} for continued degradation`);
      }
    });

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
      recommendations.push('Continue monitoring for any changes');
    }

    return recommendations;
  }

  private calculateSystemHealth(): number {
    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    const errorAlerts = activeAlerts.filter(a => a.severity === 'error').length;
    const warningAlerts = activeAlerts.filter(a => a.severity === 'warning').length;

    let health = 100;
    health -= criticalAlerts * 25;
    health -= errorAlerts * 15;
    health -= warningAlerts * 5;

    return Math.max(0, health);
  }

  private identifyTopIssues(): string[] {
    const activeAlerts = this.alerts.filter(a => a.status === 'active');
    const issues = new Map<string, number>();

    activeAlerts.forEach(alert => {
      const key = `${alert.component}:${alert.metric}`;
      const current = issues.get(key) || 0;
      const severityWeight = { critical: 3, error: 2, warning: 1 }[alert.severity];
      issues.set(key, current + severityWeight);
    });

    return Array.from(issues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key]) => key);
  }

  private initializeDefaultThresholds(): void {
    const defaultThresholds = {
      'voice-agent:response_time': { warning: 300, error: 500, critical: 1000 },
      'voice-agent:error_rate': { warning: 2, error: 5, critical: 10 },
      'mobile-agent:response_time': { warning: 500, error: 800, critical: 1500 },
      'mobile-agent:error_rate': { warning: 3, error: 8, critical: 15 },
      'mcp-server:response_time': { warning: 200, error: 300, critical: 600 },
      'mcp-server:error_rate': { warning: 1, error: 3, critical: 8 },
      'database:response_time': { warning: 50, error: 100, critical: 200 },
      'database:error_rate': { warning: 0.5, error: 2, critical: 5 },
      'api-gateway:response_time': { warning: 100, error: 150, critical: 300 },
      'api-gateway:error_rate': { warning: 2, error: 4, critical: 10 },
    };

    Object.entries(defaultThresholds).forEach(([key, thresholds]) => {
      this.thresholds.set(key, thresholds);
    });
  }

  private initializeDefaultBaselines(): void {
    // Initialize with default baseline values
    const components = ['voice-agent', 'mobile-agent', 'mcp-server', 'database', 'api-gateway'];
    const metrics = ['response_time', 'throughput', 'error_rate', 'memory_usage', 'cpu_usage'];

    components.forEach(component => {
      metrics.forEach(metric => {
        const key = `${component}:${metric}`;
        this.baselines.set(key, {
          component,
          metric,
          p50: 0,
          p90: 0,
          p95: 0,
          p99: 0,
          mean: 0,
          stdDev: 0,
          lastUpdated: new Date(),
          sampleCount: 0,
        });
      });
    });
  }

  // Public methods for external access
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  getBaselines(): Map<string, PerformanceBaseline> {
    return new Map(this.baselines);
  }

  getThresholds(): Map<string, { warning: number; error: number; critical: number }> {
    return new Map(this.thresholds);
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  // Clear monitoring data
  clearData(): void {
    this.metrics = [];
    this.alerts = [];
    this.baselines.clear();
    this.emit('data:cleared', { timestamp: new Date() });
  }
}

// Factory function for creating performance monitors
export function createPerformanceMonitor(): PerformanceMonitor {
import { createLogger } from '@tekup/shared';
const logger = createLogger('packages-testing-src-monitorin');

  return new PerformanceMonitor();
}