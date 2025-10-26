import { Injectable, Logger } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';
import { GdprService } from '../gdpr/gdpr.service';
import { ConfigService } from '@nestjs/config';

export interface GdprComplianceAlert {
  type: 'gdpr_compliance_failure' | 'consent_violation' | 'data_retention_violation' | 'breach_detection';
  tenant: string;
  operation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class GdprMonitoringService {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-flow-api-src-monitoring-g');

  private readonly logger = new Logger(GdprMonitoringService.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly gdprService: GdprService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Monitor GDPR compliance metrics
   */
  monitorGdprCompliance(tenantId: string, operation: string, success: boolean): void {
    this.metricsService.increment('gdpr_operation_total', {
      tenant: tenantId,
      operation,
      success: success.toString(),
    });

    if (!success) {
      this.logger.warn(`GDPR operation failed: ${operation} for tenant ${tenantId}`);
      
      // Alert security team
      this.alertSecurityTeam({
        type: 'gdpr_compliance_failure',
        tenant: tenantId,
        operation,
        severity: 'high',
        message: `GDPR operation ${operation} failed for tenant ${tenantId}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Monitor consent management
   */
  monitorConsentOperation(tenantId: string, customerId: string, operation: string, success: boolean): void {
    this.metricsService.increment('gdpr_consent_operation_total', {
      tenant: tenantId,
      operation,
      success: success.toString(),
    });

    if (!success) {
      this.alertSecurityTeam({
        type: 'consent_violation',
        tenant: tenantId,
        operation,
        severity: 'medium',
        message: `Consent operation ${operation} failed for customer ${customerId} in tenant ${tenantId}`,
        timestamp: new Date(),
        metadata: { customerId, operation },
      });
    }
  }

  /**
   * Monitor data retention compliance
   */
  async monitorDataRetentionCompliance(tenantId: string): Promise<void> {
    try {
      const policies = await this.gdprService.getDataRetentionPolicies(tenantId);
      
      // Check for expired data that should be deleted
      for (const policy of policies) {
        if (policy.autoDelete) {
          const retentionDays = this.parseRetentionPeriod(policy.retentionPeriod);
          const daysSinceCreation = this.getDaysSinceCreation(policy.createdAt);
          
          if (daysSinceCreation > retentionDays) {
            this.alertSecurityTeam({
              type: 'data_retention_violation',
              tenant: tenantId,
              operation: 'data_retention_check',
              severity: 'medium',
              message: `Data retention policy violation for ${policy.dataType} in tenant ${tenantId}`,
              timestamp: new Date(),
              metadata: {
                dataType: policy.dataType,
                retentionPeriod: policy.retentionPeriod,
                daysSinceCreation,
                shouldDelete: true,
              },
            });
          }
        }
      }

      this.metricsService.increment('gdpr_retention_compliance_check_total', {
        tenant: tenantId,
        success: 'true',
      });
    } catch (error) {
      this.logger.error(`Failed to monitor data retention compliance: ${error.message}`);
      
      this.metricsService.increment('gdpr_retention_compliance_check_total', {
        tenant: tenantId,
        success: 'false',
      });
    }
  }

  /**
   * Monitor data subject request processing
   */
  monitorDataSubjectRequest(tenantId: string, requestType: string, status: string, processingTime?: number): void {
    this.metricsService.increment('gdpr_data_subject_request_total', {
      tenant: tenantId,
      requestType,
      status,
    });

    if (processingTime) {
      this.metricsService.histogram('gdpr_request_processing_time_seconds', processingTime, {
        tenant: tenantId,
        requestType,
      });
    }

    // Alert on SLA violations
    const slaHours = this.getSlaHours(requestType);
    if (processingTime && processingTime > slaHours * 3600 * 1000) {
      this.alertSecurityTeam({
        type: 'gdpr_compliance_failure',
        tenant: tenantId,
        operation: 'data_subject_request',
        severity: 'medium',
        message: `SLA violation for ${requestType} request in tenant ${tenantId}`,
        timestamp: new Date(),
        metadata: {
          requestType,
          processingTime,
          slaHours,
          violation: true,
        },
      });
    }
  }

  /**
   * Monitor cross-tenant access attempts
   */
  monitorCrossTenantAccess(tenantId: string, targetTenantId: string, operation: string, success: boolean): void {
    this.metricsService.increment('cross_tenant_access_attempt_total', {
      source_tenant: tenantId,
      target_tenant: targetTenantId,
      operation,
      success: success.toString(),
    });

    if (!success) {
      this.alertSecurityTeam({
        type: 'gdpr_compliance_failure',
        tenant: tenantId,
        operation: 'cross_tenant_access',
        severity: 'high',
        message: `Unauthorized cross-tenant access attempt from ${tenantId} to ${targetTenantId}`,
        timestamp: new Date(),
        metadata: {
          sourceTenant: tenantId,
          targetTenant: targetTenantId,
          operation,
          unauthorized: true,
        },
      });
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(tenantId: string): Promise<any> {
    try {
      const summary = await this.gdprService.getGdprComplianceSummary(tenantId);
      
      // Calculate compliance score
      const complianceScore = this.calculateComplianceScore(summary);
      
      const report = {
        tenantId,
        generatedAt: new Date(),
        complianceScore,
        summary,
        recommendations: this.generateRecommendations(summary, complianceScore),
        nextReviewDate: this.calculateNextReviewDate(),
      };

      this.metricsService.gauge('gdpr_compliance_score', complianceScore, {
        tenant: tenantId,
      });

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate compliance report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Alert security team for compliance issues
   */
  private alertSecurityTeam(alert: GdprComplianceAlert): void {
    // Log the alert
    this.logger.error('GDPR Compliance Alert:', alert);
    
    // Increment alert metrics
    this.metricsService.increment('gdpr_compliance_alert_total', {
      type: alert.type,
      severity: alert.severity,
      tenant: alert.tenant,
    });

    // TODO: Implement actual alerting (email, Slack, etc.)
    // For now, just log to console
    logger.error('🚨 GDPR COMPLIANCE ALERT:', {
      ...alert,
      timestamp: alert.timestamp.toISOString(),
    });
  }

  /**
   * Parse retention period string to days
   */
  private parseRetentionPeriod(retentionPeriod: string): number {
    const match = retentionPeriod.match(/(\d+)\s*(day|days|year|years)/i);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.includes('year')) {
        return value * 365;
      } else if (unit.includes('day')) {
        return value;
      }
    }
    
    return 365; // Default to 1 year
  }

  /**
   * Get days since creation
   */
  private getDaysSinceCreation(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get SLA hours for request type
   */
  private getSlaHours(requestType: string): number {
    const slaConfig = {
      access: this.configService.get('GDPR_ACCESS_REQUEST_SLA_DAYS', 30),
      erasure: this.configService.get('GDPR_ERASURE_REQUEST_SLA_DAYS', 30),
      portability: this.configService.get('GDPR_ACCESS_REQUEST_SLA_DAYS', 30),
      rectification: 7, // 7 days for rectification
    };

    return slaConfig[requestType as keyof typeof slaConfig] || 30;
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(summary: any): number {
    let score = 100;
    
    // Deduct points for missing components
    if (summary.consentRecords === 0) score -= 20;
    if (summary.retentionPolicies === 0) score -= 20;
    if (summary.dataSubjectRequests === 0) score -= 10;
    
    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(summary: any, score: number): string[] {
    const recommendations: string[] = [];
    
    if (score < 80) {
      if (summary.consentRecords === 0) {
        recommendations.push('Implement customer consent management system');
      }
      if (summary.retentionPolicies === 0) {
        recommendations.push('Define and implement data retention policies');
      }
      if (summary.dataSubjectRequests === 0) {
        recommendations.push('Set up data subject request processing workflow');
      }
    }
    
    if (score < 60) {
      recommendations.push('Conduct GDPR compliance audit');
      recommendations.push('Implement automated compliance monitoring');
    }
    
    return recommendations;
  }

  /**
   * Calculate next review date
   */
  private calculateNextReviewDate(): Date {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 30); // Review every 30 days
    return nextReview;
  }

  /**
   * Check for potential data breaches
   */
  async checkForDataBreaches(tenantId: string): Promise<void> {
    try {
      // Monitor unusual access patterns
      const recentRequests = await this.getRecentDataSubjectRequests(tenantId);
      
      // Check for suspicious patterns
      const suspiciousPatterns = this.identifySuspiciousPatterns(recentRequests);
      
      if (suspiciousPatterns.length > 0) {
        this.alertSecurityTeam({
          type: 'breach_detection',
          tenant: tenantId,
          operation: 'breach_detection',
          severity: 'critical',
          message: `Potential data breach detected in tenant ${tenantId}`,
          timestamp: new Date(),
          metadata: {
            suspiciousPatterns,
            recentRequests: recentRequests.length,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to check for data breaches: ${error.message}`);
    }
  }

  /**
   * Get recent data subject requests
   */
  private async getRecentDataSubjectRequests(tenantId: string): Promise<any[]> {
    // This would typically query the database for recent requests
    // For now, return empty array
    return [];
  }

  /**
   * Identify suspicious patterns in requests
   */
  private identifySuspiciousPatterns(requests: any[]): string[] {
    const patterns: string[] = [];
    
    // Check for multiple erasure requests from same customer
    const erasureRequests = requests.filter(r => r.requestType === 'erasure');
    const customerCounts = new Map<string, number>();
    
    erasureRequests.forEach(request => {
      const count = customerCounts.get(request.customerId) || 0;
      customerCounts.set(request.customerId, count + 1);
    });
    
    customerCounts.forEach((count, customerId) => {
      if (count > 3) {
        patterns.push(`Multiple erasure requests from customer ${customerId}: ${count} requests`);
      }
    });
    
    return patterns;
  }
}