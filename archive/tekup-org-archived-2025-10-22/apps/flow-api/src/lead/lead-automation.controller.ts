import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@tekup/auth';
import { AILeadScoringService } from './services/ai-lead-scoring.service';
import { AutoResponseService } from './services/auto-response.service';
import { AutoBookingService } from '../../../tekup-crm-api/src/booking/auto-booking.service';
import { CalendarBillyAutomationService } from '../../../tekup-crm-api/src/integrations/calendar-billy-automation.service';

@ApiTags('Lead Automation')
@ApiBearerAuth()
@Controller('lead-automation')
@UseGuards(JwtAuthGuard)
export class LeadAutomationController {
  constructor(
    private aiScoringService: AILeadScoringService,
    private autoResponseService: AutoResponseService,
    private autoBookingService: AutoBookingService,
    private calendarBillyService: CalendarBillyAutomationService
  ) {}

  @Post('process-new-lead/:leadId')
  @ApiOperation({ summary: 'Process new lead with full automation pipeline' })
  @ApiResponse({ status: 200, description: 'Lead processed successfully' })
  async processNewLead(@Param('leadId') leadId: string) {
    try {
      // Step 1: AI Lead Scoring
      const scoringResult = await this.aiScoringService.scoreLead(leadId);
      
      // Step 2: Auto Response for high-score leads
      if (scoringResult.autoResponse) {
        await this.autoResponseService.sendAutoResponse(leadId, scoringResult);
      }

      // Step 3: Generate booking proposal for hot leads
      let bookingProposal = null;
      if (scoringResult.score >= 85) {
        bookingProposal = await this.autoBookingService.generateBookingProposal(leadId);
      }

      return {
        success: true,
        leadId,
        aiScore: scoringResult.score,
        recommendation: scoringResult.recommendation,
        autoResponseSent: scoringResult.autoResponse,
        bookingProposalGenerated: !!bookingProposal,
        bookingUrl: bookingProposal?.bookingUrl
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('score-lead/:leadId')
  @ApiOperation({ summary: 'Score individual lead with AI' })
  async scoreLead(@Param('leadId') leadId: string) {
    return this.aiScoringService.scoreLead(leadId);
  }

  @Post('batch-score-leads')
  @ApiOperation({ summary: 'Batch score all new leads for tenant' })
  async batchScoreLeads(@Query('tenantId') tenantId: string) {
    await this.aiScoringService.batchScoreLeads(tenantId);
    return { success: true, message: 'Batch scoring initiated' };
  }

  @Get('top-leads')
  @ApiOperation({ summary: 'Get top scored leads' })
  async getTopLeads(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit: string = '10'
  ) {
    return this.aiScoringService.getTopScoredLeads(tenantId, parseInt(limit));
  }

  @Get('lead-stats')
  @ApiOperation({ summary: 'Get lead scoring statistics' })
  async getLeadStats(@Query('tenantId') tenantId: string) {
    return this.aiScoringService.getLeadScoringStats(tenantId);
  }

  @Post('confirm-booking/:token')
  @ApiOperation({ summary: 'Confirm booking from customer' })
  async confirmBooking(
    @Param('token') token: string,
    @Body() bookingData: { selectedSlot: any }
  ) {
    return this.autoBookingService.confirmBooking(token, bookingData.selectedSlot);
  }

  @Get('booking-stats')
  @ApiOperation({ summary: 'Get booking statistics' })
  async getBookingStats(@Query('tenantId') tenantId: string) {
    return this.autoBookingService.getBookingStats(tenantId);
  }

  @Post('process-completed-event/:eventId')
  @ApiOperation({ summary: 'Process completed calendar event for billing' })
  async processCompletedEvent(@Param('eventId') eventId: string) {
    return this.calendarBillyService.manualProcessEvent(eventId);
  }

  @Post('send-follow-up/:leadId')
  @ApiOperation({ summary: 'Send follow-up email to warm lead' })
  async sendFollowUp(@Param('leadId') leadId: string) {
    await this.autoResponseService.sendFollowUpEmail(leadId);
    return { success: true, message: 'Follow-up email sent' };
  }

  @Get('dashboard-metrics')
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  async getDashboardMetrics(@Query('tenantId') tenantId: string) {
    const [leadStats, bookingStats] = await Promise.all([
      this.aiScoringService.getLeadScoringStats(tenantId),
      this.autoBookingService.getBookingStats(tenantId)
    ]);

    const topLeads = await this.aiScoringService.getTopScoredLeads(tenantId, 5);

    return {
      leadStats,
      bookingStats,
      topLeads,
      lastUpdated: new Date().toISOString()
    };
  }

  @Post('webhook/new-lead')
  @ApiOperation({ summary: 'Webhook endpoint for new leads from Flow API' })
  async webhookNewLead(@Body() leadData: any) {
    try {
      // This would be called by Flow API when a new lead is created
      const result = await this.processNewLead(leadData.leadId);
      
      return {
        success: true,
        processed: result.success,
        message: 'Lead automation pipeline executed'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  @Post('webhook/calendar-completed')
  @ApiOperation({ summary: 'Webhook endpoint for completed calendar events' })
  async webhookCalendarCompleted(@Body() eventData: any) {
    try {
      await this.calendarBillyService.processCompletedCalendarEvent(
        eventData.eventId, 
        eventData
      );
      
      return {
        success: true,
        message: 'Calendar event processed and invoice created'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
