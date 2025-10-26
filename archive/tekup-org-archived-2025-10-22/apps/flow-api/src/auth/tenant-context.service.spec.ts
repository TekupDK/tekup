import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from './tenant-context.service';
import { PrismaService } from '../prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};

describe('TenantContextService', () => {
  let service: TenantContextService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantContextService>(TenantContextService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setTenantContext', () => {
    it('should call prisma with parameterized query', async () => {
      const tenantId = 'test-tenant-id';
      mockPrismaService.$executeRaw.mockResolvedValue(1);

      await service.setTenantContext(tenantId);

      // Verify that $executeRaw was called (parameterized) rather than $executeRawUnsafe
      expect(prismaService.$executeRaw).toHaveBeenCalled();
      expect(prismaService.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('should reject invalid tenant IDs', async () => {
      const invalidTenantId = ''; // Empty string is invalid
      
      await expect(service.setTenantContext(invalidTenantId)).rejects.toThrow('Invalid tenant ID provided');
      
      // Ensure no database call was made
      expect(prismaService.$executeRaw).not.toHaveBeenCalled();
      expect(prismaService.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('should handle empty tenant ID', async () => {
      const emptyTenantId = '';
      
      await expect(service.setTenantContext(emptyTenantId)).rejects.toThrow('Invalid tenant ID provided');
      
      // Ensure no database call was made
      expect(prismaService.$executeRaw).not.toHaveBeenCalled();
      expect(prismaService.$executeRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('isValidTenantId', () => {
    it('should validate proper tenant ID', () => {
      const validTenantId = '123e4567-e89b-12d3-a456-426614174000';
      expect(service.isValidTenantId(validTenantId)).toBe(true);
    });

    it('should reject tenant ID that is too long', () => {
      const longTenantId = 'a'.repeat(37); // 37 characters, exceeds limit of 36
      expect(service.isValidTenantId(longTenantId)).toBe(false);
    });

    it('should reject empty tenant ID', () => {
      const emptyTenantId = '';
      expect(service.isValidTenantId(emptyTenantId)).toBe(false);
    });

    it('should accept tenant ID at maximum length', () => {
      const maxLenTenantId = 'a'.repeat(36); // 36 characters, at limit
      expect(service.isValidTenantId(maxLenTenantId)).toBe(true);
    });
  });
});