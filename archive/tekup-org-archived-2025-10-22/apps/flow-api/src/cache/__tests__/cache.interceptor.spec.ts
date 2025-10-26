import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { CacheInterceptor } from '../cache.interceptor.js';
import { CacheService } from '../cache.service.js';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let cacheService: jest.Mocked<CacheService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
    };

    mockRequest = {
      method: 'GET',
      path: '/leads',
      query: { status: 'new', limit: '10' },
      tenantId: 'tenant-123',
      get: jest.fn(),
      id: 'req-123',
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    cacheService = module.get<CacheService>(CacheService) as jest.Mocked<CacheService>;
    interceptor = new CacheInterceptor(cacheService);
  });

  describe('intercept', () => {
    it('should return cached result when cache hit', async () => {
      const cachedData = { id: 1, name: 'cached' };
      cacheService.get.mockResolvedValue(cachedData);
      mockRequest.get.mockReturnValue('v1');

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const data = await result.toPromise();

      expect(data).toEqual(cachedData);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'req-123');
      expect(mockCallHandler.handle).not.toHaveBeenCalled();
    });

    it('should execute handler and cache result on cache miss', async () => {
      const handlerData = { id: 2, name: 'fresh' };
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of(handlerData));
      mockRequest.get.mockReturnValue('v1');

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const data = await result.toPromise();

      expect(data).toEqual(handlerData);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'req-123');
      expect(mockCallHandler.handle).toHaveBeenCalled();
      expect(cacheService.set).toHaveBeenCalled();
    });

    it('should skip caching for non-GET requests', async () => {
      mockRequest.method = 'POST';

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should skip caching when condition returns false', async () => {
      const interceptorWithCondition = new CacheInterceptor(cacheService, {
        condition: () => false,
      });

      const result = await interceptorWithCondition.intercept(mockExecutionContext, mockCallHandler);

      expect(cacheService.get).not.toHaveBeenCalled();
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should use custom key generator when provided', async () => {
      const customKey = 'custom-cache-key';
      const interceptorWithKeyGen = new CacheInterceptor(cacheService, {
        keyGenerator: () => customKey,
      });

      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({}));

      await interceptorWithKeyGen.intercept(mockExecutionContext, mockCallHandler);

      expect(cacheService.get).toHaveBeenCalledWith(customKey);
    });

    it('should use enhanced cache key generation with API version', async () => {
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({}));
      mockRequest.get.mockReturnValue('v2');

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      const expectedKey = 'v2:tenant-123:GET:/leads?limit=10&status=new';
      expect(cacheService.get).toHaveBeenCalledWith(expectedKey);
    });

    it('should handle cache service errors gracefully', async () => {
      cacheService.get.mockRejectedValue(new Error('Cache error'));
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const data = await result.toPromise();

      expect(data).toEqual({ data: 'test' });
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should handle cache set errors gracefully', async () => {
      cacheService.get.mockResolvedValue(null);
      cacheService.set.mockRejectedValue(new Error('Cache set error'));
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));

      const result = await interceptor.intercept(mockExecutionContext, mockCallHandler);
      const data = await result.toPromise();

      expect(data).toEqual({ data: 'test' });
      expect(mockCallHandler.handle).toHaveBeenCalled();
    });

    it('should set cache headers correctly', async () => {
      const cacheKey = 'tenant-123:/leads?limit=10&status=new';
      cacheService.get.mockResolvedValue({ cached: true });

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Cache-Key', cacheKey);
    });

    it('should handle requests without tenant ID', async () => {
      mockRequest.tenantId = undefined;
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({}));
      mockRequest.get.mockReturnValue('v1');

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      const expectedKey = 'v1:unknown:GET:/leads?limit=10&status=new';
      expect(cacheService.get).toHaveBeenCalledWith(expectedKey);
    });

    it('should handle requests without query parameters', async () => {
      mockRequest.query = {};
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({}));
      mockRequest.get.mockReturnValue('v1');

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      const expectedKey = 'v1:tenant-123:GET:/leads';
      expect(cacheService.get).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('performance metrics', () => {
    it('should track cache hits and misses correctly', async () => {
      // Test cache hit
      cacheService.get.mockResolvedValue({ data: 'hit' });
      mockRequest.get.mockReturnValue('v1');
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      // Test cache miss
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ data: 'miss' }));
      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      const metrics = interceptor.getPerformanceMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.hitRate).toBe(50);
      expect(metrics.totalRequests).toBe(2);
    });

    it('should track cache errors', async () => {
      cacheService.get.mockRejectedValue(new Error('Cache error'));
      mockCallHandler.handle.mockReturnValue(of({ data: 'test' }));
      mockRequest.get.mockReturnValue('v1');

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      const metrics = interceptor.getPerformanceMetrics();
      expect(metrics.cacheErrors).toBe(1);
    });
  });

  describe('cache strategy determination', () => {
    it('should use appropriate TTL for settings endpoints', async () => {
      mockRequest.path = '/settings';
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of({ setting: 'value' }));
      mockRequest.get.mockReturnValue('v1');

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          ttl: 900, // 15 minutes for settings
        })
      );
    });

    it('should add appropriate tags for different endpoints', async () => {
      mockRequest.path = '/leads';
      cacheService.get.mockResolvedValue(null);
      mockCallHandler.handle.mockReturnValue(of([{ id: '1' }]));
      mockRequest.get.mockReturnValue('v1');

      await interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(cacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          tags: ['tenant:tenant-123', 'leads'],
        })
      );
    });
  });
});