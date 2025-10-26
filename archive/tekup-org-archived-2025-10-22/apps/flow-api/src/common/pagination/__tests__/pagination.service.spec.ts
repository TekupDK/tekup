import { Test, TestingModule } from '@nestjs/testing';
import { PaginationService } from '../pagination.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

describe('PaginationService', () => {
  let service: PaginationService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockModel = {
    count: jest.fn(),
    findMany: jest.fn(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      lead: mockModel,
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('paginate', () => {
    it('should return paginated results with correct metadata', async () => {
      const mockData = [
        { id: '1', name: 'Lead 1' },
        { id: '2', name: 'Lead 2' },
      ];
      const totalCount = 25;

      mockModel.count.mockResolvedValue(totalCount);
      mockModel.findMany.mockResolvedValue(mockData);

      const result = await service.paginate(mockModel, {
        page: 2,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.data).toEqual(mockData);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrevious: true,
      });

      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: {},
        include: undefined,
        select: undefined,
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle first page correctly', async () => {
      mockModel.count.mockResolvedValue(15);
      mockModel.findMany.mockResolvedValue([]);

      const result = await service.paginate(mockModel, {
        page: 1,
        limit: 10,
      });

      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
    });

    it('should handle last page correctly', async () => {
      mockModel.count.mockResolvedValue(25);
      mockModel.findMany.mockResolvedValue([]);

      const result = await service.paginate(mockModel, {
        page: 3,
        limit: 10,
      });

      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrevious).toBe(true);
    });

    it('should use default values when not provided', async () => {
      mockModel.count.mockResolvedValue(0);
      mockModel.findMany.mockResolvedValue([]);

      const result = await service.paginate(mockModel, {});

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(mockModel.findMany).toHaveBeenCalledWith({
        where: {},
        include: undefined,
        select: undefined,
        skip: 0,
        take: 20,
        orderBy: { id: 'desc' },
      });
    });

    it('should enforce maximum limit', async () => {
      mockModel.count.mockResolvedValue(0);
      mockModel.findMany.mockResolvedValue([]);

      const result = await service.paginate(mockModel, {
        limit: 200, // Above max limit
      });

      expect(result.pagination.limit).toBe(100);
    });
  });

  describe('paginateWithCursor', () => {
    it('should return cursor-based paginated results', async () => {
      const mockData = [
        { id: '3', createdAt: new Date('2023-01-03') },
        { id: '2', createdAt: new Date('2023-01-02') },
        { id: '1', createdAt: new Date('2023-01-01') },
      ];

      mockModel.findMany.mockResolvedValue(mockData);

      const result = await service.paginateWithCursor(mockModel, {
        limit: 2,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrevious).toBe(false);
      expect(result.pagination.nextCursor).toBeDefined();
    });

    it('should handle cursor navigation', async () => {
      const cursor = Buffer.from('2023-01-02T00:00:00.000Z').toString('base64');
      const mockData = [
        { id: '1', createdAt: new Date('2023-01-01') },
      ];

      mockModel.findMany.mockResolvedValue(mockData);

      const result = await service.paginateWithCursor(mockModel, {
        cursor,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.pagination.hasPrevious).toBe(true);
      expect(result.pagination.previousCursor).toBeDefined();
    });
  });

  describe('validatePaginationParams', () => {
    it('should throw error for invalid page', () => {
      expect(() => {
        service.validatePaginationParams({ page: 0 });
      }).toThrow(BadRequestException);

      expect(() => {
        service.validatePaginationParams({ page: -1 });
      }).toThrow(BadRequestException);

      expect(() => {
        service.validatePaginationParams({ page: 1.5 });
      }).toThrow(BadRequestException);
    });

    it('should throw error for invalid limit', () => {
      expect(() => {
        service.validatePaginationParams({ limit: 0 });
      }).toThrow(BadRequestException);

      expect(() => {
        service.validatePaginationParams({ limit: 101 });
      }).toThrow(BadRequestException);

      expect(() => {
        service.validatePaginationParams({ limit: 1.5 });
      }).toThrow(BadRequestException);
    });

    it('should throw error for invalid sort order', () => {
      expect(() => {
        service.validatePaginationParams({ sortOrder: 'invalid' as any });
      }).toThrow(BadRequestException);
    });

    it('should pass validation for valid params', () => {
      expect(() => {
        service.validatePaginationParams({
          page: 1,
          limit: 20,
          sortOrder: 'asc',
        });
      }).not.toThrow();
    });
  });

  describe('cursor encoding/decoding', () => {
    it('should encode and decode string values', () => {
      const testValue = 'test-string';
      const encoded = service['encodeCursor'](testValue);
      const decoded = service['decodeCursor'](encoded);
      
      expect(decoded).toBe(testValue);
    });

    it('should encode and decode date values', () => {
      const testDate = new Date('2023-01-01T00:00:00.000Z');
      const encoded = service['encodeCursor'](testDate);
      const decoded = service['decodeCursor'](encoded);
      
      expect(decoded).toEqual(testDate);
    });

    it('should encode and decode numeric values', () => {
      const testNumber = 12345;
      const encoded = service['encodeCursor'](testNumber);
      const decoded = service['decodeCursor'](encoded);
      
      expect(decoded).toBe(testNumber);
    });

    it('should handle null and undefined values', () => {
      expect(service['encodeCursor'](null)).toBe('');
      expect(service['encodeCursor'](undefined)).toBe('');
    });

    it('should throw error for invalid cursor', () => {
      expect(() => {
        service['decodeCursor']('');
      }).toThrow(BadRequestException);
      
      expect(() => {
        service['decodeCursor']('   ');
      }).toThrow(BadRequestException);
    });
  });

  describe('buildOrderBy', () => {
    it('should build simple orderBy clause', () => {
      const orderBy = service['buildOrderBy']('name', 'asc');
      expect(orderBy).toEqual({ name: 'asc' });
    });

    it('should build nested orderBy clause', () => {
      const orderBy = service['buildOrderBy']('user.name', 'desc');
      expect(orderBy).toEqual({ user: { name: 'desc' } });
    });

    it('should use default values', () => {
      const orderBy = service['buildOrderBy']();
      expect(orderBy).toEqual({ id: 'desc' });
    });
  });

  describe('utility methods', () => {
    it('should return default options', () => {
      const defaults = service.getDefaultOptions();
      expect(defaults).toEqual({ page: 1, limit: 20 });
    });

    it('should return max limit', () => {
      const maxLimit = service.getMaxLimit();
      expect(maxLimit).toBe(100);
    });

    it('should create pagination metadata', () => {
      const meta = service.createPaginationMeta(2, 10, 25, 'next', 'prev');
      
      expect(meta).toEqual({
        currentPage: 2,
        itemsPerPage: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
        nextCursor: 'next',
        previousCursor: 'prev',
      });
    });
  });
});