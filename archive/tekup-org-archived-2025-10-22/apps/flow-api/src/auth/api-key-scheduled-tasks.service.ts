import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { EnhancedApiKeyService } from './enhanced-api-key.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StructuredLogger } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { MetricsService } from '../metrics/metrics.service.js';

@Injectable()
export class ApiKeyScheduledTasksService {
  private readonly logger = new Logger(ApiKeyScheduledTasksService.name);
  private readonly isEnabled: boolean;

  constructor(
    private readonly enhancedApiKeyService: EnhancedApiKeyService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly structuredLogger: StructuredLogger,
    private readonly contextService: AsyncContextService,
    private readonly metricsService: MetricsService
  ) {
    this.isEnabled = this.configService.get('API_KEY_SCHEDULED_TASKS_ENABLED', 'true') === 'true';
  }

  /**
   * Clean up expired API keys every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredKeys() {
    if (!this.isEnabled) return;

    try {
      this.logger.log('Starting expired API key cleanup');
      const cleanedCount = await this.enhancedApiKeyService.cleanupExpiredKeys();
      
      if (cleanedCount > 0) {
        this.structuredLogger.log(
          `Cleaned up ${cleanedCount} expired API keys`,
          {
            ...this.contextService.toLogContext(),
            metadata: {
              task: 'cleanup_expired_keys',
              cleanedCount,
            },
          }
        );
      }

      this.metricsService.gauge('api_key_cleanup_last_run_timestamp', Date.now());
    } catch (error) {
      this.logger.error('Failed to cleanup expired API keys:', error);
      this.metricsService.increment('api_key_cleanup_failures_total');
    }
  }

  /**
   * Send rotation warnings for keys that should be rotated (daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkKeysForRotation() {
    if (!this.isEnabled) return;

    try {
      this.logger.log('Checking API keys for rotation recommendations');
      
      // Get all active keys that might need rotation
      const activeKeys = await this.prisma.apiKey.findMany({
        where: {
          active: true,
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ],
        },
        include: {
          tenant: true,
        },
      });

      let rotationRecommendations = 0;
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const key of activeKeys) {
        let shouldRecommendRotation = false;
        const reasons: string[] = [];

        // Check if it's a legacy key (no hashed version)
        if (!key.hashedKey) {
          shouldRecommendRotation = true;
          reasons.push('Legacy key format');
        }

        // Check if key is very old
        if (key.createdAt < ninetyDaysAgo) {
          shouldRecommendRotation = true;
          reasons.push('Key is older than 90 days');
        }

        // Check if key hasn't been used recently
        if (key.lastUsedAt && key.lastUsedAt < thirtyDaysAgo) {
          shouldRecommendRotation = true;
          reasons.push('Key not used in the last 30 days');
        }

        // Check if key has been rotated too many times
        if (key.rotationCount > 10) {
          shouldRecommendRotation = true;
          reasons.push('Key has been rotated many times');
        }

        if (shouldRecommendRotation) {
          rotationRecommendations++;
          
          this.structuredLogger.warn(
            'API key rotation recommended',
            {
              ...this.contextService.toLogContext(),
              metadata: {
                apiKeyId: key.id,
                tenantId: key.tenantId,
                tenantSlug: key.tenant.slug,
                keyPrefix: key.keyPrefix,
                reasons,
                createdAt: key.createdAt,
                lastUsedAt: key.lastUsedAt,
                rotationCount: key.rotationCount,
              },
            }
          );

          // TODO: Send notification to tenant admin about key rotation
          // This could be implemented with email, webhook, or in-app notifications
        }
      }

      this.structuredLogger.log(
        `API key rotation check completed`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            task: 'rotation_check',
            totalKeys: activeKeys.length,
            rotationRecommendations,
          },
        }
      );

      this.metricsService.gauge('api_key_rotation_recommendations_total', rotationRecommendations);
    } catch (error) {
      this.logger.error('Failed to check keys for rotation:', error);
      this.metricsService.increment('api_key_rotation_check_failures_total');
    }
  }

  /**
   * Clean up old usage logs (weekly)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupOldUsageLogs() {
    if (!this.isEnabled) return;

    try {
      this.logger.log('Starting usage log cleanup');
      
      const retentionDays = this.configService.get('API_KEY_USAGE_LOG_RETENTION_DAYS', '90');
      const cutoffDate = new Date(Date.now() - parseInt(retentionDays) * 24 * 60 * 60 * 1000);
      
      const result = await this.prisma.apiKeyUsageLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.structuredLogger.log(
          `Cleaned up ${result.count} old usage log entries`,
          {
            ...this.contextService.toLogContext(),
            metadata: {
              task: 'cleanup_usage_logs',
              deletedCount: result.count,
              retentionDays: parseInt(retentionDays),
              cutoffDate,
            },
          }
        );
      }

      this.metricsService.gauge('api_key_usage_log_cleanup_last_count', result.count);
    } catch (error) {
      this.logger.error('Failed to cleanup usage logs:', error);
      this.metricsService.increment('api_key_usage_log_cleanup_failures_total');
    }
  }

  /**
   * Generate API key usage statistics (daily)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateUsageStatistics() {
    if (!this.isEnabled) return;

    try {
      this.logger.log('Generating API key usage statistics');
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const endOfYesterday = new Date(startOfYesterday.getTime() + 24 * 60 * 60 * 1000);

      // Get usage statistics for yesterday
      const usageStats = await this.prisma.apiKeyUsageLog.groupBy({
        by: ['apiKeyId'],
        where: {
          timestamp: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
        },
        _count: {
          id: true,
        },
        _avg: {
          responseTime: true,
        },
      });

      // Get error rates
      const errorStats = await this.prisma.apiKeyUsageLog.groupBy({
        by: ['apiKeyId'],
        where: {
          timestamp: {
            gte: startOfYesterday,
            lt: endOfYesterday,
          },
          responseStatus: {
            gte: 400,
          },
        },
        _count: {
          id: true,
        },
      });

      const errorMap = new Map(errorStats.map((stat: any) => [stat.apiKeyId, stat._count.id]));

      // Process statistics
      for (const stat of usageStats) {
        const totalRequests: number = stat._count.id as number;
        const errorCount: number = (errorMap.get(stat.apiKeyId) as number) || 0;
        const errorRate: number = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
        const avgResponseTime: number = stat._avg.responseTime || 0;

        // Record metrics
        this.metricsService.gauge('api_key_daily_requests', totalRequests, {
          api_key_id: stat.apiKeyId,
        });
        
        this.metricsService.gauge('api_key_daily_error_rate', errorRate, {
          api_key_id: stat.apiKeyId,
        });
        
        this.metricsService.gauge('api_key_daily_avg_response_time', avgResponseTime, {
          api_key_id: stat.apiKeyId,
        });

        // Log high error rates or slow response times
        if (errorRate > 10 || avgResponseTime > 5000) {
          this.structuredLogger.warn(
            'API key showing concerning usage patterns',
            {
              ...this.contextService.toLogContext(),
              metadata: {
                apiKeyId: stat.apiKeyId,
                totalRequests,
                errorCount,
                errorRate,
                avgResponseTime,
                date: yesterday.toISOString().split('T')[0],
              },
            }
          );
        }
      }

      this.structuredLogger.log(
        `Generated usage statistics for ${usageStats.length} API keys`,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            task: 'usage_statistics',
            processedKeys: usageStats.length,
            date: yesterday.toISOString().split('T')[0],
          },
        }
      );
    } catch (error) {
      this.logger.error('Failed to generate usage statistics:', error);
      this.metricsService.increment('api_key_usage_statistics_failures_total');
    }
  }

  /**
   * Validate API key security settings (weekly)
   */
  @Cron(CronExpression.EVERY_WEEK)
  async validateSecuritySettings() {
    if (!this.isEnabled) return;

    try {
      this.logger.log('Validating API key security settings');
      
      const securityIssues: any[] = [];

      // Check for keys without expiration
      const keysWithoutExpiration = await this.prisma.apiKey.count({
        where: {
          active: true,
          revokedAt: null,
          expiresAt: null,
        },
      });

      if (keysWithoutExpiration > 0) {
        securityIssues.push({
          type: 'keys_without_expiration',
          count: keysWithoutExpiration,
          severity: 'medium',
          recommendation: 'Set expiration dates for all API keys',
        });
      }

      // Check for keys without IP restrictions
      const keysWithoutIpRestrictions = await this.prisma.apiKey.count({
        where: {
          active: true,
          revokedAt: null,
          ipWhitelist: {
            equals: [],
          },
        },
      });

      if (keysWithoutIpRestrictions > 0) {
        securityIssues.push({
          type: 'keys_without_ip_restrictions',
          count: keysWithoutIpRestrictions,
          severity: 'low',
          recommendation: 'Consider adding IP restrictions for sensitive API keys',
        });
      }

      // Check for legacy keys (not hashed)
      const legacyKeys = await this.prisma.apiKey.count({
        where: {
          active: true,
          revokedAt: null,
          hashedKey: null,
        },
      });

      if (legacyKeys > 0) {
        securityIssues.push({
          type: 'legacy_keys',
          count: legacyKeys,
          severity: 'high',
          recommendation: 'Migrate legacy API keys to hashed format',
        });
      }

      if (securityIssues.length > 0) {
        this.structuredLogger.warn(
          'API key security issues detected',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              task: 'security_validation',
              issues: securityIssues,
            },
          }
        );

        // Record metrics for each issue type
        for (const issue of securityIssues) {
          this.metricsService.gauge(`api_key_security_issue_${issue.type}`, issue.count);
        }
      } else {
        this.structuredLogger.log(
          'No API key security issues detected',
          {
            ...this.contextService.toLogContext(),
            metadata: {
              task: 'security_validation',
              status: 'clean',
            },
          }
        );
      }
    } catch (error) {
      this.logger.error('Failed to validate security settings:', error);
      this.metricsService.increment('api_key_security_validation_failures_total');
    }
  }
}