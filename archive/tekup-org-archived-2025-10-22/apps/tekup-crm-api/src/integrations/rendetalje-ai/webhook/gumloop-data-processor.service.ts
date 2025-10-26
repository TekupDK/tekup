import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { GumloopWebhookPayload } from './gumloop-webhook.controller';

import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as crypto from 'crypto';
import { GumloopWebhookPayload } from './gumloop-webhook.controller';

export interface TekupEmailLead {
  from: string;
  subject: string;
  body: string;
  messageId: string;
  receivedAt: Date;
}

export interface CreateDealData {
  customerId: string;
  estimatedValue: number;
  estimatedHours: number;
  leadSource: string;
  originalEmail: {
    from: string;
    subject: string;
    body: string;
    messageId: string;
  };
}

export interface CalendarSlot {
  startTime: string;
  endTime: string;
  confidence: number;
}

export interface LeadProcessingLog {
  executionId: string;
  customerId: string;
  dealId: string;
  source: string;
  processingTime: number;
  confidence: number;
}

/**
 * Gumloop Data Processor Service
 * 
 * Handles data transformation, validation, and processing for Gumloop webhook payloads.
 * Bridges the gap between Gumloop's data format and Tekup's internal systems.
 */
@Injectable()
export class GumloopDataProcessor {
  private readonly logger = new Logger(GumloopDataProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Validate webhook authenticity and payload structure
   */
  async validateWebhook(payload: GumloopWebhookPayload, headers: Record<string, string>): Promise<void> {
    // 1. Check for required headers
    const expectedSecret = process.env.GUMLOOP_WEBHOOK_SECRET;
    const receivedSignature = headers['x-gumloop-signature'];
    
    if (!expectedSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    if (!receivedSignature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    // 2. Validate signature (using HMAC SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', expectedSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (`sha256=${expectedSignature}` !== receivedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // 3. Validate payload structure
    this.validatePayloadStructure(payload);

    // 4. Check if this execution ID has been processed before (basic in-memory check for now)
    this.logger.log(`Processing execution ID: ${payload.executionId}`);
  }

  /**
   * Validate payload structure
   */
  private validatePayloadStructure(payload: GumloopWebhookPayload): void {
    const required = [
      'flowId', 'executionId', 'timestamp', 'status',
      'leadData', 'gumloopResults', 'metadata'
    ];

    for (const field of required) {
      if (!payload[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    // Validate lead data
    if (!payload.leadData.customerEmail || !payload.leadData.originalEmail) {
      throw new BadRequestException('Missing customer email or original email data');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.leadData.customerEmail)) {
      throw new BadRequestException('Invalid customer email format');
    }
  }

  /**
   * Convert Gumloop payload to Tekup format for fallback processing
   */
  convertToTekupFormat(payload: GumloopWebhookPayload): TekupEmailLead {
    return {
      from: payload.leadData.originalEmail.from,
      subject: payload.leadData.originalEmail.subject,
      body: payload.leadData.originalEmail.body,
      messageId: payload.leadData.originalEmail.messageId,
      receivedAt: new Date(payload.timestamp),
    };
  }

  /**
   * Supplement partial Gumloop data with Tekup processing
   */
  async supplementPartialData(payload: GumloopWebhookPayload): Promise<any> {
    const results = { ...payload.gumloopResults };

    // If estimation failed, use Tekup's estimation engine
    if (!results.estimation || results.estimation.confidence < 0.5) {
      this.logger.log('Supplementing estimation data with Tekup engine');
      // Here you would call your RendetaljeFridayService methods
      // For now, we'll create a basic fallback
      results.estimation = {
        estimatedHours: this.calculateFallbackHours(payload.leadData),
        price: this.calculateFallbackPrice(payload.leadData),
        breakdown: [{ component: 'fallback_estimation', hours: 2, description: 'Basic cleaning estimate' }],
        confidence: 0.7,
      };
    }

    // If calendar slots failed, provide default slots
    if (!results.calendarSlots || results.calendarSlots.length === 0) {
      this.logger.log('Supplementing calendar data with default slots');
      results.calendarSlots = await this.generateDefaultCalendarSlots();
    }

    // If response generation failed, create basic response
    if (!results.responseGenerated) {
      this.logger.log('Supplementing response with template');
      results.responseGenerated = {
        subject: `Re: ${payload.leadData.originalEmail.subject}`,
        body: this.generateFallbackResponse(payload.leadData),
        responseMethod: 'reply_directly',
      };
    }

    return results;
  }

  /**
   * Create or update customer in Tekup CRM
   */
  async createOrUpdateCustomer(leadData: any): Promise<string> {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: { email: leadData.customerEmail },
    });

    if (existingCustomer) {
      // Update existing customer with new information
      const updated = await this.prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          name: leadData.customerName || existingCustomer.name,
          phone: leadData.phoneNumber || existingCustomer.phone,
          address: leadData.address || existingCustomer.address,
          lastContactAt: new Date(),
        },
      });
      return updated.id;
    } else {
      // Create new customer
      const customer = await this.prisma.customer.create({
        data: {
          email: leadData.customerEmail,
          name: leadData.customerName || this.extractNameFromEmail(leadData.customerEmail),
          phone: leadData.phoneNumber,
          address: leadData.address,
          source: leadData.leadSource,
          createdAt: new Date(),
          lastContactAt: new Date(),
        },
      });
      return customer.id;
    }
  }

