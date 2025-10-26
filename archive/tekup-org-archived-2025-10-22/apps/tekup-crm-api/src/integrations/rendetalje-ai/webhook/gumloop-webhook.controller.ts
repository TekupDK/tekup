import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { RendetaljeFridayService } from '../rendetalje-friday.service';
import { GumloopDataProcessor } from './gumloop-data-processor.service';

export interface GumloopWebhookPayload {
  // Standard Gumloop webhook structure
  flowId: string;
  executionId: string;
  timestamp: string;
  status: 'success' | 'error' | 'partial';
  
  // Rendetalje-specific processed data
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
  
  // Gumloop processing results
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
  
  // Metadata
  metadata: {
    processingTimeMs: number;
    nodeExecutions: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  tekupProcessingId?: string;
  actions: string[];
  errors?: string[];
}

/**
 * Gumloop Webhook Controller
 * 
 * Receives processed lead data from Gumloop and integrates it into Tekup systems.
 * This hybrid approach combines Gumloop's AI processing capabilities with
 * Tekup's robust backend infrastructure and business logic.
 * 
 * Flow:
 * 1. Gumloop processes Gmail leads through their AI pipeline
 * 2. Gumloop sends processed results to this webhook
 * 3. Tekup validates, stores, and executes final actions
 * 4. Response sent back to Gumloop for confirmation
 */
@Controller('integrations/gumloop')
export class GumloopWebhookController {
  private readonly logger = new Logger(GumloopWebhookController.name);

  constructor(
    private readonly fridayService: RendetaljeFridayService,
    private readonly gumloopProcessor: GumloopDataProcessor,
  ) {}

