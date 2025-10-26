import { Controller, Get, Post, Param, Query, Redirect, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SMSService } from './sms.service.js';

@ApiTags('SMS')
@Controller('sms')
export class SMSController {
  private readonly logger = new Logger(SMSController.name);

  constructor(private readonly smsService: SMSService) {}

  @Get('track/:trackingId')
  @ApiOperation({ summary: 'Track SMS link click and redirect to booking' })
  @ApiResponse({ status: 302, description: 'Redirect to booking page' })
  @Redirect('https://rendetalje.dk/book-nu', 302)
  async trackSMSClick(@Param('trackingId') trackingId: string) {
    try {
      this.logger.log(`SMS link clicked: ${trackingId}`);
      
      // Track the click
      await this.smsService.trackSMSClick(trackingId);
      
      // Return redirect URL (will be handled by @Redirect decorator)
      return { url: 'https://rendetalje.dk/book-nu' };
    } catch (error) {
      this.logger.error(`Failed to track SMS click: ${trackingId}`, error);
      // Still redirect even if tracking fails
      return { url: 'https://rendetalje.dk/book-nu' };
    }
  }

  @Post('convert/:leadId')
  @ApiOperation({ summary: 'Track SMS conversion when booking is completed' })
  @ApiResponse({ status: 200, description: 'Conversion tracked successfully' })
  async trackConversion(@Param('leadId') leadId: string) {
    try {
      this.logger.log(`SMS conversion tracked for lead: ${leadId}`);
      await this.smsService.trackSMSConversion(leadId);
      return { success: true, message: 'Conversion tracked' };
    } catch (error) {
      this.logger.error(`Failed to track SMS conversion: ${leadId}`, error);
      throw error;
    }
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get SMS analytics for tenant' })
  @ApiResponse({ status: 200, description: 'SMS analytics data' })
  async getAnalytics(
    @Query('tenantId') tenantId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const dateRange = from && to ? {
      from: new Date(from),
      to: new Date(to)
    } : undefined;

    return this.smsService.getSMSAnalytics(tenantId, dateRange);
  }
}