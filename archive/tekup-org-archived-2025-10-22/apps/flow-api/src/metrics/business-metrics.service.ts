import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MetricsService } from './metrics.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';

export interface BusinessMetrics {
  tenantId: string;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  apiCallsToday: number;
  errorRate: number;
  lastActivity: Date;
  activityScore: number;
}

export interface PerformanceMetrics {
  avgDatabaseQueryTime: number;
  slowQueryCount: number;
  cacheHitRate: number;
  totalRequests: number;
  errorRequests: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

@Injectable()
export class BusinessMetricsService {
  private readonly logger = new Logger(BusinessMetricsService.name);
  private readonly responseTimes: number[] = [];
  private readonly maxResponseTimesSamples = 1000;

  constructor(
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService
  ) {}

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    responseTime: number,
    tenantId?: string
  ): void {
    // Record basic HTTP metrics
    this.metricsService.increment('http_requests_total', {
      method,
      endpoint: this.normalizeEndpoint(endpoint),
      status_code: statusCode.toString(),
      tenant: tenantId || 'unknown',
    });

    this.metricsService.histogram('http_request_duration_seconds', responseTime / 1000, {
      method,
      endpoint: this.normalizeEndpoint(endpoint),
      status_code: statusCode.toString(),
      tenant: tenantId || 'unknown',
    });

    // Track response times for percentile calculations
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.maxResponseTimesSamples) {
      this.responseTimes.shift();
    }

