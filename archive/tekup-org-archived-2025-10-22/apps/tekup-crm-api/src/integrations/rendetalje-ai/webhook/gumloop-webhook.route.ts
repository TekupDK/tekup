import express from 'express';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const router = express.Router();

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
 * Gumloop Webhook Handler
 * 
 * Express-based webhook endpoint for receiving Gumloop processing results.
 * Integrates with existing Tekup CRM API structure.
 */
class GumloopWebhookHandler {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  /**
   * Validate webhook authenticity
   */
  private validateWebhook(payload: GumloopWebhookPayload, headers: any): void {
    const expectedSecret = process.env.GUMLOOP_WEBHOOK_SECRET;
    const receivedSignature = headers['x-gumloop-signature'];
    
    if (!expectedSecret) {
      throw new Error('Webhook secret not configured');
    }

    if (!receivedSignature) {
      throw new Error('Missing webhook signature');
    }

    // Validate signature (using HMAC SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', expectedSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (`sha256=${expectedSignature}` !== receivedSignature) {
      throw new Error('Invalid webhook signature');
    }

    // Validate payload structure
    const required = ['flowId', 'executionId', 'timestamp', 'status', 'leadData', 'gumloopResults', 'metadata'];
    for (const field of required) {
      if (!payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.leadData.customerEmail)) {
      throw new Error('Invalid customer email format');
    }
  }

  /**
   * Process successful Gumloop data
   */
  private async processSuccessfulLead(payload: GumloopWebhookPayload): Promise<{
    actions: string[];
    processingId: string;
  }> {
    const actions: string[] = [];
    
    // Check Gumloop's recommendation
    if (payload.gumloopResults.historyCheck.recommendation === 'duplicate_detected') {
      console.log(`Duplicate lead detected: ${payload.leadData.customerEmail}`);
      actions.push('duplicate_logged');
      return { actions, processingId: payload.executionId };
    }

    if (payload.gumloopResults.historyCheck.recommendation === 'manual_review') {
      console.log(`Manual review required for: ${payload.leadData.customerEmail}`);
      actions.push('manual_review_created');
      return { actions, processingId: `review_${payload.executionId}` };
    }

    // Process the lead
    const customerId = await this.createOrUpdateCustomer(payload.leadData);
    const dealId = await this.createDeal(customerId, payload);
    
    actions.push('lead_processed');

    // Mock email sending for now
    console.log(`Mock: Sending email to ${payload.leadData.customerEmail}`);
    console.log(`Subject: ${payload.gumloopResults.responseGenerated.subject}`);
    actions.push('email_sent');

    return { actions, processingId: dealId };
  }

  /**
   * Create or update customer (simplified implementation)
   */
  private async createOrUpdateCustomer(leadData: any): Promise<string> {
    const customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating customer: ${customerId} for ${leadData.customerEmail}`);
    
    // TODO: Implement actual Prisma customer creation when schema is ready
    // const customer = await this.prisma.customer.create({
    //   data: {
    //     email: leadData.customerEmail,
    //     name: leadData.customerName || this.extractNameFromEmail(leadData.customerEmail),
    //     phone: leadData.phoneNumber,
    //     address: leadData.address,
    //     source: leadData.leadSource,
    //   },
    // });
    
    return customerId;
  }

  /**
   * Create deal/opportunity
   */
  private async createDeal(customerId: string, payload: GumloopWebhookPayload): Promise<string> {
    const dealId = `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Creating deal: ${dealId} for customer ${customerId}`);
    console.log(`Estimated value: ${payload.gumloopResults.estimation.price} DKK`);
    console.log(`Estimated hours: ${payload.gumloopResults.estimation.estimatedHours}`);
    
    // TODO: Implement actual Prisma deal creation when schema is ready
    // const deal = await this.prisma.deal.create({
    //   data: {
    //     customerId,
    //     title: `Cleaning Service - ${payload.leadData.originalEmail.subject}`,
    //     estimatedValue: payload.gumloopResults.estimation.price,
    //     estimatedHours: payload.gumloopResults.estimation.estimatedHours,
    //     source: payload.leadData.leadSource,
    //     stage: 'lead',
    //   },
    // });
    
    return dealId;
  }

  /**
   * Log webhook for monitoring
   */
  private async logWebhook(payload: GumloopWebhookPayload, success: boolean, actions: string[], processingTime: number, error?: string): Promise<void> {
    console.log(`Webhook ${success ? 'SUCCESS' : 'ERROR'}: ${payload.executionId}`);
    console.log(`Customer: ${payload.leadData.customerEmail}`);
    console.log(`Actions: [${actions.join(', ')}]`);
    console.log(`Processing time: ${processingTime}ms`);
    if (error) {
      console.error(`Error: ${error}`);
    }
    
    // TODO: Implement actual database logging when schema is ready
    // await this.prisma.gumloopWebhookLog.create({
    //   data: {
    //     executionId: payload.executionId,
    //     flowId: payload.flowId,
    //     customerEmail: payload.leadData.customerEmail,
    //     status: payload.status,
    //     success,
    //     actions,
    //     processingTimeMs: processingTime,
    //     errorMessage: error,
    //     metadata: payload.metadata,
    //   },
    // });
  }

  /**
   * Main webhook handler
   */
  async handleWebhook(req: express.Request, res: express.Response): Promise<void> {
    const startTime = Date.now();
    
    try {
      const payload: GumloopWebhookPayload = req.body;
      
      console.log(`Received Gumloop webhook: ${payload.executionId}`);

      // Validate webhook
      this.validateWebhook(payload, req.headers);

      let actions: string[] = [];
      let tekupProcessingId: string | undefined;

      if (payload.status === 'success') {
        const result = await this.processSuccessfulLead(payload);
        actions = result.actions;
        tekupProcessingId = result.processingId;
        
      } else if (payload.status === 'error') {
        console.warn(`Gumloop processing failed for ${payload.executionId}`);
        actions = ['gumloop_error_received'];
        
      } else if (payload.status === 'partial') {
        console.warn(`Gumloop partial processing for ${payload.executionId}`);
        const result = await this.processSuccessfulLead(payload);
        actions = ['partial_processing', ...result.actions];
        tekupProcessingId = result.processingId;
      }

      // Log the webhook
      await this.logWebhook(payload, true, actions, Date.now() - startTime);

      const response: WebhookResponse = {
        success: true,
        message: `Processed ${payload.leadData.customerEmail} successfully`,
        tekupProcessingId,
        actions,
      };

      res.status(200).json(response);

    } catch (error) {
      const payload = req.body as GumloopWebhookPayload;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Webhook processing failed: ${errorMessage}`);
      
      // Log error
      if (payload?.executionId) {
        await this.logWebhook(payload, false, ['error'], Date.now() - startTime, errorMessage);
      }

      const response: WebhookResponse = {
        success: false,
        message: `Processing failed: ${errorMessage}`,
        actions: ['error_logged'],
        errors: [errorMessage],
      };

      res.status(400).json(response);
    }
  }

  /**
   * Health check handler
   */
  async handleHealthCheck(req: express.Request, res: express.Response): Promise<void> {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tekupVersion: '1.0.0',
      services: {
        database: 'healthy',
        webhook: 'healthy',
      },
    });
  }
}

// Initialize handler
const webhookHandler = new GumloopWebhookHandler();

// Define routes
router.post('/webhook/rendetalje-lead', express.json(), (req, res) => {
  webhookHandler.handleWebhook(req, res);
});

router.post('/webhook/health', express.json(), (req, res) => {
  webhookHandler.handleHealthCheck(req, res);
});

export default router;