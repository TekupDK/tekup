import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GmailMonitorService } from './services/gmail-monitor.service';
import { LeadIntelligenceService } from './services/lead-intelligence.service';
import { EstimationEngineService } from './services/estimation-engine.service';
import { CustomerHistoryService } from './services/customer-history.service';
import { CalendarOptimizationService } from './services/calendar-optimization.service';
import { ResponseDraftService } from './services/response-draft.service';
import { BillyIntegrationService } from './services/billy-integration.service';
import { AnalyticsLoggerService } from './services/analytics-logger.service';

export interface FridayProcessingResult {
  success: boolean;
  action: 'quote_sent' | 'info_requested' | 'duplicate_detected' | 'manual_review' | 'error';
  messageId?: string;
  customerId?: string;
  estimatedHours?: number;
  price?: number;
  proposedSlots?: Date[];
  error?: string;
}

export interface EmailLead {
  messageId: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
  source: 'leadpoint' | 'rengoring.nu' | 'direct' | 'adhelp' | 'other';
}

export interface GumloopWebhookPayload {
  flowId: string;
  executionId: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  leadData: {
    customerEmail: string;
    customerName?: string;
    leadSource: 'leadpoint' | 'rengoring.nu' | 'direct' | 'adhelp' | 'other';
    cleaningType: string;
    squareMeters?: number;
    address?: string;
    desiredDate?: string;
    phoneNumber?: string;
    originalEmail: {
      from: string;
      subject: string;
      body: string;
      messageId: string;
    };
  };
  gumloopResults: {
    historyCheck: {
      hasPreviousQuote: boolean;
      lastQuoteDate?: string;
      recommendation: 'proceed' | 'duplicate_detected' | 'manual_review';
    };
    estimation: {
      estimatedHours: number;
      price: number;
      breakdown: Array<{ component: string; hours: number; description: string }>;
      confidence: number;
    };
    calendarSlots: Array<{
      startTime: string;
      endTime: string;
      confidence: number;
    }>;
    responseGenerated: {
      subject: string;
      body: string;
      responseMethod: 'reply_directly' | 'create_new_email' | 'send_to_customer_only';
    };
  };
  metadata: {
    processingTimeMs: number;
    nodeExecutions: number;
    errorCount: number;
    warningCount: number;
  };
}

/**
 * Rendetalje Friday AI Service
 * 
 * Main orchestrator for the autonomous cleaning service AI assistant.
 * Processes Gmail leads through the complete workflow:
 * 
 * 1. Email monitoring and classification
 * 2. Customer history analysis (duplicate prevention)
 * 3. Lead intelligence extraction (address, m², type)
 * 4. Time and price estimation (349 kr/time)
 * 5. Calendar availability optimization
 * 6. Professional response drafting
 * 7. Email sending (respecting source rules)
 * 8. Analytics logging for continuous improvement
 */
@Injectable()
export class RendetaljeFridayService {
  private readonly logger = new Logger(RendetaljeFridayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmailMonitor: GmailMonitorService,
    private readonly leadIntelligence: LeadIntelligenceService,
    private readonly estimationEngine: EstimationEngineService,
    private readonly customerHistory: CustomerHistoryService,
    private readonly calendarOptimization: CalendarOptimizationService,
    private readonly responseDraft: ResponseDraftService,
    private readonly billyIntegration: BillyIntegrationService,
    private readonly analyticsLogger: AnalyticsLoggerService,
  ) {}

