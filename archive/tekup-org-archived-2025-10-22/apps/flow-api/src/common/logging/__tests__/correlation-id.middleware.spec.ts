import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware, RequestWithContext } from '../correlation-id.middleware.js';
import { StructuredLoggerService } from '../structured-logger.service.js';

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;
  let mockLogger: jest.Mocked<StructuredLoggerService>;
  let mockRequest: any;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(async () => {
    mockLogger = {
      runWithContext: jest.fn((context, fn) => fn()),
      generateCorrelationId: jest.fn(() => 'generated-correlation-id'),
    } as any;

    mockRequest = {
      headers: {},
      path: '/api/leads',
      query: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorrelationIdMiddleware,
        { provide: StructuredLoggerService, useValue: mockLogger },
      ],
    }).compile();

    middleware = module.get<CorrelationIdMiddleware>(CorrelationIdMiddleware);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('correlation ID handling', () => {
    it('should generate new correlation ID when none exists', () => {
      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.correlationId).toBe('generated-correlation-id');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', 'generated-correlation-id');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing correlation ID from x-correlation-id header', () => {
      const existingId = 'existing-correlation-id';
      mockRequest.headers!['x-correlation-id'] = existingId;

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.correlationId).toBe(existingId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingId);
      expect(mockLogger.generateCorrelationId).not.toHaveBeenCalled();
    });

    it('should use existing correlation ID from x-request-id header', () => {
      const existingId = 'existing-request-id';
      mockRequest.headers!['x-request-id'] = existingId;

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.correlationId).toBe(existingId);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', existingId);
    });

    it('should validate correlation ID format', () => {
      // Valid UUID
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest.headers!['x-correlation-id'] = validUuid;

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.correlationId).toBe(validUuid);

      // Invalid format should generate new ID
      mockRequest.headers!['x-correlation-id'] = 'invalid-format!@#';
      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.correlationId).toBe('generated-correlation-id');
    });

    it('should handle array header values', () => {
      mockRequest.headers!['x-correlation-id'] = ['first-id', 'second-id'] as any;

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.correlationId).toBe('generated-correlation-id');
      expect(mockLogger.generateCorrelationId).toHaveBeenCalled();
    });
  });

  describe('request ID generation', () => {
    it('should generate unique request ID', () => {
      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.requestId).toBeDefined();
      expect(mockRequest.requestId).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', mockRequest.requestId);
    });

    it('should generate different request IDs for different requests', () => {
      const request1 = { ...mockRequest } as RequestWithContext;
      const request2 = { ...mockRequest } as RequestWithContext;

      middleware.use(request1, mockResponse as Response, mockNext);
      middleware.use(request2, mockResponse as Response, mockNext);

      expect(request1.requestId).toBeDefined();
      expect(request2.requestId).toBeDefined();
      expect(request1.requestId).not.toBe(request2.requestId);
    });
  });

  describe('tenant ID extraction', () => {
    it('should extract tenant ID from API key header', () => {
      mockRequest.headers!['x-tenant-key'] = 'tenant-api-key';
      (mockRequest as any).tenantId = 'tenant123';

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant123',
        }),
        expect.any(Function)
      );
    });

    it('should extract tenant ID from URL path patterns', () => {
      const testCases = [
        { path: '/api/tenants/tenant456/leads', expected: 'tenant456' },
        { path: '/t/tenant789/dashboard', expected: 'tenant789' },
        { path: '/tenant/tenant101/settings', expected: 'tenant101' },
      ];

      testCases.forEach(({ path, expected }) => {
        mockRequest.path = path;

        middleware.use(
          mockRequest as RequestWithContext,
          mockResponse as Response,
          mockNext
        );

        expect(mockLogger.runWithContext).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: expected,
          }),
          expect.any(Function)
        );
      });
    });

    it('should extract tenant ID from query parameter', () => {
      mockRequest.query!.tenantId = 'tenant-from-query';

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-from-query',
        }),
        expect.any(Function)
      );
    });

    it('should handle missing tenant ID', () => {
      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: undefined,
        }),
        expect.any(Function)
      );
    });
  });

  describe('user ID extraction', () => {
    it('should extract user ID from user object', () => {
      (mockRequest as any).user = { id: 'user123' };

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
        }),
        expect.any(Function)
      );
    });

    it('should extract user ID from user.userId property', () => {
      (mockRequest as any).user = { userId: 'user456' };

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user456',
        }),
        expect.any(Function)
      );
    });

    it('should extract user ID from user.sub property', () => {
      (mockRequest as any).user = { sub: 'user789' };

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user789',
        }),
        expect.any(Function)
      );
    });

    it('should extract user ID from x-user-id header', () => {
      mockRequest.headers!['x-user-id'] = 'header-user-id';

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'header-user-id',
        }),
        expect.any(Function)
      );
    });

    it('should handle missing user ID', () => {
      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        }),
        expect.any(Function)
      );
    });
  });

  describe('context setup', () => {
    it('should set up complete logging context', () => {
      const correlationId = 'test-correlation-id';
      mockRequest.headers!['x-correlation-id'] = correlationId;
      mockRequest.headers!['x-tenant-key'] = 'tenant-key';
      mockRequest.headers!['x-user-id'] = 'user123';
      (mockRequest as any).tenantId = 'tenant456';
      mockRequest.path = '/api/leads';

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(mockLogger.runWithContext).toHaveBeenCalledWith(
        {
          correlationId,
          requestId: expect.stringMatching(/^req_[a-z0-9]+_[a-z0-9]+$/),
          tenantId: 'tenant456',
          userId: 'user123',
        },
        expect.any(Function)
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next function within context', () => {
      let contextDuringNext: any;

      mockLogger.runWithContext.mockImplementation((context, fn) => {
        contextDuringNext = context;
        return fn();
      });

      middleware.use(
        mockRequest as RequestWithContext,
        mockResponse as Response,
        mockNext
      );

      expect(contextDuringNext).toBeDefined();
      expect(contextDuringNext.correlationId).toBeDefined();
      expect(contextDuringNext.requestId).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('correlation ID validation', () => {
    it('should validate UUID format', () => {
      const validUuids = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      validUuids.forEach(uuid => {
        expect(middleware['isValidCorrelationId'](uuid)).toBe(true);
      });
    });

    it('should validate custom ID format', () => {
      const validCustomIds = [
        'custom-id-123',
        'req_12345_abcdef',
        'trace-abc123def456',
        '12345678',
      ];

      validCustomIds.forEach(id => {
        expect(middleware['isValidCorrelationId'](id)).toBe(true);
      });
    });

    it('should reject invalid formats', () => {
      const invalidIds = [
        'short',
        'invalid!@#$%',
        'too-long-id-that-exceeds-the-maximum-length-of-64-characters-and-should-be-rejected',
        '',
        '   ',
      ];

      invalidIds.forEach(id => {
        expect(middleware['isValidCorrelationId'](id)).toBe(false);
      });
    });
  });
});