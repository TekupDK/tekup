import { Module } from '@nestjs/common';
import { RendetaljeFridayController } from './rendetalje-friday.controller';
import { GumloopWebhookController } from './controllers/gumloop-webhook.controller';
import { RendetaljeFridayService } from './rendetalje-friday.service';
import { GmailMonitorService } from './services/gmail-monitor.service';
import { LeadIntelligenceService } from './services/lead-intelligence.service';
import { EstimationEngineService } from './services/estimation-engine.service';
import { CustomerHistoryService } from './services/customer-history.service';
import { CalendarOptimizationService } from './services/calendar-optimization.service';
import { ResponseDraftService } from './services/response-draft.service';
import { BillyIntegrationService } from './services/billy-integration.service';
import { AnalyticsLoggerService } from './services/analytics-logger.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Rendetalje Friday AI Module
 * 
 * Autonomous AI assistant for Rendetalje.dk cleaning services:
 * - Gmail monitoring and lead processing
 * - Intelligent estimation engine (349 kr/time)
 * - Customer history analysis and duplicate prevention
 * - Calendar availability optimization
 * - Professional response generation
 * - Billy invoicing integration
 * - Analytics and performance tracking
 * 
 * Integrates with existing Tekup services:
 * - Uses GoogleWorkspaceService for Gmail/Calendar
 * - Leverages Tekup's AI Proposal Engine architecture
 * - Connects to Billy via existing integration
 * - Stores data in CRM database via Prisma
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    RendetaljeFridayController,
    GumloopWebhookController, // Added webhook controller for Gumloop integration
  ],
  providers: [
    RendetaljeFridayService,
    GmailMonitorService,
    LeadIntelligenceService,
    EstimationEngineService,
    CustomerHistoryService,
    CalendarOptimizationService,
    ResponseDraftService,
    BillyIntegrationService,
    AnalyticsLoggerService,
  ],
  exports: [
    RendetaljeFridayService,
    GmailMonitorService,
    LeadIntelligenceService,
  ],
})
export class RendetaljeFridayModule {}