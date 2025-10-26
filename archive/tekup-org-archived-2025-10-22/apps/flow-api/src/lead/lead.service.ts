import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MetricsService } from '../metrics/metrics.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { CacheService } from '../cache/cache.service.js';
import { PerformanceService } from '../performance/performance.service.js';
import { StructuredLoggerService } from '../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../common/logging/async-context.service.js';
import { RetryService } from '../common/exceptions/retry.service.js';
import { LeadNotFoundException, DatabaseException, BusinessLogicException } from '../common/exceptions/custom-exceptions.js';
import { Cacheable, CacheEvict, CacheKeyGenerators } from '../cache/cache.decorators.js';
import { LeadListDto, PaginatedResponse } from '../common/dto/pagination.dto.js';
import { PaginationService } from '../common/pagination/pagination.service.js';
import { CircuitBreakerService, CircuitBreaker } from '../common/circuit-breaker/circuit-breaker.service.js';
import { ComplianceTypeDto, SeverityLevelDto } from './dto/compliance.dto.js';
import { DuplicateDetectionService } from './services/duplicate-detection.service.js';
import { validateStatusTransition } from './status-transition.validator.js';
import { PerformanceOptimizationService } from '../performance/performance-optimization.service.js';
import { WebSocketService } from '../websocket/websocket.service.js';
import { PhoneLeadWorkflowService } from '../phone-leads/phone-lead-workflow.service.js';

interface CreateComplianceLeadData {
  tenantId: string;
  source: string;
  payload: any;
  complianceType: ComplianceTypeDto;
  severity: SeverityLevelDto;
  scanId: string;
  findingCategory: string;
  recommendation: string;
  autoActionable: boolean;
  slaDeadline: Date;
  affectedSystems: string[];
  evidence: object;
}

@Injectable()
export class LeadService {
  constructor(
    private prisma: PrismaService, 
    private metrics: MetricsService, 
    private settings: SettingsService,
    private cacheService: CacheService,
    private performanceService: PerformanceService,
    private logger: StructuredLoggerService,
    private contextService: AsyncContextService,
    private retryService: RetryService,
    private circuitBreakerService: CircuitBreakerService,
    private duplicateDetectionService: DuplicateDetectionService,
    private performanceOptimizationService: PerformanceOptimizationService,
    private webSocketService: WebSocketService,
    private paginationService: PaginationService,
    private phoneLeadWorkflowService: PhoneLeadWorkflowService
  ) {}

  // Original cached method for backwards compatibility
  @Cacheable({
    ttl: 120, // 2 minutes
    namespace: 'leads',
    keyGenerator: (tenantId: string) => CacheKeyGenerators.leadList(tenantId)
  })
  @CircuitBreaker('database')
  async list(tenantId: string) {
    return this.retryService.executeWithDatabaseRetry(
      () => this.performanceService.measureQuery(
        () => this.prisma.lead.findMany({ 
          where: { tenantId }, 
          orderBy: { createdAt: 'desc' } 
        }),
        {
          operation: 'findMany',
          table: 'lead',
          tenantId,
          estimatedRows: 100,
        }
      ),
      'list_leads'
    ).catch((error: any) => {
      throw new DatabaseException('list leads', error, true);
    });
  }

