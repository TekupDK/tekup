"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = exports.PerformanceMonitorService = void 0;
class PerformanceMonitorService {
    metrics = new Map();
    thresholds = new Map();
    alerts = [];
    eventBus; // Will be injected
    constructor() {
        this.initializeDefaultThresholds();
    }
    /**
     * Record a performance metric
     */
    recordMetric(name, value, unit, tags = {}, metadata) {
        const metric = {
            name,
            value,
            unit,
            timestamp: new Date(),
            tags,
            metadata,
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(metric);
        // Keep only last 1000 metrics per name
        const metrics = this.metrics.get(name);
        if (metrics.length > 1000) {
            this.metrics.set(name, metrics.slice(-1000));
        }
        // Check thresholds and generate alerts
        this.checkThresholds(metric);
        // Publish metric event
        this.publishMetricEvent(metric);
    }
    /**
     * Record response time metric
     */
    recordResponseTime(operation, duration, success, tags = {}) {
        this.recordMetric('response_time', duration, 'milliseconds', {
            operation,
            success: success.toString(),
            ...tags,
        });
        // Record success/failure rate
        this.recordMetric('operation_success_rate', success ? 1 : 0, 'count', { operation, ...tags });
    }
    /**
     * Record throughput metric
     */
    recordThroughput(operation, count, timeWindow, tags = {}) {
        const rate = count / (timeWindow / 1000); // operations per second
        this.recordMetric('throughput', rate, 'ops_per_second', { operation, ...tags });
    }
    /**
     * Record error metric
     */
    recordError(operation, errorType, errorMessage, tags = {}) {
        this.recordMetric('error_count', 1, 'count', {
            operation,
            error_type: errorType,
            error_message: errorMessage,
            ...tags,
        });
    }
    /**
     * Record system resource metrics
     */
    recordSystemMetrics(cpuUsage, memoryUsage, diskUsage, networkLatency, tags = {}) {
        this.recordMetric('cpu_usage', cpuUsage, 'percentage', tags);
        this.recordMetric('memory_usage', memoryUsage, 'percentage', tags);
        this.recordMetric('disk_usage', diskUsage, 'percentage', tags);
        this.recordMetric('network_latency', networkLatency, 'milliseconds', tags);
    }
    /**
     * Get metrics for a specific name and time range
     */
    getMetrics(name, startTime, endTime, aggregation = 'raw') {
        const metrics = this.metrics.get(name) || [];
        const filtered = metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
        if (aggregation === 'raw') {
            return filtered;
        }
        // Simple aggregation
        if (filtered.length === 0)
            return [];
        const values = filtered.map(m => m.value);
        let aggregatedValue;
        switch (aggregation) {
            case 'avg':
                aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
            case 'min':
                aggregatedValue = Math.min(...values);
                break;
            case 'max':
                aggregatedValue = Math.max(...values);
                break;
            case 'sum':
                aggregatedValue = values.reduce((sum, val) => sum + val, 0);
                break;
            default:
                aggregatedValue = values[0];
        }
        return [{
                name,
                value: aggregatedValue,
                unit: filtered[0].unit,
                timestamp: new Date(),
                tags: filtered[0].tags,
                metadata: {
                    aggregation,
                    originalCount: filtered.length,
                    timeRange: { start: startTime, end: endTime },
                },
            }];
    }
    /**
     * Calculate system health score
     */
    calculateSystemHealth() {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        // Get recent metrics
        const responseTimeMetrics = this.getMetrics('response_time', fiveMinutesAgo, now, 'avg');
        const errorRateMetrics = this.getMetrics('error_count', fiveMinutesAgo, now, 'sum');
        const throughputMetrics = this.getMetrics('throughput', fiveMinutesAgo, now, 'avg');
        // Calculate scores
        const avgResponseTime = responseTimeMetrics[0]?.value || 0;
        const totalErrors = errorRateMetrics[0]?.value || 0;
        const avgThroughput = throughputMetrics[0]?.value || 0;
        // Response time score (lower is better)
        let responseTimeScore = 100;
        if (avgResponseTime > 1000)
            responseTimeScore = 0;
        else if (avgResponseTime > 500)
            responseTimeScore = 25;
        else if (avgResponseTime > 200)
            responseTimeScore = 50;
        else if (avgResponseTime > 100)
            responseTimeScore = 75;
        // Error rate score (lower is better)
        let errorRateScore = 100;
        if (totalErrors > 10)
            errorRateScore = 0;
        else if (totalErrors > 5)
            errorRateScore = 25;
        else if (totalErrors > 2)
            errorRateScore = 50;
        else if (totalErrors > 0)
            errorRateScore = 75;
        // Throughput score (higher is better)
        let throughputScore = 100;
        if (avgThroughput < 1)
            throughputScore = 0;
        else if (avgThroughput < 5)
            throughputScore = 25;
        else if (avgThroughput < 10)
            throughputScore = 50;
        else if (avgThroughput < 20)
            throughputScore = 75;
        // Overall score
        const overallScore = Math.round((responseTimeScore + errorRateScore + throughputScore) / 3);
        // Determine status
        let status;
        if (overallScore >= 80)
            status = 'healthy';
        else if (overallScore >= 50)
            status = 'degraded';
        else
            status = 'unhealthy';
        return {
            status,
            score: overallScore,
            metrics: {
                responseTime: avgResponseTime,
                errorRate: totalErrors,
                throughput: avgThroughput,
                availability: 100 - (totalErrors > 0 ? 10 : 0), // Simple availability calculation
            },
            lastUpdated: now,
        };
    }
    /**
     * Set performance threshold
     */
    setThreshold(threshold) {
        this.thresholds.set(threshold.metricName, threshold);
    }
    /**
     * Get all thresholds
     */
    getThresholds() {
        return Array.from(this.thresholds.values());
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => !alert.acknowledged);
    }
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId, acknowledgedBy) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedBy = acknowledgedBy;
            alert.acknowledgedAt = new Date();
        }
    }
    /**
     * Initialize default thresholds
     */
    initializeDefaultThresholds() {
        const defaultThresholds = [
            {
                metricName: 'response_time',
                condition: 'above_threshold',
                threshold: 1000,
                severity: 'medium',
                enabled: true,
                cooldownMinutes: 5,
            },
            {
                metricName: 'response_time',
                condition: 'above_threshold',
                threshold: 2000,
                severity: 'high',
                enabled: true,
                cooldownMinutes: 5,
            },
            {
                metricName: 'error_count',
                condition: 'above_threshold',
                threshold: 5,
                severity: 'high',
                enabled: true,
                cooldownMinutes: 10,
            },
            {
                metricName: 'cpu_usage',
                condition: 'above_threshold',
                threshold: 80,
                severity: 'medium',
                enabled: true,
                cooldownMinutes: 5,
            },
            {
                metricName: 'memory_usage',
                condition: 'above_threshold',
                threshold: 85,
                severity: 'medium',
                enabled: true,
                cooldownMinutes: 5,
            },
        ];
        defaultThresholds.forEach(threshold => {
            this.setThreshold(threshold);
        });
    }
    /**
     * Check thresholds and generate alerts
     */
    checkThresholds(metric) {
        const thresholds = this.getThresholds().filter(t => t.metricName === metric.name && t.enabled);
        thresholds.forEach(threshold => {
            let shouldAlert = false;
            switch (threshold.condition) {
                case 'above_threshold':
                    shouldAlert = metric.value > threshold.threshold;
                    break;
                case 'below_threshold':
                    shouldAlert = metric.value < threshold.threshold;
                    break;
                case 'rate_of_change':
                    // Implement rate of change logic
                    shouldAlert = false;
                    break;
            }
            if (shouldAlert) {
                this.generateAlert(metric, threshold);
            }
        });
    }
    /**
     * Generate performance alert
     */
    generateAlert(metric, threshold) {
        // Check cooldown
        const recentAlerts = this.alerts.filter(alert => alert.metricName === metric.name &&
            alert.severity === threshold.severity &&
            !alert.acknowledged &&
            (Date.now() - alert.timestamp.getTime()) < (threshold.cooldownMinutes * 60 * 1000));
        if (recentAlerts.length > 0) {
            return; // Still in cooldown
        }
        const alert = {
            id: this.generateAlertId(),
            metricName: metric.name,
            condition: threshold.condition,
            threshold: threshold.threshold,
            currentValue: metric.value,
            severity: threshold.severity,
            message: `${metric.name} is ${threshold.condition === 'above_threshold' ? 'above' : 'below'} threshold (${threshold.threshold}${metric.unit}). Current value: ${metric.value}${metric.unit}`,
            timestamp: new Date(),
            acknowledged: false,
        };
        this.alerts.push(alert);
        // Publish alert event
        this.publishAlertEvent(alert);
    }
    /**
     * Generate unique alert ID
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Publish metric event
     */
    publishMetricEvent(metric) {
        if (this.eventBus) {
            this.eventBus.publish({
                type: 'PERFORMANCE_METRIC_RECORDED',
                tenantId: metric.tags.tenantId || 'system',
                source: 'performance-monitor',
                data: metric,
            });
        }
    }
    /**
     * Publish alert event
     */
    publishAlertEvent(alert) {
        if (this.eventBus) {
            this.eventBus.publish({
                type: 'PERFORMANCE_ALERT_GENERATED',
                tenantId: 'system',
                source: 'performance-monitor',
                data: alert,
            });
        }
    }
    /**
     * Set event bus for publishing events
     */
    setEventBus(eventBus) {
        this.eventBus = eventBus;
    }
    /**
     * Get performance summary
     */
    getPerformanceSummary(timeWindowMinutes = 60) {
        const now = new Date();
        const startTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);
        const summary = {};
        // Calculate summary for each metric
        this.metrics.forEach((metrics, name) => {
            const recentMetrics = metrics.filter(m => m.timestamp >= startTime);
            if (recentMetrics.length === 0)
                return;
            const values = recentMetrics.map(m => m.value);
            summary[name] = {
                avg: values.reduce((sum, val) => sum + val, 0) / values.length,
                min: Math.min(...values),
                max: Math.max(...values),
                count: values.length,
            };
        });
        return {
            metrics: summary,
            health: this.calculateSystemHealth(),
            alerts: this.getActiveAlerts(),
        };
    }
}
exports.PerformanceMonitorService = PerformanceMonitorService;
// Export singleton instance
exports.performanceMonitor = new PerformanceMonitorService();
//# sourceMappingURL=performance-monitor.service.js.map