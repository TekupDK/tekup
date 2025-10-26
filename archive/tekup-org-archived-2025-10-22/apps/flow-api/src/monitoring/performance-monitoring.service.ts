import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { performanceMonitor } from '@tekup/shared';
import * as os from 'os';

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get tenant-specific performance metrics
   */
  async getTenantMetrics(tenantId: string) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Get tenant-specific metrics from database
      const [leadCount, apiCalls, websocketConnections] = await Promise.all([
        this.prisma.lead.count({ where: { tenantId } }),
        this.prisma.apiCall?.count({ 
          where: { tenantId, timestamp: { gte: oneHourAgo } } 
        }) || Promise.resolve(0),
        this.prisma.websocketConnection?.count({ 
          where: { tenantId, connectedAt: { gte: oneHourAgo } } 
        }) || Promise.resolve(0),
      ]);

      return {
        leadCount,
        apiCallsLastHour: apiCalls,
        websocketConnectionsLastHour: websocketConnections,
        tenantId,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error(`Failed to get tenant metrics for ${tenantId}:`, error);
      return {
        leadCount: 0,
        apiCallsLastHour: 0,
        websocketConnectionsLastHour: 0,
        tenantId,
        timestamp: new Date(),
        error: 'Failed to retrieve tenant metrics',
      };
    }
  }

  /**
   * Get tenant performance summary
   */
  async getTenantPerformanceSummary(tenantId: string, timeWindowMinutes: number) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

      // Get tenant-specific performance data
      const [leadsCreated, leadsConverted, apiResponseTimes, errors] = await Promise.all([
        this.prisma.lead.count({ 
          where: { 
            tenantId, 
            createdAt: { gte: startTime } 
          } 
        }),
        this.prisma.lead.count({ 
          where: { 
            tenantId, 
            status: 'CONVERTED',
            updatedAt: { gte: startTime } 
          } 
        }),
        this.getAverageApiResponseTime(tenantId, startTime, now),
        this.getErrorCount(tenantId, startTime, now),
      ]);

      const conversionRate = leadsCreated > 0 ? (leadsConverted / leadsCreated) * 100 : 0;

      return {
        leadsCreated,
        leadsConverted,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageApiResponseTime: apiResponseTimes,
        errorCount: errors,
        timeWindow: timeWindowMinutes,
        tenantId,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error(`Failed to get tenant performance summary for ${tenantId}:`, error);
      return {
        leadsCreated: 0,
        leadsConverted: 0,
        conversionRate: 0,
        averageApiResponseTime: 0,
        errorCount: 0,
        timeWindow: timeWindowMinutes,
        tenantId,
        timestamp: new Date(),
        error: 'Failed to retrieve tenant performance summary',
      };
    }
  }

  /**
   * Get system resources
   */
  async getSystemResources() {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      const cpuLoad = os.loadavg();
      const uptime = os.uptime();

      // Get disk usage (simplified)
      const diskUsage = await this.getDiskUsage();

      return {
        memory: {
          total: this.formatBytes(totalMemory),
          used: this.formatBytes(usedMemory),
          free: this.formatBytes(freeMemory),
          usagePercentage: Math.round(memoryUsage * 100) / 100,
        },
        cpu: {
          load1: Math.round(cpuLoad[0] * 100) / 100,
          load5: Math.round(cpuLoad[1] * 100) / 100,
          load15: Math.round(cpuLoad[2] * 100) / 100,
        },
        disk: {
          usagePercentage: diskUsage,
        },
        system: {
          uptime: this.formatUptime(uptime),
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get system resources:', error);
      return {
        error: 'Failed to retrieve system resources',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get API performance metrics
   */
  async getApiPerformanceMetrics(
    endpoint?: string,
    timeWindowMinutes: number = 60,
    tenantId?: string,
  ) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

      // Get API performance data from database
      const where: any = {
        timestamp: { gte: startTime },
      };

      if (endpoint) {
        where.endpoint = endpoint;
      }

      if (tenantId) {
        where.tenantId = tenantId;
      }

      const apiCalls = await this.prisma.apiCall?.findMany({
        where,
        select: {
          endpoint: true,
          responseTime: true,
          statusCode: true,
          timestamp: true,
          tenantId: true,
        },
        orderBy: { timestamp: 'desc' },
      }) || [];

      // Calculate metrics
      const totalCalls = apiCalls.length;
      const successfulCalls = apiCalls.filter(call => call.statusCode >= 200 && call.statusCode < 300).length;
      const errorCalls = apiCalls.filter(call => call.statusCode >= 400).length;
      
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
      const errorRate = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0;

      const responseTimes = apiCalls.map(call => call.responseTime).filter(time => time !== null);
      const averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Group by endpoint
      const endpointStats = new Map<string, { calls: number; avgResponseTime: number; successRate: number }>();
      
      apiCalls.forEach(call => {
        const stats = endpointStats.get(call.endpoint) || { calls: 0, avgResponseTime: 0, successRate: 0 };
        stats.calls++;
        
        if (call.responseTime) {
          stats.avgResponseTime += call.responseTime;
        }
        
        if (call.statusCode >= 200 && call.statusCode < 300) {
          stats.successRate++;
        }
        
        endpointStats.set(call.endpoint, stats);
      });

      // Calculate averages for each endpoint
      endpointStats.forEach((stats, endpoint) => {
        stats.avgResponseTime = stats.calls > 0 ? stats.avgResponseTime / stats.calls : 0;
        stats.successRate = stats.calls > 0 ? (stats.successRate / stats.calls) * 100 : 0;
      });

      return {
        totalCalls,
        successfulCalls,
        errorCalls,
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        endpointStats: Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
          endpoint,
          ...stats,
          avgResponseTime: Math.round(stats.avgResponseTime * 100) / 100,
          successRate: Math.round(stats.successRate * 100) / 100,
        })),
        timeWindow: timeWindowMinutes,
        tenantId,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error('Failed to get API performance metrics:', error);
      return {
        error: 'Failed to retrieve API performance metrics',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabasePerformanceMetrics(timeWindowMinutes: number = 60, tenantId?: string) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

      // Get database performance data
      const [totalQueries, slowQueries, connectionCount] = await Promise.all([
        this.getDatabaseQueryCount(startTime, now, tenantId),
        this.getSlowQueryCount(startTime, now, tenantId),
        this.getDatabaseConnectionCount(tenantId),
      ]);

      return {
        totalQueries,
        slowQueries,
        connectionCount,
        slowQueryPercentage: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
        timeWindow: timeWindowMinutes,
        tenantId,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error('Failed to get database performance metrics:', error);
      return {
        error: 'Failed to retrieve database performance metrics',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get WebSocket performance metrics
   */
  async getWebSocketPerformanceMetrics(timeWindowMinutes: number = 60, tenantId?: string) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindowMinutes * 60 * 1000);

      // Get WebSocket performance data
      const [totalConnections, activeConnections, messagesSent, messagesReceived] = await Promise.all([
        this.getWebSocketConnectionCount(startTime, now, tenantId),
        this.getActiveWebSocketConnectionCount(tenantId),
        this.getWebSocketMessageCount('sent', startTime, now, tenantId),
        this.getWebSocketMessageCount('received', startTime, now, tenantId),
      ]);

      return {
        totalConnections,
        activeConnections,
        messagesSent,
        messagesReceived,
        totalMessages: messagesSent + messagesReceived,
        timeWindow: timeWindowMinutes,
        tenantId,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error('Failed to get WebSocket performance metrics:', error);
      return {
        error: 'Failed to retrieve WebSocket performance metrics',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get performance trends
   */
  async getPerformanceTrends(
    metricName: string,
    timeWindow: number,
    interval: number,
    tenantId?: string,
  ) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - timeWindow * 60 * 60 * 1000);
      
      const intervals: Array<{ start: Date; end: Date; value: number }> = [];
      
      for (let i = 0; i < timeWindow; i += interval) {
        const intervalStart = new Date(startTime.getTime() + i * 60 * 60 * 1000);
        const intervalEnd = new Date(intervalStart.getTime() + interval * 60 * 60 * 1000);
        
        // Get metric value for this interval
        const value = await this.getMetricValueForInterval(metricName, intervalStart, intervalEnd, tenantId);
        
        intervals.push({
          start: intervalStart,
          end: intervalEnd,
          value,
        });
      }

      return {
        metricName,
        timeWindow,
        interval,
        tenantId,
        trends: intervals,
        timestamp: now,
      };
    } catch (error) {
      this.logger.error('Failed to get performance trends:', error);
      return {
        error: 'Failed to retrieve performance trends',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get performance recommendations
   */
  async getPerformanceRecommendations(tenantId: string) {
    try {
      const recommendations: Array<{
        type: 'performance' | 'scaling' | 'optimization' | 'security';
        priority: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        impact: string;
        suggestedAction: string;
      }> = [];

      // Get current performance metrics
      const health = performanceMonitor.calculateSystemHealth();
      const tenantMetrics = await this.getTenantMetrics(tenantId);

      // Generate recommendations based on metrics
      if (health.score < 70) {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          title: 'System Performance Degraded',
          description: 'System health score is below optimal levels',
          impact: 'May affect user experience and system reliability',
          suggestedAction: 'Review system resources and optimize database queries',
        });
      }

      if (tenantMetrics.apiCallsLastHour > 1000) {
        recommendations.push({
          type: 'scaling',
          priority: 'medium',
          title: 'High API Usage Detected',
          description: 'API calls are significantly above normal levels',
          impact: 'May indicate need for scaling or optimization',
          suggestedAction: 'Monitor usage patterns and consider implementing caching',
        });
      }

      if (tenantMetrics.websocketConnectionsLastHour > 100) {
        recommendations.push({
          type: 'scaling',
          priority: 'medium',
          title: 'High WebSocket Connection Count',
          description: 'Many concurrent WebSocket connections detected',
          impact: 'May affect real-time performance',
          suggestedAction: 'Review connection management and consider connection pooling',
        });
      }

      return {
        tenantId,
        recommendations,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to get performance recommendations:', error);
      return {
        tenantId,
        recommendations: [],
        timestamp: new Date(),
        error: 'Failed to retrieve performance recommendations',
      };
    }
  }

  /**
   * Helper methods
   */
  private async getAverageApiResponseTime(startTime: Date, endTime: Date, tenantId?: string) {
    try {
      const where: any = {
        timestamp: { gte: startTime, lte: endTime },
        responseTime: { not: null },
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      const result = await this.prisma.apiCall?.aggregate({
        where,
        _avg: { responseTime: true },
      });

      return result?._avg?.responseTime || 0;
    } catch (error) {
      this.logger.error('Failed to get average API response time:', error);
      return 0;
    }
  }

  private async getErrorCount(startTime: Date, endTime: Date, tenantId?: string) {
    try {
      const where: any = {
        timestamp: { gte: startTime, lte: endTime },
        statusCode: { gte: 400 },
      };

      if (tenantId) {
        where.tenantId = tenantId;
      }

      return await this.prisma.apiCall?.count({ where }) || 0;
    } catch (error) {
      this.logger.error('Failed to get error count:', error);
      return 0;
    }
  }

  private async getDiskUsage(): Promise<number> {
    try {
      // This is a simplified implementation
      // In production, you would use a proper disk usage library
      return 65; // Mock value
    } catch (error) {
      this.logger.error('Failed to get disk usage:', error);
      return 0;
    }
  }

  private async getDatabaseQueryCount(startTime: Date, endTime: Date, tenantId?: string): Promise<number> {
    try {
      // Mock implementation - in production this would query actual database logs
      return Math.floor(Math.random() * 1000) + 100;
    } catch (error) {
      this.logger.error('Failed to get database query count:', error);
      return 0;
    }
  }

  private async getSlowQueryCount(startTime: Date, endTime: Date, tenantId?: string): Promise<number> {
    try {
      // Mock implementation
      return Math.floor(Math.random() * 50) + 5;
    } catch (error) {
      this.logger.error('Failed to get slow query count:', error);
      return 0;
    }
  }

  private async getDatabaseConnectionCount(tenantId?: string): Promise<number> {
    try {
      // Mock implementation
      return Math.floor(Math.random() * 20) + 5;
    } catch (error) {
      this.logger.error('Failed to get database connection count:', error);
      return 0;
    }
  }

  private async getWebSocketConnectionCount(startTime: Date, endTime: Date, tenantId?: string): Promise<number> {
    try {
      // Mock implementation
      return Math.floor(Math.random() * 100) + 20;
    } catch (error) {
      this.logger.error('Failed to get WebSocket connection count:', error);
      return 0;
    }
  }

  private async getActiveWebSocketConnectionCount(tenantId?: string): Promise<number> {
    try {
      // Mock implementation
      return Math.floor(Math.random() * 30) + 10;
    } catch (error) {
      this.logger.error('Failed to get active WebSocket connection count:', error);
      return 0;
    }
  }

  private async getWebSocketMessageCount(
    direction: 'sent' | 'received',
    startTime: Date,
    endTime: Date,
    tenantId?: string,
  ): Promise<number> {
    try {
      // Mock implementation
      return Math.floor(Math.random() * 500) + 100;
    } catch (error) {
      this.logger.error('Failed to get WebSocket message count:', error);
      return 0;
    }
  }

  private async getMetricValueForInterval(
    metricName: string,
    startTime: Date,
    endTime: Date,
    tenantId?: string,
  ): Promise<number> {
    try {
      // Mock implementation - in production this would query actual metrics
      return Math.floor(Math.random() * 100) + 10;
    } catch (error) {
      this.logger.error('Failed to get metric value for interval:', error);
      return 0;
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}