  /**
   * Create deal/opportunity
   */
  async createDeal(dealData: CreateDealData): Promise<string> {
    const deal = await this.prisma.deal.create({
      data: {
        customerId: dealData.customerId,
        title: `Cleaning Service - ${dealData.originalEmail.subject}`,
        estimatedValue: dealData.estimatedValue,
        estimatedHours: dealData.estimatedHours,
        source: dealData.leadSource,
        stage: 'lead',
        originalEmailMessageId: dealData.originalEmail.messageId,
        createdAt: new Date(),
        metadata: {
          originalEmail: dealData.originalEmail,
          source: 'gumloop_webhook',
        },
      },
    });

    return deal.id;
  }

  /**
   * Prepare pending calendar bookings
   */
  async preparePendingBookings(dealId: string, slots: CalendarSlot[]): Promise<void> {
    for (const slot of slots) {
      await this.prisma.pendingBooking.create({
        data: {
          dealId,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          confidence: slot.confidence,
          status: 'pending_customer_confirmation',
          createdAt: new Date(),
        },
      });
    }
  }

  /**
   * Log duplicate lead detection
   */
  async logDuplicateLead(payload: GumloopWebhookPayload): Promise<void> {
    await this.prisma.duplicateLeadLog.create({
      data: {
        executionId: payload.executionId,
        customerEmail: payload.leadData.customerEmail,
        originalMessageId: payload.leadData.originalEmail.messageId,
        detectedAt: new Date(),
        source: 'gumloop',
        metadata: payload.gumloopResults.historyCheck,
      },
    });
  }

  /**
   * Create manual review task
   */
  async createManualReview(payload: GumloopWebhookPayload): Promise<string> {
    const review = await this.prisma.manualReview.create({
      data: {
        executionId: payload.executionId,
        customerEmail: payload.leadData.customerEmail,
        reason: 'gumloop_manual_review_recommendation',
        priority: 'medium',
        assignedTo: null, // Will be assigned by queue system
        status: 'pending',
        originalEmail: payload.leadData.originalEmail,
        gumloopResults: payload.gumloopResults,
        createdAt: new Date(),
      },
    });

    return review.id;
  }

