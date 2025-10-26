import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RateLimitingService, RateLimitConfig } from './rate-limiting.service.js';
import { StructuredLogger } from '../logging/structured-logger.service.js';
import { AsyncContextService } from '../logging/async-context.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';

export interface UsagePattern {
  identifier: string;
  endpoint: string;
  avgRequestsPerWindow: number;
  peakRequestsPerWindow: number;
  avgResponseTime: number;
  errorRate: number;
  timeOfDayDistribution: Record<number, number>; // hour -> request count
  dayOfWeekDistribution: Record<number, number>; // 0-6 -> request count
  lastUpdated: Date;
  sampleCount: number;
}

export interface AnomalyDetection {
  identifier: string;
  endpoint: string;
  anomalyType: 'traffic_spike' | 'error_burst' | 'suspicious_pattern' | 'ddos_attempt';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  currentRate: number;
  expectedRate: number;
  confidence: number; // 0-1
  metadata: Record<string, any>;
}

export interface AdaptiveRateLimit {
  identifier: string;
  endpoint: string;
  originalLimit: number;
  adaptedLimit: number;
  reason: string;
  adaptedAt: Date;
  expiresAt: Date;
  confidence: number;
}

interface TrafficWindow {
  timestamp: number;
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  userAgent?: string;
  sourceIp?: string;
}

@Injectable()
export class AdaptiveRateLimitingService {
  private readonly logger = new Logger(AdaptiveRateLimitingService.name);
  private readonly redis: Redis;
  private readonly usagePatterns = new Map<string, UsagePattern>();
  private readonly activeAnomalies = new Map<string, AnomalyDetection>();
  private readonly adaptiveLimits = new Map<string, AdaptiveRateLimit>();
  