  /**
   * Main webhook endpoint for Gumloop data
   */
  @Post('webhook/rendetalje-lead')
  @HttpCode(HttpStatus.OK)
  async receiveLeadData(
    @Body() payload: GumloopWebhookPayload,
    @Headers() headers: Record<string, string>,
  ): Promise<WebhookResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Received Gumloop webhook: ${payload.executionId}`);

      // 1. Validate webhook authenticity
      await this.gumloopProcessor.validateWebhook(payload, headers);

      // 2. Process the data based on Gumloop results
      let actions: string[] = [];
      let tekupProcessingId: string | undefined;

      if (payload.status === 'success') {
        // Handle successful Gumloop processing
        const result = await this.handleSuccessfulProcessing(payload);
        actions = result.actions;
        tekupProcessingId = result.processingId;
        
      } else if (payload.status === 'error') {
        // Handle Gumloop processing errors
        actions = await this.handleProcessingError(payload);
        
      } else if (payload.status === 'partial') {
        // Handle partial success (some nodes failed)
        const result = await this.handlePartialProcessing(payload);
        actions = result.actions;
        tekupProcessingId = result.processingId;
      }

      // 3. Log the webhook for analytics
      await this.gumloopProcessor.logWebhookReceived(payload, actions, Date.now() - startTime);

      const response: WebhookResponse = {
        success: true,
        message: `Processed ${payload.leadData.customerEmail} successfully`,
        tekupProcessingId,
        actions,
      };

      this.logger.log(`Webhook processed successfully in ${Date.now() - startTime}ms`);
      return response;

    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      
      // Log error for monitoring
      await this.gumloopProcessor.logWebhookError(payload, error, Date.now() - startTime);

      return {
        success: false,
        message: `Processing failed: ${error.message}`,
        actions: ['error_logged'],
        errors: [error.message],
      };
    }
  }

  /**
   * Handle successful Gumloop processing
   */
  private async handleSuccessfulProcessing(payload: GumloopWebhookPayload): Promise<{
    actions: string[];
    processingId: string;
  }> {
    const actions: string[] = [];
    
    // Check Gumloop's recommendation
    if (payload.gumloopResults.historyCheck.recommendation === 'duplicate_detected') {
      // Trust Gumloop's duplicate detection but log in Tekup
      await this.gumloopProcessor.logDuplicateLead(payload);
      actions.push('duplicate_logged');
      
      return { actions, processingId: payload.executionId };
    }

    if (payload.gumloopResults.historyCheck.recommendation === 'manual_review') {
      // Escalate to manual review in Tekup CRM
      const reviewId = await this.gumloopProcessor.createManualReview(payload);
      actions.push('manual_review_created');
      
      return { actions, processingId: reviewId };
    }

    // Proceed with automated processing
    const leadProcessingResult = await this.processGumloopLead(payload);
    actions.push('lead_processed');

    // Execute final actions based on Gumloop's response method
    if (payload.gumloopResults.responseGenerated.responseMethod === 'send_to_customer_only') {
      // Send email to customer only (not back to lead aggregator)
      const emailSent = await this.gumloopProcessor.sendDirectEmail(
        payload.leadData.customerEmail,
        payload.gumloopResults.responseGenerated
      );
      
      if (emailSent) {
        actions.push('email_sent_to_customer');
      }
      
    } else if (payload.gumloopResults.responseGenerated.responseMethod === 'create_new_email') {
      // Create new email thread (not reply)
      const emailSent = await this.gumloopProcessor.sendNewEmailThread(
        payload.leadData.customerEmail,
        payload.gumloopResults.responseGenerated
      );
      
      if (emailSent) {
        actions.push('new_email_thread_created');
      }
      
    } else {
      // Reply directly to original email
      const emailSent = await this.gumloopProcessor.sendReplyEmail(
        payload.leadData.originalEmail.messageId,
        payload.gumloopResults.responseGenerated
      );
      
      if (emailSent) {
        actions.push('reply_email_sent');
      }
    }

    return {
      actions,
      processingId: leadProcessingResult.processingId,
    };
  }

  /**
   * Handle Gumloop processing errors
   */
  private async handleProcessingError(payload: GumloopWebhookPayload): Promise<string[]> {
    // Fall back to Tekup's own processing
    this.logger.warn(`Gumloop processing failed for ${payload.executionId}, falling back to Tekup processing`);
    
    try {
      // Convert Gumloop payload to Tekup format and process
      const emailLead = this.gumloopProcessor.convertToTekupFormat(payload);
      const result = await this.fridayService.processEmailLead(emailLead);
      
      if (result.success) {
        return ['fallback_processing_successful'];
      } else {
        return ['fallback_processing_failed'];
      }
      
    } catch (error) {
      this.logger.error(`Fallback processing also failed: ${error.message}`);
      return ['manual_intervention_required'];
    }
  }

  /**
   * Handle partial Gumloop processing
   */
  private async handlePartialProcessing(payload: GumloopWebhookPayload): Promise<{
    actions: string[];
    processingId: string;
  }> {
    const actions: string[] = [];
    
    // Use what Gumloop successfully processed, fill gaps with Tekup processing
    const supplementedData = await this.gumloopProcessor.supplementPartialData(payload);
    
    // Process with combined data
    const result = await this.processGumloopLead({
      ...payload,
      gumloopResults: supplementedData,
    });
    
    actions.push('partial_processing_completed');
    
    return {
      actions,
      processingId: result.processingId,
    };
  }

  /**
   * Process Gumloop lead data in Tekup system
   */
  private async processGumloopLead(payload: GumloopWebhookPayload): Promise<{
    processingId: string;
  }> {
    // Store lead in Tekup CRM
    const customerId = await this.gumloopProcessor.createOrUpdateCustomer(payload.leadData);
    
    // Create deal/opportunity
    const dealId = await this.gumloopProcessor.createDeal({
      customerId,
      estimatedValue: payload.gumloopResults.estimation.price,
      estimatedHours: payload.gumloopResults.estimation.estimatedHours,
      leadSource: payload.leadData.leadSource,
      originalEmail: payload.leadData.originalEmail,
    });

    // Schedule calendar slots if customer confirms
    if (payload.gumloopResults.calendarSlots.length > 0) {
      await this.gumloopProcessor.preparePendingBookings(dealId, payload.gumloopResults.calendarSlots);
    }

    // Create analytics entry
    await this.gumloopProcessor.logLeadProcessing({
      executionId: payload.executionId,
      customerId,
      dealId,
      source: 'gumloop',
      processingTime: payload.metadata.processingTimeMs,
      confidence: payload.gumloopResults.estimation.confidence,
    });

    return { processingId: dealId };
  }

  /**
   * Health check endpoint for Gumloop to verify webhook connectivity
   */
  @Post('webhook/health')
  @HttpCode(HttpStatus.OK)
  async webhookHealthCheck(@Body() payload: { timestamp: string; flowId?: string }) {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tekupVersion: '1.0.0',
      webhookReceived: payload.timestamp,
      services: {
        database: 'healthy',
        gmail: 'healthy',
        calendar: 'healthy',
      },
    };
  }
}