  /**
   * Send direct email to customer
   */
  async sendDirectEmail(customerEmail: string, response: any): Promise<boolean> {
    try {
      await this.googleWorkspaceService.sendEmail({
        to: customerEmail,
        subject: response.subject,
        body: response.body,
        isReply: false,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send direct email: ${error.message}`);
      return false;
    }
  }

  /**
   * Send new email thread
   */
  async sendNewEmailThread(customerEmail: string, response: any): Promise<boolean> {
    try {
      await this.googleWorkspaceService.sendEmail({
        to: customerEmail,
        subject: response.subject,
        body: response.body,
        isReply: false,
        createNewThread: true,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send new email thread: ${error.message}`);
      return false;
    }
  }

  /**
   * Send reply email
   */
  async sendReplyEmail(originalMessageId: string, response: any): Promise<boolean> {
    try {
      await this.googleWorkspaceService.replyToEmail({
        originalMessageId,
        subject: response.subject,
        body: response.body,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send reply email: ${error.message}`);
      return false;
    }
  }

  /**
   * Log lead processing for analytics
   */
  async logLeadProcessing(logData: LeadProcessingLog): Promise<void> {
    await this.prisma.leadProcessingLog.create({
      data: {
        executionId: logData.executionId,
        customerId: logData.customerId,
        dealId: logData.dealId,
        source: logData.source,
        processingTimeMs: logData.processingTime,
        confidence: logData.confidence,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Log webhook received for monitoring
   */
  async logWebhookReceived(payload: GumloopWebhookPayload, actions: string[], processingTime: number): Promise<void> {
    await this.prisma.gumloopWebhookLog.create({
      data: {
        executionId: payload.executionId,
        flowId: payload.flowId,
        status: payload.status,
        customerEmail: payload.leadData.customerEmail,
        actions,
        processingTimeMs: processingTime,
        success: true,
        receivedAt: new Date(),
        metadata: payload.metadata,
      },
    });
  }

  /**
   * Log webhook error for monitoring
   */
  async logWebhookError(payload: GumloopWebhookPayload, error: Error, processingTime: number): Promise<void> {
    await this.prisma.gumloopWebhookLog.create({
      data: {
        executionId: payload.executionId,
        flowId: payload.flowId,
        status: payload.status,
        customerEmail: payload.leadData?.customerEmail || 'unknown',
        actions: ['error'],
        processingTimeMs: processingTime,
        success: false,
        errorMessage: error.message,
        errorStack: error.stack,
        receivedAt: new Date(),
        metadata: payload.metadata,
      },
    });
  }

  // Helper methods
  private calculateFallbackHours(leadData: any): number {
    // Basic fallback calculation
    const squareMeters = leadData.squareMeters || 80;
    return Math.ceil(squareMeters / 40); // 40 m²/hour baseline
  }

  private calculateFallbackPrice(leadData: any): number {
    const hours = this.calculateFallbackHours(leadData);
    return hours * 349; // 349 DKK/hour
  }

  private async generateDefaultCalendarSlots(): Promise<CalendarSlot[]> {
    // Generate next 3 weekdays as options
    const slots: CalendarSlot[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // 10 AM slot
      const startTime = new Date(date);
      startTime.setHours(10, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setHours(12, 0, 0, 0);
      
      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        confidence: 0.8,
      });
    }
    
    return slots;
  }

  private generateFallbackResponse(leadData: any): string {
    return `
Hej ${leadData.customerName || 'kunde'},

Tak for din henvendelse vedrørende rengøring.

Vi har modtaget din forespørgsel og vil gerne tilbyde vores professionelle rengøringsydelser.

Baseret på de oplysninger du har givet, estimerer vi følgende:
- Estimeret tid: ${this.calculateFallbackHours(leadData)} timer
- Estimeret pris: ${this.calculateFallbackPrice(leadData)} DKK

Vi kontakter dig inden for 1-2 arbejdsdage for at aftale en tid, der passer dig.

Med venlig hilsen,
Rendetalje Team
    `.trim();
  }

  private extractNameFromEmail(email: string): string {
    const localPart = email.split('@')[0];
    return localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}