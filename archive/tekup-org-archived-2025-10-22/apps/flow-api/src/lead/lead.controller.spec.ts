import { LeadController } from './lead.controller.js';
import { LeadService } from './lead.service.js';
import { CacheService } from '../cache/cache.service.js';
import { PaginationService } from '../common/services/pagination.service.js';
import { SlaCalculationService } from './services/sla-calculation.service.js';
import { PerformanceOptimizationService } from '../performance/performance-optimization.service.js';
import { CreateComplianceLeadDto } from './dto/compliance.dto.js';

describe('LeadController', () => {
  let controller: LeadController;
  let service: jest.Mocked<LeadService>;
  let cacheService: jest.Mocked<CacheService>;
  let paginationService: jest.Mocked<PaginationService>;
  let slaCalculationService: jest.Mocked<SlaCalculationService>;
  let performanceOptimizationService: jest.Mocked<PerformanceOptimizationService>;

  beforeEach(() => {
    service = {
      findOne: jest.fn(),
      changeStatus: jest.fn(),
      createComplianceLead: jest.fn(),
    } as any;
    
    cacheService = {
      invalidate: jest.fn(),
      invalidatePattern: jest.fn(),
    } as any;
    
    paginationService = {
      validatePaginationDto: jest.fn(),
      paginateLeads: jest.fn(),
      paginateLeadEvents: jest.fn(),
    } as any;
    
    slaCalculationService = {
      calculateSlaDeadline: jest.fn(),
      estimateEffort: jest.fn(),
      isAutoActionable: jest.fn(),
      isSlaApproaching: jest.fn(),
      isSlaBreached: jest.fn(),
    } as any;
    
    performanceOptimizationService = {
      invalidateLeadStats: jest.fn(),
      invalidateLeadCounts: jest.fn(),
    } as any;
    
    controller = new LeadController(
      service,
      cacheService,
      paginationService,
      slaCalculationService,
      performanceOptimizationService
    );
  });

  describe('createComplianceLead', () => {
    it('should create a compliance lead and return the response DTO', async () => {
      const dto: CreateComplianceLeadDto = {
        type: 'nis2_finding',
        severity: 'high',
        scanId: 'scan-123',
        category: 'network_security',
        title: 'Open Port Detected',
        description: 'Port 22 is open to the internet',
        recommendation: 'Close port 22 or restrict access',
        hasQuickFix: true,
        affectedSystems: ['server-01'],
        evidence: { port: 22, protocol: 'ssh' },
        companyName: 'Test Company',
        contactEmail: 'contact@test.com',
        contactPhone: '+4512345678'
      };
      
      const mockLead = {
        id: 'lead-123',
        status: 'NEW',
      };
      
      const mockSlaDeadline = new Date('2023-01-02T10:00:00Z');
      const mockAutoActionable = true;
      const mockEstimatedEffort = '15-30 minutes';
      
      (slaCalculationService.calculateSlaDeadline as jest.Mock).mockReturnValue(mockSlaDeadline);
      (slaCalculationService.isAutoActionable as jest.Mock).mockReturnValue(mockAutoActionable);
      (slaCalculationService.estimateEffort as jest.Mock).mockReturnValue(mockEstimatedEffort);
      (service.createComplianceLead as jest.Mock).mockResolvedValue(mockLead);
      
      const req: any = { tenantId: 'tenant-123' };
      
      const result = await controller.createComplianceLead(dto, req);
      
      expect(result).toEqual({
        leadId: 'lead-123',
        slaDeadline: mockSlaDeadline.toISOString(),
        autoActionable: mockAutoActionable,
        estimatedEffort: mockEstimatedEffort,
        status: 'new'
      });
      
      expect(slaCalculationService.calculateSlaDeadline).toHaveBeenCalledWith('high');
      expect(slaCalculationService.isAutoActionable).toHaveBeenCalledWith('high', true);
      expect(slaCalculationService.estimateEffort).toHaveBeenCalledWith('high', true);
      
      expect(service.createComplianceLead).toHaveBeenCalledWith({
        tenantId: 'tenant-123',
        source: 'compliance',
        payload: {
          brand: 'tekup',
          source: 'compliance',
          name: 'Test Company',
          email: 'contact@test.com',
          phone: '+4512345678',
          compliance_type: 'nis2_finding',
          severity: 'high',
          scan_id: 'scan-123',
          finding_category: 'network_security',
          title: 'Open Port Detected',
          description: 'Port 22 is open to the internet',
          recommendation: 'Close port 22 or restrict access',
          auto_actionable: true,
          sla_deadline: mockSlaDeadline.toISOString(),
          affected_systems: ['server-01'],
          evidence: { port: 22, protocol: 'ssh' },
          has_quick_fix: true
        },
        complianceType: 'nis2_finding',
        severity: 'high',
        scanId: 'scan-123',
        findingCategory: 'network_security',
        recommendation: 'Close port 22 or restrict access',
        autoActionable: true,
        slaDeadline: mockSlaDeadline,
        affectedSystems: ['server-01'],
        evidence: { port: 22, protocol: 'ssh' }
      });
      
      // Verify cache invalidation was called
      expect(performanceOptimizationService.invalidateLeadStats).toHaveBeenCalledWith('tenant-123');
      expect(performanceOptimizationService.invalidateLeadCounts).toHaveBeenCalledWith('tenant-123');
    });

    it('should throw BadRequestException when tenantId is missing', async () => {
      const dto: CreateComplianceLeadDto = {
        type: 'nis2_finding',
        severity: 'medium',
        scanId: 'scan-456',
        category: 'access_control',
        title: 'Weak Password Policy',
        description: 'Password policy allows weak passwords',
        recommendation: 'Enforce strong password policy',
        hasQuickFix: false
      };
      
      const req: any = {}; // No tenantId
      
      await expect(controller.createComplianceLead(dto, req)).rejects.toThrow('tenant missing');
    });
  });

  describe('markContacted', () => {
    it('should invalidate caches when changing lead status', async () => {
      const dto = { status: 'CONTACTED' as const };
      const req: any = { tenantId: 'tenant-123', id: 'request-123' };
      
      (service.changeStatus as jest.Mock).mockResolvedValue({ id: 'lead-123', status: 'CONTACTED' });
      (cacheService.invalidate as jest.Mock).mockResolvedValue(undefined);
      (performanceOptimizationService.invalidateLeadStats as jest.Mock).mockResolvedValue(undefined);
      (performanceOptimizationService.invalidateLeadCounts as jest.Mock).mockResolvedValue(undefined);
      
      const result = await controller.markContacted('lead-123', dto, req);
      
      expect(result).toEqual({ id: 'lead-123', status: 'CONTACTED' });
      expect(cacheService.invalidate).toHaveBeenCalledTimes(3);
      expect(performanceOptimizationService.invalidateLeadStats).toHaveBeenCalledWith('tenant-123');
      expect(performanceOptimizationService.invalidateLeadCounts).toHaveBeenCalledWith('tenant-123');
    });
  });
});