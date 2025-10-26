export interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
    metadata?: Record<string, any>;
}
export interface PerformanceAlert {
    id: string;
    metricName: string;
    condition: 'above_threshold' | 'below_threshold' | 'rate_of_change';
    threshold: number;
    currentValue: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}
export interface PerformanceThreshold {
    metricName: string;
    condition: 'above_threshold' | 'below_threshold' | 'rate_of_change';
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    cooldownMinutes: number;
}
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    score: number;
    metrics: {
        responseTime: number;
        errorRate: number;
        throughput: number;
        availability: number;
    };
    lastUpdated: Date;
}
export declare class PerformanceMonitorService {
    private metrics;
    private thresholds;
    private alerts;
    private eventBus;
    constructor();
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>, metadata?: Record<string, any>): void;
    /**
     * Record response time metric
     */
    recordResponseTime(operation: string, duration: number, success: boolean, tags?: Record<string, string>): void;
    /**
     * Record throughput metric
     */
    recordThroughput(operation: string, count: number, timeWindow: number, tags?: Record<string, string>): void;
    /**
     * Record error metric
     */
    recordError(operation: string, errorType: string, errorMessage: string, tags?: Record<string, string>): void;
    /**
     * Record system resource metrics
     */
    recordSystemMetrics(cpuUsage: number, memoryUsage: number, diskUsage: number, networkLatency: number, tags?: Record<string, string>): void;
    /**
     * Get metrics for a specific name and time range
     */
    getMetrics(name: string, startTime: Date, endTime: Date, aggregation?: 'raw' | 'avg' | 'min' | 'max' | 'sum'): PerformanceMetric[];
    /**
     * Calculate system health score
     */
    calculateSystemHealth(): SystemHealth;
    /**
     * Set performance threshold
     */
    setThreshold(threshold: PerformanceThreshold): void;
    /**
     * Get all thresholds
     */
    getThresholds(): PerformanceThreshold[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): PerformanceAlert[];
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId: string, acknowledgedBy: string): void;
    /**
     * Initialize default thresholds
     */
    private initializeDefaultThresholds;
    /**
     * Check thresholds and generate alerts
     */
    private checkThresholds;
    /**
     * Generate performance alert
     */
    private generateAlert;
    /**
     * Generate unique alert ID
     */
    private generateAlertId;
    /**
     * Publish metric event
     */
    private publishMetricEvent;
    /**
     * Publish alert event
     */
    private publishAlertEvent;
    /**
     * Set event bus for publishing events
     */
    setEventBus(eventBus: any): void;
    /**
     * Get performance summary
     */
    getPerformanceSummary(timeWindowMinutes?: number): {
        metrics: Record<string, {
            avg: number;
            min: number;
            max: number;
            count: number;
        }>;
        health: SystemHealth;
        alerts: PerformanceAlert[];
    };
}
export declare const performanceMonitor: PerformanceMonitorService;
//# sourceMappingURL=performance-monitor.service.d.ts.map