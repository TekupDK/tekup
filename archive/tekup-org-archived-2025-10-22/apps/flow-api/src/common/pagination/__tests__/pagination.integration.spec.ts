import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from '../pagination.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

describe('PaginationService Integration', () => {
  let service: PaginationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockLeadModel = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      lead: mockLeadModel,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginationService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
    prismaService = module.get(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Lead pagination integration', () => {
    it('should paginate leads with filters', async () => {
      const mockLeads = [
        { id: '1', tenantId: 'tenant1', status: 'new', createdAt: new Date() },
        { id: '2', tenantId: 'tenant1', status: 'new', createdAt: new Date() },
      ];

      mockLeadModel.count.mockResolvedValue(10);
      mockLeadModel.findMany.mockResolvedValue(mockLeads);

      const result = await service.paginate(mockLeadModel, {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        where: {
          tenantId: 'tenant1',
          status: 'new',
        },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });

      expect(result.data).toEqual(mockLeads);
      expect(result.pagination.total).toBe(10);
      expect(mockLeadModel.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          status: 'new',
        },
        include: {
          events: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle cursor pagination for large datasets', async () => {
      const mockLeads = [
        { id: '3', tenantId: 'tenant1', createdAt: new Date('2023-01-03') },
        { id: '2', tenantId: 'tenant1', createdAt: new Date('2023-01-02') },
      ];

      mockLeadModel.findMany.mockResolvedValue([...mockLeads, { id: '1' }]); // Extra item to indicate hasNext

      const result = await service.paginateWithCursor(mockLeadModel, {
        limit: 2,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        where: {
          tenantId: 'tenant1',
        },
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.nextCursor).toBeDefined();
    });

    it('should handle hybrid pagination switching between modes', async () => {
      const mockLeads = [
        { id: '1', tenantId: 'tenant1', createdAt: new Date() },
        { id: '2', tenantId: 'tenant1', createdAt: new Date() },
      ];

      // First call without cursor (offset mode)
      mockLeadModel.count.mockResolvedValue(25);
      mockLeadModel.findMany.mockResolvedValue(mockLeads);

      const offsetResult = await service.paginateHybrid(mockLeadModel, {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        where: { tenantId: 'tenant1' },
      });

      expect(offsetResult.data).toEqual(mockLeads);
      expect(offsetResult.pagination.hasNext).toBe(true);
      expect(offsetResult.totalCount).toBe(25);

      // Second call with cursor (cursor mode)
      const cursor = service['encodeCursor'](new Date());
      mockLeadModel.findMany.mockResolvedValue(mockLeads);

      const cursorResult = await service.paginateHybrid(mockLeadModel, {
        cursor,
        limit: 20,
        sortBy: 'createdAt',
        where: { tenantId: 'tenant1' },
      });

      expect(cursorResult.data).toEqual(mockLeads);
      expect(cursorResult.pagination.hasPrevious).toBe(true);
    });
  });

  describe('Performance considerations', () => {
    it('should execute count and findMany in parallel for offset pagination', async () => {
      const mockLeads = [{ id: '1' }];
      
      mockLeadModel.count.mockResolvedValue(1);
      mockLeadModel.findMany.mockResolvedValue(mockLeads);

      await service.paginate(mockLeadModel, {
        page: 1,
        limit: 20,
      });

      // Both should be called
      expect(mockLeadModel.count).toHaveBeenCalledTimes(1);
      expect(mockLeadModel.findMany).toHaveBeenCalledTimes(1);
    });

    it('should avoid count query for cursor pagination', async () => {
      const mockLeads = [{ id: '1' }];
      
      mockLeadModel.findMany.mockResolvedValue(mockLeads);

      await service.paginateWithCursor(mockLeadModel, {
        limit: 20,
        sortBy: 'id',
      });

      // Only findMany should be called, not count
      expect(mockLeadModel.count).not.toHaveBeenCalled();
      expect(mockLeadModel.findMany).toHaveBeenCalledTimes(1);
    });
  });
});