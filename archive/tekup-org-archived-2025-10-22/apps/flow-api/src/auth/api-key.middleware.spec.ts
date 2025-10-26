import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyMiddleware } from './api-key.middleware';
import { PrismaService } from '../prisma/prisma.service.js';
import { EnhancedApiKeyService } from './enhanced-api-key.service.js';
import { TenantContextService } from './tenant-context.service.js';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

// Mock services
const mockPrismaService = {
  $executeRaw: jest.fn(),
  $executeRawUnsafe: jest.fn(),
};

const mockEnhancedApiKeyService = {
  validateApiKey: jest.fn(),
  logUsage: jest.fn(),
};

const mockTenantContextService = {
  setTenantContext: jest.fn(),
};

describe('ApiKeyMiddleware', () => {
  let middleware: ApiKeyMiddleware;
  let tenantContextService: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyMiddleware,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EnhancedApiKeyService,
          useValue: mockEnhancedApiKeyService,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContextService,
        },
      ],
    }).compile();

    middleware = module.get<ApiKeyMiddleware>(ApiKeyMiddleware);
    tenantContextService = module.get<TenantContextService>(TenantContextService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        header: jest.fn(),
        get: jest.fn(),
        path: '/test',
        method: 'GET',
        query: {},
        body: {},
      };
      
      mockResponse = {
        setHeader: jest.fn(),
        on: jest.fn(),
        send: jest.fn(function(data) {
          return data;
        }),
      };
      
      nextFunction = jest.fn();
      
      // Mock the response event emitter
      (mockResponse.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'finish') {
          // Don't call callback immediately to avoid async issues in tests
        }
      });
    });

    it('should throw UnauthorizedException if no API key is provided', async () => {
      (mockRequest.header as jest.Mock).mockReturnValue(undefined);

      await expect(
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        )
      ).rejects.toThrow(UnauthorizedException);
      
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should validate API key and set tenant context using TenantContextService', async () => {
      const apiKey = 'test-api-key';
      const tenantId = 'test-tenant-id';
      
      (mockRequest.header as jest.Mock).mockReturnValue(apiKey);
      (mockRequest.get as jest.Mock).mockReturnValue('test-user-agent');
      
      mockEnhancedApiKeyService.validateApiKey.mockResolvedValue({
        valid: true,
        apiKey: {
          id: 'api-key-id',
          tenantId,
          scopes: [],
          permissions: [],
          environment: 'test',
        },
        shouldRotate: false,
      });

      mockTenantContextService.setTenantContext.mockResolvedValue(undefined);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Verify that TenantContextService.setTenantContext was called with the correct tenant ID
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(tenantId);
      
      // Verify that the unsafe method is not called
      expect(mockPrismaService.$executeRawUnsafe).not.toHaveBeenCalled();
      
      // Verify that next() was called
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should handle tenant context setting errors gracefully', async () => {
      const apiKey = 'test-api-key';
      const tenantId = 'test-tenant-id';
      
      (mockRequest.header as jest.Mock).mockReturnValue(apiKey);
      (mockRequest.get as jest.Mock).mockReturnValue('test-user-agent');
      
      mockEnhancedApiKeyService.validateApiKey.mockResolvedValue({
        valid: true,
        apiKey: {
          id: 'api-key-id',
          tenantId,
          scopes: [],
          permissions: [],
          environment: 'test',
        },
        shouldRotate: false,
      });

      // Simulate an error when setting tenant context
      mockTenantContextService.setTenantContext.mockRejectedValue(new Error('Database error'));

      // Should not throw an error but log a warning
      await expect(
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        )
      ).resolves.not.toThrow();

      // Verify that TenantContextService.setTenantContext was called
      expect(tenantContextService.setTenantContext).toHaveBeenCalledWith(tenantId);
      
      // Verify that next() was still called despite the error
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should set rotation headers when key should be rotated', async () => {
      const apiKey = 'test-api-key';
      
      (mockRequest.header as jest.Mock).mockReturnValue(apiKey);
      (mockRequest.get as jest.Mock).mockReturnValue('test-user-agent');
      
      mockEnhancedApiKeyService.validateApiKey.mockResolvedValue({
        valid: true,
        apiKey: {
          id: 'api-key-id',
          tenantId: 'test-tenant-id',
          scopes: [],
          permissions: [],
          environment: 'test',
        },
        shouldRotate: true, // Key should be rotated
      });

      mockTenantContextService.setTenantContext.mockResolvedValue(undefined);

      await middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Verify that rotation headers are set
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-API-Key-Rotation-Recommended',
        'true'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-API-Key-Rotation-Reason',
        'Key should be rotated for security'
      );
      
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});