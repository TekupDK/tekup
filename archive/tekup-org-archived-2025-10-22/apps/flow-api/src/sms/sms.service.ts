import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { StructuredLoggerService } from '../common/logging/structured-logger.service.js';

export interface SMSMessage {
  to: string;
  message: string;
  trackingUrl?: string;
  leadId?: string;
  tenantId: string;
}

export interface SMSTrackingData {
  leadId: string;
  tenantId: string;
  phoneNumber: string;
  messageId: string;
  trackingUrl: string;
  sentAt: Date;
  clickedAt?: Date;
  convertedAt?: Date;
}

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  private readonly smsProvider: 'twilio' | 'messagebird' | 'mock';
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly fromNumber: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private metrics: MetricsService,
    private structuredLogger: StructuredLoggerService
  ) {
    this.smsProvider = this.configService.get('SMS_PROVIDER', 'mock') as 'twilio' | 'messagebird' | 'mock';
    this.apiKey = this.configService.get('SMS_API_KEY', '');
    this.apiSecret = this.configService.get('SMS_API_SECRET', '');
    this.fromNumber = this.configService.get('SMS_FROM_NUMBER', '+4512345678');
  }

  /**
   * Send SMS with tracking for phone leads
   */
  async sendPhoneLeadSMS(leadId: string, tenantId: string, phoneNumber: string): Promise<SMSTrackingData> {
    try {
      // Generate tracking URL
      const trackingUrl = await this.generateTrackingUrl(leadId, tenantId);
      
      // Create SMS message
      const message = this.createPhoneLeadMessage(trackingUrl);
      
      // Send SMS
      const messageId = await this.sendSMS({
        to: phoneNumber,
        message,
        trackingUrl,
        leadId,
        tenantId
      });

      // Store tracking data
      const trackingData: SMSTrackingData = {
        leadId,
        tenantId,
        phoneNumber,
        messageId,
        trackingUrl,
        sentAt: new Date()
      };

      await this.storeTrackingData(trackingData);

      // Update metrics
      this.metrics.increment('sms_sent_total', { 
        tenant: tenantId, 
        type: 'phone_lead',
        provider: this.smsProvider 
      });

      this.structuredLogger.logBusinessEvent(
        'sms_sent',
        'sms',
        messageId,
        {
          leadId,
          tenantId,
          phoneNumber,
          messageLength: message.length,
          trackingUrl
        }
      );

      return trackingData;
    } catch (error) {
      this.logger.error('Failed to send phone lead SMS', error);
      this.metrics.increment('sms_send_failed_total', { 
        tenant: tenantId, 
        type: 'phone_lead',
        provider: this.smsProvider 
      });
      throw error;
    }
  }

  /**
   * Track SMS link click
   */
  async trackSMSClick(trackingId: string): Promise<void> {
    try {
      const trackingData = await this.prisma.smsTracking.findUnique({
        where: { trackingId }
      });

      if (!trackingData) {
        this.logger.warn(`SMS tracking data not found for ID: ${trackingId}`);
        return;
      }

      // Update click timestamp
      await this.prisma.smsTracking.update({
        where: { trackingId },
        data: { clickedAt: new Date() }
      });

      // Update lead status to CONTACTED
      await this.prisma.lead.update({
        where: { id: trackingData.leadId },
        data: { status: 'CONTACTED' }
      });

      this.metrics.increment('sms_clicked_total', { 
        tenant: trackingData.tenantId,
        leadId: trackingData.leadId
      });

      this.structuredLogger.logBusinessEvent(
        'sms_clicked',
        'sms',
        trackingId,
        {
          leadId: trackingData.leadId,
          tenantId: trackingData.tenantId,
          phoneNumber: trackingData.phoneNumber
        }
      );
    } catch (error) {
      this.logger.error('Failed to track SMS click', error);
      throw error;
    }
  }

  /**
   * Track conversion from SMS
   */
  async trackSMSConversion(leadId: string): Promise<void> {
    try {
      const trackingData = await this.prisma.smsTracking.findFirst({
        where: { leadId }
      });

      if (!trackingData) {
        this.logger.warn(`SMS tracking data not found for lead: ${leadId}`);
        return;
      }

      // Update conversion timestamp
      await this.prisma.smsTracking.update({
        where: { id: trackingData.id },
        data: { convertedAt: new Date() }
      });

      // Update lead status to CONVERTED
      await this.prisma.lead.update({
        where: { id: leadId },
        data: { status: 'CONVERTED' }
      });

      this.metrics.increment('sms_converted_total', { 
        tenant: trackingData.tenantId,
        leadId: leadId
      });

      this.structuredLogger.logBusinessEvent(
        'sms_converted',
        'sms',
        trackingData.trackingId,
        {
          leadId,
          tenantId: trackingData.tenantId,
          phoneNumber: trackingData.phoneNumber
        }
      );
    } catch (error) {
      this.logger.error('Failed to track SMS conversion', error);
      throw error;
    }
  }

  private createPhoneLeadMessage(trackingUrl: string): string {
    return `Hej, du har kontaktet Rendetalje. Book nemt her: ${trackingUrl}. Vi vender hurtigt tilbage, hvis du ønsker en fast aftale.`;
  }

  private async generateTrackingUrl(leadId: string, tenantId: string): Promise<string> {
    const baseUrl = this.configService.get('SMS_TRACKING_BASE_URL', 'https://api.tekup.dk/sms/track');
    const trackingId = `${tenantId}_${leadId}_${Date.now()}`;
    return `${baseUrl}/${trackingId}`;
  }

  private async sendSMS(sms: SMSMessage): Promise<string> {
    switch (this.smsProvider) {
      case 'twilio':
        return this.sendViaTwilio(sms);
      case 'messagebird':
        return this.sendViaMessageBird(sms);
      case 'mock':
      default:
        return this.sendViaMock(sms);
    }
  }

  private async sendViaTwilio(sms: SMSMessage): Promise<string> {
    // Implementation for Twilio SMS API
    const twilio = require('twilio');
    const client = twilio(this.apiKey, this.apiSecret);
    
    const message = await client.messages.create({
      body: sms.message,
      from: this.fromNumber,
      to: sms.to
    });

    return message.sid;
  }

  private async sendViaMessageBird(sms: SMSMessage): Promise<string> {
    // Implementation for MessageBird SMS API
    const messagebird = require('messagebird')(this.apiKey);
    
    return new Promise((resolve, reject) => {
      messagebird.messages.create({
        originator: this.fromNumber,
        recipients: [sms.to],
        body: sms.message
      }, (err: any, response: any) => {
        if (err) reject(err);
        else resolve(response.id);
      });
    });
  }

  private async sendViaMock(sms: SMSMessage): Promise<string> {
    // Mock implementation for development/testing
    this.logger.log(`[MOCK SMS] To: ${sms.to}, Message: ${sms.message}`);
    return `mock_${Date.now()}`;
  }

  private async storeTrackingData(data: SMSTrackingData): Promise<void> {
    await this.prisma.smsTracking.create({
      data: {
        trackingId: data.trackingUrl.split('/').pop() || '',
        leadId: data.leadId,
        tenantId: data.tenantId,
        phoneNumber: data.phoneNumber,
        messageId: data.messageId,
        trackingUrl: data.trackingUrl,
        sentAt: data.sentAt,
        clickedAt: data.clickedAt,
        convertedAt: data.convertedAt
      }
    });
  }

  /**
   * Get SMS analytics for a tenant
   */
  async getSMSAnalytics(tenantId: string, dateRange?: { from: Date; to: Date }) {
    const where: any = { tenantId };
    
    if (dateRange) {
      where.sentAt = {
        gte: dateRange.from,
        lte: dateRange.to
      };
    }

    const [total, clicked, converted] = await Promise.all([
      this.prisma.smsTracking.count({ where }),
      this.prisma.smsTracking.count({ where: { ...where, clickedAt: { not: null } } }),
      this.prisma.smsTracking.count({ where: { ...where, convertedAt: { not: null } } })
    ]);

    return {
      totalSent: total,
      totalClicked: clicked,
      totalConverted: converted,
      clickRate: total > 0 ? (clicked / total) * 100 : 0,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
      clickToConversionRate: clicked > 0 ? (converted / clicked) * 100 : 0
    };
  }
}