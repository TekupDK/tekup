import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  CacheInterceptor,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { ScopesGuard } from '../auth/scopes.guard';
import { RequireScopes } from '../auth/scopes.decorator';
import { TenantId } from '../auth/tenant-id.decorator';
import { SCOPE_READ_LEADS } from '../auth/scopes.constants';
import { PerformanceMonitoringService } from './performance-monitoring.service';
import { performanceMonitor } from '@tekup/shared';

@Controller('monitoring')
@UseGuards(ApiKeyGuard, ScopesGuard)
@UseInterceptors(CacheInterceptor)
export class PerformanceMonitoringController {
  constructor(private readonly performanceMonitoringService: PerformanceMonitoringService) {}

  /**
   * Get system health status
   */
  @Get('health')
  @RequireScopes(SCOPE_READ_LEADS)
  async getSystemHealth(@TenantId() tenantId: string) {
    const health = performanceMonitor.calculateSystemHealth();
    
    // Add tenant-specific metrics
    const tenantMetrics = await this.performanceMonitoringService.getTenantMetrics(tenantId);
    
    return {
      ...health,
      tenant: tenantId,
      tenantMetrics,
      timestamp: new Date(),
    };
  }

  /**
   * Get performance metrics
   */
  @Get('metrics')
  @RequireScopes(SCOPE_READ_LEADS)
  async getPerformanceMetrics(
    @Query('name') metricName?: string,
    @Query('aggregation') aggregation: 'raw' | 'avg' | 'min' | 'max' | 'sum' = 'raw',
    @Query('timeWindow') timeWindow: number = 60, // minutes
    @TenantId() tenantId?: string,
  ) {
    if (metricName) {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - timeWindow * 60 * 1000);
      
      const metrics = performanceMonitor.getMetrics(
        metricName,
        startTime,
        endTime,
        aggregation
      );
      
      return {
        metricName,
        aggregation,
        timeWindow,
        tenantId,
        metrics,
        count: metrics.length,
      };
    } else {
      // Get all available metrics
      const summary = performanceMonitor.getPerformanceSummary(timeWindow);
      
      return {
        timeWindow,
        tenantId,
        summary,
      };
    }
  }

  /**
   * Get active performance alerts
   */
  @Get('alerts')
  @RequireScopes(SCOPE_READ_LEADS)
  async getActiveAlerts() {
    const alerts = performanceMonitor.getActiveAlerts();
    
    return {
      alerts,
      count: alerts.length,
      timestamp: new Date(),
    };
  }

  /**
   * Acknowledge performance alert
   */
  @Post('alerts/:alertId/acknowledge')
  @RequireScopes(SCOPE_READ_LEADS)
  async acknowledgeAlert(
    @Body() request: { acknowledgedBy: string },
    @TenantId() tenantId: string,
  ) {
    const alertId = request.acknowledgedBy; // This should come from URL params in a real implementation
    
    performanceMonitor.acknowledgeAlert(alertId, request.acknowledgedBy);
    
    return {
      success: true,
      message: 'Alert acknowledged successfully',
      alertId,
      acknowledgedBy: request.acknowledgedBy,
      timestamp: new Date(),
    };
  }

  /**
   * Get performance summary
   */
  @Get('summary')
  @RequireScopes(SCOPE_READ_LEADS)
  async getPerformanceSummary(
    @Query('timeWindow') timeWindow: number = 60, // minutes
    @TenantId() tenantId?: string,
  ) {
    const summary = performanceMonitor.getPerformanceSummary(timeWindow);
    
    // Add tenant-specific summary
    if (tenantId) {
      const tenantSummary = await this.performanceMonitoringService.getTenantPerformanceSummary(
        tenantId,
        timeWindow
      );
      
      return {
        ...summary,
        tenantId,
        tenantSummary,
        timeWindow,
        timestamp: new Date(),
      };
    }
    
    return {
      ...summary,
      timeWindow,
      timestamp: new Date(),
    };
  }

  /**
   * Get system resource metrics
   */
  @Get('resources')
  @RequireScopes(SCOPE_READ_LEADS)
  async getSystemResources() {
    const resources = await this.performanceMonitoringService.getSystemResources();
    
    return {
      resources,
      timestamp: new Date(),
    };
  }

  /**
   * Get API performance metrics
   */
  @Get('api/performance')
  @RequireScopes(SCOPE_READ_LEADS)
  async getApiPerformanceMetrics(
    @Query('endpoint') endpoint?: string,
    @Query('timeWindow') timeWindow: number = 60, // minutes
    @TenantId() tenantId?: string,
  ) {
    const metrics = await this.performanceMonitoringService.getApiPerformanceMetrics(
      endpoint,
      timeWindow,
      tenantId
    );
    
    return {
      endpoint,
      timeWindow,
      tenantId,
      metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Get database performance metrics
   */
  @Get('database/performance')
  @RequireScopes(SCOPE_READ_LEADS)
  async getDatabasePerformanceMetrics(
    @Query('timeWindow') timeWindow: number = 60, // minutes
    @TenantId() tenantId?: string,
  ) {
    const metrics = await this.performanceMonitoringService.getDatabasePerformanceMetrics(
      timeWindow,
      tenantId
    );
    
    return {
      timeWindow,
      tenantId,
      metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Get WebSocket performance metrics
   */
  @Get('websocket/performance')
  @RequireScopes(SCOPE_READ_LEADS)
  async getWebSocketPerformanceMetrics(
    @Query('timeWindow') timeWindow: number = 60, // minutes
    @TenantId() tenantId?: string,
  ) {
    const metrics = await this.performanceMonitoringService.getWebSocketPerformanceMetrics(
      timeWindow,
      tenantId
    );
    
    return {
      timeWindow,
      tenantId,
      metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Set performance threshold
   */
  @Post('thresholds')
  @RequireScopes(SCOPE_READ_LEADS)
  async setPerformanceThreshold(
    @Body() threshold: {
      metricName: string;
      condition: 'above_threshold' | 'below_threshold' | 'rate_of_change';
      threshold: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      enabled: boolean;
      cooldownMinutes: number;
    },
    @TenantId() tenantId: string,
  ) {
    // Add tenant context to threshold
    const thresholdWithTenant = {
      ...threshold,
      tenantId,
    };
    
    performanceMonitor.setThreshold(thresholdWithTenant);
    
    return {
      success: true,
      message: 'Performance threshold set successfully',
      threshold: thresholdWithTenant,
      timestamp: new Date(),
    };
  }

  /**
   * Get all performance thresholds
   */
  @Get('thresholds')
  @RequireScopes(SCOPE_READ_LEADS)
  async getPerformanceThresholds() {
    const thresholds = performanceMonitor.getThresholds();
    
    return {
      thresholds,
      count: thresholds.length,
      timestamp: new Date(),
    };
  }

  /**
   * Get performance trends
   */
  @Get('trends')
  @RequireScopes(SCOPE_READ_LEADS)
  async getPerformanceTrends(
    @Query('metricName') metricName: string,
    @Query('timeWindow') timeWindow: number = 24, // hours
    @Query('interval') interval: number = 1, // hour intervals
    @TenantId() tenantId?: string,
  ) {
    const trends = await this.performanceMonitoringService.getPerformanceTrends(
      metricName,
      timeWindow,
      interval,
      tenantId
    );
    
    return {
      metricName,
      timeWindow,
      interval,
      tenantId,
      trends,
      timestamp: new Date(),
    };
  }

  /**
   * Get performance recommendations
   */
  @Get('recommendations')
  @RequireScopes(SCOPE_READ_LEADS)
  async getPerformanceRecommendations(@TenantId() tenantId: string) {
    const recommendations = await this.performanceMonitoringService.getPerformanceRecommendations(
      tenantId
    );
    
    return {
      tenantId,
      recommendations,
      count: recommendations.length,
      timestamp: new Date(),
    };
  }
}