  // Configuration for anomaly detection
  private readonly config = {
    analysisWindowMs: 300000,      // 5 minutes
    patternLearningDays: 7,        // Learn patterns over 7 days
    trafficSpikeThreshold: 3.0,    // 3x normal traffic
    errorBurstThreshold: 0.3,      // 30% error rate
    suspiciousPatternThreshold: 5.0, // 5x normal traffic
    ddosAttemptThreshold: 10.0,    // 10x normal traffic
    minSamplesForPattern: 100,     // Minimum samples to establish pattern
    adaptationDurationMs: 1800000, // 30 minutes adaptation
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimitingService: RateLimitingService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_ADAPTIVE_LIMIT_DB', 3),
      keyPrefix: 'adaptive_limit:',
    });

    // Start background analysis
    this.startBackgroundAnalysis();
  }

  /**
   * Record request for pattern analysis
   */
  async recordRequest(
    identifier: string,
    endpoint: string,
    responseTime: number,
    isError: boolean = false,
    userAgent?: string,
    sourceIp?: string
  ): Promise<void> {
    const now = Date.now();
    const windowKey = this.getWindowKey(identifier, endpoint, now);

    try {
      // Store traffic data in Redis with expiration
      const trafficWindow: TrafficWindow = {
        timestamp: now,
        requestCount: 1,
        errorCount: isError ? 1 : 0,
        responseTimeSum: responseTime,
        userAgent,
        sourceIp,
      };

      await this.redis.setex(
        windowKey,
        3600, // 1 hour expiration
        JSON.stringify(trafficWindow)
      );

      // Update real-time analysis
      await this.updateRealtimeAnalysis(identifier, endpoint, trafficWindow);

    } catch (error) {
      this.logger.error(`Failed to record request for ${identifier}:${endpoint}:`, error);
    }
  }

  /**
   * Get adaptive rate limit for a request
   */
  async getAdaptiveRateLimit(
    identifier: string,
    endpoint: string,
    baseConfig: RateLimitConfig
  ): Promise<RateLimitConfig> {
    const key = `${identifier}:${endpoint}`;
    const adaptiveLimit = this.adaptiveLimits.get(key);

    if (adaptiveLimit && adaptiveLimit.expiresAt > new Date()) {
      // Return adapted configuration
      return {
        ...baseConfig,
        maxRequests: adaptiveLimit.adaptedLimit,
      };
    }

    // Check for active anomalies
    const anomaly = this.activeAnomalies.get(key);
    if (anomaly) {
      const adaptedConfig = await this.adaptConfigForAnomaly(baseConfig, anomaly);
      if (adaptedConfig) {
        return adaptedConfig;
      }
    }

    // Return base configuration
    return baseConfig;
  }

  /**
   * Analyze usage patterns and detect anomalies
   */
  private async analyzeTrafficPatterns(): Promise<void> {
    try {
      const keys = await this.redis.keys('*');
      const patterns = new Map<string, TrafficWindow[]>();

      // Collect traffic data
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          try {
            const window: TrafficWindow = JSON.parse(data);
            const [, identifier, endpoint] = key.split(':');
            const patternKey = `${identifier}:${endpoint}`;
            
            if (!patterns.has(patternKey)) {
              patterns.set(patternKey, []);
            }
            patterns.get(patternKey)!.push(window);
          } catch (parseError) {
            // Skip invalid data
          }
        }
      }

      // Analyze each pattern
      for (const [patternKey, windows] of patterns) {
        await this.analyzePatternAndDetectAnomalies(patternKey, windows);
      }

    } catch (error) {
      this.logger.error('Failed to analyze traffic patterns:', error);
    }
  }

  private async analyzePatternAndDetectAnomalies(
    patternKey: string,
    windows: TrafficWindow[]
  ): Promise<void> {
    if (windows.length === 0) return;

    const [identifier, endpoint] = patternKey.split(':');
    
    // Calculate current metrics
    const now = Date.now();
    const recentWindows = windows.filter(w => 
      now - w.timestamp < this.config.analysisWindowMs
    );

    if (recentWindows.length === 0) return;

    const currentRate = recentWindows.reduce((sum, w) => sum + w.requestCount, 0);
    const currentErrorRate = recentWindows.reduce((sum, w) => sum + w.errorCount, 0) / 
                             recentWindows.reduce((sum, w) => sum + w.requestCount, 0);

    // Get or create usage pattern
    let pattern = this.usagePatterns.get(patternKey);
    if (!pattern) {
      pattern = this.initializeUsagePattern(identifier, endpoint);
      this.usagePatterns.set(patternKey, pattern);
    }

    // Update pattern with new data
    this.updateUsagePattern(pattern, recentWindows);

    // Detect anomalies
    const anomalies = await this.detectAnomalies(pattern, currentRate, currentErrorRate);
    
    for (const anomaly of anomalies) {
      await this.handleDetectedAnomaly(anomaly);
    }

    // Record metrics
    this.metricsService.gauge('adaptive_rate_limit_current_rate', currentRate, {
      identifier,
      endpoint,
    });
    
    this.metricsService.gauge('adaptive_rate_limit_expected_rate', pattern.avgRequestsPerWindow, {
      identifier,
      endpoint,
    });
  }

  private initializeUsagePattern(identifier: string, endpoint: string): UsagePattern {
    return {
      identifier,
      endpoint,
      avgRequestsPerWindow: 0,
      peakRequestsPerWindow: 0,
      avgResponseTime: 0,
      errorRate: 0,
      timeOfDayDistribution: {},
      dayOfWeekDistribution: {},
      lastUpdated: new Date(),
      sampleCount: 0,
    };
  }

  private updateUsagePattern(pattern: UsagePattern, windows: TrafficWindow[]): void {
    const totalRequests = windows.reduce((sum, w) => sum + w.requestCount, 0);
    const totalErrors = windows.reduce((sum, w) => sum + w.errorCount, 0);
    const totalResponseTime = windows.reduce((sum, w) => sum + w.responseTimeSum, 0);

    // Update moving averages
    pattern.sampleCount += windows.length;
    const alpha = 0.1; // Exponential smoothing factor

    pattern.avgRequestsPerWindow = pattern.avgRequestsPerWindow * (1 - alpha) + 
                                  (totalRequests / windows.length) * alpha;
    
    pattern.peakRequestsPerWindow = Math.max(
      pattern.peakRequestsPerWindow,
      Math.max(...windows.map(w => w.requestCount))
    );

    pattern.avgResponseTime = pattern.avgResponseTime * (1 - alpha) + 
                             (totalResponseTime / totalRequests) * alpha;

    pattern.errorRate = pattern.errorRate * (1 - alpha) + 
                       (totalErrors / totalRequests) * alpha;

    // Update time distributions
    for (const window of windows) {
      const date = new Date(window.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();

      pattern.timeOfDayDistribution[hour] = 
        (pattern.timeOfDayDistribution[hour] || 0) + window.requestCount;
      
      pattern.dayOfWeekDistribution[dayOfWeek] = 
        (pattern.dayOfWeekDistribution[dayOfWeek] || 0) + window.requestCount;
    }

    pattern.lastUpdated = new Date();
  }

  private async detectAnomalies(
    pattern: UsagePattern,
    currentRate: number,
    currentErrorRate: number
  ): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    // Skip detection if not enough historical data
    if (pattern.sampleCount < this.config.minSamplesForPattern) {
      return anomalies;
    }

    const expectedRate = pattern.avgRequestsPerWindow;
    const rateRatio = expectedRate > 0 ? currentRate / expectedRate : 0;

    // Traffic spike detection
    if (rateRatio > this.config.trafficSpikeThreshold) {
      anomalies.push({
        identifier: pattern.identifier,
        endpoint: pattern.endpoint,
        anomalyType: 'traffic_spike',
        severity: this.calculateSeverity(rateRatio, this.config.trafficSpikeThreshold),
        detectedAt: new Date(),
        currentRate,
        expectedRate,
        confidence: Math.min(0.95, (rateRatio - this.config.trafficSpikeThreshold) / 5),
        metadata: { rateRatio, threshold: this.config.trafficSpikeThreshold },
      });
    }

    // Error burst detection
    if (currentErrorRate > this.config.errorBurstThreshold) {
      anomalies.push({
        identifier: pattern.identifier,
        endpoint: pattern.endpoint,
        anomalyType: 'error_burst',
        severity: this.calculateSeverity(currentErrorRate, this.config.errorBurstThreshold),
        detectedAt: new Date(),
        currentRate,
        expectedRate,
        confidence: Math.min(0.95, currentErrorRate / this.config.errorBurstThreshold),
        metadata: { errorRate: currentErrorRate, threshold: this.config.errorBurstThreshold },
      });
    }

    // DDoS attempt detection
    if (rateRatio > this.config.ddosAttemptThreshold) {
      anomalies.push({
        identifier: pattern.identifier,
        endpoint: pattern.endpoint,
        anomalyType: 'ddos_attempt',
        severity: 'critical',
        detectedAt: new Date(),
        currentRate,
        expectedRate,
        confidence: Math.min(0.99, (rateRatio - this.config.ddosAttemptThreshold) / 10),
        metadata: { rateRatio, threshold: this.config.ddosAttemptThreshold },
      });
    }

    return anomalies;
  }

  private calculateSeverity(actual: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = actual / threshold;
    if (ratio < 2) return 'low';
    if (ratio < 5) return 'medium';
    if (ratio < 10) return 'high';
    return 'critical';
  }

  private async handleDetectedAnomaly(anomaly: AnomalyDetection): Promise<void> {
    const key = `${anomaly.identifier}:${anomaly.endpoint}`;
    
    // Store anomaly
    this.activeAnomalies.set(key, anomaly);

    // Log anomaly
    this.structuredLogger.warn(
      `Adaptive rate limiting anomaly detected: ${anomaly.anomalyType}`,
      {
        ...this.contextService.toLogContext(),
        metadata: {
          identifier: anomaly.identifier,
          endpoint: anomaly.endpoint,
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          currentRate: anomaly.currentRate,
          expectedRate: anomaly.expectedRate,
          metadata: anomaly.metadata,
        },
      }
    );

    // Record metrics
    this.metricsService.increment('adaptive_rate_limit_anomalies_total', {
      identifier: anomaly.identifier,
      endpoint: anomaly.endpoint,
      type: anomaly.anomalyType,
      severity: anomaly.severity,
    });

    // Apply adaptive limits based on anomaly
    await this.applyAdaptiveLimit(anomaly);

    // Clean up old anomalies (expire after 30 minutes)
    setTimeout(() => {
      this.activeAnomalies.delete(key);
    }, 1800000);
  }

  private async applyAdaptiveLimit(anomaly: AnomalyDetection): Promise<void> {
    const key = `${anomaly.identifier}:${anomaly.endpoint}`;
    
    let adaptationFactor = 1.0;
    let reason = '';

    switch (anomaly.anomalyType) {
      case 'traffic_spike':
        adaptationFactor = 0.5; // Reduce limit by 50%
        reason = 'Traffic spike detected';
        break;
      case 'error_burst':
        adaptationFactor = 0.3; // Reduce limit by 70%
        reason = 'Error burst detected';
        break;
      case 'ddos_attempt':
        adaptationFactor = 0.1; // Reduce limit by 90%
        reason = 'Potential DDoS attempt';
        break;
      case 'suspicious_pattern':
        adaptationFactor = 0.7; // Reduce limit by 30%
        reason = 'Suspicious usage pattern';
        break;
    }

    const adaptiveLimit: AdaptiveRateLimit = {
      identifier: anomaly.identifier,
      endpoint: anomaly.endpoint,
      originalLimit: anomaly.expectedRate,
      adaptedLimit: Math.ceil(anomaly.expectedRate * adaptationFactor),
      reason,
      adaptedAt: new Date(),
      expiresAt: new Date(Date.now() + this.config.adaptationDurationMs),
      confidence: anomaly.confidence,
    };

    this.adaptiveLimits.set(key, adaptiveLimit);

    this.structuredLogger.log(
      `Applied adaptive rate limit: ${adaptiveLimit.originalLimit} -> ${adaptiveLimit.adaptedLimit}`,
      {
        ...this.contextService.toLogContext(),
        metadata: adaptiveLimit,
      }
    );
  }

  private async adaptConfigForAnomaly(
    baseConfig: RateLimitConfig,
    anomaly: AnomalyDetection
  ): Promise<RateLimitConfig | null> {
    let adaptationFactor = 1.0;

    switch (anomaly.severity) {
      case 'low':
        adaptationFactor = 0.8;
        break;
      case 'medium':
        adaptationFactor = 0.5;
        break;
      case 'high':
        adaptationFactor = 0.3;
        break;
      case 'critical':
        adaptationFactor = 0.1;
        break;
    }

    return {
      ...baseConfig,
      maxRequests: Math.ceil(baseConfig.maxRequests * adaptationFactor),
    };
  }

  private async updateRealtimeAnalysis(
    identifier: string,
    endpoint: string,
    window: TrafficWindow
  ): Promise<void> {
    // This would implement real-time analysis for immediate threat detection
    // For now, we'll just record the data
  }

  private getWindowKey(identifier: string, endpoint: string, timestamp: number): string {
    const windowStart = Math.floor(timestamp / 60000) * 60000; // 1-minute windows
    return `${identifier}:${endpoint}:${windowStart}`;
  }

  private startBackgroundAnalysis(): void {
    // Run analysis every 5 minutes
    setInterval(() => {
      this.analyzeTrafficPatterns().catch(error => {
        this.logger.error('Background traffic analysis failed:', error);
      });
    }, this.config.analysisWindowMs);
  }

  /**
   * Get current adaptive limits for monitoring
   */
  getActiveAdaptiveLimits(): AdaptiveRateLimit[] {
    return Array.from(this.adaptiveLimits.values());
  }

  /**
   * Get current anomalies for monitoring
   */
  getActiveAnomalies(): AnomalyDetection[] {
    return Array.from(this.activeAnomalies.values());
  }

  /**
   * Reset adaptive limits for an identifier/endpoint
   */
  resetAdaptiveLimit(identifier: string, endpoint: string): boolean {
    const key = `${identifier}:${endpoint}`;
    return this.adaptiveLimits.delete(key);
  }
}