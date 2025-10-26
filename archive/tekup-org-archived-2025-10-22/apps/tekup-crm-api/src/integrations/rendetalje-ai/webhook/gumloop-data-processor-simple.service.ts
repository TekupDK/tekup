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

/**
 * Gumloop Data Processor Service
 * 
 * Simplified processor for initial webhook implementation.
 * Handles data validation and basic transformation.
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

    // If estimation failed, use basic fallback
    if (!results.estimation || results.estimation.confidence < 0.5) {
      this.logger.log('Supplementing estimation data with fallback');
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
   * Create or update customer (simplified for initial implementation)
   */
  async createOrUpdateCustomer(leadData: any): Promise<string> {
    // For now, just create a simple record and return a UUID
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`Creating customer record: ${customerId} for ${leadData.customerEmail}`);
    
    // TODO: Implement actual database storage when Prisma schemas are ready
    return customerId;
  }

  /**
   * Create deal/opportunity (simplified)
   */
  async createDeal(dealData: any): Promise<string> {
    const dealId = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`Creating deal record: ${dealId} for customer ${dealData.customerId}`);
    
    // TODO: Implement actual database storage when Prisma schemas are ready
    return dealId;
  }

  /**
   * Prepare pending calendar bookings (simplified)
   */
  async preparePendingBookings(dealId: string, slots: any[]): Promise<void> {
    this.logger.log(`Preparing ${slots.length} calendar slots for deal ${dealId}`);
    
    // TODO: Implement actual calendar integration
  }

  /**
   * Log duplicate lead detection
   */
  async logDuplicateLead(payload: GumloopWebhookPayload): Promise<void> {
    this.logger.warn(`Duplicate lead detected: ${payload.leadData.customerEmail}`);
    
    // TODO: Implement database logging
  }

  /**
   * Create manual review task
   */
  async createManualReview(payload: GumloopWebhookPayload): Promise<string> {
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`Creating manual review: ${reviewId} for ${payload.leadData.customerEmail}`);
    
    // TODO: Implement actual review system
    return reviewId;
  }

  /**
   * Send direct email to customer (mock implementation)
   */
  async sendDirectEmail(customerEmail: string, response: any): Promise<boolean> {
    this.logger.log(`Mock: Sending direct email to ${customerEmail}`);
    this.logger.debug(`Subject: ${response.subject}`);
    
    // TODO: Implement actual email sending via Google Workspace
    return true;
  }

  /**
   * Send new email thread (mock implementation)
   */
  async sendNewEmailThread(customerEmail: string, response: any): Promise<boolean> {
    this.logger.log(`Mock: Creating new email thread for ${customerEmail}`);
    this.logger.debug(`Subject: ${response.subject}`);
    
    // TODO: Implement actual email sending
    return true;
  }

  /**
   * Send reply email (mock implementation)
   */
  async sendReplyEmail(originalMessageId: string, response: any): Promise<boolean> {
    this.logger.log(`Mock: Replying to message ${originalMessageId}`);
    this.logger.debug(`Subject: ${response.subject}`);
    
    // TODO: Implement actual email reply
    return true;
  }

  /**
   * Log lead processing for analytics (simplified)
   */
  async logLeadProcessing(logData: any): Promise<void> {
    this.logger.log(`Processing completed: ${logData.executionId} -> ${logData.dealId}`);
    
    // TODO: Implement analytics database
  }

  /**
   * Log webhook received for monitoring (simplified)
   */
  async logWebhookReceived(payload: GumloopWebhookPayload, actions: string[], processingTime: number): Promise<void> {
    this.logger.log(`Webhook logged: ${payload.executionId}, actions: [${actions.join(', ')}], time: ${processingTime}ms`);
    
    // TODO: Implement webhook logging database
  }

  /**
   * Log webhook error for monitoring (simplified)
   */
  async logWebhookError(payload: GumloopWebhookPayload, error: Error, processingTime: number): Promise<void> {
    this.logger.error(`Webhook error logged: ${payload.executionId}, error: ${error.message}, time: ${processingTime}ms`);
    
    // TODO: Implement error logging database
  }

  // Helper methods
  private calculateFallbackHours(leadData: any): number {
    const squareMeters = leadData.squareMeters || 80;
    return Math.ceil(squareMeters / 40); // 40 m²/hour baseline
  }

  private calculateFallbackPrice(leadData: any): number {
    const hours = this.calculateFallbackHours(leadData);
    return hours * 349; // 349 DKK/hour
  }

  private async generateDefaultCalendarSlots(): Promise<any[]> {
    // Generate next 3 weekdays as options
    const slots: any[] = [];
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
}