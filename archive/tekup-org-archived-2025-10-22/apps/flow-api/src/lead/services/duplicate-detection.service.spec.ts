import { DuplicateDetectionService } from './duplicate-detection.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MetricsService } from '../../metrics/metrics.service.js';
import { StructuredLogger } from '../../common/logging/structured-logger.service.js';
import { AsyncContextService } from '../../common/logging/async-context.service.js';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;
  let prisma: jest.Mocked<PrismaService>;
  let metrics: jest.Mocked<MetricsService>;
  let logger: jest.Mocked<StructuredLogger>;
  let contextService: jest.Mocked<AsyncContextService>;

  beforeEach(() => {
    prisma = {
      lead: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;
    
    metrics = {
      increment: jest.fn(),
      histogram: jest.fn(),
      gauge: jest.fn(),
      observe: jest.fn(),
    } as any;
    
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
      logBusinessEvent: jest.fn(),
    } as any;
    
    contextService = {
      toLogContext: jest.fn().mockReturnValue({}),
    } as any;
    
    service = new DuplicateDetectionService(prisma, metrics, logger, contextService);
  });

  describe('findDuplicate', () => {
    it('should return null when no identifying information is provided', async () => {
      const result = await service.findDuplicate('tenant1', {});
      expect(result).toBeNull();
    });

    it('should find duplicate by exact email match', async () => {
      const mockLead = { id: 'lead1', payload: { email: 'test@example.com' } };
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(mockLead);
      
      const result = await service.findDuplicate('tenant1', { email: 'test@example.com' });
      
      expect(result).toEqual(mockLead);
      expect(prisma.lead.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          createdAt: expect.any(Object),
          payload: { path: ['email'], equals: 'test@example.com' }
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(metrics.increment).toHaveBeenCalledWith('duplicate_detection_total', { strategy: 'email_exact', tenant: 'tenant1' });
    });

    it('should find duplicate by exact phone match when email is not found', async () => {
      // First call for email returns null, second call for phone returns a lead
      (prisma.lead.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'lead2', payload: { phone: '+4512345678' } });
      
      const result = await service.findDuplicate('tenant1', { phone: '12 34 56 78' });
      
      expect(result).toEqual({ id: 'lead2', payload: { phone: '+4512345678' } });
      expect(prisma.lead.findFirst).toHaveBeenCalledTimes(2);
      expect(metrics.increment).toHaveBeenCalledWith('duplicate_detection_total', { strategy: 'phone_exact', tenant: 'tenant1' });
    });

    it('should find duplicate by fuzzy name and address match', async () => {
      const mockLeads = [
        { id: 'lead3', payload: { name: 'John Doe', address: 'Gade 123', postal_code: '2100' } }
      ];
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lead.findMany as jest.Mock).mockResolvedValue(mockLeads);
      
      const result = await service.findDuplicate('tenant1', { 
        name: 'Jon Doe', 
        address: 'Gade 123', 
        postal_code: '2100' 
      });
      
      expect(result).toEqual(mockLeads[0]);
      expect(metrics.increment).toHaveBeenCalledWith('duplicate_detection_total', { strategy: 'name_address_fuzzy', tenant: 'tenant1' });
    });

    it('should find duplicate by fuzzy name and phone match', async () => {
      const mockLeads = [
        { id: 'lead4', payload: { name: 'Jane Smith', phone: '+4587654321' } }
      ];
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lead.findMany as jest.Mock).mockResolvedValueOnce([]).mockResolvedValueOnce(mockLeads);
      
      const result = await service.findDuplicate('tenant1', { 
        name: 'Jane Smith', 
        phone: '87654321' 
      });
      
      expect(result).toEqual(mockLeads[0]);
      expect(metrics.increment).toHaveBeenCalledWith('duplicate_detection_total', { strategy: 'name_phone_fuzzy', tenant: 'tenant1' });
    });

    it('should return null when no duplicates are found', async () => {
      (prisma.lead.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.lead.findMany as jest.Mock).mockResolvedValue([]);
      
      const result = await service.findDuplicate('tenant1', { 
        email: 'unique@example.com',
        name: 'Unique Person',
        address: 'Unique Address',
        postal_code: '1234'
      });
      
      expect(result).toBeNull();
      expect(metrics.increment).toHaveBeenCalledWith('duplicate_detection_total', { strategy: 'none_found', tenant: 'tenant1' });
    });

    it('should handle errors gracefully and return null', async () => {
      (prisma.lead.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      const result = await service.findDuplicate('tenant1', { email: 'test@example.com' });
      
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('mergeLeadPayloads', () => {
    it('should merge payloads preferring non-empty values from new payload', () => {
      const existingLead = {
        payload: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '',
          address: 'Old Address'
        }
      } as any;
      
      const newPayload = {
        name: '',
        email: 'john.doe@example.com',
        phone: '+4512345678',
        address: 'New Address',
        service_type: 'privat'
      };
      
      const merged = service.mergeLeadPayloads(existingLead, newPayload);
      
      expect(merged).toEqual({
        name: 'John Doe', // Kept from existing (new was empty)
        email: 'john.doe@example.com', // Taken from new (not empty)
        phone: '+4512345678', // Taken from new (existing was empty)
        address: 'New Address', // Taken from new (not empty)
        service_type: 'privat' // Taken from new (not in existing)
      });
    });
  });

  describe('normalize functions', () => {
    it('should normalize email to lowercase and trim', () => {
      expect(service['normalizeEmail']('  Test@Example.COM  ')).toBe('test@example.com');
      expect(service['normalizeEmail']('')).toBeUndefined();
      expect(service['normalizeEmail'](undefined)).toBeUndefined();
    });

    it('should normalize phone by removing non-digits and adding +45 prefix for Danish numbers', () => {
      expect(service['normalizePhone']('12 34 56 78')).toBe('+4512345678');
      expect(service['normalizePhone']('+45 12 34 56 78')).toBe('+4512345678');
      expect(service['normalizePhone']('(+45) 12 34 56 78')).toBe('+4512345678');
      expect(service['normalizePhone']('')).toBeUndefined();
    });

    it('should normalize name to lowercase, trim, and collapse whitespace', () => {
      expect(service['normalizeName']('  John   Doe  ')).toBe('john doe');
      expect(service['normalizeName']('')).toBeUndefined();
    });

    it('should normalize address to lowercase, trim, and collapse whitespace', () => {
      expect(service['normalizeAddress']('  Gade   123  ')).toBe('gade 123');
      expect(service['normalizeAddress']('')).toBeUndefined();
    });

    it('should normalize postal code to uppercase and remove whitespace', () => {
      expect(service['normalizePostalCode'](' 2100 ')).toBe('2100');
      expect(service['normalizePostalCode']('dk-2100')).toBe('DK-2100');
      expect(service['normalizePostalCode']('')).toBeUndefined();
    });
  });

  describe('calculateLevenshteinDistance', () => {
    it('should calculate Levenshtein distance correctly', () => {
      expect(service['calculateLevenshteinDistance']('kitten', 'sitting')).toBe(3);
      expect(service['calculateLevenshteinDistance']('john', 'jon')).toBe(1);
      expect(service['calculateLevenshteinDistance']('same', 'same')).toBe(0);
    });
  });
});