  /**
   * Paginated lead list with filtering and sorting - optimized for performance
   */
  @CircuitBreaker('database')
  async listPaginated(
    tenantId: string,
    dto: LeadListDto
  ): Promise<PaginatedResponse<any>> {
    // Build base where clause with filters
    const baseWhere: any = { tenantId };
    
    if (dto.status) {
      baseWhere.status = dto.status.toUpperCase();
    }
    
    if (dto.source) {
      baseWhere.source = { contains: dto.source, mode: 'insensitive' };
    }
    
    if (dto.createdAfter || dto.createdBefore) {
      baseWhere.createdAt = {};
      if (dto.createdAfter) {
        baseWhere.createdAt.gte = new Date(dto.createdAfter);
      }
      if (dto.createdBefore) {
        baseWhere.createdAt.lte = new Date(dto.createdBefore);
      }
    }

    if (dto.search) {
      // Optimize search for performance with prioritized fields
      baseWhere.OR = [
        { payload: { path: ['email'], string_contains: dto.search } },
        { payload: { path: ['phone'], string_contains: dto.search } },
        { payload: { path: ['name'], string_contains: dto.search } },
        { payload: { path: ['message'], string_contains: dto.search } },
      ];
    }

    // Validate and normalize sort field
    const sortField = this.validateSortField(dto.sortField || 'createdAt');
    const sortOrder = dto.sortOrder || 'desc';
    const limit = Math.min(dto.limit || 20, 100);

    // Use pagination service for cursor-based pagination
    return this.performanceService.measureQuery(
      async () => {
        // Generate base URL for pagination links (will be set by controller)
        const baseUrl = '/leads'; // Placeholder, controller will provide actual URL
        
        const paginate: any = (this.paginationService as any).paginateLeads;
        if (typeof paginate === 'function') {
          return paginate.call(this.paginationService, tenantId, dto, baseUrl);
        }
        // Fallback simple query if advanced pagination method not present
        return this.prisma.lead.findMany({ where: baseWhere, orderBy: { createdAt: sortOrder }, take: limit });
      },
      {
        operation: 'findManyWithCursorPagination',
        table: 'lead',
        tenantId,
        estimatedRows: limit,
      }
    );
  }

  /**
   * Validate and normalize sort field for security and performance
   */
  private validateSortField(sortField: string): string {
    const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'source'];
    
    if (allowedSortFields.includes(sortField)) {
      return sortField;
    }
    