  /**
   * Process new Gmail lead through complete Friday workflow
   */
  async processEmailLead(email: EmailLead): Promise<FridayProcessingResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing lead from ${email.from} - Subject: ${email.subject}`);

      // 1. Check customer history for duplicates
      const historyCheck = await this.customerHistory.analyzeCustomerHistory(email.from);
      if (historyCheck.hasPreviousQuote) {
        await this.analyticsLogger.logLeadProcessing(email, 'duplicate_detected', Date.now() - startTime);
        return {
          success: false,
          action: 'duplicate_detected',
          error: `Previous quote found from ${historyCheck.lastQuoteDate}`,
        };
      }

      // 2. Extract lead intelligence
      const leadData = await this.leadIntelligence.extractLeadData(email);
      if (leadData.missingCriticalInfo) {
        // Send info request email
        const infoRequest = await this.responseDraft.generateInfoRequest(leadData);
        await this.gmailMonitor.sendEmail(email.from, infoRequest, email.source);
        
        await this.analyticsLogger.logLeadProcessing(email, 'info_requested', Date.now() - startTime);
        return {
          success: true,
          action: 'info_requested',
          messageId: email.messageId,
        };
      }

      // 3. Calculate time and price estimate
      const estimation = await this.estimationEngine.calculateEstimate({
        cleaningType: leadData.cleaningType,
        squareMeters: leadData.squareMeters,
        rooms: leadData.rooms,
        bathrooms: leadData.bathrooms,
        firstTime: !historyCheck.hasServiceHistory,
        extras: leadData.extras,
      });

      // 4. Get available calendar slots
      const availableSlots = await this.calendarOptimization.getOptimalSlots(
        leadData.desiredDate || new Date(),
        estimation.estimatedHours,
        estimation.teamSize || 1
      );

      // 5. Generate professional response
      const response = await this.responseDraft.generateQuoteResponse({
        email,
        leadData,
        estimation,
        availableSlots: availableSlots.slice(0, 3), // Top 3 suggestions
      });

      // 6. Send response (respecting source rules)
      const sentMessage = await this.gmailMonitor.sendEmail(
        leadData.customerEmail || email.from,
        response,
        email.source
      );

      // 7. Log to analytics
      await this.analyticsLogger.logLeadProcessing(email, 'quote_sent', Date.now() - startTime, {
        estimatedHours: estimation.estimatedHours,
        price: estimation.price,
        slotsOffered: availableSlots.length,
      });

      this.logger.log(`Successfully processed lead ${email.messageId} in ${Date.now() - startTime}ms`);

      return {
        success: true,
        action: 'quote_sent',
        messageId: sentMessage.messageId,
        customerId: leadData.customerEmail,
        estimatedHours: estimation.estimatedHours,
        price: estimation.price,
        proposedSlots: availableSlots.slice(0, 3),
      };

    } catch (error) {
      this.logger.error(`Error processing lead ${email.messageId}:`, error);
      
      await this.analyticsLogger.logLeadProcessing(email, 'error', Date.now() - startTime, {
        error: error.message,
      });

      return {
        success: false,
        action: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Process Gumloop webhook payload
   * 
   * Hybrid approach: Leverage Gumloop's AI processing while maintaining
   * Tekup's data sovereignty and business logic control.
   */
  async processGumloopWebhook(payload: GumloopWebhookPayload): Promise<FridayProcessingResult> {
    const startTime = Date.now();
    this.logger.log(`Processing Gumloop webhook: ${payload.executionId} from ${payload.leadData.customerEmail}`);

    try {
      // Validate payload structure
      this.validateGumloopPayload(payload);

      if (payload.status === 'success') {
        return await this.processGumloopSuccess(payload, startTime);
        
      } else if (payload.status === 'error') {
        // Fall back to Tekup's internal processing
        this.logger.warn(`Gumloop processing failed for ${payload.executionId}, falling back to Tekup processing`);
        
        const emailLead = this.convertGumloopToEmailLead(payload);
        return await this.processEmailLead(emailLead);
        
      } else if (payload.status === 'partial') {
        // Process partial results with Tekup supplementation
        this.logger.log(`Processing partial Gumloop results for ${payload.executionId}`);
        
        const supplementedPayload = await this.supplementPartialGumloopData(payload);
        return await this.processGumloopSuccess(supplementedPayload, startTime);
      }

      return {
        success: false,
        action: 'error',
        error: `Unknown Gumloop status: ${payload.status}`,
      };

    } catch (error) {
      this.logger.error(`Failed to process Gumloop webhook: ${error.message}`, error.stack);
      
      // Log error for analytics
      await this.logGumloopWebhookError(payload, error, Date.now() - startTime);

      return {
        success: false,
        action: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Validate Gumloop webhook payload structure
   */
  private validateGumloopPayload(payload: GumloopWebhookPayload): void {
    const required = ['flowId', 'executionId', 'timestamp', 'status', 'leadData'];
    for (const field of required) {
      if (!payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!payload.leadData.customerEmail || !payload.leadData.originalEmail) {
      throw new Error('Missing customer email or original email data');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.leadData.customerEmail)) {
      throw new Error('Invalid customer email format');
    }
  }

  /**
   * Process successful Gumloop webhook results
   */
  private async processGumloopSuccess(payload: GumloopWebhookPayload, startTime: number): Promise<FridayProcessingResult> {
    // Check Gumloop's recommendation
    if (payload.gumloopResults.historyCheck.recommendation === 'duplicate_detected') {
      this.logger.log(`Duplicate lead detected by Gumloop: ${payload.leadData.customerEmail}`);
      
      await this.analyticsLogger.logLeadProcessing(
        this.convertGumloopToEmailLead(payload),
        'duplicate_detected',
        Date.now() - startTime,
        { source: 'gumloop', executionId: payload.executionId }
      );

      return {
        success: true,
        action: 'duplicate_detected',
        customerId: payload.leadData.customerEmail,
      };
    }

    if (payload.gumloopResults.historyCheck.recommendation === 'manual_review') {
      this.logger.log(`Manual review required for: ${payload.leadData.customerEmail}`);
      
      await this.analyticsLogger.logLeadProcessing(
        this.convertGumloopToEmailLead(payload),
        'manual_review',
        Date.now() - startTime,
        { source: 'gumloop', executionId: payload.executionId, reason: 'gumloop_recommendation' }
      );

      return {
        success: true,
        action: 'manual_review',
        customerId: payload.leadData.customerEmail,
      };
    }

    // Process the lead using Gumloop's results
    const emailLead = this.convertGumloopToEmailLead(payload);
    
    // Send email response using Gumloop's generated content
    const emailSent = await this.sendGumloopGeneratedResponse(payload);
    
    // Log successful processing
    await this.analyticsLogger.logLeadProcessing(
      emailLead,
      'quote_sent',
      Date.now() - startTime,
      {
        source: 'gumloop',
        executionId: payload.executionId,
        estimatedHours: payload.gumloopResults.estimation.estimatedHours,
        price: payload.gumloopResults.estimation.price,
        confidence: payload.gumloopResults.estimation.confidence,
        emailSent,
      }
    );

    return {
      success: true,
      action: 'quote_sent',
      messageId: emailLead.messageId,
      customerId: payload.leadData.customerEmail,
      estimatedHours: payload.gumloopResults.estimation.estimatedHours,
      price: payload.gumloopResults.estimation.price,
      proposedSlots: payload.gumloopResults.calendarSlots.map(slot => new Date(slot.startTime)),
    };
  }

  /**
   * Convert Gumloop payload to EmailLead format
   */
  private convertGumloopToEmailLead(payload: GumloopWebhookPayload): EmailLead {
    return {
      messageId: payload.leadData.originalEmail.messageId,
      from: payload.leadData.originalEmail.from,
      subject: payload.leadData.originalEmail.subject,
      body: payload.leadData.originalEmail.body,
      receivedAt: new Date(payload.timestamp),
      source: payload.leadData.leadSource,
    };
  }

  /**
   * Send email response generated by Gumloop
   */
  private async sendGumloopGeneratedResponse(payload: GumloopWebhookPayload): Promise<boolean> {
    try {
      this.logger.log(`Sending Gumloop-generated response to ${payload.leadData.customerEmail}`);
      this.logger.log(`Subject: ${payload.gumloopResults.responseGenerated.subject}`);
      this.logger.log(`Method: ${payload.gumloopResults.responseGenerated.responseMethod}`);
      
      // TODO: Implement actual email sending when Google Workspace integration is available
      // Based on responseMethod:
      // - reply_directly: Reply to original email thread
      // - create_new_email: Start new conversation
      // - send_to_customer_only: Direct customer email (not back to aggregator)
      
      return true; // Mock success for now
      
    } catch (error) {
      this.logger.error(`Failed to send Gumloop-generated email: ${error.message}`);
      return false;
    }
  }

  /**
   * Supplement partial Gumloop data with Tekup processing
   */
  private async supplementPartialGumloopData(payload: GumloopWebhookPayload): Promise<GumloopWebhookPayload> {
    const results = { ...payload.gumloopResults };

    // If estimation failed or has low confidence, use Tekup's estimation engine
    if (!results.estimation || results.estimation.confidence < 0.5) {
      this.logger.log('Supplementing estimation with Tekup engine');
      
      const emailLead = this.convertGumloopToEmailLead(payload);
      const leadData = await this.leadIntelligence.extractLeadData(emailLead.body, emailLead.from);
      const estimation = await this.estimationEngine.calculateEstimate({
        cleaningType: leadData.cleaningType,
        squareMeters: leadData.squareMeters,
        propertyType: leadData.propertyType,
        extras: leadData.extras,
        frequency: leadData.frequency,
        urgency: leadData.urgency,
      });

      results.estimation = {
        estimatedHours: estimation.estimatedHours,
        price: estimation.price,
        breakdown: estimation.breakdown.map(item => ({
          component: item.category,
          hours: item.hours,
          description: item.description,
        })),
        confidence: 0.9, // High confidence in Tekup's deterministic engine
      };
    }

    // If calendar optimization failed, use Tekup's calendar service
    if (!results.calendarSlots || results.calendarSlots.length === 0) {
      this.logger.log('Supplementing calendar slots with Tekup optimization');
      
      const emailLead = this.convertGumloopToEmailLead(payload);
      const leadData = await this.leadIntelligence.extractLeadData(emailLead.body, emailLead.from);
      const availableSlots = await this.calendarOptimization.findOptimalSlots({
        estimatedHours: results.estimation.estimatedHours,
        preferredDate: leadData.preferredDate,
        address: payload.leadData.address,
        urgency: leadData.urgency,
      });

      results.calendarSlots = availableSlots.slice(0, 3).map(slot => ({
        startTime: slot.toISOString(),
        endTime: new Date(slot.getTime() + results.estimation.estimatedHours * 60 * 60 * 1000).toISOString(),
        confidence: 0.8,
      }));
    }

    // If response generation failed, use Tekup's response drafting
    if (!results.responseGenerated) {
      this.logger.log('Supplementing response with Tekup templates');
      
      const emailLead = this.convertGumloopToEmailLead(payload);
      const leadData = await this.leadIntelligence.extractLeadData(emailLead.body, emailLead.from);
      const draftedResponse = await this.responseDraft.generateQuoteResponse({
        customerName: payload.leadData.customerName,
        cleaningType: leadData.cleaningType,
        estimatedHours: results.estimation.estimatedHours,
        price: results.estimation.price,
        availableSlots: results.calendarSlots.map(slot => new Date(slot.startTime)),
        originalSubject: emailLead.subject,
      });

      results.responseGenerated = {
        subject: draftedResponse.subject,
        body: draftedResponse.body,
        responseMethod: 'reply_directly',
      };
    }

    return {
      ...payload,
      gumloopResults: results,
    };
  }

  /**
   * Log Gumloop webhook error for monitoring
   */
  private async logGumloopWebhookError(payload: GumloopWebhookPayload, error: Error, processingTime: number): Promise<void> {
    this.logger.error(`Gumloop webhook error: ${payload.executionId} - ${error.message}`);
    
    // TODO: Implement database logging when webhook log schema is ready
    // await this.prisma.gumloopWebhookLog.create({
    //   data: {
    //     executionId: payload.executionId,
    //     flowId: payload.flowId,
    //     customerEmail: payload.leadData?.customerEmail || 'unknown',
    //     status: payload.status,
    //     success: false,
    //     errorMessage: error.message,
    //     errorStack: error.stack,
    //     processingTimeMs: processingTime,
    //     metadata: payload.metadata,
    //   },
    // });
  }

      return {
        success: false,
        action: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Manual processing trigger for specific email
   */
  async processSpecificEmail(messageId: string): Promise<FridayProcessingResult> {
    const email = await this.gmailMonitor.getEmailById(messageId);
    if (!email) {
      throw new Error(`Email with ID ${messageId} not found`);
    }
    
    return this.processEmailLead(email);
  }

  /**
   * Batch process unread emails from inbox
   */
  async processPendingLeads(): Promise<FridayProcessingResult[]> {
    const unreadEmails = await this.gmailMonitor.getUnreadLeads();
    const results: FridayProcessingResult[] = [];

    for (const email of unreadEmails) {
      const result = await this.processEmailLead(email);
      results.push(result);
      
      // Mark as processed
      await this.gmailMonitor.markAsRead(email.messageId);
      
      // Rate limiting - avoid overwhelming APIs
      await this.sleep(2000);
    }

    return results;
  }

  /**
   * Get service analytics and metrics
   */
  async getAnalytics(days: number = 7) {
    return this.analyticsLogger.getAnalytics(days);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}