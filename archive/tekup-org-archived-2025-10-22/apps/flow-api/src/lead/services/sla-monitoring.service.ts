import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SlaCalculationService } from './sla-calculation.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import { StructuredLogger } from '../../common/logging/structured-logger.service.js';

@Injectable()
export class SlaMonitoringService {
  private readonly logger = new Logger(SlaMonitoringService.name);

  constructor(
    private prisma: PrismaService,
    private slaCalculationService: SlaCalculationService,
    private metrics: MetricsService,
    private structuredLogger: StructuredLogger
  ) {}

  /**
   * Check for approaching SLA deadlines every 30 minutes
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async checkApproachingSlas() {
    this.logger.debug('Checking for approaching SLA deadlines');
    
    try {
      // Find leads with SLA deadlines approaching within the next 24 hours
      const approachingDeadline = new Date();
      approachingDeadline.setHours(approachingDeadline.getHours() + 24);
      
      const leads = await this.prisma.lead.findMany({
        where: {
          slaDeadline: {
            not: null,
            lte: approachingDeadline,
            gte: new Date() // Not already breached
          },
          status: {
            notIn: ['QUALIFIED', 'LOST'] // Not already resolved
          }
        },
        include: {
          tenant: true
        }
      });
      
      for (const lead of leads) {
        if (lead.slaDeadline && lead.createdAt) {
          const isApproaching = this.slaCalculationService.isSlaApproaching(
            lead.slaDeadline,
            lead.createdAt
          );
          
          if (isApproaching) {
            await this.handleApproachingSla(lead);
          }
        }
      }
      
      this.metrics.increment('sla_monitoring_checks_total', { 
        result: 'success',
        type: 'approaching'
      });
      
      this.logger.debug(`Checked ${leads.length} leads for approaching SLAs`);
    } catch (error) {
      this.metrics.increment('sla_monitoring_checks_total', { 
        result: 'error',
        type: 'approaching'
      });
      
      this.logger.error('Error checking approaching SLAs', error);
    }
  }

  /**
   * Check for breached SLA deadlines every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkBreachedSlas() {
    this.logger.debug('Checking for breached SLA deadlines');
    
    try {
      // Find leads with breached SLA deadlines
      const leads = await this.prisma.lead.findMany({
        where: {
          slaDeadline: {
            not: null,
            lte: new Date() // Already breached
          },
          status: {
            notIn: ['QUALIFIED', 'LOST'] // Not already resolved
          }
        },
        include: {
          tenant: true
        }
      });
      
      for (const lead of leads) {
        if (lead.slaDeadline) {
          const isBreached = this.slaCalculationService.isSlaBreached(lead.slaDeadline);
          
          if (isBreached) {
            await this.handleBreachedSla(lead);
          }
        }
      }
      
      this.metrics.increment('sla_monitoring_checks_total', { 
        result: 'success',
        type: 'breached'
      });
      
      this.logger.debug(`Checked ${leads.length} leads for breached SLAs`);
    } catch (error) {
      this.metrics.increment('sla_monitoring_checks_total', { 
        result: 'error',
        type: 'breached'
      });
      
      this.logger.error('Error checking breached SLAs', error);
    }
  }

  /**
   * Handle approaching SLA deadline
   */
  private async handleApproachingSla(lead: any) {
    // Log the approaching SLA
    this.structuredLogger.logBusinessEvent(
      'sla_approaching',
      'lead',
      lead.id,
      {
        metadata: {
          tenantId: lead.tenantId,
          tenantSlug: lead.tenant?.slug,
          slaDeadline: lead.slaDeadline?.toISOString(),
          severity: lead.severity,
          timeRemainingHours: lead.slaDeadline 
            ? Math.max(0, (lead.slaDeadline.getTime() - Date.now()) / (1000 * 60 * 60))
            : undefined
        }
      }
    );
    
    // Increment metrics
    this.metrics.increment('sla_approaching_total', {
      tenant: lead.tenant?.slug || 'unknown',
      severity: lead.severity || 'unknown'
    });
    
    // TODO: Send notification to appropriate channels
    // This could be email, Slack, or other notification systems
    this.logger.warn(
      `SLA approaching for lead ${lead.id} (tenant: ${lead.tenant?.slug || 'unknown'})`
    );
  }

  /**
   * Handle breached SLA deadline
   */
  private async handleBreachedSla(lead: any) {
    // Log the breached SLA
    this.structuredLogger.logBusinessEvent(
      'sla_breached',
      'lead',
      lead.id,
      {
        metadata: {
          tenantId: lead.tenantId,
          tenantSlug: lead.tenant?.slug,
          slaDeadline: lead.slaDeadline?.toISOString(),
          severity: lead.severity,
          breachDurationHours: lead.slaDeadline 
            ? Math.max(0, (Date.now() - lead.slaDeadline.getTime()) / (1000 * 60 * 60))
            : undefined
        }
      }
    );
    
    // Increment metrics
    this.metrics.increment('sla_breached_total', {
      tenant: lead.tenant?.slug || 'unknown',
      severity: lead.severity || 'unknown'
    });
    
    // TODO: Send alert notification to appropriate channels
    // This could be urgent email, Slack alert, or other notification systems
    this.logger.error(
      `SLA breached for lead ${lead.id} (tenant: ${lead.tenant?.slug || 'unknown'})`
    );
  }

  /**
   * Manual trigger for SLA checks (for testing)
   */
  async triggerSlaChecks() {
    await this.checkApproachingSlas();
    await this.checkBreachedSlas();
  }
}