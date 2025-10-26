import { Test, TestingModule } from '@nestjs/testing';
import { GdprService } from '../gdpr.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('GdprService', () => {
  let service: GdprService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    customerConsent: {
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    dataRetentionPolicy: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    dataSubjectRequest: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    lead: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    tenantSetting: {
      findMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GdprService>(GdprService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordConsent', () => {
    it('should record customer consent successfully', async () => {
      const tenantId = 'test-tenant-id';
      const consent = {
        customerId: 'customer-123',
        consentType: 'marketing',
        consentGiven: true,
        legalBasis: 'consent',
        dataUsage: { purpose: 'marketing communications' },
      };

      mockPrismaService.customerConsent.create.mockResolvedValue({ id: 'consent-123' });
      mockConfigService.get.mockReturnValue('1.0.0');

      await service.recordConsent(tenantId, consent);

      expect(mockPrismaService.customerConsent.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          customerId: consent.customerId,
          consentType: consent.consentType,
          consentGiven: consent.consentGiven,
          consentDate: expect.any(Date),
          consentVersion: '1.0.0',
          legalBasis: consent.legalBasis,
          dataUsage: consent.dataUsage,
        },
      });
    });

    it('should handle consent recording errors', async () => {
      const tenantId = 'test-tenant-id';
      const consent = {
        customerId: 'customer-123',
        consentType: 'marketing',
        consentGiven: true,
        legalBasis: 'consent',
      };

      mockPrismaService.customerConsent.create.mockRejectedValue(new Error('Database error'));

      await expect(service.recordConsent(tenantId, consent)).rejects.toThrow('Database error');
    });
  });

  describe('withdrawConsent', () => {
    it('should withdraw customer consent successfully', async () => {
      const tenantId = 'test-tenant-id';
      const customerId = 'customer-123';
      const consentType = 'marketing';

      mockPrismaService.customerConsent.updateMany.mockResolvedValue({ count: 1 });

      await service.withdrawConsent(tenantId, customerId, consentType);

      expect(mockPrismaService.customerConsent.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          customerId,
          consentType,
          consentWithdrawn: null,
        },
        data: {
          consentWithdrawn: expect.any(Date),
        },
      });
    });
  });

  describe('processDataSubjectRequest', () => {
    it('should process access request successfully', async () => {
      const tenantId = 'test-tenant-id';
      const request = {
        customerId: 'customer-123',
        requestType: 'access' as const,
        notes: 'Customer wants to see their data',
      };

      const mockRequest = { id: 'request-123' };
      mockPrismaService.dataSubjectRequest.create.mockResolvedValue(mockRequest);
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.customerConsent.findMany.mockResolvedValue([]);
      mockPrismaService.tenantSetting.findMany.mockResolvedValue([]);
      mockPrismaService.dataSubjectRequest.update.mockResolvedValue({});

      const result = await service.processDataSubjectRequest(tenantId, request);

      expect(result).toBe('request-123');
      expect(mockPrismaService.dataSubjectRequest.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          customerId: request.customerId,
          requestType: request.requestType,
          status: 'processing',
          notes: request.notes,
        },
      });
    });

    it('should process erasure request successfully', async () => {
      const tenantId = 'test-tenant-id';
      const request = {
        customerId: 'customer-123',
        requestType: 'erasure' as const,
      };

      const mockRequest = { id: 'request-123' };
      mockPrismaService.dataSubjectRequest.create.mockResolvedValue(mockRequest);
      mockPrismaService.lead.findFirst.mockResolvedValue(null); // No regulatory data
      mockPrismaService.lead.updateMany.mockResolvedValue({});
      mockPrismaService.dataSubjectRequest.update.mockResolvedValue({});

      const result = await service.processDataSubjectRequest(tenantId, request);

      expect(result).toBe('request-123');
    });

    it('should reject erasure request with regulatory data', async () => {
      const tenantId = 'test-tenant-id';
      const request = {
        customerId: 'customer-123',
        requestType: 'erasure' as const,
      };

      const mockRequest = { id: 'request-123' };
      mockPrismaService.dataSubjectRequest.create.mockResolvedValue(mockRequest);
      mockPrismaService.lead.findFirst.mockResolvedValue({ 
        id: 'lead-123', 
        complianceType: 'NIS2_FINDING' 
      }); // Has regulatory data
      mockPrismaService.dataSubjectRequest.update.mockResolvedValue({});

      const result = await service.processDataSubjectRequest(tenantId, request);

      expect(result).toBe('request-123');
      // Should have rejected the erasure
      expect(mockPrismaService.dataSubjectRequest.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: {
          status: 'rejected',
          completedAt: expect.any(Date),
          notes: 'Erasure not legally permitted due to regulatory requirements',
        },
      });
    });
  });

  describe('getDataSubjectRequestStatus', () => {
    it('should return request status successfully', async () => {
      const tenantId = 'test-tenant-id';
      const requestId = 'request-123';

      const mockRequest = {
        id: requestId,
        status: 'completed',
        customerId: 'customer-123',
      };

      mockPrismaService.dataSubjectRequest.findFirst.mockResolvedValue(mockRequest);

      const result = await service.getDataSubjectRequestStatus(tenantId, requestId);

      expect(result).toEqual(mockRequest);
      expect(mockPrismaService.dataSubjectRequest.findFirst).toHaveBeenCalledWith({
        where: {
          id: requestId,
          tenantId,
        },
      });
    });

    it('should throw error for non-existent request', async () => {
      const tenantId = 'test-tenant-id';
      const requestId = 'request-123';

      mockPrismaService.dataSubjectRequest.findFirst.mockResolvedValue(null);

      await expect(service.getDataSubjectRequestStatus(tenantId, requestId))
        .rejects.toThrow('Data subject request not found');
    });
  });

  describe('getCustomerConsentStatus', () => {
    it('should return customer consent status successfully', async () => {
      const tenantId = 'test-tenant-id';
      const customerId = 'customer-123';

      const mockConsents = [
        { id: 'consent-1', consentType: 'marketing', consentGiven: true },
        { id: 'consent-2', consentType: 'data_processing', consentGiven: false },
      ];

      mockPrismaService.customerConsent.findMany.mockResolvedValue(mockConsents);

      const result = await service.getCustomerConsentStatus(tenantId, customerId);

      expect(result).toEqual(mockConsents);
      expect(mockPrismaService.customerConsent.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          customerId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('getDataRetentionPolicies', () => {
    it('should return data retention policies successfully', async () => {
      const tenantId = 'test-tenant-id';

      const mockPolicies = [
        { id: 'policy-1', dataType: 'leads', retentionPeriod: '7 years' },
        { id: 'policy-2', dataType: 'customer_data', retentionPeriod: '3 years' },
      ];

      mockPrismaService.dataRetentionPolicy.findMany.mockResolvedValue(mockPolicies);

      const result = await service.getDataRetentionPolicies(tenantId);

      expect(result).toEqual(mockPolicies);
      expect(mockPrismaService.dataRetentionPolicy.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { dataType: 'asc' },
      });
    });
  });

  describe('updateDataRetentionPolicy', () => {
    it('should update data retention policy successfully', async () => {
      const tenantId = 'test-tenant-id';
      const dataType = 'leads';
      const updates = { retentionPeriod: '5 years' };

      mockPrismaService.dataRetentionPolicy.updateMany.mockResolvedValue({ count: 1 });

      await service.updateDataRetentionPolicy(tenantId, dataType, updates);

      expect(mockPrismaService.dataRetentionPolicy.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          dataType,
        },
        data: {
          ...updates,
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('hasValidConsent', () => {
    it('should return true for valid consent', async () => {
      const tenantId = 'test-tenant-id';
      const customerId = 'customer-123';
      const consentType = 'marketing';

      const mockConsent = {
        id: 'consent-123',
        consentGiven: true,
        consentWithdrawn: null,
      };

      mockPrismaService.customerConsent.findFirst.mockResolvedValue(mockConsent);

      const result = await service.hasValidConsent(tenantId, customerId, consentType);

      expect(result).toBe(true);
    });

    it('should return false for withdrawn consent', async () => {
      const tenantId = 'test-tenant-id';
      const customerId = 'customer-123';
      const consentType = 'marketing';

      const mockConsent = {
        id: 'consent-123',
        consentGiven: true,
        consentWithdrawn: new Date(), // Consent was withdrawn
      };

      mockPrismaService.customerConsent.findFirst.mockResolvedValue(mockConsent);

      const result = await service.hasValidConsent(tenantId, customerId, consentType);

      expect(result).toBe(false);
    });

    it('should return false for no consent', async () => {
      const tenantId = 'test-tenant-id';
      const customerId = 'customer-123';
      const consentType = 'marketing';

      mockPrismaService.customerConsent.findFirst.mockResolvedValue(null);

      const result = await service.hasValidConsent(tenantId, customerId, consentType);

      expect(result).toBe(false);
    });
  });

  describe('getGdprComplianceSummary', () => {
    it('should return GDPR compliance summary successfully', async () => {
      const tenantId = 'test-tenant-id';

      mockPrismaService.customerConsent.count.mockResolvedValue(10);
      mockPrismaService.dataSubjectRequest.count.mockResolvedValue(5);
      mockPrismaService.dataRetentionPolicy.count.mockResolvedValue(3);

      const result = await service.getGdprComplianceSummary(tenantId);

      expect(result).toEqual({
        tenantId,
        consentRecords: 10,
        dataSubjectRequests: 5,
        retentionPolicies: 3,
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const tenantId = 'test-tenant-id';
      const customerId = 'customer-123';

      mockPrismaService.customerConsent.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getCustomerConsentStatus(tenantId, customerId))
        .rejects.toThrow('Database connection failed');
    });

    it('should handle missing configuration gracefully', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = service['getConsentVersion']();

      expect(result).toBe('1.0.0'); // Default value
    });
  });
});