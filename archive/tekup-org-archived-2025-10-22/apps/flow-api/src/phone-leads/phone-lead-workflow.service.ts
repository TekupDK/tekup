import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SMSService } from '../sms/sms.service.js';
import { LeadService } from '../lead/lead.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLoggerService } from '../common/logging/structured-logger.service.js';

@Injectable()
export class PhoneLeadWorkflowService {
  private readonly logger = new Logger(PhoneLeadWorkflowService.name);

  constructor(
    private prisma: PrismaService,
    private smsService: SMSService,
    private leadService: LeadService,
    private metrics: MetricsService,
    private structuredLogger: StructuredLoggerService
  ) {}

  /**
   * Process phone call leads automatically
   */
  async processPhoneLead(leadId: string, tenantId: string): Promise<void> {
    try {
      this.logger.log(`Processing phone lead: ${leadId}`);

      // Get lead details
      const lead = await this.prisma.lead.findFirst({
        where: { id: leadId, tenantId }
      });

      if (!lead) {
        this.logger.warn(`Lead not found: ${leadId}`);
        return;
      }

      // Check if this is a phone call lead
      const payload = lead.payload as any;
      if (payload?.lead_type !== 'phone_call' || !payload?.phone) {
        this.logger.log(`Lead ${leadId} is not a phone call lead, skipping SMS workflow`);
        return;
      }

      // Check if SMS already sent
      const existingSMS = await this.prisma.smsTracking.findFirst({
        where: { leadId }
      });

      if (existingSMS) {
        this.logger.log(`SMS already sent for lead ${leadId}`);
        return;
      }

      // Send SMS
      await this.smsService.sendPhoneLeadSMS(leadId, tenantId, payload.phone);

      // Update lead status to indicate SMS sent
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { 
          status: 'CONTACTED',
          payload: {
            ...payload,
            sms_sent: true,
            sms_sent_at: new Date().toISOString()
          }
        }
      });

      // Create lead event
      await this.prisma.leadEvent.create({
        data: {
          leadId,
          fromStatus: 'NEW',
          toStatus: 'CONTACTED',
          notes: 'SMS sent automatically for phone call lead',
          metadata: {
            action: 'sms_sent',
            phone: payload.phone,
            lead_type: 'phone_call'
          }
        }
      });

      this.metrics.increment('phone_lead_sms_sent_total', { 
        tenant: tenantId,
        source: lead.source
      });

      this.structuredLogger.logBusinessEvent(
        'phone_lead_sms_sent',
        'lead',
        leadId,
        {
          tenantId,
          phone: payload.phone,
          source: lead.source,
          leadType: 'phone_call'
        }
      );

      this.logger.log(`Phone lead SMS workflow completed for lead: ${leadId}`);
    } catch (error) {
      this.logger.error(`Failed to process phone lead ${leadId}:`, error);
      this.metrics.increment('phone_lead_workflow_failed_total', { 
        tenant: tenantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process all pending phone leads for a tenant
   */
  async processPendingPhoneLeads(tenantId: string): Promise<{ processed: number; errors: number }> {
    try {
      this.logger.log(`Processing pending phone leads for tenant: ${tenantId}`);

      // Find all phone call leads that haven't had SMS sent
      const phoneLeads = await this.prisma.lead.findMany({
        where: {
          tenantId,
          status: 'NEW',
          payload: {
            path: ['lead_type'],
            equals: 'phone_call'
          }
        }
      });

      let processed = 0;
      let errors = 0;

      for (const lead of phoneLeads) {
        try {
          await this.processPhoneLead(lead.id, tenantId);
          processed++;
        } catch (error) {
          this.logger.error(`Failed to process phone lead ${lead.id}:`, error);
          errors++;
        }
      }

      this.logger.log(`Processed ${processed} phone leads, ${errors} errors for tenant: ${tenantId}`);
      return { processed, errors };
    } catch (error) {
      this.logger.error(`Failed to process pending phone leads for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get phone lead statistics for a tenant
   */
  async getPhoneLeadStats(tenantId: string, dateRange?: { from: Date; to: Date }) {
    const where: any = {
      tenantId,
      payload: {
        path: ['lead_type'],
        equals: 'phone_call'
      }
    };

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to
      };
    }

    const [total, contacted, converted] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ 
        where: { ...where, status: 'CONTACTED' }
      }),
      this.prisma.lead.count({ 
        where: { ...where, status: 'CONVERTED' }
      })
    ]);

    // Get SMS analytics
    const smsAnalytics = await this.smsService.getSMSAnalytics(tenantId, dateRange);

    return {
      totalPhoneLeads: total,
      contactedPhoneLeads: contacted,
      convertedPhoneLeads: converted,
      contactRate: total > 0 ? (contacted / total) * 100 : 0,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
      smsAnalytics
    };
  }

  /**
   * Schedule automatic processing of phone leads
   */
  async schedulePhoneLeadProcessing(tenantId: string) {
    // This would typically be called by a cron job or scheduler
    // For now, we'll just process immediately
    return this.processPendingPhoneLeads(tenantId);
  }
}