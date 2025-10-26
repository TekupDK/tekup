import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { RendetaljeFridayService, GumloopWebhookPayload, FridayProcessingResult } from '../rendetalje-friday.service';
import * as crypto from 'crypto';

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
 * REST endpoint for receiving Gumloop processing results.
 * Integrates with existing RendetaljeFridayService for hybrid AI processing.
 */
@Controller('integrations/rendetalje-ai/gumloop')
export class GumloopWebhookController {
  private readonly logger = new Logger(GumloopWebhookController.name);

  constructor(
    private readonly fridayService: RendetaljeFridayService,
  ) {}

  /**
   * Main webhook endpoint for Gumloop data
   * 
   * Receives processed lead data from Gumloop and processes it through
   * Tekup's Friday AI system for storage and business logic execution.
   */
  @Post('webhook/lead')
  @HttpCode(HttpStatus.OK)
  async receiveLeadData(
    @Body() payload: GumloopWebhookPayload,
    @Headers() headers: Record<string, string>,
  ): Promise<WebhookResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Received Gumloop webhook: ${payload.executionId} from ${payload.leadData.customerEmail}`);

      // 1. Validate webhook authenticity (optional, can be enabled with environment variable)
      if (process.env.GUMLOOP_WEBHOOK_SECRET) {
        this.validateWebhookSignature(payload, headers);
      }

      // 2. Process through Friday AI service
      const result: FridayProcessingResult = await this.fridayService.processGumloopWebhook(payload);

      // 3. Transform Friday result to webhook response format
      const response: WebhookResponse = this.transformFridayResultToWebhookResponse(result, payload);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Webhook processed successfully in ${processingTime}ms: ${result.action}`);
      
      return response;

    } catch (error) {
      this.logger.error(`Webhook processing failed: ${error.message}`, error.stack);
      
      const response: WebhookResponse = {
        success: false,
        message: `Processing failed: ${error.message}`,
        actions: ['error_logged'],
        errors: [error.message],
      };

      return response;
    }
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
        friday_ai: 'healthy',
        estimation_engine: 'healthy',
      },
    };
  }

  /**
   * Manual trigger endpoint for testing webhook processing
   */
  @Post('webhook/test')
  @HttpCode(HttpStatus.OK)
  async testWebhookProcessing(@Body() payload: GumloopWebhookPayload): Promise<WebhookResponse> {
    this.logger.log(`Test webhook trigger: ${payload.executionId}`);
    
    // Skip signature validation for test endpoint
    const result: FridayProcessingResult = await this.fridayService.processGumloopWebhook(payload);
    
    return this.transformFridayResultToWebhookResponse(result, payload);
  }

  /**
   * Validate webhook signature using HMAC SHA256
   */
  private validateWebhookSignature(payload: GumloopWebhookPayload, headers: Record<string, string>): void {
    const expectedSecret = process.env.GUMLOOP_WEBHOOK_SECRET;
    const receivedSignature = headers['x-gumloop-signature'];
    
    if (!expectedSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    if (!receivedSignature) {
      throw new BadRequestException('Missing webhook signature');
    }

    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', expectedSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (`sha256=${expectedSignature}` !== receivedSignature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Webhook signature validated for execution: ${payload.executionId}`);
  }

  /**
   * Transform Friday AI result to webhook response format
   */
  private transformFridayResultToWebhookResponse(
    result: FridayProcessingResult,
    payload: GumloopWebhookPayload
  ): WebhookResponse {
    const actions: string[] = [];
    
    // Map Friday actions to webhook actions
    switch (result.action) {
      case 'quote_sent':
        actions.push('lead_processed', 'quote_generated', 'email_sent');
        break;
      case 'duplicate_detected':
        actions.push('duplicate_logged');
        break;
      case 'manual_review':
        actions.push('manual_review_created');
        break;
      case 'info_requested':
        actions.push('info_requested', 'email_sent');
        break;
      case 'error':
        actions.push('processing_error');
        break;
      default:
        actions.push('unknown_action');
    }

    // Add Gumloop-specific actions
    actions.push('gumloop_webhook_processed');

    let message: string;
    if (result.success) {
      message = `Successfully processed ${payload.leadData.customerEmail} - ${result.action}`;
      if (result.price) {
        message += ` (${result.price} DKK, ${result.estimatedHours}h)`;
      }
    } else {
      message = `Processing failed for ${payload.leadData.customerEmail}: ${result.error}`;
    }

    return {
      success: result.success,
      message,
      tekupProcessingId: result.messageId || result.customerId,
      actions,
      errors: result.error ? [result.error] : undefined,
    };
  }
}