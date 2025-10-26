import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RendetaljeFridayService, FridayProcessingResult } from './rendetalje-friday.service';

export interface ProcessEmailRequest {
  messageId: string;
}

export interface BatchProcessRequest {
  dryRun?: boolean;
  maxEmails?: number;
}

export interface AnalyticsQuery {
  days?: number;
  includeDetails?: boolean;
}

/**
 * Rendetalje Friday AI Controller
 * 
 * REST API endpoints for the Friday AI assistant:
 * - Manual email processing triggers
 * - Batch processing controls
 * - Analytics and monitoring
 * - Health checks and diagnostics
 */
@Controller('integrations/rendetalje-friday')
export class RendetaljeFridayController {
  constructor(private readonly fridayService: RendetaljeFridayService) {}

  /**
   * Process specific email by message ID
   */
  @Post('process/email')
  async processEmail(@Body() request: ProcessEmailRequest): Promise<FridayProcessingResult> {
    return this.fridayService.processSpecificEmail(request.messageId);
  }

  /**
   * Batch process all pending leads
   */
  @Post('process/batch')
  async batchProcess(@Body() request: BatchProcessRequest = {}): Promise<{
    processed: number;
    results: FridayProcessingResult[];
    summary: {
      quotes_sent: number;
      info_requested: number;
      duplicates_detected: number;
      errors: number;
    };
  }> {
    const results = await this.fridayService.processPendingLeads();
    
    const summary = {
      quotes_sent: results.filter(r => r.action === 'quote_sent').length,
      info_requested: results.filter(r => r.action === 'info_requested').length,
      duplicates_detected: results.filter(r => r.action === 'duplicate_detected').length,
      errors: results.filter(r => r.action === 'error').length,
    };

    return {
      processed: results.length,
      results: request.dryRun ? [] : results, // Hide details in dry run
      summary,
    };
  }

  /**
   * Get Friday service analytics
   */
  @Get('analytics')
  async getAnalytics(@Query() query: AnalyticsQuery) {
    const days = query.days || 7;
    return this.fridayService.getAnalytics(days);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async getHealth() {
    // TODO: Implement health checks for all dependencies
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        gmail_api: 'healthy', // TODO: Check Gmail API connection
        calendar_api: 'healthy', // TODO: Check Calendar API connection
        database: 'healthy', // TODO: Check Prisma connection
        ai_services: 'healthy', // TODO: Check AI service availability
      },
    };
  }

  /**
   * Get service configuration and business rules
   */
  @Get('config')
  async getConfiguration() {
    return {
      hourly_rate: 349,
      currency: 'DKK',
      vat_included: true,
      business_rules: {
        duplicate_prevention: true,
        min_hours: 1.0,
        max_single_person_hours: 8.0,
        team_size_threshold: 8.0,
        response_within_hours: 2,
      },
      supported_services: [
        'weekly',
        'main', 
        'move_out',
        'airbnb',
        'commercial',
        'event',
        'after_construction'
      ],
      supported_extras: [
        'windows',
        'oven',
        'fridge',
        'deep_clean',
        'garden'
      ],
      lead_sources: {
        'leadpoint.dk': 'reply_directly',
        'leadmail.no': 'create_new_email',
        'adhelp.dk': 'send_to_customer_only',
        'direct': 'reply_directly'
      }
    };
  }

  /**
   * Get recent processing activity
   */
  @Get('activity/recent')
  async getRecentActivity(@Query('limit') limit: string = '20') {
    // TODO: Implement recent activity log
    return {
      activities: [],
      total: 0,
      limit: parseInt(limit),
    };
  }

  /**
   * Test endpoint for development
   */
  @Post('test/estimate')
  async testEstimate(@Body() request: {
    cleaningType: string;
    squareMeters: number;
    firstTime?: boolean;
    extras?: string[];
  }) {
    // TODO: Implement direct estimation testing
    return {
      input: request,
      estimate: {
        hours: 0,
        price: 0,
        breakdown: [],
      },
      test: true,
    };
  }
}