    this.logger.warn(`Invalid sort field requested: ${sortField}, defaulting to createdAt`);
    return 'createdAt';
  }

  @CacheEvict({
    patterns: ['*:leads:list:*'],
    tags: ['leads'],
    keyGenerator: (data: { tenantId: string; source: string; payload?: any }) => [
      CacheKeyGenerators.tenantPattern(data.tenantId, 'leads')
    ]
  })
  @CircuitBreaker('database')
  async create(data: { tenantId: string; source: string; payload?: any }) {
    const payload = data.payload || {};
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase().trim() : undefined;
    const phone = typeof payload.phone === 'string' ? payload.phone.replace(/\D/g,'') : undefined;
    
    this.logger.logBusinessEvent(
      'lead_creation_started',
      'lead',
      'pending',
      this.contextService.toLogContext()
    );
    
    try {
      // Check for duplicates using our duplicate detection service
      if (email || phone || payload.name) {
        const s = await this.retryService.executeWithDatabaseRetry(
          () => this.settings.getResolved(data.tenantId),
          'get_settings'
        );
        
        // Use tenant-specific duplicate window or default to 7 days
        const windowHours = s.duplicate_window_hours ?? 168; // 7 days
        
        const existing = await this.duplicateDetectionService.findDuplicate(
          data.tenantId,
          payload,
          windowHours
        );
        
        if (existing) {
          this.metrics.increment('lead_duplicate_detected_total', { tenant: data.tenantId, strategy: 'service_level' });
          this.logger.logBusinessEvent(
            'lead_duplicate_detected',
            'lead',
            existing.id,
            {
              ...this.contextService.toLogContext(),
              metadata: {
                originalLeadId: existing.id,
                duplicateIdentifier: email || phone || payload.name,
                windowHours,
              },
            }
          );
          
          // Merge payloads if the new one has more information
          const mergedPayload = this.duplicateDetectionService.mergeLeadPayloads(existing, payload);
          
          // Update the existing lead with merged data
          const updated = await this.retryService.executeWithDatabaseRetry(
            () => this.prisma.lead.update({
              where: { id: existing.id },
              data: { 
                payload: mergedPayload,
                duplicateOf: existing.duplicateOf || existing.id // Point to original
              }
            }),
            'update_duplicate_lead'
          );
          
          // Send WebSocket notification about lead update
          try {
            await this.webSocketService.sendLeadUpdate(
              data.tenantId,
              existing.id,
              {
                status: updated.status,
                payload: mergedPayload,
                duplicateOf: updated.duplicateOf,
              }
            );
          } catch (notificationError: any) {
            this.logger.warn('Failed to send WebSocket notification for duplicate lead update', {
              ...this.contextService.toLogContext(),
              errorCode: notificationError.name,
              stackTrace: notificationError.stack,
              metadata: { leadId: existing.id, tenantId: data.tenantId },
            });
          }
          
          // Invalidate performance caches
          await this.performanceOptimizationService.invalidateLeadStats(data.tenantId);
          await this.performanceOptimizationService.invalidateLeadCounts(data.tenantId);
          
          return updated;
        }
      }
      
      const lead = await this.retryService.executeWithDatabaseRetry(
        () => this.prisma.lead.create({ data: { ...data, status: 'NEW' } }),
        'create_lead'
      );
      
      this.metrics.increment('lead_created_total', { tenant: data.tenantId, source: data.source });
      
      // Track compliance leads specifically
      if (payload.compliance_type) {
        this.metrics.increment('compliance_lead_created_total', { 
          type: payload.compliance_type,
          severity: payload.severity || 'unknown',
          tenant: data.tenantId
        });
        
        if (payload.sla_deadline) {
          this.metrics.increment('sla_deadline_set_total', {
            severity: payload.severity || 'unknown',
            tenant: data.tenantId
          });
        }
      }
      
      this.logger.logBusinessEvent(
        'lead_created',
        'lead',
        lead.id,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            source: data.source,
            hasEmail: !!email,
            hasPhone: !!phone,
            payloadKeys: Object.keys(payload),
          },
        }
      );
      
      // Send WebSocket notification about new lead
      try {
        await this.webSocketService.sendLeadUpdate(
          data.tenantId,
          lead.id,
          {
            status: 'NEW',
            source: data.source,
            payload: payload,
          }
        );
  } catch (notificationError: any) {
        this.logger.warn('Failed to send WebSocket notification for new lead', {
          ...this.contextService.toLogContext(),
          errorCode: notificationError.name,
          stackTrace: notificationError.stack,
          metadata: { leadId: lead.id, tenantId: data.tenantId },
        });
      }
      
      // Invalidate performance caches
      await this.performanceOptimizationService.invalidateLeadStats(data.tenantId);
      await this.performanceOptimizationService.invalidateLeadCounts(data.tenantId);
      
      // Process phone lead workflow if applicable
      if (payload?.lead_type === 'phone_call') {
        try {
          // Process asynchronously to avoid blocking lead creation
          setImmediate(() => {
            this.phoneLeadWorkflowService.processPhoneLead(lead.id, data.tenantId)
              .catch(error => {
                this.logger.error('Failed to process phone lead workflow', error, {
                  leadId: lead.id,
                  tenantId: data.tenantId
                });
              });
          });
        } catch (error) {
          this.logger.warn('Failed to trigger phone lead workflow', error, {
            leadId: lead.id,
            tenantId: data.tenantId
          });
        }
      }
      
      return lead;
  } catch (error: any) {
      if (error.code === 'P2002') { // Prisma unique constraint error
        throw new BusinessLogicException(
          'Lead with these details already exists',
          'DUPLICATE_LEAD',
          { email, phone }
        );
      }
      throw new DatabaseException('create lead', error, false);
    }
  }

  @Cacheable({
    ttl: 300, // 5 minutes
    namespace: 'leads', 
    keyGenerator: (leadId: string, tenantId: string) => CacheKeyGenerators.leadDetail(tenantId, leadId)
  })
  async findOne(leadId: string, tenantId: string) {
    const lead = await this.retryService.executeWithDatabaseRetry(
      () => this.performanceService.measureQuery(
        () => this.prisma.lead.findFirst({ 
          where: { id: leadId, tenantId } 
        }),
        {
          operation: 'findFirst',
          table: 'lead',
          tenantId,
          estimatedRows: 1,
        }
      ),
      'find_lead'
    ).catch((error: any) => {
      throw new DatabaseException('find lead', error, true);
    });

    if (!lead) {
      throw new LeadNotFoundException(leadId, tenantId);
    }

    return lead;
  }

  @CacheEvict({
    keyGenerator: (leadId: string, tenantId: string) => [
      CacheKeyGenerators.leadDetail(tenantId, leadId),
      CacheKeyGenerators.leadEvents(tenantId, leadId),
      CacheKeyGenerators.tenantPattern(tenantId, 'leads')
    ],
    tags: ['leads']
  })
  // Only supported transition NEW -> CONTACTED (MVP). toStatus constrained for clarity.
  async changeStatus(leadId: string, tenantId: string, toStatus: 'CONTACTED') {
    this.logger.logBusinessEvent(
      'lead_status_change_started',
      'lead',
      leadId,
      {
        ...this.contextService.toLogContext(),
        metadata: { toStatus },
      }
    );
    
    try {
      const lead = await this.retryService.executeWithDatabaseRetry(
        () => this.performanceService.measureQuery(
          () => this.prisma.lead.findFirst({ where: { id: leadId, tenantId } }),
          {
            operation: 'findFirst',
            table: 'lead',
            tenantId,
            estimatedRows: 1,
          }
        ),
        'find_lead_for_status_change'
      );
      
      if (!lead) {
        throw new LeadNotFoundException(leadId, tenantId);
      }
      
      if (lead.status === 'CONTACTED') {
        // Idempotent safe return (no transition attempted)
        return lead;
      }

      // Validate transition matrix (NEW -> CONTACTED only)
      validateStatusTransition(lead.status, toStatus);
      
      // Use transaction with retry for consistency
      const result = await this.retryService.executeWithDatabaseRetry(
        () => this.prisma.$transaction(async (tx) => {
          const updated = await tx.lead.update({
            where: { id: lead.id },
            data: { status: 'CONTACTED' }
          });
          
          await tx.leadEvent.create({
            data: {
              leadId: lead.id,
              fromStatus: 'NEW',
              toStatus: 'CONTACTED'
            }
          });
          
          return updated;
        }),
        'update_lead_status_transaction'
      );
      
      this.metrics.increment('lead_status_transition_total', { tenant: tenantId, from: 'NEW', to: 'CONTACTED' });

      // Record SLA processing latency (first transition from NEW -> CONTACTED)
      if (lead.createdAt) {
        const seconds = (Date.now() - new Date(lead.createdAt).getTime()) / 1000;
        this.metrics.histogram('sla_processing_duration_seconds', seconds, { tenant: tenantId });
      }
      
      this.logger.logBusinessEvent(
        'lead_status_changed',
        'lead',
        leadId,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            fromStatus: 'NEW',
            toStatus: 'CONTACTED',
            actor: this.contextService.getUserId() || 'system',
          },
        }
      );
      
      // Send WebSocket notification about status change
      try {
        await this.webSocketService.sendStatusChange(
          tenantId,
          leadId,
          'NEW',
          'CONTACTED'
        );
  } catch (notificationError: any) {
        this.logger.warn('Failed to send WebSocket notification for lead status change', {
          ...this.contextService.toLogContext(),
          errorCode: (notificationError as any).name,
          stackTrace: (notificationError as any).stack,
          metadata: { leadId, tenantId },
        });
      }
      
      // Invalidate performance caches
      await this.performanceOptimizationService.invalidateLeadStats(tenantId);
      await this.performanceOptimizationService.invalidateLeadCounts(tenantId);
      
      return result;
  } catch (error: any) {
      // Handle cross-tenant access errors
      // When RLS blocks access, Prisma throws P2004 (insufficient permissions)
  if (error.code === 'P2004') {
        // Map to 404 to prevent information leakage about resource existence
        throw new NotFoundException('Lead not found', 'lead_not_found');
      }
      
      if (error instanceof LeadNotFoundException) {
        throw error; // Re-throw business logic exceptions
      }
      
      this.logger.error('Failed to change lead status', error, {
        ...this.contextService.toLogContext(),
        leadId, tenantId, toStatus
      });
      
      throw new DatabaseException('change lead status', error, true);
    }
  }

  /**
   * Create a compliance lead from TekUp Secure Platform findings
   */
  @CacheEvict({
    patterns: ['*:leads:list:*'],
    tags: ['leads'],
    keyGenerator: (data: CreateComplianceLeadData) => [
      CacheKeyGenerators.tenantPattern(data.tenantId, 'leads')
    ]
  })
  @CircuitBreaker('database')
  async createComplianceLead(data: CreateComplianceLeadData) {
    this.logger.logBusinessEvent(
      'compliance_lead_creation_started',
      'lead',
      'pending',
      {
        ...this.contextService.toLogContext(),
        metadata: {
          complianceType: data.complianceType,
          severity: data.severity,
          scanId: data.scanId
        }
      }
    );
    
    try {
      // Map compliance severity to Prisma enum
      const severityMap = {
        [SeverityLevelDto.LOW]: 'LOW',
        [SeverityLevelDto.MEDIUM]: 'MEDIUM', 
        [SeverityLevelDto.HIGH]: 'HIGH',
        [SeverityLevelDto.CRITICAL]: 'CRITICAL'
      };

      const complianceTypeMap = {
        [ComplianceTypeDto.NIS2_FINDING]: 'NIS2_FINDING',
        [ComplianceTypeDto.COPILOT_RISK]: 'COPILOT_RISK',
        [ComplianceTypeDto.BACKUP_FAILURE]: 'BACKUP_FAILURE'
      };
      
      const lead = await this.retryService.executeWithDatabaseRetry(
        () => this.prisma.lead.create({ 
          data: {
            tenantId: data.tenantId,
            source: data.source,
            status: 'NEW',
            payload: data.payload,
            complianceType: complianceTypeMap[data.complianceType] as any,
            severity: severityMap[data.severity] as any,
            scanId: data.scanId,
            findingCategory: data.findingCategory,
            recommendation: data.recommendation,
            autoActionable: data.autoActionable,
            slaDeadline: data.slaDeadline,
            affectedSystems: data.affectedSystems,
            evidence: data.evidence
          }
        }),
        'create_compliance_lead'
      );
      
      // Track general lead creation
      this.metrics.increment('lead_created_total', { 
        tenant: data.tenantId, 
        source: 'compliance'
      });
      
      // Track compliance-specific metrics
      this.metrics.increment('compliance_lead_created_total', { 
        type: data.complianceType,
        severity: data.severity,
        tenant: data.tenantId
      });
      
      // Track SLA deadline setting
      this.metrics.increment('sla_deadline_set_total', {
        severity: data.severity,
        tenant: data.tenantId
      });
      
      this.logger.logBusinessEvent(
        'compliance_lead_created',
        'lead',
        lead.id,
        {
          ...this.contextService.toLogContext(),
          metadata: {
            source: data.source,
            complianceType: data.complianceType,
            severity: data.severity,
            scanId: data.scanId,
            autoActionable: data.autoActionable,
            slaDeadline: data.slaDeadline.toISOString()
          }
        }
      );
      
      // Invalidate performance caches
      await this.performanceOptimizationService.invalidateLeadStats(data.tenantId);
      await this.performanceOptimizationService.invalidateLeadCounts(data.tenantId);
      
      return lead;
  } catch (error: any) {
      this.logger.error('Failed to create compliance lead', error, {
        ...this.contextService.toLogContext(),
        tenantId: data.tenantId,
        complianceType: data.complianceType,
        severity: data.severity,
        scanId: data.scanId
      });
      
      throw new DatabaseException('create compliance lead', error, false);
    }
  }

  @Cacheable({
    ttl: 600, // 10 minutes - events don't change often
    namespace: 'events',
    keyGenerator: (leadId: string, tenantId: string) => CacheKeyGenerators.leadEvents(tenantId, leadId)
  })
  async events(leadId: string, tenantId: string) {
    return this.retryService.executeWithDatabaseRetry(
      () => this.performanceService.measureQuery(
        () => this.prisma.leadEvent.findMany({ 
          where: { leadId, lead: { tenantId } }, 
          orderBy: { createdAt: 'asc' } 
        }),
        {
          operation: 'findMany',
          table: 'lead_event',
          tenantId,
          estimatedRows: 5,
        }
      ),
      'get_lead_events'
    ).catch(error => {
      throw new DatabaseException('get lead events', error, true);
    });
  }
}