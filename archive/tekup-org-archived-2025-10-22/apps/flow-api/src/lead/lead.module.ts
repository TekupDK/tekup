import { Module } from '@nestjs/common';
import { LeadService } from './lead.service.js';
import { LeadController } from './lead.controller.js';
import { LeadScoringController } from './lead-scoring.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { CacheModule } from '../cache/cache.module.js';
import { PerformanceModule } from '../performance/performance.module.js';
import { PaginationService } from '../common/pagination/pagination.service.js';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module.js';
import { RateLimitingModule } from '../common/rate-limiting/rate-limiting.module.js';
import { SlaCalculationService } from './services/sla-calculation.service.js';
import { DuplicateDetectionService } from './services/duplicate-detection.service.js';
import { SlaMonitoringService } from './services/sla-monitoring.service.js';
import { LeadScoringService } from './services/lead-scoring.service.js';
import { ScheduleModule } from '@nestjs/schedule';
import { PerformanceOptimizationModule } from '../performance/performance-optimization.module.js';
import { WebSocketModule } from '../websocket/websocket.module.js';
import { PhoneLeadWorkflowModule } from '../phone-leads/phone-lead-workflow.module.js';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { ScopesGuard } from '../auth/scopes.guard.js';
import { Reflector } from '@nestjs/core';
import { AILeadScoringService } from './services/ai-lead-scoring.service.js';
import { AutoResponseService } from './services/auto-response.service.js';
import { LeadAutomationController } from './lead-automation.controller.js';

@Module({
  imports: [CacheModule, PerformanceModule, CircuitBreakerModule, RateLimitingModule, ScheduleModule.forRoot(), PerformanceOptimizationModule, WebSocketModule, PhoneLeadWorkflowModule],
  controllers: [LeadController, LeadScoringController, LeadAutomationController],
  providers: [LeadService, LeadScoringService, PrismaService, MetricsService, SettingsService, PaginationService, SlaCalculationService, DuplicateDetectionService, SlaMonitoringService, ApiKeyGuard, ScopesGuard, Reflector, AILeadScoringService, AutoResponseService],
  exports: [LeadService, LeadScoringService, AILeadScoringService, AutoResponseService]
})
export class LeadModule {}