    // Record error metrics
    if (statusCode >= 400) {
      this.metricsService.increment('http_errors_total', {
        method,
        endpoint: this.normalizeEndpoint(endpoint),
        status_code: statusCode.toString(),
        tenant: tenantId || 'unknown',
      });
    }
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    tenantId?: string,
    rowCount?: number
  ): void {
    this.metricsService.increment('database_queries_total', {
      operation,
      table,
      tenant: tenantId || 'unknown',
    });

    this.metricsService.histogram('database_query_duration_seconds', duration / 1000, {
      operation,
      table,
      tenant: tenantId || 'unknown',
    });

    if (rowCount !== undefined) {
      this.metricsService.histogram('database_query_rows', rowCount, {
        operation,
        table,
        tenant: tenantId || 'unknown',
      });
    }

    // Record slow queries
    if (duration > 1000) { // 1 second threshold
      this.metricsService.increment('database_slow_queries_total', {
        operation,
        table,
        tenant: tenantId || 'unknown',
      });
    }
  }

  /**
   * Record cache operation metrics
   */
  recordCacheOperation(
    operation: 'get' | 'set' | 'delete' | 'invalidate',
    result: 'hit' | 'miss' | 'success' | 'error',
    tenantId?: string
  ): void {
    this.metricsService.increment('cache_operations_total', {
      operation,
      result,
      tenant: tenantId || 'unknown',
    });
  }

  /**
   * Record business event metrics
   */
  recordBusinessEvent(
    eventType: string,
    tenantId: string,
    value: number = 1,
    metadata?: Record<string, string>
  ): void {
    this.metricsService.increment('business_events_total', {
      event_type: eventType,
      tenant: tenantId,
      ...metadata,
    }, value);
  }

  /**
   * Update tenant activity score
   */
  updateTenantActivityScore(tenantId: string, score: number): void {
    this.metricsService.gauge('business_tenant_activity_score', score, {
      tenant: tenantId,
    });
  }

  /**
   * Calculate and update conversion rates
   */
  async updateLeadConversionRate(tenantId: string): Promise<void> {
    try {
      const [totalLeads, contactedLeads] = await Promise.all([
        this.prisma.lead.count({
          where: { tenantId },
        }),
        this.prisma.lead.count({
          where: { 
            tenantId,
            status: 'CONTACTED',
          },
        }),
      ]);

      const conversionRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;

      this.metricsService.gauge('business_leads_conversion_rate', conversionRate, {
        tenant: tenantId,
      });

      this.metricsService.gauge('business_leads_total', totalLeads, {
        tenant: tenantId,
      });

      this.metricsService.gauge('business_leads_contacted', contactedLeads, {
        tenant: tenantId,
      });

    } catch (error) {
      this.logger.error(`Failed to update conversion rate for tenant ${tenantId}:`, error);
    }
  }

  /**
   * Calculate performance percentiles
   */
  getResponseTimePercentiles(): { p50: number; p95: number; p99: number } {
    if (this.responseTimes.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const length = sorted.length;

    return {
      p50: sorted[Math.floor(length * 0.5)],
      p95: sorted[Math.floor(length * 0.95)],
      p99: sorted[Math.floor(length * 0.99)],
    };
  }

  /**
   * Get comprehensive business metrics for a tenant
   */
  async getBusinessMetrics(tenantId: string): Promise<BusinessMetrics> {
    try {
      const [totalLeads, newLeads, contactedLeads, lastActivity] = await Promise.all([
        this.prisma.lead.count({ where: { tenantId } }),
        this.prisma.lead.count({ where: { tenantId, status: 'NEW' } }),
        this.prisma.lead.count({ where: { tenantId, status: 'CONTACTED' } }),
        this.prisma.lead.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      const conversionRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;
      
      // Calculate activity score based on recent activity
      const hoursSinceLastActivity = lastActivity 
        ? (Date.now() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60)
        : 168; // 1 week if no activity

      const activityScore = Math.max(0, 100 - (hoursSinceLastActivity * 2));

      return {
        tenantId,
        totalLeads,
        newLeads,
        contactedLeads,
        conversionRate: Math.round(conversionRate * 100) / 100,
        avgResponseTime: 0, // Would need to track this separately
        apiCallsToday: 0, // Would need to track this separately
        errorRate: 0, // Would need to track this separately
        lastActivity: lastActivity?.createdAt || new Date(0),
        activityScore: Math.round(activityScore * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to get business metrics for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get system performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const percentiles = this.getResponseTimePercentiles();

    return {
      avgDatabaseQueryTime: 0, // Would be calculated from stored metrics
      slowQueryCount: 0, // Would be calculated from stored metrics
      cacheHitRate: 0, // Would be calculated from cache metrics
      totalRequests: 0, // Would be calculated from HTTP metrics
      errorRequests: 0, // Would be calculated from error metrics
      p95ResponseTime: percentiles.p95,
      p99ResponseTime: percentiles.p99,
    };
  }

  /**
   * Scheduled task to update business metrics every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateBusinessMetrics(): Promise<void> {
    try {
      this.logger.log('Updating business metrics');

      // Get all active tenants
      const tenants = await this.prisma.tenant.findMany({
        select: { id: true },
      });

      // Update metrics for each tenant
      for (const tenant of tenants) {
        await this.updateLeadConversionRate(tenant.id);
        
        const businessMetrics = await this.getBusinessMetrics(tenant.id);
        this.updateTenantActivityScore(tenant.id, businessMetrics.activityScore);
      }

      // Update system-wide metrics
      const performanceMetrics = await this.getPerformanceMetrics();
      const percentiles = this.getResponseTimePercentiles();

      this.metricsService.gauge('system_p95_response_time_ms', percentiles.p95);
      this.metricsService.gauge('system_p99_response_time_ms', percentiles.p99);

      this.structuredLogger.log(
        'Business metrics updated successfully',
        {
          ...this.contextService.toLogContext(),
          metadata: {
            tenantsProcessed: tenants.length,
            p95ResponseTime: percentiles.p95,
            p99ResponseTime: percentiles.p99,
          },
        }
      );

    } catch (error) {
      this.logger.error('Failed to update business metrics:', error);
      this.metricsService.increment('business_metrics_update_failures_total');
    }
  }

  /**
   * Scheduled task to update cache hit rates every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async updateCacheMetrics(): Promise<void> {
    try {
      // This would integrate with Redis or cache service to get hit rates
      // For now, we'll set placeholder metrics
      
      const cacheHitRate = 85; // Would be calculated from actual cache statistics
      this.metricsService.gauge('cache_hit_rate_percent', cacheHitRate);

    } catch (error) {
      this.logger.error('Failed to update cache metrics:', error);
    }
  }

  /**
   * Normalize endpoint paths for consistent metrics
   */
  private normalizeEndpoint(endpoint: string): string {
    return endpoint
      .replace(/\/[0-9a-f-]{36}/g, '/:id') // Replace UUIDs with :id
      .replace(/\/\d+/g, '/:id') // Replace numeric IDs with :id
      .replace(/\/[^\/]+@[^\/]+/g, '/:email') // Replace emails with :email
      .toLowerCase();
  }
}